import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import JourneyBar from '../components/JourneyBar.jsx';

export default function Projetos() {
  const [projetos, setProjetos] = useState(null);
  const [projetoExcluir, setProjetoExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => { api.projetos().then(setProjetos).catch(() => setProjetos([])); }, []);

  const excluir = async () => {
    if (!projetoExcluir || excluindo) return;
    setExcluindo(true); setErro(null);
    try {
      await api.excluirProjeto(projetoExcluir.id);
      setProjetos(atual => atual.filter(p => p.id !== projetoExcluir.id));
      setProjetoExcluir(null);
    } catch (e) { setErro(e.message); }
    finally { setExcluindo(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Meus <span className="zd-gradient-text">Projetos</span></h1>
          <p className="text-white/55 text-sm mt-1.5">Cada projeto é uma jornada: da Semente 🌱 à Floresta 🌴.</p>
        </div>
        <Link to="/ideacao" className="zd-gradient-btn rounded-xl px-5 py-2.5 text-sm">✦ Nova Ideia</Link>
      </div>

      {erro && <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}

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
            <article key={p.id} className="zd-agent-card rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Link to={`/projetos/${p.id}`} className="min-w-0 flex-1">
                  <div className="font-heading font-bold">{p.nome}</div>
                  <div className="text-xs text-white/45 mt-0.5 line-clamp-1">{p.descricao}</div>
                </Link>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={p.classificacao === 'biostartup' ? 'zd-tag rounded-full px-2.5 py-1' : 'zd-tag-blue rounded-full px-2.5 py-1'}>
                    {p.classificacao === 'biostartup' ? '🌿 BioStartup' : '🚀 Startup'}
                  </span>
                  {p.plano && <span className="zd-tag rounded-full px-2.5 py-1">📐 Plano pronto</span>}
                  <button type="button" onClick={() => { setErro(null); setProjetoExcluir(p); }}
                    className="rounded-full border border-red-500/35 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/15 transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
              <Link to={`/projetos/${p.id}`} className="block mt-3"><JourneyBar jornada={p.jornada} /></Link>
            </article>
          ))}
        </div>
      )}

      {projetoExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-excluir">
          <div className="zd-card-glow w-full max-w-md rounded-2xl p-6">
            <h2 id="titulo-excluir" className="font-heading text-lg font-bold text-white">Excluir projeto?</h2>
            <p className="mt-3 text-sm text-white/65">
              Você vai apagar <b className="text-white">{projetoExcluir.nome}</b>, incluindo plano, documentos, conversas, MVP e anexos. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={excluindo} onClick={() => setProjetoExcluir(null)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancelar</button>
              <button type="button" disabled={excluindo} onClick={excluir} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60">
                {excluindo ? 'Excluindo...' : 'Sim, excluir projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
