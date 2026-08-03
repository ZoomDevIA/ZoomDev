// Rotas de projetos: ideação → classificação → geração do plano (SSE) → jornada encadeada.
import { Router } from 'express';
import { store, save, id } from '../store.js';
import { config } from '../config.js';
import { classificarIdeia, tituloDeIdeia } from '../agents/classifier.js';
import { gerarPlano, AGENTES } from '../agents/planoDeNegocios.js';
import { awardXP, FASES, FASE_LABEL, NIVEL_STARTUP, missoesValidacaoPadrao } from '../services/gamification.js';
import { planoParaDocx } from '../services/exportDocx.js';
import { planoParaPdf } from '../services/exportPdf.js';
import { paginaHtml } from '../services/exportHtml.js';
import { construirMvp, PECAS, ETAPA_DESIGN } from '../agents/mvpBuilder.js';
import { publicar, projetarProjeto } from '../services/vitrine.js';
import { exigir } from '../auth.js';
import JSZip from 'jszip';

export const projectsRouter = Router();

function meusProjetos(userId) {
  return Object.values(store.projects).filter(p => p.userId === userId);
}

projectsRouter.get('/', (req, res) => {
  res.json(meusProjetos(req.user.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));
});

projectsRouter.get('/:id', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  res.json(proj);
});

// Ideação: recebe a descrição + tipo (startup | biostartup | auto)
projectsRouter.post('/ideacao', async (req, res, next) => {
  try {
    const { descricao, tipo = 'auto', nome, modulos = {} } = req.body || {};
    if (!descricao || String(descricao).trim().length < 20) {
      return res.status(400).json({ error: 'Descreva sua ideia com pelo menos 20 caracteres.' });
    }

    // Os seletores da home mandam mais que o tipo: ligar BioStartups é uma
    // escolha explícita do fundador e dispensa o classificador.
    const modulosAtivos = { carbono: Boolean(modulos.carbono), bio: Boolean(modulos.bio) };
    const tipoEfetivo = modulosAtivos.bio ? 'biostartup' : tipo;

    // O classificador também é quem batiza o projeto. Se o fundador escolheu o
    // tipo mas não deu nome, ainda vale chamá-lo: só a sugestão de nome é
    // aproveitada, a classificação continua sendo a escolha dele.
    const tipoExplicito = tipoEfetivo === 'startup' || tipoEfetivo === 'biostartup';
    const r = (!tipoExplicito || !nome) ? await classificarIdeia(String(descricao)) : null;

    let classificacao, classificadorInfo;
    if (tipoExplicito) {
      classificacao = tipoEfetivo;
      classificadorInfo = {
        origem: 'usuario',
        justificativa: modulosAtivos.bio
          ? 'Módulo BioStartups ligado na home pelo fundador.'
          : 'Selecionado manualmente pelo fundador.',
        nomeSugerido: r?.nomeSugerido || '',
        vertical: r?.vertical,
      };
    } else {
      classificacao = r.classificacao;
      classificadorInfo = r;
    }

    const projId = id('prj');
    const projeto = {
      id: projId,
      userId: req.user.id,
      nome: (nome || classificadorInfo?.nomeSugerido || tituloDeIdeia(descricao)).slice(0, 80),
      descricao: String(descricao).trim(),
      classificacao,
      vertical: classificadorInfo?.vertical || (classificacao === 'biostartup' ? 'Bioeconomia' : 'Outra'),
      classificador: classificadorInfo,
      modulos: modulosAtivos,
      publicado: false,
      curtidas: [],
      fase: 'ideacao',
      fasesConcluidas: [],
      jornada: FASES.map(f => ({ fase: f, label: FASE_LABEL[f], nivel: NIVEL_STARTUP[f], status: f === 'ideacao' ? 'atual' : 'bloqueada' })),
      missoes: [],
      plano: null,
      geracao: { status: 'nao_iniciada', agentes: {} },
      criadoEm: new Date().toISOString(),
    };
    store.projects[projId] = projeto;

    const gam = awardXP(req.user, 'ideia_estruturada', { projeto: projId });
    save();
    res.json({ projeto, gamificacao: gam });
  } catch (e) { next(e); }
});

// Geração do plano pelos 5 agentes: SSE com progresso por agente.
//
// Rota de compatibilidade. A interface gera o plano pelo Studio
// (GET /api/studio/:id/documento/gerar), que roda a metodologia ZoomDev de
// quatorze seções com pesquisa na internet e devolve o documento do ZoomDoc.
// Esta continua no ar para integrações que já a chamavam.
projectsRouter.get('/:id/gerar-plano', async (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });

  const custo = config.credits.planGeneration;
  if (req.user.creditos < custo) {
    return res.status(402).json({ error: `Seiva insuficiente: a geração custa ${custo} 🌿. Complete missões ou faça upgrade.` });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  // Cobrança com estorno automático se a geração falhar no QA (diferencial anti-Base44/Lovable)
  req.user.creditos -= custo;
  proj.geracao = { status: 'executando', iniciadaEm: new Date().toISOString(), agentes: {} };
  save();
  send('inicio', { custo, agentes: AGENTES.map(a => ({ id: a.id, nome: a.nome, emoji: a.emoji, papel: a.papel })) });

  try {
    const { plano, missoesValidacao } = await gerarPlano(proj, (agenteId, status) => {
      proj.geracao.agentes[agenteId] = status;
      send('agente', { agente: agenteId, status });
    });

    proj.plano = plano;
    proj.geracao.status = 'concluida';
    proj.geracao.concluidaEm = new Date().toISOString();

    // ENCADEAMENTO: o plano puxa a próxima fase automaticamente
    proj.fase = 'validacao';
    proj.fasesConcluidas = ['ideacao'];
    proj.jornada = proj.jornada.map(j => ({
      ...j,
      status: j.fase === 'ideacao' ? 'concluida' : j.fase === 'validacao' ? 'atual' : 'bloqueada',
    }));
    proj.missoes = (missoesValidacao?.length ? missoesValidacao : missoesValidacaoPadrao(plano))
      .map(m => ({ ...m, fase: 'validacao', concluida: false }));

    const gamPlano = awardXP(req.user, 'plano_gerado', { projeto: proj.id });
    const gamFase = awardXP(req.user, 'fase_avancada', { de: 'ideacao', para: 'validacao' });
    save();

    send('concluido', {
      projeto: proj,
      creditosRestantes: req.user.creditos,
      gamificacao: [gamPlano, gamFase],
      proximaFase: { fase: 'validacao', label: 'Validação', missoes: proj.missoes },
    });
  } catch (e) {
    // ESTORNO: falha da IA não queima seiva do usuário
    req.user.creditos += custo;
    proj.geracao.status = 'erro';
    proj.geracao.erro = e.message;
    save();
    send('erro', { error: e.message, code: e.code || 'ERRO', estornado: true, creditosRestantes: req.user.creditos });
  } finally {
    res.end();
  }
});

// ── Vitrine da comunidade ──────────────────────────────────────────────────
// Publicar é do dono do projeto e exige a capacidade comunidade.publicar.
projectsRouter.post('/:id/publicar', exigir('comunidade.publicar'), (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!proj.plano && req.body?.publicado !== false) {
    return res.status(409).json({ error: 'Gere o plano de negócios antes de publicar na comunidade.' });
  }
  publicar(proj, req.body?.publicado !== false);
  res.json({
    publicado: proj.publicado,
    publicadoEm: proj.publicadoEm,
    vitrine: proj.publicado ? projetarProjeto(proj, req.user) : null,
  });
});

// Curtida de um projeto da vitrine (um voto por pessoa, alterna)
projectsRouter.post('/:id/curtir', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj?.publicado) return res.status(404).json({ error: 'Projeto não encontrado na vitrine.' });
  proj.curtidas = proj.curtidas || [];
  const idx = proj.curtidas.indexOf(req.user.id);
  if (idx >= 0) proj.curtidas.splice(idx, 1); else proj.curtidas.push(req.user.id);
  save();
  res.json({ curtidas: proj.curtidas.length, curtido: idx < 0 });
});

// Ligar/desligar os módulos de um projeto já criado
projectsRouter.post('/:id/modulos', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  const { carbono, bio } = req.body || {};
  proj.modulos = {
    carbono: carbono === undefined ? Boolean(proj.modulos?.carbono) : Boolean(carbono),
    bio: bio === undefined ? Boolean(proj.modulos?.bio) : Boolean(bio),
  };
  save();
  res.json({ modulos: proj.modulos });
});

// Conclusão de missão (gamificação de validação)
projectsRouter.post('/:id/missoes/:missaoId/concluir', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  const missao = proj.missoes.find(m => m.id === req.params.missaoId);
  if (!missao) return res.status(404).json({ error: 'Missão não encontrada.' });
  if (missao.concluida) return res.status(409).json({ error: 'Missão já concluída.' });

  missao.concluida = true;
  missao.concluidaEm = new Date().toISOString();
  req.user.creditos += config.credits.missionReward;
  const gam = awardXP(req.user, 'missao_concluida', { projeto: proj.id, missao: missao.id });

  // Todas as principais concluídas → desbloqueia avanço para MVP
  const principais = proj.missoes.filter(m => m.tipo === 'principal');
  const prontoParaMvp = principais.length > 0 && principais.every(m => m.concluida);

  save();
  res.json({ projeto: proj, gamificacao: gam, seivaGanha: config.credits.missionReward, prontoParaMvp });
});

// Avançar fase manualmente (quando missões principais estiverem concluídas)
projectsRouter.post('/:id/avancar-fase', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  const idx = FASES.indexOf(proj.fase);
  if (idx < 0 || idx >= FASES.length - 1) return res.status(409).json({ error: 'Não há próxima fase.' });

  const principais = proj.missoes.filter(m => m.fase === proj.fase && m.tipo === 'principal');
  if (principais.length && !principais.every(m => m.concluida)) {
    return res.status(409).json({ error: 'Conclua as missões principais desta fase antes de avançar.' });
  }

  proj.fasesConcluidas.push(proj.fase);
  proj.fase = FASES[idx + 1];
  proj.jornada = proj.jornada.map(j => ({
    ...j,
    status: proj.fasesConcluidas.includes(j.fase) ? 'concluida' : j.fase === proj.fase ? 'atual' : 'bloqueada',
  }));
  const gam = awardXP(req.user, 'fase_avancada', { para: proj.fase });
  save();
  res.json({ projeto: proj, gamificacao: gam });
});

// Downloads do plano
projectsRouter.get('/:id/plano.docx', async (req, res, next) => {
  try {
    const proj = store.projects[req.params.id];
    if (!proj?.plano || proj.userId !== req.user.id) return res.status(404).json({ error: 'Plano não encontrado.' });
    const buf = await planoParaDocx(proj);
    awardXP(req.user, 'plano_baixado', { formato: 'docx' });
    save();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="plano-${proj.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.docx"`);
    res.send(buf);
  } catch (e) { next(e); }
});

projectsRouter.get('/:id/plano.pdf', async (req, res, next) => {
  try {
    const proj = store.projects[req.params.id];
    if (!proj?.plano || proj.userId !== req.user.id) return res.status(404).json({ error: 'Plano não encontrado.' });
    const pdf = await planoParaPdf(proj);
    if (!pdf) {
      // Sem Chromium no ambiente: entrega HTML imprimível (Ctrl+P → PDF)
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(paginaHtml(proj));
    }
    awardXP(req.user, 'plano_baixado', { formato: 'pdf' });
    save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="plano-${proj.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf"`);
    res.send(Buffer.from(pdf));
  } catch (e) { next(e); }
});

projectsRouter.get('/:id/plano.html', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj?.plano || proj.userId !== req.user.id) return res.status(404).json({ error: 'Plano não encontrado.' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(paginaHtml(proj));
});

// ═══════════════════════════════════════════════════════════════════════════
// MVP BUILDER, do plano ao produto navegável (SSE, preview e ZIP)
// ═══════════════════════════════════════════════════════════════════════════
projectsRouter.get('/:id/mvp/construir', async (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!proj.plano) return res.status(409).json({ error: 'Gere o plano de negócios antes de construir o MVP.' });

  const custo = config.credits.mvpBuild;
  if (req.user.creditos < custo) {
    return res.status(402).json({ error: `Seiva insuficiente: construir o MVP custa ${custo} 🌿.` });
  }

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  req.user.creditos -= custo;
  proj.mvp = { status: 'construindo', iniciadoEm: new Date().toISOString(), pecas: {} };
  save();
  // A direção de UX/UI aparece como primeira etapa: o fundador precisa ver
  // que existe uma decisão de design antes do código, e não só arquivos saindo.
  send('inicio', { custo, pecas: [ETAPA_DESIGN, ...PECAS] });

  try {
    const { arquivos, modo, design } = await construirMvp(proj, (pecaId, status, arquivo) => {
      proj.mvp.pecas[pecaId] = { status, arquivo };
      send('peca', { peca: pecaId, status, arquivo });
    });

    proj.mvp = {
      status: 'pronto', modo, design,
      construidoEm: new Date().toISOString(),
      arquivos,
      pecas: proj.mvp.pecas,
    };
    const gam = awardXP(req.user, 'mvp_construido', { projeto: proj.id });
    save();
    send('concluido', {
      arquivos: arquivos.map(a => ({ arquivo: a.arquivo, bytes: Buffer.byteLength(a.conteudo, 'utf8') })),
      modo, creditosRestantes: req.user.creditos, gamificacao: gam,
    });
  } catch (e) {
    // Estorno: falha na construção não queima seiva
    req.user.creditos += custo;
    proj.mvp = { status: 'erro', erro: e.message };
    save();
    send('erro', { error: e.message, estornado: true, creditosRestantes: req.user.creditos });
  } finally {
    res.end();
  }
});

// Preview: serve cada arquivo do MVP com o content-type certo
projectsRouter.get('/:id/mvp/preview/:arquivo', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj?.mvp?.arquivos || proj.userId !== req.user.id) return res.status(404).json({ error: 'MVP não encontrado.' });
  const arq = proj.mvp.arquivos.find(a => a.arquivo === req.params.arquivo);
  if (!arq) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  const tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.md': 'text/markdown' };
  const ext = arq.arquivo.slice(arq.arquivo.lastIndexOf('.'));
  res.setHeader('Content-Type', `${tipos[ext] || 'text/plain'}; charset=utf-8`);
  res.send(arq.conteudo);
});

projectsRouter.get('/:id/mvp', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!proj.mvp) return res.json({ status: 'nao_iniciado' });
  res.json({
    status: proj.mvp.status, modo: proj.mvp.modo, construidoEm: proj.mvp.construidoEm,
    design: proj.mvp.design || null,
    arquivos: (proj.mvp.arquivos || []).map(a => ({ arquivo: a.arquivo, bytes: Buffer.byteLength(a.conteudo, 'utf8'), conteudo: a.conteudo })),
  });
});

// Download do MVP completo em ZIP
projectsRouter.get('/:id/mvp.zip', async (req, res, next) => {
  try {
    const proj = store.projects[req.params.id];
    if (!proj?.mvp?.arquivos || proj.userId !== req.user.id) return res.status(404).json({ error: 'MVP não encontrado.' });
    const zip = new JSZip();
    for (const a of proj.mvp.arquivos) zip.file(a.arquivo, a.conteudo);
    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const slug = proj.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mvp';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-mvp.zip"`);
    res.send(buf);
  } catch (e) { next(e); }
});
