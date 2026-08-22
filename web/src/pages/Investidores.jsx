import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

// Investidores: pipeline de captação (base do módulo do protótipo)
// Formata tCO2e sem casas decimais falsamente precisas
const t = (n) => Number(n || 0).toLocaleString('pt-BR');

export default function Investidores() {
  const [projetos, setProjetos] = useState([]);
  const [cdr, setCdr] = useState(null);

  useEffect(() => { api.projetos().then(setProjetos).catch(() => {}); }, []);
  useEffect(() => { api.isometricBenchmark().then(setCdr).catch(() => {}); }, []);

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

      {cdr && (
        <div className="zd-card-glow rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-heading font-bold">Benchmark CDR · Registro Isometric</h2>
            <span
              className={`zd-tag rounded-full px-3 py-1 text-[10px] tracking-wider ${
                cdr.modo === 'real' ? 'text-[#00ff64]' : 'text-[#a855f7]'
              }`}
              title={cdr.fonte}
            >
              {cdr.modo === 'real' ? '● AO VIVO' : '◌ DEMONSTRAÇÃO'}
            </span>
          </div>
          <p className="text-white/55 text-xs mt-1.5">
            O mercado internacional de remoção durável de carbono, no registro que os grandes compradores
            (Microsoft, Stripe Frontier) auditam. É a régua de prova que a ZoomDev usa como referência.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="zd-stat-card rounded-xl p-4">
              <div className="font-heading text-2xl font-bold">{t(cdr.totais.projetos)}</div>
              <div className="text-[11px] text-white/50">projetos no recorte</div>
            </div>
            <div className="zd-stat-card rounded-xl p-4">
              <div className="font-heading text-2xl font-bold zd-gradient-text">{t(cdr.totais.creditosEmitidos)}</div>
              <div className="text-[11px] text-white/50">tCO₂e emitidas (créditos)</div>
            </div>
            <div className="zd-stat-card rounded-xl p-4">
              <div className="font-heading text-2xl font-bold">{t(cdr.totais.creditosAposentados)}</div>
              <div className="text-[11px] text-white/50">tCO₂e aposentadas</div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {cdr.vias.map(v => (
              <div key={v.via.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3.5 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    {v.via.nome}
                    {v.via.elegivelZoomDev && (
                      <span className="zd-tag rounded-full px-2 py-0.5 text-[9px] text-[#00ff64]">rota Coin Max</span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    {v.projetos} projeto{v.projetos === 1 ? '' : 's'} · {v.paises.join(', ') || 'países não informados'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading font-bold text-sm">{t(v.creditosEmitidos)}</div>
                  <div className="text-[10px] text-white/40">tCO₂e emitidas</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#a855f740] bg-[#a855f70d] p-4 mt-4 text-xs text-white/60 leading-relaxed">
            <span className="text-[#a855f7] font-semibold">Leitura ZoomDev · selo {cdr.leituraZoomDev.selo}: </span>
            {cdr.leituraZoomDev.resumo}
          </div>
          {cdr.modo !== 'real' && (
            <div className="text-[10px] text-white/35 mt-2">{cdr.fonte}</div>
          )}
        </div>
      )}

      <div className="zd-card rounded-xl p-5 text-center text-sm text-white/50">
        🤝 O marketplace de investidores (matchmaking + rodadas) chega com o plano BUSINESS. Complete o checklist para entrar na fila de early access.
      </div>
    </div>
  );
}
