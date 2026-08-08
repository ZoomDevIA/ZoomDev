import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// COPILOTO MAIÁ — anel, fio e painel.
//
// A moldura tem três peças e elas são as mesmas nos três estados:
//
//   RECOLHIDO   ( anel )
//   PRÉVIA      painel ──fio── anel
//   ABERTO      janela com o anel no cabeçalho, ligado pelo mesmo fio
//
// Recolhido é só o anel com o rosto dela: um alvo pequeno, que não disputa
// atenção com o conteúdo da página. Aproximar o mouse, ou tocar com o dedo,
// desenha o fio e abre a prévia. Só o clique abre a conversa.
//
// A composição da prévia é espelhada em relação ao desenho de referência
// (painel à esquerda, anel à direita) porque o widget vive no canto inferior
// direito: abrir para a direita seria abrir para fora da tela. No cabeçalho da
// janela aberta, onde há largura, a ordem original volta.
// ═══════════════════════════════════════════════════════════════════════════

const ABERTURA = 'Olá! Sou a **Maiá** 🌸, a Inteligência Regenerativa da ZoomDev. Acompanho você da primeira ideia ao primeiro contrato: ciência, bioeconomia, editais e carbono. Por onde começamos?';

const ROSTO = '/assets/agents/faces/maia.webp';

export default function Copiloto() {
  const [aberto, setAberto] = useState(false);
  const [previa, setPrevia] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fim = useRef(null);
  const doca = useRef(null);
  const campo = useRef(null);

  // Sem mouse não existe passar por cima: no celular o primeiro toque abre a
  // prévia e o segundo abre a conversa, então o dedo também tem os dois passos.
  const semHover = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && !window.matchMedia('(hover: hover)').matches;

  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      api.chatHistorico().then(h => {
        setMensagens(h.length ? h : [{ role: 'assistant', content: ABERTURA }]);
      }).catch(() => setMensagens([{ role: 'assistant', content: ABERTURA }]));
    }
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens, pensando]);

  // Ao abrir, o cursor já fica no campo: quem clicou quer escrever.
  useEffect(() => { if (aberto) campo.current?.focus(); }, [aberto]);

  const abrirConversa = useCallback(() => { setPrevia(false); setAberto(true); }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [aberto]);

  // No toque, a prévia se fecha ao tocar em outro lugar da página.
  useEffect(() => {
    if (!previa || !semHover) return undefined;
    const fora = (e) => { if (!doca.current?.contains(e.target)) setPrevia(false); };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [previa, semHover]);

  const enviar = async (e) => {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || pensando) return;
    setTexto('');
    const novas = [...mensagens, { role: 'user', content: msg }];
    setMensagens(novas);
    setPensando(true);
    try {
      const r = await api.chat(novas);
      setMensagens(m => [...m, { role: 'assistant', content: r.resposta }]);
    } catch (err) {
      setMensagens(m => [...m, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setPensando(false);
    }
  };

  // Renderização leve de markdown (negrito apenas)
  const md = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') ? <b key={i} className="text-white/95">{seg.slice(2, -2)}</b> : seg);

  if (aberto) {
    return (
      <div
        className="maia-janela hud-painel hud-4 fixed bottom-[18px] right-[18px] z-40 flex flex-col"
        role="dialog"
        aria-label="Maiá, Inteligência Regenerativa"
      >
        {/* Cabeçalho: anel, fio e identidade, na ordem do desenho de origem */}
        <header className="flex items-center gap-0 px-3.5 pt-3.5 pb-3 border-b border-[#00e5ff26]">
          <span className="maia-anel" style={{ '--tam': '38px' }}>
            <img src={ROSTO} alt="" />
          </span>
          <span className="maia-fio" style={{ width: 14 }} />
          <div className="min-w-0 flex-1 pl-2.5">
            <div className="hud-caps text-[11px] leading-none">Maiá</div>
            <div className="hud-tec text-[8.5px] text-[color:var(--zd-acento)] mt-1 flex items-center gap-1.5 uppercase">
              <span className="hud-pulso" style={{ color: '#00ff64', width: 5, height: 5 }} />
              Inteligência Regenerativa
            </div>
          </div>
          <button onClick={() => setAberto(false)} title="Fechar" aria-label="Fechar"
            className="text-white/35 hover:text-white transition-colors p-1 shrink-0">
            <Icon nome="fechar" tam={15} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5"
          style={{
            backgroundImage: 'linear-gradient(180deg, rgba(4,16,10,.95), rgba(4,16,10,.97)), url(/assets/site/chat-bg.webp)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
          {mensagens.map((m, i) => (
            <div key={i}
              className={`maia-bolha hud-painel max-w-[86%] px-3 py-2 ${m.role === 'user' ? 'ml-auto' : ''}`}
              style={m.role === 'user'
                ? { '--cor': '#00c8ff5c', '--fundo': '#06202b' }
                : { '--cor': '#00ff6433', '--fundo': '#07170f' }}>
              {/* O conteúdo precisa ser um elemento: o preenchimento do painel
                  é pintado por ::after e cobriria um nó de texto solto. */}
              <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-white/82">
                {md(String(m.content))}
              </div>
            </div>
          ))}
          {pensando && (
            <div className="maia-bolha hud-painel max-w-[86%] px-3 py-2"
              style={{ '--cor': '#00ff6433', '--fundo': '#07170f' }}>
              <div className="hud-tec text-[10px] text-[color:var(--zd-acento)] uppercase cursor-agente">Pensando</div>
            </div>
          )}
          <div ref={fim} />
        </div>

        <form onSubmit={enviar} className="p-2.5 border-t border-[#00e5ff26] flex gap-2">
          <input ref={campo} className="hud-campo flex-1 min-w-0 px-3 py-2.5 text-[13px]"
            placeholder="Pergunte sobre seu projeto…"
            value={texto} onChange={e => setTexto(e.target.value)} />
          <button type="submit" disabled={pensando || !texto.trim()}
            title="Enviar" aria-label="Enviar"
            className="hud-botao px-3.5 shrink-0 inline-flex items-center justify-center">
            <Icon nome="setaDireita" tam={15} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={doca}
      className="maia-doca"
      data-previa={previa ? 'true' : 'false'}
      onMouseEnter={semHover ? undefined : () => setPrevia(true)}
      onMouseLeave={semHover ? undefined : () => setPrevia(false)}
    >
      {/* Prévia: o painel que se desdobra à esquerda do anel */}
      <div className="maia-previa">
        <button
          type="button"
          onClick={abrirConversa}
          tabIndex={previa ? 0 : -1}
          aria-hidden={!previa}
          className="hud-painel hud-4 hud-p text-left pl-3 pr-3.5 py-2 block whitespace-nowrap"
          style={{ '--cor': '#00e5ff7a', '--fundo': '#04140a' }}
        >
          <div className="hud-caps text-[10px] leading-none text-white/92">Maiá</div>
          <div className="hud-tec text-[8px] text-[color:var(--zd-acento)] mt-1 uppercase">Inteligência Regenerativa</div>
        </button>
      </div>

      <span className="maia-fio" aria-hidden />

      <button
        type="button"
        className="maia-anel"
        aria-label="Maiá, Inteligência Regenerativa"
        aria-expanded={previa}
        title="Maiá: Inteligência Regenerativa"
        // Só foco de teclado abre a prévia. Um toque também dá foco, e sem
        // este filtro o dedo abriria a prévia e a conversa no mesmo gesto.
        onFocus={(e) => { if (e.target.matches(':focus-visible')) setPrevia(true); }}
        onBlur={() => setPrevia(false)}
        onClick={() => {
          // Com mouse, o hover já abriu a prévia e o clique vai direto à
          // conversa. Com o dedo, o primeiro toque revela quem é ela.
          if (semHover && !previa) setPrevia(true);
          else abrirConversa();
        }}
      >
        <img src={ROSTO} alt="" />
      </button>
    </div>
  );
}
