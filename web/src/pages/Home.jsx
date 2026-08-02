import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken } from '../lib/api.js';
import { useUser } from '../App.jsx';
import ModuloSwitch from '../components/ModuloSwitch.jsx';
import BrandLockup from '../components/BrandLockup.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// HOME — a porta de entrada da ZoomDev.
//
// Uma caixa de contexto no topo e a comunidade logo abaixo. Quem chega escreve
// a ideia antes de qualquer outra coisa; quem ainda não tem conta escreve
// mesmo assim — o rascunho viaja pelo cadastro e a ideação continua do outro
// lado, sem repetir digitação.
//
// Os dois seletores não são enfeite: o que estiver ligado aqui define a
// trilha do projeto que nasce deste formulário.
// ═══════════════════════════════════════════════════════════════════════════

const RASCUNHO = 'zd_rascunho_ideia';

const FILTROS = [
  { id: 'todos', label: 'Tudo' },
  { id: 'bio', label: '🌿 BioStartups' },
  { id: 'startup', label: '🚀 Startups' },
  { id: 'carbono', label: '🍃 Com carbono' },
];

const EXEMPLOS = [
  { titulo: 'EditalBot', tag: 'AI SaaS', modulos: { carbono: false, bio: false }, ideia: 'Um assistente de IA que pesquisa editais de fomento e redige propostas completas para startups, com score de aderência e lembretes de prazo.' },
  { titulo: 'BioBazaar', tag: 'Marketplace Bio', modulos: { carbono: true, bio: true }, ideia: 'Marketplace de ingredientes bioeconômicos da Amazônia com rastreabilidade da colheita à entrega, conectando cooperativas a indústrias.' },
  { titulo: 'ForestEye', tag: 'IoT Ambiental', modulos: { carbono: true, bio: true }, ideia: 'Plataforma de monitoramento florestal com sensoriamento satelital e gêmeo digital da biomassa para projetos de carbono e conservação.' },
];

const FASE_LABEL = {
  ideacao: 'Ideação', validacao: 'Validação', mvp: 'MVP', tracao: 'Tração', escala: 'Escala',
};

export default function Home() {
  const nav = useNavigate();
  const ctx = useUser();
  const user = ctx?.user || null;
  const logado = Boolean(user && getToken());

  const [dados, setDados] = useState(null);
  const [descricao, setDescricao] = useState(() => sessionStorage.getItem(RASCUNHO) || '');
  const [modulos, setModulos] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`${RASCUNHO}_mod`)) || { carbono: false, bio: false }; }
    catch { return { carbono: false, bio: false }; }
  });
  const [filtro, setFiltro] = useState('todos');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => { api.home().then(setDados).catch(() => {}); }, []);
  useEffect(() => {
    if (filtro === 'todos') return;
    api.vitrine(filtro).then(v => setDados(d => (d ? { ...d, vitrine: v } : d))).catch(() => {});
  }, [filtro]);

  // Rascunho sobrevive ao cadastro: quem escreve sem conta não digita duas vezes
  useEffect(() => { sessionStorage.setItem(RASCUNHO, descricao); }, [descricao]);
  useEffect(() => { sessionStorage.setItem(`${RASCUNHO}_mod`, JSON.stringify(modulos)); }, [modulos]);

  const vitrine = dados?.vitrine || [];
  const stats = dados?.stats;
  const modulosInfo = dados?.modulos || [];
  const pronto = descricao.trim().length >= 20;

  const construir = async (e) => {
    e?.preventDefault();
    if (!pronto || enviando) return;
    if (!logado) { nav('/entrar?proximo=construir'); return; }

    setErro(null); setEnviando(true);
    try {
      const r = await api.ideacao({ descricao, modulos });
      sessionStorage.removeItem(RASCUNHO);
      ctx.celebrar?.(r.gamificacao);
      await ctx.refreshUser?.();
      nav(`/projetos/${r.projeto.id}`, { state: { recemCriado: true } });
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  };

  const usarExemplo = (ex) => {
    setDescricao(ex.ideia);
    setModulos(ex.modulos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={logado ? 'space-y-12' : 'min-h-screen zd-bg zd-circuit-bg'}>
      {!logado && (
        <header className="border-b border-white/5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-5 py-4">
            <BrandLockup symbolSize={34} wordmarkHeight={26} />
            <div className="flex items-center gap-2">
              <Link to="/entrar" className="text-sm text-white/60 hover:text-white px-3 py-2 transition-colors">Entrar</Link>
              <Link to="/entrar?modo=cadastro" className="zd-gradient-btn rounded-lg px-4 py-2 text-sm">Criar conta grátis</Link>
            </div>
          </div>
        </header>
      )}

      <div className={logado ? 'space-y-12' : 'max-w-6xl mx-auto px-5 py-12 md:py-16 space-y-14'}>

        {/* ── Chamada + caixa de ideação ───────────────────────────────── */}
        <section className="space-y-7">
          <div className="text-center max-w-2xl mx-auto">
            <div className="zd-tag rounded-full px-3 py-1 inline-block mb-4">Ideia → Exit</div>
            <h1 className="font-heading text-3xl md:text-[42px] font-bold leading-[1.12]">
              O que você quer <span className="zd-gradient-text">construir hoje?</span>
            </h1>
            <p className="text-white/55 text-sm md:text-base mt-3 leading-relaxed">
              Descreva sua ideia em uma frase. Os agentes da ZoomDev estruturam o plano de negócios,
              constroem o MVP, encontram os editais e medem o impacto — do primeiro rascunho ao primeiro contrato.
            </p>
          </div>

          <form onSubmit={construir} className="zd-card-glow rounded-3xl p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                rows={4}
                className="zd-input w-full rounded-2xl px-5 py-4 text-[15px] resize-y leading-relaxed"
                placeholder="Ex.: uma plataforma que conecta cooperativas de açaí do Pará a compradores internacionais, com rastreabilidade da colheita à entrega e certificação de origem…"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) construir(e); }}
              />
              <div className="absolute bottom-3 right-4 text-[10px] text-white/25 pointer-events-none">
                {descricao.length < 20 ? `${20 - descricao.length} caracteres para começar` : '⌘ + Enter'}
              </div>
            </div>

            {/* ── Os dois seletores ─────────────────────────────────────── */}
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">
                Módulos desta construção · arraste para ligar
              </div>
              <div className="grid sm:grid-cols-2 gap-3 items-stretch">
                {modulosInfo.map(m => (
                  <ModuloSwitch
                    key={m.id}
                    modulo={m}
                    ligado={Boolean(modulos[m.id])}
                    onChange={v => setModulos(s => ({ ...s, [m.id]: v }))}
                  />
                ))}
              </div>
            </div>

            {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={!pronto || enviando} className="zd-gradient-btn flex-1 rounded-xl py-3.5 text-sm">
                {enviando ? 'Estruturando sua ideia…' : logado ? '✦ Construir agora →' : '✦ Construir agora — criar conta grátis →'}
              </button>
              <Link
                to={logado ? '/carbonpay' : '/entrar'}
                className="rounded-xl border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors px-5 py-3.5 text-sm text-center font-semibold shrink-0"
              >
                🍃 Abrir a calculadora
              </Link>
            </div>

            <p className="text-[11px] text-white/32 text-center">
              {modulos.bio && modulos.carbono
                ? 'Trilha da bioeconomia com inventário de carbono desde o dia zero.'
                : modulos.bio
                  ? 'Trilha da bioeconomia: evidência científica classificada e editais de fomento verde.'
                  : modulos.carbono
                    ? 'Seu plano vai nascer com o passivo ambiental medido pelo GHG Protocol.'
                    : 'Sem módulos ligados, a IA classifica sua ideia e escolhe a trilha por você.'}
            </p>
          </form>

          {/* Exemplos para quem travou na primeira frase */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[11px] text-white/35">Sem ideia ainda? Comece por um destes:</span>
              {EXEMPLOS.map(ex => (
                <button key={ex.titulo} type="button" onClick={() => usarExemplo(ex)}
                  className="rounded-full border border-white/12 hover:border-[#00ff6455] hover:bg-[#00ff640d] px-3 py-1 text-[11px] text-white/60 hover:text-white/90 transition-all">
                  {ex.titulo} <span className="text-white/25">· {ex.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Números reais do ecossistema ─────────────────────────────── */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { n: stats.projetos, l: 'projetos nascidos aqui' },
              { n: stats.planos, l: 'planos de negócios gerados' },
              { n: stats.mvps, l: 'MVPs construídos' },
              { n: stats.biostartups, l: 'biostartups na trilha verde' },
            ].map(s => (
              <div key={s.l} className="zd-stat-card rounded-xl p-4 text-center">
                <div className="font-heading text-2xl font-bold zd-gradient-text">{s.n}</div>
                <div className="text-[10px] text-white/45 mt-0.5 leading-tight">{s.l}</div>
              </div>
            ))}
          </section>
        )}

        {/* ── Vitrine da comunidade ────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold">
                Construído pela <span className="zd-gradient-text">comunidade</span>
              </h2>
              <p className="text-white/45 text-sm mt-1">
                Projetos publicados por quem já está construindo na ZoomDev.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {FILTROS.map(f => (
                <button key={f.id} onClick={() => setFiltro(f.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                    filtro === f.id
                      ? 'border-[#00ff6455] bg-[#00ff6414] text-[#00ff64]'
                      : 'border-white/10 text-white/45 hover:text-white/80 hover:border-white/25'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {vitrine.length === 0 ? (
            <div className="zd-card rounded-2xl p-10 text-center">
              <div className="text-3xl mb-2">🌱</div>
              <div className="font-heading font-bold">A vitrine ainda está vazia</div>
              <p className="text-white/45 text-sm mt-1.5 max-w-md mx-auto">
                {filtro === 'todos'
                  ? 'Nenhum projeto foi publicado ainda. Construa o seu, gere o plano e publique — o primeiro da vitrine pode ser você.'
                  : 'Nenhum projeto publicado nesse filtro por enquanto.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {vitrine.map(p => <CardVitrine key={p.id} projeto={p} logado={logado} />)}
            </div>
          )}
        </section>

        {!logado && (
          <footer className="text-center pt-4 pb-2 border-t border-white/5">
            <p className="text-white/40 text-sm">
              Crie sua conta gratuita e receba 500 🌿 de seiva para gerar seu primeiro plano completo.
            </p>
            <Link to="/entrar?modo=cadastro" className="zd-gradient-btn rounded-xl px-6 py-3 text-sm inline-block mt-4">
              Começar agora →
            </Link>
            <div className="text-[10px] text-white/20 mt-8">© 2026 ZoomDev OS · Da ideia ao exit</div>
          </footer>
        )}
      </div>
    </div>
  );
}

function CardVitrine({ projeto: p, logado }) {
  const [curtidas, setCurtidas] = useState(p.curtidas);
  const [curtido, setCurtido] = useState(false);
  const bio = p.classificacao === 'biostartup';
  const cor = bio ? '#00ff64' : '#00c8ff';

  const curtir = async () => {
    if (!logado) return;
    try {
      const r = await api.curtirProjeto(p.id);
      setCurtidas(r.curtidas); setCurtido(r.curtido);
    } catch { /* silencioso: curtir não é ação crítica */ }
  };

  const selos = useMemo(() => [
    p.temPlano && { t: 'Plano', c: '#00ff64' },
    p.temMvp && { t: 'MVP', c: '#00c8ff' },
    p.modulos.carbono && { t: '🍃 Carbono', c: '#00c8ff' },
  ].filter(Boolean), [p]);

  return (
    <article className="zd-agent-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border"
              style={{ color: cor, borderColor: `${cor}44`, background: `${cor}12` }}>
              {bio ? '🌿 BioStartup' : '🚀 Startup'}
            </span>
            {p.destaque && <span className="zd-tag rounded-full px-2 py-0.5">★ destaque</span>}
          </div>
          <h3 className="font-heading font-bold text-[15px] mt-2 leading-snug">{p.nome}</h3>
        </div>
      </div>

      <p className="text-[12px] text-white/55 leading-relaxed line-clamp-3 flex-1">{p.resumo}</p>

      {selos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selos.map(s => (
            <span key={s.t} className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border"
              style={{ color: s.c, borderColor: `${s.c}33`, background: `${s.c}0f` }}>{s.t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/8">
        <div className="text-[10px] text-white/40 min-w-0 truncate">
          por <span className="text-white/60">{p.autor}</span> · {FASE_LABEL[p.fase] || p.fase}
        </div>
        <button onClick={curtir} disabled={!logado}
          title={logado ? 'Apoiar este projeto' : 'Entre para apoiar'}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] border transition-all ${
            curtido ? 'border-[#00ff6455] bg-[#00ff6414] text-[#00ff64]' : 'border-white/10 text-white/45 hover:text-white/80'}
            ${logado ? '' : 'cursor-default opacity-60'}`}>
          {curtido ? '🌿' : '🤍'} {curtidas}
        </button>
      </div>
    </article>
  );
}
