import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// PRÉ-LEITURA — o sistema entendendo a ideia enquanto ela ainda está sendo
// digitada, para que o documento apareça rápido quando a pessoa enviar.
//
// As quatro travas de disparo não são detalhe de implementação: sem elas isso
// chamaria a IA a cada tecla e queimaria a conta do fundador em minutos.
//
//   1. mínimo de 25 palavras       texto curto não tem o que extrair
//   2. pausa de 1,6s               dispara quando a pessoa para de digitar
//   3. intervalo de 20s            teto de uma chamada por vez nesse período
//   4. memória por texto           reescrever a mesma frase não dispara de novo
//
// A chamada roda em esforço baixo e devolve só sinais estruturados, não prosa.
// ═══════════════════════════════════════════════════════════════════════════

const MIN_PALAVRAS = 25;
const PAUSA_MS = 1600;
const INTERVALO_MS = 20_000;

export default function usePreLeitura(texto, projetoId) {
  const [resultado, setResultado] = useState(null);
  const [pensando, setPensando] = useState(false);
  const ultimaChamada = useRef(0);
  const jaLido = useRef(new Set());
  const abortar = useRef(null);

  const limpar = useCallback(() => {
    setResultado(null);
    setPensando(false);
    abortar.current?.abort();
  }, []);

  useEffect(() => {
    const limpo = String(texto || '').trim();
    const palavras = limpo ? limpo.split(/\s+/).length : 0;

    if (palavras < MIN_PALAVRAS) { setResultado(null); return; }

    // Chave por conteúdo: voltar a um texto já lido não gasta chamada nova
    const chave = limpo.slice(0, 600);
    if (jaLido.current.has(chave)) return;

    const temporizador = setTimeout(async () => {
      if (Date.now() - ultimaChamada.current < INTERVALO_MS) return;
      ultimaChamada.current = Date.now();
      jaLido.current.add(chave);

      abortar.current?.abort();
      const controle = new AbortController();
      abortar.current = controle;

      setPensando(true);
      try {
        const r = await api.preLeitura({ texto: limpo, projetoId }, controle.signal);
        if (!controle.signal.aborted) setResultado(r);
      } catch {
        // Pré-leitura é aceleração, não requisito: falhar aqui não pode
        // atrapalhar quem está escrevendo.
      } finally {
        if (!controle.signal.aborted) setPensando(false);
      }
    }, PAUSA_MS);

    return () => clearTimeout(temporizador);
  }, [texto, projetoId]);

  useEffect(() => () => abortar.current?.abort(), []);

  return { resultado, pensando, limpar };
}
