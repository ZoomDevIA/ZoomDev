import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// MALHA DO ECOSSISTEMA — tudo conversa com tudo, e você vê a conversa.
//
// Três retratos na mesma tela: os CONECTORES (o diagnóstico público da
// instalação, sem segredo nenhum), o BARRAMENTO ao vivo (os fatos com o selo
// que carregam) e o CENSO de eventos por tipo. A governança viaja com o
// dado: evento que entra fraco aparece fraco aqui também.
// ═══════════════════════════════════════════════════════════════════════════

const COR_SELO = {
  VERIFICADO: '#00ff64', LAUDO: '#00e05a', CAMPO: '#a8e05a', PESQUISA: '#00c8ff',
  ESTRATEGIA: '#ffd700', HIPOTESE: '#ff9f43', VISAO: '#ffffff55',
};

export default function Malha() {
  const [status, setStatus] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(e => setErro(e.message));
    api.barramento(40).then(r => setEventos(r.eventos)).catch(() => {});
  }, []);

  const censo = useMemo(() => {
    const contagem = new Map();
    for (const e of eventos) contagem.set(e.tipo, (contagem.get(e.tipo) || 0) + 1);
    return [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  }, [eventos]);

  const corDaChecagem = (s) => (s === 'ok' ? '#00ff64' : s === 'atencao' ? '#ffc531' : '#ff4d8d');

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Malha do <span className="zd-gradient-text">Ecossistema</span>
        </h1>
        <p className="text-white/55 text-sm mt-1.5">
          Tudo conversa com tudo, e você vê a conversa: conectores, barramento e o selo que cada fato carrega.
        </p>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      <div className="grid lg:grid-cols-[1.1fr_1fr_.8fr] gap-4 items-start">
        <div className="zd-card-glow rounded-2xl p-5">
          <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-3">
            Conectores · diagnóstico da instalação
          </div>
          {!status && <div className="text-xs text-white/35">Carregando…</div>}
          {status?.checagens?.map(c => (
            <div key={c.id} className="py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: corDaChecagem(c.status), boxShadow: `0 0 6px ${corDaChecagem(c.status)}` }} />
                <span className="text-[12.5px] text-white/85 font-semibold flex-1">{c.nome}</span>
                <span className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: corDaChecagem(c.status) }}>{c.status}</span>
              </div>
              <p className="text-[10.5px] text-white/40 mt-1 leading-snug pl-4.5">{c.detalhe}</p>
            </div>
          ))}
          {status && (
            <p className="text-[10px] text-white/35 mt-2.5">
              Resumo: <b className="text-white/60">{status.resumo}</b> · o mesmo retrato vive em /api/status, sem segredo nenhum.
            </p>
          )}
        </div>

        <div className="zd-card rounded-2xl p-5">
          <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-3">
            Barramento · últimos {eventos.length} eventos
          </div>
          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
            {eventos.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <div className="text-[11.5px] text-white/70 font-mono truncate">{e.tipo}</div>
                  {e.dados?.loteId && (
                    <div className="text-[9px] text-white/30 font-mono">{e.dados.loteId}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9.5px] font-mono" style={{ color: COR_SELO[e.selo] || '#ffffff77' }}>
                    {e.selo} {e.confianca}
                  </div>
                  <div className="text-[8.5px] text-white/25 font-mono">{String(e.em).slice(11, 19)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="zd-card rounded-2xl p-5">
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-3">
              Censo · eventos por tipo
            </div>
            {censo.map(([tipo, n]) => (
              <div key={tipo} className="flex items-center gap-2 py-1">
                <span className="text-[10.5px] font-mono text-white/60 flex-1 truncate">{tipo}</span>
                <div className="w-16 h-1.5 rounded bg-white/8 overflow-hidden shrink-0">
                  <div className="h-full rounded" style={{
                    width: `${Math.round((n / (censo[0]?.[1] || 1)) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--zd-marca, #00ff64), var(--zd-acento, #00e5ff))',
                  }} />
                </div>
                <span className="text-[10px] font-mono text-white/45 w-5 text-right shrink-0">{n}</span>
              </div>
            ))}
          </div>
          <div className="zd-card rounded-2xl p-5" style={{ borderColor: '#a855f733' }}>
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-[#a855f7] mb-2">
              Por que isto importa
            </div>
            <p className="text-[11.5px] text-white/55 leading-relaxed">
              O evento carrega o selo junto. Um dado que entra fraco não vira alegação forte em
              outro módulo: a governança viaja com o dado, e esta tela é onde isso se vê.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
