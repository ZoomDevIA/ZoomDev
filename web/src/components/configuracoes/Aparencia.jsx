import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { Painel, Rotulo, Etiqueta, Botao, Barra, Secao, Pulso } from '../hud/index.jsx';
import {
  ACENTOS, ARESTAS, DENSIDADES, FONTES, FUNDOS, MOVIMENTOS,
  HEX_VALIDO, aplicar, gravarLocal, guardaDeContraste, lerLocal, padrao,
} from '../../lib/tema.js';
import { api } from '../../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// APARÊNCIA — o guia de estilo que virou painel de controle.
//
// Antes o guia era uma vitrine de administrador: mostrava as peças e ninguém
// podia mexer. Agora ele mostra as peças **enquanto** você mexe. A prévia
// abaixo não é maquete: são os mesmos componentes do resto da plataforma,
// reagindo às mesmas variáveis.
//
// Cada mudança aplica na hora, em toda a tela. Salvar leva a escolha para o
// servidor, e aí ela segue você para qualquer aparelho.
// ═══════════════════════════════════════════════════════════════════════════

export default function Aparencia({ user, refreshUser }) {
  const [tema, setTema] = useState(() => lerLocal());
  const [salvo, setSalvo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const primeira = useRef(true);

  // Aplica na hora: mexer numa cor e não ver nada acontecer é a diferença
  // entre configurar e adivinhar.
  useEffect(() => {
    aplicar(tema);
    gravarLocal(tema);
    if (primeira.current) { primeira.current = false; return; }
    setSalvo(false);
  }, [tema]);

  const mexer = useCallback((campo, valor) => setTema(t => ({ ...t, [campo]: valor })), []);

  const salvar = async () => {
    setSalvando(true); setAviso(null);
    try {
      await api.atualizarPerfil({ tema });
      await refreshUser?.();
      setSalvo(true);
      setAviso('ok');
    } catch (e) { setAviso(e.message); }
    finally { setSalvando(false); setTimeout(() => setAviso(null), 3200); }
  };

  const restaurar = () => setTema(padrao());

  // A guarda de contraste mora em tema.js, e não aqui, porque a mesma regra
  // precisa valer para o tema que chega do servidor. A tela só desenha o que
  // ela devolve.
  const avisosDeCor = guardaDeContraste(tema);
  const avisoDe = (campo) => avisosDeCor.filter(a => a.campo === campo);

  return (
    <Secao rotulo="APARÊNCIA" titulo="O painel do seu jeito"
      descricao="Cor, tipografia, arestas e movimento. Muda aqui e muda em toda a plataforma, na hora."
      acao={
        <div className="flex items-center gap-2">
          <button onClick={restaurar} className="text-[11px] text-white/35 hover:text-white/70 px-2 py-1.5 transition-colors">
            restaurar padrão
          </button>
          <Botao onClick={salvar} disabled={salvo || salvando} className="px-4 py-2 text-xs">
            <Icon nome={salvo ? 'check' : 'upload'} tam={13} />
            {salvando ? 'Salvando…' : salvo ? 'Salvo' : 'Salvar na conta'}
          </Botao>
        </div>
      }
    >
      <div className="space-y-4">
        {aviso && aviso !== 'ok' && (
          <Painel cor="#ff4d8d" tamanho="p" className="p-3 text-[12px] text-white/75">{aviso}</Painel>
        )}
        {!salvo && (
          <p className="text-[11px] text-white/38 leading-relaxed">
            As mudanças já valem neste navegador. Salvar na conta faz o tema acompanhar você
            no celular e em qualquer outro computador.
          </p>
        )}

        {/* ── Prévia ao vivo ─────────────────────────────────────────────── */}
        <Previa tema={tema} user={user} />

        {/* ── Cores ──────────────────────────────────────────────────────── */}
        <Painel className="p-4 space-y-4">
          <Rotulo>COR DE ACENTO</Rotulo>
          <p className="text-[11px] text-white/40 -mt-2 leading-relaxed">
            Manda na estrutura: borda, linha-guia, campo e rótulo técnico.
          </p>
          <Amostras valor={tema.acento} onEscolher={v => mexer('acento', v)} />

          <Avisos itens={avisoDe('acento')} />

          <div className="pt-1">
            <Rotulo>COR DA MARCA</Rotulo>
            <p className="text-[11px] text-white/40 mt-1.5 mb-2.5 leading-relaxed">
              Confirmação, item ativo do menu e o botão principal.
            </p>
            <Amostras valor={tema.marca} onEscolher={v => mexer('marca', v)} />
            <div className="mt-2.5"><Avisos itens={avisoDe('marca')} /></div>
          </div>
        </Painel>

        {/* ── Fundo ──────────────────────────────────────────────────────── */}
        <Painel className="p-4">
          <Rotulo>FUNDO</Rotulo>
          <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
            {Object.entries(FUNDOS).map(([id, f]) => (
              <button key={id} onClick={() => mexer('fundo', id)}
                className={`hud-corte p-3 text-left transition-all ${tema.fundo === id ? '' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  '--c': '8px',
                  background: f.painel,
                  boxShadow: `inset 0 0 0 ${tema.fundo === id ? 2 : 1}px ${tema.fundo === id ? tema.acento : '#ffffff1a'}`,
                }}>
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0">
                    {[f.pagina, f.painel, f.elevado, f.campo].map((c, i) => (
                      <span key={i} className="w-3.5 h-6 block" style={{ background: c, boxShadow: 'inset 0 0 0 1px #ffffff12' }} />
                    ))}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold">{f.nome}</div>
                    <div className="text-[10px] text-white/40 leading-snug">{f.descricao}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Painel>

        {/* ── Tipografia e geometria ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          <Painel className="p-4 space-y-3.5">
            <Rotulo>TIPOGRAFIA</Rotulo>
            <Escolha rotulo="Títulos" valor={tema.fonteTitulo} onEscolher={v => mexer('fonteTitulo', v)}
              opcoes={Object.entries(FONTES).map(([id, f]) => ({ id, label: f.nome, estilo: { fontFamily: f.css } }))} />
            <Escolha rotulo="Corpo" valor={tema.fonteCorpo} onEscolher={v => mexer('fonteCorpo', v)}
              opcoes={Object.entries(FONTES).map(([id, f]) => ({ id, label: f.nome, estilo: { fontFamily: f.css } }))} />
            <p className="text-[10px] text-white/30 leading-relaxed">
              Só as famílias servidas da própria origem. Oferecer uma quarta significaria
              voltar a buscar fonte de fora, e foi isso que a blindagem tirou do caminho.
            </p>
          </Painel>

          <Painel className="p-4 space-y-3.5">
            <Rotulo>GEOMETRIA</Rotulo>
            <Escolha rotulo="Arestas" valor={tema.arestas} onEscolher={v => mexer('arestas', v)}
              opcoes={Object.entries(ARESTAS).map(([id, a]) => ({ id, label: a.nome }))} />
            <Escolha rotulo="Densidade" valor={tema.densidade} onEscolher={v => mexer('densidade', v)}
              opcoes={Object.entries(DENSIDADES).map(([id, d]) => ({ id, label: d.nome }))} />
            <Interruptor ligado={tema.textura} onMudar={v => mexer('textura', v)}
              titulo="Grade e varredura"
              detalhe="A textura de visor no fundo. Desligar deixa a tela mais quieta." />
          </Painel>
        </div>

        {/* ── Movimento e som ────────────────────────────────────────────── */}
        <Painel className="p-4 space-y-3.5">
          <Rotulo>MOVIMENTO E SOM</Rotulo>
          <Escolha rotulo="Animações" valor={tema.movimento} onEscolher={v => mexer('movimento', v)}
            opcoes={Object.entries(MOVIMENTOS).map(([id, nome]) => ({ id, label: nome }))} />
          <Interruptor ligado={tema.som} onMudar={v => mexer('som', v)}
            titulo="Retorno sonoro"
            detalhe="Sons curtos de interface, sintetizados no navegador. Nenhum arquivo é baixado." />
          {tema.som && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/50">Volume</span>
                <span className="hud-tec text-[10px] text-white/35">{Math.round(tema.volume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={tema.volume}
                onChange={e => mexer('volume', Number(e.target.value))}
                className="w-full accent-[color:var(--zd-acento)]" />
            </div>
          )}
        </Painel>
      </div>
    </Secao>
  );
}

// ── Prévia ────────────────────────────────────────────────────────────────
// As peças de verdade, não desenhos delas.
function Previa({ tema, user }) {
  return (
    <Painel aceso quatroCantos className="p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Rotulo>PRÉVIA AO VIVO</Rotulo>
        <Etiqueta cor={tema.acento}>{FUNDOS[tema.fundo].nome}</Etiqueta>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Painel tamanho="p" className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Pulso cor={tema.marca} />
            <span className="hud-caps text-[10px] text-white/55">painel e rótulo</span>
          </div>
          <Barra valor={68} cor={tema.acento} />
          <div className="flex gap-1.5 flex-wrap">
            <Etiqueta cor={tema.marca}>ativo</Etiqueta>
            <Etiqueta cor={tema.acento}>nível {user?.nivel?.nivel ?? 1}</Etiqueta>
            <Etiqueta cor="#ffc531">atenção</Etiqueta>
          </div>
        </Painel>

        <div className="space-y-2.5">
          <input className="hud-campo w-full px-3 py-2.5 text-[12.5px]" placeholder="campo de texto" readOnly />
          <div className="flex gap-2">
            <Botao className="px-3.5 py-2 text-[11.5px] flex-1">
              <Icon nome="raio" tam={13} /> Ação principal
            </Botao>
            <button className="hud-botao-vazio px-3.5 py-2 text-[11.5px]">Secundária</button>
          </div>
          <div className="flex gap-1.5">
            <span className="hud-aba hud-caps ativa px-3 py-1.5 text-[9px]">aba ativa</span>
            <span className="hud-aba hud-caps px-3 py-1.5 text-[9px]">outra</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <p className="text-[10px] text-white/28 leading-relaxed max-w-md">
          Âmbar, magenta e roxo não seguem o tema de propósito: são cor com significado,
          atenção, erro e ciência. Trocar elas junto quebraria a leitura da plataforma.
        </p>
        <Link to="/estilo"
          className="hud-tec text-[10px] text-[color:var(--zd-acento)] hover:underline shrink-0 flex items-center gap-1.5">
          ver o guia completo <Icon nome="setaDireita" tam={12} />
        </Link>
      </div>
    </Painel>
  );
}

// ── Peças do formulário ───────────────────────────────────────────────────
/**
 * Os avisos da guarda de contraste.
 *
 * Cada um traz o que está errado e o que fazer. Aviso sem saída é só uma tela
 * dizendo "você errou", e quem está escolhendo cor não sabe o que fazer com
 * isso. Nada aqui bloqueia: a escolha continua sendo de quem usa.
 */
function Avisos({ itens }) {
  if (!itens.length) return null;
  return (
    <div className="space-y-2">
      {itens.map((a, i) => (
        <div key={i} className="flex gap-2.5 items-start text-[11px] text-[#ffc531] leading-relaxed">
          <Icon nome="alerta" tam={14} className="shrink-0 mt-0.5" />
          <span>
            {a.texto}{' '}
            <span className="text-white/45">{a.saida}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Amostras({ valor, onEscolher }) {
  const [livre, setLivre] = useState(valor);
  useEffect(() => { setLivre(valor); }, [valor]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* A marca de escolhido vai DENTRO da amostra: o chanfro é feito com
          clip-path, e clip-path corta anel externo, contorno e sombra junto
          com o canto. Um visto por cima da cor sobrevive ao corte. */}
      {ACENTOS.map(a => {
        const ativo = valor === a.hex;
        return (
          <button key={a.id} onClick={() => onEscolher(a.hex)} title={a.nome} aria-label={a.nome}
            aria-pressed={ativo}
            className={`w-8 h-8 hud-corte grid place-items-center transition-transform ${
              ativo ? 'scale-110' : 'hover:scale-110'}`}
            style={{ '--c': '5px', background: a.hex }}>
            {ativo && <Icon nome="check" tam={16} style={{ color: 'var(--zd-pagina)' }} />}
          </button>
        );
      })}
      <label className="flex items-center gap-1.5 ml-1">
        <span className="hud-tec text-[10px] text-white/30">hex</span>
        <input
          value={livre}
          onChange={e => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            setLivre(v);
            if (HEX_VALIDO.test(v)) onEscolher(v.toLowerCase());
          }}
          maxLength={7}
          className="hud-campo hud-tec w-[86px] px-2 py-1.5 text-[11px]"
        />
      </label>
    </div>
  );
}

function Escolha({ rotulo, valor, onEscolher, opcoes }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-1.5">{rotulo}</div>
      <div className="flex gap-1.5 flex-wrap">
        {opcoes.map(o => {
          const ativo = valor === o.id;
          return (
            <button key={o.id} onClick={() => onEscolher(o.id)} aria-pressed={ativo}
              className={`hud-corte px-3 py-1.5 text-[11.5px] transition-colors ${
                ativo ? 'font-bold' : 'text-white/55 hover:text-white/90'}`}
              style={{
                '--c': '6px',
                ...o.estilo,
                background: ativo ? 'var(--zd-acento)' : 'transparent',
                color: ativo ? 'var(--zd-pagina)' : undefined,
                boxShadow: ativo ? 'none' : 'inset 0 0 0 1px #ffffff1f',
              }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Interruptor({ ligado, onMudar, titulo, detalhe }) {
  return (
    <button onClick={() => onMudar(!ligado)} role="switch" aria-checked={ligado}
      className="flex items-start gap-3 text-left w-full group">
      <span className="hud-trilho shrink-0 mt-0.5" style={{
        width: 42, height: 22,
        background: ligado ? 'color-mix(in srgb, var(--zd-marca) 30%, transparent)' : '#ffffff0d',
        boxShadow: ligado
          ? 'inset 0 0 0 1px color-mix(in srgb, var(--zd-marca) 55%, transparent)'
          : 'inset 0 0 0 1px #ffffff26',
      }}>
        <span className="hud-alavanca absolute top-1/2" style={{
          width: 16, height: 16, left: 3,
          transform: `translate(${ligado ? 20 : 0}px, -50%)`,
          transition: 'transform .26s cubic-bezier(.34,1.56,.64,1), background .26s',
          background: ligado ? 'var(--zd-marca)' : '#ffffff40',
        }} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold">{titulo}</span>
        <span className="block text-[10.5px] text-white/40 leading-snug mt-0.5">{detalhe}</span>
      </span>
    </button>
  );
}
