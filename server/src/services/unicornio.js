// ═══════════════════════════════════════════════════════════════════════════
// RADAR UNICÓRNIO: score explicável (0-100) de potencial de cada projeto.
// Dimensões: Plano (25) + Execução (25) + Validação (20) + Fomento (15) +
// Impacto/ESG (15). Cada ponto tem motivo: a Sexta-Feira nunca "acha", ela mostra.
// ═══════════════════════════════════════════════════════════════════════════
import { EDITAIS_SEED } from '../data/seeds.js';
import { diasAtePrazo } from './calendario.js';

/** Aderência heurística projeto × edital (mesma régua do modo demo da plataforma). */
export function aderenciaHeuristica(edital, projeto) {
  const bio = projeto.classificacao === 'biostartup';
  const editalBio = edital.tags.some(t => ['bioeconomia', 'sociobiodiversidade', 'amazônia', 'sustentabilidade'].includes(t));
  const base = edital.id.includes('centelha') || edital.id.includes('catalisa') ? 78 : 62;
  return Math.min(96, base + (bio && editalBio ? 18 : 0) + (!bio && !editalBio ? 10 : 0));
}

// Meia-noite de Brasília, não do contêiner: o servidor roda em UTC e sem o
// fuso explícito o edital fechava três horas antes para quem ia submeter.
export function diasParaPrazo(edital, agora = Date.now()) {
  return diasAtePrazo(edital?.prazo, agora);
}

/** Melhor edital para um projeto: { edital, score, dias }. */
export function melhorEdital(projeto) {
  let melhor = null;
  for (const e of EDITAIS_SEED) {
    const dias = diasParaPrazo(e);
    // Prazo ausente ou malformado não vira "vence hoje": fica de fora.
    if (!Number.isFinite(dias) || dias < 0) continue;
    const score = aderenciaHeuristica(e, projeto);
    if (!melhor || score > melhor.score) melhor = { edital: e, score, dias };
  }
  return melhor;
}

const PONTOS_FASE = { ideacao: 3, validacao: 9, mvp: 15, tracao: 20, escala: 25 };

const SECOES_PLANO = ['produto', 'negocio', 'engenharia', 'impacto', 'editais'];

export function radarProjeto(projeto, user) {
  const dims = [];

  // ── Plano (0-25): qualidade da fundação estratégica ──
  let plano = 0, planoMotivo;
  if (projeto.plano) {
    plano = 15;
    const secoes = SECOES_PLANO.filter(s => projeto.plano[s]).length;
    plano += Math.round((secoes / SECOES_PLANO.length) * 5);
    if (projeto.geracao?.status === 'concluida') plano += 5;
    planoMotivo = `Plano gerado pelos 5 agentes com ${secoes}/5 seções completas${projeto.geracao?.status === 'concluida' ? ', aprovado no QA-gate' : ''}.`;
  } else {
    plano = Math.min(6, Math.round((projeto.descricao || '').length / 60));
    planoMotivo = 'Ainda sem plano de negócios: apenas a ideia estruturada.';
  }
  dims.push({ id: 'plano', label: 'Plano', pontos: Math.min(25, plano), max: 25, motivo: planoMotivo });

  // ── Execução (0-25): quão longe o projeto chegou na jornada ──
  const exec = PONTOS_FASE[projeto.fase] ?? 3;
  dims.push({ id: 'execucao', label: 'Execução', pontos: exec, max: 25, motivo: `Fase atual: ${projeto.fase} (${(projeto.fasesConcluidas || []).length} fase(s) concluída(s)).` });

  // ── Validação (0-20): missões cumpridas = evidência real ──
  const missoes = projeto.missoes || [];
  const feitas = missoes.filter(m => m.concluida).length;
  const val = missoes.length ? Math.round((feitas / missoes.length) * 20) : 0;
  dims.push({
    id: 'validacao', label: 'Validação', pontos: val, max: 20,
    motivo: missoes.length ? `${feitas}/${missoes.length} missões de validação concluídas.` : 'Missões de validação ainda não geradas (dependem do plano).',
  });

  // ── Fomento (0-15): encaixe em janelas de captação não-diluitiva ──
  const me = melhorEdital(projeto);
  const fomento = !me ? 0 : me.score >= 85 ? 15 : me.score >= 70 ? 11 : me.score >= 55 ? 7 : 3;
  dims.push({
    id: 'fomento', label: 'Fomento', pontos: fomento, max: 15,
    motivo: me ? `Melhor aderência: ${me.edital.nome} (${me.score}/100, prazo em ${me.dias} dias).` : 'Nenhum edital aberto compatível.',
  });

  // ── Impacto/ESG (0-15): sustentabilidade como vantagem competitiva ──
  const conquistas = user?.gamification?.conquistas || [];
  let imp = projeto.classificacao === 'biostartup' ? 7 : 3;
  const fatores = [projeto.classificacao === 'biostartup' ? 'biostartup' : 'startup'];
  if (projeto.plano?.impacto) { imp += 4; fatores.push('seção de impacto no plano'); }
  if (conquistas.includes('guardiao_floresta')) { imp += 2; fatores.push('passivo ambiental calculado'); }
  if (conquistas.includes('carbono_neutro')) { imp += 2; fatores.push('emissões compensadas'); }
  dims.push({ id: 'impacto', label: 'Impacto/ESG', pontos: Math.min(15, imp), max: 15, motivo: `Fatores: ${fatores.join(', ')}.` });

  const score = dims.reduce((s, d) => s + d.pontos, 0);
  return { projetoId: projeto.id, nome: projeto.nome, classificacao: projeto.classificacao, fase: projeto.fase, score, tier: tierRadar(score), dimensoes: dims };
}

export function tierRadar(score) {
  if (score >= 80) return { id: 'unicornio', label: 'Unicórnio em formação', emoji: '🦄' };
  if (score >= 60) return { id: 'alto', label: 'Alto potencial', emoji: '🚀' };
  if (score >= 40) return { id: 'promissor', label: 'Promissor', emoji: '🌿' };
  return { id: 'semente', label: 'Semente', emoji: '🌱' };
}
