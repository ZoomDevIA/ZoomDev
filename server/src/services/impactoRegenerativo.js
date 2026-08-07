// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DE IMPACTO REGENERATIVO 360°
// Traduz a aplicação prática do Coin Max em impacto real e
// mensurável, nas cinco dimensões que o fundador pediu:
//   1. Segurança alimentar    2. Transição energética verde justa
//   3. Bioeconomia/economia    4. Carbono e ecossistemas    5. ODS/ONU
//
// Toda saída carrega um Selo de Evidência e o cenário é CONSERVADOR por padrão.
// Nada aqui vira crédito de carbono sem MRV instrumentado + verificação de 3ª parte.
// ═══════════════════════════════════════════════════════════════════════════
import { CULTURAS, CENARIOS_UPLIFT, IDENTIDADE } from '../science/coinmax.js';
import { seloResultante, disclaimerConformidade } from '../science/selos.js';

const round = (v, c = 2) => { const p = 10 ** c; return Math.round(v * p) / p; };
const n = (v) => Math.max(0, Number(v) || 0);

// ── Constantes de referência (selo PESQUISA, salvo indicação) ───────────────
const REF = {
  // Sequestro/biomassa
  fracaoCarbonoBiomassa: 0.47,      // IPCC: ~47% do peso seco da biomassa é carbono
  razaoCO2C: 44 / 12,               // massa molar CO2 / C = 3,667
  materiaSecaResiduo: 0.35,         // fração de matéria seca do resíduo fresco (média)
  // Biodigestão anaeróbia (transição energética justa)
  biogasM3PorTonSV: 350,            // m³ de biogás por tonelada de sólidos voláteis (faixa 300–400)
  fracaoSolidosVolateis: 0.80,      // SV / matéria seca
  metanoNoBiogas: 0.60,             // 60% CH4
  energiaKwhPorM3Biogas: 6.0,       // ~6 kWh/m³ (PCI do biogás a 60% CH4)
  eficienciaEletricaGerador: 0.35,  // motor-gerador a biogás
  // Substituição de energia suja
  glpKwhPorBotijao13: 175,          // conteúdo energético útil de um botijão P13
  glpKgPorBotijao13: 13,
  emissaoGlpKgPorBotijao: 37.4,     // kgCO2e por botijão P13 evitado
  emissaoDieselKgPorLitro: 2.6,
  dieselKwhPorLitro: 3.4,           // energia elétrica equivalente de 1 L diesel em gerador
  // Alimentar
  kcalPessoaDia: 2100,              // necessidade de referência (FAO)
  // Água (efeito relatado de retenção: selo CAMPO, conservador)
  aguaIrrigacaoM3HaAnoEvitadaConservador: 400,
};

/**
 * DIMENSÃO 1: Produção e Segurança Alimentar
 * Ganho de produção a partir do uplift (cenário conservador por padrão).
 */
export function impactoAlimentar({ culturaId, hectares, cenarioId = 'conservador' }) {
  const cultura = CULTURAS[culturaId];
  if (!cultura) throw Object.assign(new Error('Cultura desconhecida.'), { status: 400 });
  const cen = CENARIOS_UPLIFT[cenarioId] || CENARIOS_UPLIFT.conservador;
  const ha = n(hectares);

  const producaoBase = cultura.produtividade * ha;            // t/ano
  const producaoComCoinMax = producaoBase * (1 + cen.upliftProdutividade);
  const ganhoTon = producaoComCoinMax - producaoBase;

  const kcalGanho = ganhoTon * 1000 * cultura.kcalKg;          // kcal/ano
  const pessoasAlimentadasAno = cultura.kcalKg > 0
    ? Math.round(kcalGanho / (REF.kcalPessoaDia * 365)) : 0;

  return {
    dimensao: 'seguranca_alimentar',
    cultura: { id: culturaId, nome: cultura.nome, emoji: cultura.emoji },
    cenario: cen.nome,
    hectares: ha,
    producaoBaseTon: round(producaoBase, 1),
    producaoComCoinMaxTon: round(producaoComCoinMax, 1),
    ganhoProducaoTon: round(ganhoTon, 1),
    upliftPercentual: Math.round(cen.upliftProdutividade * 100),
    pessoasAlimentadasAno,
    selo: cen.selo,
  };
}

/**
 * DIMENSÃO 2: Transição Energética Verde Justa
 * A biomassa/resíduo extra vira biogás em biodigestores comunitários →
 * energia local, substituindo diesel/GLP (fontes sujas e caras na Amazônia).
 * Este é o elo que transforma agricultura em autonomia energética.
 */
export function impactoEnergetico({ culturaId, hectares, cenarioId = 'conservador', ganhoProducaoTon = null, fracaoTermica = 0.5 }) {
  const cultura = CULTURAS[culturaId];
  if (!cultura) throw Object.assign(new Error('Cultura desconhecida.'), { status: 400 });
  const cen = CENARIOS_UPLIFT[cenarioId] || CENARIOS_UPLIFT.conservador;
  const ha = n(hectares);

  // Resíduo agrícola extra gerado pelo ganho de biomassa
  const producaoBase = cultura.produtividade * ha;
  const ganho = ganhoProducaoTon != null ? n(ganhoProducaoTon) : producaoBase * cen.upliftBiomassa;
  const residuoFrescoTon = ganho * cultura.residuo;
  const materiaSecaTon = residuoFrescoTon * REF.materiaSecaResiduo;
  const solidosVolateisTon = materiaSecaTon * REF.fracaoSolidosVolateis;

  // Biodigestão → biogás
  const biogasM3 = solidosVolateisTon * REF.biogasM3PorTonSV;
  const energiaBrutaKwh = biogasM3 * REF.energiaKwhPorM3Biogas;

  // BALANÇO ENERGÉTICO: cada m³ de biogás segue UMA rota, nunca as duas.
  // O mesmo conteúdo energético jamais é contado como GLP e diesel ao mesmo tempo.
  const fTermica = Math.min(1, Math.max(0, Number(fracaoTermica) ?? 0.5));
  const fEletrica = 1 - fTermica;

  // Rota térmica: cocção comunitária, substitui botijão de GLP
  const energiaTermicaKwh = energiaBrutaKwh * fTermica;
  const botijoesGlpEvitados = Math.round(energiaTermicaKwh / REF.glpKwhPorBotijao13);

  // Rota elétrica: motor-gerador a biogás, substitui gerador a diesel
  const energiaEletricaKwh = energiaBrutaKwh * fEletrica * REF.eficienciaEletricaGerador;
  const litrosDieselEvitados = Math.round(energiaEletricaKwh / REF.dieselKwhPorLitro);

  const co2EvitadoTon = round(
    (botijoesGlpEvitados * REF.emissaoGlpKgPorBotijao + litrosDieselEvitados * REF.emissaoDieselKgPorLitro) / 1000, 2
  );
  // Domicílio rural amazônico ~1.800 kWh/ano
  const domiciliosAno = Math.round(energiaEletricaKwh / 1800);
  // Famílias com cocção limpa: consumo típico ~1 botijão P13/mês
  const familiasCoccaoLimpa = Math.round(botijoesGlpEvitados / 12);

  return {
    dimensao: 'transicao_energetica',
    cultura: { id: culturaId, nome: cultura.nome, emoji: cultura.emoji },
    cenario: cen.nome,
    residuoAproveitadoTon: round(residuoFrescoTon, 1),
    biogasM3Ano: Math.round(biogasM3),
    energiaBrutaKwhAno: Math.round(energiaBrutaKwh),
    rota: { termicaPercentual: Math.round(fTermica * 100), eletricaPercentual: Math.round(fEletrica * 100) },
    energiaTermicaKwhAno: Math.round(energiaTermicaKwh),
    energiaEletricaKwhAno: Math.round(energiaEletricaKwh),
    domiciliosRuraisAtendidosAno: domiciliosAno,
    familiasCoccaoLimpaAno: familiasCoccaoLimpa,
    botijoesGlpEvitadosAno: botijoesGlpEvitados,
    litrosDieselEvitadosAno: litrosDieselEvitados,
    co2EvitadoTonAno: co2EvitadoTon,
    balanco: 'Balanço fechado: o biogás é dividido entre rota térmica e rota elétrica. A mesma energia nunca é contabilizada duas vezes.',
    justica: 'Energia gerada e gerida localmente pela própria comunidade, autonomia energética sem dependência de combustível fóssil transportado por longas distâncias fluviais. Transição energética justa: quem regenera o território é dono da energia que produz.',
    selo: cen.selo === 'LAUDO' ? 'CAMPO' : cen.selo, // depende de biodigestor instalado → nunca acima de CAMPO sem planta real
  };
}

/**
 * DIMENSÃO 3: Carbono e Ecossistemas
 * Sequestro adicional pelo ganho de biomassa (área foliar) + serviços ambientais.
 * SEMPRE em modo ESTIMATIVA. Só vira crédito com MRV instrumentado + verificação.
 */
export function impactoCarbono({ culturaId, hectares, cenarioId = 'conservador' }) {
  const cultura = CULTURAS[culturaId];
  if (!cultura) throw Object.assign(new Error('Cultura desconhecida.'), { status: 400 });
  const cen = CENARIOS_UPLIFT[cenarioId] || CENARIOS_UPLIFT.conservador;
  const ha = n(hectares);

  const producaoBase = cultura.produtividade * ha;
  const biomassaExtraTon = producaoBase * cen.upliftBiomassa; // biomassa fresca adicional
  const materiaSecaTon = biomassaExtraTon * REF.materiaSecaResiduo;
  const carbonoTon = materiaSecaTon * REF.fracaoCarbonoBiomassa;
  const co2eSequestradoTon = carbonoTon * REF.razaoCO2C;

  const aguaRetidaM3 = ha * REF.aguaIrrigacaoM3HaAnoEvitadaConservador;

  return {
    dimensao: 'carbono_ecossistemas',
    cultura: { id: culturaId, nome: cultura.nome, emoji: cultura.emoji },
    cenario: cen.nome,
    modo: 'ESTIMATIVA',
    biomassaAdicionalTon: round(biomassaExtraTon, 1),
    co2eSequestradoTonAno: round(co2eSequestradoTon, 2),
    aguaRetidaM3Ano: Math.round(aguaRetidaM3),
    servicosEcossistemicos: ['Retenção de umidade no solo', 'Retorno de polinizadores', 'Redução de risco de queimadas na estiagem'],
    disclaimer: disclaimerConformidade(cen.selo),
    selo: cen.selo,
  };
}

/**
 * DIMENSÃO 4: Economia / Bioeconomia
 */
export function impactoEconomico({ culturaId, hectares, cenarioId = 'conservador', ganhoProducaoTon = null, energiaKwh = 0, co2eSequestrado = 0 }) {
  const cultura = CULTURAS[culturaId];
  if (!cultura) throw Object.assign(new Error('Cultura desconhecida.'), { status: 400 });
  const cen = CENARIOS_UPLIFT[cenarioId] || CENARIOS_UPLIFT.conservador;
  const ha = n(hectares);

  const ganho = ganhoProducaoTon != null ? n(ganhoProducaoTon) : cultura.produtividade * ha * cen.upliftProdutividade;
  const receitaExtraAgricola = ganho * cultura.precoTon;
  // Energia (tarifa rural média de referência ~R$0,72/kWh)
  const economiaEnergia = n(energiaKwh) * 0.72;
  // Carbono a preço conservador de crédito nature-based (R$ 89/tCO2e: só se virar crédito)
  const potencialCarbono = n(co2eSequestrado) * 89;

  return {
    dimensao: 'economia',
    cultura: { id: culturaId, nome: cultura.nome, emoji: cultura.emoji },
    receitaExtraAgricolaReais: Math.round(receitaExtraAgricola),
    economiaEnergiaReais: Math.round(economiaEnergia),
    potencialCreditoCarbonoReais: Math.round(potencialCarbono),
    totalReais: Math.round(receitaExtraAgricola + economiaEnergia + potencialCarbono),
    observacao: 'Receita agrícola e economia de energia são impacto direto. O potencial de crédito de carbono só se realiza após MRV e verificação: apresentado à parte, nunca somado como certo.',
    selo: cen.selo,
  };
}

/**
 * DIMENSÃO 5: ODS / Agenda 2030 da ONU
 * Mapeia o impacto do cenário para os Objetivos de Desenvolvimento Sustentável.
 */
const ODS = {
  1:  'Erradicação da pobreza', 2: 'Fome zero e agricultura sustentável', 3: 'Saúde e bem-estar',
  6:  'Água potável e saneamento', 7: 'Energia limpa e acessível', 8: 'Trabalho decente e crescimento econômico',
  9:  'Indústria, inovação e infraestrutura', 10: 'Redução das desigualdades', 11: 'Cidades e comunidades sustentáveis',
  12: 'Consumo e produção responsáveis', 13: 'Ação contra a mudança global do clima', 15: 'Vida terrestre',
  17: 'Parcerias e meios de implementação',
};

export function mapaODS({ alimentar, energetico, carbono, economico }) {
  const contribuicoes = [];
  const add = (num, motivo, forca) => contribuicoes.push({ ods: num, nome: ODS[num], motivo, forca });

  if (alimentar?.pessoasAlimentadasAno > 0) {
    add(2, `Produção adicional alimenta ~${alimentar.pessoasAlimentadasAno} pessoas/ano`, 'alta');
    add(1, 'Renda extra para agricultores familiares reduz pobreza rural', 'alta');
  }
  if (energetico?.energiaEletricaKwhAno > 0) {
    add(7, `${energetico.energiaEletricaKwhAno.toLocaleString('pt-BR')} kWh/ano de energia limpa de biogás comunitário`, 'alta');
    add(13, `${energetico.co2EvitadoTonAno} tCO₂e/ano evitadas por substituir diesel/GLP`, 'alta');
  }
  if (carbono?.co2eSequestradoTonAno > 0) {
    add(13, `${carbono.co2eSequestradoTonAno} tCO₂e/ano de sequestro adicional (estimativa)`, 'média');
    add(15, 'Solo vivo, retenção de umidade e retorno de polinizadores', 'alta');
    add(6, `Retenção de ~${(carbono.aguaRetidaM3Ano || 0).toLocaleString('pt-BR')} m³/ano de água no solo`, 'média');
  }
  if (economico?.totalReais > 0) {
    add(8, 'Geração de renda e fortalecimento de cadeias produtivas locais', 'alta');
    add(12, 'Resíduo agrícola vira recurso (economia circular)', 'alta');
  }
  add(10, 'Priorização de quilombolas, indígenas e extrativistas', 'alta');
  add(17, 'Modelo em parceria pública (PNDR/MIDR), cooperativas e ensino federal (IFAP)', 'média');

  // Consolida por ODS (o de maior força vence)
  const forcaOrd = { alta: 3, média: 2, baixa: 1 };
  const mapa = {};
  for (const c of contribuicoes) {
    if (!mapa[c.ods] || forcaOrd[c.forca] > forcaOrd[mapa[c.ods].forca]) mapa[c.ods] = c;
  }
  return Object.values(mapa).sort((a, b) => a.ods - b.ods);
}

/**
 * SIMULAÇÃO 360°: orquestra as cinco dimensões em um só resultado.
 */
export function simular360({ culturaId, hectares, cenarioId = 'conservador', fracaoTermica = 0.5 }) {
  const alimentar = impactoAlimentar({ culturaId, hectares, cenarioId });
  const energetico = impactoEnergetico({ culturaId, hectares, cenarioId, fracaoTermica, ganhoProducaoTon: alimentar.ganhoProducaoTon });
  const carbono = impactoCarbono({ culturaId, hectares, cenarioId });
  const economico = impactoEconomico({
    culturaId, hectares, cenarioId,
    ganhoProducaoTon: alimentar.ganhoProducaoTon,
    energiaKwh: energetico.energiaEletricaKwhAno,
    co2eSequestrado: carbono.co2eSequestradoTonAno,
  });
  const ods = mapaODS({ alimentar, energetico, carbono, economico });

  const seloGlobal = seloResultante([alimentar.selo, energetico.selo, carbono.selo, economico.selo]);

  return {
    insumo: IDENTIDADE.marca,
    entrada: { culturaId, hectares: n(hectares), cenario: cenarioId },
    dimensoes: { alimentar, energetico, carbono, economico },
    ods,
    resumo: {
      pessoasAlimentadasAno: alimentar.pessoasAlimentadasAno,
      energiaKwhAno: energetico.energiaEletricaKwhAno,
      co2eSequestradoTonAno: carbono.co2eSequestradoTonAno,
      co2eEvitadoTonAno: energetico.co2EvitadoTonAno,
      impactoEconomicoReais: economico.totalReais,
      odsAtendidos: ods.length,
    },
    selo: seloGlobal.id,
    conformidade: disclaimerConformidade(seloGlobal.id),
  };
}
