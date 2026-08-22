// ═══════════════════════════════════════════════════════════════════════════
// BARRAMENTO DO ECOSSISTEMA — todo módulo publica, qualquer módulo assina.
//
// A regra que o distingue de um event emitter comum: O EVENTO CARREGA O SELO.
// Um dado que entra fraco (HIPOTESE) não vira alegação forte em outro módulo,
// porque o nível de prova viaja junto com o dado e quem consome decide com
// ele na mão. É a regra do elo mais fraco atravessando as fronteiras internas
// da plataforma.
//
// Não confundir com o agentBus.js: aquele orquestra NUDGES da Sexta-Feira
// para pessoas; este transporta FATOS entre módulos (evidência registrada,
// selo recalculado, match de edital). Nomes de evento em minúsculas com
// ponto: `evidencia.registrada`, `selo.recalculado`, `edital.match`.
//
// Persistência: os últimos eventos ficam no store (limite fixo) para o feed
// "barramento · agora" das telas sobreviver a reinício. Assinantes vivem só
// em memória: módulo que quer reagir assina de novo a cada subida, no import.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { SELOS } from '../science/selos.js';

const LIMITE_EVENTOS = 200;
const assinantes = new Map();   // tipo → [fn]; '*' assina tudo

/**
 * Publica um fato no barramento. `selo` é obrigatório por decisão de
 * projeto: evento sem procedência declarada não circula. Use VISAO para o
 * que for apenas intenção e VERIFICADO/LAUDO/CAMPO para fato provado.
 */
export function publicar(tipo, dados = {}, { selo = 'VISAO', userId = null } = {}) {
  if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(String(tipo))) {
    throw Object.assign(new Error(`Nome de evento inválido: "${tipo}". Use minusculas.com.ponto.`), { status: 400 });
  }
  if (!SELOS[selo]) {
    throw Object.assign(new Error(`Selo desconhecido no evento "${tipo}": ${selo}`), { status: 400 });
  }
  const evento = {
    id: id('evt'),
    tipo,
    selo,
    confianca: SELOS[selo].confianca,
    dados,
    userId,
    em: new Date().toISOString(),
  };
  store.eventos.unshift(evento);
  if (store.eventos.length > LIMITE_EVENTOS) store.eventos.length = LIMITE_EVENTOS;
  save();

  for (const fn of [...(assinantes.get(tipo) || []), ...(assinantes.get('*') || [])]) {
    // Assinante que quebra não derruba quem publicou nem os demais assinantes.
    try { fn(evento); } catch (e) { console.error(`barramento: assinante de ${tipo} falhou`, e.message); }
  }
  return evento;
}

/** Assina um tipo de evento ('*' para todos). Devolve a função de cancelar. */
export function assinar(tipo, fn) {
  if (!assinantes.has(tipo)) assinantes.set(tipo, []);
  assinantes.get(tipo).push(fn);
  return () => {
    const lista = assinantes.get(tipo) || [];
    const i = lista.indexOf(fn);
    if (i >= 0) lista.splice(i, 1);
  };
}

/** O feed das telas: eventos mais recentes primeiro, já limitados. */
export function recentes({ limite = 20, tipo = null } = {}) {
  const base = tipo ? store.eventos.filter(e => e.tipo === tipo) : store.eventos;
  return base.slice(0, Math.max(1, Math.min(100, limite)));
}
