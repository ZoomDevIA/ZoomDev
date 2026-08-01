import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Copiloto flutuante "Zoom Intelligence" — clone do botão + drawer do protótipo.
export default function Copiloto() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fim = useRef(null);

  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      api.chatHistorico().then(h => {
        if (h.length) setMensagens(h);
        else setMensagens([{ role: 'assistant', content: 'Olá! Sou o **Zoom Intelligence** 🤖 — posso ajudar com sua ideia, plano de negócios, editais ou carbono. Por onde começamos?' }]);
      }).catch(() => {});
    }
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens, pensando]);

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

  return (
    <>
      {!aberto && (
        <button onClick={() => setAberto(true)}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full zd-glow-green zd-float overflow-hidden border-2 border-[#00ff64]"
          title="Zoom Intelligence — sua IA de confiança">
          <img src="/assets/site/copiloto-avatar.png" alt="Zoom Intelligence" className="w-full h-full object-cover object-top" />
        </button>
      )}
      {aberto && (
        <div className="fixed bottom-5 right-5 z-40 w-[min(400px,calc(100vw-2rem))] h-[540px] zd-card-glow rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[.03]">
            <img src="/assets/site/copiloto-avatar.png" alt="Zoom Intelligence"
              className="w-9 h-9 rounded-full object-cover object-top border border-[#00ff6433]" />
            <div className="flex-1">
              <div className="text-sm font-bold">Zoom Intelligence</div>
              <div className="text-[10px] zd-green flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff64] inline-block" /> Online</div>
            </div>
            <button onClick={() => setAberto(false)} className="text-white/40 hover:text-white text-lg">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 relative"
            style={{ backgroundImage: 'linear-gradient(180deg, rgba(4,14,8,.94), rgba(4,14,8,.96)), url(/assets/site/chat-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {mensagens.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'ml-auto bg-[#00c8ff1a] border border-[#00c8ff33]' : 'bg-white/[.05] border border-white/10 text-white/80'
              }`}>
                {md(String(m.content))}
              </div>
            ))}
            {pensando && (
              <div className="bg-white/[.05] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white/50 max-w-[85%] zd-pulse">
                Pensando…
              </div>
            )}
            <div ref={fim} />
          </div>
          <form onSubmit={enviar} className="p-3 border-t border-white/10 flex gap-2">
            <input className="zd-input flex-1 rounded-lg px-3 py-2.5 text-sm" placeholder="Pergunte sobre seu projeto…"
              value={texto} onChange={e => setTexto(e.target.value)} />
            <button type="submit" disabled={pensando || !texto.trim()} className="zd-gradient-btn rounded-lg px-4 text-sm">➤</button>
          </form>
        </div>
      )}
    </>
  );
}
