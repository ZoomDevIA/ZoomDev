// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA DE PASSIVO AMBIENTAL: GHG Protocol, escopos 1, 2 e 3
//
// Reconstruída com: perfis setoriais (pergunta só o que importa), módulo agro
// completo (N₂O de fertilizante, máquinas, uso da terra), faixa de incerteza
// em vez de número único, e benchmark por porte.
//
// Um inventário honesto declara sua incerteza. Número único é falsa precisão.
// ═══════════════════════════════════════════════════════════════════════════

// `Number(v) || 0` já barrava texto e negativo, mas deixava passar o infinito:
// `Number('1e999')` é Infinity, e Infinity sobrevive ao Math.max. Uma conta de
// luz digitada como 1e999 devolvia um inventário inteiro de "Infinity tCO2e" e
// um custo de compensação de "R$ Infinity".
//
// Valor impossível vira zero, como já acontecia com texto: descartar o campo é
// honesto, inventar um teto no lugar dele não. O teto de um bilhão existe para
// o outro caso, o número grande mas finito, que também não é dado de operação
// real e sim dedo escorregando no teclado.
const TETO = 1e9;
const n = (v) => {
  const x = Number(v);
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.min(x, TETO);
};
const r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);

// ── Fatores de emissão ────────────────────────────────────────────────────
// Fontes: MCTI/SIRENE (rede elétrica BR), IPCC 2019 Refinement (N₂O agrícola),
// DEFRA/ICAO (transporte). Incerteza típica por categoria entre colchetes.
export const FATORES = {
  // Escopo 1: combustão direta (kgCO2e por unidade)
  gasolina_litro: 2.2,
  diesel_litro: 2.6,
  etanol_litro: 0.4,
  glp_botijao13: 37.4,
  lenha_ton: 1540,

  // Escopo 1: agrícola
  // N₂O de fertilizante nitrogenado: 1% do N aplicado vira N₂O-N (IPCC),
  // × 44/28 (N₂O/N) × 273 (GWP100 AR6) ≈ 4,29 kgCO2e por kg de N
  n2o_kg_por_kg_nitrogenio: 4.29,
  // Calcário agrícola: CO2 liberado na reação (IPCC tier 1)
  calcario_kg_por_ton: 440,
  // Fermentação entérica bovina (kgCO2e/cabeça/ano, GWP CH4 = 27)
  bovino_cabeca_ano: 1620,
  // Queima de resíduo agrícola em campo (prática a eliminar)
  queima_residuo_kg_por_ton: 1515,

  // Escopo 2: eletricidade (tCO2/MWh: fator médio do SIN)
  eletricidade_tco2_mwh: 0.0385,

  // Escopo 3: logística e viagens
  voo_domestico_hora: 110,
  voo_internacional_hora: 90,
  carro_km: 0.18,
  frete_rodoviario_tkm: 0.11,
  frete_fluvial_tkm: 0.05,
  frete_aereo_tkm: 0.60,

  // Escopo 3: operação
  funcionario_escritorio_mes: 65,
  funcionario_remoto_mes: 25,
  nuvem_por_1000_reais_mes: 30,
  residuo_aterro_ton: 460,

  // Escopo 3: insumos agrícolas (produção do fertilizante, "berço ao portão")
  fertilizante_sintetico_kg: 1.4,
  defensivo_kg: 12.0,
};

// Incerteza relativa por escopo (boa prática de inventário de triagem)
const INCERTEZA = { escopo1: 0.10, escopo2: 0.07, escopo3: 0.30 };

// ── Perfis setoriais: cada um declara os campos que realmente importam ─────
export const PERFIS = {
  digital: {
    id: 'digital', nome: 'Digital / SaaS', emoji: '💻',
    descricao: 'Startups de software, plataformas e serviços digitais.',
    campos: ['energiaKwhMes', 'funcionariosEscritorio', 'funcionariosRemotos', 'gastoNuvemReaisMes', 'vooDomesticoHorasAno', 'vooInternacionalHorasAno', 'carroAppKmMes'],
  },
  agro: {
    id: 'agro', nome: 'Agro & Bioeconomia', emoji: '🌱',
    descricao: 'Produção agrícola, extrativismo e cadeias da sociobiodiversidade.',
    campos: ['areaHectares', 'nitrogenioKgAno', 'calcarioTonAno', 'defensivosKgAno', 'dieselLitrosMes', 'energiaKwhMes', 'glpBotijoesMes', 'bovinos', 'residuoQueimadoTonAno', 'freteRodoviarioTonKmMes', 'freteFluvialTonKmMes', 'funcionariosEscritorio'],
  },
  industria: {
    id: 'industria', nome: 'Indústria / Processamento', emoji: '🏭',
    descricao: 'Beneficiamento, agroindústria e manufatura.',
    campos: ['energiaKwhMes', 'dieselLitrosMes', 'glpBotijoesMes', 'lenhaTonMes', 'freteRodoviarioTonKmMes', 'residuoAterroTonMes', 'funcionariosEscritorio'],
  },
  comercio: {
    id: 'comercio', nome: 'Comércio / Serviços', emoji: '🏪',
    descricao: 'Varejo, distribuição e serviços presenciais.',
    campos: ['energiaKwhMes', 'gasolinaLitrosMes', 'freteRodoviarioTonKmMes', 'residuoAterroTonMes', 'funcionariosEscritorio', 'funcionariosRemotos'],
  },
  evento: {
    id: 'evento', nome: 'Evento', emoji: '🎪',
    descricao: 'Conferências, feiras e eventos pontuais (valores totais do evento).',
    campos: ['energiaKwhMes', 'participantes', 'vooDomesticoHorasAno', 'vooInternacionalHorasAno', 'carroAppKmMes', 'residuoAterroTonMes'],
  },
};

export const CAMPOS = {
  energiaKwhMes: { label: 'Energia elétrica', unidade: 'kWh/mês', escopo: 2 },
  gasolinaLitrosMes: { label: 'Gasolina', unidade: 'L/mês', escopo: 1 },
  dieselLitrosMes: { label: 'Diesel', unidade: 'L/mês', escopo: 1 },
  glpBotijoesMes: { label: 'GLP (botijão P13)', unidade: 'botijões/mês', escopo: 1 },
  lenhaTonMes: { label: 'Lenha', unidade: 't/mês', escopo: 1 },
  areaHectares: { label: 'Área cultivada', unidade: 'ha', escopo: 0, contexto: true },
  nitrogenioKgAno: { label: 'Fertilizante nitrogenado (N)', unidade: 'kg N/ano', escopo: 1 },
  calcarioTonAno: { label: 'Calcário agrícola', unidade: 't/ano', escopo: 1 },
  defensivosKgAno: { label: 'Defensivos agrícolas', unidade: 'kg/ano', escopo: 3 },
  bovinos: { label: 'Rebanho bovino', unidade: 'cabeças', escopo: 1 },
  residuoQueimadoTonAno: { label: 'Resíduo queimado em campo', unidade: 't/ano', escopo: 1 },
  residuoAterroTonMes: { label: 'Resíduo para aterro', unidade: 't/mês', escopo: 3 },
  freteRodoviarioTonKmMes: { label: 'Frete rodoviário', unidade: 't·km/mês', escopo: 3 },
  freteFluvialTonKmMes: { label: 'Frete fluvial', unidade: 't·km/mês', escopo: 3 },
  vooDomesticoHorasAno: { label: 'Voos domésticos', unidade: 'h/ano', escopo: 3 },
  vooInternacionalHorasAno: { label: 'Voos internacionais', unidade: 'h/ano', escopo: 3 },
  carroAppKmMes: { label: 'Deslocamento de carro', unidade: 'km/mês', escopo: 3 },
  funcionariosEscritorio: { label: 'Pessoas em escritório', unidade: 'pessoas', escopo: 3 },
  funcionariosRemotos: { label: 'Pessoas em trabalho remoto', unidade: 'pessoas', escopo: 3 },
  gastoNuvemReaisMes: { label: 'Gasto com nuvem', unidade: 'R$/mês', escopo: 3 },
  participantes: { label: 'Participantes do evento', unidade: 'pessoas', escopo: 3 },
};

/**
 * Calcula o passivo anual com detalhamento por fonte e faixa de incerteza.
 */
export function calcularPassivo(dados = {}) {
  const F = FATORES;
  const fontes = [];
  const add = (escopo, label, kg, fator) => { if (kg > 0) fontes.push({ escopo, label, tco2e: r2(kg / 1000), fator }); };

  // ── Escopo 1 ──
  add(1, 'Gasolina', n(dados.gasolinaLitrosMes) * F.gasolina_litro * 12, '2,2 kgCO₂e/L');
  add(1, 'Diesel', n(dados.dieselLitrosMes) * F.diesel_litro * 12, '2,6 kgCO₂e/L');
  add(1, 'Etanol', n(dados.etanolLitrosMes) * F.etanol_litro * 12, '0,4 kgCO₂e/L');
  add(1, 'GLP', n(dados.glpBotijoesMes) * F.glp_botijao13 * 12, '37,4 kgCO₂e/botijão');
  add(1, 'Lenha', n(dados.lenhaTonMes) * F.lenha_ton * 12, '1.540 kgCO₂e/t');
  add(1, 'N₂O de fertilizante nitrogenado', n(dados.nitrogenioKgAno) * F.n2o_kg_por_kg_nitrogenio, '4,29 kgCO₂e/kg N (IPCC)');
  add(1, 'Calcário agrícola', n(dados.calcarioTonAno) * F.calcario_kg_por_ton, '440 kgCO₂e/t');
  add(1, 'Fermentação entérica (bovinos)', n(dados.bovinos) * F.bovino_cabeca_ano, '1.620 kgCO₂e/cabeça/ano');
  add(1, 'Queima de resíduo em campo', n(dados.residuoQueimadoTonAno) * F.queima_residuo_kg_por_ton, '1.515 kgCO₂e/t');

  // ── Escopo 2 ──
  add(2, 'Eletricidade da rede', (n(dados.energiaKwhMes) / 1000) * F.eletricidade_tco2_mwh * 1000 * 12, '0,0385 tCO₂/MWh (SIN)');

  // ── Escopo 3 ──
  add(3, 'Voos domésticos', n(dados.vooDomesticoHorasAno) * F.voo_domestico_hora, '110 kgCO₂e/h');
  add(3, 'Voos internacionais', n(dados.vooInternacionalHorasAno) * F.voo_internacional_hora, '90 kgCO₂e/h');
  add(3, 'Deslocamento de carro', n(dados.carroAppKmMes) * F.carro_km * 12, '0,18 kgCO₂e/km');
  add(3, 'Frete rodoviário', n(dados.freteRodoviarioTonKmMes) * F.frete_rodoviario_tkm * 12, '0,11 kgCO₂e/t·km');
  add(3, 'Frete fluvial', n(dados.freteFluvialTonKmMes) * F.frete_fluvial_tkm * 12, '0,05 kgCO₂e/t·km');
  add(3, 'Equipe em escritório', n(dados.funcionariosEscritorio) * F.funcionario_escritorio_mes * 12, '65 kgCO₂e/pessoa/mês');
  add(3, 'Equipe remota', n(dados.funcionariosRemotos) * F.funcionario_remoto_mes * 12, '25 kgCO₂e/pessoa/mês');
  add(3, 'Infraestrutura em nuvem', (n(dados.gastoNuvemReaisMes) / 1000) * F.nuvem_por_1000_reais_mes * 12, '30 kgCO₂e/mil reais');
  add(3, 'Resíduo para aterro', n(dados.residuoAterroTonMes) * F.residuo_aterro_ton * 12, '460 kgCO₂e/t');
  add(3, 'Defensivos agrícolas', n(dados.defensivosKgAno) * F.defensivo_kg, '12 kgCO₂e/kg');
  add(3, 'Participantes do evento', n(dados.participantes) * 12, '12 kgCO₂e/participante');

  const porEscopo = { 1: 0, 2: 0, 3: 0 };
  for (const f of fontes) porEscopo[f.escopo] += f.tco2e;

  const total = porEscopo[1] + porEscopo[2] + porEscopo[3];
  // Incerteza combinada (propagação em quadratura)
  const varTotal = Math.sqrt(
    (porEscopo[1] * INCERTEZA.escopo1) ** 2 +
    (porEscopo[2] * INCERTEZA.escopo2) ** 2 +
    (porEscopo[3] * INCERTEZA.escopo3) ** 2
  );

  fontes.sort((a, b) => b.tco2e - a.tco2e);

  return {
    metodologia: 'GHG Protocol (triagem): fatores MCTI/SIRENE, IPCC 2019 Refinement e DEFRA/ICAO',
    perfil: dados.perfil || 'digital',
    escopos: {
      escopo1: { tco2e: r2(porEscopo[1]), descricao: 'Emissões diretas: combustão, processos agrícolas e rebanho' },
      escopo2: { tco2e: r2(porEscopo[2]), descricao: 'Energia elétrica adquirida da rede' },
      escopo3: { tco2e: r2(porEscopo[3]), descricao: 'Cadeia de valor: logística, viagens, insumos, resíduos e equipe' },
    },
    totalTco2eAno: r2(total),
    incerteza: {
      minimo: r2(Math.max(0, total - varTotal)),
      esperado: r2(total),
      maximo: r2(total + varTotal),
      percentual: total > 0 ? Math.round((varTotal / total) * 100) : 0,
      nota: 'Faixa de incerteza da triagem. Um inventário honesto declara sua margem: número único é falsa precisão.',
    },
    fontes,
    maioresFontes: fontes.slice(0, 5),
    intensidade: n(dados.areaHectares) > 0 ? { valor: r2(total / n(dados.areaHectares)), unidade: 'tCO₂e/ha/ano' } : null,
    avisos: [
      'Estimativa de triagem: inventário oficial requer a ferramenta do Programa Brasileiro GHG Protocol (FGVces).',
      'Reduza antes de compensar: a hierarquia de mitigação é o que separa ação climática de greenwashing.',
      'Comunique como "emissões compensadas com créditos verificados", nunca "carbono neutro" genérico (ISO 14068-1 / CONAR).',
    ],
  };
}

/** Benchmark simples por porte (tCO₂e/ano) para dar contexto ao resultado. */
export function benchmark(total, perfilId = 'digital') {
  const faixas = {
    digital: [{ ate: 10, nivel: 'Muito baixo' }, { ate: 50, nivel: 'Baixo' }, { ate: 200, nivel: 'Médio' }, { ate: Infinity, nivel: 'Alto' }],
    agro: [{ ate: 50, nivel: 'Muito baixo' }, { ate: 300, nivel: 'Baixo' }, { ate: 1500, nivel: 'Médio' }, { ate: Infinity, nivel: 'Alto' }],
    industria: [{ ate: 100, nivel: 'Muito baixo' }, { ate: 500, nivel: 'Baixo' }, { ate: 3000, nivel: 'Médio' }, { ate: Infinity, nivel: 'Alto' }],
    comercio: [{ ate: 20, nivel: 'Muito baixo' }, { ate: 100, nivel: 'Baixo' }, { ate: 500, nivel: 'Médio' }, { ate: Infinity, nivel: 'Alto' }],
    evento: [{ ate: 5, nivel: 'Muito baixo' }, { ate: 30, nivel: 'Baixo' }, { ate: 150, nivel: 'Médio' }, { ate: Infinity, nivel: 'Alto' }],
  };
  const f = faixas[perfilId] || faixas.digital;
  return f.find(x => total <= x.ate).nivel;
}
