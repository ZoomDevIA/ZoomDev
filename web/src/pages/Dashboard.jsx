import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';
import JourneyBar from '../components/JourneyBar.jsx';
import AgentAvatar from '../components/AgentAvatar.jsx';
import Nudges from '../components/Nudges.jsx';

// Ações rápidas do protótipo (analyzeStartup): market | financial | edital | competitor
const QUICK_ACTIONS = [
  { tipo: 'market', label: 'Analisar mercado', icon: '🔎' },
  { tipo: 'financial', label: 'Análise financeira', icon: '💰' },
  { tipo: 'edital', label: 'Buscar editais', icon: '📋' },
  { tipo: 'competitor', label: 'Análise competitiva', icon: '⚔️' },
];

export default function Dashboard() {
  const { user } = useUser();
  const [projetos, setProjetos] = useState(null);
  const [agentes, setAgentes] = useState(null);
  const [analise, setAnalise] = useState(null); // {tipo, carregando, resultado}

  useEffect(() => {
    api.projetos().then(setProjetos).catch(() => setProjetos([]));
    api.agents().then(setAgentes).catch(() => {});
  }, []);

  const analisar = async (tipo) => {
    const projetoId = projetos?.[0]?.id;
    setAnalise({ tipo, carregando: true });
    try {
      const r = await api.analyze({ tipo, projetoId, nome: projetos?.[0]?.nome, descricao: projetos?.[0]?.descricao });
      setAnalise({ tipo, carregando: false, resultado: r });
    } catch (e) {
      setAnalise({ tipo, carregando: false, erro: e.message });
    }
  };

  // Score de Impacto do protótipo: 7 + ideias×0,2 (máx 9)
  const scoreImpacto = Math.min(9, 7 + (projetos?.length || 0) * 0.2).toFixed(1);

  const stats = [
    { label: 'Projetos Ativos', valor: projetos?.length ?? '…', extra: '+20% este mês', icon: '🚀' },
    { label: 'Ideias Criadas', valor: projetos?.length ?? '…', extra: '+15%', icon: '💡' },
    { label: 'MVPs', valor: projetos?.filter(p => ['mvp', 'tracao', 'escala'].includes(p.fase)).length ?? '…', extra: 'publicados', icon: '📦' },
    { label: 'Investidores', valor: 0, extra: 'Em pipeline', icon: '🤝' },
    { label: 'Score de Impacto', valor: scoreImpacto, extra: 'Excelente 🌿', icon: '🎯' },
    { label: 'Comunidade', valor: '1.2k', extra: 'membros ativos', icon: '👥' },
  ];

  const proximoXp = user.nivel.proximoXp;
  const progresso = proximoXp ? Math.min(100, Math.round((user.nivel.xp / proximoXp) * 100)) : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Hero: copy literal do protótipo, com o background original de floresta digital */}
      <div className="zd-card-glow rounded-2xl p-6 relative overflow-hidden">
        <img src="/assets/site/login-hero.png" alt="" className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(3,13,7,.93) 40%, rgba(3,13,7,.78))' }} />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Bem-vindo de volta, {user.nome}! 👋</h1>
            <p className="text-white/55 text-sm mt-1.5">
              Transforme ideias em impacto real. <span className="zd-green">A Amazônia inspira. A tecnologia impulsiona.</span>
            </p>
          </div>
          <Link to="/ideacao" className="zd-gradient-btn rounded-xl px-6 py-3 text-sm text-center shrink-0">✦ Nova Ideia</Link>
        </div>
        <div className="relative flex flex-wrap gap-2.5 mt-5">
          {QUICK_ACTIONS.map(a => (
            <button key={a.tipo} onClick={() => analisar(a.tipo)}
              className="zd-stat-card rounded-xl px-4 py-2.5 text-sm font-semibold hover:scale-[1.02] transition-transform">
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de análise IA */}
      {analise && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !analise.carregando && setAnalise(null)}>
          <div className="zd-card-glow rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {analise.carregando ? (
              <div className="text-center py-8">
                <div className="text-3xl zd-pulse inline-block">🧠</div>
                <div className="text-sm text-white/60 mt-3">Zoom Intelligence analisando…</div>
              </div>
            ) : analise.erro ? (
              <div className="text-sm text-red-400">{analise.erro}</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading font-bold text-lg">{analise.resultado.titulo}</h3>
                  <div className="zd-tag rounded-full px-3 py-1">Score {analise.resultado.score}/10</div>
                </div>
                <p className="text-sm text-white/70 mt-3 leading-relaxed">{analise.resultado.analise}</p>
                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mt-4 mb-2">Recomendações</div>
                <ul className="space-y-1.5">
                  {analise.resultado.recomendacoes.map((r, i) => (
                    <li key={i} className="text-sm text-white/65 flex gap-2"><span className="zd-green">▸</span>{r}</li>
                  ))}
                </ul>
                <button onClick={() => setAnalise(null)} className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm mt-5 w-full">Fechar</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agent Bus: os agentes antecipam os próximos passos (Sexta-Feira) */}
      <Nudges />

      {/* Banner edital: clone do protótipo */}
      <div className="zd-notification rounded-xl px-5 py-3.5 flex items-center gap-3 justify-between flex-wrap">
        <div className="text-sm">
          📋 <b>Novo edital FINEP Bioeconomia aberto</b>: R$ 200 milhões disponíveis para projetos sustentáveis
        </div>
        <Link to="/editais" className="zd-tag rounded-full px-3 py-1.5 hover:bg-[#00ff6430] transition-colors">Ver Edital →</Link>
      </div>

      {/* 6 stat-cards do protótipo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(s => (
          <div key={s.label} className="zd-stat-card rounded-xl p-4">
            <div className="text-lg">{s.icon}</div>
            <div className="font-heading text-xl font-bold mt-1">{s.valor}</div>
            <div className="text-[11px] text-white/50">{s.label}</div>
            <div className="text-[10px] zd-green-dim mt-0.5">{s.extra}</div>
          </div>
        ))}
      </div>

      {/* Nível do fundador + conquistas */}
      <div className="zd-card rounded-xl p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold">Nível {user.nivel.nivel}: {user.nivel.nome}</div>
          <div className="text-white/45 text-xs">{proximoXp ? `${user.nivel.xp}/${proximoXp} XP para o próximo nível` : 'Nível máximo!'}</div>
        </div>
        <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progresso}%`, background: 'linear-gradient(90deg,#00ff64,#00c8ff)' }} />
        </div>
        {user.gamification.conquistas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user.gamification.conquistas.map(id => {
              const c = user.catalogoConquistas[id];
              return c ? <span key={id} title={c.descricao} className="zd-tag rounded-full px-2.5 py-1">{c.emoji} {c.nome}</span> : null;
            })}
          </div>
        )}
      </div>

      {/* Projetos em destaque */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold">Projetos em Destaque</h2>
          <Link to="/projetos" className="text-xs text-white/45 hover:text-white/80 transition-colors">ver todos →</Link>
        </div>
        {!projetos ? (
          <div className="text-white/40 text-sm">Carregando…</div>
        ) : projetos.length === 0 ? (
          <div className="zd-card rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">🌱</div>
            <div className="font-semibold">Nenhum projeto ainda</div>
            <p className="text-sm text-white/50 mt-1">Plante sua primeira semente: descreva sua ideia e veja a floresta crescer.</p>
            <Link to="/ideacao" className="zd-gradient-btn inline-block rounded-lg px-5 py-2.5 text-sm mt-4">Começar agora →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projetos.slice(0, 3).map(p => (
              <Link key={p.id} to={`/projetos/${p.id}`} className="zd-agent-card rounded-xl p-5 block">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-heading font-bold">{p.nome}</div>
                    <div className="text-xs text-white/45 mt-0.5 line-clamp-1">{p.descricao}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className={p.classificacao === 'biostartup' ? 'zd-tag rounded-full px-2.5 py-1' : 'zd-tag-blue rounded-full px-2.5 py-1'}>
                      {p.classificacao === 'biostartup' ? '🌿 BioStartup' : '🚀 Startup'}
                    </span>
                    {p.plano && <span className="zd-tag rounded-full px-2.5 py-1">📐 Plano pronto</span>}
                  </div>
                </div>
                <div className="mt-3"><JourneyBar jornada={p.jornada} /></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Agentes Inteligentes (preview) */}
      {agentes && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-bold">Agentes Inteligentes</h2>
            <Link to="/agentes" className="text-xs text-white/45 hover:text-white/80 transition-colors">ver todos os {agentes.gerais.length + agentes.bio.length} →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...agentes.bio.slice(0, 2), ...agentes.gerais.slice(0, 4)].map(a => (
              <div key={a.id} className="zd-agent-card rounded-xl p-3.5 text-center">
                <AgentAvatar agente={a} size="w-16 h-16" rounded="rounded-xl" />
                <div className="text-xs font-bold mt-2">{a.nome}</div>
                <div className="text-[10px] text-white/45 mt-0.5 line-clamp-2">{a.papel}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
