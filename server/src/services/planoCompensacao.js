// ═══════════════════════════════════════════════════════════════════════════
// PLANO DE COMPENSAÇÃO: hierarquia de mitigação aplicada
//
//        MEDIR  →  REDUZIR  →  COMPENSAR
//
// Compensar antes de reduzir é greenwashing. Este motor força a ordem correta:
// primeiro identifica o que dá para cortar (com custo e retorno), depois trata
// apenas o residual, por área própria regenerada ou por crédito verificado.
// ═══════════════════════════════════════════════════════════════════════════
import { simular360 } from './impactoRegenerativo.js';
import { CULTURAS } from '../science/coinmax.js';
import { PROJETOS_CARBONPAY } from './carbon.js';

const r2 = (v) => Math.round(v * 100) / 100;
const n = (v) => Math.max(0, Number(v) || 0);

/**
 * Catálogo de oportunidades de redução.
 * `aplicaSe` inspeciona as fontes do inventário; `reducao` é a fração evitável.
 */
const OPORTUNIDADES = [
  {
    id: 'energia_renovavel', titulo: 'Migrar para energia renovável certificada',
    alvo: 'Eletricidade da rede', reducao: 0.90, escopo: 2,
    custoRelativo: 'baixo', prazo: '1-3 meses', economiaFinanceira: true,
    como: 'Contratar energia no mercado livre com certificado de origem renovável (I-REC) ou instalar geração solar própria.',
  },
  {
    id: 'solar_off_grid', titulo: 'Geração solar ou biogás para substituir diesel',
    alvo: 'Diesel', reducao: 0.70, escopo: 1,
    custoRelativo: 'alto', prazo: '6-18 meses', economiaFinanceira: true,
    como: 'Substituir gerador a diesel por solar com armazenamento ou por biodigestor alimentado com resíduo próprio.',
  },
  {
    id: 'fim_queima', titulo: 'Eliminar a queima de resíduo em campo',
    alvo: 'Queima de resíduo em campo', reducao: 1.00, escopo: 1,
    custoRelativo: 'baixo', prazo: 'imediato', economiaFinanceira: true,
    como: 'Direcionar o resíduo para biodigestão ou compostagem: deixa de emitir e passa a gerar energia e adubo.',
  },
  {
    id: 'manejo_nitrogenio', titulo: 'Manejo eficiente de nitrogênio',
    alvo: 'N₂O de fertilizante nitrogenado', reducao: 0.40, escopo: 1,
    custoRelativo: 'baixo', prazo: '1 safra', economiaFinanceira: true,
    como: 'Aplicação parcelada conforme análise de solo, uso de bioestimulante para melhorar aproveitamento e inoculação biológica de N.',
  },
  {
    id: 'reducao_defensivos', titulo: 'Reduzir dependência de defensivos',
    alvo: 'Defensivos agrícolas', reducao: 0.35, escopo: 3,
    custoRelativo: 'baixo', prazo: '1-2 safras', economiaFinanceira: true,
    como: 'Fortalecer a resistência natural da planta e adotar manejo integrado, cortando aplicações preventivas.',
  },
  {
    id: 'logistica_fluvial', titulo: 'Priorizar modal fluvial no lugar do rodoviário',
    alvo: 'Frete rodoviário', reducao: 0.45, escopo: 3,
    custoRelativo: 'baixo', prazo: '3-6 meses', economiaFinanceira: true,
    como: 'Redesenhar rotas para o modal fluvial, que emite menos da metade por tonelada-quilômetro.',
  },
  {
    id: 'residuo_zero_aterro', titulo: 'Desviar resíduo do aterro',
    alvo: 'Resíduo para aterro', reducao: 0.75, escopo: 3,
    custoRelativo: 'médio', prazo: '3-9 meses', economiaFinanceira: false,
    como: 'Compostagem do orgânico, reciclagem do seco e logística reversa de embalagens.',
  },
  {
    id: 'politica_viagens', titulo: 'Política de viagens com prioridade remota',
    alvo: 'Voos internacionais', reducao: 0.40, escopo: 3,
    custoRelativo: 'baixo', prazo: 'imediato', economiaFinanceira: true,
    como: 'Substituir viagens evitáveis por encontros remotos e agrupar compromissos numa mesma viagem.',
  },
  {
    id: 'viagens_domesticas', titulo: 'Racionalizar voos domésticos',
    alvo: 'Voos domésticos', reducao: 0.35, escopo: 3,
    custoRelativo: 'baixo', prazo: 'imediato', economiaFinanceira: true,
    como: 'Agrupar agendas regionais e priorizar modal terrestre em trajetos curtos.',
  },
  {
    id: 'trabalho_remoto', titulo: 'Ampliar trabalho remoto ou híbrido',
    alvo: 'Equipe em escritório', reducao: 0.55, escopo: 3,
    custoRelativo: 'baixo', prazo: '1-3 meses', economiaFinanceira: true,
    como: 'Reduzir dias presenciais e o consumo do escritório; a pegada por pessoa remota é cerca de um terço da presencial.',
  },
  {
    id: 'nuvem_eficiente', titulo: 'Otimizar infraestrutura em nuvem',
    alvo: 'Infraestrutura em nuvem', reducao: 0.35, escopo: 3,
    custoRelativo: 'baixo', prazo: '1-3 meses', economiaFinanceira: true,
    como: 'Escolher regiões de baixa intensidade de carbono, desligar recursos ociosos e dimensionar corretamente.',
  },
  {
    id: 'cocção_limpa', titulo: 'Substituir GLP por biogás',
    alvo: 'GLP', reducao: 0.80, escopo: 1,
    custoRelativo: 'médio', prazo: '6-12 meses', economiaFinanceira: true,
    como: 'Biodigestor comunitário alimentado com resíduo orgânico próprio para cocção.',
  },
  {
    id: 'fim_lenha', titulo: 'Substituir lenha por biogás ou eficiência térmica',
    alvo: 'Lenha', reducao: 0.70, escopo: 1,
    custoRelativo: 'médio', prazo: '6-12 meses', economiaFinanceira: true,
    como: 'Trocar a queima direta de lenha por biogás ou instalar fornos de alta eficiência.',
  },
];

/**
 * Monta o plano completo a partir de um inventário calculado.
 * @param {object} inventario  saída de calcularPassivo()
 * @param {object} opts        { horizonteAnos, metaReducaoPercentual, areaPropria: {culturaId, hectares, cenarioId} }
 */
export function montarPlano(inventario, opts = {}) {
  const horizonte = Math.min(10, Math.max(1, Number(opts.horizonteAnos) || 5));
  const total = inventario.totalTco2eAno;

  // ── ETAPA 2: REDUZIR ────────────────────────────────────────────────────
  const porFonte = Object.fromEntries(inventario.fontes.map(f => [f.label, f.tco2e]));
  const acoes = OPORTUNIDADES
    .filter(o => (porFonte[o.alvo] || 0) > 0)
    .map(o => {
      const base = porFonte[o.alvo];
      const potencial = r2(base * o.reducao);
      return {
        id: o.id, titulo: o.titulo, como: o.como, escopo: o.escopo,
        fonteAlvo: o.alvo, emissaoAtual: base,
        potencialReducaoTon: potencial,
        percentualDoTotal: total > 0 ? Math.round((potencial / total) * 100) : 0,
        custoRelativo: o.custoRelativo, prazo: o.prazo,
        economiaFinanceira: o.economiaFinanceira,
        // Prioridade: muito impacto + baixo custo primeiro
        prioridade: (potencial / (total || 1)) * ({ baixo: 3, médio: 2, alto: 1 }[o.custoRelativo] || 1),
      };
    })
    .sort((a, b) => b.prioridade - a.prioridade);

  const reducaoPotencialTotal = r2(acoes.reduce((s, a) => s + a.potencialReducaoTon, 0));
  const metaPct = opts.metaReducaoPercentual != null
    ? Math.min(100, Math.max(0, Number(opts.metaReducaoPercentual)))
    : Math.min(50, total > 0 ? Math.round((reducaoPotencialTotal / total) * 100) : 0);
  const metaReducaoTon = r2(total * (metaPct / 100));

  // Roadmap: redução progressiva ao longo do horizonte (curva acelerada no início)
  const roadmap = [];
  for (let ano = 1; ano <= horizonte; ano++) {
    const progresso = Math.min(1, (ano / horizonte) ** 0.7); // ganhos rápidos primeiro
    const reduzido = r2(metaReducaoTon * progresso);
    const residual = r2(total - reduzido);
    roadmap.push({
      ano,
      reducaoAcumuladaTon: reduzido,
      emissaoResidualTon: residual,
      percentualReduzido: total > 0 ? Math.round((reduzido / total) * 100) : 0,
      acoesFoco: acoes.slice((ano - 1) * 2, ano * 2).map(a => a.titulo),
    });
  }

  // ── ETAPA 3: COMPENSAR o residual ───────────────────────────────────────
  const residualFinal = r2(total - metaReducaoTon);
  // Margem de segurança de 20% sobre o residual (incerteza da triagem)
  const aCompensar = r2(residualFinal * 1.2);

  // Rota A: área própria regenerada
  let rotaPropria = null;
  if (opts.areaPropria?.culturaId && n(opts.areaPropria.hectares) > 0) {
    const sim = simular360({
      culturaId: opts.areaPropria.culturaId,
      hectares: n(opts.areaPropria.hectares),
      cenarioId: opts.areaPropria.cenarioId || 'conservador',
    });
    const mitigado = r2(sim.dimensoes.carbono.co2eSequestradoTonAno + sim.dimensoes.energetico.co2EvitadoTonAno);
    rotaPropria = {
      rota: 'Área própria regenerada',
      cultura: CULTURAS[opts.areaPropria.culturaId]?.nome,
      hectares: n(opts.areaPropria.hectares),
      mitigacaoTonAno: mitigado,
      coberturaPercentual: aCompensar > 0 ? Math.min(100, Math.round((mitigado / aCompensar) * 100)) : 100,
      modo: 'ESTIMATIVA',
      requisitos: ['MRV instrumentado (sensores e imagens de satélite)', 'Verificação por terceira parte acreditada', 'Aposentadoria em registro público'],
      vantagem: 'Mantém o valor no território e gera cobenefícios de renda, energia e segurança alimentar.',
    };
  }

  // Rota B: compra de créditos verificados
  const rotaCredito = {
    rota: 'Compra de créditos verificados',
    opcoes: PROJETOS_CARBONPAY.map(p => ({
      id: p.id, nome: p.nome, padrao: p.padrao, precoPorTon: p.precoPorTon,
      custoTotal: r2(aCompensar * p.precoPorTon), cobeneficios: p.cobeneficios,
    })).sort((a, b) => a.custoTotal - b.custoTotal),
    vantagem: 'Efeito imediato e verificação já existente, sem necessidade de estruturar MRV próprio.',
  };

  const custoMinimoCompensacao = rotaCredito.opcoes[0]?.custoTotal || 0;

  return {
    geradoEm: new Date().toISOString(),
    horizonteAnos: horizonte,
    // ETAPA 1: MEDIR
    medir: {
      totalTco2eAno: total,
      incerteza: inventario.incerteza,
      escopos: inventario.escopos,
      maioresFontes: inventario.maioresFontes,
      metodologia: inventario.metodologia,
    },
    // ETAPA 2: REDUZIR
    reduzir: {
      metaPercentual: metaPct,
      metaTonAno: metaReducaoTon,
      potencialTotalTon: reducaoPotencialTotal,
      acoes,
      ganhosRapidos: acoes.filter(a => a.custoRelativo === 'baixo' && a.economiaFinanceira).slice(0, 3),
      roadmap,
    },
    // ETAPA 3: COMPENSAR
    compensar: {
      residualTonAno: residualFinal,
      margemSeguranca: 20,
      aCompensarTonAno: aCompensar,
      rotaPropria,
      rotaCredito,
      custoEstimadoAnual: custoMinimoCompensacao,
    },
    conformidade: {
      podeAfirmar: [
        'Inventário de emissões realizado conforme GHG Protocol (triagem).',
        `Meta de redução de ${metaPct}% em ${horizonte} anos, com plano de ação definido.`,
        'Emissões residuais compensadas com créditos verificados e aposentados em registro público.',
      ],
      naoPodeAfirmar: [
        '"Empresa carbono neutro" de forma genérica, sem verificação independente do inventário.',
        '"Emissão zero": compensação não é ausência de emissão.',
        'Qualquer alegação de compensação antes da aposentadoria efetiva dos créditos em registro público.',
      ],
      norma: 'ISO 14068-1 (neutralidade de carbono) e recomendações do CONAR sobre publicidade ambiental.',
    },
    ods: [
      { ods: 13, nome: 'Ação contra a mudança global do clima', motivo: `Meta de redução de ${metaPct}% e compensação de ${aCompensar} tCO₂e/ano` },
      { ods: 12, nome: 'Consumo e produção responsáveis', motivo: 'Eficiência energética, redução de resíduos e insumos' },
      { ods: 7, nome: 'Energia limpa e acessível', motivo: 'Migração para fontes renováveis na matriz da operação' },
      ...(rotaPropria ? [{ ods: 15, nome: 'Vida terrestre', motivo: 'Regeneração de solo e biomassa em área própria' }] : []),
    ],
  };
}
