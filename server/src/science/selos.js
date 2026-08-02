// ═══════════════════════════════════════════════════════════════════════════
// SELO DE EVIDÊNCIA ZOOMDEV
// Toda afirmação da plataforma carrega a origem e o grau de confiança da
// informação. É o que separa dado auditável de narrativa, e o que permite
// vender crédito de carbono e reportar ESG sem risco de greenwashing.
// (ISO 14068-1 · CONAR · ICVCM/VCMI · Padrão Documental ZoomDev Genesis)
// ═══════════════════════════════════════════════════════════════════════════

export const SELOS = {
  VERIFICADO: {
    id: 'VERIFICADO', emoji: '🏛️', nome: 'Verificado',
    confianca: 100, tipo: 'EVIDENCE', cor: '#00ff64',
    descricao: 'Documento oficial verificável por terceiro (registro, ART, processo SEI, contrato público).',
    usoComercial: true, usoCredito: true,
  },
  LAUDO: {
    id: 'LAUDO', emoji: '🌱', nome: 'Laudo técnico',
    confianca: 90, tipo: 'EVIDENCE', cor: '#00e05a',
    descricao: 'Laudo assinado por responsável técnico habilitado, com metodologia descrita.',
    usoComercial: true, usoCredito: true,
  },
  CAMPO: {
    id: 'CAMPO', emoji: '🌾', nome: 'Observação de campo',
    confianca: 80, tipo: 'EVIDENCE', cor: '#a8e05a',
    descricao: 'Resultado documentado em campo (vídeo, foto, depoimento) sem instrumentação completa.',
    usoComercial: true, usoCredito: false, // precisa de MRV instrumentado para virar crédito
  },
  PESQUISA: {
    id: 'PESQUISA', emoji: '📄', nome: 'Pesquisa',
    confianca: 75, tipo: 'EVIDENCE', cor: '#00c8ff',
    descricao: 'Literatura científica, dado estatístico oficial ou referência setorial.',
    usoComercial: true, usoCredito: true,
  },
  ESTRATEGIA: {
    id: 'ESTRATEGIA', emoji: '🎯', nome: 'Estratégia',
    confianca: 60, tipo: 'STRATEGY', cor: '#ffd700',
    descricao: 'Modelo de negócio ou plano institucional: projeção, não resultado medido.',
    usoComercial: true, usoCredito: false,
  },
  HIPOTESE: {
    id: 'HIPOTESE', emoji: '💬', nome: 'Hipótese em investigação',
    confianca: 50, tipo: 'HYPOTHESIS', cor: '#ff9f43',
    descricao: 'Mecanismo proposto pelo pesquisador, ainda sem validação independente. Nunca sustenta alegação comercial ou de crédito.',
    usoComercial: false, usoCredito: false,
  },
  VISAO: {
    id: 'VISAO', emoji: '✨', nome: 'Visão / Manifesto',
    confianca: 10, tipo: 'VISION', cor: '#a855f7',
    descricao: 'Aspiração institucional, narrativa ou dimensão filosófica. Vive no Manifesto, fora dos módulos técnicos.',
    usoComercial: false, usoCredito: false,
  },
};

export const ORDEM_SELOS = ['VERIFICADO', 'LAUDO', 'CAMPO', 'PESQUISA', 'ESTRATEGIA', 'HIPOTESE', 'VISAO'];

export function selo(id) {
  return SELOS[id] || SELOS.HIPOTESE;
}

/** Uma alegação só entra em comunicação comercial se o selo permitir. */
export function podeComunicar(seloId) {
  return Boolean(selo(seloId).usoComercial);
}

/** Uma alegação só entra em cálculo de crédito de carbono se o selo permitir. */
export function podeGerarCredito(seloId) {
  return Boolean(selo(seloId).usoCredito);
}

/**
 * Selo resultante de uma cadeia de afirmações: vale sempre o elo mais fraco.
 * Um cálculo que usa um dado de campo (80) e um laudo (90) vale 80.
 */
export function seloResultante(ids) {
  const validos = ids.filter(Boolean).map(id => selo(id));
  if (!validos.length) return SELOS.HIPOTESE;
  return validos.reduce((min, s) => (s.confianca < min.confianca ? s : min), validos[0]);
}

/** Texto de conformidade para relatórios e comunicação externa. */
export function disclaimerConformidade(seloId) {
  const s = selo(seloId);
  if (s.usoCredito) {
    return 'Estimativa baseada em evidência documentada. A emissão de créditos exige MRV instrumentado e verificação por terceira parte acreditada, com aposentadoria em registro público.';
  }
  if (s.usoComercial) {
    return 'Resultado observado em campo. Não constitui base suficiente para emissão de crédito de carbono sem MRV instrumentado e verificação independente.';
  }
  return 'Conteúdo classificado como hipótese ou visão institucional. Não sustenta alegação comercial, ambiental ou de crédito de carbono.';
}
