// ═══════════════════════════════════════════════════════════════════════════
// BIOGENESIS COT BIOTECHNOLOGY — dossiê científico e regulatório
// Marca de plataforma: "Biogenesis COT BioTechnology".
// Identidade legal/regulatória do insumo: Fertilizante Organomineral Classe A,
// registro MAPA nº PR 002437-6.000006 (registrante: Agro Serena Ltda),
// historicamente documentado sob o nome "LOGOS". Em contexto técnico e
// regulatório citamos SEMPRE o registro legal — marca não sobrescreve registro.
//
// Cada alegação carrega o Selo de Evidência (ver science/selos.js).
// ═══════════════════════════════════════════════════════════════════════════

export const IDENTIDADE = {
  marca: 'Biogenesis COT BioTechnology',
  classe: 'Fertilizante Organomineral Classe A (bioestimulante)',
  registroMapa: 'PR 002437-6.000006',
  registrante: 'Agro Serena Ltda — CNPJ 37.931.819/0001-82',
  fabricante: 'Agroeda (constituidora e fabricante oficial da COT BioTechnology)',
  desenvolvedor: 'Dr. Luciano Paiva — Paiva Industries Inc.',
  nomeHistorico: 'LOGOS',
  aplicacao: 'Foliar, pulverizador costal manual',
  dosagem: { litrosPorHectare: 5, aplicacoesPorCiclo: 2, intervaloDias: 60 },
};

// ── Registro de evidências ────────────────────────────────────────────────
// Cada item é rastreável até um documento. `verificacao` traz o código público.
export const EVIDENCIAS = [
  {
    id: 'reg_mapa',
    categoria: 'regulatorio',
    alegacao: 'Insumo registrado no MAPA como Fertilizante Organomineral Classe A.',
    selo: 'VERIFICADO',
    fonte: 'Laudo TUXTU Conectividade Ambiental / Informação Técnica IT 036/24 — Agro Serena',
    verificacao: 'Registro MAPA nº PR 002437-6.000006',
  },
  {
    id: 'midr_pndr',
    categoria: 'institucional',
    alegacao: 'Insumo reconhecido pelo Governo Federal como instrumento da Política Nacional de Desenvolvimento Regional (PNDR), no Projeto de Fomento do INCEMA em parceria com a OCB.',
    selo: 'VERIFICADO',
    fonte: 'MIDR — Nota Informativa nº 4, de 17/07/2024, Coordenação-Geral de Sistemas Produtivos e Inovadores; assinada por Tiago Gonçalves Pereira Araujo em 05/08/2024',
    verificacao: 'Processo SEI/MIDR 5205257 · CRC 83DFD260',
  },
  {
    id: 'art_crea',
    categoria: 'regulatorio',
    alegacao: 'Responsabilidade técnica formal registrada para análise de solo e aplicação do insumo.',
    selo: 'VERIFICADO',
    fonte: 'CREA-AP — Eng. Agrônomo Marcelo Ivan Pantoja Creão (RNP 1515723313)',
    verificacao: 'ART nº AP20240087759',
  },
  {
    id: 'termo_fomento',
    categoria: 'institucional',
    alegacao: 'Programa público de fomento formalizado para distribuição do insumo à agricultura familiar do Amapá.',
    selo: 'VERIFICADO',
    fonte: 'Termo de Fomento (Lei 13.019/2014, art. 51) — INCEMA CNPJ 05.480.483/0001-92; concedente Secretaria da Pesca e Aquicultura do Amapá (CNPJ 49.751.724/0001-66)',
    verificacao: 'Valor global R$ 3.798.400,00 · execução 01/06 a 30/12/2024',
  },
  {
    id: 'acelera_amapa',
    categoria: 'institucional',
    alegacao: 'Monitoramento independente dos resultados em campo por estudantes de agronomia do IFAP, em 13 cooperativas de 7 municípios.',
    selo: 'VERIFICADO',
    fonte: 'gov.br/MDR — projeto "Cooperação, Produtividade e Sustentabilidade" no programa Acelera Amapá',
    verificacao: 'Publicação oficial do Ministério da Integração e do Desenvolvimento Regional',
  },
  {
    id: 'produtividade_mandioca',
    categoria: 'agronomico',
    alegacao: 'Produtividade de mandioca no mínimo 3× superior à área testemunha, em solo ácido (pH 5,3) sem calagem prévia e com plantas previamente acometidas por doenças fúngicas.',
    selo: 'LAUDO',
    fonte: 'Laudo Técnico de Adubação Foliar na Cultura da Mandioca — Júlio César Virdiano, Técnico em Agropecuária (CFTA 07822397656); Fazenda Quilombo do Mel, Macapá/AP; mai/2024–out/2024; 2.500 m², ~4.200 indivíduos; 4 aplicações',
    verificacao: 'Laudo assinado com delineamento, fotos e testemunha pareada',
    contexto: 'Cenário de resgate agronômico (solo degradado + estresse fitossanitário). NÃO extrapolável como ganho universal para lavouras já corrigidas e sadias.',
  },
  {
    id: 'enraizamento',
    categoria: 'agronomico',
    alegacao: 'Ganho de raízes de pelo menos 3× em relação à área sem aplicação, medido 120 dias após a segunda aplicação.',
    selo: 'LAUDO',
    fonte: 'Laudo Técnico Mandioca — coletas de campo em jan/2024',
    verificacao: 'Laudo assinado',
  },
  {
    id: 'area_foliar',
    categoria: 'agronomico',
    alegacao: 'Aumento da área foliar de no mínimo 30%, com esverdeamento e combate ao enfezamento das folhas.',
    selo: 'LAUDO',
    fonte: 'Informação Técnica IT 036/24 — Agro Serena (Dir. Sérgio Augusto Parastchuk); testes em Inajá e Mel da Pedreira (Amapá)',
    verificacao: 'Documento técnico do registrante, com vídeos e laudo de comprovação',
    contexto: 'Parâmetro-chave para o cálculo de sequestro adicional de carbono: mais área foliar → mais assimilação fotossintética → mais biomassa.',
  },
  {
    id: 'fitossanidade',
    categoria: 'agronomico',
    alegacao: 'Cessação de doenças fúngicas nos indivíduos tratados e aumento da resistência dos tecidos vegetais a fungos e bactérias; resposta visível a partir de 25 dias da aplicação.',
    selo: 'LAUDO',
    fonte: 'Laudo Técnico Mandioca + IT 036/24 + depoimentos de campo (Oiapoque, Aldeia Cacique Creuza)',
    verificacao: 'Laudo assinado e registro audiovisual',
    contexto: 'Responde diretamente ao Decreto nº 6.621/AP — emergência por surto fitossanitário na mandioca.',
  },
  {
    id: 'resiliencia_hidrica',
    categoria: 'agronomico',
    alegacao: 'Manutenção de umidade no solo e sobrevivência da cultura em estiagem prolongada — milho colhido após 58 dias sem chuva.',
    selo: 'CAMPO',
    fonte: 'IT 036/24 — Miranorte/TO, com vídeo e depoimento do agricultor',
    verificacao: 'Registro audiovisual e depoimento; sem instrumentação de umidade de solo',
    contexto: 'Alegação forte comercialmente, mas exige sensor de umidade e testemunha instrumentada para virar crédito ou métrica de MRV.',
  },
  {
    id: 'solo_seguro',
    categoria: 'ambiental',
    alegacao: 'Solo da área de cultivo em condição segura quanto a organoclorados: Aldrin <0,005, Dieldrin <0,005 e Endrin <0,001 mg/kg (abaixo do limite de detecção).',
    selo: 'LAUDO',
    fonte: 'Laudo TUXTU Conectividade Ambiental — Comunidade Inajá, Macapá/AP, 22/08/2024; método PRO-LAB-108-7.8.2-00',
    verificacao: 'Laudo assinado digitalmente + ART CREA-AP AP20240087759',
  },
  {
    id: 'solo_degradado',
    categoria: 'ambiental',
    alegacao: 'Eficácia demonstrada em solo de baixa fertilidade: pH 5,3, matéria orgânica 14,31 g/kg, saturação por bases V=18% (muito baixa), textura franco-arenosa.',
    selo: 'LAUDO',
    fonte: 'Laudo TUXTU — análise química e granulométrica de solo',
    verificacao: 'Laudo assinado',
    contexto: 'Prova de valor onde mais importa: agricultura familiar sem acesso a correção de solo.',
  },
  {
    id: 'polinizadores',
    categoria: 'ambiental',
    alegacao: 'Retorno de polinizadores em abundância em áreas tratadas (registro em florada de pitaya).',
    selo: 'CAMPO',
    fonte: 'Registro audiovisual — COT BioTechnology',
    verificacao: 'Vídeo de campo, sem contagem sistemática de polinizadores',
  },
  {
    id: 'ciclo_azul_verde',
    categoria: 'modelo',
    alegacao: 'Ciclo circular efluente → alga de alta performance → carbono azul; biomassa da alga → biofertilizante → carbono verde.',
    selo: 'ESTRATEGIA',
    fonte: 'Raízes do Futuro — apresentação institucional',
    verificacao: 'Modelo de negócio declarado; sem planta operacional auditada',
  },
  {
    id: 'ecossistema_360',
    categoria: 'modelo',
    alegacao: 'Modelo de ecossistema comunitário 360°: bioeconomia + biogestores para autonomia energética + ecoturismo regenerativo + respeito cultural.',
    selo: 'ESTRATEGIA',
    fonte: '"O Caminho para a COP30" — Paiva Industries Inc.',
    verificacao: 'Plano de ação institucional (fases 1 a 4)',
    contexto: 'Base conceitual da visão holística 360° da Sexta-Feira e do módulo de Transição Energética Justa.',
  },
  {
    id: 'mecanismo_neutrino',
    categoria: 'mecanismo',
    alegacao: 'Mecanismo proposto: interação de neutrinos (decaimento beta positivo / fusão a frio) catalisaria a quebra da cadeia de hidrogênio da água, liberando O₂ e reconstituindo moléculas de água — umedecendo o solo "de dentro para fora".',
    selo: 'HIPOTESE',
    fonte: 'Dr. Luciano Paiva — COT BioTechnology; IT 036/24',
    verificacao: 'Sem validação independente. A física estabelecida indica que neutrinos interagem apenas pela força fraca e não têm efeito químico mensurável em escala bioquímica.',
    contexto: 'Os RESULTADOS de campo são reais e documentados em laudo — e não dependem desta explicação para serem válidos. Efeitos de bioestimulantes são amplamente explicados por matéria orgânica, micronutrientes, sinalização hormonal e recuperação da biota do solo. Mantemos a hipótese registrada como agenda de pesquisa, jamais como base de alegação comercial ou de crédito.',
  },
];

export const evidenciasPorCategoria = (cat) => EVIDENCIAS.filter(e => e.categoria === cat);
export const evidencia = (id) => EVIDENCIAS.find(e => e.id === id) || null;

/** Alegações que podem ser usadas em comunicação comercial/ESG. */
export const evidenciasComunicaveis = () =>
  EVIDENCIAS.filter(e => ['VERIFICADO', 'LAUDO', 'CAMPO', 'PESQUISA', 'ESTRATEGIA'].includes(e.selo));

// ── Cenários de ganho (uplift) ────────────────────────────────────────────
// O sistema NUNCA assume o melhor caso. O cenário conservador é o padrão.
export const CENARIOS_UPLIFT = {
  conservador: {
    id: 'conservador', nome: 'Conservador (área foliar)',
    upliftProdutividade: 0.30, upliftBiomassa: 0.30, selo: 'LAUDO',
    base: 'Ganho de 30% de área foliar documentado em laudo, transposto 1:1 para produtividade e biomassa. É o piso defensável.',
  },
  moderado: {
    id: 'moderado', nome: 'Moderado (solo em recuperação)',
    upliftProdutividade: 0.80, upliftBiomassa: 0.70, selo: 'CAMPO',
    base: 'Interpolação entre o ganho de área foliar e o resultado de resgate em solo degradado. Exige MRV para uso em crédito.',
  },
  resgate: {
    id: 'resgate', nome: 'Resgate agronômico (laudo mandioca)',
    upliftProdutividade: 2.00, upliftBiomassa: 2.00, selo: 'LAUDO',
    base: 'Produtividade 3× (ganho de +200%) medida em solo ácido não corrigido com estresse fitossanitário — Fazenda Quilombo do Mel, Macapá/AP. Aplicável apenas a cenários equivalentes de degradação.',
  },
};

// ── Parâmetros agronômicos por cultura ────────────────────────────────────
// produtividade: t/ha (base regional/nacional, IBGE/Embrapa — selo PESQUISA)
// residuo: razão resíduo agrícola : produto colhido (base seca aproveitável)
// kcalKg: densidade energética alimentar do produto (kcal/kg)
// precoTon: R$/t (referência, parametrizável pelo usuário)
export const CULTURAS = {
  mandioca:   { nome: 'Mandioca',      produtividade: 14.5, residuo: 0.60, kcalKg: 1600, precoTon: 700,  emoji: '🍠', prioridadeAmapa: true },
  milho:      { nome: 'Milho',         produtividade: 5.5,  residuo: 1.00, kcalKg: 3650, precoTon: 1100, emoji: '🌽' },
  soja:       { nome: 'Soja',          produtividade: 3.5,  residuo: 1.10, kcalKg: 4460, precoTon: 2000, emoji: '🫘' },
  banana:     { nome: 'Banana',        produtividade: 14.0, residuo: 3.00, kcalKg: 890,  precoTon: 1500, emoji: '🍌', prioridadeAmapa: true },
  abacaxi:    { nome: 'Abacaxi',       produtividade: 35.0, residuo: 1.20, kcalKg: 500,  precoTon: 1200, emoji: '🍍', prioridadeAmapa: true },
  cacau:      { nome: 'Cacau',         produtividade: 0.6,  residuo: 6.00, kcalKg: 2280, precoTon: 18000, emoji: '🍫', prioridadeAmapa: true },
  cupuacu:    { nome: 'Cupuaçu',       produtividade: 5.0,  residuo: 2.50, kcalKg: 490,  precoTon: 2500, emoji: '🥥', prioridadeAmapa: true },
  acai:       { nome: 'Açaí',          produtividade: 6.0,  residuo: 2.00, kcalKg: 800,  precoTon: 3000, emoji: '🫐', prioridadeAmapa: true },
  laranja:    { nome: 'Laranja',       produtividade: 25.0, residuo: 0.50, kcalKg: 470,  precoTon: 900,  emoji: '🍊' },
  melancia:   { nome: 'Melancia',      produtividade: 25.0, residuo: 0.40, kcalKg: 300,  precoTon: 800,  emoji: '🍉' },
  hortalicas: { nome: 'Hortaliças',    produtividade: 20.0, residuo: 0.80, kcalKg: 250,  precoTon: 1800, emoji: '🥬' },
  cana:       { nome: 'Cana-de-açúcar', produtividade: 75.0, residuo: 0.30, kcalKg: 300, precoTon: 200,  emoji: '🎋' },
  pitaya:     { nome: 'Pitaya',        produtividade: 12.0, residuo: 1.00, kcalKg: 600,  precoTon: 6000, emoji: '🐲' },
  baunilha:   { nome: 'Baunilha',      produtividade: 0.5,  residuo: 3.00, kcalKg: 2880, precoTon: 250000, emoji: '🌼' },
  pasto:      { nome: 'Pastagem',      produtividade: 10.0, residuo: 0.20, kcalKg: 0,    precoTon: 300,  emoji: '🌾' },
};

export const culturasLista = () =>
  Object.entries(CULTURAS).map(([id, c]) => ({ id, ...c }));
