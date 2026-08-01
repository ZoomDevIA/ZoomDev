// Dados-semente clonados do protótipo Base44 (ver docs/spec-prototipo-base44.md)

export const AGENTES_BIO = [
  { id: 'curupira', nome: 'Curupira AI', papel: 'Guardião da biodiversidade e mapeamento florestal', emoji: '🌳', categoria: 'Bioeconomia', is_bio: true },
  { id: 'iara', nome: 'Iara AI', papel: 'Especialista em recursos hídricos amazônicos', emoji: '💧', categoria: 'Bioeconomia', is_bio: true },
  { id: 'boto', nome: 'Boto AI', papel: 'Comunidades tradicionais e etnociências', emoji: '🐬', categoria: 'Bioeconomia', is_bio: true },
  { id: 'seringueiro', nome: 'Seringueiro AI', papel: 'Cadeias produtivas sustentáveis e bioeconomia', emoji: '🌿', categoria: 'Bioeconomia', is_bio: true },
  { id: 'tucuju', nome: 'Tucuju AI', papel: 'Protocolos COP30 e acordos climáticos globais', emoji: '🌍', categoria: 'Bioeconomia', is_bio: true },
];

export const AGENTES_GERAIS = [
  { id: 'ceo', nome: 'CEO AI', papel: 'Estratégia e visão de negócio', emoji: '👑', categoria: 'Negócios' },
  { id: 'cto', nome: 'CTO AI', papel: 'Arquitetura e decisões técnicas', emoji: '🧠', categoria: 'Tecnologia' },
  { id: 'cmo', nome: 'CMO AI', papel: 'Marketing e posicionamento', emoji: '📣', categoria: 'Negócios' },
  { id: 'cfo', nome: 'CFO AI', papel: 'Finanças e projeções', emoji: '💰', categoria: 'Negócios' },
  { id: 'ux', nome: 'UX Designer', papel: 'Experiência e interface', emoji: '🎨', categoria: 'Tecnologia' },
  { id: 'dev', nome: 'Dev Master', papel: 'Desenvolvimento full-stack', emoji: '⚡', categoria: 'Tecnologia' },
  { id: 'juridico', nome: 'Jurídico', papel: 'Contratos e conformidade', emoji: '⚖️', categoria: 'Jurídico' },
  { id: 'financeiro', nome: 'Financeiro', papel: 'Fluxo de caixa e captação', emoji: '📈', categoria: 'Negócios' },
  { id: 'esg', nome: 'ESG Impacto', papel: 'Métricas ESG e relatórios', emoji: '🌱', categoria: 'ESG' },
  { id: 'editais', nome: 'Editais IA', papel: 'Fomento público e submissões', emoji: '📋', categoria: 'Negócios' },
  { id: 'growth', nome: 'Growth Hacker', papel: 'Aquisição e experimentos', emoji: '🚀', categoria: 'Negócios' },
  { id: 'investidor', nome: 'Investidor IA', papel: 'Preparação para captação', emoji: '🤝', categoria: 'Negócios' },
  { id: 'carbono', nome: 'Carbono AI', papel: 'Créditos de carbono e MRV', emoji: '🍃', categoria: 'ESG' },
  { id: 'react', nome: 'React Dev', papel: 'Frontend React + Tailwind', emoji: '⚛️', categoria: 'Tecnologia' },
  { id: 'flutter', nome: 'Flutter Dev', papel: 'Apps mobile multiplataforma', emoji: '📱', categoria: 'Tecnologia' },
  { id: 'deploy', nome: 'Deploy AI', papel: 'CI/CD e publicação 1-click', emoji: '☁️', categoria: 'Tecnologia' },
  { id: 'hr', nome: 'HR AI', papel: 'Time e cultura', emoji: '🧑‍🤝‍🧑', categoria: 'Negócios' },
  { id: 'mercado', nome: 'Mercado', papel: 'Análise competitiva e TAM/SAM/SOM', emoji: '🔎', categoria: 'Negócios' },
];

export const EDITAIS_SEED = [
  {
    id: 'finep_bio_2025', nome: 'FINEP Bioeconomia 2025', orgao: 'FINEP/MCTI',
    valor: 'R$ 200 milhões', prazo: '2026-10-30', foco: 'Projetos sustentáveis de bioeconomia',
    descricao: 'Subvenção para pesquisa e inovação em bioeconomia, com prioridade para a Amazônia Legal.',
    tags: ['bioeconomia', 'sustentabilidade', 'amazônia'],
  },
  {
    id: 'nexbio_2026', nome: 'Chamada nexBio Amazônia 2026', orgao: 'CONFAP · Amazônia+10',
    valor: 'R$ 107 milhões', prazo: '2026-12-15', foco: 'Bionegócios e cadeias da sociobiodiversidade',
    descricao: 'Apoio a bionegócios com base em cadeias produtivas da sociobiodiversidade amazônica.',
    tags: ['bioeconomia', 'sociobiodiversidade', 'startups'],
  },
  {
    id: 'centelha_3', nome: 'Centelha 3', orgao: 'FINEP/Fundações Estaduais',
    valor: 'até R$ 100 mil por projeto', prazo: '2026-09-20', foco: 'Ideação e MVP de startups nascentes',
    descricao: 'Programa de geração de empreendimentos inovadores para transformar ideias em negócios.',
    tags: ['ideação', 'mvp', 'startup nascente'],
  },
  {
    id: 'finep_startup', nome: 'FINEP Startup', orgao: 'FINEP',
    valor: 'até R$ 1 milhão', prazo: '2026-11-10', foco: 'Startups de base tecnológica em tração',
    descricao: 'Investimento direto em startups inovadoras com produto no mercado.',
    tags: ['tração', 'investimento', 'tecnologia'],
  },
  {
    id: 'catalisa', nome: 'Sebrae Catalisa ICT', orgao: 'Sebrae',
    valor: 'aceleração + bolsas', prazo: '2026-08-30', foco: 'Inovação de base científica',
    descricao: 'Aceleração e mentoria para transformar pesquisa científica em negócio.',
    tags: ['aceleração', 'ciência', 'mentoria'],
  },
];

// Marketplace CarbonPay (espelha os itens seed do protótipo)
export const CARBONPAY_ITENS = [
  { id: 'redd_amazonia_mkt', nome: 'REDD+ Amazônia — Floresta em Pé', categoria: 'Projetos de Carbono', tons: 12500, precoPorTon: 189, padrao: 'Verra VCS', bioma: 'Amazônia', tipo: 'REDD+', verificado: true, descricao: 'Conservação de floresta nativa com monitoramento por satélite e renda comunitária.' },
  { id: 'saf_cacau', nome: 'SAF Cacau Bahia', categoria: 'Projetos de Carbono', tons: 4300, precoPorTon: 145, padrao: 'Gold Standard', bioma: 'Mata Atlântica', tipo: 'ARR/Agrofloresta', verificado: true, descricao: 'Sistemas agroflorestais de cacau-cabruca com remoção de carbono e renda familiar.' },
  { id: 'cerrado_vivo', nome: 'Cerrado Vivo', categoria: 'Projetos de Carbono', tons: 7800, precoPorTon: 112, padrao: 'Verra VCS', bioma: 'Cerrado', tipo: 'Conservação', verificado: true, descricao: 'Proteção de vegetação nativa do Cerrado com brigadas contra incêndio.' },
  { id: 'pantanal_regenera', nome: 'Pantanal Regenera', categoria: 'Projetos de Carbono', tons: 3200, precoPorTon: 128, padrao: 'Social Carbon', bioma: 'Pantanal', tipo: 'Restauração', verificado: true, descricao: 'Restauração de áreas degradadas com espécies nativas do Pantanal.' },
  { id: 'mrv_audit', nome: 'Auditoria MRV Digital', categoria: 'Auditoria MRV', tons: null, precoPorTon: null, padrao: 'Verra VCS', bioma: null, tipo: 'Serviço', verificado: true, descricao: 'Monitoramento, relato e verificação digital para projetos de carbono.' },
  { id: 'tokenizacao', nome: 'Tokenização de Créditos', categoria: 'Tokenização', tons: null, precoPorTon: null, padrao: '1 token = 1 tCO₂', bioma: null, tipo: 'Serviço', verificado: true, descricao: 'Emissão de tokens lastreados 1:1 em créditos aposentados, com hash público.' },
];

// Calculadora de sequestro (protótipo): tCO2e/ha/ano por bioma × multiplicador por tipo
export const SEQUESTRO_BIOMAS = {
  amazonia: { nome: 'Amazônia', taxa: 8.5 },
  mata_atlantica: { nome: 'Mata Atlântica', taxa: 7.2 },
  cerrado: { nome: 'Cerrado', taxa: 4.1 },
  caatinga: { nome: 'Caatinga', taxa: 2.8 },
  pantanal: { nome: 'Pantanal', taxa: 5.3 },
  pampa: { nome: 'Pampa', taxa: 3.2 },
};

export const SEQUESTRO_TIPOS = {
  conservacao: { nome: 'Conservação (REDD+)', mult: 0.6 },
  restauracao: { nome: 'Restauração/Reflorestamento (ARR)', mult: 1.0 },
  agrofloresta: { nome: 'Sistema Agroflorestal (SAF)', mult: 0.8 },
};

export const NOTIFICACOES_SEED = [
  { id: 'n1', titulo: 'Novo edital disponível', detalhe: 'FINEP Bioeconomia 2025 — R$ 200 milhões para projetos sustentáveis', tipo: 'edital' },
  { id: 'n2', titulo: 'Chamada nexBio Amazônia 2026', detalhe: 'CONFAP · Amazônia+10 — R$ 107 milhões para bionegócios', tipo: 'edital' },
  { id: 'n3', titulo: 'CarbonPay ativo', detalhe: 'Calcule seu passivo e compense com créditos verificados', tipo: 'info' },
];
