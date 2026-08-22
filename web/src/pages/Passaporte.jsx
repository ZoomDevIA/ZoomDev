import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BrandLockup from '../components/BrandLockup.jsx';
import Icon from '../components/Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PASSAPORTE PÚBLICO DO HECTARE — /p/:loteId
//
// A página que o QR abre, sem login. A honestidade é o produto: o que já é
// prova e o que ainda não é aparecem com o mesmo destaque, e o carbono vem
// como estimativa até existir MRV. Quem lê é comprador, auditor, jornalista:
// a página fala a língua deles, não a nossa.
// ═══════════════════════════════════════════════════════════════════════════

const COR_SELO = {
  VERIFICADO: '#00ff64', LAUDO: '#00e05a', CAMPO: '#a8e05a', PESQUISA: '#00c8ff',
  ESTRATEGIA: '#ffd700', HIPOTESE: '#ff9f43', VISAO: '#ffffff55',
};

const rotulo = (tipo) => tipo.replace(/-/g, ' ');

export default function Passaporte() {
  const { loteId } = useParams();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch(`/api/publico/passaporte/${encodeURIComponent(loteId)}`)
      .then(async r => { if (!r.ok) throw new Error((await r.json()).error || 'Falha ao carregar'); return r.json(); })
      .then(setP)
      .catch(e => setErro(e.message));
  }, [loteId]);

  const copiarLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }).catch(() => {});
  };

  if (erro) {
    return (
      <div className="min-h-screen zd-bg flex items-center justify-center p-6">
        <div className="zd-card rounded-2xl p-8 text-center max-w-md">
          <div className="text-3xl mb-3">🛰️</div>
          <h1 className="font-heading text-lg font-bold">Passaporte não encontrado</h1>
          <p className="text-white/50 text-sm mt-2">{erro}</p>
          <Link to="/" className="zd-green text-sm hover:underline mt-4 inline-block">ir para a plataforma</Link>
        </div>
      </div>
    );
  }
  if (!p) return <div className="min-h-screen zd-bg" />;

  const { lote, selo, verificacao } = p;

  return (
    <div className="min-h-screen zd-bg py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <BrandLockup symbolSize={34} wordmarkHeight={26} />
          <div className="text-[10px] tracking-[.22em] font-mono uppercase text-white/40">
            Passaporte público do hectare
          </div>
        </header>

        <div className="zd-card-glow rounded-2xl p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[.2em] font-mono uppercase text-[#00e5ff] mb-2">
                {lote.municipio} · {lote.id}
              </div>
              <h1 className="font-heading text-2xl font-bold">{lote.nome}</h1>
              <div className="text-sm text-white/55 mt-1">
                {lote.ha.toLocaleString('pt-BR')} hectares{lote.cultura ? ` · ${lote.cultura}` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-5xl font-bold" style={{ color: COR_SELO[selo.selo] }}>
                {selo.confianca}
              </div>
              <div className="text-[10px] tracking-[.18em] font-mono uppercase text-white/45 mt-1">
                Selo {selo.selo} · elo mais fraco governa
              </div>
            </div>
          </div>

          {p.demonstracao && (
            <div className="text-[11px] text-white/35 mt-4">◌ {p.aviso}</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-start">
          <section className="zd-card rounded-2xl p-5" style={{ borderColor: '#00ff6433' }}>
            <h2 className="text-[10px] tracking-[.2em] font-mono uppercase text-[#00ff64] mb-3">
              ✓ O que já é prova
            </h2>
            {p.jaEProva.length === 0 && (
              <p className="text-xs text-white/45">Nenhuma frente com evidência de campo ainda.</p>
            )}
            <div className="space-y-2.5">
              {p.jaEProva.map(f => (
                <div key={f.tipo}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-white/85 font-semibold capitalize">{rotulo(f.tipo)}</span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded"
                      style={{ color: COR_SELO[f.selo], border: `1px solid ${COR_SELO[f.selo]}55` }}>
                      {f.selo} {f.confianca}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{f.descricao}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="zd-card rounded-2xl p-5" style={{ borderColor: '#ffc53133' }}>
            <h2 className="text-[10px] tracking-[.2em] font-mono uppercase text-[#ffc531] mb-3">
              ◌ O que ainda não é
            </h2>
            <div className="space-y-2.5">
              {p.aindaNaoE.map(f => (
                <div key={f.tipo}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-white/85 font-semibold capitalize">{rotulo(f.tipo)}</span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded"
                      style={{ color: COR_SELO[f.selo], border: `1px solid ${COR_SELO[f.selo]}55` }}>
                      {f.selo} {f.confianca}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{f.descricao}</p>
                </div>
              ))}
              <div className="rounded-xl border border-[#a855f740] bg-[#a855f70d] p-3.5 mt-1">
                <div className="text-[9.5px] tracking-[.16em] font-mono uppercase text-[#a855f7] mb-1">
                  Carbono · {p.carbono.situacao}
                </div>
                <p className="text-[11.5px] text-white/60 leading-relaxed">{p.carbono.texto}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="zd-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="text-[10px] tracking-[.2em] font-mono uppercase text-white/45">
              Trilha de evidência · {p.trilha.length} registros · cadeia de custódia
            </h2>
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${verificacao.integra
              ? 'text-[#00ff64] border border-[#00ff6455]' : 'text-[#ff4d8d] border border-[#ff4d8d55]'}`}>
              {verificacao.integra ? '⛓ CADEIA ÍNTEGRA' : '⚠ CADEIA QUEBRADA'}
            </span>
          </div>
          <div className="space-y-2">
            {p.trilha.map(ev => (
              <div key={ev.id} className="rounded-lg border border-white/8 bg-white/[.02] px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono" style={{ color: COR_SELO[ev.selo] }}>
                    {ev.selo} {ev.confianca}
                  </span>
                  <span className="text-[9px] text-white/30 font-mono">{ev.em.slice(0, 10)}</span>
                </div>
                <div className="text-[12px] text-white/70 mt-1 leading-snug">{ev.descricao}</div>
                <div className="text-[8.5px] text-white/25 font-mono mt-1.5 truncate">
                  sha256 {ev.hash}
                </div>
              </div>
            ))}
          </div>
          {verificacao.ancora && (
            <div className="text-[9px] text-white/30 font-mono mt-3 break-all">
              âncora da cadeia · {verificacao.ancora}
            </div>
          )}
        </section>

        <footer className="flex items-center justify-between gap-3 flex-wrap pb-6">
          <div className="text-[10px] text-white/35">
            Emitido pela plataforma ZoomDev OS · cada número carrega o próprio nível de prova.
          </div>
          <div className="flex gap-2">
            <button onClick={copiarLink}
              className="rounded-lg border border-white/15 hover:border-[#00e5ff66] px-3 py-1.5 text-[11px] text-white/70 transition-colors flex items-center gap-1.5">
              <Icon nome="copiar" tam={12} /> {copiado ? 'Link copiado!' : 'Copiar link'}
            </button>
            <Link to="/" className="rounded-lg border border-white/15 hover:border-[#00ff6466] px-3 py-1.5 text-[11px] text-white/70 transition-colors">
              Conhecer a plataforma →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
