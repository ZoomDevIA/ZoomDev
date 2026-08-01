import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';
import JourneyBar from '../components/JourneyBar.jsx';

export default function Dashboard() {
  const { user } = useUser();
  const [projetos, setProjetos] = useState(null);

  useEffect(() => { api.projetos().then(setProjetos).catch(() => setProjetos([])); }, []);

  const stats = [
    { label: 'Projetos Ativos', valor: projetos?.length ?? '…', icon: '🚀' },
    { label: 'Planos Gerados', valor: projetos?.filter(p => p.plano).length ?? '…', icon: '📐' },
    { label: 'XP do Fundador', valor: user.gamification.xp, icon: '⚡' },
    { label: 'Conquistas', valor: user.gamification.conquistas.length, icon: '🏆' },
  ];

  const proximoXp = user.nivel.proximoXp;
  const progresso = proximoXp ? Math.min(100, Math.round((user.nivel.xp / proximoXp) * 100)) : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="zd-card-glow rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Você tem uma ideia? <span className="zd-gradient-text">Vamos desenvolvê-la AGORA.</span>
          </h1>
          <p className="text-white/55 text-sm mt-1.5">
            Descreva sua ideia e os 5 agentes ZoomDev geram seu plano de negócios qualificado — e a jornada continua dali.
          </p>
        </div>
        <Link to="/ideacao" className="zd-gradient-btn rounded-xl px-6 py-3 text-sm text-center shrink-0">✦ Nova Ideia</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="zd-stat-card rounded-xl p-4">
            <div className="text-xl">{s.icon}</div>
            <div className="font-heading text-2xl font-bold mt-1">{s.valor}</div>
            <div className="text-xs text-white/50">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="zd-card rounded-xl p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold">Nível {user.nivel.nivel} — {user.nivel.nome}</div>
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

      <section>
        <h2 className="font-heading text-lg font-bold mb-3">Meus Projetos</h2>
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
            {projetos.map(p => (
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
    </div>
  );
}
