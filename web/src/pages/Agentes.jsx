import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import AgentAvatar from '../components/AgentAvatar.jsx';

const FILTROS = ['Todos', 'Bioeconomia', 'Negócios', 'Tecnologia', 'Jurídico', 'ESG'];

export default function Agentes() {
  const [agentes, setAgentes] = useState(null);
  const [filtro, setFiltro] = useState('Todos');

  useEffect(() => { api.agents().then(setAgentes).catch(() => {}); }, []);

  if (!agentes) return <div className="text-white/40">Carregando…</div>;

  const todos = [...agentes.bio, ...agentes.gerais];
  const visiveis = filtro === 'Todos' ? todos : todos.filter(a => a.categoria === filtro);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Agentes <span className="zd-gradient-text">Inteligentes</span></h1>
        <p className="text-white/55 text-sm mt-1.5">
          {todos.length} especialistas trabalhando em paralelo: CEO, CTO, CMO, Dev, Jurídico, ESG e os 5 agentes amazônicos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${filtro === f ? 'zd-gradient-btn' : 'border border-white/15 text-white/55 hover:border-white/35'}`}>
            {f === 'Bioeconomia' ? '🌿 ' : ''}{f}
          </button>
        ))}
      </div>

      {filtro !== 'Negócios' && filtro !== 'Tecnologia' && filtro !== 'Jurídico' && filtro !== 'ESG' && (
        <section>
          <h2 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-3">🌿 Agentes Amazônicos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {agentes.bio.map(a => (
              <div key={a.id} className="zd-agent-card rounded-2xl p-4 text-center border-[#00ff6433]">
                <AgentAvatar agente={a} size="w-24 h-24" />
                <div className="font-heading font-bold text-sm mt-2.5">{a.nome}</div>
                <div className="text-[11px] text-white/50 mt-1">{a.papel}</div>
                <div className="zd-tag rounded-full px-2 py-0.5 inline-block mt-2.5">bio</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filtro !== 'Bioeconomia' && (
        <section>
          <h2 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Agentes Gerais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(filtro === 'Todos' ? agentes.gerais : visiveis.filter(a => !a.is_bio)).map(a => (
              <div key={a.id} className="zd-agent-card rounded-xl p-4 text-center">
                <AgentAvatar agente={a} size="w-20 h-20" rounded="rounded-xl" />
                <div className="text-sm font-bold mt-2">{a.nome}</div>
                <div className="text-[11px] text-white/45 mt-0.5">{a.papel}</div>
                <div className="zd-tag-blue rounded-full px-2 py-0.5 inline-block mt-2">{a.categoria}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="zd-card rounded-xl p-4 text-center text-xs text-white/45">
        Os 5 agentes do plano de negócios (Produto, Negócio, Engenharia, Impacto, Editais) coordenam estes especialistas.
        Em breve: Econ. Agentes — alugue e publique agentes na comunidade.
      </div>
    </div>
  );
}
