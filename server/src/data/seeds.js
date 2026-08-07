// Dados-semente clonados do protótipo Base44: nomes, papéis, cores e IMAGENS ORIGINAIS
// extraídos da entidade Agent do app real (ver docs/spec-prototipo-base44.md).
// Imagens servidas localmente em web/public/assets/agents/.

export const AGENTES_BIO = [
  { id: 'curupira', nome: 'Curupira AI', papel: 'Guardião da biodiversidade e mapeamento florestal', emoji: '🌳', categoria: 'Bioeconomia', is_bio: true, cor: '#22c55e', imagem: '/assets/agents/curupira.webp' },
  { id: 'iara', nome: 'Iara AI', papel: 'Especialista em recursos hídricos amazônicos', emoji: '💧', categoria: 'Bioeconomia', is_bio: true, cor: '#00c8ff', imagem: '/assets/agents/iara.webp' },
  { id: 'boto', nome: 'Boto AI', papel: 'Comunidades tradicionais e etnociências', emoji: '🐬', categoria: 'Bioeconomia', is_bio: true, cor: '#22c55e', imagem: '/assets/agents/boto.webp' },
  { id: 'seringueiro', nome: 'Seringueiro AI', papel: 'Cadeias produtivas sustentáveis e bioeconomia', emoji: '🌿', categoria: 'Bioeconomia', is_bio: true, cor: '#00ff64', imagem: '/assets/agents/seringueiro.webp' },
  { id: 'tucuju', nome: 'Tucuju AI', papel: 'Protocolos COP30 e acordos climáticos globais', emoji: '🌍', categoria: 'ESG', is_bio: true, cor: '#22c55e', imagem: '/assets/agents/tucuju.webp' },
];

export const AGENTES_GERAIS = [
  { id: 'ceo', nome: 'CEO AI', papel: 'Estratégia e liderança executiva', emoji: '👑', categoria: 'Negócios', cor: '#00ff64', imagem: '/assets/agents/ceo.webp' },
  { id: 'cto', nome: 'CTO AI', papel: 'Arquitetura e decisões técnicas', emoji: '🧠', categoria: 'Tecnologia', cor: '#00c8ff', imagem: '/assets/agents/cto.webp' },
  { id: 'cmo', nome: 'CMO AI', papel: 'Marketing e crescimento', emoji: '📣', categoria: 'Negócios', cor: '#ffd700', imagem: '/assets/agents/cmo.webp' },
  { id: 'cfo', nome: 'CFO AI', papel: 'Finanças e captação de recursos', emoji: '💰', categoria: 'Negócios', cor: '#a855f7', imagem: '/assets/agents/cfo.webp' },
  { id: 'ux', nome: 'UX Designer', papel: 'Design e experiência do usuário', emoji: '🎨', categoria: 'Tecnologia', cor: '#ff6b6b', imagem: '/assets/agents/ux.webp' },
  { id: 'dev', nome: 'Dev Master', papel: 'Código, integração e automação', emoji: '⚡', categoria: 'Tecnologia', cor: '#00ff64', imagem: '/assets/agents/dev.webp' },
  { id: 'juridico', nome: 'Jurídico', papel: 'Documentos e compliance legal', emoji: '⚖️', categoria: 'Jurídico', cor: '#00c8ff', imagem: '/assets/agents/juridico.webp' },
  { id: 'financeiro', nome: 'Financeiro', papel: 'Planejamento e análise financeira', emoji: '📈', categoria: 'Negócios', cor: '#ffd700', imagem: '/assets/agents/financeiro.webp' },
  { id: 'esg', nome: 'ESG Impacto', papel: 'Sustentabilidade e impacto social', emoji: '🌱', categoria: 'ESG', cor: '#22c55e', imagem: '/assets/agents/esg.webp' },
  { id: 'bio_agente', nome: 'Bio Agente', papel: 'Bioeconomia e biodiversidade', emoji: '🍀', categoria: 'Bioeconomia', cor: '#00ff64', imagem: '/assets/agents/bio_agente.webp' },
  { id: 'editais', nome: 'Editais IA', papel: 'Mapeia e aplica em editais', emoji: '📋', categoria: 'Negócios', cor: '#ffd700', imagem: '/assets/agents/editais.webp' },
  { id: 'growth', nome: 'Growth Hacker', papel: 'Estratégias de crescimento acelerado', emoji: '🚀', categoria: 'Negócios', cor: '#00c8ff', imagem: '/assets/agents/growth.webp' },
  { id: 'investidor', nome: 'Investidor IA', papel: 'Pitch e captação de investimento', emoji: '🤝', categoria: 'Negócios', cor: '#a855f7', imagem: '/assets/agents/investidor.webp' },
  { id: 'bio_amazonia', nome: 'Bio Agente Amazônia', papel: 'Protocolos cognitivos amazônicos', emoji: '🌎', categoria: 'Bioeconomia', cor: '#00ff64', imagem: '/assets/agents/bio_amazonia.webp' },
  { id: 'carbono', nome: 'Carbono AI', papel: 'Créditos de carbono e rastreabilidade', emoji: '🍃', categoria: 'Bioeconomia', cor: '#22c55e', imagem: '/assets/agents/carbono.webp' },
  { id: 'react', nome: 'React Dev', papel: 'Desenvolvimento React e Next.js', emoji: '⚛️', categoria: 'Tecnologia', cor: '#00c8ff', imagem: '/assets/agents/react.webp' },
  { id: 'flutter', nome: 'Flutter Dev', papel: 'Apps mobile iOS e Android', emoji: '📱', categoria: 'Tecnologia', cor: '#ffd700', imagem: '/assets/agents/flutter.webp' },
  { id: 'deploy', nome: 'Deploy AI', papel: 'CI/CD e infraestrutura cloud', emoji: '☁️', categoria: 'Tecnologia', cor: '#a855f7', imagem: '/assets/agents/deploy.webp' },
  { id: 'hr', nome: 'HR AI', papel: 'Recursos humanos e gestão de pessoas', emoji: '🧑‍🤝‍🧑', categoria: 'Negócios', cor: '#ff6b6b', imagem: '/assets/agents/hr.webp' },
  { id: 'mercado', nome: 'Mercado', papel: 'Analista de mercado e concorrência', emoji: '🔎', categoria: 'Negócios', cor: '#00c8ff', imagem: null },
  // Agentes da camada regenerativa (Coin Max + transição energética justa)
  { id: 'biogenesis', nome: 'Coin Max AI', papel: 'Biotecnologia regenerativa e curadoria de evidência', emoji: '🧬', categoria: 'Bioeconomia', cor: '#00ff64', imagem: null },
  { id: 'energia', nome: 'Energia Justa AI', papel: 'Biodigestão, biogás e transição energética verde justa', emoji: '⚡', categoria: 'ESG', cor: '#ffd700', imagem: null },
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
  { id: 'redd_amazonia_mkt', nome: 'REDD+ Amazônia: Floresta em Pé', categoria: 'Projetos de Carbono', tons: 12500, precoPorTon: 189, padrao: 'Verra VCS', bioma: 'Amazônia', tipo: 'REDD+', verificado: true, descricao: 'Conservação de floresta nativa com monitoramento por satélite e renda comunitária.' },
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
  { id: 'n1', titulo: 'Novo edital disponível', detalhe: 'FINEP Bioeconomia 2025: R$ 200 milhões para projetos sustentáveis', tipo: 'edital' },
  { id: 'n2', titulo: 'Chamada nexBio Amazônia 2026', detalhe: 'CONFAP · Amazônia+10: R$ 107 milhões para bionegócios', tipo: 'edital' },
  { id: 'n3', titulo: 'CarbonPay ativo', detalhe: 'Calcule seu passivo e compense com créditos verificados', tipo: 'info' },
];
