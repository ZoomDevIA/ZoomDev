import React, { useState } from 'react';
import Icon from '../Icon.jsx';
import { Botao, Etiqueta } from '../hud/index.jsx';
import { useUser } from '../../App.jsx';
import ZoomDoc from '../zoomdoc/ZoomDoc.jsx';
import PedidoLocal from './PedidoLocal.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO DA IDEAÇÃO — o plano de negócios sendo escrito.
//
// Aqui o palco é o ZoomDoc inteiro, sem moldura de painel em volta: a folha
// precisa do espaço todo. O cabeçalho da fase vira a barra do editor, que já
// carrega as ações do documento.
//
// Antes de existir documento, o palco não fica em branco: mostra o que a
// geração vai fazer e o botão que a dispara. Tela vazia sem explicação é o
// jeito mais rápido de perder alguém no primeiro minuto.
// ═══════════════════════════════════════════════════════════════════════════

export default function PalcoDocumento({
  projeto, documento, onDocumento, salvandoEm,
  gerando = false, onGerar, progresso = null,
}) {
  const { user, refreshUser } = useUser() || {};
  const [localRespondido, setLocalRespondido] = useState(false);
  // Perguntado uma vez só: quem já informou ou já recusou não é interrogado
  // de novo a cada plano novo.
  const precisaLocal = !localRespondido && !user?.local;

  if (gerando) return <EmGeracao progresso={progresso} projeto={projeto} />;

  if (!documento) {
    return (
      <div className="hud-painel hud-p flex flex-col h-full overflow-hidden">
        <div className="h-full overflow-y-auto flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center">
              <Icon nome="documento" tam={34} className="text-[color:var(--zd-acento)] mx-auto mb-3.5 opacity-70" />
              <h3 className="font-heading font-bold text-[15px]">Seu plano de negócios ainda não existe</h3>
              <p className="text-[13px] text-white/45 mt-2 leading-relaxed">
                Os agentes pesquisam o mercado na internet, consideram o seu território e escrevem
                as quatorze seções da metodologia ZoomDev. Você recebe um documento editável, não um resumo.
              </p>
            </div>

            {precisaLocal
              ? <PedidoLocal onPronto={async () => { setLocalRespondido(true); await refreshUser?.(); }} />
              : (
                <div className="text-center">
                  <Botao onClick={onGerar} className="px-5 py-2.5">
                    <Icon nome="raio" tam={15} /> Gerar o plano
                  </Botao>
                  {user?.local?.cidade && (
                    <div className="hud-tec text-[9px] text-white/28 mt-2.5">
                      território: {[user.local.cidade, user.local.uf].filter(Boolean).join('/')}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-painel hud-p flex flex-col h-full overflow-hidden">
      <ZoomDoc
        conteudo={documento}
        aoMudar={onDocumento}
        titulo={projeto?.nome || 'Plano de Negócios'}
        subtitulo={legenda(projeto)}
        salvandoEm={salvandoEm}
        acoes={
          <Botao variante="vazio" onClick={onGerar} className="px-2.5 py-1 text-[10px]"
            title="Regerar o plano do zero (o texto atual é substituído)">
            <Icon nome="atualizar" tam={12} /> Regerar
          </Botao>
        }
      />
    </div>
  );
}

function legenda(projeto) {
  if (!projeto) return '';
  const partes = [
    projeto.classificacao === 'biostartup' ? 'BioStartup' : 'Startup',
    projeto.vertical,
    projeto.planoZoomDev?.local?.cidade && `${projeto.planoZoomDev.local.cidade}/${projeto.planoZoomDev.local.uf || ''}`,
  ].filter(Boolean);
  return `${partes.join(' · ')} — Plano de Negócios pela metodologia ZoomDev`;
}

// ── Geração em andamento ──────────────────────────────────────────────────
// O documento leva minutos para nascer. Mostrar as etapas com o que cada
// agente está fazendo é o que separa espera de travamento.
function EmGeracao({ progresso, projeto }) {
  const etapas = progresso?.etapas || [];
  const feitas = etapas.filter(e => e.estado === 'ok').length;
  const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0;

  return (
    <div className="hud-painel hud-p flex flex-col h-full overflow-hidden palco-varredura">
      <div className="px-4 py-3 border-b border-[#00e5ff1f] flex items-center gap-3 shrink-0">
        <Icon nome="documento" tam={16} className="text-[color:var(--zd-acento)]" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold truncate">Escrevendo o plano de {projeto?.nome}</div>
          <div className="hud-tec text-[9px] text-white/35">
            {progresso?.fonte ? `CONSULTANDO ${progresso.fonte}` : 'AGENTES EM CAMPO'}
          </div>
        </div>
        <span className="hud-tec text-[13px] text-[color:var(--zd-acento)] shrink-0">{pct}%</span>
      </div>

      <div className="h-[3px] bg-[#00e5ff14] shrink-0">
        <div className="h-full bg-[#00e5ff] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {etapas.map((e, i) => (
          <div key={e.id || i} className="flex items-start gap-2.5">
            <span className="w-4 shrink-0 flex justify-center pt-0.5">
              {e.estado === 'ok' ? <Icon nome="check" tam={12} className="text-[#00ff64]" />
                : e.estado === 'erro' ? <Icon nome="alerta" tam={12} className="text-[#ff4d8d]" />
                : e.estado === 'executando' ? <Icon nome="atualizar" tam={12} className="text-[#ffc531] animate-spin" />
                : <span className="block w-1.5 h-1.5 bg-white/15 mt-1" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[12.5px] ${e.estado === 'ok' ? 'text-white/45' : 'text-white/85'}`}>
                {e.label}
              </div>
              {e.detalhe && <div className="text-[10.5px] text-white/35 mt-0.5">{e.detalhe}</div>}
            </div>
            {e.selo && <Etiqueta cor="#00e5ff">{e.selo}</Etiqueta>}
          </div>
        ))}

        {progresso?.previa && (
          <div className="mt-4 pt-3 border-t border-white/8">
            <div className="hud-caps text-[9px] text-white/30 mb-2">prévia do que está sendo escrito</div>
            <div className="text-[12px] text-white/50 leading-relaxed cursor-agente whitespace-pre-wrap">
              {progresso.previa}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
