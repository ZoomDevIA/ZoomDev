import React from 'react';

// Visualização diagramada do plano dentro da plataforma (espelha o relatório HTML/PDF)
const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`;

function Secao({ emoji, titulo, children }) {
  return (
    <section className="zd-card rounded-2xl p-6">
      <h2 className="font-heading text-lg font-bold border-b border-[#00ff6433] pb-2.5 mb-4">{emoji} {titulo}</h2>
      {children}
    </section>
  );
}

const Sub = ({ children }) => <h3 className="text-sm font-bold text-white/85 mt-4 mb-1.5">{children}</h3>;
const Lista = ({ itens }) => (
  <ul className="text-sm text-white/65 space-y-1">{(itens || []).map((i, k) => <li key={k} className="flex gap-2"><span className="zd-green shrink-0">▸</span><span>{i}</span></li>)}</ul>
);

function BarrasProjecao({ projecao }) {
  if (!projecao?.length) return null;
  const max = Math.max(...projecao.map(p => p.receita), 1);
  return (
    <div>
      <div className="text-xs text-white/45 mb-2">Receita projetada (12 meses) — pico {fmtBRL(max)}</div>
      <div className="flex items-end gap-1.5 h-36">
        {projecao.map(p => (
          <div key={p.mes} className="flex-1 flex flex-col items-center gap-1 group" title={`M${p.mes}: ${fmtBRL(p.receita)} · ${p.clientes} clientes`}>
            <div className="w-full rounded-t-md transition-all group-hover:opacity-80"
              style={{ height: `${Math.max(3, (p.receita / max) * 100)}%`, background: 'linear-gradient(180deg,#00ff64,#00c8ff)' }} />
            <div className="text-[9px] text-white/35">M{p.mes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Swot({ swot }) {
  if (!swot) return null;
  const Q = ({ t, itens, cor }) => (
    <div className="rounded-xl border p-3.5" style={{ borderColor: cor }}>
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cor }}>{t}</div>
      <ul className="text-xs text-white/60 mt-2 space-y-1">{(itens || []).map((i, k) => <li key={k}>• {i}</li>)}</ul>
    </div>
  );
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Q t="Forças" itens={swot.forcas} cor="#00ff64" />
      <Q t="Fraquezas" itens={swot.fraquezas} cor="#ff9046" />
      <Q t="Oportunidades" itens={swot.oportunidades} cor="#00c8ff" />
      <Q t="Ameaças" itens={swot.ameacas} cor="#ff5c7a" />
    </div>
  );
}

export default function PlanoView({ projeto }) {
  const p = projeto.plano;
  if (!p) return null;
  return (
    <div className="space-y-5">
      <Secao emoji="🧩" titulo="Produto — Agente Produto">
        <p className="text-sm zd-green-dim font-semibold">{p.produto.propostaDeValor}</p>
        <Sub>Problema</Sub><p className="text-sm text-white/65">{p.produto.problema}</p>
        <Sub>Solução</Sub><p className="text-sm text-white/65">{p.produto.solucao}</p>
        <Sub>Público-alvo</Sub><p className="text-sm text-white/65">{p.produto.publicoAlvo}</p>
        <Sub>Personas</Sub>
        <div className="grid sm:grid-cols-2 gap-3 mt-1">
          {(p.produto.personas || []).map((pe, i) => (
            <div key={i} className="rounded-xl bg-white/[.04] border border-white/10 p-3.5">
              <div className="text-sm font-bold">{pe.nome}</div>
              <div className="text-xs text-white/55 mt-1">{pe.descricao}</div>
              <div className="text-xs zd-blue mt-1.5">Dor: {pe.dor}</div>
            </div>
          ))}
        </div>
        <Sub>Funcionalidades do MVP</Sub><Lista itens={p.produto.funcionalidadesMvp} />
        <Sub>Diferenciais</Sub><Lista itens={p.produto.diferenciais} />
      </Secao>

      <Secao emoji="📊" titulo="Negócio — Agente Negócio">
        <p className="text-sm text-white/65">{p.negocio.modeloDeNegocio}</p>
        <div className="grid grid-cols-3 gap-3 my-4">
          {[['TAM', p.negocio.mercado.tam], ['SAM', p.negocio.mercado.sam], ['SOM', p.negocio.mercado.som]].map(([l, v]) => (
            <div key={l} className="zd-stat-card rounded-xl p-3.5 text-center">
              <div className="text-[10px] text-white/45 font-bold">{l}</div>
              <div className="font-heading font-bold zd-green mt-1 text-sm md:text-base">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/45 mb-4">{p.negocio.mercado.contexto}</p>
        <BarrasProjecao projecao={p.negocio.projecao12Meses} />
        <Sub>Concorrência</Sub>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-1">
            <thead><tr className="text-left text-white/40">
              <th className="py-2 pr-3">Concorrente</th><th className="py-2 pr-3">Força</th><th className="py-2">Fraqueza explorável</th>
            </tr></thead>
            <tbody>
              {(p.negocio.concorrentes || []).map((c, i) => (
                <tr key={i} className="border-t border-white/5 text-white/65">
                  <td className="py-2 pr-3 font-semibold text-white/85">{c.nome}</td>
                  <td className="py-2 pr-3">{c.forca}</td>
                  <td className="py-2 zd-green-dim">{c.fraqueza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Sub>Pricing</Sub><Lista itens={p.negocio.pricing} />
        <Sub>Go-to-market</Sub><Lista itens={p.negocio.goToMarket} />
        <Sub>Análise SWOT</Sub><Swot swot={p.negocio.swot} />
      </Secao>

      <Secao emoji="⚙️" titulo="Engenharia — Agente Engenharia">
        <p className="text-sm text-white/65">{p.engenharia.arquitetura}</p>
        <Sub>Stack</Sub><Lista itens={p.engenharia.stack} />
        <Sub>Roadmap técnico</Sub>
        <div className="space-y-2.5 mt-1">
          {(p.engenharia.roadmapTecnico || []).map((f, i) => (
            <div key={i} className="border-l-2 border-[#00c8ff] bg-[#00c8ff0a] rounded-r-xl p-3.5">
              <div className="text-sm font-bold">{f.fase} <span className="text-white/40 font-normal text-xs">({f.duracao})</span></div>
              <Lista itens={f.entregas} />
            </div>
          ))}
        </div>
        <Sub>Riscos técnicos</Sub><Lista itens={p.engenharia.riscosTecnicos} />
        <Sub>Custo de infraestrutura</Sub><p className="text-sm zd-green-dim font-semibold">{p.engenharia.custoInfraEstimado}</p>
      </Secao>

      <Secao emoji="🌍" titulo="Impacto — Agente Impacto">
        {(p.impacto.ods || []).map((o, i) => (
          <p key={i} className="text-sm text-white/65 mb-1"><b className="zd-blue">ODS {o.numero} — {o.nome}:</b> {o.contribuicao}</p>
        ))}
        <Sub>KPIs de impacto</Sub><Lista itens={p.impacto.kpisImpacto} />
        <Sub>Práticas ESG</Sub><Lista itens={p.impacto.praticasEsg} />
        <Sub>Riscos e mitigação</Sub>
        {(p.impacto.riscos || []).map((r, i) => (
          <p key={i} className="text-xs text-white/60 mb-1">⚠️ <b className="text-white/80">{r.risco}</b> → {r.mitigacao}</p>
        ))}
        <div className="zd-notification rounded-xl p-3.5 mt-3 text-sm text-white/70">🍃 <b>Pegada de carbono:</b> {p.impacto.pegadaCarbono}</div>
      </Secao>

      <Secao emoji="📋" titulo="Editais & Fomento — Agente Editais">
        <div className="space-y-3">
          {(p.editais.editaisRecomendados || []).map((e, i) => (
            <div key={i} className="rounded-xl bg-white/[.04] border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-bold">{e.nome} <span className="text-white/40 font-normal text-xs">· {e.orgao}</span></div>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${e.aderencia}%`, background: 'linear-gradient(90deg,#00ff64,#00c8ff)' }} />
                  </div>
                  <span className="text-xs zd-green font-bold">{e.aderencia}/100</span>
                </div>
              </div>
              <p className="text-xs text-white/55 mt-1.5">{e.motivo}</p>
            </div>
          ))}
        </div>
        <Sub>Documentação necessária</Sub><Lista itens={p.editais.documentacaoNecessaria} />
        <Sub>Dicas de submissão</Sub><Lista itens={p.editais.dicasSubmissao} />
      </Secao>
    </div>
  );
}
