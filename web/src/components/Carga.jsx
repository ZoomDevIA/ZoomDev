import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CARGA — o que a tela mostra enquanto o dado não chegou.
//
// O defeito que este componente existe para matar aparecia assim:
//
//   if (!elenco) return <div>Carregando elenco…</div>;
//   ...
//   {erro && <div>{erro}</div>}
//
// A saída antecipada vem primeiro, então quando a consulta falha o `erro` é
// preenchido, o `elenco` continua nulo, e a linha do erro nunca é alcançada.
// A pessoa fica olhando "Carregando…" para sempre, sem saber que já acabou,
// sem saber o que houve e sem nada para clicar. Carregando eterno é o pior
// aviso possível, porque não se parece com aviso: parece rede lenta.
//
// Três estados, nesta ordem: erro (com saída), carregando, e o conteúdo.
// ═══════════════════════════════════════════════════════════════════════════

export default function Carga({ erro, oQue = 'os dados', aoTentar, children }) {
  if (erro) {
    return (
      <div className="max-w-lg mx-auto text-center py-14 space-y-3">
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-left">
          {erro}
        </div>
        {aoTentar && (
          <button onClick={aoTentar}
            className="text-xs text-white/50 hover:text-white/85 underline underline-offset-2 transition-colors">
            tentar de novo
          </button>
        )}
      </div>
    );
  }
  if (children != null) return children;
  return <div className="text-white/40 text-sm">Carregando {oQue}…</div>;
}
