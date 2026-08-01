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
    nomeSugerido: '',
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
    });
    return { ...r, origem: 'ia' };
  } catch (e) {
    if (e.code === 'REFUSAL') throw e;
    return { ...classificarHeuristica(descricao), origem: 'heuristica-fallback' };
  }
}
