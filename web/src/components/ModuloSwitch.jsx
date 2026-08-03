import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tingir } from './hud/index.jsx';

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
//
// ── Para onde ela abre ────────────────────────────────────────────────────
// Abrindo para baixo, a caixa cobria justamente o botão de construir e os
// números do ecossistema, ou seja, escondia a ação principal no exato momento
// em que a pessoa estava decidindo. Agora ela abre PARA CIMA por padrão, sobre
// a área de digitação, que ninguém está usando enquanto escolhe o módulo, e só
// desce quando não há espaço acima. O conteúdo também encolheu: duas linhas de
// ganho, tipografia menor e teto de altura.
// ═══════════════════════════════════════════════════════════════════════════

const LARGURA = 74;   // trilho
const ALTURA = 34;
const RAIO = 27;      // alavanca
const CURSO = LARGURA - RAIO - 7;   // deslocamento máximo
const ALTURA_CAIXA = 190;   // estimativa usada só para decidir o lado

export default function ModuloSwitch({ modulo, ligado, onChange, disabled = false }) {
  const trilho = useRef(null);
  const cartao = useRef(null);
  const [arrastando, setArrastando] = useState(false);
  const [x, setX] = useState(ligado ? CURSO : 0);
  const [contexto, setContexto] = useState(false);
  const [acima, setAcima] = useState(true);
  const cor = modulo.cor || '#00ff64';

  useEffect(() => { if (!arrastando) setX(ligado ? CURSO : 0); }, [ligado, arrastando]);

  // O lado é decidido na abertura, com a posição real do cartão na janela.
  const abrir = useCallback(() => {
    const r = cartao.current?.getBoundingClientRect();
    if (r) {
      const cabe = r.top >= ALTURA_CAIXA + 12;
      setAcima(cabe || window.innerHeight - r.bottom < ALTURA_CAIXA + 12);
    }
    setContexto(true);
  }, []);

  const fechar = useCallback(() => setContexto(false), []);

  // Sem mouse não existe passar por cima: no celular a caixa abre ao tocar no
  // corpo do cartão e fecha ao tocar em qualquer outro lugar.
  const semHover = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && !window.matchMedia('(hover: hover)').matches;

  useEffect(() => {
    if (!contexto || !semHover) return undefined;
    const fora = (e) => { if (!cartao.current?.contains(e.target)) fechar(); };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [contexto, semHover, fechar]);

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
      ref={cartao}
      className="relative h-full"
      onMouseEnter={semHover ? undefined : abrir}
      onMouseLeave={semHover ? undefined : fechar}
      onClick={semHover ? (e) => {
        if (trilho.current?.contains(e.target)) return;   // a alavanca tem função própria
        if (contexto) fechar(); else abrir();
      } : undefined}
    >
      <div
        className={`hud-painel h-full p-3.5 flex flex-col gap-2 transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}
        style={{
          '--cor': ligado ? `${cor}8a` : 'rgba(255,255,255,.12)',
          '--fundo': ligado ? tingir(cor, 0.09) : '#06140d',
          boxShadow: ligado ? `0 0 26px ${cor}22` : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0 leading-none" aria-hidden>{modulo.emoji}</span>

          <div className="min-w-0 flex-1">
            <div className="font-heading font-bold text-sm leading-tight">{modulo.nome}</div>
            <span
              className="hud-etiqueta mt-1"
              style={ligado
                ? { color: cor, background: `${cor}1a`, boxShadow: `inset 0 0 0 1px ${cor}55` }
                : { color: '#ffffff55', background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)' }}
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
            onFocus={(e) => { if (e.target.matches(':focus-visible')) abrir(); }}
            onBlur={fechar}
            className={`hud-trilho shrink-0 select-none touch-none outline-none focus-visible:ring-2 ${
              disabled ? 'cursor-not-allowed' : arrastando ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              width: LARGURA, height: ALTURA,
              background: ligado
                ? `linear-gradient(90deg, ${cor}4d, ${cor}1f)`
                : 'rgba(255,255,255,.05)',
              boxShadow: ligado
                ? `inset 0 0 0 1px ${cor}88, inset 0 0 16px ${cor}33`
                : 'inset 0 0 0 1px rgba(255,255,255,.16), inset 0 1px 3px rgba(0,0,0,.4)',
            }}
          >
            {/* Marcas dos dois lados: o botão diz para onde arrastar */}
            <span className="hud-tec absolute inset-y-0 left-2.5 flex items-center text-[8px] font-bold"
              style={{ color: ligado ? '#04140abb' : 'transparent' }}>ON</span>
            <span className="hud-tec absolute inset-y-0 right-2.5 flex items-center text-[8px] font-bold"
              style={{ color: ligado ? 'transparent' : '#ffffff33' }}>OFF</span>

            <span
              className="hud-alavanca absolute top-1/2 flex items-center justify-center text-[10px] font-bold"
              style={{
                width: RAIO, height: RAIO, left: 3,
                transform: `translate(${x}px, -50%)`,
                transition: arrastando ? 'none' : 'transform .28s cubic-bezier(.34,1.56,.64,1), background .28s',
                background: ligado ? `linear-gradient(135deg, ${cor}, #ffffff)` : 'rgba(255,255,255,.22)',
                boxShadow: ligado ? `0 2px 10px ${cor}88` : '0 2px 6px rgba(0,0,0,.5)',
                color: ligado ? '#04140a' : '#ffffff66',
              }}
            >
              {ligado ? '//' : '||'}
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
          className={`hud-painel hud-4 hud-p absolute z-30 left-0 right-0 p-3 zd-pop pointer-events-none ${
            acima ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          style={{
            '--cor': `${cor}6b`,
            '--fundo': '#04120a',
            boxShadow: `0 10px 34px rgba(0,0,0,.62), 0 0 18px ${cor}1f`,
          }}
        >
          <div className="hud-caps text-[9px] mb-1" style={{ color: cor }}>
            {info.titulo}
          </div>
          <p className="text-[11px] text-white/70 leading-snug">{info.corpo}</p>

          {info.ganhos && info.ganhos.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {info.ganhos.map((g, i) => (
                <li key={i} className="text-[10px] text-white/55 flex gap-1.5 leading-snug">
                  <span className="shrink-0" style={{ color: cor }}>▸</span>
                  <span className="min-w-0">{g}</span>
                </li>
              ))}
            </ul>
          )}

          {info.custo && (
            <div className="text-[9.5px] text-white/38 mt-2 pt-2 border-t border-white/8 leading-snug">
              {info.custo}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
