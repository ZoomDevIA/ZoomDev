import React, { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// IGNIÇÃO — a partida do sistema.
//
// Entre digitar a senha e ver o painel existe um vazio de um a dois segundos.
// Antes era uma palavra pulsando. Agora é a partida: a logo gira, as linhas de
// estado aparecem em sequência e o painel cresce por trás.
//
// Não é enfeite gratuito. O tempo de espera existe de qualquer jeito, e uma
// espera com narrativa é uma espera mais curta na cabeça de quem espera. É o
// mesmo motivo pelo qual jogo nenhum mostra "carregando" e mais nada.
//
// Regras que o desenho respeita:
//   · a aplicação monta ATRÁS, então quando a cortina sai já está tudo pronto;
//   · clicar pula, porque na décima vez ninguém quer assistir de novo;
//   · com movimento reduzido ou desligado, dura o mínimo e não gira.
// ═══════════════════════════════════════════════════════════════════════════

const LINHAS = [
  'autenticando credencial',
  'carregando o elenco de agentes',
  'sincronizando a seiva',
  'montando o painel',
];

const PASSO = 300;   // entre uma linha e a seguinte
const RESPIRO = 420; // depois da última, antes de sair

export default function Ignicao({ onFim, nome }) {
  const [passo, setPasso] = useState(0);
  const [saindo, setSaindo] = useState(false);

  const parado = typeof document !== 'undefined'
    && document.documentElement.dataset.movimento === 'desligado';

  useEffect(() => {
    if (parado) { onFim?.(); return undefined; }
    const relogios = LINHAS.map((_, i) => setTimeout(() => setPasso(i + 1), PASSO * (i + 1)));
    const fim = setTimeout(() => setSaindo(true), PASSO * LINHAS.length + RESPIRO);
    const desmonta = setTimeout(() => onFim?.(), PASSO * LINHAS.length + RESPIRO + 420);
    return () => [...relogios, fim, desmonta].forEach(clearTimeout);
  }, [onFim, parado]);

  if (parado) return null;

  return (
    <div
      className={`zd-ignicao ${saindo ? 'saindo' : ''}`}
      onClick={() => { setSaindo(true); setTimeout(() => onFim?.(), 300); }}
      role="status"
      aria-live="polite"
      aria-label="Carregando a plataforma"
    >
      <div className="zd-ignicao-miolo">
        <div className="zd-ignicao-anel">
          <Logo className="w-16 h-16" />
        </div>

        <div className="font-heading font-bold text-xl mt-6 tracking-tight">
          Zoom<span className="zd-gradient-text">Dev</span> OS
        </div>
        {nome && (
          <div className="hud-tec text-[10px] text-white/40 mt-1.5 uppercase tracking-[.2em]">
            bem-vindo, {nome}
          </div>
        )}

        <ul className="mt-7 space-y-1.5 text-left">
          {LINHAS.map((l, i) => (
            <li key={l} className={`zd-ignicao-linha ${i < passo ? 'feita' : ''}`}>
              <span className="zd-ignicao-marca" />
              <span className="hud-tec text-[10.5px]">{l}</span>
            </li>
          ))}
        </ul>

        <div className="zd-ignicao-barra" style={{ '--pct': `${(passo / LINHAS.length) * 100}%` }}>
          <i />
        </div>

        <div className="hud-tec text-[8.5px] text-white/20 mt-4 uppercase tracking-[.18em]">
          toque para pular
        </div>
      </div>
    </div>
  );
}
