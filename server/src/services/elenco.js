// ═══════════════════════════════════════════════════════════════════════════
// ELENCO DE AGENTES — fusão, castas e ativação governada
//
// 35 agentes em 4 castas. Núcleo, Core e Conselho Amazônico entram ativos;
// a Reserva Estratégica fica pronta e o administrador liga quando precisar.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save } from '../store.js';
import { AGENTES_BIO, AGENTES_GERAIS } from '../data/seeds.js';
import { AGENTES_NUCLEO, CASTAS, castaDe } from '../data/nucleoInternacional.js';
import { PICS_AGENTES } from '../protocols/picAgentes.js';
import { PICS_NUCLEO } from '../protocols/picNucleo.js';
import { imagensDe } from './avatares.js';

/** Catálogo completo, com casta atribuída. */
export const CATALOGO = [
  ...AGENTES_NUCLEO,
  ...AGENTES_BIO,
  ...AGENTES_GERAIS,
].map(a => ({ ...a, casta: castaDe(a.id) }));

export const TODOS_PICS = [...PICS_NUCLEO, ...PICS_AGENTES];

/** Estado de ativação persistido. Padrão vem da casta. */
export function estadoElenco() {
  if (!store.elenco) store.elenco = { ativacao: {}, historico: [] };
  const e = store.elenco;
  let mudou = false;
  for (const a of CATALOGO) {
    if (e.ativacao[a.id] === undefined) {
      e.ativacao[a.id] = CASTAS[a.casta].ativoPorPadrao;
      mudou = true;
    }
  }
  if (mudou) save();
  return e;
}

export function estaAtivo(agenteId) {
  return Boolean(estadoElenco().ativacao[agenteId]);
}

/** Elenco com estado, agrupado por casta. */
export function elencoCompleto() {
  const e = estadoElenco();
  const porCasta = {};
  for (const casta of Object.keys(CASTAS)) porCasta[casta] = { ...CASTAS[casta], agentes: [] };
  for (const a of CATALOGO) {
    const pic = TODOS_PICS.find(p => p.agenteId === a.id);
    porCasta[a.casta].agentes.push({
      ...a,
      ...imagensDe(a.id),
      ativo: Boolean(e.ativacao[a.id]),
      especialidade: pic?.conteudo?.especialidade || a.papel,
      cooperacao: pic?.conteudo?.cooperacao || [],
      gatilhos: pic?.conteudo?.gatilhos || [],
    });
  }
  return {
    castas: Object.values(porCasta),
    total: CATALOGO.length,
    ativos: CATALOGO.filter(a => e.ativacao[a.id]).length,
  };
}

/** Só os agentes ativos — é o que o resto da plataforma consome. */
export function agentesAtivos() {
  const e = estadoElenco();
  return CATALOGO.filter(a => e.ativacao[a.id]);
}

/**
 * Liga ou desliga um agente. Núcleo e Conselho Amazônico não podem ser
 * desligados: são a identidade da plataforma.
 */
export function definirAtivacao(agenteId, ativo, quem = 'admin') {
  const a = CATALOGO.find(x => x.id === agenteId);
  if (!a) throw Object.assign(new Error('Agente não encontrado.'), { status: 404 });
  if (!ativo && (a.casta === 'NUCLEO' || a.casta === 'AMAZONICO')) {
    throw Object.assign(new Error(`${a.nome} pertence ao ${CASTAS[a.casta].nome} e não pode ser desativado.`), { status: 409 });
  }
  const e = estadoElenco();
  e.ativacao[agenteId] = Boolean(ativo);
  e.historico.unshift({ em: new Date().toISOString(), agenteId, nome: a.nome, ativo: Boolean(ativo), quem });
  e.historico = e.historico.slice(0, 60);
  save();
  return { agenteId, nome: a.nome, ativo: Boolean(ativo), casta: a.casta };
}

/** O copiloto do fundador (Maiá). */
export function copiloto() {
  return CATALOGO.find(a => a.copiloto) || CATALOGO[0];
}

/** Formato de compatibilidade para as telas que esperam { gerais, bio }. */
export function agentesLegado() {
  const ativos = agentesAtivos();
  return {
    nucleo: ativos.filter(a => a.casta === 'NUCLEO'),
    bio: ativos.filter(a => a.casta === 'AMAZONICO'),
    gerais: ativos.filter(a => a.casta === 'CORE' || a.casta === 'STANDBY'),
  };
}
