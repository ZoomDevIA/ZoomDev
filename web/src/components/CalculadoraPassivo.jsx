import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

// Calculadora de passivo ambiental (GHG Protocol) — extraída da antiga página Carbono
const CAMPOS = [
  { grupo: 'Energia e combustíveis (Escopos 1 e 2)', itens: [
    ['energiaKwhMes', 'Energia elétrica (kWh/mês)', 'Ex.: 350'],
    ['gasolinaLitrosMes', 'Gasolina (litros/mês)', 'Ex.: 120'],
    ['dieselLitrosMes', 'Diesel (litros/mês)', 'Ex.: 0'],
    ['etanolLitrosMes', 'Etanol (litros/mês)', 'Ex.: 0'],
    ['glpBotijoesMes', 'Botijões de gás 13kg (mês)', 'Ex.: 1'],
  ]},
  { grupo: 'Viagens e frete (Escopo 3)', itens: [
    ['vooDomesticoHorasAno', 'Voos domésticos (horas/ano)', 'Ex.: 10'],
    ['vooInternacionalHorasAno', 'Voos internacionais (horas/ano)', 'Ex.: 0'],
    ['carroAppKmMes', 'Carro/app (km/mês)', 'Ex.: 300'],
    ['freteTonKmMes', 'Frete rodoviário (ton·km/mês)', 'Ex.: 0'],
  ]},
  { grupo: 'Time e operação digital (Escopo 3)', itens: [
    ['funcionariosEscritorio', 'Pessoas em escritório', 'Ex.: 3'],
    ['funcionariosRemotos', 'Pessoas remotas', 'Ex.: 2'],
    ['gastoNuvemReaisMes', 'Gasto com nuvem/SaaS (R$/mês)', 'Ex.: 500'],
  ]},
];

const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function CalculadoraPassivo() {
  const { celebrar, refreshUser } = useUser();
  const [dados, setDados] = useState({});
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [compensando, setCompensando] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState(null);

  const set = (k) => (e) => setDados(d => ({ ...d, [k]: e.target.value }));

  const calcular = async (e) => {
    e.preventDefault();
    setCalculando(true);
    setErro(null);
    setPedido(null);
    try {
      const r = await api.carbonCalcular(dados);
      setResultado(r.resultado);
      celebrar(r.gamificacao);
      await refreshUser();
    } catch (err) { setErro(err.message); }
    setCalculando(false);
  };

  const compensar = async (projetoId) => {
    setCompensando(projetoId);
    setErro(null);
    try {
      const r = await api.carbonCompensar({ projetoId, toneladas: resultado.tonParaCompensar });
      setPedido(r.pedido);
      celebrar(r.gamificacao);
      await refreshUser();
    } catch (err) { setErro(err.message); }
    setCompensando(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={calcular} className="zd-card-glow rounded-2xl p-6 space-y-6">
        {CAMPOS.map(g => (
          <div key={g.grupo}>
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">{g.grupo}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.itens.map(([k, label, ph]) => (
                <div key={k}>
                  <label className="text-[11px] text-white/55 block mb-1">{label}</label>
                  <input type="number" min="0" step="any" className="zd-input w-full rounded-lg px-3 py-2 text-sm"
                    placeholder={ph} value={dados[k] ?? ''} onChange={set(k)} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
        <button type="submit" disabled={calculando} className="zd-gradient-btn rounded-xl px-6 py-3 text-sm">
          {calculando ? 'Calculando…' : '⚡ Calcular passivo ambiental'}
        </button>
        <p className="text-[11px] text-white/35">Deixe em branco o que não se aplica — comece só com conta de luz + combustível. Você refina depois.</p>
      </form>

      {resultado && (
        <>
          <section className="zd-card-glow rounded-2xl p-6">
            <div className="flex flex-wrap items-end gap-6 justify-between">
              <div>
                <div className="text-xs text-white/45 uppercase tracking-wider font-bold">Pegada anual estimada</div>
                <div className="font-heading text-4xl font-bold zd-gradient-text mt-1">{resultado.totalTco2eAno} tCO2e</div>
                <div className="text-xs text-white/45 mt-1">{resultado.metodologia}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/45">Recomendação de compensação (margem 20%)</div>
                <div className="font-heading text-2xl font-bold zd-green">{resultado.tonParaCompensar} tCO2e</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              {Object.entries(resultado.escopos).map(([k, e], i) => (
                <div key={k} className="zd-stat-card rounded-xl p-4">
                  <div className="text-[10px] text-white/45 font-bold uppercase">Escopo {i + 1}</div>
                  <div className="font-heading text-xl font-bold mt-0.5">{e.tco2e} <span className="text-xs text-white/45 font-normal">tCO2e</span></div>
                  <div className="text-[11px] text-white/50 mt-1">{e.descricao}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-5 text-xs text-white/55">
              <span>≈ ✈️ {resultado.equivalencias.voosSpNy} voos SP–NY</span>
              <span>≈ 🌳 {resultado.equivalencias.arvoresPorAno} árvores absorvendo por 1 ano</span>
              <span>≈ 🚗 {resultado.equivalencias.kmDeCarro.toLocaleString('pt-BR')} km de carro</span>
            </div>

            <div className="mt-4 space-y-1">
              {resultado.avisos.map((a, i) => <p key={i} className="text-[11px] text-white/35">ℹ️ {a}</p>)}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold mb-1">💚 Compense com créditos verificados</h2>
            <p className="text-xs text-white/45 mb-4">
              Aposentadoria em registro público (Verra/Gold Standard) e certificado rastreável em seu nome.
            </p>
            {pedido && (
              <div className="zd-notification rounded-xl p-4 mb-4 text-sm">
                ✅ Pedido <b>{pedido.id}</b> registrado: {pedido.toneladas} tCO2e em "{pedido.projeto}" — {fmtBRL(pedido.valorTotal)}.
                <span className="text-white/50"> Após o pagamento, os créditos são aposentados e você recebe o certificado público.</span>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              {resultado.opcoesCompensacao.map(p => (
                <div key={p.id} className="zd-agent-card rounded-2xl p-5 flex flex-col">
                  <div className="zd-tag rounded-full px-2.5 py-1 self-start">{p.tipo}</div>
                  <div className="font-heading font-bold mt-3">{p.nome}</div>
                  <div className="text-[11px] text-white/45">{p.padrao} · {p.local}</div>
                  <p className="text-xs text-white/55 mt-2 flex-1">{p.descricao}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.cobeneficios.map(c => <span key={c} className="zd-tag-blue rounded px-1.5 py-0.5">{c}</span>)}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs text-white/45">R$ {p.precoPorTon}/tCO2e · {resultado.tonParaCompensar} t</div>
                    <div className="font-heading text-xl font-bold zd-green">{fmtBRL(p.custoTotal)}</div>
                    <button onClick={() => compensar(p.id)} disabled={compensando}
                      className="zd-gradient-btn w-full rounded-lg py-2.5 text-sm mt-2.5">
                      {compensando === p.id ? 'Registrando…' : '🍃 Compensar agora'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
