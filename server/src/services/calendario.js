// ═══════════════════════════════════════════════════════════════════════════
// O DIA BRASILEIRO
//
// O servidor roda em UTC. O usuário vive em Brasília, três horas atrás. Toda
// vez que o código escreveu `new Date().toISOString().slice(0, 10)` para saber
// "que dia é hoje", ele acertou por vinte e uma horas e errou por três:
//
//   21h de terça em Brasília  →  00h de quarta em UTC
//
// O estrago não é cosmético. Quem entra na plataforma às nove da noite, todo
// dia, mantinha uma sequência que o sistema via como um dia sim, um dia não:
// a marcação de terça caía em "quarta", a de quarta caía em "quinta", e a
// conta de "ontem" nunca fechava. A sequência quebrava sozinha, sem que a
// pessoa tivesse faltado um dia sequer.
//
// O mesmo three-hour gap vencia editais cedo demais. Um prazo que termina em
// 30 de setembro virava "encerrado" às 21h do dia 30, quando ainda faltavam
// três horas para a meia-noite de quem ia submeter.
//
// Aqui o dia é sempre o dia de Brasília, e o fim do dia é a meia-noite de
// Brasília. O fuso é fixo em -03:00: o Brasil não usa mais horário de verão
// desde 2019, e amarrar isso a uma tabela de fuso do sistema operacional é
// convidar o contêiner a discordar do calendário.
// ═══════════════════════════════════════════════════════════════════════════

export const FUSO_BR = '-03:00';
const DIA_MS = 86_400_000;
const DESLOCAMENTO_MS = 3 * 60 * 60 * 1000;

/** O dia corrente em Brasília, no formato AAAA-MM-DD. */
export function hojeBR(agora = Date.now()) {
  return new Date(agora - DESLOCAMENTO_MS).toISOString().slice(0, 10);
}

/** O dia anterior ao dia BR informado (ou ao de hoje). */
export function ontemBR(agora = Date.now()) {
  return hojeBR(agora - DIA_MS);
}

/** Distância em dias entre dois dias BR: diasEntre('2026-08-24', '2026-08-26') = 2. */
export function diasEntre(de, ate) {
  const a = Date.parse(`${de}T00:00:00${FUSO_BR}`);
  const b = Date.parse(`${ate}T00:00:00${FUSO_BR}`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / DIA_MS);
}

/**
 * O instante em que um prazo AAAA-MM-DD realmente acaba: a última fração do
 * dia em Brasília. Devolve NaN se a data não for válida, para o chamador
 * decidir o que fazer com prazo malformado.
 */
export function fimDoDiaBR(dia) {
  return Date.parse(`${dia}T23:59:59.999${FUSO_BR}`);
}

/** Quantos dias faltam para um prazo AAAA-MM-DD. Zero é "vence hoje". */
export function diasAtePrazo(dia, agora = Date.now()) {
  const t = fimDoDiaBR(dia);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - agora) / DIA_MS);
}
