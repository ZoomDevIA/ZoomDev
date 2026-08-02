import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';
import AgentAvatar from './AgentAvatar.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CONSELHO DOS AGENTES — órgão colegiado, não um chat com personagens.
// A Sexta-Feira convoca, cada conselheiro fala sob seu PIC, e o veredito sai
// por maioria ponderada pela confiança de cada parecer.
// ═══════════════════════════════════════════════════════════════════════════

const CORES_VEREDITO = { avancar: '#00ff64', ajustar: '#ffd700', pivotar: '#ff6b6b' };

export default function Conselho({ projetoId }) {
  const { celebrar, refreshUser } = useUser();
  const [convocacao, setConvocacao] = useState([]);
  const [atas, setAtas] = useState([]);
  const [ata, setAta] = useState(null);
  const [reunindo, setReunindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    api.conselhoConvocacao(projetoId).then(setConvocacao).catch(() => {});
    api.conselhos(projetoId).then(l => { setAtas(l); if (l[0]) setAta(l[0]); }).catch(() => {});
  }, [projetoId]);

  const reunir = async () => {
    setErro(null); setReunindo(true);
    try {
      const r = await api.realizarConselho(projetoId);
      setAta(r.ata);
      setAtas(a => [r.ata, ...a]);
      celebrar(r.gamificacao);
      await refreshUser();
    } catch (e) { setErro(e.message); }
    finally { setReunindo(false); }
  };

  return (
    <section className="zd-card-glow rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold flex items-center gap-2">⚖️ Conselho dos Agentes</h2>
          <p className="text-xs text-white/50 mt-1 max-w-lg">
            A Sexta-Feira convoca os especialistas certos para a sua fase. Cada um fala só do que domina —
            e o veredito sai por maioria ponderada pela confiança.
          </p>
        </div>
        <button onClick={reunir} disabled={reunindo} className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm shrink-0">
          {reunindo ? 'Conselho reunido…' : atas.length ? '⚖️ Convocar novamente' : '⚖️ Convocar conselho'}
        </button>
      </div>

      {convocacao.length > 0 && !ata && (
        <div className="rounded-xl bg-white/[.04] border border-white/8 p-3.5">
          <div className="text-[11px] font-bold text-white/50 uppercase mb-2">Serão convocados</div>
          <div className="flex flex-wrap gap-1.5">
            {convocacao.map(c => (
              <span key={c.id} className="rounded-full px-2.5 py-1 text-[11px] border"
                style={{ borderColor: `${c.cor}44`, color: c.cor }}>{c.emoji} {c.nome}</span>
            ))}
          </div>
        </div>
      )}

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {ata && (
        <>
          {/* Veredito */}
          <div className="rounded-2xl border p-5" style={{ borderColor: `${CORES_VEREDITO[ata.veredito.id]}44`, background: `${CORES_VEREDITO[ata.veredito.id]}0d` }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl">{ata.veredito.emoji}</span>
              <div className="flex-1 min-w-[180px]">
                <div className="font-heading text-xl font-bold" style={{ color: CORES_VEREDITO[ata.veredito.id] }}>
                  {ata.veredito.label}
                </div>
                <p className="text-xs text-white/60 mt-0.5">{ata.veredito.significado}</p>
              </div>
              <div className="text-right">
                <div className="font-heading text-2xl font-bold" style={{ color: CORES_VEREDITO[ata.veredito.id] }}>
                  {ata.veredito.consenso}%
                </div>
                <div className="text-[10px] text-white/45">de consenso</div>
              </div>
            </div>
            <div className="text-[10px] text-white/35 mt-3">
              {ata.conselheiros.length} conselheiros · {new Date(ata.realizadoEm).toLocaleString('pt-BR')} · Radar {ata.radar.score}/100
            </div>
          </div>

          {/* Plano de ação */}
          <div>
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Plano de ação do conselho</div>
            <div className="space-y-2">
              {ata.planoAcao.map(p => (
                <div key={p.ordem} className="rounded-xl bg-white/[.04] border border-white/8 p-3.5 flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#00ff641a] border border-[#00ff6433] flex items-center justify-center text-[11px] font-bold zd-green shrink-0">
                    {p.ordem}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-white/85">{p.acao}</div>
                    <div className="text-[11px] text-white/45 mt-1">
                      {p.emoji} {p.agente} · <span className="text-[#ff9f43]">risco:</span> {p.porque}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pareceres */}
          <div>
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Pareceres individuais</div>
            <div className="space-y-2">
              {ata.pareceres.map(p => (
                <div key={p.agenteId} className="rounded-xl bg-white/[.04] border border-white/8 overflow-hidden">
                  <button onClick={() => setExpandido(x => x === p.agenteId ? null : p.agenteId)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[.03] transition-colors">
                    <AgentAvatar agente={p} size="w-9 h-9" rounded="rounded-lg" emojiSize="text-base" centralizar={false} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{p.nome}</div>
                      <div className="text-[11px] text-white/50 line-clamp-1">{p.parecer}</div>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                      style={{ background: `${CORES_VEREDITO[p.veredito]}1a`, color: CORES_VEREDITO[p.veredito] }}>
                      {p.veredito}
                    </span>
                    <span className="text-[10px] text-white/35 shrink-0">{p.confianca}%</span>
                  </button>
                  {expandido === p.agenteId && (
                    <div className="px-3 pb-3 space-y-2 text-[11px] leading-relaxed">
                      <p className="text-white/70">{p.parecer}</p>
                      <div className="border-l-2 border-[#ff9f43] pl-2.5 text-white/60"><b className="text-[#ff9f43]">Risco:</b> {p.risco}</div>
                      <div className="border-l-2 border-[#00ff64] pl-2.5 text-white/60"><b className="zd-green">Recomendação:</b> {p.recomendacao}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {atas.length > 1 && (
            <div className="text-[11px] text-white/40">
              {atas.length} conselhos realizados neste projeto. Exibindo o mais recente.
            </div>
          )}
        </>
      )}
    </section>
  );
}
