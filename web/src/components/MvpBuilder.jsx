import React, { useEffect, useState } from 'react';
import { api, construirMvpSSE, baixarMvpZip, previaMvp } from '../lib/api.js';
import { useUser } from '../App.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// MVP BUILDER, do plano ao produto navegável.
// Não é mockup: são arquivos que abrem no navegador e podem ir para produção.
// ═══════════════════════════════════════════════════════════════════════════

const ICONE_STATUS = { executando: '⏳', concluido: '✓', fallback: '↩' };

export default function MvpBuilder({ projetoId }) {
  const { celebrar, refreshUser } = useUser();
  const [mvp, setMvp] = useState(null);
  const [pecas, setPecas] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [construindo, setConstruindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [aba, setAba] = useState('preview');
  const [arquivoAtivo, setArquivoAtivo] = useState('index.html');
  const [baixando, setBaixando] = useState(false);
  const [urlPrevia, setUrlPrevia] = useState(null);

  const [interrompido, setInterrompido] = useState(null);

  useEffect(() => {
    api.mvp(projetoId).then(m => {
      if (m.status === 'pronto') setMvp(m);
      // Construção que caiu junto com o servidor: dizer o que houve vale mais
      // que um botão que parece travado sem motivo.
      if (m.status === 'interrompido') setInterrompido(m);
    }).catch(() => {});
  }, [projetoId]);

  // A prévia é servida por uma rota própria, com política de conteúdo isolada:
  // o bilhete de acesso vale dez minutos e é pedido por quem já está logado.
  useEffect(() => {
    if (!mvp?.arquivos?.length || aba !== 'preview') return;
    let vivo = true;
    previaMvp(projetoId, { pagina: arquivoAtivo })
      .then(r => { if (vivo) setUrlPrevia(r.url); })
      .catch(e => { if (vivo) setErro(e.message); });
    return () => { vivo = false; };
  }, [projetoId, mvp, aba, arquivoAtivo]);

  const construir = async () => {
    setErro(null); setInterrompido(null); setConstruindo(true); setProgresso({}); setMvp(null);
    try {
      await construirMvpSSE(projetoId, {
        inicio: (d) => setPecas(d.pecas),
        peca: (d) => setProgresso(p => ({ ...p, [d.peca]: d.status })),
        concluido: async (d) => {
          celebrar(d.gamificacao);
          await refreshUser();
          const m = await api.mvp(projetoId);
          setMvp(m);
          setArquivoAtivo('index.html');
        },
        erro: (d) => setErro(`${d.error}${d.estornado ? ': a seiva foi estornada.' : ''}`),
      });
    } catch (e) { setErro(e.message); }
    finally { setConstruindo(false); }
  };

  const baixar = async () => {
    setBaixando(true);
    try { await baixarMvpZip(projetoId); } catch (e) { setErro(e.message); }
    finally { setBaixando(false); }
  };

  const arquivo = mvp?.arquivos?.find(a => a.arquivo === arquivoAtivo);

  return (
    <section className="zd-card-glow rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold flex items-center gap-2">📦 MVP Builder</h2>
          <p className="text-xs text-white/50 mt-1 max-w-lg">
            Transforma o seu plano em um produto navegável: landing, painel, estilo e lógica.
            Arquivos reais, prontos para publicar em qualquer hospedagem estática.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {mvp && (
            <button onClick={baixar} disabled={baixando}
              className="rounded-lg border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors px-4 py-2.5 text-sm font-semibold">
              {baixando ? 'Compactando…' : '⬇️ Baixar ZIP'}
            </button>
          )}
          <button onClick={construir} disabled={construindo} className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm">
            {construindo ? 'Construindo…' : mvp ? '🔄 Reconstruir' : '📦 Construir MVP'}
          </button>
        </div>
      </div>

      {/* Progresso por peça */}
      {(construindo || Object.keys(progresso).length > 0) && !mvp && (
        <div className="space-y-1.5">
          {pecas.map(p => {
            const s = progresso[p.id];
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
                s === 'concluido' ? 'border-[#00ff6433] bg-[#00ff640d]' :
                s === 'executando' ? 'border-[#00c8ff33] bg-[#00c8ff0d]' :
                s === 'fallback' ? 'border-[#ffd70033] bg-[#ffd7000d]' : 'border-white/8 bg-white/[.03]'}`}>
                <span className="text-base">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{p.nome}</div>
                  <div className="text-[10px] text-white/45">{p.papel}</div>
                </div>
                <code className="text-[10px] text-white/35">{p.arquivo}</code>
                <span className={`text-sm shrink-0 ${s === 'executando' ? 'zd-pulse' : ''}`}>
                  {ICONE_STATUS[s] || '·'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {interrompido && !construindo && !mvp && (
        <div className="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
          A construção anterior foi interrompida quando o servidor reiniciou.
          {interrompido.seivaEstornada > 0 && <> A seiva ({interrompido.seivaEstornada} 🌿) já voltou para a sua conta.</>}
          {' '}Pode construir de novo quando quiser.
        </div>
      )}

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {/* Resultado */}
      {mvp && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="zd-tag rounded-full px-2.5 py-1">
              {mvp.modo === 'ia' ? '🧠 escrito pelos agentes' : '⚙️ gerado do plano'}
            </span>
            <span className="text-[11px] text-white/40">
              {mvp.arquivos.length} arquivos · {Math.round(mvp.arquivos.reduce((s, a) => s + a.bytes, 0) / 1024)} KB
            </span>
          </div>

          <div className="flex gap-1.5">
            {[['preview', '👁️ Preview'], ['codigo', '💻 Código']].map(([id, label]) => (
              <button key={id} onClick={() => setAba(id)}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  aba === id ? 'text-[#00ff64] bg-[#00ff6414] border border-[#00ff6433]' : 'text-white/50 hover:bg-white/5 border border-transparent'}`}>
                {label}
              </button>
            ))}
          </div>

          {aba === 'preview' && (
            <div className="space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {mvp.arquivos.filter(a => a.arquivo.endsWith('.html')).map(a => (
                  <button key={a.arquivo} onClick={() => setArquivoAtivo(a.arquivo)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-mono transition-colors ${
                      arquivoAtivo === a.arquivo ? 'bg-[#00ff6414] text-[#00ff64] border border-[#00ff6433]' : 'bg-white/[.04] text-white/55 border border-white/8'}`}>
                    {a.arquivo}
                  </button>
                ))}
                <button type="button"
                  onClick={() => urlPrevia && window.open(urlPrevia, '_blank', 'noopener')}
                  disabled={!urlPrevia}
                  className="rounded-lg px-3 py-1.5 text-[11px] text-[#00c8ff] border border-[#00c8ff33] hover:bg-[#00c8ff12] transition-colors disabled:opacity-40">
                  abrir em nova aba ↗
                </button>
              </div>
              {/* O documento vem do servidor, em origem opaca e com política
                  própria: código gerado por IA não roda na mesma origem da
                  plataforma, onde alcançaria o token de quem está logado. */}
              <iframe
                key={urlPrevia || arquivoAtivo}
                src={urlPrevia || 'about:blank'}
                title="Preview do MVP"
                className="w-full rounded-xl border border-white/10 bg-white"
                style={{ height: 'min(70vh, 620px)' }}
              />
            </div>
          )}

          {aba === 'codigo' && (
            <div className="grid md:grid-cols-[190px_1fr] gap-3">
              <div className="space-y-1">
                {mvp.arquivos.map(a => (
                  <button key={a.arquivo} onClick={() => setArquivoAtivo(a.arquivo)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-[11px] font-mono transition-colors ${
                      arquivoAtivo === a.arquivo ? 'bg-[#00ff6414] text-[#00ff64]' : 'text-white/55 hover:bg-white/5'}`}>
                    {a.arquivo}
                    <span className="block text-[9px] text-white/30">{(a.bytes / 1024).toFixed(1)} KB</span>
                  </button>
                ))}
              </div>
              <pre className="rounded-xl bg-black/40 border border-white/10 p-4 overflow-auto text-[11px] leading-relaxed text-white/75"
                style={{ maxHeight: 'min(70vh, 620px)' }}>
                <code>{arquivo?.conteudo || ''}</code>
              </pre>
            </div>
          )}

          <div className="rounded-xl bg-[#00ff640d] border border-[#00ff6426] p-3.5">
            <div className="text-xs font-bold zd-green mb-1">Próximo passo</div>
            <p className="text-[11px] text-white/65 leading-relaxed">
              Baixe o ZIP e publique no Netlify, Vercel ou GitHub Pages: o README tem o passo a passo.
              Depois mande o link para 10 pessoas do seu público e conte quantas se cadastram.
              É essa a missão de validação que destrava a próxima fase.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
