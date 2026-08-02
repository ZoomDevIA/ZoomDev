import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// ELENCO — 35 agentes em 4 castas.
// Núcleo Internacional e Conselho Amazônico são a identidade da plataforma e
// não podem ser desligados. A Reserva o administrador ativa quando precisa.
// ═══════════════════════════════════════════════════════════════════════════

function Avatar({ a, size = 'w-12 h-12' }) {
  return (
    <div className={`${size} rounded-xl overflow-hidden border shrink-0 flex items-center justify-center text-xl`}
      style={{ borderColor: `${a.cor}44`, background: `${a.cor}14` }}>
      <img src={`/assets/agents/${a.id}.png`} alt={a.nome} className="w-full h-full object-cover object-top"
        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.append(a.emoji); }} />
    </div>
  );
}

export default function Agentes() {
  const { user } = useUser();
  const [elenco, setElenco] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = () => api.elenco().then(setElenco).catch(e => setErro(e.message));
  useEffect(() => { carregar(); }, []);

  const alternar = async (a, ativo) => {
    setErro(null);
    try { await api.elencoAtivacao(a.id, ativo); await carregar(); }
    catch (e) { setErro(e.message); }
  };

  if (!elenco) return <div className="text-white/40 text-sm">Carregando elenco…</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Elenco de <span className="zd-gradient-text">Agentes</span></h1>
          <p className="text-white/55 text-sm mt-1.5">
            {elenco.ativos} de {elenco.total} agentes em campo, organizados em quatro castas.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="zd-tag rounded-full px-3 py-1.5">{elenco.ativos} ativos</span>
          <span className="zd-tag-blue rounded-full px-3 py-1.5">{elenco.total} no elenco</span>
        </div>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {elenco.castas.map(casta => (
        <section key={casta.id}>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <span className="text-xl">{casta.emoji}</span>
            <h2 className="font-heading text-lg font-bold">{casta.nome}</h2>
            <span className="zd-tag rounded-full px-2.5 py-1">
              {casta.agentes.filter(a => a.ativo).length}/{casta.agentes.length} ativos
            </span>
          </div>
          <p className="text-xs text-white/45 mb-3 max-w-3xl">{casta.descricao}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {casta.agentes.map(a => (
              <div key={a.id}
                className={`zd-agent-card rounded-2xl p-4 transition-opacity ${a.ativo ? '' : 'opacity-55'}`}
                style={a.ativo ? { borderColor: `${a.cor}2e` } : undefined}>
                <div className="flex items-start gap-3">
                  <Avatar a={a} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-sm">{a.nome}</span>
                      {a.copiloto && <span className="zd-tag rounded-full px-1.5 py-0.5">copiloto</span>}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5 leading-snug">{a.papel}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${a.ativo ? 'bg-[#00ff64]' : 'bg-white/20'}`}
                    title={a.ativo ? 'Em campo' : 'Em reserva'} />
                </div>

                <button onClick={() => setAberto(x => x === a.id ? null : a.id)}
                  className="text-[11px] zd-green mt-2.5 hover:underline">
                  {aberto === a.id ? 'ocultar protocolo ▴' : 'ver protocolo ▾'}
                </button>

                {aberto === a.id && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/8 space-y-2.5">
                    <div>
                      <div className="text-[10px] font-bold text-white/40 uppercase">Especialidade</div>
                      <p className="text-[11px] text-white/65 mt-1 leading-relaxed">{a.especialidade}</p>
                    </div>
                    {a.cooperacao?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-white/40 uppercase">Coopera com</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.cooperacao.map(c => <span key={c} className="zd-tag-blue rounded-full px-2 py-0.5">{c}</span>)}
                        </div>
                      </div>
                    )}
                    {a.gatilhos?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-white/40 uppercase">Gatilhos preditivos</div>
                        <ul className="mt-1 space-y-1">
                          {a.gatilhos.map((g, i) => (
                            <li key={i} className="text-[11px] text-white/55 flex gap-1.5"><span className="zd-green shrink-0">⚡</span>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {user?.isAdmin && casta.id === 'STANDBY' && (
                  <button onClick={() => alternar(a, !a.ativo)}
                    className={`w-full rounded-lg py-2 text-xs font-semibold mt-3 transition-colors ${
                      a.ativo ? 'border border-white/15 text-white/60 hover:bg-white/5' : 'zd-gradient-btn'}`}>
                    {a.ativo ? 'Recolher para a reserva' : '⚡ Ativar agente'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
