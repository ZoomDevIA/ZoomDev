import React, { useEffect, useState } from 'react';
import { api, baixarPlanoCompensacao } from '../lib/api.js';
import { useUser } from '../App.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA DE PASSIVO + PLANO DE COMPENSAÇÃO
//              MEDIR  →  REDUZIR  →  COMPENSAR
// Compensar antes de reduzir é greenwashing. A interface força a ordem certa.
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (v, d = 1) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const brl = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const ETAPAS = [
  { n: 1, id: 'medir', nome: 'MEDIR', desc: 'Inventário de emissões' },
  { n: 2, id: 'reduzir', nome: 'REDUZIR', desc: 'Antes de compensar' },
  { n: 3, id: 'compensar', nome: 'COMPENSAR', desc: 'Apenas o residual' },
];

function Passos({ atual }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ETAPAS.map((e, i) => (
        <React.Fragment key={e.id}>
          <div className={`flex-1 min-w-[130px] rounded-xl border p-3 transition-colors ${
            atual >= e.n ? 'border-[#00ff6444] bg-[#00ff640d]' : 'border-white/10 bg-white/[.03]'}`}>
            <div className="text-[10px] text-white/40">ETAPA {e.n}</div>
            <div className={`font-heading font-bold text-sm ${atual >= e.n ? 'zd-green' : 'text-white/50'}`}>{e.nome}</div>
            <div className="text-[10px] text-white/45 mt-0.5">{e.desc}</div>
          </div>
          {i < ETAPAS.length - 1 && <div className="self-center text-white/25">→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Compensacao() {
  const { celebrar, refreshUser } = useUser();
  const [cfg, setCfg] = useState(null);
  const [perfil, setPerfil] = useState('digital');
  const [dados, setDados] = useState({});
  const [horizonte, setHorizonte] = useState(5);
  const [areaPropria, setAreaPropria] = useState({ ativa: false, culturaId: 'mandioca', hectares: 50, cenarioId: 'conservador' });
  const [culturas, setCulturas] = useState([]);
  const [r, setR] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.carbonPerfis().then(setCfg).catch(() => {});
    api.biogenesis().then(d => setCulturas(d.culturas || [])).catch(() => {});
  }, []);

  const perfilAtivo = cfg?.perfis?.find(p => p.id === perfil);
  const set = (k) => (e) => setDados(d => ({ ...d, [k]: e.target.value === '' ? '' : Number(e.target.value) }));

  const gerar = async () => {
    setErro(null); setCarregando(true);
    try {
      const body = {
        dados: { ...dados, perfil },
        horizonteAnos: horizonte,
        ...(areaPropria.ativa ? { areaPropria: { culturaId: areaPropria.culturaId, hectares: Number(areaPropria.hectares), cenarioId: areaPropria.cenarioId } } : {}),
      };
      const res = await api.planoCompensacao(body);
      setR(res);
      celebrar(res.gamificacao);
      await refreshUser();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  const etapaAtual = r ? 3 : Object.values(dados).some(v => Number(v) > 0) ? 1 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Plano de <span className="zd-gradient-text">Compensação de Carbono</span>
        </h1>
        <p className="text-white/55 text-sm mt-1.5">
          Meça seu passivo, descubra o que dá para reduzir e compense só o residual — na ordem que a boa prática exige.
        </p>
      </div>

      <Passos atual={etapaAtual} />

      {/* ETAPA 1 — entrada */}
      <div className="zd-card-glow rounded-2xl p-5 space-y-5">
        <div>
          <label className="text-xs text-white/60 block mb-2">Perfil da operação</label>
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {(cfg?.perfis || []).map(p => (
              <button key={p.id} onClick={() => { setPerfil(p.id); setDados({}); setR(null); }}
                className={`text-left rounded-xl border p-3 transition-all ${perfil === p.id ? 'border-[#00ff64] bg-[#00ff6414]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}>
                <div className="text-lg">{p.emoji}</div>
                <div className="text-xs font-semibold mt-1">{p.nome}</div>
              </button>
            ))}
          </div>
          {perfilAtivo && <p className="text-[11px] text-white/45 mt-2">{perfilAtivo.descricao}</p>}
        </div>

        {perfilAtivo && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perfilAtivo.campos.map(c => {
              const campo = cfg.campos[c];
              if (!campo) return null;
              return (
                <div key={c}>
                  <label className="text-[11px] text-white/60 block mb-1">
                    {campo.label} {campo.escopo > 0 && <span className="text-white/30">· escopo {campo.escopo}</span>}
                  </label>
                  <div className="relative">
                    <input type="number" min={0} value={dados[c] ?? ''} onChange={set(c)}
                      className="zd-input w-full rounded-lg px-3 py-2 text-sm pr-20" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/35 pointer-events-none">{campo.unidade}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Horizonte do plano</label>
            <select value={horizonte} onChange={e => setHorizonte(Number(e.target.value))}
              className="zd-input w-full rounded-lg px-3 py-2.5 text-sm">
              {[3, 5, 7, 10].map(a => <option key={a} value={a}>{a} anos</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-white/60 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={areaPropria.ativa} className="accent-[#00ff64]"
                onChange={e => setAreaPropria(a => ({ ...a, ativa: e.target.checked }))} />
              Tenho área própria para compensar
            </label>
            {areaPropria.ativa && (
              <div className="flex gap-2">
                <select value={areaPropria.culturaId} onChange={e => setAreaPropria(a => ({ ...a, culturaId: e.target.value }))}
                  className="zd-input flex-1 rounded-lg px-2 py-2.5 text-sm">
                  {culturas.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
                </select>
                <input type="number" min={1} value={areaPropria.hectares}
                  onChange={e => setAreaPropria(a => ({ ...a, hectares: e.target.value }))}
                  className="zd-input w-24 rounded-lg px-2 py-2.5 text-sm" placeholder="ha" />
              </div>
            )}
          </div>
        </div>

        {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

        <button onClick={gerar} disabled={carregando} className="zd-gradient-btn w-full rounded-xl py-3.5 text-sm">
          {carregando ? 'Calculando e montando o plano…' : '🗺️ Gerar plano de compensação →'}
        </button>
      </div>

      {r && <Resultado r={r} />}
    </div>
  );
}

function Resultado({ r }) {
  const { inventario: inv, plano: p } = r;
  const m = p.medir, red = p.reduzir, comp = p.compensar;
  const [baixando, setBaixando] = useState(null);

  const baixar = async (formato) => {
    setBaixando(formato);
    try { await baixarPlanoCompensacao(r.id, formato); } catch { /* ignora */ }
    finally { setBaixando(null); }
  };

  return (
    <div className="space-y-5">
      {/* Downloads */}
      <div className="zd-card-glow rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-heading font-bold">Plano pronto</div>
          <p className="text-xs text-white/50 mt-0.5">Documento completo para board, investidor, edital ou relatório ESG.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => baixar('docx')} disabled={baixando} className="zd-gradient-btn rounded-lg px-4 py-2.5 text-sm">
            {baixando === 'docx' ? 'Gerando…' : '📄 Baixar DOCX'}
          </button>
          <button onClick={() => baixar('html')} disabled={baixando}
            className="rounded-lg border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors px-4 py-2.5 text-sm font-semibold">
            👁️ Visualizar
          </button>
        </div>
      </div>

      {/* MEDIR */}
      <section className="zd-card rounded-2xl p-5">
        <h2 className="font-heading font-bold flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#00ff641a] border border-[#00ff6433] flex items-center justify-center text-xs zd-green">1</span>
          Medir
        </h2>
        <div className="flex items-end gap-3 flex-wrap mt-3">
          <div>
            <div className="font-heading text-3xl font-bold zd-green">{fmt(m.totalTco2eAno)} <span className="text-sm text-white/40">tCO₂e/ano</span></div>
            <div className="text-xs text-white/50 mt-1">
              faixa de {fmt(m.incerteza.minimo)} a {fmt(m.incerteza.maximo)} · incerteza ±{m.incerteza.percentual}%
            </div>
          </div>
          {inv.benchmark && <span className="zd-tag-blue rounded-full px-3 py-1.5">Nível {inv.benchmark}</span>}
        </div>
        <p className="text-[11px] text-white/40 mt-2">{m.incerteza.nota}</p>

        <div className="grid sm:grid-cols-3 gap-2.5 mt-4">
          {[['1', m.escopos.escopo1, 'Direto'], ['2', m.escopos.escopo2, 'Energia'], ['3', m.escopos.escopo3, 'Cadeia']].map(([n, e, l]) => (
            <div key={n} className="zd-stat-card rounded-xl p-3.5">
              <div className="text-[10px] text-white/40">ESCOPO {n} · {l}</div>
              <div className="font-heading text-xl font-bold mt-1">{fmt(e.tco2e)} <span className="text-[10px] text-white/40">t</span></div>
              <div className="text-[10px] text-white/45 mt-1 leading-snug">{e.descricao}</div>
            </div>
          ))}
        </div>

        <div className="text-xs font-bold text-white/50 uppercase tracking-wider mt-5 mb-2">Maiores fontes</div>
        <div className="space-y-1.5">
          {m.maioresFontes.map(f => (
            <div key={f.label} className="flex items-center gap-3 rounded-lg bg-white/[.04] px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{f.label}</div>
                <div className="text-[10px] text-white/40">Escopo {f.escopo} · {f.fator}</div>
              </div>
              <div className="w-28 shrink-0">
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#ff9f43]" style={{ width: `${Math.min(100, (f.tco2e / m.totalTco2eAno) * 100)}%` }} />
                </div>
              </div>
              <div className="text-xs font-bold w-16 text-right">{fmt(f.tco2e)} t</div>
            </div>
          ))}
        </div>
      </section>

      {/* REDUZIR */}
      <section className="zd-card rounded-2xl p-5">
        <h2 className="font-heading font-bold flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#00ff641a] border border-[#00ff6433] flex items-center justify-center text-xs zd-green">2</span>
          Reduzir <span className="text-xs text-white/40 font-normal">· antes de compensar</span>
        </h2>
        <p className="text-sm text-white/70 mt-3">
          Meta de <b className="zd-green">{red.metaPercentual}%</b> ({fmt(red.metaTonAno)} tCO₂e/ano) em {p.horizonteAnos} anos ·
          potencial técnico identificado: {fmt(red.potencialTotalTon)} t
        </p>

        {red.ganhosRapidos.length > 0 && (
          <div className="rounded-xl border border-[#00ff6433] bg-[#00ff640d] p-3.5 mt-3">
            <div className="text-xs font-bold zd-green mb-1.5">⚡ Ganhos rápidos — baixo custo e economia financeira</div>
            <div className="flex flex-wrap gap-1.5">
              {red.ganhosRapidos.map(g => (
                <span key={g.id} className="zd-tag rounded-full px-2.5 py-1">{g.titulo} · −{fmt(g.potencialReducaoTon)} t</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 mt-4">
          {red.acoes.map((a, i) => (
            <div key={a.id} className="rounded-xl bg-white/[.04] border border-white/8 p-3.5">
              <div className="flex items-start gap-3 flex-wrap">
                <span className="text-white/30 font-heading font-bold text-sm w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-bold">{a.titulo}</div>
                  <p className="text-[11px] text-white/55 mt-1 leading-relaxed">{a.como}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading font-bold zd-green">−{fmt(a.potencialReducaoTon)} t</div>
                  <div className="text-[10px] text-white/45">{a.percentualDoTotal}% do total</div>
                  <div className="flex gap-1 mt-1 justify-end">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] border ${
                      a.custoRelativo === 'baixo' ? 'border-[#00ff6444] text-[#00ff64]' :
                      a.custoRelativo === 'médio' ? 'border-[#ffd70044] text-[#ffd700]' : 'border-[#ff6b6b44] text-[#ff6b6b]'}`}>
                      custo {a.custoRelativo}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-[9px] border border-white/15 text-white/45">{a.prazo}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs font-bold text-white/50 uppercase tracking-wider mt-5 mb-2">Roadmap</div>
        <div className="space-y-1.5">
          {red.roadmap.map(x => (
            <div key={x.ano} className="flex items-center gap-3 rounded-lg bg-white/[.04] px-3 py-2.5">
              <div className="text-xs font-bold w-14 shrink-0">Ano {x.ano}</div>
              <div className="flex-1">
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${x.percentualReduzido}%`, background: 'linear-gradient(90deg,#00ff64,#00c8ff)' }} />
                </div>
                <div className="text-[10px] text-white/40 mt-1 truncate">{x.acoesFoco.join(' · ') || '—'}</div>
              </div>
              <div className="text-right shrink-0 w-24">
                <div className="text-xs font-bold zd-green">−{x.percentualReduzido}%</div>
                <div className="text-[10px] text-white/40">resta {fmt(x.emissaoResidualTon)} t</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPENSAR */}
      <section className="zd-card rounded-2xl p-5">
        <h2 className="font-heading font-bold flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#00c8ff1a] border border-[#00c8ff33] flex items-center justify-center text-xs zd-blue">3</span>
          Compensar <span className="text-xs text-white/40 font-normal">· apenas o residual</span>
        </h2>
        <p className="text-sm text-white/70 mt-3">
          Residual após as reduções: <b>{fmt(comp.residualTonAno)} t</b> · com margem de {comp.margemSeguranca}%:
          <b className="zd-blue"> {fmt(comp.aCompensarTonAno)} tCO₂e/ano a compensar</b>
        </p>

        <div className="grid lg:grid-cols-2 gap-3 mt-4">
          {comp.rotaPropria && (
            <div className="rounded-xl border border-[#00ff6433] bg-[#00ff640d] p-4">
              <div className="text-xs font-bold zd-green">🌱 Rota A — {comp.rotaPropria.rota}</div>
              <div className="font-heading text-2xl font-bold mt-2">{fmt(comp.rotaPropria.mitigacaoTonAno)} <span className="text-xs text-white/40">tCO₂e/ano</span></div>
              <div className="text-xs text-white/55 mt-1">
                {comp.rotaPropria.cultura} em {fmt(comp.rotaPropria.hectares, 0)} ha · cobre <b className="zd-green">{comp.rotaPropria.coberturaPercentual}%</b> do necessário
              </div>
              <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{comp.rotaPropria.vantagem}</p>
              <div className="text-[10px] text-white/35 mt-2">Requisitos: {comp.rotaPropria.requisitos.join(' · ')}</div>
            </div>
          )}
          <div className="rounded-xl border border-[#00c8ff33] bg-[#00c8ff0d] p-4">
            <div className="text-xs font-bold zd-blue">🛒 Rota B — {comp.rotaCredito.rota}</div>
            <div className="space-y-1.5 mt-2.5">
              {comp.rotaCredito.opcoes.map(o => (
                <div key={o.id} className="flex items-center gap-2 justify-between rounded-lg bg-white/[.04] px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold truncate">{o.nome}</div>
                    <div className="text-[10px] text-white/40">{o.padrao} · {brl(o.precoPorTon)}/t</div>
                  </div>
                  <div className="text-xs font-bold shrink-0">{brl(o.custoTotal)}<span className="text-[9px] text-white/40">/ano</span></div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{comp.rotaCredito.vantagem}</p>
          </div>
        </div>
      </section>

      {/* Conformidade */}
      <section className="zd-card rounded-2xl p-5">
        <h2 className="font-heading font-bold">🛡️ Conformidade na comunicação</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div>
            <div className="text-xs font-bold zd-green mb-2">✅ O que você PODE afirmar</div>
            {p.conformidade.podeAfirmar.map((x, i) => (
              <div key={i} className="text-[11px] text-white/70 border-l-2 border-[#00ff64] pl-2.5 py-1 mb-1.5 leading-relaxed">{x}</div>
            ))}
          </div>
          <div>
            <div className="text-xs font-bold text-[#ff6b6b] mb-2">🚫 O que NÃO pode afirmar</div>
            {p.conformidade.naoPodeAfirmar.map((x, i) => (
              <div key={i} className="text-[11px] text-white/70 border-l-2 border-[#ff6b6b] pl-2.5 py-1 mb-1.5 leading-relaxed">{x}</div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-white/35 mt-3">Referência: {p.conformidade.norma}</div>
      </section>

      {/* ODS */}
      <section className="zd-card rounded-2xl p-5">
        <h2 className="font-heading font-bold mb-3">🇺🇳 Alinhamento ODS</h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {p.ods.map(o => (
            <div key={o.ods} className="rounded-lg bg-white/[.04] border border-white/8 p-3 flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00c8ff1a] border border-[#00c8ff33] flex items-center justify-center font-heading font-bold text-sm zd-blue shrink-0">{o.ods}</div>
              <div className="min-w-0">
                <div className="text-xs font-bold">{o.nome}</div>
                <div className="text-[11px] text-white/50 mt-0.5 leading-snug">{o.motivo}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
