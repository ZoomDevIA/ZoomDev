// ═══════════════════════════════════════════════════════════════════════════
// CONSELHO DOS AGENTES
//
// A Sexta-Feira convoca o subconjunto relevante do elenco para deliberar sobre
// um projeto. Cada agente fala sob seu próprio PIC, com a perspectiva da sua
// especialidade. O resultado é um veredito com decisões, riscos e plano de ação.
//
// Não é um chat: é uma reunião de conselho com pauta, atas e encaminhamentos.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { config } from '../config.js';
import { structured } from '../agents/claude.js';
import { TODOS_PICS, estaAtivo, CATALOGO } from './elenco.js';
import { renderSystemPromptAgente } from '../protocols/picAgentes.js';
import { radarProjeto } from './unicornio.js';
import { matchesDoProjeto } from './radarEditais.js';
import { FASE_LABEL } from './gamification.js';

/** Quem senta à mesa depende da fase e da natureza do projeto. */
export function convocar(projeto) {
  const bio = projeto.classificacao === 'biostartup';
  const base = ['maia', 'ceo'];                       // sempre presentes
  const porFase = {
    ideacao: ['mercado', 'helix', 'editais'],
    validacao: ['mercado', 'growth', 'editais', 'cfo'],
    mvp: ['cto', 'growth', 'cfo', 'chronos'],
    tracao: ['cfo', 'investidor', 'orion', 'atlas'],
    escala: ['orion', 'atlas', 'athena', 'investidor'],
  };
  const bioExtra = bio ? ['gaia', 'curupira', 'carbono', 'esg'] : ['athena'];

  const ids = [...new Set([...base, ...(porFase[projeto.fase] || []), ...bioExtra])]
    .filter(estaAtivo)
    .slice(0, 8);

  return ids.map(i => CATALOGO.find(a => a.id === i)).filter(Boolean);
}

const PARECER_SCHEMA = {
  type: 'object',
  properties: {
    veredito: { type: 'string', enum: ['avancar', 'ajustar', 'pivotar'] },
    parecer: { type: 'string' },
    risco: { type: 'string' },
    recomendacao: { type: 'string' },
    confianca: { type: 'integer' },
  },
  required: ['veredito', 'parecer', 'risco', 'recomendacao', 'confianca'],
  additionalProperties: false,
};

// Pareceres determinísticos por especialidade: o modo demo entrega um conselho
// real, calculado do estado do projeto, não texto genérico.
function parecerDemo(agente, ctx) {
  const { projeto, radar, melhorMatch, missoesPendentes } = ctx;
  const bio = projeto.classificacao === 'biostartup';
  const temPlano = Boolean(projeto.plano);

  const mapa = {
    maia: {
      veredito: temPlano ? 'avancar' : 'ajustar',
      parecer: temPlano
        ? `A tese de ${projeto.nome} está estruturada e coerente com a fase ${FASE_LABEL[projeto.fase] || projeto.fase}. O que falta agora é evidência de campo, não mais planejamento.`
        : `${projeto.nome} ainda vive como ideia. Sem o plano gerado pelos agentes, qualquer decisão aqui é opinião, não análise.`,
      risco: temPlano ? 'Excesso de confiança no plano sem confrontá-lo com a realidade do cliente.' : 'Avançar sem base estruturada leva a retrabalho caro.',
      recomendacao: temPlano ? 'Traduza cada hipótese do plano em um experimento com critério de falha explícito.' : 'Gere o plano de negócios completo antes de qualquer outra decisão.',
      confianca: temPlano ? 82 : 55,
    },
    ceo: {
      veredito: missoesPendentes > 0 ? 'ajustar' : 'avancar',
      parecer: `Radar Unicórnio em ${radar.score}/100 (${radar.tier.label}). A dimensão mais fraca é ${radar.dimensoes.reduce((m, d) => (d.pontos / d.max < m.pontos / m.max ? d : m)).label}.`,
      risco: missoesPendentes > 0 ? `${missoesPendentes} missão(ões) principal(is) em aberto: o projeto está parado na execução.` : 'Ritmo de execução sem foco pode dispersar recursos.',
      recomendacao: missoesPendentes > 0 ? 'Concentre as próximas duas semanas em fechar as missões principais. Foco vence velocidade.' : 'Defina uma única métrica-norte para o próximo trimestre.',
      confianca: 78,
    },
    mercado: {
      veredito: 'ajustar',
      parecer: `O mercado de ${projeto.vertical || 'atuação'} exige dimensionamento com fonte pública antes de qualquer projeção de receita.`,
      risco: 'TAM inflado é a principal causa de rejeição em comitê de investimento.',
      recomendacao: 'Calcule TAM/SAM/SOM com IBGE e dados setoriais, e valide o preço com três clientes reais.',
      confianca: 74,
    },
    helix: {
      veredito: 'ajustar',
      parecer: bio
        ? 'Projeto de base biológica precisa de delineamento experimental com testemunha pareada para que qualquer alegação vire ativo defensável.'
        : 'A tese técnica precisa de um critério objetivo de sucesso antes do próximo ciclo.',
      risco: 'Alegação sem selo de evidência derruba due diligence e certificação de carbono.',
      recomendacao: 'Defina agora qual dado você vai medir, com que instrumento e contra qual testemunha.',
      confianca: 80,
    },
    editais: {
      veredito: melhorMatch && melhorMatch.score >= 70 ? 'avancar' : 'ajustar',
      parecer: melhorMatch
        ? `${melhorMatch.edital} apresenta aderência de ${melhorMatch.score}/100${melhorMatch.dias !== null ? `, com ${melhorMatch.dias} dias de prazo` : ''}.`
        : 'Nenhuma chamada aberta com aderência relevante no momento.',
      risco: melhorMatch && melhorMatch.dias !== null && melhorMatch.dias <= 30
        ? `Janela apertada: ${melhorMatch.dias} dias para reunir documentação.`
        : 'Depender só de capital privado encarece a jornada.',
      recomendacao: melhorMatch ? 'Use o plano de negócios como base do formulário e prepare certidões desde já.' : 'Mantenha o radar ativo: novas chamadas abrem toda semana.',
      confianca: 76,
    },
    cfo: {
      veredito: 'ajustar',
      parecer: 'Unit economics precisa estar clara antes de escalar: CAC, LTV e margem por unidade vendida.',
      risco: 'Escalar com unit economics negativa multiplica prejuízo, não receita.',
      recomendacao: 'Modele o ponto de equilíbrio e mantenha runway acima de 12 meses.',
      confianca: 79,
    },
    growth: {
      veredito: 'ajustar',
      parecer: 'Crescimento sustentável começa por retenção, não por aquisição.',
      risco: 'Investir em aquisição antes de reter é encher balde furado.',
      recomendacao: 'Meça retenção por coorte e só então acelere o topo do funil.',
      confianca: 72,
    },
    cto: {
      veredito: 'avancar',
      parecer: 'A arquitetura deve priorizar velocidade de aprendizado nesta fase, não escalabilidade prematura.',
      risco: 'Sobre-engenharia antes do product-market fit consome o runway.',
      recomendacao: 'Escolha a stack que o time domina e mantenha dívida técnica consciente e documentada.',
      confianca: 75,
    },
    chronos: {
      veredito: 'ajustar',
      parecer: 'O sequenciamento de marcos precisa considerar as janelas externas: prazos de edital, safra e ciclos de verificação.',
      risco: 'Marcos internos desalinhados de janelas externas fazem perder oportunidades irrecuperáveis.',
      recomendacao: 'Monte o cronograma de trás para frente, a partir da próxima janela crítica.',
      confianca: 77,
    },
    investidor: {
      veredito: radar.score >= 70 ? 'avancar' : 'ajustar',
      parecer: `Com Radar em ${radar.score}/100, o projeto ${radar.score >= 70 ? 'já sustenta uma conversa qualificada com investidor' : 'ainda precisa de tração para justificar valuation'}.`,
      risco: 'Captar cedo demais dilui o fundador sem necessidade.',
      recomendacao: radar.score >= 70 ? 'Prepare dataroom e pitch antes de precisar do dinheiro.' : 'Busque fomento não-diluitivo antes de equity.',
      confianca: 76,
    },
    orion: {
      veredito: 'avancar',
      parecer: 'Projetos com impacto ambiental mensurável acessam um pool de capital que a maioria das startups não alcança: finanças climáticas.',
      risco: 'Impacto não mensurado não acessa capital climático, por melhor que seja a tese.',
      recomendacao: 'Estruture as métricas de impacto no padrão que fundos climáticos exigem antes de procurá-los.',
      confianca: 74,
    },
    atlas: {
      veredito: 'ajustar',
      parecer: 'A internacionalização deve ser desenhada antes de ser necessária: estrutura societária mal feita custa caro para desfazer.',
      risco: 'Flip societário tardio gera passivo fiscal relevante.',
      recomendacao: 'Mapeie a jurisdição-alvo e o modelo de entrada antes da próxima rodada.',
      confianca: 71,
    },
    athena: {
      veredito: 'ajustar',
      parecer: 'Governança e ESG precisam de indicador auditável, não de declaração de intenção.',
      risco: 'Alegação ambiental sem lastro configura greenwashing e destrói reputação.',
      recomendacao: 'Adote a hierarquia medir → reduzir → compensar e documente cada etapa.',
      confianca: 81,
    },
    gaia: {
      veredito: 'avancar',
      parecer: 'Há oportunidade concreta de transformar regeneração em ativo econômico neste projeto.',
      risco: 'Tratar impacto ambiental como custo, e não como fonte de receita, subaproveita a tese.',
      recomendacao: 'Dimensione a área regenerável e o sequestro potencial: isso vira crédito e diferencial.',
      confianca: 78,
    },
    curupira: {
      veredito: 'ajustar',
      parecer: 'Toda operação em território amazônico precisa de linha de base de biodiversidade antes da intervenção.',
      risco: 'Sem linha de base não se prova adicionalidade nem se defende a operação.',
      recomendacao: 'Registre o estado inicial da área com imagem de satélite e inventário simplificado.',
      confianca: 79,
    },
    carbono: {
      veredito: 'ajustar',
      parecer: 'O potencial de carbono do projeto ainda não está quantificado com metodologia reconhecida.',
      risco: 'Vender crédito sem MRV e aposentadoria em registro público é risco jurídico e reputacional.',
      recomendacao: 'Calcule o passivo, monte o plano de compensação e defina o caminho de verificação.',
      confianca: 80,
    },
    esg: {
      veredito: 'ajustar',
      parecer: 'A teoria da mudança precisa conectar atividade, resultado e impacto com indicadores rastreáveis.',
      risco: 'Impacto declarado sem indicador não passa em due diligence.',
      recomendacao: 'Escolha até cinco indicadores e meça-os desde o primeiro dia.',
      confianca: 77,
    },
    juridico: {
      veredito: 'ajustar',
      parecer: 'Estrutura societária e propriedade intelectual devem estar resolvidas antes de captar.',
      risco: 'Acordo de sócios inexistente é a principal causa de morte de startup por conflito.',
      recomendacao: 'Formalize vesting, acordo de sócios e registro de marca no INPI.',
      confianca: 78,
    },
  };

  return mapa[agente.id] || {
    veredito: 'ajustar',
    parecer: `Sob a ótica de ${agente.papel.toLowerCase()}, o projeto exige aprofundamento antes do próximo passo.`,
    risco: 'Avançar sem cobrir esta dimensão gera retrabalho.',
    recomendacao: 'Traga esta dimensão para o plano do próximo ciclo.',
    confianca: 70,
  };
}

async function parecerAgente(agente, ctx) {
  const pic = TODOS_PICS.find(p => p.agenteId === agente.id);
  if (!config.hasApiKey || !pic) return parecerDemo(agente, ctx);
  try {
    return await structured({
      system: renderSystemPromptAgente(pic),
      user: `Você foi convocado para o Conselho dos Agentes sobre este projeto.

PROJETO: ${ctx.projeto.nome} (${ctx.projeto.classificacao}, vertical ${ctx.projeto.vertical})
DESCRIÇÃO: ${ctx.projeto.descricao}
FASE: ${FASE_LABEL[ctx.projeto.fase] || ctx.projeto.fase}
RADAR UNICÓRNIO: ${ctx.radar.score}/100, ${ctx.radar.dimensoes.map(d => `${d.label} ${d.pontos}/${d.max}`).join(', ')}
MISSÕES PRINCIPAIS EM ABERTO: ${ctx.missoesPendentes}
MELHOR EDITAL: ${ctx.melhorMatch ? `${ctx.melhorMatch.edital} (${ctx.melhorMatch.score}/100)` : 'nenhum relevante'}
${ctx.projeto.plano ? 'PLANO DE NEGÓCIOS: gerado' : 'PLANO DE NEGÓCIOS: ainda não gerado'}

Dê seu parecer ESTRITAMENTE sob a sua especialidade: não invada a área dos outros conselheiros. Seja específico a este projeto, direto e honesto. Confiança de 0 a 100 no seu próprio parecer.`,
      schema: PARECER_SCHEMA,
      effort: 'medium',
      maxTokens: 2000,
      papel: 'chat',
    });
  } catch {
    return parecerDemo(agente, ctx);
  }
}

/** Convoca e realiza o conselho. */
export async function realizarConselho(projeto, user) {
  const conselheiros = convocar(projeto);
  const radar = radarProjeto(projeto, user);
  const matches = matchesDoProjeto(projeto);
  const ctx = {
    projeto, radar,
    melhorMatch: matches[0] || null,
    missoesPendentes: (projeto.missoes || []).filter(m => m.tipo === 'principal' && !m.concluida).length,
  };

  const pareceres = await Promise.all(
    conselheiros.map(async (a) => ({
      agenteId: a.id, nome: a.nome, emoji: a.emoji, papel: a.papel, casta: a.casta, cor: a.cor,
      ...(await parecerAgente(a, ctx)),
    }))
  );

  // Deliberação: veredito por maioria, ponderado pela confiança de cada conselheiro
  const votos = { avancar: 0, ajustar: 0, pivotar: 0 };
  for (const p of pareceres) votos[p.veredito] = (votos[p.veredito] || 0) + (p.confianca / 100);
  const vencedor = Object.entries(votos).sort((a, b) => b[1] - a[1])[0][0];
  const consenso = Math.round((votos[vencedor] / pareceres.reduce((s, p) => s + p.confianca / 100, 0)) * 100);

  const VEREDITO = {
    avancar: { label: 'AVANÇAR', emoji: '🚀', cor: '#00ff64', significado: 'O conselho entende que o projeto está pronto para o próximo passo da jornada.' },
    ajustar: { label: 'AJUSTAR', emoji: '🔧', cor: '#ffd700', significado: 'O conselho recomenda correções pontuais antes de avançar de fase.' },
    pivotar: { label: 'PIVOTAR', emoji: '🔄', cor: '#ff6b6b', significado: 'O conselho identificou um problema estrutural na tese atual.' },
  };

  const conselhoId = id('cns');
  const ata = {
    id: conselhoId,
    projetoId: projeto.id,
    projeto: projeto.nome,
    userId: user.id,
    realizadoEm: new Date().toISOString(),
    fase: projeto.fase,
    radar: { score: radar.score, tier: radar.tier },
    conselheiros: conselheiros.map(c => ({ id: c.id, nome: c.nome, emoji: c.emoji, casta: c.casta })),
    pareceres,
    veredito: { ...VEREDITO[vencedor], id: vencedor, consenso, votos },
    // Encaminhamentos: as recomendações viram plano de ação priorizado
    planoAcao: pareceres
      .sort((a, b) => b.confianca - a.confianca)
      .slice(0, 5)
      .map((p, i) => ({ ordem: i + 1, agente: p.nome, emoji: p.emoji, acao: p.recomendacao, porque: p.risco })),
    riscos: pareceres.map(p => ({ agente: p.nome, emoji: p.emoji, risco: p.risco })),
    modo: config.hasApiKey ? 'ia' : 'demo',
  };

  store.conselhos[conselhoId] = ata;
  save();
  return ata;
}

export function conselhosDoProjeto(projetoId, userId) {
  return Object.values(store.conselhos)
    .filter(c => c.projetoId === projetoId && c.userId === userId)
    .sort((a, b) => b.realizadoEm.localeCompare(a.realizadoEm));
}
