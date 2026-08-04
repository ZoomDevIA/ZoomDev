import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// REATOR — o núcleo do painel da Sexta-Feira.
//
// É a única peça do painel que usa a cor do tema. Todo o resto do chassi fica
// em cinza translúcido, como na referência: assim o olho tem um alvo só, e o
// alvo é justamente o número que responde "está indo bem?".
//
// Quatro arcos, um por subíndice, e o índice geral no miolo. Os arcos são SVG
// com `stroke-dasharray` porque a porcentagem precisa ser exata: um arco
// desenhado por gradiente cônico erra alguns graus e um medidor que erra é
// pior que medidor nenhum.
//
// Subíndice sem base para medir aparece como traço vazado e legenda "sem
// base", nunca como zero. O servidor manda `null` justamente para isso.
// ═══════════════════════════════════════════════════════════════════════════

const R_ARCO = 78;
const CIRC = 2 * Math.PI * R_ARCO;
const VAO = 10;               // graus de folga entre um arco e o próximo
const ABERTURA = 90 - VAO;    // graus úteis de cada arco
const COMPRIMENTO = (CIRC * ABERTURA) / 360;

// Os quatro cantos, começando no alto à direita e girando no sentido do relógio.
const INICIO = [-85, 5, 95, 185];

export default function Reator({ indice, tamanho = 380 }) {
  const partes = indice?.partes || [];
  const geral = indice?.geral;

  return (
    <div className="reator" style={{ width: tamanho, height: tamanho }}>
      {/* Coroa de traços e varredura: puro CSS, sem elemento por traço */}
      <div className="reator-coroa" aria-hidden />
      <div className="reator-varredura" aria-hidden />

      <svg viewBox="0 0 200 200" className="reator-arcos" aria-hidden>
        {partes.map((p, i) => {
          const pct = p.valor === null ? 0 : Math.max(0, Math.min(100, p.valor)) / 100;
          return (
            <g key={p.id} transform={`rotate(${INICIO[i]} 100 100)`}>
              <circle
                cx="100" cy="100" r={R_ARCO}
                className="reator-trilho"
                strokeDasharray={`${COMPRIMENTO} ${CIRC}`}
              />
              {p.valor !== null && (
                <circle
                  cx="100" cy="100" r={R_ARCO}
                  className="reator-valor"
                  strokeDasharray={`${COMPRIMENTO * pct} ${CIRC}`}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Miolo */}
      <div className="reator-miolo">
        <div className="reator-rotulo">índice do ecossistema</div>
        <div className="reator-numero">
          {geral === null || geral === undefined ? '—' : geral}
          {geral !== null && geral !== undefined && <span className="reator-unidade">%</span>}
        </div>
        <div className="reator-base">
          {indice ? `${indice.medidos} de ${indice.de} medidos` : 'sem leitura'}
        </div>
      </div>

      {/* Legendas nos quatro cantos, ancoradas fora do anel */}
      {partes.map((p, i) => (
        <div key={p.id} className={`reator-legenda canto-${i}`} title={p.descricao}>
          <span className="reator-legenda-nome">{p.label}</span>
          <span className={`reator-legenda-valor ${p.valor === null ? 'vazio' : ''}`}>
            {p.valor === null ? 'sem base' : `${p.valor}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
