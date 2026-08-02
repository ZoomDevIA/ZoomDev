import React, { useEffect, useRef, useState } from 'react';
import { api, abrirRelatorio } from '../lib/api.js';
import { useToast } from '../components/GamificationToasts.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// SUPER DASHBOARD DO ECOSSISTEMA — comandado pela Sexta-Feira 🕶️
// Visão total: radar unicórnio, matriz editais × projetos, chat, relatórios
// e o ciclo governado de evolução do Protocolo de Instância Cognitiva.
// ═══════════════════════════════════════════════════════════════════════════

const corScore = (v) => v >= 80 ? '#00ff64' : v >= 60 ? '#00c8ff' : v >= 40 ? '#ffd700' : 'rgba(255,255,255,.35)';

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
        content: 'Administrador. Sou a **Sexta-Feira** — enxergo o ecossistema inteiro em tempo real. Pergunte sobre **unicórnios**, **editais**, **carbono**, **nudges** ou peça um **relatório**. Nada aqui é inventado: cada número vem do snapshot vivo da plataforma.',
      }]);
    }).catch(() => {});
  }, []);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens, pensando]);

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
    <div className="zd-card-glow rounded-2xl flex flex-col overflow-hidden h-[560px]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[.03]">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border border-[#00c8ff55]"
          style={{ background: 'linear-gradient(135deg,#00ff6422,#00c8ff22)' }}>🕶️</div>
        <div className="flex-1">
          <div className="text-sm font-bold zd-gradient-text">Sexta-Feira</div>
          <div className="text-[10px] text-white/45">Inteligência-mestra do ecossistema</div>
        </div>
        {modo && (
          <span className={modo === 'ia+internet' ? 'zd-tag rounded-full px-2 py-0.5' : 'zd-tag-blue rounded-full px-2 py-0.5'}>
            {modo === 'ia+internet' ? '🌐 internet em tempo real' : modo === 'ia' ? 'IA' : 'demo'}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(4,14,8,.95), rgba(4,14,8,.97)), url(/assets/site/chat-bg.png)', backgroundSize: 'cover' }}>
        {mensagens.map((m, i) => (
          <div key={i} className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            m.role === 'user' ? 'ml-auto bg-[#00c8ff1a] border border-[#00c8ff33]' : 'bg-white/[.05] border border-white/10 text-white/80'
          }`}>
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
  if (!ranking.length) return <div className="zd-card rounded-xl p-6 text-sm text-white/45">Sem projetos no ecossistema ainda — o radar acende com a primeira ideação.</div>;
  return (
    <div className="space-y-2">
      {ranking.map((r, i) => (
        <button key={r.projetoId} onClick={() => setAberto(a => a === r.projetoId ? null : r.projetoId)}
          className="zd-card rounded-xl p-4 w-full text-left hover:border-[#00ff6444] transition-colors">
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
            <span className="zd-tag rounded-full px-2.5 py-1">{r.tier.emoji} {r.tier.label}</span>
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
  if (!editais.colunas.length) return <div className="zd-card rounded-xl p-6 text-sm text-white/45">Sem projetos para cruzar com os {editais.abertos} editais abertos.</div>;
  return (
    <div className="zd-card rounded-xl p-4 overflow-x-auto">
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
      <div className="text-[10px] text-white/35 mt-3">Score de aderência 0-100 · <span style={{ color: '#00ff64' }}>≥80 forte</span> · <span style={{ color: '#00c8ff' }}>≥60 boa</span> · <span style={{ color: '#ffd700' }}>≥40 parcial</span> — aderência ≥70 com prazo ≤60 dias dispara nudge automático do Editais IA.</div>
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
          <p className="text-xs text-white/50 mt-1">Resumo executivo, radar com decomposição, matriz de fomento, carbono e Agent Bus — diagramado e pronto para board.</p>
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
          <div className="font-heading font-bold">Protocolo de Instância Cognitiva — <span className="zd-gradient-text">v{pic.versaoAtual}</span></div>
          <p className="text-xs text-white/50 mt-1">A Sexta-Feira analisa o ecossistema{' '}— e a internet, quando conectada — e propõe evoluções cirúrgicas. Nada muda sem a sua aprovação.</p>
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
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-lg">
              <img src={`/assets/agents/${p.agenteId}.png`} alt={p.nome} className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.append(p.emoji); }} />
            </div>
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
export default function Admin() {
  const { notify } = useToast();
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('ecossistema');

  useEffect(() => { api.adminOverview().then(setOverview).catch(() => {}); }, []);

  const TABS = [
    ['ecossistema', '🌐 Ecossistema'],
    ['relatorios', '📊 Relatórios'],
    ['pic', '🧬 PIC & Evolução'],
    ['agentes', '🤖 PICs dos 25 agentes'],
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-[#00c8ff44] zd-glow-green"
          style={{ background: 'linear-gradient(135deg,#00ff6418,#00c8ff18)' }}>🕶️</div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold"><span className="zd-gradient-text">Sexta-Feira</span> · Super Dashboard</h1>
          <p className="text-white/50 text-sm mt-0.5">Visão total do ecossistema — orquestração dos 25 agentes, radar de unicórnios e fomento em tempo real.</p>
        </div>
        {overview && <span className="zd-tag rounded-full px-3 py-1.5">PIC v{overview.pic.versao}</span>}
      </div>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
          <StatCard valor={overview.usuarios.total} label="Usuários" />
          <StatCard valor={overview.projetos.total} label="Projetos" />
          <StatCard valor={overview.projetos.comPlano} label="Planos gerados" />
          <StatCard valor={`${overview.projetos.missoes.concluidas}/${overview.projetos.missoes.total}`} label="Missões" />
          <StatCard valor={`${overview.radar.unicornios} 🦄`} label="Unicórnios em formação" destaque />
          <StatCard valor={overview.editais.abertos} label="Editais abertos" />
          <StatCard valor={`${overview.carbono.toneladas}t`} label="CO₂e compensado" />
          <StatCard valor={overview.bus.enviados} label="Nudges enviados" />
        </div>
      )}

      <div className="grid xl:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === id ? 'text-[#00ff64] bg-[#00ff6414] border border-[#00ff6433]' : 'text-white/50 hover:text-white/85 hover:bg-white/5 border border-transparent'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'ecossistema' && overview && (
            <>
              <section>
                <h2 className="font-heading text-lg font-bold mb-3">🦄 Radar Unicórnio <span className="text-xs text-white/40 font-normal">· score explicável em 5 dimensões — clique para decompor</span></h2>
                <RadarUnicornio ranking={overview.radar.ranking} />
              </section>
              <section>
                <h2 className="font-heading text-lg font-bold mb-3">🔗 Matriz editais × projetos</h2>
                <MatrizEditais editais={overview.editais} />
              </section>
              <section className="grid sm:grid-cols-2 gap-3">
                <div className="zd-card rounded-xl p-4">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider">Agent Bus</div>
                  <div className="text-sm mt-2 text-white/70">{overview.bus.enviados} enviados · {overview.bus.aceitos} aceitos · {overview.bus.dispensados} dispensados</div>
                  <div className="text-xs text-white/45 mt-1">{overview.bus.taxaAceite !== null ? `Taxa de aceite: ${overview.bus.taxaAceite}% (meta ≥ 35%)` : 'Aguardando os primeiros nudges aceitos.'}</div>
                </div>
                <div className="zd-card rounded-xl p-4">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider">CarbonPay</div>
                  <div className="text-sm mt-2 text-white/70">{overview.carbono.pedidos} pedido(s) · {overview.carbono.toneladas} tCO₂e · R$ {overview.carbono.valorTotal}</div>
                  <div className="text-xs text-white/45 mt-1">Emissões compensadas com créditos verificados.</div>
                </div>
              </section>
            </>
          )}
          {tab === 'relatorios' && <Relatorios notify={notify} />}
          {tab === 'pic' && <PainelPic notify={notify} />}
          {tab === 'agentes' && <PicsAgentes />}
        </div>

        <div className="xl:sticky xl:top-4">
          <ChatSextaFeira />
        </div>
      </div>
    </div>
  );
}
