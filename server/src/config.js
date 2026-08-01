// Configuração central do servidor ZoomDev OS
export const config = {
  port: Number(process.env.PORT || 4000),
  // Modelo principal dos agentes — o usuário definiu a API do Claude Fable
  model: process.env.ZOOMDEV_MODEL || 'claude-fable-5',
  // Sem ANTHROPIC_API_KEY o servidor roda em modo demo (planos de exemplo determinísticos)
  hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  dataDir: process.env.ZOOMDEV_DATA_DIR || new URL('../data/', import.meta.url).pathname,
  // Economia de créditos ("seiva")
  credits: {
    initial: 500,
    planGeneration: 60,      // custo da geração completa do plano (5 agentes)
    classification: 0,       // classificação é gratuita (parte da ideação)
    missionReward: 10,
    streakReward: 5,
    launchArenaTopReward: 50,
  },
  // Preços oficiais (decisão do fundador)
  plans: [
    { id: 'free', nome: 'Free', preco: 0, creditos: 500, descricao: 'Para começar: ideação completa e 1 plano de negócios.' },
    { id: 'pro', nome: 'PRO', preco: 149, creditos: 3000, descricao: 'Projetos ilimitados, domínio próprio, todos os módulos, suporte prioritário.' },
    { id: 'business', nome: 'BUSINESS', preco: 199, creditos: 6000, descricao: 'Tudo do PRO + comunidade qualificada, assessoria em editais e workspaces de equipe.' },
  ],
};
