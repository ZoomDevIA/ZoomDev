import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, gerarPlanoSSE, baixarPlano } from '../lib/api.js';
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
  const [gerando, setGerando] = useState(false);
  const [agentes, setAgentes] = useState([]);
  const [statusAgentes, setStatusAgentes] = useState({});
  const [baixando, setBaixando] = useState(null);
  const [avisoPdf, setAvisoPdf] = useState(false);

  useEffect(() => { api.projeto(id).then(setProj).catch(e => setErro(e.message)); }, [id]);

  const gerar = async () => {
    setGerando(true);
    setErro(null);
    setStatusAgentes({});
    try {
      await gerarPlanoSSE(id, {
        inicio: (d) => setAgentes(d.agentes),
        agente: (d) => setStatusAgentes(s => ({ ...s, [d.agente]: d.status })),
        concluido: async (d) => {
          setProj(d.projeto);
          celebrar(d.gamificacao);
          await refreshUser();
        },
        erro: (d) => {
          setErro(`${d.error}${d.estornado ? ' (sua seiva foi estornada 🌿)' : ''}`);
          refreshUser();
        },
      });
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  };

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
            {proj.classificador?.origem !== 'usuario' && proj.classificador?.justificativa && (
              <p className="text-[11px] text-white/40 mt-2">
                🤖 Classificação automática ({proj.classificador.origem === 'ia' ? 'IA' : 'análise de termos'}): {proj.classificador.justificativa}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-white/45 mb-1.5 font-semibold uppercase tracking-wider">Sua jornada</div>
          <JourneyBar jornada={proj.jornada} />
        </div>
      </header>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
      {avisoPdf && (
        <div className="zd-notification rounded-lg px-4 py-3 text-sm text-white/70">
          O servidor está sem renderizador de PDF — abrimos a versão de impressão: use <b>Ctrl/Cmd+P → Salvar como PDF</b>.
          <button className="ml-2 text-white/40 hover:text-white" onClick={() => setAvisoPdf(false)}>fechar</button>
        </div>
      )}

      {!proj.plano && (
        <section className="zd-card rounded-2xl p-6">
          <h2 className="font-heading text-lg font-bold">📐 Gerar Plano de Negócios Qualificado</h2>
          <p className="text-sm text-white/55 mt-1">
            Os 5 agentes ZoomDev trabalham em paralelo: Produto, Negócio, Engenharia, Impacto e Editais.
            Custo: <b className="zd-green">60 🌿</b> — com estorno automático se a geração falhar.
          </p>
          {gerando && agentes.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {agentes.map(a => {
                const st = statusAgentes[a.id];
                return (
                  <div key={a.id} className={`zd-agent-card rounded-xl p-3.5 ${st === 'executando' ? 'zd-pulse' : ''}`}>
                    <div className="text-lg">{a.emoji}</div>
                    <div className="text-sm font-semibold mt-1">{a.nome}</div>
                    <div className="text-[11px] text-white/45">{a.papel}</div>
                    <div className={`text-[11px] mt-1.5 font-semibold ${st === 'concluido' ? 'zd-green' : st === 'erro' ? 'text-red-400' : 'zd-blue'}`}>
                      {st === 'concluido' ? '✓ concluído' : st === 'erro' ? '✗ erro' : st === 'executando' ? '● trabalhando…' : '○ aguardando'}
                    </div>
                  </div>
                );
              })}
              {statusAgentes.missoes && (
                <div className="zd-agent-card rounded-xl p-3.5">
                  <div className="text-lg">🎯</div>
                  <div className="text-sm font-semibold mt-1">Missões de Validação</div>
                  <div className="text-[11px] text-white/45">Derivadas do seu plano</div>
                  <div className={`text-[11px] mt-1.5 font-semibold ${statusAgentes.missoes === 'concluido' ? 'zd-green' : 'zd-blue'}`}>
                    {statusAgentes.missoes === 'concluido' ? '✓ prontas' : '● gerando…'}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={gerar} disabled={gerando} className="zd-gradient-btn rounded-xl px-6 py-3 text-sm mt-4">
            {gerando ? 'Os agentes estão construindo seu plano…' : '⚡ Gerar plano com os 5 agentes'}
          </button>
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
                🎯 Fase atual: {proj.jornada.find(j => j.status === 'atual')?.label || '—'}
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
      {projeto.plano && <MvpBuilder projetoId={projeto.id} />}

      {projeto.plano && <Conselho projetoId={projeto.id} />}

    </div>
  );
}
