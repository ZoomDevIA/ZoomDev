// ═══════════════════════════════════════════════════════════════════════════
// O QUE O USUÁRIO PODE LER DE UM ERRO
//
// Mensagem de erro tem dois públicos e eles querem coisas opostas. Quem opera
// quer o corpo da resposta do terceiro, o caminho do arquivo, o nome do campo
// que o esquema recusou. Quem está do outro lado da tela quer saber se a culpa
// foi dele, se adianta tentar de novo, e o que dizer ao suporte.
//
// Mandar o texto do primeiro para o segundo não é só ruído: é mapa da casa
// para quem estiver procurando brecha, e já apareceu na plataforma como
// "Isometric respondeu 502 em /projects: {…}" dentro de um aviso de tela.
//
// A regra é a mesma do tratador global em index.js, e mora aqui para as rotas
// SSE poderem aplicar a mesma régua: elas respondem por um fluxo de eventos,
// não passam pelo tratador, e cada uma escrevia o próprio `e.message`.
// ═══════════════════════════════════════════════════════════════════════════

export const GENERICA = 'Algo quebrou do nosso lado. Tente de novo em instantes; '
  + 'se insistir, informe o código abaixo ao suporte.';

/** Código curto que liga o que o usuário vê ao que ficou no log. */
export function referencia() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * O que pode sair para o cliente.
 * 4xx e os 5xx marcados `publico: true` (os "não configurado", escritos de
 * propósito para quem opera) saem inteiros. O resto vira frase neutra, com
 * uma referência que também é gravada no log.
 */
export function paraCliente(e, contexto = 'erro') {
  const status = e?.status || 500;
  if (status < 500 || e?.publico) {
    return { error: e?.message || 'Requisição inválida.', code: e?.code, status };
  }
  const ref = referencia();
  console.error(`[${contexto} ${ref}]`, e);
  return { error: GENERICA, code: e?.code || 'ERRO_INTERNO', ref, status };
}
