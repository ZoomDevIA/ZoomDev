import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, baixarPlano } from '../lib/api.js';
import { useUser } from '../App.jsx';
import Conselho from '../components/Conselho.jsx';
import MvpBuilder from '../components/MvpBuilder.jsx';
import JourneyBar from '../components/JourneyBar.jsx';
import PlanoView from '../components/PlanoView.jsx';

export default function Projeto() {
  const { id } = useParams();
  const { celebrar, refreshUser } = useUser();
  const [proj, setProj] = useState(null);
  const [erro, setErro] = useState(null);
  const [custoPlano, setCustoPlano] = useState(null);
  const [baixando, setBaixando] = useState(null);
  const [avisoPdf, setAvisoPdf] = useState(false);

  useEffect(() => { api.projeto(id).then(setProj).catch(e => setErro(e.message)); }, [id]);
  // O preço do plano vem do servidor: escrever o número à mão aqui garantiria
  // que ele ficasse desatualizado na primeira recalibragem.
  useEffect(() => { api.custos().then(c => setCustoPlano(c.planoNegocios)).catch(() => {}); }, []);

  const concluirMissao = async (mid) => {
    try {
      const r = await api.concluirMissao(id, mid);
      setProj(r.projeto);
      celebrar(r.gamificacao);
      await refreshUser();
    } catch (e) { setErro(e.message); }
  };

  const avancar = async () => {
    try {
      const r = await api.avancarFase(id);
      setProj(r.projeto);
      celebrar(r.gamificacao);
    } catch (e) { setErro(e.message); }
  };

  const baixar = async (formato) => {
    setBaixando(formato);
    try {
      const r = await baixarPlano(id, formato, proj.nome);
      if (r.fallbackHtml) setAvisoPdf(true);
      await refreshUser();
    } catch (e) { setErro(e.message); }
    setBaixando(null);
  };

  const missoesFase = useMemo(() => (proj?.missoes || []).filter(m => m.fase === proj.fase), [proj]);
  const principaisOk = missoesFase.filter(m => m.tipo === 'principal').every(m => m.concluida) && missoesFase.length > 0;

  if (erro && !proj) return <div className="text-red-400">{erro}</div>;
  if (!proj) return <div className="text-white/40">Carregando…</div>;

  const bio = proj.classificacao === 'biostartup';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="zd-card-glow rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-bold">{proj.nome}</h1>
              <span className={bio ? 'zd-tag rounded-full px-2.5 py-1' : 'zd-tag-blue rounded-full px-2.5 py-1'}>
                {bio ? '🌿 BioStartup' : '🚀 Startup'}
              </span>
              <span className="zd-tag-blue rounded-full px-2.5 py-1">{proj.vertical}</span>
            </div>
            <p className="text-sm text-white/55 mt-2 max-w-2xl">{proj.descricao}</p>
            {(proj.modulos?.carbono || proj.modulos?.bio) && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {proj.modulos.carbono && <span className="zd-tag-blue rounded-full px-2.5 py-1">🍃 Módulo de carbono</span>}
                {proj.modulos.bio && <span className="zd-tag rounded-full px-2.5 py-1">🌿 Trilha bioeconomia</span>}
              </div>
            )}
            {proj.classificador?.origem !== 'usuario' && proj.classificador?.justificativa && (
              <p className="text-[11px] text-white/40 mt-2">
                🤖 Classificação automática ({proj.classificador.origem === 'ia' ? 'IA' : 'análise de termos'}): {proj.classificador.justificativa}
              </p>
            )}
          </div>
          {proj.plano && <BotaoPublicar projeto={proj} />}
        </div>
        <div className="mt-4">
          <div className="text-xs text-white/45 mb-1.5 font-semibold uppercase tracking-wider">Sua jornada</div>
          <JourneyBar jornada={proj.jornada} />
        </div>
      </header>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
      {avisoPdf && (
        <div className="zd-notification rounded-lg px-4 py-3 text-sm text-white/70">
          O servidor está sem renderizador de PDF, abrimos a versão de impressão: use <b>Ctrl/Cmd+P → Salvar como PDF</b>.
          <button className="ml-2 text-white/40 hover:text-white" onClick={() => setAvisoPdf(false)}>fechar</button>
        </div>
      )}

      {!proj.plano && (
        <section className="zd-card rounded-2xl p-6">
          <h2 className="font-heading text-lg font-bold">📐 Plano de Negócios ZoomDev</h2>
          <p className="text-sm text-white/55 mt-1 leading-relaxed">
            O plano é escrito no Studio, dentro do ZoomDoc, em quatorze seções pela metodologia ZoomDev.
            Antes de escrever, os agentes pesquisam mercado, concorrência e regulação na internet, e
            consideram o território onde o negócio vai operar. Você recebe um documento editável, com
            selo de evidência em cada afirmação, e não um resumo.
          </p>
          <p className="text-sm text-white/45 mt-2">
            Custo: <b className="zd-green">{custoPlano ?? '—'} 🌿</b>, com estorno automático se a geração falhar.
          </p>
          <Link to={`/studio/${proj.id}`}
            className="zd-gradient-btn rounded-xl px-6 py-3 text-sm mt-4 inline-flex items-center gap-2">
            ⚡ Abrir o Studio e gerar o plano
          </Link>
        </section>
      )}

      {proj.plano && (
        <>
          <section className="zd-card rounded-2xl p-5 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <div className="font-heading font-bold">📐 Plano de Negócios pronto</div>
              <div className="text-xs text-white/45 mt-0.5">
                Gerado em {new Date(proj.plano.geradoEm).toLocaleString('pt-BR')} · {proj.plano.modelo}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => baixar('docx')} disabled={baixando} className="zd-gradient-btn rounded-lg px-4 py-2.5 text-sm">
                {baixando === 'docx' ? 'Gerando…' : '⬇ DOCX'}
              </button>
              <button onClick={() => baixar('pdf')} disabled={baixando}
                className="rounded-lg border border-[#00ff6444] text-[#00ff64] hover:bg-[#00ff6412] px-4 py-2.5 text-sm font-semibold transition-colors">
                {baixando === 'pdf' ? 'Gerando…' : '⬇ PDF'}
              </button>
            </div>
          </section>

          <section className="zd-card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-heading text-lg font-bold">
                🎯 Fase atual: {proj.jornada.find(j => j.status === 'atual')?.label || '–'}
                <span className="text-white/40 text-sm font-normal ml-2">missões derivadas do seu plano</span>
              </h2>
              {principaisOk && proj.fase !== 'escala' && (
                <button onClick={avancar} className="zd-gradient-btn rounded-lg px-4 py-2 text-sm">🌱 Avançar de fase →</button>
              )}
            </div>
            {missoesFase.length === 0 ? (
              <p className="text-sm text-white/45">Sem missões nesta fase.</p>
            ) : (
              <div className="space-y-2.5">
                {missoesFase.map(m => (
                  <div key={m.id} className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${m.concluida ? 'border-[#00ff6440] bg-[#00ff640d]' : 'border-white/10 bg-white/[.03]'}`}>
                    <button onClick={() => !m.concluida && concluirMissao(m.id)} disabled={m.concluida}
                      className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs transition-all ${m.concluida ? 'border-[#00ff64] bg-[#00ff64] text-[#030d07]' : 'border-white/30 hover:border-[#00ff64]'}`}>
                      {m.concluida ? '✓' : ''}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${m.concluida ? 'line-through text-white/40' : ''}`}>{m.titulo}</span>
                        <span className={m.tipo === 'principal' ? 'zd-tag rounded px-1.5 py-0.5' : 'zd-tag-blue rounded px-1.5 py-0.5'}>
                          {m.tipo === 'principal' ? 'principal' : 'secundária'}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 mt-1">{m.descricao}</div>
                    </div>
                    <div className="text-[11px] zd-green shrink-0 font-semibold">+{m.xp} XP · +10 🌿</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <PlanoView projeto={proj} />
        </>
      )}
      {/* `projeto` nunca existiu neste componente: a variável se chama `proj`.
          Como a expressão é avaliada em todo render, a ficha do projeto
          derrubava a página inteira antes de desenhar qualquer coisa. */}
      {proj.plano && <MvpBuilder projetoId={proj.id} />}

      {proj.plano && <Conselho projetoId={proj.id} />}

    </div>
  );
}

// ── Publicação na vitrine da comunidade ────────────────────────────────────
// Publicar mostra nome, resumo e sinais de maturidade na home. Nunca expõe
// e-mail nem contato: o autor aparece só pelo primeiro nome.
function BotaoPublicar({ projeto }) {
  const [publicado, setPublicado] = useState(Boolean(projeto.publicado));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  const alternar = async () => {
    setOcupado(true); setErro(null);
    try {
      const r = await api.publicarProjeto(projeto.id, !publicado);
      setPublicado(r.publicado);
    } catch (e) { setErro(e.message); }
    finally { setOcupado(false); }
  };

  return (
    <div className="shrink-0 text-right">
      <button onClick={alternar} disabled={ocupado}
        className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
          publicado
            ? 'border-[#00ff6455] bg-[#00ff6414] text-[#00ff64]'
            : 'border-white/15 text-white/65 hover:border-[#00ff6455] hover:text-[#00ff64]'}`}>
        {ocupado ? 'aguarde…' : publicado ? '✓ na vitrine da comunidade' : '🖼️ publicar na comunidade'}
      </button>
      <div className="text-[10px] text-white/32 mt-1.5 max-w-[190px] ml-auto leading-snug">
        {publicado ? 'Visível na home. Clique para retirar.' : 'Aparece na home para quem visita a ZoomDev.'}
      </div>
      {erro && <div className="text-[10px] text-red-400 mt-1">{erro}</div>}
    </div>
  );
}
