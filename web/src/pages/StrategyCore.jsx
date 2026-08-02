import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

// Strategy Core: hub de inteligência estratégica (análises IA sobre o projeto)
const ANALISES = [
  { tipo: 'market', titulo: 'Análise de Mercado', icon: '🔎', desc: 'Tamanho, tendências, timing e barreiras' },
  { tipo: 'financial', titulo: 'Análise Financeira', icon: '💰', desc: 'Unit economics, break-even e capital' },
  { tipo: 'competitor', titulo: 'Análise Competitiva', icon: '⚔️', desc: 'Posicionamento e diferenciais defensáveis' },
  { tipo: 'edital', titulo: 'Radar de Editais', icon: '📋', desc: 'Fomento compatível e estratégia de submissão' },
];

export default function StrategyCore() {
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState('');
  const [resultados, setResultados] = useState({}); // tipo -> {carregando|resultado}

  useEffect(() => {
    api.projetos().then(ps => { setProjetos(ps); if (ps[0]) setProjetoId(ps[0].id); }).catch(() => {});
  }, []);

  const rodar = async (tipo) => {
    setResultados(r => ({ ...r, [tipo]: { carregando: true } }));
    try {
      const proj = projetos.find(p => p.id === projetoId);
      const r = await api.analyze({ tipo, projetoId, nome: proj?.nome, descricao: proj?.descricao });
      setResultados(rs => ({ ...rs, [tipo]: { resultado: r } }));
    } catch (e) {
      setResultados(rs => ({ ...rs, [tipo]: { erro: e.message } }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">🧠 Strategy <span className="zd-gradient-text">Core</span></h1>
        <span className="zd-tag rounded-full px-2.5 py-1">IA</span>
      </div>
      <p className="text-white/55 text-sm -mt-3">O cérebro estratégico da sua startup: análises profundas do Zoom Intelligence sobre o seu projeto.</p>

      {projetos.length === 0 ? (
        <div className="zd-card rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">🧠</div>
          <div className="font-semibold">Nenhum projeto para analisar</div>
          <p className="text-sm text-white/50 mt-1">Crie sua primeira ideia e volte aqui para as análises estratégicas.</p>
          <Link to="/ideacao" className="zd-gradient-btn inline-block rounded-lg px-5 py-2.5 text-sm mt-4">Nova Ideia →</Link>
        </div>
      ) : (
        <>
          <div className="zd-card rounded-xl p-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-white/55">Projeto em análise:</span>
            <select className="zd-input rounded-lg px-3 py-2 text-sm flex-1 min-w-48" value={projetoId} onChange={e => { setProjetoId(e.target.value); setResultados({}); }}>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.classificacao})</option>)}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {ANALISES.map(a => {
              const r = resultados[a.tipo];
              return (
                <div key={a.tipo} className="zd-agent-card rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{a.icon}</div>
                    <div className="flex-1">
                      <div className="font-heading font-bold text-sm">{a.titulo}</div>
                      <div className="text-[11px] text-white/45">{a.desc}</div>
                    </div>
                    {r?.resultado && <div className="zd-tag rounded-full px-2.5 py-1">Score {r.resultado.score}/10</div>}
                  </div>
                  {!r && (
                    <button onClick={() => rodar(a.tipo)} className="zd-gradient-btn w-full rounded-lg py-2.5 text-sm mt-4">Executar análise</button>
                  )}
                  {r?.carregando && <div className="text-sm text-white/50 zd-pulse mt-4 text-center py-2">Zoom Intelligence analisando…</div>}
                  {r?.erro && <div className="text-xs text-red-400 mt-3">{r.erro}</div>}
                  {r?.resultado && (
                    <div className="mt-3">
                      <p className="text-xs text-white/65 leading-relaxed">{r.resultado.analise}</p>
                      <ul className="mt-2.5 space-y-1">
                        {r.resultado.recomendacoes.map((rec, i) => (
                          <li key={i} className="text-[11px] text-white/55 flex gap-1.5"><span className="zd-green">▸</span>{rec}</li>
                        ))}
                      </ul>
                      <button onClick={() => rodar(a.tipo)} className="text-[11px] text-white/40 hover:text-white/70 mt-3 transition-colors">↻ refazer análise</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
