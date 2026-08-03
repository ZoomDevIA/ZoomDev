import React, { useEffect, useState } from 'react';
import { ligarNaInterface, tocar, vibrar } from '../lib/som.js';

// ═══════════════════════════════════════════════════════════════════════════
// CAMADA SENSORIAL — o que a plataforma faz quando você acerta.
//
// Três retornos, os mesmos que todo jogo usa há trinta anos porque funcionam:
//
//   SOM       curto, na ação. Confirma que o clique chegou.
//   NÚMERO    o XP sobe do ponto onde a ação aconteceu e some. É o retorno
//             mais viciante que existe, e custa um elemento e uma animação.
//   TATO      vibração curta no celular, só em conquista. Usar em tudo
//             transformaria o aparelho num chocalho.
//
// Nada disso é decorativo por acaso: sem retorno, ganhar 25 XP é uma linha
// que muda num canto da tela e ninguém vê. Com retorno, é um evento.
// ═══════════════════════════════════════════════════════════════════════════

const VIDA = 1500;   // quanto tempo o número fica na tela

export default function Sensorial() {
  const [ganhos, setGanhos] = useState([]);

  // O ouvinte de clique fica na raiz, uma vez só: assim toda tela ganha som
  // sem ser reescrita, e desligar é remover um ouvinte.
  useEffect(() => ligarNaInterface(), []);

  useEffect(() => {
    let n = 0;
    const aoGanhar = (e) => {
      const { xp, tipo, x, y } = e.detail || {};
      if (tipo === 'conquista') { tocar('conquista'); vibrar([14, 70, 26]); }
      else if (tipo === 'nivel') { tocar('nivel'); vibrar([18, 60, 18, 60, 34]); }
      else tocar('xp');

      if (!xp) return;
      const id = `g${n += 1}`;
      // Sem posição conhecida, sobe do canto onde vivem as etiquetas de estado.
      setGanhos(g => [...g, {
        id, xp, tipo,
        x: x ?? window.innerWidth - 150,
        y: y ?? 54,
      }]);
      setTimeout(() => setGanhos(g => g.filter(i => i.id !== id)), VIDA);
    };
    window.addEventListener('zd:ganho', aoGanhar);
    return () => window.removeEventListener('zd:ganho', aoGanhar);
  }, []);

  if (!ganhos.length) return null;

  return (
    <div className="zd-ganhos" aria-hidden>
      {ganhos.map(g => (
        <span key={g.id} className={`zd-ganho ${g.tipo === 'nivel' ? 'nivel' : ''}`}
          style={{ left: g.x, top: g.y }}>
          +{g.xp} XP
        </span>
      ))}
    </div>
  );
}

/**
 * Dispara o retorno sensorial. A posição do ponteiro é lida na hora do
 * disparo, para o número subir de onde a pessoa clicou, e não de um canto
 * qualquer da tela.
 */
export function anunciarGanho({ xp = 0, tipo = 'xp' } = {}) {
  const p = ultimoPonteiro;
  window.dispatchEvent(new CustomEvent('zd:ganho', {
    detail: { xp, tipo, x: p?.x, y: p?.y },
  }));
}

let ultimoPonteiro = null;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    ultimoPonteiro = { x: e.clientX, y: e.clientY };
  }, true);
}
