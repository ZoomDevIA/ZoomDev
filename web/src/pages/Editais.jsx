import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// RADAR DE EDITAIS — busca sistêmica diária e match automático com os projetos.
// A plataforma trabalha enquanto o fundador dorme: varre, cruza e alerta.
// ═══════════════════════════════════════════════════════════════════════════

const dataBr = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const corTier = { forte: '#00ff64', boa: '#00c8ff', parcial: '#ffd700', baixa: 'rgba(255,255,255,.35)' };

function ScoreAnel({ score, tier }) {
  const cor = corTier[tier] || corTier.baixa;
  return (
    <div className="text-center shrink-0">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${score} 100`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-sm" style={{ color: cor }}>
          {score}
        </div>
      </div>
      <div className="text-[10px] mt-0.5 capitalize" style={{ color: cor }}>{tier}</div>
    </div>
  );
}

function Sinais({ sinais }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2 mt-3">
      {sinais.map(s => (
        <div key={s.sinal} className="rounded-lg bg-white/[.04] border border-white/8 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-white/75">{s.sinal}</span>
            <span className="text-[11px] font-bold zd-green">{s.pontos}<span className="text-white/30">/{s.max}</span></span>
          </div>
          <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-1.5">
            <div className="h-full rounded-full bg-[#00ff64]" style={{ width: `${(s.pontos / s.max) * 100}%` }} />
          </div>
          <p className="text-[10px] text-white/50 mt-1.5 leading-snug">{s.motivo}</p>
        </div>
      ))}
    </div>
  );
}

export default function Editais() {
  const { user } = useUser();
  const [radar, setRadar] = useState(null);
  const [matches, setMatches] = useState([]);
  const [editais, setEditais] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState('');
  const [aberto, setAberto] = useState(null);
  const [varrendo, setVarrendo] = useState(false);
  const [tab, setTab] = useState('matches');

  const carregar = () => {
    api.editaisRadar().then(setRadar).catch(() => {});
    api.editais().then(setEditais).catch(() => {});
    api.editaisAlertas().then(setAlertas).catch(() => {});
  };

  useEffect(() => {
    carregar();
    api.projetos().then(ps => {
      setProjetos(ps);
      if (ps[0]) setProjetoId(ps[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (projetoId) api.editaisMatchesProjeto(projetoId).then(setMatches).catch(() => {});
  }, [projetoId]);

  const varrer = async () => {
    setVarrendo(true);
    try { await api.editaisVarrer(); carregar(); if (projetoId) setMatches(await api.editaisMatchesProjeto(projetoId)); }
    catch { /* ignora */ }
    finally { setVarrendo(false); }
  };

  const naoLidos = alertas.filter(a => !a.lido);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Radar de <span className="zd-gradient-text">Editais</span></h1>
          <p className="text-white/55 text-sm mt-1.5">
            Varredura sistêmica diária cruzando cada chamada aberta com os seus projetos — automaticamente.
          </p>
        </div>
        {user?.isAdmin && (
          <button onClick={varrer} disabled={varrendo} className="zd-gradient-btn rounded-lg px-4 py-2.5 text-sm shrink-0">
            {varrendo ? 'Varrendo…' : '🔄 Varrer agora'}
          </button>
        )}
      </div>

      {/* Estado do radar */}
      {radar && (
        <div className="zd-card-glow rounded-2xl p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['📡', radar.abertos, 'chamadas abertas', '#00ff64'],
              ['⏳', radar.fechandoEm30Dias, 'fecham em 30 dias', '#ffd700'],
              ['🔍', radar.descobertosPeloRadar, 'descobertas pelo radar', '#00c8ff'],
              ['🔔', naoLidos.length, 'alertas não lidos', '#a855f7'],
            ].map(([e, v, l, c]) => (
              <div key={l} className="zd-stat-card rounded-xl p-3.5">
                <div className="text-base">{e}</div>
                <div className="font-heading text-xl font-bold mt-1" style={{ color: c }}>{v}</div>
                <div className="text-[10px] text-white/50">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/45 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff64] inline-block zd-pulse" />
            Modo: {radar.modo} · última varredura {dataBr(radar.ultimaVarredura)}
            {radar.proximaVarredura && <>· próxima {dataBr(radar.proximaVarredura)}</>}
          </div>
        </div>
      )}

      {/* Alertas */}
      {naoLidos.length > 0 && (
        <section className="space-y-2">
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider">🔔 O radar encontrou para você</div>
          {naoLidos.slice(0, 4).map(a => (
            <div key={a.id} className="zd-notification rounded-xl px-4 py-3 flex items-center gap-3 justify-between flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{a.titulo}</div>
                <div className="text-[11px] text-white/55 mt-0.5">{a.detalhe}</div>
              </div>
              <button onClick={() => { api.editaisAlertaLido(a.id).catch(() => {}); setAlertas(l => l.map(x => x.id === a.id ? { ...x, lido: true } : x)); }}
                className="text-white/35 hover:text-white/70 text-sm shrink-0">✕</button>
            </div>
          ))}
        </section>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {[['matches', '🎯 Meus matches'], ['todos', '📋 Todas as chamadas']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === id ? 'text-[#00ff64] bg-[#00ff6414] border border-[#00ff6433]' : 'text-white/50 hover:text-white/85 hover:bg-white/5 border border-transparent'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <>
          {projetos.length === 0 ? (
            <div className="zd-card rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">🌱</div>
              <div className="font-semibold">Crie um projeto para o radar trabalhar</div>
              <p className="text-sm text-white/50 mt-1">O match é calculado a partir da sua ideia, fase e maturidade.</p>
              <Link to="/ideacao" className="zd-gradient-btn inline-block rounded-lg px-5 py-2.5 text-sm mt-4">Começar agora →</Link>
            </div>
          ) : (
            <>
              <div className="zd-card rounded-xl p-4 flex items-center gap-3 flex-wrap">
                <span className="text-sm text-white/55">Projeto:</span>
                <select className="zd-input rounded-lg px-3 py-2 text-sm flex-1 min-w-48" value={projetoId} onChange={e => setProjetoId(e.target.value)}>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.classificacao})</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {matches.map(m => (
                  <div key={m.editalId} className="zd-card rounded-2xl p-5 hover:border-[#00ff6433] transition-colors">
                    <div className="flex items-start gap-4 flex-wrap">
                      <ScoreAnel score={m.score} tier={m.tier} />
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading font-bold">{m.edital}</h2>
                          <span className="zd-tag rounded-full px-2.5 py-1">{m.valor}</span>
                          {m.dias !== null && m.dias <= 30 && (
                            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold border border-[#ffd70055] text-[#ffd700] bg-[#ffd7000d]">
                              ⏳ {m.dias} dias
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/45 mt-1">
                          {m.orgao}{m.dias !== null ? ` · ${m.dias} dias restantes` : ''}
                        </div>
                        <button onClick={() => setAberto(a => a === m.editalId ? null : m.editalId)}
                          className="text-[11px] zd-green mt-2 hover:underline">
                          {aberto === m.editalId ? 'ocultar decomposição ▴' : 'ver por que esse score ▾'}
                        </button>
                      </div>
                    </div>

                    {aberto === m.editalId && (
                      <>
                        <Sinais sinais={m.sinais} />
                        {m.proximosPassos.length > 0 && (
                          <div className="mt-3 rounded-lg bg-[#00ff640d] border border-[#00ff6426] p-3">
                            <div className="text-[11px] font-bold zd-green mb-1.5">Próximos passos</div>
                            <ul className="space-y-1">
                              {m.proximosPassos.map((p, i) => (
                                <li key={i} className="text-[11px] text-white/65 flex gap-2"><span className="zd-green">▸</span>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'todos' && (
        <div className="space-y-3">
          {editais.map(e => (
            <div key={e.id} className="zd-card rounded-2xl p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold">{e.nome}</h2>
                <span className="zd-tag rounded-full px-2.5 py-1">{e.valor}</span>
                {e.origem === 'radar' && <span className="zd-tag-blue rounded-full px-2 py-0.5">🔍 descoberto pelo radar</span>}
              </div>
              <div className="text-xs text-white/45 mt-1">
                {e.orgao} · {e.dias !== null ? `${e.dias} dias restantes` : 'prazo a confirmar'} · foco: {e.foco}
              </div>
              <p className="text-sm text-white/60 mt-2">{e.descricao}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {(e.tags || []).map(t => <span key={t} className="zd-tag-blue rounded px-1.5 py-0.5">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
