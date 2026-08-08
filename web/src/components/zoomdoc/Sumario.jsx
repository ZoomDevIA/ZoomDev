import React, { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// SUMÁRIO — a espinha do documento, sempre à vista.
//
// Num plano de negócios de quarenta páginas, rolar para achar a seção de
// mercado é o gesto mais repetido do dia. O sumário existe para que esse
// gesto vire um clique.
//
// Ele se reconstrói a cada alteração de título porque é derivado do documento,
// não uma lista mantida à parte que envelhece em silêncio.
// ═══════════════════════════════════════════════════════════════════════════

const RECUO = { 1: 'pl-0', 2: 'pl-3', 3: 'pl-6', 4: 'pl-9' };
const PESO = { 1: 'font-bold text-[11.5px]', 2: 'text-[11px]', 3: 'text-[10.5px]', 4: 'text-[10px]' };

export default function Sumario({ estrutura = [], onIr, ativo = null }) {
  const [busca, setBusca] = useState('');

  // Fechar a busca com Esc é o reflexo de quem digita rápido
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') setBusca(''); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const termo = busca.trim().toLowerCase();
  const itens = termo
    ? estrutura.filter(i => i.texto.toLowerCase().includes(termo))
    : estrutura;

  return (
    <aside className="w-[212px] shrink-0 border-r border-[#00e5ff1f] flex flex-col bg-[#07120e] hidden md:flex">
      <div className="px-3 py-2.5 border-b border-[#00e5ff14] shrink-0">
        <div className="hud-caps text-[9px] text-white/35 flex items-center gap-1.5 mb-2">
          <Icon nome="lista" tam={11} className="text-[color:var(--zd-acento)]" />
          Sumário
          <span className="ml-auto hud-tec text-white/22">{estrutura.length}</span>
        </div>
        <div className="relative">
          <Icon nome="busca" tam={11}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar seção"
            className="hud-campo w-full text-[10.5px] pl-7 pr-2 py-1.5"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {itens.length === 0 && (
          <p className="px-3 py-4 text-[10.5px] text-white/28 leading-relaxed">
            {termo
              ? 'Nenhuma seção com esse termo.'
              : 'Os títulos que você escrever aparecem aqui.'}
          </p>
        )}

        {itens.map((i, k) => (
          <button
            key={`${i.pos}-${k}`}
            onClick={() => onIr?.(i.pos)}
            title={i.texto}
            className={`w-full text-left px-3 py-1.5 leading-snug transition-colors border-l-2 ${
              RECUO[i.nivel] || 'pl-9'} ${PESO[i.nivel] || PESO[4]} ${
              ativo === i.pos
                ? 'border-[#00e5ff] text-[color:var(--zd-acento)] bg-[#00e5ff0f]'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/4 hover:border-[#00e5ff55]'}`}
          >
            <span className="block truncate">{i.texto}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
