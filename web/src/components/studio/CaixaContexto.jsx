import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { Etiqueta, Botao } from '../hud/index.jsx';
import { api } from '../../lib/api.js';
import { iconeDeArquivo } from './Console.jsx';
import useDitado from './useDitado.js';
import usePreLeitura from './usePreLeitura.js';

// ═══════════════════════════════════════════════════════════════════════════
// CAIXA DE CONTEXTO — onde a ideia entra na plataforma.
//
// Quatro entradas na mesma caixa: teclado, arquivo, voz e o que o sistema
// deduz sozinho enquanto você escreve.
//
// A PRÉ-LEITURA é o que faz o documento aparecer rápido: enquanto a pessoa
// digita, um passe barato extrai setor, público, modelo e sinais de território.
// Quando ela envia, a geração pesada já começa abastecida em vez de começar do
// zero. As travas de disparo estão no hook, e existem porque sem elas isso
// queimaria a conta a cada tecla.
// ═══════════════════════════════════════════════════════════════════════════

const LIMITE_ARQUIVO = 25 * 1024 * 1024;   // 25 MB
const ACEITOS = '.pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.ogg,.webm';

export default function CaixaContexto({ projeto, onEnviar, ocupado = false }) {
  const [texto, setTexto] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState(null);
  const campo = useRef(null);
  const entrada = useRef(null);

  const ditado = useDitado({
    aoTranscrever: (trecho) => setTexto(t => (t ? `${t} ${trecho}` : trecho)),
  });
  const preLeitura = usePreLeitura(texto, projeto?.id);

  // A caixa cresce com o conteúdo até um teto, e volta quando esvazia
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [texto]);

  const anexar = useCallback(async (arquivos) => {
    setErro(null);
    const novos = [];
    for (const f of Array.from(arquivos)) {
      if (f.size > LIMITE_ARQUIVO) {
        setErro(`${f.name} passa de 25 MB. Anexe um arquivo menor.`);
        continue;
      }
      novos.push({
        id: `${f.name}-${f.size}-${f.lastModified}`,
        nome: f.name, tipo: f.type || '', bytes: f.size,
        arquivo: f, estado: 'pendente',
      });
    }
    if (!novos.length) return;
    setAnexos(a => [...a, ...novos]);

    // Extração no servidor: o que importa é o texto, não o arquivo
    for (const n of novos) {
      try {
        const r = await api.extrairAnexo(n.arquivo);
        setAnexos(a => a.map(x => (x.id === n.id
          ? { ...x, estado: 'pronto', extraido: r.texto, resumo: r.resumo, paginas: r.paginas, duracao: r.duracao }
          : x)));
      } catch (e) {
        setAnexos(a => a.map(x => (x.id === n.id ? { ...x, estado: 'erro', erro: e.message } : x)));
      }
    }
  }, []);

  const remover = (id) => setAnexos(a => a.filter(x => x.id !== id));

  const enviar = (e) => {
    e?.preventDefault();
    const limpo = texto.trim();
    if ((!limpo && !anexos.length) || ocupado) return;
    onEnviar?.({
      texto: limpo,
      anexos: anexos.filter(a => a.estado === 'pronto').map(({ arquivo, ...resto }) => resto),
      preLeitura: preLeitura.resultado,
    });
    setTexto('');
    setAnexos([]);
    preLeitura.limpar();
  };

  const processando = anexos.some(a => a.estado === 'pendente');
  const podeEnviar = (texto.trim() || anexos.some(a => a.estado === 'pronto')) && !ocupado && !processando;

  return (
    <div
      className={`shrink-0 border-t transition-colors ${
        arrastando ? 'border-[#00e5ff85] bg-[#00e5ff0a]' : 'border-[#00e5ff1f]'}`}
      onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastando(false); anexar(e.dataTransfer.files); }}
    >
      {/* Leitura antecipada: o que o sistema já entendeu */}
      {preLeitura.resultado && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="hud-caps text-[8.5px] text-white/30 flex items-center gap-1">
              <Icon nome="radar" tam={10} className="text-[color:var(--zd-acento)]" /> já entendi
            </span>
            {preLeitura.resultado.sinais?.map((s, i) => (
              <Etiqueta key={i} cor={s.cor || '#00e5ff'}>{s.label}</Etiqueta>
            ))}
          </div>
        </div>
      )}

      {/* Anexos */}
      {anexos.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
          {anexos.map(a => (
            <div key={a.id}
              className="hud-corte flex items-center gap-2 px-2.5 py-1.5 max-w-[220px]"
              style={{
                '--c': '5px',
                background: a.estado === 'erro' ? '#ff4d8d12' : '#00e5ff0f',
                boxShadow: `inset 0 0 0 1px ${a.estado === 'erro' ? '#ff4d8d44' : '#00e5ff33'}`,
              }}>
              <Icon nome={iconeDeArquivo(a.tipo)} tam={12}
                className={a.estado === 'erro' ? 'text-[#ff4d8d]' : 'text-[color:var(--zd-acento)]'} />
              <span className="text-[10px] text-white/70 truncate flex-1">{a.nome}</span>
              {a.estado === 'pendente' && <Icon nome="atualizar" tam={11} className="text-[#ffc531] animate-spin" />}
              {a.estado === 'pronto' && (
                <span className="hud-tec text-[8px] text-white/30 shrink-0">
                  {a.paginas ? `${a.paginas}p` : a.duracao ? `${Math.round(a.duracao)}s` : 'ok'}
                </span>
              )}
              <button onClick={() => remover(a.id)} className="text-white/30 hover:text-[#ff4d8d] shrink-0">
                <Icon nome="fechar" tam={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {erro && <div className="px-4 pt-2 text-[11px] text-[#ff4d8d]">{erro}</div>}
      {ditado.erro && <div className="px-4 pt-2 text-[11px] text-[#ffc531]">{ditado.erro}</div>}

      <form onSubmit={enviar} className="p-3">
        <div className="hud-campo p-2.5" style={{ boxShadow: 'inset 0 0 0 1px #00e5ff3d' }}>
          <textarea
            ref={campo}
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.altKey) { e.preventDefault(); enviar(e); }
            }}
            placeholder={ditado.ouvindo ? 'Ouvindo…' : 'Descreva, peça um ajuste, cole um trecho. Enter envia, Shift+Enter quebra linha.'}
            className="w-full bg-transparent resize-none outline-none text-[13.5px] leading-relaxed text-white placeholder:text-white/28"
          />

          {/* Onda do ditado: prova visual de que o microfone está captando */}
          {ditado.ouvindo && (
            <div className="flex items-end gap-[3px] h-6 px-1 mb-1" aria-hidden>
              {ditado.niveis.map((n, i) => (
                <span key={i} className="flex-1 bg-[#00e5ff] transition-[height] duration-75"
                  style={{ height: `${Math.max(8, n * 100)}%`, opacity: 0.4 + n * 0.6 }} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/8">
            <button type="button" onClick={() => entrada.current?.click()} title="Anexar arquivo"
              className="p-1.5 text-white/40 hover:text-[color:var(--zd-acento)] transition-colors">
              <Icon nome="upload" tam={16} />
            </button>
            <input ref={entrada} type="file" multiple accept={ACEITOS} className="hidden"
              onChange={(e) => { anexar(e.target.files); e.target.value = ''; }} />

            {ditado.suportado && (
              <button type="button" onClick={ditado.alternar}
                title={ditado.ouvindo ? 'Parar de ditar' : 'Ditar por voz'}
                className={`p-1.5 transition-colors ${
                  ditado.ouvindo ? 'text-[#ff4d8d]' : 'text-white/40 hover:text-[color:var(--zd-acento)]'}`}>
                <Icon nome="transmissao" tam={16} />
              </button>
            )}

            {preLeitura.pensando && (
              <span className="hud-tec text-[8.5px] text-white/25 flex items-center gap-1 ml-1">
                <Icon nome="radar" tam={10} className="animate-spin" /> lendo
              </span>
            )}

            <span className="ml-auto hud-tec text-[9px] text-white/25">
              {texto.length > 0 && `${texto.length}`}
            </span>

            <Botao type="submit" disabled={!podeEnviar} className="px-3.5 py-1.5 text-[11px]">
              {ocupado ? <Icon nome="atualizar" tam={13} className="animate-spin" />
                       : <><Icon nome="enviar" tam={13} /> Enviar</>}
            </Botao>
          </div>
        </div>

        <div className="hud-tec text-[8.5px] text-white/22 mt-2 px-1 flex items-center gap-2 flex-wrap">
          <span>PDF · DOCX · PPTX · TXT · imagem · áudio</span>
          <span className="text-white/12">|</span>
          <span>arraste arquivos para cá</span>
        </div>
      </form>
    </div>
  );
}
