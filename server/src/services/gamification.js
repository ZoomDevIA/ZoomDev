// Filosofia gamificada da ZoomDev: XP por progresso real, níveis bio-amazônicos,
// missões encadeadas por fase e streak. Ver docs/gamificacao.md.

export const FASES = ['ideacao', 'validacao', 'mvp', 'tracao', 'escala'];

export const FASE_LABEL = {
  ideacao: 'Ideação', validacao: 'Validação', mvp: 'MVP', tracao: 'Tração', escala: 'Escala',
};

// Nível da startup segue a fase alcançada (metáfora bio-amazônica)
export const NIVEL_STARTUP = {
  ideacao: { nome: 'Semente', emoji: '🌱' },
  validacao: { nome: 'Broto', emoji: '🌿' },
  mvp: { nome: 'Árvore', emoji: '🌳' },
  tracao: { nome: 'Copa', emoji: '🌲' },
  escala: { nome: 'Floresta', emoji: '🌴' },
};

// Níveis do fundador por XP acumulado
const NIVEIS_FUNDADOR = [
  { nivel: 1, nome: 'Explorador', xp: 0 },
  { nivel: 2, nome: 'Desbravador', xp: 100 },
  { nivel: 3, nome: 'Construtor', xp: 300 },
  { nivel: 4, nome: 'Guardião', xp: 700 },
  { nivel: 5, nome: 'Visionário', xp: 1500 },
  { nivel: 6, nome: 'Lenda da Floresta', xp: 3000 },
];

export const XP_EVENTOS = {
  ideia_estruturada: 25,
  plano_gerado: 80,
  plano_baixado: 10,
  fase_avancada: 120,
  missao_concluida: 30,
  calculo_carbono: 20,
  plano_compensacao: 70,
  compensacao_carbono: 60,
  streak_diario: 5,
};

export function newUserGamification() {
  return {
    xp: 0,
    conquistas: [],
    streak: { dias: 0, ultimoDia: null },
    historico: [],
  };
}

export function nivelFundador(xp) {
  let atual = NIVEIS_FUNDADOR[0];
  for (const n of NIVEIS_FUNDADOR) if (xp >= n.xp) atual = n;
  const proximo = NIVEIS_FUNDADOR.find(n => n.xp > xp) || null;
  return { ...atual, proximoXp: proximo ? proximo.xp : null, xp };
}

const CONQUISTAS = {
  primeira_ideia: { nome: 'Primeira Semente', emoji: '🌱', descricao: 'Estruturou a primeira ideia com IA' },
  primeiro_plano: { nome: 'Arquiteto do Futuro', emoji: '📐', descricao: 'Gerou o primeiro plano de negócios qualificado' },
  primeiro_download: { nome: 'Documentado', emoji: '📄', descricao: 'Baixou um plano em DOCX/PDF' },
  primeira_validacao: { nome: 'Broto Validado', emoji: '🌿', descricao: 'Avançou para a fase de Validação' },
  guardiao_floresta: { nome: 'Guardião da Floresta', emoji: '🛡️', descricao: 'Calculou seu passivo ambiental' },
  estrategista_clima: { nome: 'Estrategista do Clima', emoji: '🗺️', descricao: 'Criou um plano de compensação com metas de redução' },
  carbono_neutro: { nome: 'Pegada Compensada', emoji: '🍃', descricao: 'Compensou emissões com créditos de carbono' },
};

export function awardXP(user, evento, detalhe = {}) {
  const xp = XP_EVENTOS[evento] || 0;
  const g = user.gamification;
  const antes = nivelFundador(g.xp).nivel;
  g.xp += xp;
  const depois = nivelFundador(g.xp).nivel;

  // streak diário
  const hoje = new Date().toISOString().slice(0, 10);
  if (g.streak.ultimoDia !== hoje) {
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    g.streak.dias = g.streak.ultimoDia === ontem ? g.streak.dias + 1 : 1;
    g.streak.ultimoDia = hoje;
  }

  const novasConquistas = [];
  const conquistaPorEvento = {
    ideia_estruturada: 'primeira_ideia',
    plano_gerado: 'primeiro_plano',
    plano_baixado: 'primeiro_download',
    fase_avancada: 'primeira_validacao',
    calculo_carbono: 'guardiao_floresta',
    compensacao_carbono: 'carbono_neutro',
  };
  const cid = conquistaPorEvento[evento];
  if (cid && !g.conquistas.includes(cid)) {
    g.conquistas.push(cid);
    novasConquistas.push({ id: cid, ...CONQUISTAS[cid] });
  }

  g.historico.unshift({ evento, xp, detalhe, em: new Date().toISOString() });
  g.historico = g.historico.slice(0, 100);

  return { xpGanho: xp, subiuNivel: depois > antes, nivel: nivelFundador(g.xp), novasConquistas, streak: g.streak };
}

// Missões padrão da fase de Validação — usadas como fallback quando a IA não gera
export function missoesValidacaoPadrao(plano) {
  const publico = plano?.produto?.publicoAlvo || 'seu público-alvo';
  return [
    { id: 'val_entrevistas', titulo: `Entreviste 5 pessoas de ${publico}`, descricao: 'Valide o problema antes da solução: as dores citadas no plano são reais?', xp: 30, tipo: 'principal' },
    { id: 'val_landing', titulo: 'Publique uma landing page de captura', descricao: 'Meça interesse real: meta de 10 cadastros na lista de espera.', xp: 30, tipo: 'principal' },
    { id: 'val_concorrente', titulo: 'Teste um concorrente por 30 minutos', descricao: 'Use o principal concorrente citado no plano e anote 3 fraquezas exploráveis.', xp: 30, tipo: 'secundaria' },
    { id: 'val_preco', titulo: 'Valide o preço com 3 potenciais clientes', descricao: 'Apresente o pricing do plano e registre a reação (caro/justo/barato).', xp: 30, tipo: 'secundaria' },
  ];
}

export function conquistasCatalogo() { return CONQUISTAS; }
