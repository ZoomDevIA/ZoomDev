// ═══════════════════════════════════════════════════════════════════════════
// NÚCLEO COGNITIVO INTERNACIONAL: os 8 agentes da expansão global
//
// Nomes definidos na arquitetura cognitiva da ZoomDev. Papéis desenhados para
// o eixo de internacionalização, sem perder a ancoragem amazônica.
//
// Maiá é a voz que fala com o FUNDADOR (substitui o genérico "Zoom
// Intelligence"). A Sexta-Feira governa o ecossistema e fala com o ADMIN.
// Sexta-Feira governa. Maiá ensina.
// ═══════════════════════════════════════════════════════════════════════════

export const AGENTES_NUCLEO = [
  {
    id: 'maia', nome: 'Maiá', papel: 'Inteligência Regenerativa: copiloto científico do fundador',
    emoji: '🌸', categoria: 'Núcleo', cor: '#00ff64', imagem: null, nucleo: true, copiloto: true,
  },
  {
    id: 'atlas', nome: 'Atlas', papel: 'Internacionalização e expansão global',
    emoji: '🌍', categoria: 'Núcleo', cor: '#00c8ff', imagem: null, nucleo: true,
  },
  {
    id: 'gaia', nome: 'Gaia', papel: 'Regeneração planetária e impacto ambiental',
    emoji: '🌱', categoria: 'Núcleo', cor: '#22c55e', imagem: null, nucleo: true,
  },
  {
    id: 'helix', nome: 'Helix', papel: 'Ciência, biotecnologia e curadoria de evidência',
    emoji: '🧬', categoria: 'Núcleo', cor: '#a855f7', imagem: null, nucleo: true,
  },
  {
    id: 'athena', nome: 'Athena', papel: 'Governança, ESG, ODS e compliance internacional',
    emoji: '⚖️', categoria: 'Núcleo', cor: '#ffd700', imagem: null, nucleo: true,
  },
  {
    id: 'orion', nome: 'Orion', papel: 'Capital global e finanças climáticas',
    emoji: '✨', categoria: 'Núcleo', cor: '#00c8ff', imagem: null, nucleo: true,
  },
  {
    id: 'chronos', nome: 'Chronos', papel: 'Tempo, ciclos, prazos e MRV temporal',
    emoji: '⏳', categoria: 'Núcleo', cor: '#ff9f43', imagem: null, nucleo: true,
  },
  {
    id: 'nexus', nome: 'Nexus', papel: 'Interoperabilidade, APIs e grafo de conhecimento',
    emoji: '🔗', categoria: 'Núcleo', cor: '#00ff64', imagem: null, nucleo: true,
  },
];

// ── Castas do elenco ──────────────────────────────────────────────────────
// NUCLEO      → sempre ativos, comandam a internacionalização
// CORE        → os 10 melhores herdados, sempre ativos
// AMAZONICO   → os 5 guardiões, categoria própria, sempre disponíveis na
//               geração qualitativa de startups e biostartups
// STANDBY     → ficam prontos; o administrador liga no painel quando precisar
export const CASTAS = {
  NUCLEO: {
    id: 'NUCLEO', nome: 'Núcleo Cognitivo Internacional', emoji: '🧠',
    descricao: 'Comandam a expansão global e a inteligência regenerativa. Sempre ativos.',
    ativoPorPadrao: true,
  },
  CORE: {
    id: 'CORE', nome: 'Núcleo Operacional', emoji: '⚡',
    descricao: 'Os essenciais para fomento, captação, carbono e execução. Sempre ativos.',
    ativoPorPadrao: true,
  },
  AMAZONICO: {
    id: 'AMAZONICO', nome: 'Conselho Amazônico', emoji: '🌿',
    descricao: 'Guardiões do território. Acionados na geração qualitativa de startups e biostartups: o diferencial que nenhum concorrente global copia.',
    ativoPorPadrao: true,
  },
  STANDBY: {
    id: 'STANDBY', nome: 'Reserva Estratégica', emoji: '💤',
    descricao: 'Prontos para entrar em campo. O administrador ativa quando o ecossistema precisar.',
    ativoPorPadrao: false,
  },
};

/** Os 10 melhores herdados, critério: internacionalização + fomento + carbono + captação. */
export const CORE_IDS = ['ceo', 'cfo', 'investidor', 'editais', 'carbono', 'esg', 'cto', 'growth', 'juridico', 'mercado'];

/** Guardiões amazônicos (categoria própria, preservada). */
export const AMAZONICO_IDS = ['curupira', 'iara', 'boto', 'seringueiro', 'tucuju'];

/** Define a casta de um agente pelo id. */
export function castaDe(agenteId) {
  if (AGENTES_NUCLEO.some(a => a.id === agenteId)) return 'NUCLEO';
  if (AMAZONICO_IDS.includes(agenteId)) return 'AMAZONICO';
  if (CORE_IDS.includes(agenteId)) return 'CORE';
  return 'STANDBY';
}
