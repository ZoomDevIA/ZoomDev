// ═══════════════════════════════════════════════════════════════════════════
// BIOGENESIS COT BIOTECHNOLOGY: perfil técnico da tecnologia
//
// Base científica destilada do acervo interno (ver science/corpus.js).
// Este módulo expõe apenas CONHECIMENTO TÉCNICO e níveis de confiança:
// nunca a origem documental, entidades, valores ou códigos de processo.
// ═══════════════════════════════════════════════════════════════════════════
import { PROTOCOLO, RESPOSTA_POR_SOLO, EFEITOS } from './corpus.js';

export const IDENTIDADE = {
  marca: 'Biogenesis COT BioTechnology',
  classe: 'Bioestimulante organomineral de aplicação foliar',
  natureza: 'Composto orgânico bioestimulante com nutrientes minerais',
  regularizacao: 'Insumo agrícola regularizado no órgão federal competente',
  aplicacao: `${PROTOCOLO.litrosPorHectare} L/ha · ${PROTOCOLO.aplicacoesPorCiclo} aplicações por ciclo · intervalo de ${PROTOCOLO.intervaloDias} dias · via ${PROTOCOLO.via}`,
  diferencial: 'A resposta é inversamente proporcional à qualidade inicial do solo: quanto mais degradada a área, maior o ganho. É uma tecnologia de regeneração, não de otimização marginal.',
};

/**
 * Efeitos técnicos comunicáveis: cada um com seu nível de confiança.
 * Nenhuma referência a documento, laudo específico, localidade ou instituição.
 */
export const EFEITOS_TECNICOS = [
  {
    id: 'area_foliar',
    efeito: 'Aumento da área foliar a partir de 30%, com maior captação de energia solar e intensificação da fotossíntese.',
    selo: 'LAUDO',
    relevancia: 'Base física do sequestro adicional de carbono: mais área foliar significa mais assimilação e mais biomassa.',
  },
  {
    id: 'produtividade',
    efeito: 'Ganho de produtividade que varia com a condição do solo, de cerca de 30% em áreas já corrigidas até o triplo da testemunha em solos ácidos não corrigidos.',
    selo: 'LAUDO',
    relevancia: 'O ganho máximo ocorre exatamente onde a agricultura familiar mais sofre: solo pobre e sem acesso a correção.',
  },
  {
    id: 'enraizamento',
    efeito: 'Sistema radicular significativamente mais desenvolvido, com raízes acessando camadas mais profundas do solo.',
    selo: 'LAUDO',
    relevancia: 'Raiz profunda é resiliência: acessa água e nutrientes indisponíveis na superfície.',
  },
  {
    id: 'fitossanidade',
    efeito: 'Aumento da resistência dos tecidos vegetais a fungos e bactérias, com resposta visível em torno de 25 dias após a aplicação.',
    selo: 'LAUDO',
    relevancia: 'Reduz dependência de defensivos e responde a emergências fitossanitárias.',
  },
  {
    id: 'resiliencia_hidrica',
    efeito: 'Manutenção de umidade no solo e sobrevivência da cultura em estiagem prolongada, com casos observados de quase dois meses sem chuva.',
    selo: 'CAMPO',
    relevancia: 'Adaptação climática direta. Para virar métrica de MRV exige sensor de umidade e testemunha instrumentada.',
  },
  {
    id: 'biota',
    efeito: 'Recuperação da vida do solo e retorno de polinizadores em áreas tratadas.',
    selo: 'CAMPO',
    relevancia: 'Serviço ecossistêmico com efeito sobre biodiversidade e produtividade de longo prazo.',
  },
  {
    id: 'solo_seguro',
    efeito: 'Ausência de contaminação por organoclorados nas áreas analisadas, com resultados abaixo do limite de detecção.',
    selo: 'LAUDO',
    relevancia: 'Requisito para certificação orgânica e acesso a mercados exigentes.',
  },
  {
    id: 'mecanismo',
    efeito: 'O desenvolvedor propõe que partículas subatômicas catalisariam a dinâmica da água na planta, umedecendo o solo de dentro para fora.',
    selo: 'HIPOTESE',
    relevancia: 'MECANISMO EM INVESTIGAÇÃO: não sustenta alegação comercial nem cálculo de crédito. Os efeitos medidos em campo são válidos independentemente desta explicação, e são amplamente compatíveis com a ação conhecida de bioestimulantes (matéria orgânica, micronutrientes, sinalização hormonal e recuperação da biota).',
  },
];

/** Alegações liberadas para comunicação (exclui hipótese e visão). */
export const efeitosComunicaveis = () =>
  EFEITOS_TECNICOS.filter(e => !['HIPOTESE', 'VISAO'].includes(e.selo));

// Cenários de ganho expostos ao usuário, derivados da curva de resposta do corpus
export const CENARIOS_UPLIFT = {
  conservador: {
    id: 'conservador', nome: 'Solo corrigido e manejado',
    upliftProdutividade: RESPOSTA_POR_SOLO.corrigido.upliftProdutividade,
    upliftBiomassa: RESPOSTA_POR_SOLO.corrigido.upliftBiomassa,
    selo: RESPOSTA_POR_SOLO.corrigido.confianca,
    faixaIncerteza: RESPOSTA_POR_SOLO.corrigido.faixaIncerteza,
    base: 'Piso defensável, ancorado no ganho mínimo de área foliar. Use quando a lavoura já está corrigida e sadia.',
  },
  moderado: {
    id: 'moderado', nome: 'Solo em recuperação',
    upliftProdutividade: RESPOSTA_POR_SOLO.recuperacao.upliftProdutividade,
    upliftBiomassa: RESPOSTA_POR_SOLO.recuperacao.upliftBiomassa,
    selo: RESPOSTA_POR_SOLO.recuperacao.confianca,
    faixaIncerteza: RESPOSTA_POR_SOLO.recuperacao.faixaIncerteza,
    base: 'Solo parcialmente corrigido, sem estresse agudo. Exige MRV instrumentado para uso em crédito de carbono.',
  },
  resgate: {
    id: 'resgate', nome: 'Solo degradado (resgate)',
    upliftProdutividade: RESPOSTA_POR_SOLO.degradado.upliftProdutividade,
    upliftBiomassa: RESPOSTA_POR_SOLO.degradado.upliftBiomassa,
    selo: RESPOSTA_POR_SOLO.degradado.confianca,
    faixaIncerteza: RESPOSTA_POR_SOLO.degradado.faixaIncerteza,
    base: 'Solo ácido não corrigido com estresse fitossanitário. É onde a tecnologia entrega o maior ganho, e onde a agricultura familiar mais precisa.',
  },
};

// ── Parâmetros agronômicos por cultura ────────────────────────────────────
// produtividade: t/ha · residuo: razão resíduo:produto · kcalKg · precoTon (R$/t)
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

export const culturasLista = () => Object.entries(CULTURAS).map(([id, c]) => ({ id, ...c }));
export { PROTOCOLO, EFEITOS };
