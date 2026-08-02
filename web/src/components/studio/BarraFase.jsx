import React from 'react';
import Icon from '../Icon.jsx';
import { Etiqueta } from '../hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// BARRA DE FASE — a trilha da jornada, sempre visível no topo do Studio.
//
// Cada fase é um chevron que se encaixa no seguinte. Concluída fica verde
// apagado, a atual acende na cor da fase, as futuras ficam escuras. Não é
// enfeite: é o mapa de onde a pessoa está e quanto falta, e clicar numa fase
// já vencida volta para ela.
// ═══════════════════════════════════════════════════════════════════════════

export const FASES = [
  { id: 'ideacao', label: 'Ideação', icone: 'raio', cor: '#00e5ff', palco: 'Documento',
    resumo: 'Sua ideia vira plano de negócios' },
  { id: 'validacao', label: 'Validação', icone: 'alvo', cor: '#a855f7', palco: 'Missões',
    resumo: 'Converse com quem tem o problema' },
  { id: 'mvp', label: 'MVP', icone: 'cubo', cor: '#00ff64', palco: 'Estúdio',
    resumo: 'O produto navegável, com código de verdade' },
  { id: 'tracao', label: 'Tração', icone: 'grafico', cor: '#ffc531', palco: 'Métricas',
    resumo: 'Os números que provam que funciona' },
  { id: 'escala', label: 'Escala', icone: 'foguete', cor: '#ff4d8d', palco: 'Dataroom',
    resumo: 'Pronto para investidor e para o mundo' },
];

export const faseDe = (id) => FASES.find(f => f.id === id) || FASES[0];

// `vista` é a fase que a pessoa está OLHANDO; `projeto.fase` é onde o projeto
// realmente está. Separar as duas importa: voltar para ler a ideação não pode
// trancar as fases que já foram vencidas, e era exatamente isso que acontecia
// quando a fase visitada era usada como se fosse a fase atual.
export default function BarraFase({ projeto, vista, onIr }) {
  const atual = projeto?.fase || 'ideacao';
  const olhando = vista || atual;
  const concluidas = projeto?.fasesConcluidas || [];
  const info = faseDe(olhando);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex items-center gap-2.5">
          <Icon nome={info.icone} tam={17} style={{ color: info.cor }} />
          <h1 className="font-heading font-bold text-[15px] md:text-lg truncate">{projeto?.nome}</h1>
          <Etiqueta cor={projeto?.classificacao === 'biostartup' ? '#00ff64' : '#00c8ff'}>
            {projeto?.classificacao === 'biostartup' ? 'BioStartup' : 'Startup'}
          </Etiqueta>
        </div>
        <div className="hud-tec text-[10px] text-white/35 shrink-0">{info.resumo}</div>
      </div>

      <div className="fase-trilha" role="list">
        {FASES.map(f => {
          const feita = concluidas.includes(f.id);
          const alcancavel = feita || f.id === atual;
          const eAtual = f.id === olhando;
          return (
            <button
              key={f.id}
              role="listitem"
              disabled={!alcancavel}
              onClick={() => alcancavel && onIr?.(f.id)}
              title={alcancavel ? f.resumo : 'Conclua as fases anteriores'}
              className={`fase-passo ${feita && !eAtual ? 'concluida' : ''} ${eAtual ? 'atual' : ''} ${
                alcancavel ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{ '--cor': f.cor }}
            >
              <span className="flex items-center justify-center gap-1.5">
                {feita && <Icon nome="check" tam={11} />}
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
