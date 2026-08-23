// Agente de classificação: startup × biostartup (com fallback heurístico no modo demo).
import { structured } from './claude.js';
import { config } from '../config.js';

const SCHEMA = {
  type: 'object',
  properties: {
    classificacao: { type: 'string', enum: ['startup', 'biostartup'] },
    confianca: { type: 'string', enum: ['alta', 'media', 'baixa'] },
    vertical: { type: 'string', enum: ['Health Tech', 'Impacto Social', 'Agro & Food', 'Educação', 'Fintech', 'Bioeconomia', 'Outra'] },
    justificativa: { type: 'string' },
    nomeSugerido: { type: 'string' },
  },
  required: ['classificacao', 'confianca', 'vertical', 'justificativa', 'nomeSugerido'],
  additionalProperties: false,
};

const BIO_TERMOS = [
  'bioeconomia', 'amazôn', 'amazon', 'floresta', 'carbono', 'biodiversidade', 'extrativis',
  'açaí', 'castanha', 'andiroba', 'copaíba', 'cupuaçu', 'ribeirinh', 'indígena', 'quilombo',
  'rastreabilidade', 'esg', 'sustentab', 'reflorest', 'agrofloresta', 'bioinsumo', 'biotec',
  'pesca', 'manejo', 'sociobiodiversidade', 'regenerativ', 'resíduo', 'reciclag', 'energia limpa',
];

// Aberturas de intenção que não dizem nada sobre a ideia. Cada termo exige o
// espaço seguinte para não devorar a primeira letra de uma palavra legítima
// ("a " sim, o "A" de "Assistente" não).
const ABERTURAS = /^\s*(?:(?:eu\s+)?(?:quero|queria|gostaria\s+de|pretendo|preciso|penso\s+em|vou|estou|estamos|queremos)\s+)?(?:(?:criar|construir|desenvolver|fazer|montar|lançar|abrir)\s+)?(?:(?:uma|um|os|as|o|a)\s+)?/i;

// Conectivo sozinho no fim vira gagueira: "Rede de microusinas de" → corta.
const CONECTIVO_FINAL = /\s+(?:que|de|do|da|dos|das|com|para|por|em|no|na|nos|nas|e|ou|a|o|as|os|ao|aos)$/i;

const LIMITE_TITULO = 46;
const MAX_PALAVRAS = 7;

/**
 * Nome de trabalho a partir da descrição, para quando o fundador não nomeia o
 * projeto e o classificador não sugere nada (modo demo). É um rascunho: a
 * ideia é o fundador renomear, não acertar um nome de marca.
 */
export function tituloDeIdeia(descricao) {
  const primeira = String(descricao || '').split(/[.!?\n]/)[0].trim();
  const semAbertura = primeira.replace(ABERTURAS, '').trim() || primeira;

  // Corta em palavra inteira: um título truncado no meio de "satelital" fica pior
  // do que um título mais curto.
  let titulo = '';
  for (const palavra of semAbertura.split(/\s+/).filter(Boolean)) {
    if (titulo && titulo.length + 1 + palavra.length > LIMITE_TITULO) break;
    titulo = titulo ? `${titulo} ${palavra}` : palavra;
    if (titulo.split(' ').length >= MAX_PALAVRAS) break;
  }

  while (CONECTIVO_FINAL.test(titulo)) titulo = titulo.replace(CONECTIVO_FINAL, '');
  titulo = titulo.replace(/[\s,;:–-]+$/, '');

  if (!titulo) return 'Nova ideia';
  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

export function classificarHeuristica(descricao) {
  const t = descricao.toLowerCase();
  const hits = BIO_TERMOS.filter(term => t.includes(term));
  const bio = hits.length >= 1;
  return {
    classificacao: bio ? 'biostartup' : 'startup',
    confianca: hits.length >= 2 ? 'alta' : hits.length === 1 ? 'media' : 'alta',
    vertical: bio ? 'Bioeconomia' : 'Outra',
    justificativa: bio
      ? `Detectados termos ligados à bioeconomia/impacto ambiental: ${hits.slice(0, 4).join(', ')}.`
      : 'Nenhum sinal de bioeconomia/impacto ambiental detectado na descrição.',
    nomeSugerido: tituloDeIdeia(descricao),
  };
}

export async function classificarIdeia(descricao) {
  if (!config.hasApiKey) return { ...classificarHeuristica(descricao), origem: 'heuristica-demo' };
  try {
    const r = await structured({
      system: `Você é o classificador de ideação da ZoomDev OS, plataforma brasileira de criação de startups.
Classifique a ideia do usuário:
- "biostartup": negócios de bioeconomia, floresta/Amazônia, sociobiodiversidade, carbono, ESG ambiental, agrofloresta, biotecnologia verde, economia circular, energia limpa;
- "startup": qualquer outro negócio (mesmo que tenha algum aspecto social).
Escolha também a vertical mais próxima e sugira um nome curto e memorável em pt-BR para o projeto.`,
      user: descricao,
      schema: SCHEMA,
      effort: 'low',
      maxTokens: 2000,
      modelo: config.modelos.extracao,
    });
    return { ...r, origem: 'ia' };
  } catch (e) {
    if (e.code === 'REFUSAL') throw e;
    return { ...classificarHeuristica(descricao), origem: 'heuristica-fallback' };
  }
}
