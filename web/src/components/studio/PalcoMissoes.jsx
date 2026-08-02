import React, { useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { Barra, Botao, Etiqueta, Painel, Rotulo } from '../hud/index.jsx';
import { api } from '../../lib/api.js';
import { MolduraPalco, PalcoVazio } from './Palco.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO DA VALIDAÇÃO — sair do prédio, em forma de missão.
//
// O plano gerou hipóteses. Esta fase existe para confrontá-las com gente de
// verdade antes de qualquer linha de código. Duas vistas:
//
//   MISSÕES   o que fazer nesta semana, com XP e seiva ao concluir
//   HIPÓTESES o quadro do que o plano afirmou e ainda não foi testado
//
// A fase só avança quando as missões principais estão concluídas. Não é
// burocracia: é a diferença entre validar e fingir que validou.
// ═══════════════════════════════════════════════════════════════════════════

const VISTAS = [
  { id: 'missoes', label: 'Missões', icone: 'alvo' },
  { id: 'hipoteses', label: 'Hipóteses', icone: 'radar' },
];

export default function PalcoMissoes({ projeto, fase, onAtualizar, onAviso }) {
  const [vista, setVista] = useState('missoes');
  const [ocupada, setOcupada] = useState(null);

  const missoes = projeto?.missoes || [];
  const feitas = missoes.filter(m => m.concluida).length;
  const principais = missoes.filter(m => m.tipo === 'principal');
  const principaisFeitas = principais.filter(m => m.concluida).length;
  const podeAvancar = principais.length > 0 && principaisFeitas === principais.length;

  const concluir = async (m) => {
    setOcupada(m.id);
    try {
      await api.concluirMissao(projeto.id, m.id);
      await onAtualizar?.();
    } catch (e) { onAviso?.(e.message); } finally { setOcupada(null); }
  };

  const avancar = async () => {
    setOcupada('fase');
    try {
      await api.avancarFase(projeto.id);
      await onAtualizar?.();
    } catch (e) { onAviso?.(e.message); } finally { setOcupada(null); }
  };

  if (!missoes.length) {
    return (
      <MolduraPalco rotulo="Validação" titulo="Missões" cor={fase?.cor}>
        <PalcoVazio icone="alvo" titulo="Nenhuma missão ainda"
          texto="As missões nascem do plano de negócios. Gere o plano na fase de ideação e elas aparecem aqui, específicas para o seu projeto." />
      </MolduraPalco>
    );
  }

  return (
    <MolduraPalco
      rotulo="Validação"
      titulo={`${feitas} de ${missoes.length} missões concluídas`}
      cor={fase?.cor}
      acoes={
        <div className="flex items-center gap-1.5">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)}
              className={`hud-aba hud-caps px-2.5 py-1 text-[9px] flex items-center gap-1 ${vista === v.id ? 'ativa' : ''}`}>
              <Icon nome={v.icone} tam={11} /> {v.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <div>
          <Barra valor={(feitas / missoes.length) * 100} cor={fase?.cor} altura={7} />
          <div className="flex justify-between hud-tec text-[9px] text-white/32 mt-1.5">
            <span>{principaisFeitas}/{principais.length} principais</span>
            <span>{missoes.reduce((s, m) => s + (m.concluida ? m.xp || 0 : 0), 0)} XP ganhos</span>
          </div>
        </div>

        {vista === 'missoes' ? (
          <>
            {missoes.map(m => (
              <Missao key={m.id} m={m} cor={fase?.cor}
                ocupada={ocupada === m.id} onConcluir={() => concluir(m)} />
            ))}

            <Painel cor={podeAvancar ? '#00ff64' : '#ffffff1a'} tamanho="p" className="p-3.5">
              <div className="flex items-center gap-3 flex-wrap">
                <Icon nome={podeAvancar ? 'foguete' : 'cadeado'} tam={17}
                  className={podeAvancar ? 'text-[#00ff64]' : 'text-white/28'} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-bold">
                    {podeAvancar ? 'Validação concluída' : 'Fase de MVP bloqueada'}
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    {podeAvancar
                      ? 'As hipóteses foram para a rua. Agora dá para construir.'
                      : `Conclua as ${principais.length} missões principais para liberar o Estúdio.`}
                  </div>
                </div>
                <Botao disabled={!podeAvancar || ocupada === 'fase'} onClick={avancar}
                  className="px-3.5 py-1.5 text-[11px]">
                  {ocupada === 'fase'
                    ? <Icon nome="atualizar" tam={13} className="animate-spin" />
                    : <><Icon nome="setaDireita" tam={13} /> Avançar</>}
                </Botao>
              </div>
            </Painel>
          </>
        ) : (
          <Hipoteses projeto={projeto} />
        )}
      </div>
    </MolduraPalco>
  );
}

function Missao({ m, cor, ocupada, onConcluir }) {
  return (
    <Painel cor={m.concluida ? '#00ff6455' : cor} tamanho="p" className="p-3.5">
      <div className="flex gap-3">
        <button onClick={m.concluida ? undefined : onConcluir} disabled={m.concluida || ocupada}
          title={m.concluida ? 'Missão concluída' : 'Marcar como concluída'}
          className={`w-6 h-6 shrink-0 hud-corte flex items-center justify-center transition-colors ${
            m.concluida ? 'bg-[#00ff64] text-[#04140a]' : 'bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60'}`}
          style={{ '--c': '5px' }}>
          {ocupada ? <Icon nome="atualizar" tam={13} className="animate-spin" /> : <Icon nome="check" tam={14} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[12.5px] font-bold ${m.concluida ? 'text-white/40 line-through' : ''}`}>
              {m.titulo}
            </span>
            <Etiqueta cor={m.tipo === 'principal' ? '#ffc531' : '#9fb8ad'}>{m.tipo}</Etiqueta>
            {m.xp > 0 && <span className="hud-tec text-[9px] text-white/30">+{m.xp} XP</span>}
          </div>
          <p className={`text-[11.5px] leading-relaxed mt-1 ${m.concluida ? 'text-white/28' : 'text-white/55'}`}>
            {m.descricao}
          </p>
        </div>
      </div>
    </Painel>
  );
}

// ── Quadro de hipóteses ───────────────────────────────────────────────────
// Lê o próprio plano e devolve, em linguagem de teste, o que ele afirmou.
// Sem isso o fundador valida o que é confortável e não o que é arriscado.
function Hipoteses({ projeto }) {
  const itens = useMemo(() => derivarHipoteses(projeto?.plano), [projeto?.plano]);

  if (!itens.length) {
    return <PalcoVazio icone="radar" titulo="Sem hipóteses mapeadas"
      texto="Elas são extraídas do plano de negócios. Gere o plano primeiro." />;
  }

  return (
    <div className="space-y-2.5">
      <Rotulo cor="#a855f7">o que o plano afirmou e ainda não foi testado</Rotulo>
      {itens.map((h, i) => (
        <div key={i} className="hud-corte p-3" style={{ '--c': '6px', background: '#a855f70f', boxShadow: 'inset 0 0 0 1px #a855f733' }}>
          <div className="hud-caps text-[8.5px] text-[#a855f7] mb-1">{h.area}</div>
          <div className="text-[12px] leading-relaxed">{h.afirmacao}</div>
          <div className="text-[10.5px] text-white/38 mt-1.5 flex gap-1.5">
            <Icon nome="alvo" tam={11} className="shrink-0 mt-px text-[#a855f7]" />
            <span>{h.teste}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function derivarHipoteses(plano) {
  if (!plano) return [];
  const h = [];
  if (plano.produto?.problema) {
    h.push({
      area: 'Problema',
      afirmacao: plano.produto.problema,
      teste: 'Entreviste 5 pessoas do público-alvo sem citar sua solução. Elas descrevem esse problema espontaneamente?',
    });
  }
  if (plano.produto?.publicoAlvo) {
    h.push({
      area: 'Público',
      afirmacao: `O público que sente essa dor é: ${plano.produto.publicoAlvo}`,
      teste: 'Confirme se quem sente a dor é quem paga. Quando não é, o modelo de receita muda.',
    });
  }
  if (plano.negocio?.modeloDeNegocio) {
    h.push({
      area: 'Modelo de receita',
      afirmacao: plano.negocio.modeloDeNegocio,
      teste: 'Peça um compromisso: pré-venda, carta de intenção ou lista de espera paga. Elogio não é validação.',
    });
  }
  if (plano.negocio?.mercado?.som) {
    h.push({
      area: 'Mercado alcançável',
      afirmacao: `SOM estimado: ${plano.negocio.mercado.som}`,
      teste: 'Reconstrua o número de baixo para cima: clientes reais alcançáveis × ticket. Se não bater, o plano está otimista.',
    });
  }
  (plano.produto?.diferenciais || []).slice(0, 2).forEach(d => {
    h.push({
      area: 'Diferencial',
      afirmacao: d,
      teste: 'Pergunte a um cliente potencial se ele trocaria a solução atual por causa disso. Se hesitar, não é diferencial.',
    });
  });
  return h;
}
