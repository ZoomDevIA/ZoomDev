// ═══════════════════════════════════════════════════════════════════════════
// CADEIA DE CUSTÓDIA — evidências com hash encadeado, por lote.
//
// Cada evidência referencia o hash da anterior: editar o passado quebra a
// corrente na hora, e o verificador vê exatamente onde. É o que transforma a
// trilha de evidência de "lista de registros" em "registro à prova de
// reescrita silenciosa", a fundação da Sala de Evidência, do passaporte
// público e do dossiê para verificadores.
//
// O hash cobre o CONTEÚDO da evidência (lote, tipo, descrição, selo, anexo e
// data) mais o hash anterior. O que não entra no hash não é prova: campos de
// conveniência podem até existir no registro, mas quem confere a cadeia sabe
// que só o que está no hash está lacrado.
//
// O selo composto do lote segue a regra do elo mais fraco (seloResultante) e
// cada registro novo publica `evidencia.registrada` e `selo.recalculado` no
// barramento, com o selo viajando junto.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { store, save, id } from '../store.js';
import { SELOS, seloResultante } from '../science/selos.js';
import { publicar } from './barramento.js';

const GENESE = 'genese';   // hash anterior da primeira evidência de um lote

function lacrar(conteudo) {
  return crypto.createHash('sha256').update(JSON.stringify(conteudo)).digest('hex');
}

function conteudoLacrado(ev) {
  // A ORDEM dos campos importa: JSON.stringify preserva a ordem de inserção,
  // e mudar esta lista muda todos os hashes futuros. Só acrescente no fim.
  return {
    loteId: ev.loteId,
    tipo: ev.tipo,
    descricao: ev.descricao,
    selo: ev.selo,
    anexoHash: ev.anexoHash,
    em: ev.em,
    anterior: ev.anterior,
  };
}

function trilhaDe(loteId) {
  if (!store.evidencias[loteId]) store.evidencias[loteId] = [];
  return store.evidencias[loteId];
}

/**
 * Registra uma evidência no fim da cadeia do lote.
 * `anexoHash` é o sha256 do arquivo de prova (laudo, foto), calculado por
 * quem anexa: o arquivo em si pode viver onde for, o lacre fica aqui.
 */
export function registrarEvidencia({ loteId, tipo, descricao, selo, anexoHash = null }, userId = null) {
  loteId = String(loteId || '').trim();
  if (!loteId) throw Object.assign(new Error('Informe o lote da evidência.'), { status: 400 });
  if (!String(descricao || '').trim() || String(descricao).length < 10) {
    throw Object.assign(new Error('Descreva a evidência (pelo menos 10 caracteres).'), { status: 400 });
  }
  if (!SELOS[selo]) {
    throw Object.assign(new Error(`Selo inválido: ${selo}. Use um da escada de evidência.`), { status: 400 });
  }
  const trilha = trilhaDe(loteId);
  const ev = {
    id: id('evd'),
    loteId,
    tipo: String(tipo || 'registro').trim().toLowerCase(),
    descricao: String(descricao).trim(),
    selo,
    anexoHash: anexoHash ? String(anexoHash) : null,
    em: new Date().toISOString(),
    anterior: trilha.length ? trilha[trilha.length - 1].hash : GENESE,
    userId,
  };
  ev.hash = lacrar(conteudoLacrado(ev));
  trilha.push(ev);
  save();

  publicar('evidencia.registrada', {
    loteId, evidenciaId: ev.id, tipo: ev.tipo, descricao: ev.descricao.slice(0, 120),
  }, { selo, userId });

  const composto = seloDoLote(loteId);
  publicar('selo.recalculado', { loteId, selo: composto.selo, confianca: composto.confianca },
    { selo: composto.selo, userId });

  return ev;
}

/** A trilha de um lote, mais nova primeiro (a tela lê de cima para baixo). */
export function trilha(loteId) {
  return [...trilhaDe(loteId)].reverse();
}

/**
 * Selo composto do lote: o elo mais fraco entre as evidências registradas.
 * Lote sem evidência é VISAO por definição: ainda não provou nada.
 */
export function seloDoLote(loteId) {
  const selos = trilhaDe(loteId).map(e => e.selo);
  const eloFraco = selos.length ? seloResultante(selos) : SELOS.VISAO;
  return { selo: eloFraco.id, confianca: eloFraco.confianca, evidencias: selos.length };
}

/**
 * Decomposição do selo por frente de prova: para cada tipo de evidência do
 * lote, o registro mais recente e o selo dele. É o que a Sala de Evidência
 * mostra como "onde estamos fortes, onde está o elo fraco", e o que o
 * passaporte público separa em "já é prova" e "ainda não é".
 */
export function decomposicao(loteId) {
  const porTipo = new Map();
  for (const ev of trilhaDe(loteId)) porTipo.set(ev.tipo, ev);   // a mais recente vence
  return [...porTipo.values()]
    .map(ev => ({
      tipo: ev.tipo, selo: ev.selo, confianca: SELOS[ev.selo].confianca,
      descricao: ev.descricao, em: ev.em,
    }))
    .sort((a, b) => b.confianca - a.confianca);
}

/**
 * Confere a cadeia inteira do lote, hash a hash.
 * Devolve as quebras com posição e motivo: "está íntegra" sem dizer onde
 * quebrou não serve para ninguém que precise consertar ou denunciar.
 */
export function verificarCadeia(loteId) {
  const trilhaLote = trilhaDe(loteId);
  const quebras = [];
  let anteriorEsperado = GENESE;
  trilhaLote.forEach((ev, posicao) => {
    if (ev.anterior !== anteriorEsperado) {
      quebras.push({ posicao, evidenciaId: ev.id, motivo: 'o elo não referencia o hash anterior' });
    }
    if (lacrar(conteudoLacrado(ev)) !== ev.hash) {
      quebras.push({ posicao, evidenciaId: ev.id, motivo: 'o conteúdo foi alterado depois do lacre' });
    }
    anteriorEsperado = ev.hash;
  });
  return {
    loteId,
    registros: trilhaLote.length,
    integra: quebras.length === 0,
    quebras,
    ancora: trilhaLote.length ? trilhaLote[trilhaLote.length - 1].hash : null,
  };
}
