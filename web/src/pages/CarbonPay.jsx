import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';
import CalculadoraPassivo from '../components/CalculadoraPassivo.jsx';

const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const ABAS = [
  { id: 'passivo', label: '🧮 Passivo Ambiental' },
  { id: 'sequestro', label: '🌳 Sequestro (gerar créditos)' },
  { id: 'marketplace', label: '🛒 Marketplace' },
];

export default function CarbonPay() {
  const { celebrar, refreshUser } = useUser();
  const [aba, setAba] = useState('passivo');
  const [mkt, setMkt] = useState(null);
  const [seq, setSeq] = useState({ areaHa: '', bioma: 'amazonia', tipo: 'restauracao', duracaoAnos: 10, precoPorTon: 90 });
  const [seqResultado, setSeqResultado] = useState(null);
  const [compra, setCompra] = useState(null); // {item} | {item, toneladas, metodo}
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => { api.carbonMarketplace().then(setMkt).catch(() => {}); }, []);

  const calcularSequestro = async (e) => {
    e.preventDefault();
    setErro(null);
    try { setSeqResultado(await api.carbonSequestro(seq)); } catch (err) { setErro(err.message); }
  };

  const confirmarCompra = async () => {
    setErro(null);
    try {
      const r = await api.carbonComprar({ itemId: compra.item.id, toneladas: compra.toneladas, metodo: compra.metodo });
      setPedido(r.pedido);
      setCompra(null);
      celebrar(r.gamificacao);
      await refreshUser();
      api.carbonMarketplace().then(setMkt).catch(() => {});
    } catch (err) { setErro(err.message); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-heading text-2xl font-bold">🍃 Carbon<span className="zd-gradient-text">Pay</span></h1>
        <span className="zd-tag-blue rounded-full px-2.5 py-1">Fintech</span>
      </div>
      <p className="text-white/55 text-sm -mt-3 max-w-2xl">
        A fintech verde da ZoomDev: calcule seu passivo, estime o potencial de geração de créditos da sua área e negocie créditos verificados.
      </p>

      {/* Banner original do CarbonPay (arte + 3 pilares do protótipo) */}
      <div className="zd-card-glow rounded-2xl overflow-hidden relative">
        <img src="/assets/site/carbonpay-art.webp" alt="" className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(3,13,7,.94) 35%, rgba(3,13,7,.72))' }} />
        <div className="relative p-6 grid sm:grid-cols-3 gap-4">
          {[
            ['💰', 'Monetize seu projeto ambiental', 'Gere renda certificando e vendendo créditos de carbono.'],
            ['🛡️', 'Auditoria MRV automatizada', 'Validação e rastreabilidade com padrões internacionais.'],
            ['🌐', 'Conecte-se com compradores globais', 'Demanda corporativa por créditos verificados da Amazônia.'],
          ].map(([ic, t, d]) => (
            <div key={t}>
              <div className="text-xl">{ic}</div>
              <div className="text-sm font-bold mt-1.5">{t}</div>
              <div className="text-xs text-white/55 mt-1">{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats do marketplace: clone do protótipo */}
      {mkt && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Créditos Disponíveis', `${mkt.stats.creditosDisponiveis.toLocaleString('pt-BR')} tCO₂`],
            ['Projetos Certificados', mkt.stats.projetosCertificados],
            ['Transações', mkt.stats.transacoes],
            ['Preço Médio', `R$ ${mkt.stats.precoMedio}/tCO₂`],
          ].map(([l, v]) => (
            <div key={l} className="zd-stat-card rounded-xl p-4">
              <div className="font-heading text-xl font-bold">{v}</div>
              <div className="text-[11px] text-white/50">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${aba === a.id ? 'zd-gradient-btn' : 'border border-white/15 text-white/55 hover:border-white/35'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
      {pedido && (
        <div className="zd-notification rounded-xl p-4 text-sm space-y-2">
          <div>✅ Pedido <b>{pedido.id}</b>: {pedido.toneladas} tCO₂ de "{pedido.item}"–<b className="zd-green">{fmtBRL(pedido.valorTotal)}</b> via {pedido.metodo.toUpperCase()}</div>
          {pedido.pixCode && (
            <div className="bg-black/40 rounded-lg p-3 font-mono text-[10px] break-all text-white/60">
              PIX copia-e-cola (demo): {pedido.pixCode}
            </div>
          )}
          <div className="text-white/45 text-xs">Após o pagamento, os créditos são aposentados em registro público e o certificado com serial fica disponível.</div>
        </div>
      )}

      {aba === 'passivo' && <CalculadoraPassivo />}

      {aba === 'sequestro' && (
        <div className="space-y-5">
          <form onSubmit={calcularSequestro} className="zd-card-glow rounded-2xl p-6">
            <h2 className="font-heading font-bold">Calculadora de Sequestro de Carbono</h2>
            <p className="text-xs text-white/50 mt-1 mb-4">Quanto sua área pode GERAR de créditos, para produtores, cooperativas e projetos de restauração.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-white/55 block mb-1">Área (hectares)</label>
                <input type="number" min="0" step="any" required className="zd-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex.: 50" value={seq.areaHa} onChange={e => setSeq(s => ({ ...s, areaHa: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] text-white/55 block mb-1">Bioma</label>
                <select className="zd-input w-full rounded-lg px-3 py-2 text-sm" value={seq.bioma} onChange={e => setSeq(s => ({ ...s, bioma: e.target.value }))}>
                  {mkt && Object.entries(mkt.biomas).map(([k, b]) => <option key={k} value={k}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/55 block mb-1">Tipo de projeto</label>
                <select className="zd-input w-full rounded-lg px-3 py-2 text-sm" value={seq.tipo} onChange={e => setSeq(s => ({ ...s, tipo: e.target.value }))}>
                  {mkt && Object.entries(mkt.tipos).map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/55 block mb-1">Duração (anos)</label>
                <input type="number" min="1" max="40" className="zd-input w-full rounded-lg px-3 py-2 text-sm"
                  value={seq.duracaoAnos} onChange={e => setSeq(s => ({ ...s, duracaoAnos: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] text-white/55 block mb-1">Preço (R$/tCO₂)</label>
                <input type="number" min="10" className="zd-input w-full rounded-lg px-3 py-2 text-sm"
                  value={seq.precoPorTon} onChange={e => setSeq(s => ({ ...s, precoPorTon: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="zd-gradient-btn rounded-xl px-6 py-3 text-sm mt-4">🌳 Calcular potencial</button>
          </form>

          {seqResultado && (
            <div className="zd-card-glow rounded-2xl p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Sequestro anual', `${seqResultado.tco2PorAno} tCO₂/ano`],
                  ['Total no período', `${seqResultado.tco2Total} tCO₂`],
                  ['Receita anual estimada', fmtBRL(seqResultado.receitaAnualEstimada)],
                  ['Receita total estimada', fmtBRL(seqResultado.receitaTotalEstimada)],
                ].map(([l, v]) => (
                  <div key={l} className="zd-stat-card rounded-xl p-4">
                    <div className="text-[10px] text-white/45 font-bold uppercase">{l}</div>
                    <div className="font-heading text-lg font-bold zd-green mt-1">{v}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/55 mt-4">≈ 🌳 {seqResultado.arvoresEquivalentes.toLocaleString('pt-BR')} árvores equivalentes por ano · {seqResultado.entrada.bioma} · {seqResultado.entrada.tipo}</div>
              <div className="mt-3 space-y-1">
                {seqResultado.avisos.map((a, i) => <p key={i} className="text-[11px] text-white/35">ℹ️ {a}</p>)}
              </div>
              <div className="zd-notification rounded-xl p-3.5 mt-4 text-sm">
                💡 Quer listar seus créditos no CarbonPay? Auditoria MRV integrada e certificação digital automática: fale com o Zoom Intelligence.
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'marketplace' && mkt && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mkt.itens.map(item => (
            <div key={item.id} className="zd-agent-card rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="zd-tag rounded-full px-2.5 py-1">{item.categoria}</span>
                {item.verificado && <span className="text-[10px] zd-green" title="Verificação em registro público">✓ verificado</span>}
              </div>
              <div className="font-heading font-bold mt-3">{item.nome}</div>
              <div className="text-[11px] text-white/45">{item.padrao}{item.bioma ? ` · ${item.bioma}` : ''}</div>
              <p className="text-xs text-white/55 mt-2 flex-1">{item.descricao}</p>
              {item.tons ? (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[11px] text-white/45">{item.tons.toLocaleString('pt-BR')} tCO₂ disponíveis</div>
                      <div className="font-heading text-lg font-bold zd-green">R$ {item.precoPorTon}/tCO₂</div>
                    </div>
                    <button onClick={() => setCompra({ item, toneladas: 1, metodo: 'pix' })} className="zd-gradient-btn rounded-lg px-4 py-2 text-sm">Comprar</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/45">Serviço sob consulta: fale com o Zoom Intelligence</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de compra: clone do CarbonPurchaseModal */}
      {compra && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setCompra(null)}>
          <div className="zd-card-glow rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold">{compra.item.nome}</h3>
            <div className="text-xs text-white/45 mt-0.5">{compra.item.padrao} · R$ {compra.item.precoPorTon}/tCO₂</div>
            <label className="text-[11px] text-white/55 block mt-4 mb-1">Quantidade (tCO₂)</label>
            <input type="number" min="0.1" step="0.1" className="zd-input w-full rounded-lg px-3 py-2.5 text-sm"
              value={compra.toneladas} onChange={e => setCompra(c => ({ ...c, toneladas: e.target.value }))} />
            <label className="text-[11px] text-white/55 block mt-4 mb-2">Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {[['pix', '⚡ PIX'], ['cartao', '💳 Cartão']].map(([m, l]) => (
                <button key={m} onClick={() => setCompra(c => ({ ...c, metodo: m }))}
                  className={`rounded-lg border py-2.5 text-sm font-semibold transition-all ${compra.metodo === m ? 'border-[#00ff64] bg-[#00ff6414]' : 'border-white/15 text-white/55'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-5 text-sm">
              <span className="text-white/50">Total</span>
              <span className="font-heading font-bold zd-green text-lg">{fmtBRL((Number(compra.toneladas) || 0) * compra.item.precoPorTon)}</span>
            </div>
            <button onClick={confirmarCompra} className="zd-gradient-btn w-full rounded-xl py-3 text-sm mt-4">Confirmar compra 🍃</button>
            <button onClick={() => setCompra(null)} className="w-full text-white/40 hover:text-white/70 text-xs mt-3 transition-colors">cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
