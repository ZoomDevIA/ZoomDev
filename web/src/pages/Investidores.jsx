import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

// Investidores: pipeline de captação (base do módulo do protótipo)
export default function Investidores() {
  const [projetos, setProjetos] = useState([]);

  useEffect(() => { api.projetos().then(setProjetos).catch(() => {}); }, []);

  const comPlano = projetos.filter(p => p.plano);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Conexão com <span className="zd-gradient-text">Investidores</span></h1>
        <p className="text-white/55 text-sm mt-1.5">Prepare-se para captar: o plano de negócios gerado pelos 5 agentes é o seu cartão de visitas.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ['Investidores no pipeline', 0, 'aguardando seu perfil público'],
          ['Planos prontos para envio', comPlano.length, 'gerados pelos 5 agentes'],
          ['Rodadas abertas', 0, 'nenhuma no momento'],
        ].map(([l, v, e]) => (
          <div key={l} className="zd-stat-card rounded-xl p-4">
            <div className="font-heading text-2xl font-bold">{v}</div>
            <div className="text-[11px] text-white/50">{l}</div>
            <div className="text-[10px] zd-green-dim mt-0.5">{e}</div>
          </div>
        ))}
      </div>

      <div className="zd-card-glow rounded-2xl p-6">
        <h2 className="font-heading font-bold">Checklist de prontidão para captação</h2>
        <div className="space-y-2.5 mt-4">
          {[
            ['Plano de negócios qualificado', comPlano.length > 0, 'Gere pelo menos um plano com os 5 agentes', '/ideacao'],
            ['Fase de Validação concluída', projetos.some(p => p.fasesConcluidas?.includes('validacao')), 'Complete as missões principais de Validação', projetos[0] ? `/projetos/${projetos[0].id}` : '/ideacao'],
            ['MVP no ar', projetos.some(p => ['tracao', 'escala'].includes(p.fase)), 'Avance sua jornada até a fase de Tração', projetos[0] ? `/projetos/${projetos[0].id}` : '/ideacao'],
            ['Pitch deck (Auto-Pitch)', false, 'Em breve: geração automática a partir do plano + missões', null],
          ].map(([titulo, ok, dica, link]) => (
            <div key={titulo} className={`rounded-xl border p-4 flex items-center gap-3 ${ok ? 'border-[#00ff6440] bg-[#00ff640d]' : 'border-white/10 bg-white/[.03]'}`}>
              <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs ${ok ? 'border-[#00ff64] bg-[#00ff64] text-[#030d07]' : 'border-white/25'}`}>{ok ? '✓' : ''}</div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${ok ? '' : 'text-white/75'}`}>{titulo}</div>
                {!ok && <div className="text-xs text-white/45 mt-0.5">{dica}</div>}
              </div>
              {!ok && link && <Link to={link} className="zd-tag rounded-full px-3 py-1.5 hover:bg-[#00ff6430] transition-colors shrink-0">ir →</Link>}
            </div>
          ))}
        </div>
      </div>

      <div className="zd-card rounded-xl p-5 text-center text-sm text-white/50">
        🤝 O marketplace de investidores (matchmaking + rodadas) chega com o plano BUSINESS. Complete o checklist para entrar na fila de early access.
      </div>
    </div>
  );
}
