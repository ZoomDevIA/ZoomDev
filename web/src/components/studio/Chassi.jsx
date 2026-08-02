import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CHASSI DO STUDIO — as duas janelas e o que as separa.
//
// CONSOLE à esquerda: a conversa, os anexos, o raciocínio dos agentes.
// PALCO à direita: o que a fase atual pede — documento, código, métricas.
//
// O divisor guarda a proporção em localStorage, porque quem trabalha o dia
// inteiro no editor quer o palco maior e não deve reajustar a cada visita.
//
// Abaixo de 1024px não existe divisor: as duas janelas viram abas. Espremer
// um editor de texto e um console lado a lado num tablet não serve a nenhum
// dos dois.
// ═══════════════════════════════════════════════════════════════════════════

const CHAVE_PROPORCAO = 'zd_studio_console';
const MIN = 22;
const MAX = 62;
const PADRAO = 34;   // o palco pesa mais: é onde o documento e o código moram

export default function Chassi({ console: consoleEl, palco, barraFase, rotuloPalco = 'Palco' }) {
  const raiz = useRef(null);
  const [proporcao, setProporcao] = useState(() => {
    const salvo = Number(localStorage.getItem(CHAVE_PROPORCAO));
    return salvo >= MIN && salvo <= MAX ? salvo : PADRAO;
  });
  const [arrastando, setArrastando] = useState(false);
  const [abaMovel, setAbaMovel] = useState('palco');

  useEffect(() => { localStorage.setItem(CHAVE_PROPORCAO, String(proporcao)); }, [proporcao]);

  const mover = useCallback((clientX) => {
    const r = raiz.current?.getBoundingClientRect();
    if (!r) return;
    const pct = ((clientX - r.left) / r.width) * 100;
    setProporcao(Math.max(MIN, Math.min(MAX, pct)));
  }, []);

  useEffect(() => {
    if (!arrastando) return;
    const aoMover = (e) => mover(e.clientX ?? e.touches?.[0]?.clientX ?? 0);
    const aoSoltar = () => setArrastando(false);
    window.addEventListener('pointermove', aoMover);
    window.addEventListener('pointerup', aoSoltar);
    // O texto selecionado durante o arrasto atrapalha e pisca
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    return () => {
      window.removeEventListener('pointermove', aoMover);
      window.removeEventListener('pointerup', aoSoltar);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [arrastando, mover]);

  // Teclado: o divisor precisa ser operável sem mouse
  const tecla = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setProporcao(p => Math.max(MIN, p - 2)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setProporcao(p => Math.min(MAX, p + 2)); }
    if (e.key === 'Home') { e.preventDefault(); setProporcao(MIN); }
    if (e.key === 'End') { e.preventDefault(); setProporcao(MAX); }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {barraFase}

      {/* Alternador de janela no celular e no tablet */}
      <div className="flex gap-1.5 lg:hidden">
        <button onClick={() => setAbaMovel('console')}
          className={`hud-aba hud-caps flex-1 py-2 text-[10px] flex items-center justify-center gap-1.5 ${
            abaMovel === 'console' ? 'ativa' : ''}`}>
          <Icon nome="enviar" tam={12} /> Console
        </button>
        <button onClick={() => setAbaMovel('palco')}
          className={`hud-aba hud-caps flex-1 py-2 text-[10px] flex items-center justify-center gap-1.5 ${
            abaMovel === 'palco' ? 'ativa' : ''}`}>
          <Icon nome="vitrine" tam={12} /> {rotuloPalco}
        </button>
      </div>

      <div ref={raiz} className="studio" style={{ '--console': `${proporcao}%` }}>
        <div className={`studio-janela ${abaMovel === 'console' ? '' : 'hidden lg:flex'}`}>
          {consoleEl}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(proporcao)}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-label="Ajustar a divisão entre console e palco"
          tabIndex={0}
          onPointerDown={(e) => { e.preventDefault(); setArrastando(true); }}
          onDoubleClick={() => setProporcao(PADRAO)}
          onKeyDown={tecla}
          className={`studio-divisor ${arrastando ? 'arrastando' : ''} outline-none focus-visible:ring-1 focus-visible:ring-[#00e5ff]`}
          title="Arraste para redimensionar · duplo clique restaura"
        />

        <div className={`studio-janela ${abaMovel === 'palco' ? '' : 'hidden lg:flex'}`}>
          {palco}
        </div>
      </div>
    </div>
  );
}
