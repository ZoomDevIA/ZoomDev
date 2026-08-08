import React, { lazy, Suspense } from 'react';
import Icon from '../Icon.jsx';
import { Painel, Rotulo, Botao } from '../hud/index.jsx';
import { faseDe } from './BarraFase.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO — a janela da direita. Uma fase, um palco.
//
// Este arquivo não desenha nada: ele decide qual palco montar e passa o
// contexto adiante. A troca de fase remonta o palco inteiro com animação de
// entrada, para que a mudança seja sentida e não só notada.
//
// Cada palco chega sob demanda. Quem está na ideação não precisa baixar o
// editor de código, e quem está no MVP não precisa do editor de texto: são
// centenas de kilobytes cada um, e ninguém usa os dois no mesmo minuto.
// ═══════════════════════════════════════════════════════════════════════════

const PALCOS = {
  ideacao: lazy(() => import('./PalcoDocumento.jsx')),
  validacao: lazy(() => import('./PalcoMissoes.jsx')),
  mvp: lazy(() => import('./PalcoEstudio.jsx')),
  tracao: lazy(() => import('./PalcoMetricas.jsx')),
  escala: lazy(() => import('./PalcoDataroom.jsx')),
};

export default function Palco({ fase, projeto, ...resto }) {
  const Componente = PALCOS[fase];
  const info = faseDe(fase);

  if (!Componente) {
    return (
      <Painel className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Icon nome="alerta" tam={28} className="text-[#ffc531] mx-auto mb-3" />
          <p className="text-sm text-white/50">Fase desconhecida: {fase}</p>
        </div>
      </Painel>
    );
  }

  return (
    <div key={fase} className="palco-entra flex flex-col h-full min-h-0">
      <Suspense fallback={<Montando cor={info.cor} label={info.palco} />}>
        <Componente projeto={projeto} fase={info} {...resto} />
      </Suspense>
    </div>
  );
}

function Montando({ cor, label }) {
  return (
    <Painel className="flex-1 flex items-center justify-center" tamanho="p" cor={cor}>
      <div className="text-center">
        <Icon nome="atualizar" tam={22} className="animate-spin mx-auto mb-2.5" style={{ color: cor }} />
        <p className="hud-caps text-[9px] text-white/35">montando {label}</p>
      </div>
    </Painel>
  );
}

// ── Moldura comum a todos os palcos ───────────────────────────────────────
// Cabeçalho com rótulo, ações à direita e o conteúdo rolando por dentro.
export function MolduraPalco({ rotulo, titulo, cor = '#00e5ff', acoes = null, children, semRolagem = false }) {
  return (
    <Painel className="flex flex-col h-full overflow-hidden" tamanho="p" cor={cor}>
      <div className="px-4 py-2.5 border-b border-[#00e5ff1f] flex items-center gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <Rotulo cor={cor}>{rotulo}</Rotulo>
          {titulo && <div className="text-[13px] font-bold mt-1 truncate">{titulo}</div>}
        </div>
        {acoes && <div className="flex items-center gap-1.5 shrink-0">{acoes}</div>}
      </div>
      <div className={`flex-1 min-h-0 ${semRolagem ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </div>
    </Painel>
  );
}

// ── Estado vazio, usado por vários palcos ─────────────────────────────────
export function PalcoVazio({ icone, titulo, texto, acao }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <Icon nome={icone} tam={34} className="text-[color:var(--zd-acento)] mx-auto mb-3.5 opacity-70" />
        <h3 className="font-heading font-bold text-[15px]">{titulo}</h3>
        <p className="text-[13px] text-white/45 mt-2 leading-relaxed">{texto}</p>
        {acao && <div className="mt-5">{acao}</div>}
      </div>
    </div>
  );
}

export { Botao };
