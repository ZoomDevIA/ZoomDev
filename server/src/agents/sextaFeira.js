// ═══════════════════════════════════════════════════════════════════════════
// SEXTA-FEIRA: motor da super-agente orquestradora do ecossistema ZoomDev OS.
// - Visão total: snapshot em tempo real de usuários, projetos, radar e fomento
// - Chat com o administrador (com acesso à internet quando há API key)
// - Relatórios executivos diagramados do ecossistema
// - Autoaperfeiçoamento GOVERNADO do próprio PIC: propõe → admin aprova →
//   versiona (semver) → rollback disponível. Nunca muda sozinha.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { config } from '../config.js';
import { structured, conversar, conversarComInternet } from './claude.js';
import { PIC_SEXTA_FEIRA_BASE, renderSystemPromptSextaFeira } from '../protocols/picSextaFeira.js';
import { radarProjeto, aderenciaHeuristica, diasParaPrazo } from '../services/unicornio.js';
import { estatisticasBus } from '../services/agentBus.js';
import { EDITAIS_SEED } from '../data/seeds.js';
import { FASE_LABEL } from '../services/gamification.js';

// ── PIC: ciclo de vida versionado ────────────────────────────────────────────

export function initPic() {
  // Migração governada: se a versão base do código evoluiu, versiona sem apagar histórico
  if (store.pic && !store.pic.versoes.some(v => v.versao === PIC_SEXTA_FEIRA_BASE.versao)) {
    const anterior = store.pic.versaoAtual;
    store.pic.versoes.push({
      versao: PIC_SEXTA_FEIRA_BASE.versao,
      criadoEm: new Date().toISOString(),
      origem: 'migracao',
      notas: `Migração de v${anterior} para v${PIC_SEXTA_FEIRA_BASE.versao}: visão holística 360° e doutrinas do Corpus Regenerativo.`,
      conteudo: PIC_SEXTA_FEIRA_BASE.conteudo,
    });
    store.pic.versaoAtual = PIC_SEXTA_FEIRA_BASE.versao;
    save();
  }
  if (!store.pic) {
    store.pic = {
      versaoAtual: PIC_SEXTA_FEIRA_BASE.versao,
      versoes: [{
        versao: PIC_SEXTA_FEIRA_BASE.versao,
        criadoEm: PIC_SEXTA_FEIRA_BASE.criadoEm,
        origem: 'base',
        notas: 'Versão fundadora do Protocolo de Instância Cognitiva.',
        conteudo: PIC_SEXTA_FEIRA_BASE.conteudo,
      }],
      propostas: [],
    };
    save();
  }
  return store.pic;
}

export function picAtual() {
  const pic = initPic();
  return pic.versoes.find(v => v.versao === pic.versaoAtual) || pic.versoes[pic.versoes.length - 1];
}

function bumpMinor(versao) {
  const [maj, min] = versao.split('.').map(Number);
  return `${maj}.${min + 1}.0`;
}

// ── Snapshot do ecossistema (fonte de verdade da Sexta-Feira) ────────────────

// ═══════════════════════════════════════════════════════════════════════════
// ÍNDICE DO ECOSSISTEMA — o número do reator.
//
// Quatro subíndices, cada um medindo uma etapa da esteira, e uma média
// ponderada por cima. Existe porque um painel com oito números soltos não
// responde a pergunta que o administrador faz primeiro: "está indo bem?".
//
// A regra que sustenta a honestidade do medidor: subíndice sem base para
// medir devolve `null`, não zero. Zero por cento de missões concluídas quando
// não existe missão nenhuma é uma afirmação falsa, e o painel inteiro perde
// crédito na primeira vez que alguém repara.
// ═══════════════════════════════════════════════════════════════════════════
function razao(parte, todo) {
  if (!todo) return null;
  return Math.round((parte / todo) * 100);
}

export function indiceEcossistema(s) {
  const cruzamentosFortes = s.editais.cruzamentos.filter(c => c.score >= 60).length;

  const partes = [
    {
      id: 'estrutura',
      label: 'Estrutura',
      descricao: 'projetos que já viraram plano de negócios',
      valor: razao(s.projetos.comPlano, s.projetos.total),
      peso: 3,
    },
    {
      id: 'execucao',
      label: 'Execução',
      descricao: 'missões concluídas sobre as abertas',
      valor: razao(s.projetos.missoes.concluidas, s.projetos.missoes.total),
      peso: 3,
    },
    {
      id: 'captacao',
      label: 'Captação',
      descricao: 'cruzamentos edital × projeto com aderência de 60 ou mais',
      valor: razao(cruzamentosFortes, s.editais.cruzamentos.length),
      peso: 2,
    },
    {
      id: 'adesao',
      label: 'Adesão',
      descricao: 'nudges aceitos sobre enviados',
      valor: s.bus.taxaAceite ?? null,
      peso: 2,
    },
  ];

  const medidas = partes.filter(p => p.valor !== null);
  const pesoTotal = medidas.reduce((t, p) => t + p.peso, 0);
  const geral = pesoTotal
    ? Math.round(medidas.reduce((t, p) => t + p.valor * p.peso, 0) / pesoTotal)
    : null;

  return { geral, partes, medidos: medidas.length, de: partes.length };
}

export function snapshotEcossistema() {
  const usuarios = Object.values(store.users);
  const projetos = Object.values(store.projects);
  const pedidos = Object.values(store.carbonOrders);
  const hoje = new Date().toISOString().slice(0, 10);

  const porFase = {};
  const porClassificacao = { startup: 0, biostartup: 0 };
  let missoesTotal = 0, missoesFeitas = 0;
  for (const p of projetos) {
    porFase[p.fase] = (porFase[p.fase] || 0) + 1;
    if (porClassificacao[p.classificacao] !== undefined) porClassificacao[p.classificacao] += 1;
    // Projeto sem lista de missões derrubava o painel inteiro com 500. Um
    // registro incompleto, vindo de uma versão antiga ou de uma gravação pela
    // metade, não pode apagar a visão do ecossistema: aqui ele conta como zero
    // e o resto continua legível.
    const missoes = Array.isArray(p.missoes) ? p.missoes : [];
    missoesTotal += missoes.length;
    missoesFeitas += missoes.filter(m => m.concluida).length;
  }

  const radar = projetos
    .map(p => radarProjeto(p, store.users[p.userId]))
    .sort((a, b) => b.score - a.score);

  // Matriz editais × projetos (editais abertos, projetos mais recentes)
  const editaisAbertos = EDITAIS_SEED
    .map(e => ({ ...e, dias: diasParaPrazo(e) }))
    .filter(e => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias);
  const colunas = [...projetos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 8);
  const matriz = editaisAbertos.map(e => ({
    editalId: e.id, edital: e.nome, orgao: e.orgao, valor: e.valor, dias: e.dias,
    celulas: colunas.map(p => ({ projetoId: p.id, projeto: p.nome, score: aderenciaHeuristica(e, p) })),
  }));
  const cruzamentos = matriz
    .flatMap(l => l.celulas.map(c => ({ edital: l.edital, dias: l.dias, valor: l.valor, projeto: c.projeto, projetoId: c.projetoId, score: c.score })))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const base = {
    geradoEm: new Date().toISOString(),
    usuarios: {
      total: usuarios.length,
      ativosHoje: usuarios.filter(u => u.gamification?.streak?.ultimoDia === hoje).length,
      xpTotal: usuarios.reduce((s, u) => s + (u.gamification?.xp || 0), 0),
      seivaCirculante: usuarios.reduce((s, u) => s + (u.creditos || 0), 0),
    },
    projetos: {
      total: projetos.length,
      comPlano: projetos.filter(p => p.plano).length,
      porFase, porClassificacao,
      missoes: { total: missoesTotal, concluidas: missoesFeitas },
    },
    radar: {
      ranking: radar,
      unicornios: radar.filter(r => r.score >= 80).length,
      altoPotencial: radar.filter(r => r.score >= 60 && r.score < 80).length,
    },
    editais: { abertos: editaisAbertos.length, matriz, cruzamentos, colunas: colunas.map(p => ({ id: p.id, nome: p.nome })) },
    carbono: {
      pedidos: pedidos.length,
      toneladas: Math.round(pedidos.reduce((s, o) => s + (o.toneladas || 0), 0) * 100) / 100,
      valorTotal: Math.round(pedidos.reduce((s, o) => s + (o.valorTotal || 0), 0) * 100) / 100,
    },
    bus: estatisticasBus(),
    pic: { versao: initPic().versaoAtual, propostasPendentes: initPic().propostas.filter(p => p.status === 'pendente').length },
  };

  // O índice é derivado do resto, então é calculado depois e vai junto: assim
  // o painel não precisa refazer a conta e nunca mostra número diferente do
  // que a Sexta-Feira usa para raciocinar.
  return { ...base, indice: indiceEcossistema(base) };
}

/** Versão textual compacta do snapshot: injetada no system prompt. */
export function snapshotTexto(s = snapshotEcossistema()) {
  const fases = Object.entries(s.projetos.porFase).map(([f, n]) => `${FASE_LABEL[f] || f}: ${n}`).join(', ') || 'nenhum';
  const top = s.radar.ranking.slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.nome}: ${r.score}/100 (${r.tier.label}) [${r.dimensoes.map(d => `${d.label} ${d.pontos}/${d.max}`).join(', ')}]`)
    .join('\n');
  const cruz = s.editais.cruzamentos.slice(0, 5)
    .map(c => `- ${c.projeto} × ${c.edital}: ${c.score}/100 (prazo em ${c.dias} dias, ${c.valor})`)
    .join('\n');
  return `Usuários: ${s.usuarios.total} (${s.usuarios.ativosHoje} ativos hoje) · XP total ${s.usuarios.xpTotal} · seiva em circulação ${s.usuarios.seivaCirculante}
Projetos: ${s.projetos.total} (${s.projetos.porClassificacao.biostartup} biostartups, ${s.projetos.porClassificacao.startup} startups) · ${s.projetos.comPlano} com plano · fases → ${fases}
Missões: ${s.projetos.missoes.concluidas}/${s.projetos.missoes.total} concluídas
Radar Unicórnio: ${s.radar.unicornios} unicórnio(s) em formação, ${s.radar.altoPotencial} de alto potencial. Top:
${top || '(sem projetos ainda)'}
Editais abertos: ${s.editais.abertos}. Melhores cruzamentos editais × projetos:
${cruz || '(sem cruzamentos)'}
Carbono: ${s.carbono.pedidos} pedido(s), ${s.carbono.toneladas} tCO2e, R$ ${s.carbono.valorTotal}
Agent Bus: ${s.bus.enviados} nudges enviados, ${s.bus.aceitos} aceitos${s.bus.taxaAceite !== null ? ` (taxa ${s.bus.taxaAceite}%)` : ''}
PIC: v${s.pic.versao}, ${s.pic.propostasPendentes} proposta(s) pendente(s)`;
}

// ── Chat com o administrador ─────────────────────────────────────────────────

function respostaDemo(pergunta, s) {
  const q = pergunta.toLowerCase();
  const top = s.radar.ranking[0];

  if (q.includes('unic') || q.includes('radar') || q.includes('potencial')) {
    if (!s.radar.ranking.length) return 'Ainda não há projetos no ecossistema para ranquear. Assim que o primeiro fundador estruturar uma ideia, meu Radar Unicórnio entra em ação com score explicável em 5 dimensões.';
    const linhas = s.radar.ranking.slice(0, 5).map((r, i) =>
      `${i + 1}. **${r.nome}**: ${r.score}/100 ${r.tier.emoji} ${r.tier.label}\n   ${r.dimensoes.map(d => `${d.label} ${d.pontos}/${d.max}`).join(' · ')}`).join('\n');
    return `**Radar Unicórnio**, ${s.radar.unicornios} unicórnio(s) em formação e ${s.radar.altoPotencial} de alto potencial entre ${s.projetos.total} projeto(s):\n\n${linhas}\n\n${top && top.score >= 60 ? `Recomendo acionar o Investidor IA para **${top.nome}**: projetos nesse patamar devem preparar captação antes de precisar dela.` : 'Nenhum projeto passou de 60 ainda: o gargalo é execução de missões de validação. Já despachei nudges pelo Agent Bus.'}`;
  }
  if (q.includes('edita') || q.includes('fomento') || q.includes('finep') || q.includes('matriz')) {
    const cruz = s.editais.cruzamentos.slice(0, 5).map(c => `- **${c.projeto}** × ${c.edital}: ${c.score}/100 · prazo em ${c.dias} dias · ${c.valor}`).join('\n');
    return `**Matriz editais × projetos**, ${s.editais.abertos} editais abertos monitorados:\n\n${cruz || 'Sem projetos para cruzar ainda.'}\n\nRegra que aplico: aderência ≥ 70 com prazo ≤ 60 dias gera nudge automático do Editais IA para o fundador. Nenhuma janela de fomento passa despercebida.`;
  }
  if (q.includes('carbono') || q.includes('carbon') || q.includes('esg')) {
    return `**CarbonPay**: ${s.carbono.pedidos} pedido(s) de compensação somando ${s.carbono.toneladas} tCO2e (R$ ${s.carbono.valorTotal}). ${s.carbono.pedidos ? 'O ciclo calcular→compensar está funcionando.' : 'Ainda sem compensações: o Carbono AI está nutrindo os fundadores via nudges para calcular o passivo primeiro.'} Lembrete de conformidade: comunicamos sempre "emissões compensadas com créditos verificados", nunca "carbono neutro" genérico (ISO 14068-1/CONAR).`;
  }
  if (q.includes('nudge') || q.includes('bus') || q.includes('agente')) {
    return `**Agent Bus**: ${s.bus.enviados} nudges enviados, ${s.bus.aceitos} aceitos${s.bus.taxaAceite !== null ? `: taxa de aceite ${s.bus.taxaAceite}% (meta ≥ 35%)` : ''}, ${s.bus.dispensados} dispensados. Os 25 agentes operam em 5 camadas (estratégica, execução, crescimento, bio-amazônica e fomento), cada um com seu PIC próprio, e eu decido quem fala com quem: máximo de 2 nudges/dia por fundador para nunca virar ruído.`;
  }
  if (q.includes('relat')) {
    return `Posso gerar agora um **relatório executivo diagramado** do ecossistema (botão "Gerar relatório" aqui no dashboard). Ele consolida: números-chave, Radar Unicórnio com decomposição, matriz editais × projetos, carbono e desempenho do Agent Bus, pronto para board ou investidor.`;
  }
  if (q.includes('pic') || q.includes('protocolo') || q.includes('evolu')) {
    return `Meu PIC está na versão **v${s.pic.versao}** com ${s.pic.propostasPendentes} proposta(s) pendente(s). Meu ciclo de evolução é governado: eu observo o ecossistema${config.hasApiKey ? ' e pesquiso a internet em tempo real' : ''}, diagnostico a maior lacuna, proponho a mudança exata, e só você aprova. Cada versão fica no histórico com rollback em um clique.`;
  }
  return `**Visão geral do ecossistema agora**: ${s.usuarios.total} usuário(s) (${s.usuarios.ativosHoje} ativos hoje), ${s.projetos.total} projeto(s), ${s.projetos.porClassificacao.biostartup} biostartup(s), sendo ${s.projetos.comPlano} com plano gerado. Missões: ${s.projetos.missoes.concluidas}/${s.projetos.missoes.total}. Radar: ${s.radar.unicornios} unicórnio(s) em formação${top ? ` (líder: ${top.nome}, ${top.score}/100)` : ''}. ${s.editais.abertos} editais abertos na matriz de fomento. Pergunte sobre: **unicórnios**, **editais**, **carbono**, **nudges**, **relatório** ou **PIC**.${config.hasApiKey ? '' : '\n\n_Modo demo: com a ANTHROPIC_API_KEY configurada, respondo com raciocínio completo e pesquisa na internet em tempo real._'}`;
}

/**
 * Chat da Sexta-Feira com o administrador.
 * Com API key: conversa com web search (internet em tempo real) e fallback
 * gracioso para conversa sem internet. Sem key: respostas determinísticas
 * calculadas do snapshot real.
 */
export async function chatAdmin(mensagens) {
  const historico = mensagens.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 6000),
  }));
  const s = snapshotEcossistema();

  if (!config.hasApiKey) {
    return { resposta: respostaDemo(historico[historico.length - 1].content, s), buscas: 0, modo: 'demo' };
  }

  const system = renderSystemPromptSextaFeira(picAtual().conteudo, snapshotTexto(s));
  try {
    const { texto, buscas } = await conversarComInternet({ system, messages: historico, effort: 'high', maxTokens: 8000, papel: 'pesquisa' });
    return { resposta: texto, buscas, modo: 'ia+internet' };
  } catch (e) {
    if (e.code === 'REFUSAL') throw e;
    try {
      const texto = await conversar({ system, messages: historico, effort: 'high', maxTokens: 6000, papel: 'chat' });
      return { resposta: texto, buscas: 0, modo: 'ia' };
    } catch {
      return { resposta: respostaDemo(historico[historico.length - 1].content, s), buscas: 0, modo: 'demo' };
    }
  }
}

// ── Relatório executivo do ecossistema ───────────────────────────────────────

function recomendacoesDemo(s) {
  const rec = [];
  const semPlano = s.projetos.total - s.projetos.comPlano;
  if (semPlano > 0) rec.push(`Ativação: ${semPlano} projeto(s) sem plano de negócios, o CEO AI está nutrindo via Agent Bus; considere campanha de seiva bônus para primeira geração.`);
  if (s.projetos.missoes.total > 0 && s.projetos.missoes.concluidas / s.projetos.missoes.total < 0.5) {
    rec.push(`Validação é o gargalo: apenas ${s.projetos.missoes.concluidas}/${s.projetos.missoes.total} missões concluídas. Recomendo destacar XP das missões no dashboard do fundador.`);
  }
  const urgente = s.editais.cruzamentos.find(c => c.score >= 70 && c.dias <= 60);
  if (urgente) rec.push(`Fomento urgente: ${urgente.projeto} × ${urgente.edital} (${urgente.score}/100) fecha em ${urgente.dias} dias, priorizar submissão.`);
  if (s.radar.unicornios > 0) rec.push(`${s.radar.unicornios} projeto(s) em patamar de unicórnio: acionar Investidor IA para preparação de captação e tese de internacionalização.`);
  if (s.carbono.pedidos === 0) rec.push('CarbonPay sem compensações ainda: reforçar o ciclo calcular→compensar nos nudges do Carbono AI.');
  if (s.bus.taxaAceite !== null && s.bus.taxaAceite < 35) rec.push(`Taxa de aceite de nudges em ${s.bus.taxaAceite}% (meta ≥ 35%): refinar segmentação e reduzir frequência.`);
  if (!rec.length) rec.push('Ecossistema saudável nos indicadores atuais. Próxima fronteira: crescimento da base de fundadores e primeiro case de captação.');
  return rec;
}

export async function gerarRelatorio() {
  const s = snapshotEcossistema();
  let resumo, recomendacoes;

  if (config.hasApiKey) {
    try {
      const r = await structured({
        system: renderSystemPromptSextaFeira(picAtual().conteudo, snapshotTexto(s)),
        user: 'Escreva o resumo executivo (5-8 frases, denso em dados) e 4-6 recomendações acionáveis para o administrador, com base no snapshot do ecossistema acima.',
        schema: {
          type: 'object',
          properties: { resumoExecutivo: { type: 'string' }, recomendacoes: { type: 'array', items: { type: 'string' } } },
          required: ['resumoExecutivo', 'recomendacoes'],
          additionalProperties: false,
        },
        effort: 'medium', maxTokens: 4000,
        papel: 'chat',
      });
      resumo = r.resumoExecutivo;
      recomendacoes = r.recomendacoes;
    } catch { /* cai no demo abaixo */ }
  }
  if (!resumo) {
    const top = s.radar.ranking[0];
    resumo = `O ecossistema ZoomDev conta com ${s.usuarios.total} usuário(s) e ${s.projetos.total} projeto(s): ${s.projetos.porClassificacao.biostartup} biostartup(s) e ${s.projetos.porClassificacao.startup} startup(s): dos quais ${s.projetos.comPlano} já possuem plano de negócios gerado pelos 5 agentes. A execução registra ${s.projetos.missoes.concluidas} de ${s.projetos.missoes.total} missões de validação concluídas. O Radar Unicórnio aponta ${s.radar.unicornios} projeto(s) em formação de unicórnio e ${s.radar.altoPotencial} de alto potencial${top ? `, liderados por ${top.nome} com ${top.score}/100` : ''}. A matriz de fomento monitora ${s.editais.abertos} editais abertos${s.editais.cruzamentos[0] ? `, com melhor cruzamento em ${s.editais.cruzamentos[0].projeto} × ${s.editais.cruzamentos[0].edital} (${s.editais.cruzamentos[0].score}/100)` : ''}. No CarbonPay, ${s.carbono.pedidos} pedido(s) somam ${s.carbono.toneladas} tCO2e compensadas com créditos verificados. O Agent Bus despachou ${s.bus.enviados} nudges preditivos${s.bus.taxaAceite !== null ? ` com taxa de aceite de ${s.bus.taxaAceite}%` : ''}.`;
    recomendacoes = recomendacoesDemo(s);
  }

  const relId = id('rel');
  const relatorio = {
    id: relId,
    geradoEm: s.geradoEm,
    picVersao: initPic().versaoAtual,
    resumo,
    recomendacoes,
    snapshot: s,
  };
  store.reports[relId] = relatorio;
  save();
  return relatorio;
}

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Relatório executivo em HTML diagramado (identidade visual ZoomDev). */
export function relatorioHtml(rel) {
  const s = rel.snapshot;
  const corScore = (v) => v >= 80 ? '#00ff64' : v >= 60 ? '#00c8ff' : v >= 40 ? '#ffd700' : '#ffffff55';
  const statCard = (valor, label) => `<div class="stat"><div class="v">${esc(valor)}</div><div class="l">${esc(label)}</div></div>`;

  const radarLinhas = s.radar.ranking.slice(0, 10).map((r, i) => `
    <tr>
      <td>${i + 1}</td><td><b>${esc(r.nome)}</b><br><span class="dim">${r.classificacao === 'biostartup' ? '🌿 BioStartup' : '🚀 Startup'} · ${esc(FASE_LABEL[r.fase] || r.fase)}</span></td>
      <td>${r.dimensoes.map(d => `<span class="chip">${esc(d.label)} ${d.pontos}/${d.max}</span>`).join(' ')}</td>
      <td style="min-width:130px">
        <div class="bar"><div style="width:${r.score}%;background:${corScore(r.score)}"></div></div>
        <b style="color:${corScore(r.score)}">${r.score}</b>/100 ${r.tier.emoji}
      </td>
    </tr>`).join('');

  const matrizCab = s.editais.colunas.map(c => `<th class="rot">${esc(c.nome)}</th>`).join('');
  const matrizLinhas = s.editais.matriz.map(l => `
    <tr>
      <td><b>${esc(l.edital)}</b><br><span class="dim">${esc(l.orgao)} · ${esc(l.valor)} · ${l.dias}d</span></td>
      ${l.celulas.map(c => `<td style="text-align:center"><span class="cel" style="border-color:${corScore(c.score)};color:${corScore(c.score)}">${c.score}</span></td>`).join('')}
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Relatório do Ecossistema: Sexta-Feira · ZoomDev OS</title>
<style>
  body{background:#030d07;color:#eaffea;font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:40px}
  .wrap{max-width:960px;margin:0 auto}
  h1{font-size:26px;margin:0} h2{font-size:16px;color:#00ff64;margin:34px 0 12px;text-transform:uppercase;letter-spacing:.08em}
  .sub{color:#ffffff88;font-size:13px;margin-top:6px}
  .grad{background:linear-gradient(135deg,#00ff64,#00c8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:20px}
  .stat{border:1px solid #00ff6426;background:#05140a;border-radius:12px;padding:14px}
  .stat .v{font-size:22px;font-weight:700;color:#00ff64} .stat .l{font-size:11px;color:#ffffff77;margin-top:3px}
  .card{border:1px solid #ffffff14;background:#05140a;border-radius:14px;padding:18px;line-height:1.65;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:13px} td,th{padding:9px 8px;border-bottom:1px solid #ffffff11;text-align:left;vertical-align:top}
  th{color:#ffffff66;font-size:11px;text-transform:uppercase} .dim{color:#ffffff55;font-size:11px}
  .chip{display:inline-block;border:1px solid #00c8ff33;border-radius:99px;padding:1px 7px;font-size:10.5px;color:#9adfff;margin:1px}
  .bar{height:7px;background:#ffffff12;border-radius:99px;overflow:hidden;margin-bottom:4px}.bar div{height:100%;border-radius:99px}
  .cel{display:inline-block;min-width:34px;border:1px solid;border-radius:8px;padding:3px 6px;font-weight:700;font-size:12px}
  .rot{font-size:10px;max-width:80px} li{margin-bottom:8px}
  .foot{margin-top:40px;color:#ffffff44;font-size:11px;border-top:1px solid #ffffff11;padding-top:14px}
</style></head><body><div class="wrap">
  <h1>🕶️ Relatório do Ecossistema:<span class="grad">Sexta-Feira</span></h1>
  <div class="sub">ZoomDev OS · gerado em ${new Date(rel.geradoEm).toLocaleString('pt-BR')} · PIC v${esc(rel.picVersao)}</div>
  <div class="stats">
    ${statCard(s.usuarios.total, 'Usuários')}
    ${statCard(s.projetos.total, 'Projetos')}
    ${statCard(s.projetos.comPlano, 'Planos gerados')}
    ${statCard(`${s.projetos.missoes.concluidas}/${s.projetos.missoes.total}`, 'Missões concluídas')}
    ${statCard(`${s.radar.unicornios} 🦄`, 'Unicórnios em formação')}
    ${statCard(s.editais.abertos, 'Editais abertos')}
    ${statCard(`${s.carbono.toneladas} t`, 'CO₂e compensado')}
    ${statCard(s.bus.enviados, 'Nudges enviados')}
  </div>
  <h2>Resumo executivo</h2><div class="card">${esc(rel.resumo)}</div>
  <h2>Radar Unicórnio: decomposição explicável</h2>
  <div class="card">${s.radar.ranking.length ? `<table><tr><th>#</th><th>Projeto</th><th>Dimensões</th><th>Score</th></tr>${radarLinhas}</table>` : 'Sem projetos no ecossistema ainda.'}</div>
  <h2>Matriz editais × projetos</h2>
  <div class="card" style="overflow-x:auto">${s.editais.colunas.length ? `<table><tr><th>Edital</th>${matrizCab}</tr>${matrizLinhas}</table>` : 'Sem projetos para cruzar com os editais abertos.'}</div>
  <h2>Recomendações da Sexta-Feira</h2>
  <div class="card"><ol>${rel.recomendacoes.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>
  <div class="foot">Gerado pela Sexta-Feira, inteligência-mestra do ecossistema · ZoomDev OS: IDEA TO EXIT · Dados 100% do snapshot em tempo real (nada é inventado)</div>
</div></body></html>`;
}

// ── Autoaperfeiçoamento governado do PIC ─────────────────────────────────────

// `doutrinas` fica FORA das seções editáveis: é a base ética compartilhada com
// os 27 agentes e só muda por atualização de código, nunca por autoevolução.
const SECOES_EDITAVEIS = ['identidade', 'missao', 'dominios', 'ferramentas', 'regras', 'orquestracao', 'kpis', 'autoaperfeicoamento'];

function propostaDemo(s, conteudoAtual) {
  const candidatas = [];
  const totalProj = s.projetos.total || 0;
  const pctBio = totalProj ? s.projetos.porClassificacao.biostartup / totalProj : 0;

  if (pctBio >= 0.5 && !conteudoAtual.dominios.some(d => d.includes('SBCE'))) {
    candidatas.push({
      resumo: 'Ecossistema majoritariamente bio: aprofundar domínio no mercado regulado brasileiro de carbono (SBCE).',
      mudancas: [{
        secao: 'dominios', tipo: 'append', antes: null,
        depois: 'Mercado regulado brasileiro de carbono (SBCE/Lei 15.042): cronograma de implementação, setores regulados, estratégias de posicionamento antecipado para biostartups do ecossistema',
        justificativa: `${Math.round(pctBio * 100)}% dos projetos são biostartups: o SBCE será o maior vetor de valor para elas até 2030.`,
      }],
    });
  }
  if (totalProj > 0 && s.projetos.comPlano / totalProj < 0.5 && !conteudoAtual.kpis.some(k => k.includes('primeiras 24h'))) {
    candidatas.push({
      resumo: 'Ativação fraca: criar KPI de plano gerado nas primeiras 24h da ideação.',
      mudancas: [{
        secao: 'kpis', tipo: 'append', antes: null,
        depois: '% de projetos que geram o plano nas primeiras 24h após a ideação ≥ 50% (ativação precoce prediz retenção)',
        justificativa: `Apenas ${s.projetos.comPlano}/${totalProj} projetos têm plano: o momento crítico de ativação está sendo perdido.`,
      }],
    });
  }
  if (s.bus.taxaAceite !== null && s.bus.taxaAceite < 35 && !conteudoAtual.regras.some(r => r.includes('taxa de aceite'))) {
    candidatas.push({
      resumo: 'Nudges abaixo da meta: regra de auto-ajuste de frequência por taxa de aceite.',
      mudancas: [{
        secao: 'regras', tipo: 'append', antes: null,
        depois: 'Se a taxa de aceite de nudges cair abaixo de 35% por 7 dias, reduza para 1 nudge/dia e priorize apenas gatilhos de alta intenção (fase pronta para avançar, prazo de edital).',
        justificativa: `Taxa de aceite atual em ${s.bus.taxaAceite}%: abaixo da meta de 35% do KPI.`,
      }],
    });
  }
  candidatas.push({
    resumo: 'Expandir maestria de saída: preparação para M&A e IPO-readiness dos futuros unicórnios.',
    mudancas: [{
      secao: 'dominios', tipo: 'append', antes: null,
      depois: 'Estratégias de saída: M&A (earn-outs, lock-ups), IPO-readiness, dual-track e preparação de dataroom desde a Série A, o "EXIT" do IDEA TO EXIT',
      justificativa: 'A plataforma promete IDEA TO EXIT; o PIC precisa dominar também o último capítulo da jornada.',
    }],
  });
  return candidatas[0];
}

/**
 * A Sexta-Feira analisa o ecossistema (e a internet, quando disponível) e
 * PROPÕE uma evolução cirúrgica do próprio PIC. Nada é aplicado sem aprovação.
 */
export async function proporEvolucao() {
  const pic = initPic();
  const pendente = pic.propostas.find(p => p.status === 'pendente');
  if (pendente) return { proposta: pendente, jaPendente: true };

  const s = snapshotEcossistema();
  const atual = picAtual();
  let dados = null;

  if (config.hasApiKey) {
    try {
      dados = await structured({
        system: renderSystemPromptSextaFeira(atual.conteudo, snapshotTexto(s)),
        user: `Execute seu ciclo de autoaperfeiçoamento governado: diagnostique a MAIOR lacuna entre seu PIC atual e o que o ecossistema precisa, e proponha UMA mudança cirúrgica. Seções editáveis: ${SECOES_EDITAVEIS.join(', ')}. Para seções-lista (dominios, ferramentas, regras, kpis) use tipo "append" com o novo item em "depois". Para seções-texto use tipo "replace" com o texto completo novo em "depois".`,
        schema: {
          type: 'object',
          properties: {
            resumo: { type: 'string' },
            mudancas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  secao: { type: 'string', enum: SECOES_EDITAVEIS },
                  tipo: { type: 'string', enum: ['append', 'replace'] },
                  depois: { type: 'string' },
                  justificativa: { type: 'string' },
                },
                required: ['secao', 'tipo', 'depois', 'justificativa'],
                additionalProperties: false,
              },
            },
          },
          required: ['resumo', 'mudancas'],
          additionalProperties: false,
        },
        effort: 'high', maxTokens: 6000,
        papel: 'chat',
      });
    } catch { /* cai no demo */ }
  }
  if (!dados) dados = propostaDemo(s, atual.conteudo);

  const proposta = {
    id: id('pic'),
    criadoEm: new Date().toISOString(),
    baseVersao: pic.versaoAtual,
    origem: config.hasApiKey ? 'sexta_feira_ia' : 'sexta_feira_demo',
    status: 'pendente',
    resumo: dados.resumo,
    mudancas: dados.mudancas.map(m => ({
      ...m,
      antes: m.tipo === 'replace' ? (typeof atual.conteudo[m.secao] === 'string' ? atual.conteudo[m.secao] : null) : null,
    })),
  };
  pic.propostas.unshift(proposta);
  pic.propostas = pic.propostas.slice(0, 20);
  save();
  return { proposta, jaPendente: false };
}

export function aprovarProposta(propostaId) {
  const pic = initPic();
  const prop = pic.propostas.find(p => p.id === propostaId);
  if (!prop) throw Object.assign(new Error('Proposta não encontrada.'), { status: 404 });
  if (prop.status !== 'pendente') throw Object.assign(new Error('Proposta já resolvida.'), { status: 409 });

  const atual = picAtual();
  const novoConteudo = JSON.parse(JSON.stringify(atual.conteudo));
  for (const m of prop.mudancas) {
    if (!SECOES_EDITAVEIS.includes(m.secao)) continue;
    if (m.tipo === 'append' && Array.isArray(novoConteudo[m.secao])) novoConteudo[m.secao].push(m.depois);
    else if (m.tipo === 'replace') novoConteudo[m.secao] = m.depois;
  }

  const novaVersao = bumpMinor(pic.versaoAtual);
  pic.versoes.push({
    versao: novaVersao,
    criadoEm: new Date().toISOString(),
    origem: 'evolucao_aprovada',
    notas: prop.resumo,
    conteudo: novoConteudo,
  });
  pic.versaoAtual = novaVersao;
  prop.status = 'aprovada';
  prop.resolvidaEm = new Date().toISOString();
  prop.versaoGerada = novaVersao;
  save();
  return { versao: novaVersao, proposta: prop };
}

export function rejeitarProposta(propostaId) {
  const pic = initPic();
  const prop = pic.propostas.find(p => p.id === propostaId);
  if (!prop) throw Object.assign(new Error('Proposta não encontrada.'), { status: 404 });
  if (prop.status !== 'pendente') throw Object.assign(new Error('Proposta já resolvida.'), { status: 409 });
  prop.status = 'rejeitada';
  prop.resolvidaEm = new Date().toISOString();
  save();
  return { proposta: prop };
}

export function rollbackPic(versaoAlvo) {
  const pic = initPic();
  const alvo = pic.versoes.find(v => v.versao === versaoAlvo);
  if (!alvo) throw Object.assign(new Error('Versão não encontrada no histórico.'), { status: 404 });
  if (alvo.versao === pic.versaoAtual) throw Object.assign(new Error('Esta já é a versão ativa.'), { status: 409 });

  const novaVersao = bumpMinor(pic.versaoAtual);
  pic.versoes.push({
    versao: novaVersao,
    criadoEm: new Date().toISOString(),
    origem: 'rollback',
    notas: `Rollback para o conteúdo da v${versaoAlvo}.`,
    conteudo: JSON.parse(JSON.stringify(alvo.conteudo)),
  });
  pic.versaoAtual = novaVersao;
  save();
  return { versao: novaVersao, restauradaDe: versaoAlvo };
}
