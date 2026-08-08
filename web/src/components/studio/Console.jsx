import React, { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import AgentAvatar from '../AgentAvatar.jsx';
import { Painel, Etiqueta, Rotulo, Pulso } from '../hud/index.jsx';
import CaixaContexto from './CaixaContexto.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CONSOLE — a janela da esquerda: o que se diz e o que os agentes pensam.
//
// Três camadas empilhadas:
//   TRILHA     o histórico da conversa e das entregas dos agentes
//   RACIOCÍNIO o que está acontecendo agora, agente por agente
//   CAIXA      onde se escreve, anexa, dita e envia
//
// A trilha rola sozinha para o fim quando chega mensagem nova, mas só se a
// pessoa já estava no fim: quem subiu para reler algo não é arrastado de volta.
// ═══════════════════════════════════════════════════════════════════════════

export default function Console({
  projeto, mensagens = [], trabalhando = null, onEnviar,
  ocupado = false, erro = null, aviso = null,
}) {
  const fim = useRef(null);
  const trilha = useRef(null);
  const [colado, setColado] = useState(true);

  useEffect(() => {
    if (colado) fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, trabalhando, colado]);

  const aoRolar = () => {
    const el = trilha.current;
    if (!el) return;
    setColado(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  return (
    <Painel className="flex flex-col h-full overflow-hidden" tamanho="p">
      <div className="px-4 py-3 border-b border-[#00e5ff1f] flex items-center gap-2.5 shrink-0">
        <AgentAvatar agente="maia" size="w-8 h-8" centralizar={false} emojiSize="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold leading-tight">Console</div>
          <div className="hud-tec text-[9px] text-white/35">
            {trabalhando ? 'AGENTES EM CAMPO' : 'PRONTO'}
          </div>
        </div>
        <Pulso cor={trabalhando ? '#ffc531' : '#00ff64'} />
      </div>

      <div ref={trilha} onScroll={aoRolar} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {mensagens.length === 0 && !trabalhando && (
          <div className="text-center py-8">
            <Icon nome="raio" tam={26} className="text-[color:var(--zd-acento)] mx-auto mb-2.5 opacity-60" />
            <p className="text-[13px] text-white/45 leading-relaxed max-w-xs mx-auto">
              Descreva o que quer ajustar, anexe um documento ou dite por voz.
              O que você mandar aqui muda o que aparece ao lado.
            </p>
          </div>
        )}

        {mensagens.map((m, i) => <Mensagem key={m.id || i} m={m} />)}

        {trabalhando && <Raciocinio estado={trabalhando} />}

        {erro && (
          <Painel cor="#ff4d8d" tamanho="p" className="p-3">
            <div className="flex gap-2.5">
              <Icon nome="alerta" tam={15} className="text-[#ff4d8d] shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/75 leading-relaxed">{erro}</div>
            </div>
          </Painel>
        )}

        {aviso && (
          <Painel cor="#ffc531" tamanho="p" className="p-3">
            <div className="flex gap-2.5">
              <Icon nome="info" tam={15} className="text-[#ffc531] shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/70 leading-relaxed">{aviso}</div>
            </div>
          </Painel>
        )}

        <div ref={fim} />
      </div>

      <CaixaContexto projeto={projeto} onEnviar={onEnviar} ocupado={ocupado} />
    </Painel>
  );
}

// ── Uma mensagem da trilha ────────────────────────────────────────────────
function Mensagem({ m }) {
  if (m.papel === 'usuario') {
    return (
      <div className="ml-auto max-w-[88%] hud-corte px-3.5 py-2.5"
        style={{ '--c': '7px', background: '#00c8ff14', boxShadow: 'inset 0 0 0 1px #00c8ff33' }}>
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.texto}</div>
        {m.anexos?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
            {m.anexos.map((a, i) => (
              <Etiqueta key={i} cor="#00c8ff">
                <Icon nome={iconeDeArquivo(a.tipo)} tam={10} />{a.nome}
              </Etiqueta>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (m.papel === 'marco') {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00ff6455]" />
        <span className="hud-caps text-[9px] text-[#00ff64] flex items-center gap-1.5">
          <Icon nome="check" tam={11} />{m.texto}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00ff6455]" />
      </div>
    );
  }

  // Fala de agente
  return (
    <div className="flex gap-2.5">
      <AgentAvatar agente={{ id: m.agenteId, nome: m.agenteNome, emoji: m.agenteEmoji, cor: m.cor }}
        size="w-8 h-9" centralizar={false} emojiSize="text-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-bold" style={{ color: m.cor || '#00e5ff' }}>
            {m.agenteNome || 'Maiá'}
          </span>
          {m.selo && <Etiqueta cor={m.cor || '#00e5ff'}>{m.selo}</Etiqueta>}
        </div>
        <div className="text-[13px] text-white/72 leading-relaxed mt-1 whitespace-pre-wrap">
          {m.texto}
        </div>
        {m.fontes?.length > 0 && <Fontes fontes={m.fontes} />}
      </div>
    </div>
  );
}

function Fontes({ fontes }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setAberto(v => !v)}
        className="hud-caps text-[9px] text-white/35 hover:text-[color:var(--zd-acento)] transition-colors flex items-center gap-1.5">
        <Icon nome="busca" tam={10} />
        {fontes.length} fonte{fontes.length > 1 ? 's' : ''} consultada{fontes.length > 1 ? 's' : ''}
        <Icon nome="chevron" tam={10} className={aberto ? 'rotate-180' : ''} />
      </button>
      {aberto && (
        <ul className="mt-1.5 space-y-1">
          {fontes.map((f, i) => (
            <li key={i} className="text-[10px] text-white/40 flex gap-1.5 leading-snug">
              <span className="text-[color:var(--zd-acento)] shrink-0">▸</span>
              {f.url
                ? <a href={f.url} target="_blank" rel="noreferrer noopener"
                    className="hover:text-[color:var(--zd-acento)] transition-colors break-all">{f.titulo || f.url}</a>
                : <span>{f.titulo}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Raciocínio ao vivo ────────────────────────────────────────────────────
// Mostra cada agente com o que está fazendo agora. Sem isso, a espera de
// uma geração longa parece travamento.
function Raciocinio({ estado }) {
  const passos = estado.passos || [];
  return (
    <Painel aceso cor="#ffc531" tamanho="p" className="p-3.5 space-y-2.5">
      <Rotulo cor="#ffc531">{estado.titulo || 'TRABALHANDO'}</Rotulo>
      {passos.map((p, i) => (
        <div key={p.id || i} className="flex items-center gap-2.5">
          <span className="w-4 shrink-0 flex justify-center">
            {p.estado === 'ok'
              ? <Icon nome="check" tam={12} className="text-[#00ff64]" />
              : p.estado === 'erro'
                ? <Icon nome="alerta" tam={12} className="text-[#ff4d8d]" />
                : <Pulso cor="#ffc531" />}
          </span>
          <span className={`text-[12px] flex-1 ${p.estado === 'ok' ? 'text-white/45' : 'text-white/80'}`}>
            {p.label}
          </span>
          {p.detalhe && <span className="hud-tec text-[9px] text-white/30">{p.detalhe}</span>}
        </div>
      ))}
      {estado.parcial && (
        <div className="text-[11px] text-white/50 leading-relaxed pt-1 border-t border-white/8 cursor-agente">
          {estado.parcial}
        </div>
      )}
    </Painel>
  );
}

export function iconeDeArquivo(tipo = '') {
  if (tipo.includes('pdf')) return 'documento';
  if (tipo.includes('word') || tipo.includes('docx')) return 'documento';
  if (tipo.includes('presentation') || tipo.includes('ppt')) return 'vitrine';
  if (tipo.startsWith('image/')) return 'olho';
  if (tipo.startsWith('audio/')) return 'transmissao';
  return 'documento';
}
