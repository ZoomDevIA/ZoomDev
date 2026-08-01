import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import JourneyBar from '../components/JourneyBar.jsx';

export default function Projetos() {
  const [projetos, setProjetos] = useState(null);

  useEffect(() => { api.projetos().then(setProjetos).catch(() => setProjetos([])); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Meus <span className="zd-gradient-text">Projetos</span></h1>
          <p className="text-white/55 text-sm mt-1.5">Cada projeto é uma jornada: da Semente 🌱 à Floresta 🌴.</p>
        </div>
        <Link to="/ideacao" className="zd-gradient-btn rounded-xl px-5 py-2.5 text-sm">✦ Nova Ideia</Link>
      </div>

      {!projetos ? (
        <div className="text-white/40 text-sm">Carregando…</div>
      ) : projetos.length === 0 ? (
        <div className="zd-card rounded-xl p-10 text-center">
          <div className="text-3xl mb-2">🌱</div>
          <div className="font-semibold">Nenhum projeto ainda</div>
          <p className="text-sm text-white/50 mt-1">Descreva sua ideia e os 5 agentes constroem o plano de negócios.</p>
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
    </div>
  );
}
