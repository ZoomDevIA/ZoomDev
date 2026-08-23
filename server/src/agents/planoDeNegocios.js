// Orquestrador dos 5 agentes ZoomDev: geram juntos o Plano de Negócios qualificado.
// Agentes: Produto, Negócio, Engenharia, Impacto, Editais (definidos no plano de negócios da ZoomDev).
// Cada agente roda em paralelo com prompt e schema próprios; o resultado é mesclado no plano.
import { structured } from './claude.js';
import { config } from '../config.js';
import { mockPlano } from './mockPlano.js';

const str = { type: 'string' };
const arrStr = { type: 'array', items: { type: 'string' } };

export const AGENTES = [
  {
    id: 'produto',
    nome: 'Agente Produto',
    emoji: '🧩',
    papel: 'Escopo, proposta de valor, user stories e priorização',
    schema: {
      type: 'object',
      properties: {
        propostaDeValor: str,
        problema: str,
        solucao: str,
        publicoAlvo: str,
        personas: { type: 'array', items: { type: 'object', properties: { nome: str, descricao: str, dor: str }, required: ['nome', 'descricao', 'dor'], additionalProperties: false } },
        funcionalidadesMvp: arrStr,
        diferenciais: arrStr,
      },
      required: ['propostaDeValor', 'problema', 'solucao', 'publicoAlvo', 'personas', 'funcionalidadesMvp', 'diferenciais'],
      additionalProperties: false,
    },
    prompt: 'Defina produto: proposta de valor clara, problema e solução, público-alvo, 2 personas, funcionalidades essenciais do MVP (máx. 7) e diferenciais competitivos (máx. 5).',
  },
  {
    id: 'negocio',
    nome: 'Agente Negócio',
    emoji: '📊',
    papel: 'Modelo de negócio, mercado, pricing e go-to-market',
    schema: {
      type: 'object',
      properties: {
        modeloDeNegocio: str,
        mercado: { type: 'object', properties: { tam: str, sam: str, som: str, contexto: str }, required: ['tam', 'sam', 'som', 'contexto'], additionalProperties: false },
        concorrentes: { type: 'array', items: { type: 'object', properties: { nome: str, forca: str, fraqueza: str }, required: ['nome', 'forca', 'fraqueza'], additionalProperties: false } },
        pricing: arrStr,
        goToMarket: arrStr,
        projecao12Meses: {
          type: 'array',
          items: { type: 'object', properties: { mes: { type: 'integer' }, receita: { type: 'number' }, clientes: { type: 'integer' } }, required: ['mes', 'receita', 'clientes'], additionalProperties: false },
        },
        swot: {
          type: 'object',
          properties: { forcas: arrStr, fraquezas: arrStr, oportunidades: arrStr, ameacas: arrStr },
          required: ['forcas', 'fraquezas', 'oportunidades', 'ameacas'],
          additionalProperties: false,
        },
      },
      required: ['modeloDeNegocio', 'mercado', 'concorrentes', 'pricing', 'goToMarket', 'projecao12Meses', 'swot'],
      additionalProperties: false,
    },
    prompt: 'Defina o negócio: modelo de receita, mercado TAM/SAM/SOM (valores realistas em R$ com contexto e fonte plausível), 3 concorrentes com força/fraqueza, tabela de pricing (2-3 linhas), plano go-to-market (5 ações), projeção mensal de 12 meses (receita em R$ e nº de clientes, curva realista partindo de 0) e análise SWOT (4 itens por quadrante).',
  },
  {
    id: 'engenharia',
    nome: 'Agente Engenharia',
    emoji: '⚙️',
    papel: 'Arquitetura, stack e roadmap técnico do MVP',
    schema: {
      type: 'object',
      properties: {
        stack: arrStr,
        arquitetura: str,
        roadmapTecnico: { type: 'array', items: { type: 'object', properties: { fase: str, duracao: str, entregas: arrStr }, required: ['fase', 'duracao', 'entregas'], additionalProperties: false } },
        riscosTecnicos: arrStr,
        custoInfraEstimado: str,
      },
      required: ['stack', 'arquitetura', 'roadmapTecnico', 'riscosTecnicos', 'custoInfraEstimado'],
      additionalProperties: false,
    },
    prompt: 'Defina engenharia: stack recomendada (itens curtos), descrição da arquitetura do MVP, roadmap técnico em 3 fases (com duração e entregas), riscos técnicos (máx. 4) e custo mensal estimado de infraestrutura em R$.',
  },
  {
    id: 'impacto',
    nome: 'Agente Impacto',
    emoji: '🌍',
    papel: 'ODS, ESG, KPIs de impacto e riscos',
    schema: {
      type: 'object',
      properties: {
        ods: { type: 'array', items: { type: 'object', properties: { numero: { type: 'integer' }, nome: str, contribuicao: str }, required: ['numero', 'nome', 'contribuicao'], additionalProperties: false } },
        kpisImpacto: arrStr,
        praticasEsg: arrStr,
        riscos: { type: 'array', items: { type: 'object', properties: { risco: str, mitigacao: str }, required: ['risco', 'mitigacao'], additionalProperties: false } },
        pegadaCarbono: str,
      },
      required: ['ods', 'kpisImpacto', 'praticasEsg', 'riscos', 'pegadaCarbono'],
      additionalProperties: false,
    },
    prompt: 'Defina impacto: 2-3 ODS da ONU com a contribuição específica do negócio, KPIs de impacto mensuráveis (máx. 5), práticas ESG aplicáveis (máx. 5), 3 riscos do negócio com mitigação e um parágrafo sobre pegada de carbono da operação e como compensá-la.',
  },
  {
    id: 'editais',
    nome: 'Agente Editais',
    emoji: '📋',
    papel: 'Fomento público: editais e programas compatíveis',
    schema: {
      type: 'object',
      properties: {
        editaisRecomendados: { type: 'array', items: { type: 'object', properties: { nome: str, orgao: str, aderencia: { type: 'integer' }, motivo: str }, required: ['nome', 'orgao', 'aderencia', 'motivo'], additionalProperties: false } },
        documentacaoNecessaria: arrStr,
        dicasSubmissao: arrStr,
      },
      required: ['editaisRecomendados', 'documentacaoNecessaria', 'dicasSubmissao'],
      additionalProperties: false,
    },
    prompt: 'Defina fomento: 3 editais/programas brasileiros compatíveis (ex.: Centelha, FINEP, BNDES, Sebrae, CNPq, fundos estaduais) com órgão, score de aderência 0-100 e motivo; documentação tipicamente necessária (máx. 6 itens); dicas práticas de submissão (máx. 4).',
  },
];

// Missões de validação derivadas do plano (fase seguinte da jornada)
const MISSOES_SCHEMA = {
  type: 'object',
  properties: {
    missoes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { titulo: str, descricao: str, tipo: { type: 'string', enum: ['principal', 'secundaria'] } },
        required: ['titulo', 'descricao', 'tipo'],
        additionalProperties: false,
      },
    },
  },
  required: ['missoes'],
  additionalProperties: false,
};

function systemBase(projeto) {
  const bio = projeto.classificacao === 'biostartup';
  return `Você é um dos 5 agentes especialistas da ZoomDev OS, plataforma brasileira que transforma ideias em startups ("IDEA TO EXIT").
Projeto: "${projeto.nome}": ${projeto.classificacao === 'biostartup' ? 'BioStartup (bioeconomia/impacto ambiental, trilha amazônica)' : 'Startup'}${projeto.vertical ? `, vertical ${projeto.vertical}` : ''}.
Ideia do fundador: ${projeto.descricao}
${bio ? 'Considere o contexto amazônico/bioeconomia: cadeias da sociobiodiversidade, rastreabilidade, créditos de carbono e editais de sustentabilidade (FINEP, BNDES, MCTI).' : ''}
Escreva em pt-BR, específico e prático: nada genérico. Valores monetários em R$.`;
}

/**
 * Gera o plano completo. onProgress(agenteId, status) é chamado a cada etapa.
 * Retorna { plano, missoesValidacao }.
 */
export async function gerarPlano(projeto, onProgress = () => {}) {
  if (!config.hasApiKey) {
    // Modo demo: plano de exemplo determinístico, com progresso simulado
    for (const a of AGENTES) {
      onProgress(a.id, 'executando');
      await new Promise(r => setTimeout(r, 400));
      onProgress(a.id, 'concluido');
    }
    return mockPlano(projeto);
  }

  const system = systemBase(projeto);
  const resultados = {};
  await Promise.all(AGENTES.map(async (agente) => {
    onProgress(agente.id, 'executando');
    try {
      resultados[agente.id] = await structured({
        system: `${system}\nSeu papel: ${agente.nome}, ${agente.papel}.`,
        user: agente.prompt,
        schema: agente.schema,
        effort: 'high',
        maxTokens: 12000,
        papel: 'plano',
      });
      onProgress(agente.id, 'concluido');
    } catch (e) {
      onProgress(agente.id, 'erro');
      throw e;
    }
  }));

  // QA-gate: todas as seções precisam existir para o plano ser cobrado
  for (const a of AGENTES) {
    if (!resultados[a.id]) throw Object.assign(new Error(`Seção ${a.nome} não gerada.`), { code: 'QA_FAIL' });
  }

  onProgress('missoes', 'executando');
  let missoesValidacao = [];
  try {
    const r = await structured({
      system,
      user: `Com base neste plano de negócios (resumo JSON): ${JSON.stringify(resultados).slice(0, 6000)}
Crie 4 missões de VALIDAÇÃO acionáveis e específicas para este projeto (2 principais, 2 secundárias) que o fundador consiga executar em 2 semanas para validar as hipóteses do plano.`,
      schema: MISSOES_SCHEMA,
      effort: 'low',
      maxTokens: 3000,
      papel: 'extracao',
    });
    missoesValidacao = r.missoes.map((m, i) => ({ id: `val_${i}`, ...m, xp: 30 }));
    onProgress('missoes', 'concluido');
  } catch {
    onProgress('missoes', 'erro');
    // Falha nas missões não bloqueia o plano: fallback fica a cargo do chamador
  }

  const plano = {
    geradoEm: new Date().toISOString(),
    modelo: config.model,
    produto: resultados.produto,
    negocio: resultados.negocio,
    engenharia: resultados.engenharia,
    impacto: resultados.impacto,
    editais: resultados.editais,
  };
  return { plano, missoesValidacao };
}
