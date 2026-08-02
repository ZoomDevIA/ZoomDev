// ═══════════════════════════════════════════════════════════════════════════
// VITRINE DA COMUNIDADE: o que a home mostra abaixo da caixa de ideação.
//
// Publicar é ato do fundador, projeto por projeto. Nada aparece aqui sem que
// alguém tenha clicado em publicar.
//
// Duas regras inegociáveis, herdadas da doutrina de confidencialidade:
//   · nada de dado de contato, e-mail ou identificador de pessoa física;
//   · a descrição passa por um higienizador que remove CNPJ, CPF, códigos de
//     processo e afins antes de sair para a rota pública.
// O autor aparece pelo primeiro nome. É vitrine de ideia, não de gente.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save } from '../store.js';

const LIMITE_DESCRICAO = 260;

// Padrões que nunca devem sair numa rota pública, mesmo que o fundador digite.
const PADROES_SENSIVEIS = [
  [/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[documento]'],           // CNPJ
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[documento]'],                    // CPF
  [/\b(SEI|ART|CRC|PROCESSO)\s*[:nº°]*\s*[\d./-]{5,}/gi, '[processo]'],     // códigos de processo
  [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '[contato]'],                           // e-mail
  // O DDD entre parênteses precisa entrar no casamento, senão sobra um "(" solto
  [/(?:\+55\s*)?(?:\(\d{2}\)|\b\d{2})\s?9?\d{4}[-\s]?\d{4}\b/g, '[contato]'], // telefone
];

export function higienizar(texto) {
  let t = String(texto || '');
  for (const [re, subst] of PADROES_SENSIVEIS) t = t.replace(re, subst);
  return t;
}

function resumir(texto) {
  const limpo = higienizar(texto).replace(/\s+/g, ' ').trim();
  return limpo.length > LIMITE_DESCRICAO ? `${limpo.slice(0, LIMITE_DESCRICAO).trimEnd()}…` : limpo;
}

function estadoVitrine() {
  if (!store.vitrine) store.vitrine = { destaques: [], ocultos: [] };
  return store.vitrine;
}

/** Projeção pública de um projeto. É a única forma de um projeto sair daqui. */
export function projetarProjeto(proj, autor) {
  const v = estadoVitrine();
  const modulos = proj.modulos || {};
  return {
    id: proj.id,
    nome: higienizar(proj.nome),
    resumo: resumir(proj.plano?.resumoExecutivo || proj.descricao),
    classificacao: proj.classificacao,
    vertical: proj.vertical,
    fase: proj.fase,
    autor: (autor?.nome || 'Fundador').split(' ')[0],
    publicadoEm: proj.publicadoEm || proj.criadoEm,
    destaque: v.destaques.includes(proj.id),
    // Sinais de maturidade: é o que faz a vitrine ser interessante de olhar
    temPlano: Boolean(proj.plano),
    temMvp: proj.mvp?.status === 'pronto',
    modulos: { carbono: Boolean(modulos.carbono), bio: proj.classificacao === 'biostartup' || Boolean(modulos.bio) },
    curtidas: proj.curtidas?.length || 0,
  };
}

/** Vitrine pública, destaques primeiro e depois os mais recentes. */
export function listarVitrine({ limite = 24, filtro = 'todos' } = {}) {
  const v = estadoVitrine();
  const itens = Object.values(store.projects)
    .filter(p => p.publicado && !v.ocultos.includes(p.id))
    .map(p => projetarProjeto(p, store.users[p.userId]))
    .filter(p => filtro === 'todos'
      || (filtro === 'bio' && p.classificacao === 'biostartup')
      || (filtro === 'startup' && p.classificacao === 'startup')
      || (filtro === 'carbono' && p.modulos.carbono))
    .sort((a, b) => (Number(b.destaque) - Number(a.destaque)) || b.publicadoEm.localeCompare(a.publicadoEm))
    .slice(0, Math.min(Number(limite) || 24, 60));

  return itens;
}

/** Números reais do ecossistema, sem inventar nada e sem identificar ninguém. */
export function estatisticasPublicas() {
  const projetos = Object.values(store.projects);
  const publicados = projetos.filter(p => p.publicado);
  return {
    projetos: projetos.length,
    publicados: publicados.length,
    planos: projetos.filter(p => p.plano).length,
    mvps: projetos.filter(p => p.mvp?.status === 'pronto').length,
    fundadores: Object.keys(store.users).length,
    biostartups: projetos.filter(p => p.classificacao === 'biostartup').length,
  };
}

export function publicar(proj, publicado) {
  proj.publicado = Boolean(publicado);
  proj.publicadoEm = proj.publicado ? new Date().toISOString() : null;
  save();
  return proj;
}

// ── Curadoria (capacidade comunidade.curar) ────────────────────────────────
export function alternarDestaque(projetoId, destacar) {
  const v = estadoVitrine();
  v.destaques = v.destaques.filter(id => id !== projetoId);
  if (destacar) v.destaques.unshift(projetoId);
  store.vitrine = v;
  save();
  return v;
}

export function alternarOculto(projetoId, ocultar) {
  const v = estadoVitrine();
  v.ocultos = v.ocultos.filter(id => id !== projetoId);
  if (ocultar) v.ocultos.push(projetoId);
  store.vitrine = v;
  save();
  return v;
}

/** Lista para a curadoria: inclui os ocultos, marcados como tal. */
export function listarParaCuradoria() {
  const v = estadoVitrine();
  return Object.values(store.projects)
    .filter(p => p.publicado)
    .map(p => ({ ...projetarProjeto(p, store.users[p.userId]), oculto: v.ocultos.includes(p.id) }))
    .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));
}
