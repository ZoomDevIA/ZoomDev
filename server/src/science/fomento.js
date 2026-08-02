// ═══════════════════════════════════════════════════════════════════════════
// PROGRAMA DE FOMENTO INCEMA × OCB × PNDR/MIDR — dados reais do ecossistema
// Fonte primária: Termo de Fomento (Lei 13.019/2014), Plano de Trabalho do
// Protocolo de Intenções e Nota Informativa nº 4/2024 do MIDR (SEI 5205257).
//
// Este é o caso-âncora da ZoomDev: um programa público real, com recurso,
// beneficiários e território definidos. Serve de linha de base para o Motor
// de Impacto Regenerativo e de prova viva de bioeconomia com inclusão social.
// ═══════════════════════════════════════════════════════════════════════════

export const PROGRAMA = {
  id: 'incema_ocb_2024',
  nome: 'Projeto de Fomento INCEMA — Organomineral para a Agricultura Familiar',
  objeto: 'Utilização de organomineral para aumento de produção de grandes e pequenos produtores da agricultura familiar',
  instrumento: 'Termo de Fomento — Lei nº 13.019/2014 (MROSC), art. 51',
  executor: {
    nome: 'INCEMA — Instituto Cultural Educacional Amazônia',
    cnpj: '05.480.483/0001-92',
    natureza: 'Organização da Sociedade Civil (OSC)',
    fundacao: '1999-02-12',
    presidencia: 'Dayla Cybele Avelar Nunes',
    sede: 'Macapá/AP',
  },
  concedente: {
    nome: 'Secretaria da Pesca e Aquicultura do Estado do Amapá',
    cnpj: '49.751.724/0001-66',
    responsavel: 'Francisco Paulo Nogueira de Souza',
  },
  execucaoFinanceira: 'OCB — Sistema de Cooperativas do Amapá e cooperativas filiadas',
  politicaPublica: 'PNDR — Política Nacional de Desenvolvimento Regional (MIDR)',
  valorGlobal: 3798400,
  vigencia: { inicio: '2024-06-01', fim: '2024-12-30' },
  selo: 'VERIFICADO',
  verificacao: 'Processo SEI/MIDR 5205257 · CRC 83DFD260 · Nota Informativa nº 4 de 17/07/2024',
  motivacao: 'Decreto estadual nº 6.621/AP — emergência por surto fitossanitário na cultura da mandioca',
};

// Orçamento aprovado (metas do Plano de Trabalho)
export const ORCAMENTO = [
  { meta: 1, descricao: 'Comunicação, material educativo e registro audiovisual', valor: 100000, percentual: 2.63 },
  { meta: 2, descricao: 'Fornecimento do organomineral (17.220 L) com capacitação de técnicos e agricultores', valor: 2410800, percentual: 63.47 },
  { meta: 3, descricao: 'Equipe técnica, coordenação, projetista e contabilidade', valor: 427600, percentual: 11.26 },
  { meta: 4, descricao: 'Logística de campo (veículos para a equipe técnica)', valor: 360000, percentual: 9.48 },
  { meta: 5, descricao: 'Despesas administrativas e jurídicas', valor: 500000, percentual: 13.16 },
];

export const INSUMO = {
  litrosContratados: 17220,
  precoLitro: 140,
  litrosPorHectare: 5,
  // 17.220 L ÷ 5 L/ha = 3.444 hectares-aplicação
  hectaresAplicacao: 3444,
  custoPorHectareAplicacao: 700,
};

// 17 entidades beneficiárias nominadas no Plano de Trabalho
export const ENTIDADES = [
  { sigla: 'COMAGRO', nome: 'Cooperativa Mista Agropecuária Amapaense', tipo: 'cooperativa' },
  { sigla: 'COOPASETI', nome: 'Cooperativa dos Produtores Agropecuários da Comunidade de Sete Ilhas', tipo: 'cooperativa' },
  { sigla: 'Quilombo Alimentos', nome: 'Cooperativa Agroindustrial do Mel da Pedreira', tipo: 'cooperativa', quilombola: true },
  { sigla: 'AGROPORTO', nome: 'Cooperativa Agrícola da Gleba do Matapi', tipo: 'cooperativa' },
  { sigla: 'AGROCAL', nome: 'Cooperativa Agroextrativista de Calçoene', tipo: 'cooperativa', extrativista: true },
  { sigla: 'AGROVIDA', nome: 'Cooperativa dos Produtores Rurais do Estado do Amapá', tipo: 'cooperativa' },
  { sigla: 'CAMAIPI', nome: 'Cooperativa dos Produtores da Amazônia', tipo: 'cooperativa' },
  { sigla: 'COOPEAM', nome: 'Cooperativa dos Produtores Extrativistas da Amazônia', tipo: 'cooperativa', extrativista: true },
  { sigla: 'COOPMARACÁ', nome: 'Cooperativa dos Produtores do Maracá', tipo: 'cooperativa' },
  { sigla: 'COAMP', nome: 'Cooperativa Agroextrativista dos Produtores do Município de Porto Grande', tipo: 'cooperativa', extrativista: true },
  { sigla: 'AGROSSAN', nome: 'Cooperativa dos Produtores Agroextrativistas das Ilhas de Santana', tipo: 'cooperativa', extrativista: true },
  { sigla: 'COOPVITÓRIA', nome: 'Cooperativa de Pesca, Pecuária e Extrativismo do Sul do Amapá', tipo: 'cooperativa', extrativista: true },
  { sigla: 'COOPERCEDRO', nome: 'Cooperativa Mista Agropecuária de Industrial do Cedro', tipo: 'cooperativa' },
  { sigla: 'Vila Velha', nome: 'Associação Quilombola de Vila Velha', tipo: 'associacao', quilombola: true },
  { sigla: 'Instituto Dorcas', nome: 'Instituto Dorcas de Vila Vitória', tipo: 'instituto' },
  { sigla: 'Oiapoque', nome: 'Associação de Produtores de Oiapoque', tipo: 'associacao', indigena: true },
  { sigla: 'Cassiporé', nome: 'Associação de Produtores do Cassiporé', tipo: 'associacao', indigena: true },
];

// Culturas e área do Plano de Trabalho
export const CULTURAS_PROGRAMA = [
  { cultura: 'mandioca', hectares: 735 },
  { cultura: 'banana', hectares: 220 },
  { cultura: 'abacaxi', hectares: 137 },
  { cultura: 'cupuacu', hectares: 117 },
  { cultura: 'hortalicas', hectares: 96 },
  { cultura: 'melancia', hectares: 94 },
  { cultura: 'cacau', hectares: 56 },
  { cultura: 'laranja', hectares: 15 },
  { cultura: 'outras', hectares: 38 },
];

export const BENEFICIARIOS = {
  entidades: 17,
  familias: 732,
  // O Plano de Trabalho declara 1.148 ha; a soma das culturas listadas resulta em 1.508 ha.
  hectaresDeclarados: 1148,
  hectaresSomaCulturas: CULTURAS_PROGRAMA.reduce((s, c) => s + c.hectares, 0),
  publicosPrioritarios: ['Agricultura familiar', 'Comunidades quilombolas', 'Comunidades indígenas', 'Extrativistas', 'Pequenos e médios produtores'],
};

/**
 * Divergência documental detectada pelo Selo de Evidência.
 * A plataforma nunca "escolhe" silenciosamente um número: ela expõe o conflito
 * e adota o mais conservador até que a fonte primária seja reconciliada.
 */
export const INCONSISTENCIAS = [
  {
    id: 'ha_programa',
    campo: 'Área total do programa',
    declarado: 1148,
    calculado: BENEFICIARIOS.hectaresSomaCulturas,
    unidade: 'hectares',
    fonte: 'Plano de Trabalho do Protocolo de Intenções — INCEMA',
    tratamento: 'Adotamos o valor declarado (1.148 ha) por ser o mais conservador. Recomenda-se reconciliar com o concedente antes de qualquer uso em MRV ou emissão de crédito.',
  },
];

// Produção agrícola do Amapá (referência de escala estadual — fonte IBGE citada no Termo)
export const AMAPA_IBGE = {
  fonte: 'IBGE — Produção Agropecuária',
  selo: 'PESQUISA',
  culturas: [
    { cultura: 'mandioca', hectares: 11385 },
    { cultura: 'soja', hectares: 6500 },
    { cultura: 'milho', hectares: 2500 },
    { cultura: 'banana', hectares: 1901 },
    { cultura: 'abacaxi', hectares: 1320 },
    { cultura: 'laranja', hectares: 590 },
    { cultura: 'melancia', hectares: 471 },
    { cultura: 'cana', hectares: 280 },
  ],
  get total() { return this.culturas.reduce((s, c) => s + c.hectares, 0); }, // 24.947 ha
};

// Monitoramento independente — Acelera Amapá (gov.br/MDR)
export const MONITORAMENTO = {
  programa: 'Acelera Amapá — projeto "Cooperação, Produtividade e Sustentabilidade"',
  instituicao: 'IFAP — Instituto Federal do Amapá, campus Porto Grande',
  estudantes: 9,
  estudantesCapacitadosPrograma: 600,
  cooperativasMonitoradas: 13,
  municipios: 7,
  metodo: 'Duplas de estudantes de agronomia acompanham presencialmente cada cooperativa e analisam os resultados em campo',
  selo: 'VERIFICADO',
  fonte: 'gov.br/MDR — Ministério da Integração e do Desenvolvimento Regional',
  relevancia: 'Monitoramento por instituição de ensino federal, independente do fabricante — insumo essencial para credibilidade de MRV.',
};

// Pilares de impacto declarados no Termo e na Nota Informativa do MIDR
export const PILARES_PNDR = [
  { id: 'economia_local', nome: 'Fortalecimento da economia local', descricao: 'Aumento de produtividade e renda dos produtores, com efeito multiplicador na cadeia de valor regional.', fonte: 'Nota Informativa MIDR nº 4/2024' },
  { id: 'inclusao_social', nome: 'Inclusão social', descricao: 'Oportunidades de trabalho e renda para comunidades rurais em vulnerabilidade, com foco em quilombolas e indígenas.', fonte: 'Nota Informativa MIDR nº 4/2024' },
  { id: 'capacitacao', nome: 'Capacitação e cooperativismo', descricao: 'Workshops e formação técnica e gerencial, fortalecendo redes cooperativas de apoio mútuo.', fonte: 'Nota Informativa MIDR nº 4/2024' },
  { id: 'seguranca_alimentar', nome: 'Segurança alimentar', descricao: 'Maior disponibilidade e acessibilidade de alimentos nutritivos para as comunidades locais.', fonte: 'Plano de Trabalho INCEMA' },
  { id: 'resiliencia_ambiental', nome: 'Resiliência ambiental', descricao: 'Práticas agrícolas sustentáveis, preservação da biodiversidade e mitigação de impactos climáticos.', fonte: 'Plano de Trabalho INCEMA' },
  { id: 'equidade', nome: 'Equidade social', descricao: 'Redução de desigualdades por distribuição mais justa dos resultados econômicos.', fonte: 'Plano de Trabalho INCEMA' },
];

/** Resumo consolidado do programa para dashboards e relatórios. */
export function resumoPrograma() {
  return {
    programa: PROGRAMA,
    orcamento: ORCAMENTO,
    insumo: INSUMO,
    beneficiarios: BENEFICIARIOS,
    entidades: ENTIDADES,
    culturas: CULTURAS_PROGRAMA,
    monitoramento: MONITORAMENTO,
    pilares: PILARES_PNDR,
    inconsistencias: INCONSISTENCIAS,
    amapa: { fonte: AMAPA_IBGE.fonte, totalHectares: AMAPA_IBGE.total, culturas: AMAPA_IBGE.culturas },
    cobertura: {
      // Quanto da agricultura mapeada do Amapá o programa alcança
      percentualEstado: Math.round((BENEFICIARIOS.hectaresDeclarados / AMAPA_IBGE.total) * 1000) / 10,
      entidadesQuilombolasIndigenas: ENTIDADES.filter(e => e.quilombola || e.indigena).length,
      entidadesExtrativistas: ENTIDADES.filter(e => e.extrativista).length,
    },
  };
}
