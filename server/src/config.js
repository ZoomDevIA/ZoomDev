// Configuração central do servidor ZoomDev OS
export const config = {
  port: Number(process.env.PORT || 4000),
  // Modelo principal dos agentes: o usuário definiu a API do Claude Fable
  model: process.env.ZOOMDEV_MODEL || 'claude-fable-5',
  // ── Mapa de modelos por módulo (decisão do fundador, ago/2026) ──────────
  // O tier máximo só onde ele aparece para o cliente; cada papel tem um
  // override por variável de ambiente para promover ou rebaixar sem deploy.
  // Preços por MTok (entrada/saída): fable $10/$50 · opus-5 $5/$25 ·
  // sonnet-5 $3/$15 · haiku-4-5 $1/$5.
  modelos: {
    // Blocos de escrita do Plano ZoomDev: a vitrine de qualidade do produto
    plano: process.env.ZOOMDEV_MODEL_PLANO || 'claude-opus-5',
    // Pesquisas com internet (plano, Sexta-Feira, radar): buscar e resumir
    pesquisa: process.env.ZOOMDEV_MODEL_PESQUISA || 'claude-sonnet-5',
    // MVP Builder e Studio: geração e edição de código
    codigo: process.env.ZOOMDEV_MODEL_CODIGO || 'claude-sonnet-5',
    // Sexta-Feira (conversa e relatórios) e Conselho dos Agentes
    chat: process.env.ZOOMDEV_MODEL_CHAT || 'claude-sonnet-5',
    // Classificação e extração de campos: tarefa de modelo leve
    extracao: process.env.ZOOMDEV_MODEL_EXTRACAO || 'claude-haiku-4-5',
    // IA dentro dos MVPs gerados pelos founders: volume de terceiros
    gerado: process.env.ZOOMDEV_MODEL_GERADO || 'claude-haiku-4-5',
  },
  // Sem ANTHROPIC_API_KEY o servidor roda em modo demo (planos de exemplo determinísticos)
  hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  // Administrador do ecossistema: e-mail explícito via env; sem env, o primeiro usuário registrado
  adminEmail: (process.env.ZOOMDEV_ADMIN_EMAIL || '').trim().toLowerCase() || null,
  dataDir: process.env.ZOOMDEV_DATA_DIR || new URL('../data/', import.meta.url).pathname,
  // ── Economia de créditos ("seiva") ──────────────────────────────────────
  // Recalibrada com a chegada do Studio. O plano ZoomDev deixou de ser cinco
  // chamadas de texto e passou a ser uma pesquisa real na internet mais cinco
  // agentes escrevendo quatorze seções com esquema fechado: custa perto de
  // quatro vezes o que custava o plano anterior, e o preço acompanha.
  //
  // O que continua de graça é de propósito. A classificação faz parte da
  // ideação, e a pré-leitura é o que faz o documento nascer melhor: cobrar por
  // ela ensinaria o fundador a evitar justamente o passo que melhora o
  // resultado dele.
  credits: {
    initial: 500,
    planGeneration: 180,     // plano ZoomDev: pesquisa na internet + 5 agentes, 14 seções
    mvpBuild: 120,           // construção do MVP navegável (5 peças de código)
    studioTurno: 5,          // cada rodada de conversa no console do Studio
    documentoRevisao: 10,    // agente reescrevendo trechos do documento
    transcricao: 15,         // transcrição de um áudio anexado
    classification: 0,       // classificação é gratuita (parte da ideação)
    preLeitura: 0,           // leitura antecipada é aceleração, não produto
    missionReward: 10,
    streakReward: 5,
    launchArenaTopReward: 50,
  },
  // Preços oficiais (decisão do fundador)
  plans: [
    { id: 'free', nome: 'Free', preco: 0, creditos: 500, descricao: 'Para começar: ideação completa, 2 planos de negócios no ZoomDoc e o Studio inteiro.' },
    { id: 'pro', nome: 'PRO', preco: 149, creditos: 3000, descricao: 'Projetos ilimitados, cerca de 16 planos completos por mês, domínio próprio, todos os módulos e suporte prioritário.' },
    { id: 'business', nome: 'BUSINESS', preco: 199, creditos: 6000, descricao: 'Tudo do PRO com o dobro de seiva, comunidade qualificada, assessoria em editais e workspaces de equipe.' },
  ],
};
