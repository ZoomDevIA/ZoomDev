import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

export default function Planos() {
  const { user } = useUser();
  const [planos, setPlanos] = useState([]);

  useEffect(() => { api.planos().then(setPlanos).catch(() => {}); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Planos e <span className="zd-gradient-text">Cobrança</span></h1>
        <p className="text-white/55 text-sm mt-1.5">Créditos justos: custo exibido antes de cada ação e estorno automático quando a IA falha.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {planos.map((p, i) => {
          const atual = user.plano === p.id;
          const destaque = p.id === 'pro';
          return (
            <div key={p.id} className={`rounded-2xl p-6 flex flex-col ${destaque ? 'zd-card-glow zd-glow-green border-[#00ff6440]' : 'zd-card'}`}>
              {destaque && <div className="zd-tag rounded-full px-2.5 py-1 self-start mb-3">Mais popular</div>}
              <div className="font-heading text-xl font-bold">{p.nome}</div>
              <div className="mt-2">
                <span className="font-heading text-3xl font-bold zd-gradient-text">{p.preco === 0 ? 'Grátis' : `R$ ${p.preco}`}</span>
                {p.preco > 0 && <span className="text-white/40 text-sm">/mês</span>}
              </div>
              <div className="text-xs text-white/50 mt-1">🌿 {p.creditos.toLocaleString('pt-BR')} de seiva/mês</div>
              <p className="text-sm text-white/60 mt-3 flex-1">{p.descricao}</p>
              <button disabled={atual} className={`rounded-xl py-3 text-sm mt-5 font-semibold transition-all ${atual ? 'bg-white/10 text-white/40 cursor-default' : 'zd-gradient-btn'}`}>
                {atual ? 'Seu plano atual' : 'Fazer upgrade →'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="zd-card rounded-xl p-5 text-center text-xs text-white/45">
        Cancelamento em 1 clique, sem fidelidade. Créditos ganhos em missões e na Launch Arena nunca expiram.
      </div>
    </div>
  );
}
