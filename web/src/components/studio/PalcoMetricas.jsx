import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { Barra, Botao, Estatistica, Painel, Rotulo } from '../hud/index.jsx';
import { api } from '../../lib/api.js';
import { MolduraPalco } from './Palco.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO DA TRAÇÃO — os números que separam intenção de evidência.
//
// Só cinco entradas, e de propósito: receita, clientes, custo de aquisição,
// churn e caixa. Delas saem LTV, payback, margem de contribuição e meses de
// pista, que são as contas que um investidor faz na primeira reunião e que a
// maioria dos fundadores só descobre na terceira.
//
// A projeção do plano fica lado a lado com o realizado. Um plano que ninguém
// confere vira ficção em três meses.
// ═══════════════════════════════════════════════════════════════════════════

const ENTRADAS = [
  { id: 'receitaMensal', label: 'Receita mensal', prefixo: 'R$', dica: 'MRR do último mês fechado' },
  { id: 'clientes', label: 'Clientes ativos', dica: 'Quem pagou no último ciclo' },
  { id: 'cac', label: 'Custo de aquisição', prefixo: 'R$', dica: 'Tudo que se gastou para trazer um cliente' },
  { id: 'churnMensal', label: 'Cancelamento mensal', sufixo: '%', dica: 'Quantos por cento saem por mês' },
  { id: 'caixa', label: 'Caixa disponível', prefixo: 'R$', dica: 'Quanto há em conta hoje' },
  { id: 'queimaMensal', label: 'Queima mensal', prefixo: 'R$', dica: 'Custo total que sai por mês' },
];

const brl = (n) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

export default function PalcoMetricas({ projeto, fase, onAtualizar, onAviso }) {
  const [m, setM] = useState(() => ({ ...vazio(), ...(projeto?.metricas || {}) }));
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);

  useEffect(() => { setM({ ...vazio(), ...(projeto?.metricas || {}) }); setSujo(false); }, [projeto?.id]);

  const d = useMemo(() => derivar(m), [m]);
  const projecao = projeto?.plano?.negocio?.projecao12Meses || [];

  const salvar = async () => {
    setSalvando(true);
    try {
      await api.salvarMetricas(projeto.id, m);
      setSujo(false);
      await onAtualizar?.();
    } catch (e) { onAviso?.(e.message); } finally { setSalvando(false); }
  };

  const mudar = (id, v) => { setM(x => ({ ...x, [id]: v === '' ? '' : Number(v) })); setSujo(true); };

  return (
    <MolduraPalco
      rotulo="Tração"
      titulo="Métricas do negócio"
      cor={fase?.cor}
      acoes={sujo && (
        <Botao onClick={salvar} disabled={salvando} className="px-3 py-1 text-[10px]">
          {salvando ? <Icon nome="atualizar" tam={12} className="animate-spin" />
                    : <><Icon nome="check" tam={12} /> Salvar</>}
        </Botao>
      )}
    >
      <div className="p-4 space-y-4">
        {/* O que se preenche */}
        <div>
          <Rotulo cor={fase?.cor}>o que você mede</Rotulo>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 mt-2">
            {ENTRADAS.map(e => (
              <label key={e.id} className="block">
                <span className="hud-caps text-[8.5px] text-white/35 block mb-1" title={e.dica}>{e.label}</span>
                <div className="flex items-center hud-campo px-2 py-1.5 gap-1">
                  {e.prefixo && <span className="hud-tec text-[10px] text-white/30 shrink-0">{e.prefixo}</span>}
                  <input type="number" min="0" step="any" value={m[e.id] ?? ''}
                    onChange={(ev) => mudar(e.id, ev.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent outline-none text-[13px] hud-tec" />
                  {e.sufixo && <span className="hud-tec text-[10px] text-white/30 shrink-0">{e.sufixo}</span>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* O que o sistema calcula */}
        <div>
          <Rotulo cor="#00ff64">o que isso significa</Rotulo>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mt-2">
            {/* Estatistica recebe o ícone já montado, não o nome dele */}
            <Estatistica valor={d.ticket ? brl(d.ticket) : '—'} rotulo="Ticket médio"
              cor="#00e5ff" icone={<Icon nome="moeda" tam={15} />} />
            <Estatistica valor={d.ltv ? brl(d.ltv) : '—'} rotulo={`LTV${d.mesesVida ? ` · ${d.mesesVida} meses` : ''}`}
              cor="#00ff64" icone={<Icon nome="grafico" tam={15} />} />
            <Estatistica valor={d.razao ? `${d.razao}x` : '—'} rotulo="LTV sobre CAC"
              cor={d.razaoCor} icone={<Icon nome="balanca" tam={15} />} />
            <Estatistica valor={d.pista != null ? `${d.pista} meses` : '—'} rotulo="Pista de caixa"
              cor={d.pistaCor} icone={<Icon nome="chama" tam={15} />} />
          </div>
        </div>

        {/* Leituras */}
        {d.leituras.length > 0 && (
          <Painel tamanho="p" className="p-3.5 space-y-2">
            <Rotulo cor="#ffc531">leitura</Rotulo>
            {d.leituras.map((l, i) => (
              <div key={i} className="flex gap-2.5">
                <Icon nome={l.tipo === 'risco' ? 'alerta' : l.tipo === 'bom' ? 'check' : 'info'} tam={13}
                  className={`shrink-0 mt-0.5 ${
                    l.tipo === 'risco' ? 'text-[#ff4d8d]' : l.tipo === 'bom' ? 'text-[#00ff64]' : 'text-[#00e5ff]'}`} />
                <span className="text-[12px] text-white/65 leading-relaxed">{l.texto}</span>
              </div>
            ))}
          </Painel>
        )}

        {/* Plano contra realidade */}
        {projecao.length > 0 && (
          <div>
            <Rotulo cor="#a855f7">projeção do plano contra o realizado</Rotulo>
            <Grafico projecao={projecao} realizado={m.receitaMensal} cor={fase?.cor} />
          </div>
        )}
      </div>
    </MolduraPalco>
  );
}

function vazio() {
  return { receitaMensal: '', clientes: '', cac: '', churnMensal: '', caixa: '', queimaMensal: '' };
}

// ── As contas ─────────────────────────────────────────────────────────────
// Feitas no cliente de propósito: são aritmética simples e a pessoa precisa
// ver o número mudar enquanto digita, não depois de um ida e volta ao servidor.
function derivar(m) {
  const n = (v) => (v === '' || v == null ? 0 : Number(v));
  const receita = n(m.receitaMensal), clientes = n(m.clientes), cac = n(m.cac);
  const churn = n(m.churnMensal), caixa = n(m.caixa), queima = n(m.queimaMensal);

  const ticket = clientes > 0 ? receita / clientes : 0;
  // Tempo de vida = 1 / churn. Sem churn informado, não há LTV honesto a mostrar.
  const meses = churn > 0 ? 100 / churn : 0;
  const ltv = ticket && meses ? ticket * meses : 0;
  const razao = ltv && cac ? Math.round((ltv / cac) * 10) / 10 : 0;
  const pista = queima > 0 ? Math.floor(caixa / queima) : null;
  const payback = ticket && cac ? Math.ceil(cac / ticket) : null;

  const leituras = [];
  if (razao) {
    if (razao >= 3) leituras.push({ tipo: 'bom', texto: `Cada real investido em aquisição volta ${razao} vezes. Acima de 3 é a faixa que sustenta crescimento pago.` });
    else leituras.push({ tipo: 'risco', texto: `LTV sobre CAC em ${razao}x. Abaixo de 3 o crescimento pago consome caixa mais rápido do que devolve: corte aquisição ou aumente retenção antes de escalar.` });
  }
  if (payback != null) {
    leituras.push({
      tipo: payback <= 12 ? 'bom' : 'risco',
      texto: `O custo de trazer um cliente se paga em ${payback} ${payback === 1 ? 'mês' : 'meses'} de ticket.${payback > 12 ? ' Acima de doze meses, cada venda nova aperta o caixa antes de aliviar.' : ''}`,
    });
  }
  if (pista != null) {
    leituras.push({
      tipo: pista <= 6 ? 'risco' : pista <= 12 ? 'neutro' : 'bom',
      texto: `Com a queima atual, o caixa dura ${pista} ${pista === 1 ? 'mês' : 'meses'}.${pista <= 6 ? ' Rodada ou corte precisam começar agora, não quando acabar.' : ''}`,
    });
  }
  if (churn > 0 && churn >= 10) {
    leituras.push({ tipo: 'risco', texto: `Cancelamento de ${churn}% ao mês significa trocar a base inteira em menos de um ano. Retenção vem antes de aquisição.` });
  }
  if (!leituras.length) {
    leituras.push({ tipo: 'neutro', texto: 'Preencha receita, clientes, cancelamento e CAC para que as contas de unidade apareçam.' });
  }

  return {
    ticket: Math.round(ticket), ltv: Math.round(ltv), razao, pista, payback, leituras,
    mesesVida: meses ? Math.round(meses) : null,
    razaoCor: razao >= 3 ? '#00ff64' : razao ? '#ff4d8d' : '#9fb8ad',
    pistaCor: pista == null ? '#9fb8ad' : pista <= 6 ? '#ff4d8d' : pista <= 12 ? '#ffc531' : '#00ff64',
  };
}

// ── Gráfico de barras, sem biblioteca ─────────────────────────────────────
function Grafico({ projecao, realizado, cor = '#ffc531' }) {
  const max = Math.max(...projecao.map(p => p.receita || 0), Number(realizado) || 0, 1);
  return (
    <div className="mt-2">
      <div className="flex items-end gap-[3px] h-28">
        {projecao.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full group relative"
            title={`Mês ${p.mes}: ${brl(p.receita)} · ${p.clientes} clientes`}>
            <div className="w-full transition-[height]"
              style={{ height: `${((p.receita || 0) / max) * 100}%`, background: `${cor}55` }} />
          </div>
        ))}
      </div>
      {Number(realizado) > 0 && (
        <div className="relative">
          <div className="absolute -top-28 left-0 right-0 border-t border-dashed border-[#00ff64] pointer-events-none"
            style={{ top: `-${((Number(realizado) / max) * 112)}px` }}>
            <span className="absolute right-0 -top-4 hud-tec text-[8.5px] text-[#00ff64] bg-[#06140d] px-1">
              realizado {brl(realizado)}
            </span>
          </div>
        </div>
      )}
      <div className="flex justify-between hud-tec text-[8.5px] text-white/25 mt-1.5">
        <span>mês 1</span>
        <span>projeção do plano · pico {brl(max)}</span>
        <span>mês {projecao.length}</span>
      </div>
      <Barra valor={Math.min(100, (Number(realizado) / max) * 100)} cor="#00ff64" altura={5} className="mt-2" />
    </div>
  );
}
