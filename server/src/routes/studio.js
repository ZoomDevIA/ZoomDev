// ═══════════════════════════════════════════════════════════════════════════
// ROTAS DO ZOOMDEV STUDIO
//
// Tudo que o espaço de trabalho de duas janelas precisa do servidor:
//
//   POST /anexo                 arquivo entra, texto sai, nada fica gravado
//   POST /pre-leitura           o que o sistema entende enquanto se digita
//   PUT  /local                 consentimento e registro de território
//   GET  /:id/documento/gerar   o plano ZoomDev nascendo, por SSE
//   PUT  /:id/documento         salvamento automático do editor
//   POST /:id/conversa          o console falando com os agentes
//   PUT  /:id/metricas          números da fase de tração
//   PUT  /:id/mvp/arquivo       código editado no estúdio
//
// Toda rota confere dono do projeto antes de qualquer coisa: um id de projeto
// na URL não é autorização, é palpite de quem digitou.
// ═══════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import express from 'express';
import multer from 'multer';
import { store, save } from '../store.js';
import { config } from '../config.js';
import { structured } from '../agents/claude.js';
import { gerarPlanoZoomDev, ETAPAS } from '../agents/planoZoomDev.js';
import { montarDocumento } from '../services/documentoZoomDoc.js';
import { extrair, ehAudio, LIMITE_BYTES } from '../services/extracao.js';
import { modoTranscricao } from '../services/transcricao.js';
import { awardXP, FASES, FASE_LABEL, NIVEL_STARTUP, missoesValidacaoPadrao } from '../services/gamification.js';
import { limitar } from '../services/limite.js';
import { lerConteudo, gravarConteudo, arquivosMvp } from '../services/conteudo.js';
import { jaEmAndamento } from '../services/retomada.js';

export const studioRouter = Router();

// O documento do editor pode passar de um megabyte com imagens embutidas:
// o parser global do servidor é apertado demais para esta rota.
studioRouter.use(express.json({ limit: '12mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_BYTES, files: 1 },
});

// ── Guarda de projeto ──────────────────────────────────────────────────────
function meuProjeto(req, res) {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) {
    res.status(404).json({ error: 'Projeto não encontrado.' });
    return null;
  }
  return proj;
}

function cobrar(user, quanto, oQue) {
  if (quanto <= 0) return;
  if (user.creditos < quanto) {
    throw Object.assign(
      new Error(`Seiva insuficiente: ${oQue} custa ${quanto} 🌿 e você tem ${user.creditos}. Complete missões ou faça upgrade.`),
      { status: 402 },
    );
  }
  user.creditos -= quanto;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANEXOS
// ═══════════════════════════════════════════════════════════════════════════

studioRouter.post('/anexo',
  limitar({ max: 40, janelaSeg: 600, mensagem: 'Muitos anexos em pouco tempo. Aguarde alguns minutos.' }),
  upload.single('arquivo'),
  async (req, res, next) => {
    // Quanto foi REALMENTE debitado nesta requisição. O estorno devolve isto,
    // e só isto: antes ele devolvia o preço da transcrição em qualquer falha,
    // inclusive quando nada tinha sido cobrado, e um arquivo qualquer enviado
    // como áudio virava uma fábrica de seiva.
    let cobrado = 0;
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo recebido.' });

      // Mesma regra de quem roteia o arquivo (tipo declarado OU extensão):
      // senão um `.mp3` sem cabeçalho de áudio era transcrito de graça.
      const vaiTranscrever = ehAudio(req.file.originalname, req.file.mimetype)
        && modoTranscricao() === 'deepgram';
      if (vaiTranscrever && config.credits.transcricao > 0) {
        cobrar(req.user, config.credits.transcricao, 'a transcrição de áudio');
        cobrado = config.credits.transcricao;
        save();
      }

      const r = await extrair({
        nome: req.file.originalname,
        tipo: req.file.mimetype,
        buffer: req.file.buffer,
      });

      // A imagem volta em base64 para o cliente decidir o que fazer; o texto
      // é o que interessa para o resto do sistema. O binário morre aqui.
      res.json(r);
    } catch (e) {
      // Falhou depois de cobrar? Devolve. Falha da plataforma (5xx) e falha do
      // serviço de transcrição (401 da chave revogada, 402 sem crédito, 429,
      // 422 áudio ilegível) são todas nossas: o fundador não paga por nenhuma.
      if (cobrado > 0) {
        req.user.creditos += cobrado;
        save();
      }
      next(e);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// PRÉ-LEITURA — o que o sistema entende enquanto a pessoa digita
// ═══════════════════════════════════════════════════════════════════════════

const PRE_LEITURA_SCHEMA = {
  type: 'object',
  properties: {
    tituloSugerido: { type: 'string' },
    setor: { type: 'string' },
    publico: { type: 'string' },
    modelo: { type: 'string' },
    territorio: { type: 'string' },
    tipo: { type: 'string', enum: ['startup', 'biostartup'] },
    sinais: {
      type: 'array',
      items: {
        type: 'object',
        properties: { label: { type: 'string' }, cor: { type: 'string' } },
        required: ['label', 'cor'],
        additionalProperties: false,
      },
    },
  },
  required: ['tituloSugerido', 'setor', 'publico', 'modelo', 'territorio', 'tipo', 'sinais'],
  additionalProperties: false,
};

studioRouter.post('/pre-leitura',
  limitar({ max: 60, janelaSeg: 600, mensagem: 'Muitas leituras antecipadas. Aguarde.' }),
  async (req, res, next) => {
    try {
      const texto = String(req.body?.texto || '').trim();
      if (texto.length < 60) return res.json({ sinais: [] });
      if (!config.hasApiKey) return res.json({ sinais: [] });

      const r = await structured({
        system: 'Você lê uma ideia de negócio pela metade e extrai sinais estruturados. Sem prosa, sem conselho, sem julgamento. Se um campo não der para deduzir, devolva string vazia. pt-BR.',
        user: `Ideia em digitação:\n"""${texto.slice(0, 3000)}"""

Extraia: título curto para o projeto, setor, público-alvo, modelo de receita provável, território mencionado (cidade, estado ou região; vazio se não houver) e se é startup comum ou biostartup (bioeconomia, sociobiodiversidade, impacto socioambiental).
Em "sinais", devolva de 2 a 4 etiquetas curtas (máximo 3 palavras cada) com o que você já entendeu, cada uma com uma cor em hexadecimal desta paleta: #00e5ff (setor), #00ff64 (bio ou impacto), #ffc531 (modelo de receita), #a855f7 (público), #ff4d8d (território).`,
        schema: PRE_LEITURA_SCHEMA,
        effort: 'low',
        papel: 'extracao',
        maxTokens: 1500,
      });
      res.json(r);
    } catch {
      // Pré-leitura é aceleração: falhar aqui não pode atrapalhar quem escreve.
      res.json({ sinais: [] });
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// LOCALIZAÇÃO — consentimento explícito, guardado no perfil
// ═══════════════════════════════════════════════════════════════════════════

studioRouter.put('/local', (req, res) => {
  const { cidade, uf, pais, bioma, lat, lon, recusado } = req.body || {};

  if (recusado) {
    req.user.local = { recusado: true, em: new Date().toISOString() };
    save();
    return res.json({ local: req.user.local });
  }

  // Coordenada é guardada com uma casa decimal: dá para saber a região sem
  // guardar onde a pessoa mora. Precisão de rua não serve a nenhum plano.
  req.user.local = {
    cidade: String(cidade || '').slice(0, 80),
    uf: String(uf || '').slice(0, 2).toUpperCase(),
    pais: String(pais || 'Brasil').slice(0, 40),
    bioma: bioma ? String(bioma).slice(0, 40) : undefined,
    lat: Number.isFinite(Number(lat)) ? Math.round(Number(lat) * 10) / 10 : undefined,
    lon: Number.isFinite(Number(lon)) ? Math.round(Number(lon) * 10) / 10 : undefined,
    em: new Date().toISOString(),
  };
  save();
  res.json({ local: req.user.local });
});

// ═══════════════════════════════════════════════════════════════════════════
// GERAÇÃO DO PLANO — SSE
// ═══════════════════════════════════════════════════════════════════════════

studioRouter.get('/:id/documento/gerar', async (req, res) => {
  const proj = meuProjeto(req, res);
  if (!proj) return;

  // Recarregar a aba durante os três minutos da geração e clicar de novo
  // cobrava duas vezes e deixava duas execuções escrevendo no mesmo projeto.
  const andando = jaEmAndamento(proj, 'documento');
  if (andando) {
    return res.status(409).json({
      error: 'Este plano já está sendo gerado agora mesmo. Aguarde a conclusão nesta tela.',
      code: 'JA_EM_ANDAMENTO', desde: andando.desde,
    });
  }

  const custo = config.credits.planGeneration;
  if (req.user.creditos < custo) {
    return res.status(402).json({
      error: `Seiva insuficiente: o plano ZoomDev custa ${custo} 🌿 e você tem ${req.user.creditos}. Complete missões ou faça upgrade.`,
    });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const enviar = (evento, dados) => res.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`);

  // Cobra na entrada e estorna se falhar: o fundador não paga por erro nosso.
  req.user.creditos -= custo;
  proj.geracao = { status: 'executando', metodologia: 'zoomdev-1', iniciadaEm: new Date().toISOString() };
  save();

  enviar('inicio', { custo, etapas: ETAPAS });

  try {
    const { plano, planoClassico } = await gerarPlanoZoomDev(proj, {
      local: req.user.local?.recusado ? null : req.user.local,
      anexos: lerConteudo(proj.id).anexos || [],
      aoProgredir: (id, dados) => {
        enviar('etapa', { id, ...dados });
        const etapa = ETAPAS.find(e => e.id === id);
        if (dados.estado === 'ok' && etapa) {
          enviar('fala', {
            agenteId: id,
            agenteNome: etapa.agente,
            texto: `${etapa.label}: pronto.${dados.detalhe ? ` ${dados.detalhe}.` : ''}`,
          });
        }
      },
    });

    const html = montarDocumento(plano, proj);

    // O plano e o documento vão para o arquivo de conteúdo do projeto; o
    // índice fica só com o resumo clássico, que as listas e a ficha leem.
    gravarConteudo(proj.id, { planoZoomDev: plano, documento: html });
    proj.plano = planoClassico;
    proj.documentoEm = new Date().toISOString();
    proj.geracao = { status: 'concluida', metodologia: 'zoomdev-1', concluidaEm: proj.documentoEm };

    enviar('documento', { html });

    // O plano puxa a fase seguinte: a jornada não espera clique.
    let gamificacao = null;
    if (proj.fase === 'ideacao') {
      proj.fase = 'validacao';
      proj.fasesConcluidas = Array.from(new Set([...(proj.fasesConcluidas || []), 'ideacao']));
      proj.jornada = FASES.map(f => ({
        fase: f, label: FASE_LABEL[f], nivel: NIVEL_STARTUP[f],
        status: f === 'ideacao' ? 'concluida' : f === 'validacao' ? 'atual' : 'bloqueada',
      }));
      proj.missoes = missoesValidacaoPadrao(planoClassico)
        .map(m => ({ ...m, fase: 'validacao', concluida: false }));
      awardXP(req.user, 'plano_gerado', { projeto: proj.id });
      gamificacao = awardXP(req.user, 'fase_avancada', { de: 'ideacao', para: 'validacao' });
    }

    save();
    enviar('fim', { gamificacao, creditos: req.user.creditos });
  } catch (e) {
    req.user.creditos += custo;
    proj.geracao = { status: 'erro', erro: e.message };
    save();
    enviar('erro', { error: e.message, code: e.code, estornado: custo });
  } finally {
    res.end();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO — salvamento automático
// ═══════════════════════════════════════════════════════════════════════════

studioRouter.put('/:id/documento', (req, res) => {
  const proj = meuProjeto(req, res);
  if (!proj) return;

  const html = String(req.body?.html ?? '');
  if (html.length > 3_000_000) {
    return res.status(413).json({ error: 'O documento passou do tamanho máximo. Divida-o ou remova imagens embutidas.' });
  }
  gravarConteudo(proj.id, { documento: html });
  proj.documentoEm = new Date().toISOString();
  save();
  res.json({ salvoEm: proj.documentoEm });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSA DO CONSOLE
//
// A caixa da esquerda não é um chat separado: o que se pede lá muda o que
// aparece na direita. Por isso o agente pode devolver substituições exatas no
// documento em vez de só texto.
//
// Substituição em vez de reescrita inteira não é economia de token à toa: é o
// que impede o agente de refazer trinta páginas para trocar uma frase e, no
// caminho, apagar tudo que o fundador escreveu à mão.
// ═══════════════════════════════════════════════════════════════════════════

const CONVERSA_SCHEMA = {
  type: 'object',
  properties: {
    resposta: { type: 'string' },
    acao: { type: 'string', enum: ['responder', 'editar'] },
    substituicoes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { procurar: { type: 'string' }, trocarPor: { type: 'string' } },
        required: ['procurar', 'trocarPor'],
        additionalProperties: false,
      },
    },
    acrescentar: { type: 'string' },
  },
  required: ['resposta', 'acao', 'substituicoes', 'acrescentar'],
  additionalProperties: false,
};

studioRouter.post('/:id/conversa',
  limitar({ max: 60, janelaSeg: 600, mensagem: 'Muitas mensagens seguidas. Respire e tente de novo em alguns minutos.' }),
  async (req, res, next) => {
    const proj = meuProjeto(req, res);
    if (!proj) return;

    try {
      if (!config.hasApiKey) {
        return res.status(503).json({ error: 'O console precisa da chave da IA configurada no servidor.' });
      }

      const { texto = '', anexos = [], preLeitura = null, fase = proj.fase, documento } = req.body || {};
      const pedido = String(texto).trim();
      if (!pedido && !anexos.length) return res.status(400).json({ error: 'Escreva alguma coisa ou anexe um arquivo.' });

      const podeEditar = fase === 'ideacao' && typeof documento === 'string' && documento.length > 40;
      const custo = podeEditar ? config.credits.documentoRevisao : config.credits.studioTurno;
      cobrar(req.user, custo, podeEditar ? 'uma revisão do documento' : 'uma rodada no console');
      save();

      // Anexo enviado agora entra no contexto e fica guardado no projeto: o
      // fundador não deve precisar reenviar o mesmo edital toda semana.
      const novos = anexos.filter(a => a?.extraido || a?.texto).map(a => ({
        nome: a.nome, tipo: a.tipo, texto: String(a.extraido || a.texto).slice(0, 40_000),
        em: new Date().toISOString(),
      }));
      const conteudo = lerConteudo(proj.id);
      if (novos.length) {
        gravarConteudo(proj.id, { anexos: [...(conteudo.anexos || []), ...novos].slice(-12) });
      }

      const r = await structured({
        system: sistemaConsole(proj, fase, req.user),
        user: promptConsole({ pedido, documento, podeEditar, anexos: novos, preLeitura }),
        schema: CONVERSA_SCHEMA,
        effort: podeEditar ? 'high' : 'medium',
        maxTokens: 12000,
        papel: 'codigo',
      });

      let novoDocumento = null;
      if (podeEditar && r.acao === 'editar') {
        novoDocumento = aplicarEdicoes(documento, r);
        if (novoDocumento !== documento) {
          gravarConteudo(proj.id, { documento: novoDocumento });
          proj.documentoEm = new Date().toISOString();
        } else {
          novoDocumento = null;   // nada casou: não vale sobrescrever à toa
        }
      }

      const fala = {
        agenteId: 'maia',
        agenteNome: 'Maiá',
        cor: '#00e5ff',
        texto: r.resposta,
        selo: novoDocumento ? 'documento atualizado' : undefined,
      };

      // A trilha fica gravada no projeto: recarregar a página não pode apagar
      // o que foi combinado com os agentes. Últimas 60 entradas, porque o
      // valor está na conversa recente e o resto só engorda o banco.
      gravarConteudo(proj.id, {
        trilha: [
          ...(lerConteudo(proj.id).trilha || []),
          { id: `u${Date.now()}`, papel: 'usuario', texto: pedido, em: new Date().toISOString(),
            anexos: novos.map(a => ({ nome: a.nome, tipo: a.tipo })) },
          { id: `a${Date.now()}`, papel: 'agente', em: new Date().toISOString(), ...fala },
        ].slice(-60),
      });

      save();
      res.json({
        falas: [fala],
        documento: novoDocumento,
        recarregar: novos.length > 0,
        creditos: req.user.creditos,
      });
    } catch (e) { next(e); }
  });

function sistemaConsole(proj, fase, user) {
  const onde = user.local && !user.local.recusado
    ? [user.local.cidade, user.local.uf].filter(Boolean).join('/')
    : '';
  return `Você é Maiá, a agente que acompanha o fundador dentro do ZoomDev Studio.

PROJETO: ${proj.nome} (${proj.classificacao === 'biostartup' ? 'BioStartup' : 'Startup'}${proj.vertical ? `, ${proj.vertical}` : ''})
IDEIA: ${proj.descricao}
FASE ATUAL: ${FASE_LABEL[fase] || fase}
${onde ? `TERRITÓRIO: ${onde}` : ''}

Como você fala: pt-BR, direto, sem bajulação e sem encher linguiça. Você conhece o negócio dele, então responda com o que é específico deste projeto. Quando discordar, diga por quê. Quando não souber, diga que não sabe em vez de inventar número, fonte ou nome de empresa.
Nunca invente CNPJ, valor de contrato, código de processo administrativo ou nome de parceiro.`;
}

function promptConsole({ pedido, documento, podeEditar, anexos, preLeitura }) {
  const partes = [`PEDIDO DO FUNDADOR:\n${pedido || '(sem texto, veja os anexos)'}`];

  if (anexos.length) {
    partes.push('\nANEXOS ENVIADOS AGORA:');
    for (const a of anexos) partes.push(`--- ${a.nome} ---\n${a.texto.slice(0, 20_000)}`);
  }

  if (preLeitura?.setor) {
    partes.push(`\nLEITURA ANTECIPADA: setor ${preLeitura.setor}; público ${preLeitura.publico}; modelo ${preLeitura.modelo}.`);
  }

  if (podeEditar) {
    partes.push(`
DOCUMENTO ABERTO NO EDITOR (HTML):
"""
${documento.slice(0, 60_000)}
"""

Se o pedido for para MUDAR o documento, devolva acao "editar" e liste em "substituicoes" trechos EXATOS do HTML acima em "procurar" e o HTML novo em "trocarPor". O trecho procurado precisa aparecer no documento tal e qual, incluindo as tags; copie-o de lá, não o reescreva de memória. Prefira várias substituições pequenas a uma gigante.
Para acrescentar seções no fim, use "acrescentar" com HTML novo.
Use as mesmas tags do documento: <h1>, <h2>, <p>, <ul><li><p>, <table class="zd-tabela"><tbody><tr><th><p>, e os blocos <div data-bloco="indicador" data-valor data-rotulo data-nota data-cor>, <div data-bloco="selo" data-nivel data-texto data-fonte>, <div data-bloco="citacao" data-texto data-fonte data-url>.
Se o pedido for uma pergunta ou um comentário, devolva acao "responder", substituicoes vazio e acrescentar vazio.
Em "resposta", diga em uma ou duas frases o que você fez ou o que pensa. Não repita o documento na resposta.`);
  } else {
    partes.push('\nDevolva acao "responder", com substituicoes vazio e acrescentar vazio. Responda ao pedido de forma útil e específica.');
  }

  return partes.join('\n');
}

function aplicarEdicoes(html, r) {
  let saida = html;
  for (const s of r.substituicoes || []) {
    if (!s.procurar || !saida.includes(s.procurar)) continue;
    // replace com string literal troca só a primeira ocorrência, que é o
    // comportamento desejado: o agente aponta um trecho, não um padrão.
    saida = saida.replace(s.procurar, s.trocarPor);
  }
  if (r.acrescentar?.trim()) saida += `\n${r.acrescentar.trim()}`;
  return saida;
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICAS DA FASE DE TRAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

const CAMPOS_METRICA = ['receitaMensal', 'clientes', 'cac', 'churnMensal', 'caixa', 'queimaMensal'];

studioRouter.put('/:id/metricas', (req, res) => {
  const proj = meuProjeto(req, res);
  if (!proj) return;

  const limpo = {};
  for (const campo of CAMPOS_METRICA) {
    const v = req.body?.[campo];
    if (v === '' || v == null) { limpo[campo] = ''; continue; }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: `Valor inválido em ${campo}: use um número maior ou igual a zero.` });
    }
    limpo[campo] = n;
  }

  proj.metricas = { ...limpo, atualizadoEm: new Date().toISOString() };
  save();
  res.json({ metricas: proj.metricas });
});

// ═══════════════════════════════════════════════════════════════════════════
// ARQUIVO DO MVP EDITADO NO ESTÚDIO
// ═══════════════════════════════════════════════════════════════════════════

studioRouter.put('/:id/mvp/arquivo', (req, res) => {
  const proj = meuProjeto(req, res);
  if (!proj) return;

  const { arquivo, conteudo } = req.body || {};
  const arquivos = arquivosMvp(proj.id);
  if (!arquivos.length) return res.status(409).json({ error: 'Este projeto ainda não tem MVP construído.' });

  const alvo = arquivos.find(a => a.arquivo === arquivo);
  if (!alvo) return res.status(404).json({ error: `Arquivo ${arquivo} não existe neste MVP.` });
  if (typeof conteudo !== 'string') return res.status(400).json({ error: 'Conteúdo inválido.' });
  if (conteudo.length > 800_000) return res.status(413).json({ error: 'Arquivo grande demais.' });

  gravarConteudo(proj.id, {
    mvpArquivos: arquivos.map(a => (a.arquivo === arquivo ? { ...a, conteudo } : a)),
  });
  proj.mvp.editadoEm = new Date().toISOString();
  save();
  res.json({ arquivo, bytes: Buffer.byteLength(conteudo, 'utf8'), salvoEm: proj.mvp.editadoEm });
});
