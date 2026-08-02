import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

// Nudges do Agent Bus — os agentes (orquestrados pela Sexta-Feira) antecipam
// os próximos passos do fundador. Máx. 2/dia; dispensado não volta.
export default function Nudges() {
  const nav = useNavigate();
  const [nudges, setNudges] = useState([]);

  useEffect(() => { api.nudges().then(setNudges).catch(() => {}); }, []);

  const dispensar = async (n) => {
    setNudges(l => l.filter(x => x.id !== n.id));
    api.nudgeDispensar(n.id).catch(() => {});
  };

  const aceitar = async (n) => {
    api.nudgeAceitar(n.id).catch(() => {});
    nav(n.acao.rota);
  };

  if (!nudges.length) return null;

  return (
    <section className="space-y-3">
      <div className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
        <span className="zd-pulse">✨</span> Seus agentes anteciparam os próximos passos
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {nudges.map(n => (
          <div key={n.id} className="zd-card-glow rounded-xl p-4 flex gap-3 relative">
            <button onClick={() => dispensar(n)} title="Dispensar"
              className="absolute top-2.5 right-3 text-white/30 hover:text-white/70 text-sm transition-colors">✕</button>
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#00ff6433] bg-white/5 shrink-0 flex items-center justify-center text-xl">
              <img src={`/assets/agents/${n.agenteId}.png`} alt={n.agenteNome}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.append(n.agenteEmoji); }} />
            </div>
            <div className="min-w-0 pr-4">
              <div className="text-[10px] zd-green font-semibold">{n.agenteEmoji} {n.agenteNome} antecipou:</div>
              <div className="text-sm font-bold mt-0.5">{n.titulo}</div>
              <p className="text-xs text-white/55 mt-1 leading-relaxed">{n.mensagem}</p>
              <button onClick={() => aceitar(n)} className="zd-tag rounded-full px-3 py-1 mt-2.5 hover:bg-[#00ff6430] transition-colors">
                {n.acao.label}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
