import React, { useEffect, useRef, useState } from 'react';
import { api, abrirRelatorio } from '../lib/api.js';
import { useToast } from '../components/GamificationToasts.jsx';
import AgentAvatar from '../components/AgentAvatar.jsx';
import Reator from '../components/nave/Reator.jsx';
import { useFoco } from '../lib/foco.js';
import '../nave.css';

// ═══════════════════════════════════════════════════════════════════════════
// SUPER DASHBOARD DO ECOSSISTEMA: comandado pela Sexta-Feira 🕶️
// Visão total: radar unicórnio, matriz editais × projetos, chat, relatórios
// e o ciclo governado de evolução do Protocolo de Instância Cognitiva.
// ═══════════════════════════════════════════════════════════════════════════

// Na ponte a cor pertence ao reator, e só a ele. Intensidade aqui é nível de
// branco, exatamente como a referência mostra força de sinal: quanto mais
// forte, mais claro. Assim o painel tem um alvo de atenção só.
const corScore = (v) => v >= 80 ? '#ffffff' : v >= 60 ? '#ffffffc4' : v >= 40 ? '#ffffff85' : '#ffffff45';

const md = (t) => String(t).split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
  seg.startsWith('**') ? <b key={i} className="text-white/95">{seg.slice(2, -2)}</b> : seg);

function StatCard({ valor, label, destaque }) {
  return (
    <div className="zd-stat-card rounded-xl p-3.5">
      <div className={`font-heading text-xl font-bold ${destaque ? 'zd-green' : ''}`}>{valor}</div>
      <div className="text-[10px] text-white/50 mt-0.5">{label}</div>
    </div>
  );
}

// ── Chat com a Sexta-Feira ───────────────────────────────────────────────────
function ChatSextaFeira() {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [modo, setModo] = useState(null);
  const fim = useRef(null);

  useEffect(() => {
    api.adminChatHistorico().then(h => {
      setMensagens(h.length ? h : [{
        role: 'assistant',
        content: 'Administrador. Sou a **Sexta-Feira**, enxergo o ecossistema inteiro em tempo real. Pergunte sobre **unicórnios**, **editais**, **carbono**, **nudges** ou peça um **relatório**. Nada aqui é inventado: cada número vem do snapshot vivo da plataforma.',
      }]);
    }).catch(() => {});
  }, []);

  // `scrollIntoView` rola o ancestral rolável mais próximo, e o mais próximo
  // aqui é a página: abrir a ponte pulava direto por cima do reator. Rolar a
  // caixa de mensagens à mão mantém o movimento dentro dela.
  useEffect(() => {
    const caixa = fim.current?.parentElement;
    if (caixa) caixa.scrollTop = caixa.scrollHeight;
  }, [mensagens, pensando]);

  const enviar = async (e) => {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || pensando) return;
    setTexto('');
    const novas = [...mensagens, { role: 'user', content: msg }];
    setMensagens(novas);
    setPensando(true);
    try {
      const r = await api.adminChat(novas);
      setModo(r.modo);
      setMensagens(m => [...m, { role: 'assistant', content: r.resposta, buscas: r.buscas }]);
    } catch (err) {
      setMensagens(m => [...m, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="nave-bloco nave-canto flex flex-col overflow-hidden h-[min(560px,70vh)]">
      <div className="flex items-center gap-3 px-3.5 py-3" style={{ boxShadow: 'inset 0 -1px 0 var(--n-linha)' }}>
        <div className="w-9 h-9 flex items-center justify-center text-base hud-corte"
          style={{ '--c': '6px', background: 'var(--n-fundo)', boxShadow: 'inset 0 0 0 1px var(--n-linha-forte)' }}>🕶️</div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white leading-none">Sexta-Feira</div>
          <div className="nave-rot mt-1.5">inteligência-mestra</div>
        </div>
        {modo && (
          <span className="nave-d !py-1 !px-2 !text-[8px]">
            {modo === 'ia+internet' ? '🌐 internet em tempo real' : modo === 'ia' ? 'IA' : 'demo'}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(4,14,8,.95), rgba(4,14,8,.97)), url(/assets/site/chat-bg.webp)', backgroundSize: 'cover' }}>
        {mensagens.map((m, i) => (
          <div key={i} className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            m.role === 'user' ? 'ml-auto' : 'text-white/80'
          }`} style={m.role === 'user'
            ? { background: 'color-mix(in srgb, var(--zd-acento) 12%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--zd-acento) 30%, transparent)' }
            : { background: 'var(--n-fundo)', boxShadow: 'inset 0 0 0 1px var(--n-linha)' }}>
            {md(m.content)}
            {m.buscas > 0 && <div className="text-[10px] zd-blue mt-1.5">🌐 {m.buscas} pesquisa(s) na internet</div>}
          </div>
        ))}
        {pensando && <div className="bg-white/[.05] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white/50 max-w-[85%] zd-pulse">Analisando o ecossistema…</div>}
        <div ref={fim} />
      </div>
      <form onSubmit={enviar} className="p-3 border-t border-white/10 flex gap-2">
        <input className="zd-input flex-1 rounded-lg px-3 py-2.5 text-sm" placeholder="Pergunte à Sexta-Feira sobre o ecossistema…"
          value={texto} onChange={e => setTexto(e.target.value)} />
        <button type="submit" disabled={pensando || !texto.trim()} className="zd-gradient-btn rounded-lg px-4 text-sm">➤</button>
      </form>
    </div>
  );
}

// ── Radar Unicórnio ──────────────────────────────────────────────────────────
function RadarUnicornio({ ranking }) {
  const [aberto, setAberto] = useState(null);
  if (!ranking.length) return <div className="nave-rot">radar sem projeto: acende na primeira ideação</div>;
  return (
    <div className="space-y-2">
      {ranking.map((r, i) => (
        <button key={r.projetoId} onClick={() => setAberto(a => a === r.projetoId ? null : r.projetoId)}
          className="nave-bloco w-full text-left p-3.5 transition-shadow hover:shadow-[inset_0_0_0_1px_var(--n-linha-forte)]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white/35 font-heading font-bold w-6">{i + 1}</span>
            <div className="flex-1 min-w-[140px]">
              <div className="font-heading font-bold text-sm">{r.nome}</div>
              <div className="text-[11px] text-white/45">{r.classificacao === 'biostartup' ? '🌿 BioStartup' : '🚀 Startup'} · fase {r.fase}</div>
            </div>
            <div className="w-40">
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: corScore(r.score) }} />
              </div>
            </div>
            <div className="font-heading font-bold" style={{ color: corScore(r.score) }}>{r.score}<span className="text-white/30 text-xs">/100</span></div>
            <span className="nave-d !py-1 !px-2.5 !text-[8.5px]">{r.tier.label}</span>
          </div>
          {aberto === r.projetoId && (
            <div className="grid sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-white/8">
              {r.dimensoes.map(d => (
                <div key={d.id} className="rounded-lg bg-white/[.04] border border-white/8 p-2.5">
                  <div className="text-[10px] text-white/50">{d.label}</div>
                  <div className="font-heading font-bold text-sm" style={{ color: corScore((d.pontos / d.max) * 100) }}>{d.pontos}<span className="text-white/30 text-[10px]">/{d.max}</span></div>
                  <div className="text-[10px] text-white/45 mt-1 leading-snug">{d.motivo}</div>
                </div>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Matriz editais × projetos ────────────────────────────────────────────────
function MatrizEditais({ editais }) {
  if (!editais.colunas.length) return <div className="nave-rot">sem projeto para cruzar com os {editais.abertos} editais abertos</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ minWidth: 520 }}>
        <thead>
          <tr className="text-white/45">
            <th className="text-left py-2 pr-3 font-semibold">Edital</th>
            {editais.colunas.map(c => <th key={c.id} className="px-2 py-2 font-semibold max-w-[90px] truncate">{c.nome}</th>)}
          </tr>
        </thead>
        <tbody>
          {editais.matriz.map(l => (
            <tr key={l.editalId} className="border-t border-white/6">
              <td className="py-2.5 pr-3">
                <div className="font-bold text-white/85">{l.edital}</div>
                <div className="text-[10px] text-white/40">{l.orgao} · {l.valor} · ⏳ {l.dias}d</div>
              </td>
              {l.celulas.map(c => (
                <td key={c.projetoId} className="px-2 py-2.5 text-center">
                  <span className="inline-block min-w-[38px] rounded-lg border px-1.5 py-1 font-bold"
                    style={{ borderColor: corScore(c.score), color: corScore(c.score) }}>{c.score}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hud-tec text-[8.5px] leading-relaxed mt-3" style={{ color: 'var(--n-apagado)' }}>
        SCORE DE ADERÊNCIA 0 A 100. QUANTO MAIS CLARO, MAIS FORTE. ADERÊNCIA ≥ 70 COM PRAZO ≤ 60 DIAS
        DISPARA NUDGE AUTOMÁTICO DO EDITAIS IA.
      </p>
    </div>
  );
}

// ── Relatórios ───────────────────────────────────────────────────────────────
function Relatorios({ notify }) {
  const [lista, setLista] = useState([]);
  const [gerando, setGerando] = useState(false);

  const carregar = () => api.adminRelatorios().then(setLista).catch(() => {});
  useEffect(() => { carregar(); }, []);

  const gerar = async () => {
    setGerando(true);
    try {
      const r = await api.adminGerarRelatorio();
      notify({ tipo: 'conquista', titulo: '📊 Relatório gerado', detalhe: 'A Sexta-Feira consolidou o ecossistema.' });
      await carregar();
      await abrirRelatorio(r.id);
    } catch (e) {
      notify({ tipo: 'xp', titulo: '⚠️ Falha ao gerar', detalhe: e.message });
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="zd-card-glow rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-heading font-bold">Relatório executivo do ecossistema</div>
          <p className="text-xs text-white/50 mt-1">Resumo executivo, radar com decomposição, matriz de fomento, carbono e Agent Bus: diagramado e pronto para board.</p>
        </div>
        <button onClick={gerar} disabled={gerando} className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm">
          {gerando ? 'Sexta-Feira consolidando…' : '📊 Gerar relatório agora'}
        </button>
      </div>
      {lista.map(r => (
        <div key={r.id} className="zd-card rounded-xl p-4 flex items-center gap-4 justify-between flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white/45">{new Date(r.geradoEm).toLocaleString('pt-BR')} · PIC v{r.picVersao}</div>
            <p className="text-xs text-white/65 mt-1 line-clamp-2">{r.resumo}</p>
          </div>
          <button onClick={() => abrirRelatorio(r.id).catch(() => {})} className="zd-tag rounded-full px-3 py-1.5 hover:bg-[#00ff6430] transition-colors shrink-0">Abrir →</button>
        </div>
      ))}
      {!lista.length && <div className="text-xs text-white/35">Nenhum relatório gerado ainda.</div>}
    </div>
  );
}

// ── PIC: protocolo vivo com evolução governada ───────────────────────────────
function PainelPic({ notify }) {
  const [pic, setPic] = useState(null);
  const [propondo, setPropondo] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState(null);

  const carregar = () => api.adminPic().then(setPic).catch(() => {});
  useEffect(() => { carregar(); }, []);

  if (!pic) return <div className="text-white/40 text-sm">Carregando protocolo…</div>;

  const propor = async () => {
    setPropondo(true);
    try {
      const r = await api.adminPicPropor();
      notify({ tipo: 'conquista', titulo: r.jaPendente ? '📋 Proposta já pendente' : '🧬 Nova proposta de evolução', detalhe: r.proposta.resumo });
      await carregar();
    } catch (e) {
      notify({ tipo: 'xp', titulo: '⚠️ Falha', detalhe: e.message });
    } finally {
      setPropondo(false);
    }
  };

  const resolver = async (id, acao) => {
    try {
      if (acao === 'aprovar') {
        const r = await api.adminPicAprovar(id);
        notify({ tipo: 'conquista', titulo: `✅ PIC evoluiu para v${r.versao}`, detalhe: 'Mudança aplicada com histórico e rollback disponíveis.' });
      } else {
        await api.adminPicRejeitar(id);
        notify({ tipo: 'xp', titulo: 'Proposta rejeitada', detalhe: 'A Sexta-Feira seguirá com o protocolo atual.' });
      }
      await carregar();
    } catch (e) {
      notify({ tipo: 'xp', titulo: '⚠️ Falha', detalhe: e.message });
    }
  };

  const rollback = async (versao) => {
    try {
      const r = await api.adminPicRollback(versao);
      notify({ tipo: 'conquista', titulo: `↩️ Rollback aplicado (v${r.versao})`, detalhe: `Conteúdo restaurado da v${versao}.` });
      await carregar();
    } catch (e) {
      notify({ tipo: 'xp', titulo: '⚠️ Falha', detalhe: e.message });
    }
  };

  const SECOES = [
    ['identidade', 'Identidade'], ['missao', 'Missão'], ['dominios', 'Domínios de maestria'],
    ['ferramentas', 'Ferramentas'], ['regras', 'Regras inegociáveis'], ['orquestracao', 'Orquestração dos 25 agentes'],
    ['kpis', 'KPIs'], ['autoaperfeicoamento', 'Autoaperfeiçoamento governado'],
  ];

  return (
    <div className="space-y-5">
      <div className="zd-card-glow rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-heading font-bold">Protocolo de Instância Cognitiva · <span className="zd-gradient-text">v{pic.versaoAtual}</span></div>
          <p className="text-xs text-white/50 mt-1">A Sexta-Feira analisa o ecossistema (e a internet, quando conectada) e propõe evoluções cirúrgicas. Nada muda sem a sua aprovação.</p>
        </div>
        <button onClick={propor} disabled={propondo} className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm">
          {propondo ? 'Diagnosticando…' : '🧬 Pedir proposta de evolução'}
        </button>
      </div>

      {pic.propostas.filter(p => p.status === 'pendente').map(p => (
        <div key={p.id} className="rounded-xl border border-[#ffd70055] bg-[#ffd70010] p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ffd700]">⏳ PROPOSTA PENDENTE · {new Date(p.criadoEm).toLocaleString('pt-BR')}</div>
          <div className="font-semibold text-sm mt-2">{p.resumo}</div>
          {p.mudancas.map((m, i) => (
            <div key={i} className="mt-3 rounded-lg bg-black/30 border border-white/10 p-3.5 text-xs">
              <div className="text-white/50">Seção <b className="text-white/85">{m.secao}</b> · {m.tipo === 'append' ? 'novo item' : 'substituição'}</div>
              {m.antes && <div className="mt-2 text-red-300/80 line-through leading-relaxed">{m.antes}</div>}
              <div className="mt-2 zd-green leading-relaxed">+ {m.depois}</div>
              <div className="mt-2 text-white/45 italic">Justificativa: {m.justificativa}</div>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button onClick={() => resolver(p.id, 'aprovar')} className="zd-gradient-btn rounded-lg px-4 py-2 text-xs">✅ Aprovar e versionar</button>
            <button onClick={() => resolver(p.id, 'rejeitar')} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/60 hover:bg-white/5 transition-colors">Rejeitar</button>
          </div>
        </div>
      ))}

      <section>
        <h3 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Conteúdo ativo do protocolo</h3>
        <div className="space-y-1.5">
          {SECOES.map(([id, label]) => {
            const v = pic.conteudoAtual[id];
            return (
              <div key={id} className="zd-card rounded-xl overflow-hidden">
                <button onClick={() => setSecaoAberta(s => s === id ? null : id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-white/[.03] transition-colors">
                  {label} <span className="text-white/30">{secaoAberta === id ? '▾' : '▸'}</span>
                </button>
                {secaoAberta === id && (
                  <div className="px-4 pb-4 text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                    {Array.isArray(v) ? <ul className="space-y-1.5">{v.map((item, i) => <li key={i} className="flex gap-2"><span className="zd-green shrink-0">▸</span>{item}</li>)}</ul> : v}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Histórico de versões</h3>
        <div className="space-y-1.5">
          {pic.versoes.map(v => (
            <div key={v.versao} className="zd-card rounded-xl px-4 py-3 flex items-center gap-3 justify-between flex-wrap">
              <div>
                <span className={`font-heading font-bold text-sm ${v.versao === pic.versaoAtual ? 'zd-green' : ''}`}>v{v.versao}</span>
                <span className="text-[11px] text-white/40 ml-2">{new Date(v.criadoEm).toLocaleString('pt-BR')} · {v.origem === 'base' ? 'versão fundadora' : v.origem === 'rollback' ? 'rollback' : 'evolução aprovada'}</span>
                <div className="text-xs text-white/55 mt-0.5">{v.notas}</div>
              </div>
              {v.versao === pic.versaoAtual
                ? <span className="zd-tag rounded-full px-2.5 py-1">ativa</span>
                : <button onClick={() => rollback(v.versao)} className="zd-tag-blue rounded-full px-2.5 py-1 hover:bg-[#00c8ff30] transition-colors">↩️ Restaurar</button>}
            </div>
          ))}
        </div>
      </section>

      {pic.propostas.filter(p => p.status !== 'pendente').length > 0 && (
        <section>
          <h3 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Propostas resolvidas</h3>
          <div className="space-y-1.5">
            {pic.propostas.filter(p => p.status !== 'pendente').map(p => (
              <div key={p.id} className="zd-card rounded-xl px-4 py-3 text-xs flex items-center gap-3 justify-between flex-wrap">
                <div className="text-white/60 flex-1 min-w-0">{p.resumo}</div>
                <span className={p.status === 'aprovada' ? 'zd-tag rounded-full px-2.5 py-1' : 'rounded-full px-2.5 py-1 border border-white/15 text-white/45'}>
                  {p.status === 'aprovada' ? `✅ v${p.versaoGerada}` : '✕ rejeitada'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── PICs dos 25 agentes ──────────────────────────────────────────────────────
function PicsAgentes() {
  const [pics, setPics] = useState([]);
  const [aberto, setAberto] = useState(null);

  useEffect(() => { api.adminPicsAgentes().then(setPics).catch(() => {}); }, []);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {pics.map(p => (
        <button key={p.agenteId} onClick={() => setAberto(a => a === p.agenteId ? null : p.agenteId)}
          className={`zd-card rounded-xl p-4 text-left hover:border-[#00ff6444] transition-colors ${p.isBio ? 'border-[#00ff6426]' : ''}`}>
          <div className="flex items-center gap-3">
            <AgentAvatar agente={{ id: p.agenteId, nome: p.nome, emoji: p.emoji }} size="w-10 h-12" emojiSize="text-lg" centralizar={false} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{p.nome} <span className="text-[10px] text-white/35 font-normal">PIC v{p.versao}</span></div>
              <div className="text-[11px] text-white/45">{p.categoria}{p.isBio ? ' · 🌿 bio' : ''}</div>
            </div>
            <span className="text-white/30">{aberto === p.agenteId ? '▾' : '▸'}</span>
          </div>
          {aberto === p.agenteId && (
            <div className="mt-3 pt-3 border-t border-white/8 text-xs space-y-2.5">
              <div><span className="text-white/40 font-bold uppercase text-[10px]">Especialidade</span><p className="text-white/65 mt-1 leading-relaxed">{p.conteudo.especialidade}</p></div>
              {p.conteudo.cooperacao.length > 0 && (
                <div><span className="text-white/40 font-bold uppercase text-[10px]">Coopera com</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">{p.conteudo.cooperacao.map(c => <span key={c} className="zd-tag-blue rounded-full px-2 py-0.5">{c}</span>)}</div></div>
              )}
              {p.conteudo.gatilhos.length > 0 && (
                <div><span className="text-white/40 font-bold uppercase text-[10px]">Gatilhos preditivos (Agent Bus)</span>
                  <ul className="mt-1 space-y-1">{p.conteudo.gatilhos.map((g, i) => <li key={i} className="text-white/60 flex gap-1.5"><span className="zd-green">⚡</span>{g}</li>)}</ul></div>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
// ── Modelos de IA por papel ───────────────────────────────────────────────
// O administrador troca o modelo de cada módulo aqui e a troca vale na
// chamada seguinte: nada de deploy, nada de variável de ambiente. O padrão
// (env) continua sendo o chão: restaurar volta para ele.
function PainelModelos({ notify }) {
  const [dados, setDados] = useState(null);
  const [salvando, setSalvando] = useState(null);

  const carregar = () => api.adminModelos().then(setDados).catch(() => {});
  useEffect(() => { carregar(); }, []);

  const trocar = async (papelId, modelo) => {
    setSalvando(papelId);
    try {
      await api.adminDefinirModelo(papelId, modelo);
      await carregar();
      notify?.(modelo ? 'Modelo trocado. Vale já na próxima chamada.' : 'Padrão restaurado.', 'sucesso');
    } catch (e) {
      notify?.(e.message, 'erro');
    }
    setSalvando(null);
  };

  if (!dados) return <div className="text-white/40 text-sm">Carregando o mapa de modelos…</div>;
  const infoDe = (id) => dados.modelos.find(m => m.id === id);

  return (
    <div className="space-y-4">
      <div className="nave-rot">modelos de ia por módulo · a troca vale na chamada seguinte</div>

      <div className="space-y-2">
        {dados.papeis.map(p => {
          const info = infoDe(p.modelo);
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.nome}</span>
                  {p.personalizado
                    ? <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300/90 border border-amber-300/40 px-1.5 py-0.5">personalizado</span>
                    : <span className="text-[9px] font-mono uppercase tracking-widest text-white/35 border border-white/15 px-1.5 py-0.5">padrão</span>}
                </div>
                <div className="text-xs text-white/45 mt-0.5">{p.usa}</div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={p.modelo}
                  disabled={salvando === p.id}
                  onChange={e => trocar(p.id, e.target.value)}
                  className="bg-black/50 border border-white/15 text-sm text-white px-2 py-1.5 focus:border-cyan-300/60 outline-none"
                >
                  {dados.modelos.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome} · ${m.precoEntrada}/${m.precoSaida} por MTok
                    </option>
                  ))}
                </select>
                {p.personalizado && (
                  <button
                    onClick={() => trocar(p.id, null)}
                    disabled={salvando === p.id}
                    className="text-xs text-white/50 hover:text-white underline underline-offset-2"
                    title={`Voltar ao padrão (${infoDe(p.padrao)?.nome || p.padrao})`}
                  >
                    restaurar
                  </button>
                )}
              </div>

              {info && <div className="w-full text-[11px] text-white/35">{info.tier}: {info.nota}</div>}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-white/35 border-t border-white/10 pt-3">
        Preços por milhão de tokens (entrada/saída). A escolha fica gravada e sobrevive a
        reinício do servidor; o selo da troca entra no barramento como decisão de estratégia.
      </div>
    </div>
  );
}

export default function Admin() {
  const { notify } = useToast();
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('ecossistema');

  // A ponte pede o chassi recolhido: aqui o painel É a tela. Sair é `Esc`, que
  // devolve a barra lateral e a barra superior de uma vez.
  useFoco(true);

  useEffect(() => { api.adminOverview().then(setOverview).catch(() => {}); }, []);

  const ranking = overview?.radar?.ranking || [];

  return (
    <div className="nave max-w-[1800px] mx-auto space-y-4">
      <Cabecalho overview={overview} />

      <div className="nave-ponte">
        {/* ── Coluna esquerda: leitura técnica densa ─────────────────────── */}
        <div className="space-y-3">
          <Telemetria overview={overview} />
          <Escuta overview={overview} />
        </div>

        {/* ── Centro: o reator e o que a aba pedir ───────────────────────── */}
        <div className="min-w-0 space-y-4">
          <div className="nave-bloco nave-canto p-4 sm:p-6">
            <div className="nave-nucleo">
              <Reator indice={overview?.indice} tamanho={TAMANHO_REATOR} />
              <Cinta ranking={ranking} />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap" role="tablist">
            {ABAS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id}
                onClick={() => setTab(id)} className="nave-d">
                {label}
              </button>
            ))}
          </div>

          {tab === 'ecossistema' && overview && (
            <>
              <section className="nave-bloco nave-canto p-4">
                <div className="nave-rot mb-3">radar unicórnio · score em 5 dimensões</div>
                <RadarUnicornio ranking={ranking} />
              </section>
              <section className="nave-bloco nave-canto p-4">
                <div className="nave-rot mb-3">matriz editais × projetos</div>
                <MatrizEditais editais={overview.editais} />
              </section>
            </>
          )}
          {tab === 'relatorios' && <div className="nave-bloco nave-canto p-4"><Relatorios notify={notify} /></div>}
          {tab === 'pic' && <div className="nave-bloco nave-canto p-4"><PainelPic notify={notify} /></div>}
          {tab === 'agentes' && <div className="nave-bloco nave-canto p-4"><PicsAgentes /></div>}
          {tab === 'modelos' && <div className="nave-bloco nave-canto p-4"><PainelModelos notify={notify} /></div>}
        </div>

        {/* ── Coluna direita: estado da Sexta-Feira e a conversa ─────────── */}
        <div className="nave-lateral-dir space-y-3">
          <EstadoSextaFeira overview={overview} />
          <ChatSextaFeira />
        </div>
      </div>
    </div>
  );
}

const TAMANHO_REATOR = 'min(78vw, 380px)';

const ABAS = [
  ['ecossistema', 'Ecossistema'],
  ['relatorios', 'Relatórios'],
  ['pic', 'PIC · Evolução'],
  ['agentes', 'PICs dos agentes'],
  ['modelos', 'Modelos de IA'],
];

// ── Cabeçalho da ponte ────────────────────────────────────────────────────
function Cabecalho({ overview }) {
  const agora = overview?.geradoEm
    ? new Date(overview.geradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';
  return (
    <div className="nave-bloco nave-canto px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="hud-pulso" style={{ color: 'var(--zd-acento)' }} />
        <div className="min-w-0">
          <h1 className="font-heading text-[17px] sm:text-xl font-bold leading-none text-white">
            SEXTA-FEIRA
          </h1>
          <div className="nave-rot mt-1.5">ponte de comando do ecossistema</div>
        </div>
      </div>
      <div className="hud-tec text-[9.5px] uppercase tracking-[.18em] flex items-center gap-4 flex-wrap"
        style={{ color: 'var(--n-fraco)' }}>
        <span>leitura {agora}</span>
        {overview && <span>pic v{overview.pic.versao}</span>}
        <span className="hidden sm:inline">esc devolve o chassi</span>
      </div>
    </div>
  );
}

// ── Cinta segmentada: cada bloco é um projeto do radar ────────────────────
function Cinta({ ranking }) {
  if (!ranking.length) {
    return <div className="nave-rot w-full">radar sem projeto para ler</div>;
  }
  return (
    <div className="w-full">
      <div className="nave-rot mb-2">carteira · {ranking.length} projeto(s) por score</div>
      <div className="nave-cinta">
        {ranking.slice(0, 48).map(r => (
          <div key={r.id || r.nome} className="nave-seg"
            data-alto={r.score >= 60 ? 'sim' : 'nao'}
            style={{ height: `${Math.max(12, r.score)}%` }}
            title={`${r.nome}: ${r.score}/100`} />
        ))}
      </div>
    </div>
  );
}

// ── Telemetria: a lista técnica da coluna esquerda ────────────────────────
function Telemetria({ overview }) {
  const o = overview;
  const linhas = o ? [
    ['usuários', o.usuarios.total],
    ['ativos hoje', o.usuarios.ativosHoje],
    ['xp total', o.usuarios.xpTotal],
    ['seiva circulante', o.usuarios.seivaCirculante],
    ['projetos', o.projetos.total],
    ['com plano', o.projetos.comPlano],
    ['biostartups', o.projetos.porClassificacao.biostartup],
    ['startups', o.projetos.porClassificacao.startup],
    ['missões', `${o.projetos.missoes.concluidas}/${o.projetos.missoes.total}`],
    ['unicórnios', o.radar.unicornios],
    ['alto potencial', o.radar.altoPotencial],
    ['editais abertos', o.editais.abertos],
    ['co₂e compensado', `${o.carbono.toneladas}t`],
    ['carbonpay', `R$ ${o.carbono.valorTotal}`],
  ] : [];

  return (
    <div className="nave-bloco nave-canto p-3.5">
      <div className="nave-rot mb-2.5">telemetria</div>
      <div className="nave-lista">
        {linhas.length === 0 && <div className="nave-linha"><span>lendo</span><span>…</span></div>}
        {linhas.map(([k, v]) => (
          <div key={k} className="nave-linha"><span>{k}</span><span>{v}</span></div>
        ))}
      </div>
    </div>
  );
}

// ── Escuta: o que o Agent Bus está fazendo ────────────────────────────────
function Escuta({ overview }) {
  const b = overview?.bus;
  return (
    <div className="nave-bloco nave-canto p-3.5">
      <div className="nave-rot mb-2.5">agent bus</div>
      <div className="nave-lista">
        <div className="nave-linha forte"><span>enviados</span><span>{b?.enviados ?? '—'}</span></div>
        <div className="nave-linha"><span>aceitos</span><span>{b?.aceitos ?? '—'}</span></div>
        <div className="nave-linha"><span>dispensados</span><span>{b?.dispensados ?? '—'}</span></div>
        <div className="nave-linha forte">
          <span>taxa de aceite</span>
          <span>{b?.taxaAceite !== null && b?.taxaAceite !== undefined ? `${b.taxaAceite}%` : 'sem base'}</span>
        </div>
      </div>
      <p className="hud-tec text-[8.5px] leading-relaxed mt-2.5" style={{ color: 'var(--n-apagado)' }}>
        META DE ACEITE ≥ 35%. ABAIXO DISSO O NUDGE VIRA RUÍDO.
      </p>
    </div>
  );
}

// ── Estado da Sexta-Feira ─────────────────────────────────────────────────
function EstadoSextaFeira({ overview }) {
  return (
    <div className="nave-bloco nave-canto aceso p-3.5">
      <div className="nave-rot mb-2.5">estado do protocolo</div>
      <div className="nave-lista">
        <div className="nave-linha forte"><span>versão do pic</span><span>v{overview?.pic?.versao ?? '—'}</span></div>
        <div className="nave-linha">
          <span>propostas pendentes</span>
          <span>{overview?.pic?.propostasPendentes ?? '—'}</span>
        </div>
        <div className="nave-linha"><span>agentes em campo</span><span>23/35</span></div>
      </div>
    </div>
  );
}
