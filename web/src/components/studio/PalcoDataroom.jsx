import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { Anel, Botao, Etiqueta, Painel, Rotulo } from '../hud/index.jsx';
import { api, baixarMvpZip, baixarPlano } from '../../lib/api.js';
import { MolduraPalco } from './Palco.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO DA ESCALA — o dataroom.
//
// Quando alguém pede "manda o material", o fundador costuma gastar três dias
// juntando arquivo espalhado. Aqui o material já existe: o plano, o produto,
// os números e o parecer do conselho, no mesmo lugar e no mesmo formato.
//
// O índice de prontidão não é nota de escola. Cada item que falta é uma
// pergunta que o investidor vai fazer e que hoje ficaria sem resposta.
// ═══════════════════════════════════════════════════════════════════════════

export default function PalcoDataroom({ projeto, fase, onAtualizar, onAviso }) {
  const [conselhos, setConselhos] = useState([]);
  const [ocupado, setOcupado] = useState(null);

  useEffect(() => {
    api.conselhos(projeto.id).then(r => setConselhos(r.conselhos || r || [])).catch(() => {});
  }, [projeto?.id]);

  const itens = useMemo(() => checklist(projeto, conselhos), [projeto, conselhos]);
  const prontos = itens.filter(i => i.ok).length;
  const pct = Math.round((prontos / itens.length) * 100);

  const convocar = async () => {
    setOcupado('conselho');
    try {
      const r = await api.realizarConselho(projeto.id);
      setConselhos(c => [r.conselho || r, ...c]);
      await onAtualizar?.();
    } catch (e) { onAviso?.(e.message); } finally { setOcupado(null); }
  };

  const baixar = async (fn, rotulo) => {
    setOcupado(rotulo);
    try { await fn(); } catch (e) { onAviso?.(e.message); } finally { setOcupado(null); }
  };

  const ultimo = conselhos[0];

  return (
    <MolduraPalco rotulo="Escala" titulo="Dataroom do investidor" cor={fase?.cor}>
      <div className="p-4 space-y-4">
        {/* Prontidão */}
        <Painel tamanho="p" className="p-4">
          <div className="flex items-center gap-5 flex-wrap">
            <Anel valor={pct} cor={pct >= 80 ? '#00ff64' : pct >= 50 ? '#ffc531' : '#ff4d8d'} tam={78}>
              <span className="hud-tec text-[17px] font-bold">{pct}%</span>
            </Anel>
            <div className="min-w-0 flex-1">
              <Rotulo cor={fase?.cor}>prontidão para investidor</Rotulo>
              <p className="text-[12px] text-white/55 leading-relaxed mt-1.5">
                {pct >= 80
                  ? 'O material responde às perguntas de primeira reunião. O que falta agora é conversa, não documento.'
                  : `Faltam ${itens.length - prontos} itens. Cada um deles é uma pergunta que hoje ficaria sem resposta.`}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {itens.map(i => (
              <div key={i.id} className="flex items-start gap-2.5 py-1">
                <Icon nome={i.ok ? 'check' : 'fechar'} tam={13}
                  className={`shrink-0 mt-0.5 ${i.ok ? 'text-[#00ff64]' : 'text-white/22'}`} />
                <div className="min-w-0 flex-1">
                  <span className={`text-[12px] ${i.ok ? 'text-white/70' : 'text-white/40'}`}>{i.label}</span>
                  {!i.ok && i.porque && (
                    <div className="text-[10.5px] text-white/32 mt-0.5">{i.porque}</div>
                  )}
                </div>
                {i.ok && i.detalhe && <span className="hud-tec text-[9px] text-white/28 shrink-0">{i.detalhe}</span>}
              </div>
            ))}
          </div>
        </Painel>

        {/* Documentos */}
        <div>
          <Rotulo cor="#00e5ff">material para enviar</Rotulo>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            <Documento
              icone="documento" titulo="Plano de negócios" formato="DOCX"
              disponivel={Boolean(projeto?.plano)}
              ocupado={ocupado === 'docx'}
              onBaixar={() => baixar(() => baixarPlano(projeto.id, 'docx', projeto.nome), 'docx')} />
            <Documento
              icone="documento" titulo="Plano de negócios" formato="PDF"
              disponivel={Boolean(projeto?.plano)}
              ocupado={ocupado === 'pdf'}
              onBaixar={() => baixar(() => baixarPlano(projeto.id, 'pdf', projeto.nome), 'pdf')} />
            <Documento
              icone="cubo" titulo="Código do MVP" formato="ZIP"
              disponivel={projeto?.mvp?.status === 'pronto' || Boolean(projeto?.mvp?.arquivos?.length)}
              ocupado={ocupado === 'zip'}
              onBaixar={() => baixar(() => baixarMvpZip(projeto.id), 'zip')} />
            <Documento
              icone="vitrine" titulo="Vitrine pública" formato="LINK"
              disponivel={Boolean(projeto?.publicado)}
              rotuloAcao="Ver"
              onBaixar={() => window.open('/', '_blank')} />
          </div>
        </div>

        {/* Conselho dos agentes */}
        <Painel cor="#ff4d8d" tamanho="p" className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Icon nome="usuarios" tam={17} className="text-[#ff4d8d]" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold">Conselho dos Agentes</div>
              <div className="text-[11px] text-white/45 mt-0.5">
                O elenco inteiro lê o projeto e emite um parecer com voto. É o ensaio da reunião difícil.
              </div>
            </div>
            <Botao onClick={convocar} disabled={ocupado === 'conselho' || !projeto?.plano}
              className="px-3.5 py-1.5 text-[11px]">
              {ocupado === 'conselho'
                ? <Icon nome="atualizar" tam={13} className="animate-spin" />
                : <><Icon nome="raio" tam={13} /> Convocar</>}
            </Botao>
          </div>

          {ultimo && (
            <div className="mt-3.5 pt-3.5 border-t border-white/8">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Etiqueta cor={corVeredito(ultimo.veredito)}>{ultimo.veredito || 'parecer'}</Etiqueta>
                {ultimo.placar && (
                  <span className="hud-tec text-[10px] text-white/40">
                    {ultimo.placar.aprovam ?? 0} a favor · {ultimo.placar.ressalvas ?? 0} com ressalva · {ultimo.placar.contra ?? 0} contra
                  </span>
                )}
                <span className="hud-tec text-[9px] text-white/25 ml-auto">
                  {ultimo.realizadoEm ? new Date(ultimo.realizadoEm).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              {ultimo.sintese && (
                <p className="text-[12px] text-white/62 leading-relaxed">{ultimo.sintese}</p>
              )}
            </div>
          )}
        </Painel>
      </div>
    </MolduraPalco>
  );
}

function Documento({ icone, titulo, formato, disponivel, ocupado, rotuloAcao = 'Baixar', onBaixar }) {
  return (
    <div className={`hud-corte p-3 flex items-center gap-3 ${disponivel ? '' : 'opacity-45'}`}
      style={{ '--c': '6px', background: '#00e5ff0a', boxShadow: 'inset 0 0 0 1px #00e5ff26' }}>
      <Icon nome={icone} tam={16} className="text-[color:var(--zd-acento)] shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-bold truncate">
          {titulo} <span className="hud-tec text-[9px] text-white/35">{formato}</span>
        </div>
        <div className="hud-tec text-[8.5px] text-white/30">
          {disponivel ? 'pronto para enviar' : 'ainda não existe'}
        </div>
      </div>
      <Botao variante="vazio" disabled={!disponivel || ocupado} onClick={onBaixar}
        className="px-2.5 py-1 text-[10px] shrink-0">
        {ocupado ? <Icon nome="atualizar" tam={11} className="animate-spin" />
                 : <><Icon nome="download" tam={11} /> {rotuloAcao}</>}
      </Botao>
    </div>
  );
}

const corVeredito = (v = '') => {
  const s = String(v).toLowerCase();
  if (s.includes('aprov')) return '#00ff64';
  if (s.includes('ressalva') || s.includes('condic')) return '#ffc531';
  if (s.includes('reprov') || s.includes('contra')) return '#ff4d8d';
  return '#00e5ff';
};

// ── O que um investidor pergunta na primeira reunião ──────────────────────
function checklist(projeto, conselhos) {
  const m = projeto?.metricas || {};
  const temMetrica = ['receitaMensal', 'clientes', 'cac', 'churnMensal'].some(k => Number(m[k]) > 0);
  const missoes = projeto?.missoes || [];
  const validou = missoes.length > 0 && missoes.filter(x => x.tipo === 'principal').every(x => x.concluida);

  return [
    { id: 'plano', label: 'Plano de negócios completo', ok: Boolean(projeto?.plano),
      detalhe: projeto?.plano ? 'gerado' : '',
      porque: 'Sem ele não há tese escrita: mercado, modelo, concorrência e projeção ficam na cabeça do fundador.' },
    { id: 'validacao', label: 'Hipóteses testadas com gente real', ok: validou,
      detalhe: validou ? `${missoes.filter(x => x.concluida).length} missões` : '',
      porque: 'Conclua as missões principais da fase de validação. Investidor pergunta com quem você falou.' },
    { id: 'mvp', label: 'Produto navegável', ok: Boolean(projeto?.mvp?.arquivos?.length || projeto?.mvp?.status === 'pronto'),
      porque: 'Construa o MVP no Estúdio. Demonstração vale mais que descrição.' },
    { id: 'metricas', label: 'Métricas de unidade preenchidas', ok: temMetrica,
      porque: 'Receita, clientes, CAC e cancelamento. Sem eles não há como calcular LTV nem payback.' },
    { id: 'caixa', label: 'Pista de caixa conhecida', ok: Number(m.caixa) > 0 && Number(m.queimaMensal) > 0,
      porque: 'Quanto há em caixa e quanto sai por mês. É a primeira conta que se faz do outro lado da mesa.' },
    { id: 'impacto', label: 'Impacto e ODS documentados', ok: Boolean(projeto?.plano?.impacto?.ods?.length),
      porque: 'Sai junto com o plano. Fundos de impacto e editais pedem antes de qualquer outra coisa.' },
    { id: 'conselho', label: 'Parecer do Conselho dos Agentes', ok: conselhos.length > 0,
      detalhe: conselhos.length ? `${conselhos.length} parecer${conselhos.length > 1 ? 'es' : ''}` : '',
      porque: 'Convoque o conselho aqui embaixo. Melhor levar a crítica dura antes da reunião do que durante.' },
    { id: 'vitrine', label: 'Projeto publicado na comunidade', ok: Boolean(projeto?.publicado),
      porque: 'Publicar gera prova social e tráfego. O acervo interno continua fora do ar público.' },
  ];
}
