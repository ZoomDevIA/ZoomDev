// ═══════════════════════════════════════════════════════════════════════════
// RADAR DE EDITAIS: busca sistêmica diária + match automático com projetos
//
// Com ANTHROPIC_API_KEY: a Sexta-Feira varre a internet em tempo real atrás de
// chamadas abertas de fomento e as incorpora ao radar.
// Sem chave: opera sobre a base curada, recalculando matches e prazos.
//
// O match é multi-sinal e EXPLICÁVEL: nunca um número solto, sempre os porquês.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { config } from '../config.js';
import { EDITAIS_SEED } from '../data/seeds.js';
import { structured } from '../agents/claude.js';
import { conversarComInternet } from '../agents/claude.js';

const DIA_MS = 86400000;
const hoje = () => new Date().toISOString().slice(0, 10);

// ── Estado do radar ────────────────────────────────────────────────────────
export function estadoRadar() {
  if (!store.radar) {
    store.radar = { ultimaVarredura: null, descobertos: {}, execucoes: [], matches: {} };
    save();
  }
  return store.radar;
}

/** Todos os editais conhecidos: base curada + descobertos pelo radar. */
export function todosEditais() {
  const r = estadoRadar();
  return [...EDITAIS_SEED, ...Object.values(r.descobertos)];
}

export function diasParaPrazo(edital, agora = Date.now()) {
  if (!edital?.prazo) return null;
  const t = new Date(`${edital.prazo}T23:59:59`).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - agora) / DIA_MS);
}

export const editaisAbertos = () =>
  todosEditais().map(e => ({ ...e, dias: diasParaPrazo(e) }))
    .filter(e => e.dias === null || e.dias >= 0)
    .sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999));

// ── Motor de match multi-sinal ─────────────────────────────────────────────
const TERMOS_BIO = ['bioeconomia', 'sociobiodiversidade', 'amazônia', 'sustentabilidade', 'clima', 'floresta', 'carbono', 'ambiental'];
const FASE_PARA_ESTAGIO = {
  ideacao: ['ideação', 'ideacao', 'nascente', 'pré-incubação'],
  validacao: ['ideação', 'ideacao', 'mvp', 'nascente', 'aceleração'],
  mvp: ['mvp', 'aceleração', 'protótipo', 'prototipo'],
  tracao: ['tração', 'tracao', 'investimento', 'escala', 'mercado'],
  escala: ['escala', 'investimento', 'internacionalização', 'mercado'],
};

/**
 * Score de aderência 0-100, decomposto em sinais explicáveis.
 * Determinístico: a mesma entrada sempre produz o mesmo resultado.
 */
export function calcularMatch(edital, projeto) {
  const sinais = [];
  const tags = (edital.tags || []).map(t => String(t).toLowerCase());
  const texto = `${edital.nome} ${edital.foco || ''} ${edital.descricao || ''} ${tags.join(' ')}`.toLowerCase();

  // 1. Alinhamento temático (0-35)
  const ehBio = projeto.classificacao === 'biostartup';
  const editalBio = tags.some(t => TERMOS_BIO.includes(t)) || TERMOS_BIO.some(t => texto.includes(t));
  let tematico = 15;
  let motivoTema = 'Alinhamento temático genérico.';
  if (ehBio && editalBio) { tematico = 35; motivoTema = 'Projeto de bioeconomia em chamada com foco socioambiental: encaixe direto.'; }
  else if (!ehBio && !editalBio) { tematico = 27; motivoTema = 'Startup de tecnologia em chamada de inovação geral.'; }
  else if (ehBio && !editalBio) { tematico = 20; motivoTema = 'Chamada generalista: o componente bio é diferencial, não requisito.'; }
  else { tematico = 10; motivoTema = 'Chamada com foco socioambiental e projeto sem componente bio declarado.'; }
  sinais.push({ sinal: 'Tema', pontos: tematico, max: 35, motivo: motivoTema });

  // 2. Estágio do projeto vs. estágio esperado (0-25)
  const esperados = FASE_PARA_ESTAGIO[projeto.fase] || [];
  const casaEstagio = esperados.some(e => texto.includes(e));
  const estagio = casaEstagio ? 25 : (projeto.fase === 'ideacao' ? 12 : 16);
  sinais.push({
    sinal: 'Estágio', pontos: estagio, max: 25,
    motivo: casaEstagio
      ? `Fase ${projeto.fase} compatível com o estágio exigido pela chamada.`
      : `Fase ${projeto.fase}: verifique no edital se o estágio é elegível.`,
  });

  // 3. Maturidade documental (0-20): plano pronto vale muito em submissão
  const temPlano = Boolean(projeto.plano);
  const missoes = projeto.missoes || [];
  const feitas = missoes.filter(m => m.concluida).length;
  let doc = temPlano ? 14 : 4;
  if (missoes.length && feitas / missoes.length >= 0.5) doc += 6;
  else if (feitas > 0) doc += 3;
  sinais.push({
    sinal: 'Maturidade', pontos: Math.min(20, doc), max: 20,
    motivo: temPlano
      ? `Plano de negócios pronto${feitas ? ` e ${feitas} missão(ões) de validação concluída(s)` : ''}: base sólida para o formulário.`
      : 'Sem plano de negócios: gere o plano antes de submeter.',
  });

  // 4. Janela de prazo (0-20), nem cedo demais, nem tarde demais
  const dias = diasParaPrazo(edital);
  let prazoPts = 10, motivoPrazo = 'Prazo não informado: confirme na fonte.';
  if (dias !== null) {
    if (dias < 0) { prazoPts = 0; motivoPrazo = 'Prazo encerrado.'; }
    else if (dias <= 7) { prazoPts = 8; motivoPrazo = `Fecha em ${dias} dia(s): submissão de alto risco sem documentação pronta.`; }
    else if (dias <= 30) { prazoPts = 20; motivoPrazo = `Fecha em ${dias} dias: janela ideal para submeter com preparo.`; }
    else if (dias <= 90) { prazoPts = 17; motivoPrazo = `${dias} dias de prazo: tempo confortável para preparar.`; }
    else { prazoPts = 12; motivoPrazo = `${dias} dias de prazo: acompanhe, ainda distante.`; }
  }
  sinais.push({ sinal: 'Prazo', pontos: prazoPts, max: 20, motivo: motivoPrazo });

  const score = Math.min(100, sinais.reduce((s, x) => s + x.pontos, 0));
  return {
    editalId: edital.id, edital: edital.nome, orgao: edital.orgao, valor: edital.valor,
    projetoId: projeto.id, projeto: projeto.nome,
    score, dias, sinais,
    tier: score >= 80 ? 'forte' : score >= 60 ? 'boa' : score >= 40 ? 'parcial' : 'baixa',
    proximosPassos: proximosPassos(score, temPlano, dias),
  };
}

function proximosPassos(score, temPlano, dias) {
  const passos = [];
  if (!temPlano) passos.push('Gere o plano de negócios: ele vira a base do formulário de submissão.');
  if (score >= 60) {
    passos.push('Leia o edital completo e confirme os critérios de elegibilidade.');
    passos.push('Prepare certidões e documentação societária com antecedência.');
  }
  if (dias !== null && dias <= 30) passos.push(`Prioridade alta: restam ${dias} dias para o encerramento.`);
  if (score < 40) passos.push('Aderência baixa: avalie outras chamadas antes de investir tempo nesta.');
  return passos;
}

/** Melhores matches de um projeto. */
export function matchesDoProjeto(projeto, minimo = 0) {
  return editaisAbertos()
    .map(e => calcularMatch(e, projeto))
    .filter(m => m.score >= minimo)
    .sort((a, b) => b.score - a.score);
}

/** Matches de todos os projetos de um usuário. */
export function matchesDoUsuario(userId, minimo = 60) {
  const projetos = Object.values(store.projects).filter(p => p.userId === userId);
  return projetos.flatMap(p => matchesDoProjeto(p, minimo)).sort((a, b) => b.score - a.score);
}

// ── Varredura diária ───────────────────────────────────────────────────────
const EDITAL_SCHEMA = {
  type: 'object',
  properties: {
    editais: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string' }, orgao: { type: 'string' }, valor: { type: 'string' },
          prazo: { type: 'string', description: 'Data limite no formato AAAA-MM-DD' },
          foco: { type: 'string' }, descricao: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          fonte: { type: 'string', description: 'URL ou nome da fonte oficial' },
        },
        required: ['nome', 'orgao', 'valor', 'prazo', 'foco', 'descricao', 'tags', 'fonte'],
        additionalProperties: false,
      },
    },
  },
  required: ['editais'],
  additionalProperties: false,
};

/**
 * Executa uma varredura. Com API key, busca na internet; sem chave, apenas
 * recalcula prazos e matches sobre a base curada.
 */
export async function varrer({ forcar = false } = {}) {
  const r = estadoRadar();
  const agora = new Date().toISOString();

  if (!forcar && r.ultimaVarredura && Date.now() - new Date(r.ultimaVarredura).getTime() < DIA_MS) {
    return { pulado: true, motivo: 'Varredura já executada nas últimas 24h.', ultimaVarredura: r.ultimaVarredura };
  }

  let novos = 0;
  let modo = 'curadoria';

  if (config.hasApiKey) {
    modo = 'internet';
    try {
      const conhecidos = todosEditais().map(e => e.nome).join('; ');
      const { texto } = await conversarComInternet({
        system: 'Você é o Radar de Editais da ZoomDev OS. Pesquise chamadas de fomento à inovação ABERTAS no Brasil (FINEP, FAPs estaduais, Sebrae, BNDES, CNPq, Embrapii, CONFAP, MCTI) com foco em startups, bioeconomia e sustentabilidade. Retorne apenas chamadas com prazo futuro e fonte oficial verificável.',
        messages: [{ role: 'user', content: `Liste as chamadas de fomento abertas agora, com prazo de submissão futuro. Não repita estas que já conheço: ${conhecidos}. Para cada uma informe nome, órgão, valor, prazo (AAAA-MM-DD), foco, descrição curta, tags e a fonte oficial.` }],
        effort: 'medium', maxTokens: 8000,
        papel: 'pesquisa',
      });
      const dados = await structured({
        system: 'Converta a pesquisa em dados estruturados. Descarte qualquer chamada sem prazo futuro claro ou sem fonte identificável.',
        user: texto,
        schema: EDITAL_SCHEMA, effort: 'low', maxTokens: 4000,
        papel: 'extracao',
      });
      for (const e of dados.editais || []) {
        const dias = diasParaPrazo(e);
        if (dias === null || dias < 0) continue;
        const chave = e.nome.toLowerCase().trim();
        if (todosEditais().some(x => x.nome.toLowerCase().trim() === chave)) continue;
        const novoId = id('edt');
        r.descobertos[novoId] = { ...e, id: novoId, descobertoEm: agora, origem: 'radar' };
        novos++;
      }
    } catch (e) {
      modo = 'curadoria';
      r.ultimoErro = e.message;
    }
  }

  r.ultimaVarredura = agora;
  r.execucoes.unshift({ em: agora, modo, novos, totalConhecidos: todosEditais().length });
  r.execucoes = r.execucoes.slice(0, 30);
  save();

  return { pulado: false, modo, novos, totalConhecidos: todosEditais().length, ultimaVarredura: agora };
}

/** Resumo do radar para dashboards. */
export function resumoRadar() {
  const r = estadoRadar();
  const abertos = editaisAbertos();
  return {
    ultimaVarredura: r.ultimaVarredura,
    proximaVarredura: r.ultimaVarredura ? new Date(new Date(r.ultimaVarredura).getTime() + DIA_MS).toISOString() : null,
    modo: config.hasApiKey ? 'busca na internet em tempo real' : 'curadoria (configure ANTHROPIC_API_KEY para busca automática)',
    totalConhecidos: todosEditais().length,
    abertos: abertos.length,
    descobertosPeloRadar: Object.keys(r.descobertos).length,
    fechandoEm30Dias: abertos.filter(e => e.dias !== null && e.dias <= 30).length,
    execucoes: r.execucoes.slice(0, 10),
  };
}
