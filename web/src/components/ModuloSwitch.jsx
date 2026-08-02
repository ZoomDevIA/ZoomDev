import React, { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// MÓDULO SWITCH: botão liga/desliga que se arrasta para os lados.
//
// Três formas de acionar, todas equivalentes:
//   · arrastar a alavanca (mouse ou dedo): passou da metade, troca
//   · clicar em qualquer lugar do trilho
//   · teclado: Espaço/Enter alternam, ← → escolhem o lado
//
// A caixa de contexto aparece no hover/foco, ANTES do clique: ela explica o
// que a ativação faz e o que se perde ao desligar. O texto vem do servidor
// (rota /api/home), então nunca descreve algo diferente do que o módulo faz.
// ═══════════════════════════════════════════════════════════════════════════

const LARGURA = 74;   // trilho
const ALTURA = 34;
const RAIO = 27;      // alavanca
const CURSO = LARGURA - RAIO - 7;   // deslocamento máximo

export default function ModuloSwitch({ modulo, ligado, onChange, disabled = false }) {
  const trilho = useRef(null);
  const [arrastando, setArrastando] = useState(false);
  const [x, setX] = useState(ligado ? CURSO : 0);
  const [contexto, setContexto] = useState(false);
  const cor = modulo.cor || '#00ff64';

  useEffect(() => { if (!arrastando) setX(ligado ? CURSO : 0); }, [ligado, arrastando]);

  const posicaoDoPonteiro = useCallback((clientX) => {
    const r = trilho.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.max(0, Math.min(CURSO, clientX - r.left - RAIO / 2 - 3));
  }, []);

  const iniciar = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setArrastando(true);
    setX(posicaoDoPonteiro(e.clientX));
  };

  const mover = (e) => {
    if (!arrastando) return;
    setX(posicaoDoPonteiro(e.clientX));
  };

  const soltar = (e) => {
    if (!arrastando) return;
    setArrastando(false);
    const destino = posicaoDoPonteiro(e.clientX) > CURSO / 2;
    // Arrastou de fato? Vale a posição. Foi um toque seco? Alterna.
    const moveuPouco = Math.abs(posicaoDoPonteiro(e.clientX) - (ligado ? CURSO : 0)) < 6;
    const novo = moveuPouco ? !ligado : destino;
    setX(novo ? CURSO : 0);
    if (novo !== ligado) onChange(novo);
  };

  const tecla = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!ligado); }
    if (e.key === 'ArrowRight' && !ligado) { e.preventDefault(); onChange(true); }
    if (e.key === 'ArrowLeft' && ligado) { e.preventDefault(); onChange(false); }
  };

  const info = ligado ? modulo.aoDesligar : modulo.aoLigar;

  return (
    <div
      className="relative h-full"
      onMouseEnter={() => setContexto(true)}
      onMouseLeave={() => setContexto(false)}
    >
      <div
        className={`h-full rounded-2xl border p-4 transition-all duration-300 flex flex-col gap-2.5 ${disabled ? 'opacity-60' : ''}`}
        style={{
          borderColor: ligado ? `${cor}66` : 'rgba(255,255,255,.10)',
          background: ligado ? `${cor}10` : 'rgba(255,255,255,.025)',
          boxShadow: ligado ? `0 0 24px ${cor}22` : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0 leading-none" aria-hidden>{modulo.emoji}</span>

          <div className="min-w-0 flex-1">
            <div className="font-heading font-bold text-sm leading-tight">{modulo.nome}</div>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border inline-block mt-1"
              style={ligado
                ? { color: cor, borderColor: `${cor}55`, background: `${cor}1a` }
                : { color: '#ffffff55', borderColor: 'rgba(255,255,255,.14)' }}
            >
              {ligado ? 'ligado' : 'desligado'}
            </span>
          </div>

          {/* Trilho arrastável */}
          <div
            ref={trilho}
            role="switch"
            aria-checked={ligado}
            aria-label={`${modulo.nome}: ${ligado ? 'ligado' : 'desligado'}`}
            aria-describedby={`ctx-${modulo.id}`}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={iniciar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            onKeyDown={tecla}
            onFocus={() => setContexto(true)}
            onBlur={() => setContexto(false)}
            className={`relative shrink-0 rounded-full border select-none touch-none outline-none focus-visible:ring-2 ${
              disabled ? 'cursor-not-allowed' : arrastando ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              width: LARGURA, height: ALTURA,
              borderColor: ligado ? `${cor}77` : 'rgba(255,255,255,.16)',
              background: ligado
                ? `linear-gradient(90deg, ${cor}44, ${cor}22)`
                : 'rgba(255,255,255,.05)',
              boxShadow: ligado ? `inset 0 0 14px ${cor}33` : 'inset 0 1px 3px rgba(0,0,0,.4)',
            }}
          >
            {/* Marcas dos dois lados: o botão diz para onde arrastar */}
            <span className="absolute inset-y-0 left-2.5 flex items-center text-[8px] font-bold tracking-widest"
              style={{ color: ligado ? '#04140a99' : 'transparent' }}>ON</span>
            <span className="absolute inset-y-0 right-2.5 flex items-center text-[8px] font-bold tracking-widest"
              style={{ color: ligado ? 'transparent' : '#ffffff33' }}>OFF</span>

            <span
              className="absolute top-1/2 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                width: RAIO, height: RAIO, left: 3,
                transform: `translate(${x}px, -50%)`,
                transition: arrastando ? 'none' : 'transform .28s cubic-bezier(.34,1.56,.64,1), background .28s',
                background: ligado ? `linear-gradient(135deg, ${cor}, #ffffff)` : 'rgba(255,255,255,.22)',
                boxShadow: ligado ? `0 2px 10px ${cor}88` : '0 2px 6px rgba(0,0,0,.5)',
                color: ligado ? '#04140a' : '#ffffff66',
              }}
            >
              {ligado ? '✓' : '·'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-white/50 leading-snug">{modulo.chamada}</p>
      </div>

      {/* Caixa de contexto: aparece antes de acionar, explicando a ativação */}
      {contexto && (
        <div
          id={`ctx-${modulo.id}`}
          role="tooltip"
          className="absolute z-30 left-0 right-0 top-full mt-2 rounded-xl border p-4 zd-pop"
          style={{
            background: '#04120af7',
            borderColor: `${cor}44`,
            backdropFilter: 'blur(16px)',
            boxShadow: `0 12px 40px rgba(0,0,0,.55), 0 0 22px ${cor}1f`,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: cor }}>
            {info.titulo}
          </div>
          <p className="text-[12px] text-white/72 leading-relaxed">{info.corpo}</p>

          {info.ganhos && (
            <ul className="mt-2.5 space-y-1">
              {info.ganhos.map((g, i) => (
                <li key={i} className="text-[11px] text-white/60 flex gap-1.5 leading-snug">
                  <span className="shrink-0" style={{ color: cor }}>▸</span>{g}
                </li>
              ))}
            </ul>
          )}

          {info.custo && (
            <div className="text-[10px] text-white/40 mt-2.5 pt-2.5 border-t border-white/8">{info.custo}</div>
          )}
        </div>
      )}
    </div>
  );
}
