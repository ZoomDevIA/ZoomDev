import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// PALETA DE COMANDO — ⌘K / Ctrl+K, de qualquer tela.
//
// Digite o que quer fazer e vá: navegação e ações num campo só, com o
// domínio de cada destino à direita, no vocabulário da casa (CONSTRUIR,
// REGENERAR, PROVAR, CRESCER). A busca ignora acento e maiúscula.
// ═══════════════════════════════════════════════════════════════════════════

const normalizar = (s) => String(s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Paleta({ aberta, fechar, acoes }) {
  const nav = useNavigate();
  const [termo, setTermo] = useState('');
  const [indice, setIndice] = useState(0);
  const campo = useRef(null);

  useEffect(() => {
    if (aberta) { setTermo(''); setIndice(0); setTimeout(() => campo.current?.focus(), 30); }
  }, [aberta]);

  const visiveis = useMemo(() => {
    const t = normalizar(termo);
    if (!t) return acoes.slice(0, 9);
    return acoes
      .map(a => {
        const alvo = normalizar(`${a.rotulo} ${a.dominio || ''} ${a.apelidos || ''}`);
        if (!alvo.includes(t)) return null;
        return { ...a, peso: normalizar(a.rotulo).startsWith(t) ? 0 : 1 };
      })
      .filter(Boolean)
      .sort((a, b) => a.peso - b.peso)
      .slice(0, 9);
  }, [termo, acoes]);

  useEffect(() => setIndice(0), [termo]);

  const executar = (a) => {
    if (!a) return;
    fechar();
    if (a.para) nav(a.para);
    else a.acao?.();
  };

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-center pt-[12vh] px-4"
      style={{ background: '#02080599', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="zd-card-glow rounded-2xl w-full max-w-xl h-fit overflow-hidden"
        role="dialog" aria-label="Paleta de comando">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="text-[10px] font-mono text-[color:var(--zd-acento,#00e5ff)] shrink-0">⌘K</span>
          <input ref={campo} value={termo} onChange={e => setTermo(e.target.value)}
            placeholder="Para onde, ou o quê: registrar evidência, território, editais…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIndice(i => Math.min(i + 1, visiveis.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIndice(i => Math.max(i - 1, 0)); }
              if (e.key === 'Enter') executar(visiveis[indice]);
              if (e.key === 'Escape') fechar();
            }} />
        </div>
        <div className="py-2 max-h-[46vh] overflow-y-auto">
          {visiveis.length === 0 && (
            <div className="px-4 py-3 text-xs text-white/40">
              Nada com esse nome. Tente "evidência", "mapa", "edital", "plano"…
            </div>
          )}
          {visiveis.map((a, i) => (
            <button key={a.rotulo} onMouseEnter={() => setIndice(i)} onClick={() => executar(a)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                i === indice ? 'bg-[#00e5ff12]' : ''}`}>
              <span className="text-[13px] text-white/85">
                <span className="mr-2">{i === indice ? '▣' : '◇'}</span>{a.rotulo}
              </span>
              {a.dominio && (
                <span className="text-[9px] tracking-[.18em] font-mono uppercase text-[color:var(--zd-acento,#00e5ff)]/70 shrink-0">
                  {a.dominio}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-white/8 text-[9.5px] font-mono text-white/30">
          ↑↓ navega · Enter executa · Esc fecha · qualquer tela, qualquer hora
        </div>
      </div>
    </div>
  );
}
