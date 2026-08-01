import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Editais & Oportunidades com "IA Calcular Aderência" — clone do protótipo
export default function Editais() {
  const [editais, setEditais] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState('');
  const [scores, setScores] = useState({}); // editalId -> {carregando|score,motivo,proximosPassos}
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.editais().then(setEditais).catch(() => {});
    api.projetos().then(ps => {
      setProjetos(ps);
      if (ps[0]) setProjetoId(ps[0].id);
    }).catch(() => {});
  }, []);

  const calcular = async (editalId) => {
    if (!projetoId) { setErro('Crie um projeto primeiro para calcular a aderência.'); return; }
    setErro(null);
    setScores(s => ({ ...s, [editalId]: { carregando: true } }));
    try {
      const r = await api.editalAderencia(editalId, projetoId);
      setScores(s => ({ ...s, [editalId]: r }));
    } catch (e) {
      setScores(s => ({ ...s, [editalId]: null }));
      setErro(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Editais & <span className="zd-gradient-text">Oportunidades</span></h1>
        <p className="text-white/55 text-sm mt-1.5">Fomento público mapeado para o seu estágio — com score de aderência calculado pela IA.</p>
      </div>

      {projetos.length > 0 && (
        <div className="zd-card rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-white/55">Calcular aderência para:</span>
          <select className="zd-input rounded-lg px-3 py-2 text-sm flex-1 min-w-48" value={projetoId} onChange={e => setProjetoId(e.target.value)}>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.classificacao})</option>)}
          </select>
        </div>
      )}

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      <div className="space-y-4">
        {editais.map(e => {
          const s = scores[e.id];
          return (
            <div key={e.id} className="zd-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-bold">{e.nome}</h2>
                    <span className="zd-tag rounded-full px-2.5 py-1">{e.valor}</span>
                  </div>
                  <div className="text-xs text-white/45 mt-1">{e.orgao} · prazo {new Date(e.prazo + 'T12:00:00').toLocaleDateString('pt-BR')} · foco: {e.foco}</div>
                  <p className="text-sm text-white/60 mt-2">{e.descricao}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {e.tags.map(t => <span key={t} className="zd-tag-blue rounded px-1.5 py-0.5">{t}</span>)}
                  </div>
                </div>
                <div className="w-full sm:w-56 shrink-0">
                  {!s ? (
                    <button onClick={() => calcular(e.id)} className="zd-gradient-btn w-full rounded-lg py-2.5 text-sm">🧠 IA Calcular Aderência</button>
                  ) : s.carregando ? (
                    <div className="text-center text-sm text-white/50 zd-pulse py-2.5">Analisando…</div>
                  ) : (
                    <div className="zd-stat-card rounded-xl p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full" style={{ width: `${s.score}%`, background: 'linear-gradient(90deg,#00ff64,#00c8ff)' }} />
                        </div>
                        <span className="text-sm zd-green font-bold">{s.score}/100</span>
                      </div>
                      <p className="text-[11px] text-white/55 mt-2">{s.motivo}</p>
                      <ul className="mt-2 space-y-1">
                        {s.proximosPassos.map((p, i) => <li key={i} className="text-[10px] text-white/45">▸ {p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
