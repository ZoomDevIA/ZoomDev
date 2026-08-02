// Calculadora de Passivo Ambiental: metodologia GHG Protocol (escopos 1, 2 e 3)
// Fatores de emissão com fontes documentadas em docs/mercado-carbono.md.
// IMPORTANTE: fatores são estimativas para triagem de PMEs/startups; inventários
// oficiais devem usar a ferramenta do Programa Brasileiro GHG Protocol (FGVces).

export const FATORES = {
  // Escopo 2: eletricidade (fator médio anual do SIN, MCTI/SIRENE 2023)
  eletricidade_tco2_por_mwh: 0.0385,
  // Escopo 1: combustão direta (kgCO2e/litro, ajustado à mistura obrigatória BR)
  gasolina_kg_por_litro: 2.2,
  diesel_kg_por_litro: 2.6,
  etanol_kg_por_litro: 0.4, // biogênico majoritário; residual fóssil da cadeia
  glp_kg_por_botijao13: 37.4,
  // Escopo 3: viagens e frete (aproximações DEFRA/ICAO)
  voo_domestico_kg_por_hora: 110,
  voo_internacional_kg_por_hora: 90,
  carro_app_kg_por_km: 0.18,
  frete_rodoviario_kg_por_tkm: 0.11,
  // Escopo 3: operação digital/escritório (aproximações spend/atividade)
  funcionario_escritorio_kg_por_mes: 65,   // energia comum, resíduos, commuting médio
  funcionario_remoto_kg_por_mes: 25,
  nuvem_kg_por_1000_reais_mes: 30,         // spend-based aproximado p/ cloud no BR
};

// Projetos de compensação disponíveis no CarbonPay (preços em R$/tCO2e: faixas
// de mercado 2025-26; ver docs/mercado-carbono.md). Marketplace demo: a venda real
// exige aposentadoria em registro (Verra/Gold Standard) com certificado público.
export const PROJETOS_CARBONPAY = [
  {
    id: 'redd_amazonia',
    nome: 'REDD+ Floresta Amazônica em Pé',
    tipo: 'REDD+ (conservação florestal)',
    padrao: 'VCS (Verra): alta qualidade',
    precoPorTon: 89,
    local: 'Amazônia, Brasil',
    descricao: 'Conservação de floresta nativa com renda para comunidades locais e monitoramento por satélite.',
    cobeneficios: ['Biodiversidade', 'Renda comunitária', 'ODS 13 e 15'],
  },
  {
    id: 'arr_restauracao',
    nome: 'Restauração Agroflorestal (ARR)',
    tipo: 'ARR (reflorestamento/restauração)',
    padrao: 'Gold Standard',
    precoPorTon: 132,
    local: 'Pará, Brasil',
    descricao: 'Plantio de espécies nativas em sistemas agroflorestais com agricultores familiares.',
    cobeneficios: ['Remoção de carbono', 'Segurança alimentar', 'ODS 8, 13 e 15'],
  },
  {
    id: 'cookstoves',
    nome: 'Fogões Eficientes Comunidades Ribeirinhas',
    tipo: 'Cookstoves (eficiência energética)',
    padrao: 'Gold Standard',
    precoPorTon: 38,
    local: 'Amazonas, Brasil',
    descricao: 'Substituição de fogões a lenha por modelos eficientes, reduzindo desmatamento e problemas respiratórios.',
    cobeneficios: ['Saúde', 'Redução do desmatamento', 'ODS 3 e 7'],
  },
];

/**
 * @deprecated Substituída por services/passivoAmbiental.js (perfis setoriais,
 * módulo agro e faixa de incerteza). Mantida apenas para compatibilidade.
 */
export function calcularPassivoLegado(dados) {
  const n = (v) => Math.max(0, Number(v) || 0);
  const F = FATORES;

  // Escopo 1: combustão direta da frota/geradores
  const escopo1kg =
    (n(dados.gasolinaLitrosMes) * F.gasolina_kg_por_litro +
      n(dados.dieselLitrosMes) * F.diesel_kg_por_litro +
      n(dados.etanolLitrosMes) * F.etanol_kg_por_litro +
      n(dados.glpBotijoesMes) * F.glp_kg_por_botijao13) * 12;

  // Escopo 2: eletricidade comprada (kWh → MWh × fator SIN)
  const escopo2kg = (n(dados.energiaKwhMes) / 1000) * F.eletricidade_tco2_por_mwh * 1000 * 12;

  // Escopo 3: viagens, frete, time e nuvem
  const escopo3kg =
    (n(dados.vooDomesticoHorasAno) * F.voo_domestico_kg_por_hora) +
    (n(dados.vooInternacionalHorasAno) * F.voo_internacional_kg_por_hora) +
    (n(dados.carroAppKmMes) * F.carro_app_kg_por_km * 12) +
    (n(dados.freteTonKmMes) * F.frete_rodoviario_kg_por_tkm * 12) +
    (n(dados.funcionariosEscritorio) * F.funcionario_escritorio_kg_por_mes * 12) +
    (n(dados.funcionariosRemotos) * F.funcionario_remoto_kg_por_mes * 12) +
    (n(dados.gastoNuvemReaisMes) / 1000) * F.nuvem_kg_por_1000_reais_mes * 12;

  const totalKg = escopo1kg + escopo2kg + escopo3kg;
  const totalTon = totalKg / 1000;
  // Margem de segurança de 20% recomendada para compensação (incerteza de triagem)
  const tonCompensacao = Math.ceil(totalTon * 1.2 * 10) / 10;

  return {
    metodologia: 'GHG Protocol (triagem simplificada): fatores MCTI/SIRENE 2023 e DEFRA/ICAO',
    escopos: {
      escopo1: { tco2e: round2(escopo1kg / 1000), descricao: 'Emissões diretas: combustíveis da frota e geradores' },
      escopo2: { tco2e: round2(escopo2kg / 1000), descricao: 'Energia elétrica comprada (fator SIN/MCTI 0,0385 tCO2/MWh)' },
      escopo3: { tco2e: round2(escopo3kg / 1000), descricao: 'Cadeia de valor: viagens, frete, time e nuvem' },
    },
    totalTco2eAno: round2(totalTon),
    tonParaCompensar: tonCompensacao,
    equivalencias: {
      voosSpNy: Math.round(totalTon / 1.1) || 0,
      arvoresPorAno: Math.round(totalTon * 7),
      kmDeCarro: Math.round(totalKg / 0.18),
    },
    opcoesCompensacao: PROJETOS_CARBONPAY.map(p => ({
      ...p,
      custoTotal: round2(tonCompensacao * p.precoPorTon),
    })),
    avisos: [
      'Estimativa de triagem, para inventário oficial use a ferramenta do Programa Brasileiro GHG Protocol (FGVces).',
      'Compensação recomendada com 20% de margem sobre o total estimado.',
      'Conforme CONAR/ISO 14068-1: comunique como "emissões compensadas com créditos verificados", nunca "carbono neutro" genérico. Priorize reduzir antes de compensar.',
    ],
  };
}

function round2(v) { return Math.round(v * 100) / 100; }

// ═══════════════════════════════════════════════════════════════════════════
// SEQUESTRO ADICIONAL COM BIOGENESIS COT BIOTECHNOLOGY
// Integra o ganho de biomassa (documentado em laudo) à calculadora de carbono.
// SEMPRE em modo ESTIMATIVA. A conversão em crédito exige MRV + verificação.
// ═══════════════════════════════════════════════════════════════════════════
import { simular360 } from './impactoRegenerativo.js';
import { CULTURAS, CENARIOS_UPLIFT } from '../science/biogenesis.js';

export const CULTURAS_BIOGENESIS = Object.entries(CULTURAS).map(([id, c]) => ({
  id, nome: c.nome, emoji: c.emoji, prioridadeAmapa: Boolean(c.prioridadeAmapa),
}));

export const CENARIOS_BIOGENESIS = Object.values(CENARIOS_UPLIFT).map(c => ({
  id: c.id, nome: c.nome, base: c.base, selo: c.selo,
  upliftPercentual: Math.round(c.upliftProdutividade * 100),
}));

/**
 * Calcula quanto do passivo (tCO2e/ano) pode ser compensado por uma área
 * cultivada com Biogenesis, apresentando as duas leituras separadas:
 * ESTIMATIVA (o que a área faz) e CRÉDITO VERIFICÁVEL (o que exige MRV).
 */
export function sequestroBiogenesis({ culturaId, hectares, cenarioId = 'conservador', passivoTco2eAno = 0 }) {
  const sim = simular360({ culturaId, hectares, cenarioId });
  const sequestro = sim.dimensoes.carbono.co2eSequestradoTonAno;
  const evitado = sim.dimensoes.energetico.co2EvitadoTonAno;
  const totalMitigado = round2(sequestro + evitado);
  const passivo = Math.max(0, Number(passivoTco2eAno) || 0);

  return {
    insumo: 'Biogenesis COT BioTechnology',
    cultura: sim.dimensoes.carbono.cultura,
    cenario: sim.entrada.cenario,
    modo: 'ESTIMATIVA',
    sequestroAdicionalTonAno: sequestro,
    emissaoEvitadaTonAno: evitado,
    totalMitigadoTonAno: totalMitigado,
    coberturaDoPassivo: passivo > 0 ? Math.min(100, Math.round((totalMitigado / passivo) * 100)) : null,
    credito: {
      modo: 'CRÉDITO VERIFICÁVEL',
      elegivel: false,
      requisitos: ['MRV instrumentado (sensores + satélite)', 'Verificação por terceira parte acreditada', 'Aposentadoria em registro público', 'Avaliação de adicionalidade e permanência'],
    },
    disclaimer: sim.conformidade,
    selo: sim.selo,
  };
}
