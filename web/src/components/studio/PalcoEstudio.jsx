import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { Botao, Etiqueta } from '../hud/index.jsx';
import { api, baixarMvpZip, construirMvpSSE } from '../../lib/api.js';
import { MolduraPalco, PalcoVazio } from './Palco.jsx';
import Editor from './Editor.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PALCO DO MVP — o estúdio de código.
//
// Três painéis que se alternam: ÁRVORE de arquivos, EDITOR e PRÉVIA. Em tela
// larga a prévia fica ao lado do código; em tela estreita elas se revezam,
// porque metade de um editor de código não serve para nada.
//
// A prévia recarrega ao salvar, não a cada tecla: ver a página piscar a cada
// caractere digitado atrapalha mais do que ajuda.
//
// O que se edita aqui é o mesmo arquivo que sai no ZIP. Não existe cópia de
// exibição: se você mudou aqui, mudou no produto.
// ═══════════════════════════════════════════════════════════════════════════

const ICONE = { '.html': 'vitrine', '.css': 'gota', '.js': 'cpu', '.md': 'documento' };
const iconeDe = (n = '') => ICONE[n.slice(n.lastIndexOf('.'))] || 'documento';

export default function PalcoEstudio({ projeto, fase, onAviso, onMarco }) {
  const [mvp, setMvp] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [construindo, setConstruindo] = useState(false);
  const [pecas, setPecas] = useState([]);
  const [atual, setAtual] = useState(null);
  const [rascunhos, setRascunhos] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [vista, setVista] = useState('codigo');
  const [arvoreAberta, setArvoreAberta] = useState(true);
  const [chavePrevia, setChavePrevia] = useState(0);
  const [designAberto, setDesignAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await api.mvp(projeto.id);
      setMvp(r);
      if (r.arquivos?.length) {
        setAtual(a => (a && r.arquivos.some(x => x.arquivo === a) ? a : r.arquivos[0].arquivo));
      }
    } catch (e) { onAviso?.(e.message); } finally { setCarregando(false); }
  }, [projeto?.id, onAviso]);

  useEffect(() => { carregar(); }, [carregar]);

  const arquivos = mvp?.arquivos || [];
  const conteudoAtual = useMemo(() => {
    if (atual == null) return '';
    if (rascunhos[atual] != null) return rascunhos[atual];
    return arquivos.find(a => a.arquivo === atual)?.conteudo ?? '';
  }, [atual, rascunhos, arquivos]);

  const sujos = Object.keys(rascunhos).filter(
    k => rascunhos[k] !== arquivos.find(a => a.arquivo === k)?.conteudo);

  const construir = async () => {
    setConstruindo(true);
    setPecas([]);
    try {
      await construirMvpSSE(projeto.id, {
        inicio: (d) => setPecas((d.pecas || []).map(p => ({ ...p, estado: 'espera' }))),
        peca: (d) => setPecas(ps => ps.map(p => (p.id === d.peca ? { ...p, estado: d.status } : p))),
        concluido: async () => { await carregar(); onMarco?.('MVP construído'); },
        erro: (d) => onAviso?.(d.error || 'A construção falhou.'),
      });
    } catch (e) { onAviso?.(e.message); } finally { setConstruindo(false); }
  };

  const salvar = async () => {
    if (!sujos.length) return;
    setSalvando(true);
    try {
      for (const arq of sujos) {
        await api.salvarArquivoMvp(projeto.id, arq, rascunhos[arq]);
      }
      await carregar();
      setRascunhos({});
      setChavePrevia(k => k + 1);
    } catch (e) { onAviso?.(e.message); } finally { setSalvando(false); }
  };

  // Ctrl+S / Cmd+S salva, como em qualquer editor
  useEffect(() => {
    const atalho = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
    };
    window.addEventListener('keydown', atalho);
    return () => window.removeEventListener('keydown', atalho);
  });

  if (carregando) {
    return (
      <MolduraPalco rotulo="MVP" titulo="Estúdio" cor={fase?.cor}>
        <div className="h-full flex items-center justify-center">
          <Icon nome="atualizar" tam={22} className="text-[#00ff64] animate-spin" />
        </div>
      </MolduraPalco>
    );
  }

  if (construindo) {
    return (
      <MolduraPalco rotulo="MVP" titulo="Construindo o produto" cor={fase?.cor} semRolagem>
        <div className="h-full overflow-y-auto p-5 space-y-2.5 palco-varredura">
          {pecas.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-4 flex justify-center shrink-0">
                {p.estado === 'concluido' ? <Icon nome="check" tam={13} className="text-[#00ff64]" />
                  : p.estado === 'erro' ? <Icon nome="alerta" tam={13} className="text-[#ff4d8d]" />
                  : p.estado === 'executando' ? <Icon nome="atualizar" tam={13} className="text-[#ffc531] animate-spin" />
                  : <span className="block w-1.5 h-1.5 bg-white/15" />}
              </span>
              <span className="text-[13px]">{p.emoji} {p.nome}</span>
              <span className="hud-tec text-[9px] text-white/28 ml-auto">{p.arquivo}</span>
            </div>
          ))}
        </div>
      </MolduraPalco>
    );
  }

  if (!arquivos.length) {
    return (
      <MolduraPalco rotulo="MVP" titulo="Estúdio" cor={fase?.cor}>
        <PalcoVazio
          icone="cubo"
          titulo="Nenhum código ainda"
          texto="Os agentes escrevem a identidade visual, a landing, a aplicação navegável, a lógica e o README. Tudo editável aqui e exportável em ZIP."
          acao={<Botao onClick={construir} className="px-5 py-2.5">
            <Icon nome="raio" tam={15} /> Construir o MVP
          </Botao>}
        />
      </MolduraPalco>
    );
  }

  const previaAberta = vista === 'previa' || vista === 'ambos';
  const paginaPrevia = atual?.endsWith('.html') ? atual : 'index.html';

  const abrirEmAba = () => {
    const html = montarPrevia(arquivos, rascunhos, paginaPrevia);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    // Solto depois de um instante: revogar na hora mataria a aba recém-aberta.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <MolduraPalco
      rotulo="MVP"
      titulo={atual || 'Estúdio'}
      cor={fase?.cor}
      semRolagem
      acoes={
        <>
          {sujos.length > 0 && (
            <Botao onClick={salvar} disabled={salvando} className="px-2.5 py-1 text-[10px]">
              {salvando ? <Icon nome="atualizar" tam={12} className="animate-spin" />
                        : <><Icon nome="check" tam={12} /> Salvar {sujos.length}</>}
            </Botao>
          )}
          <BotaoVista atual={vista} onMudar={setVista} />
          {mvp?.design && (
            <button onClick={() => setDesignAberto(v => !v)} title="Direção de UX/UI deste MVP"
              className={`p-1.5 transition-colors ${designAberto ? 'text-[#a855f7]' : 'text-white/40 hover:text-[#a855f7]'}`}>
              <Icon nome="gota" tam={15} />
            </button>
          )}
          <button onClick={() => baixarMvpZip(projeto.id).catch(e => onAviso?.(e.message))}
            title="Baixar o projeto em ZIP"
            className="p-1.5 text-white/40 hover:text-[#00ff64] transition-colors">
            <Icon nome="download" tam={15} />
          </button>
          <button onClick={construir} title="Reconstruir o MVP do zero"
            className="p-1.5 text-white/40 hover:text-[#ffc531] transition-colors">
            <Icon nome="atualizar" tam={15} />
          </button>
        </>
      }
    >
      {designAberto && mvp?.design && (
        <DirecaoDesign design={mvp.design} onFechar={() => setDesignAberto(false)} />
      )}

      <div className="h-full flex min-h-0">
        {/* Árvore de arquivos */}
        <aside className={`shrink-0 border-r border-[#00e5ff1f] bg-[#07120e] flex flex-col transition-[width] ${
          arvoreAberta ? 'w-[168px]' : 'w-[38px]'}`}>
          <button onClick={() => setArvoreAberta(v => !v)}
            title={arvoreAberta ? 'Recolher arquivos' : 'Expandir arquivos'}
            className="px-2.5 py-2 flex items-center gap-1.5 text-white/35 hover:text-[#00e5ff] transition-colors border-b border-[#00e5ff14]">
            <Icon nome="pasta" tam={13} />
            {arvoreAberta && <span className="hud-caps text-[9px]">arquivos</span>}
            {arvoreAberta && <Icon nome="chevron" tam={11} className="ml-auto rotate-90" />}
          </button>
          <div className="flex-1 overflow-y-auto py-1">
            {arquivos.map(a => {
              const sujo = sujos.includes(a.arquivo);
              return (
                <button key={a.arquivo} onClick={() => setAtual(a.arquivo)}
                  title={`${a.arquivo} — ${a.bytes} bytes`}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors border-l-2 ${
                    atual === a.arquivo
                      ? 'border-[#00ff64] bg-[#00ff640f] text-white'
                      : 'border-transparent text-white/45 hover:text-white hover:bg-white/4'}`}>
                  <Icon nome={iconeDe(a.arquivo)} tam={12} className="shrink-0" />
                  {arvoreAberta && <span className="text-[11px] truncate flex-1">{a.arquivo}</span>}
                  {sujo && <span className="w-1.5 h-1.5 bg-[#ffc531] shrink-0" title="Alterado e não salvo" />}
                </button>
              );
            })}
          </div>
          {arvoreAberta && (
            <div className="px-2.5 py-2 border-t border-[#00e5ff14] hud-tec text-[8.5px] text-white/25">
              {mvp?.modo === 'demo' ? 'MODO DEMO' : 'GERADO POR IA'}
            </div>
          )}
        </aside>

        {/* Código */}
        <div className={`min-w-0 flex-1 ${vista === 'previa' ? 'hidden' : 'block'}`}>
          <Editor
            arquivo={atual}
            valor={conteudoAtual}
            onMudar={(v) => setRascunhos(r => ({ ...r, [atual]: v }))}
          />
        </div>

        {/* Prévia */}
        {previaAberta && (
          <div className={`min-w-0 border-l border-[#00e5ff1f] flex flex-col ${
            vista === 'ambos' ? 'hidden xl:flex xl:w-1/2' : 'flex flex-1'}`}>
            <div className="px-3 py-1.5 border-b border-[#00e5ff14] flex items-center gap-2 shrink-0">
              <Icon nome="olho" tam={12} className="text-[#00ff64]" />
              <span className="hud-tec text-[9px] text-white/40">{paginaPrevia}</span>
              {sujos.length > 0 && (
                <span className="hud-tec text-[8.5px] text-[#ffc531]">com alterações não salvas</span>
              )}
              <button onClick={() => setChavePrevia(k => k + 1)} title="Recarregar a prévia"
                className="ml-auto text-white/30 hover:text-[#00e5ff]">
                <Icon nome="atualizar" tam={12} />
              </button>
              <button onClick={abrirEmAba} title="Abrir em nova aba"
                className="text-white/30 hover:text-[#00e5ff]">
                <Icon nome="externo" tam={12} />
              </button>
            </div>
            {/* srcdoc em vez de src: o iframe não carrega o cabeçalho de
                autorização, então buscar a página no servidor devolveria 401.
                Montar o HTML aqui também faz a prévia refletir o que está no
                editor agora, não o que foi salvo da última vez. */}
            <iframe
              key={chavePrevia}
              title="Prévia do MVP"
              srcDoc={montarPrevia(arquivos, rascunhos, paginaPrevia)}
              sandbox="allow-scripts allow-forms allow-modals"
              className="flex-1 w-full bg-white"
            />
          </div>
        )}
      </div>

      {sujos.length > 0 && (
        <div className="absolute bottom-3 right-3 hud-tec text-[9px] text-[#ffc531] bg-[#06140d] px-2 py-1"
          style={{ boxShadow: 'inset 0 0 0 1px #ffc53144' }}>
          Ctrl+S para salvar
        </div>
      )}
    </MolduraPalco>
  );
}

// ── Direção de UX/UI ──────────────────────────────────────────────────────
// O briefing que os cinco arquivos obedeceram, legível. Mostrar isso não é
// enfeite: quando o fundador pedir uma mudança visual, é daqui que ele fala,
// e um pedido feito contra uma decisão escrita vale mais que "deixa mais bonito".
function DirecaoDesign({ design, onFechar }) {
  const d = design || {};
  const p = d.paleta || {};
  const cores = [
    ['fundo', p.fundo], ['superfície', p.superficie], ['marca', p.marca], ['acento', p.acento],
    ['texto', p.texto], ['sucesso', p.sucesso], ['alerta', p.alerta], ['erro', p.erro],
  ].filter(([, v]) => v);

  return (
    // Fundo opaco de propósito: com o código transparecendo por trás, os dois
    // textos brigam e não se lê nenhum dos dois.
    <div className="absolute inset-0 z-20 overflow-y-auto p-5"
      style={{ background: '#04100b', backdropFilter: 'blur(4px)' }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="hud-caps text-[9px] text-[#a855f7] mb-1">direção de ux/ui</div>
            <p className="text-[14px] leading-relaxed">{d.conceito}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(d.personalidade || []).map((x, i) => <Etiqueta key={i} cor="#a855f7">{x}</Etiqueta>)}
            </div>
          </div>
          <button onClick={onFechar} title="Fechar" className="text-white/40 hover:text-white shrink-0 p-1">
            <Icon nome="fechar" tam={16} />
          </button>
        </div>

        {cores.length > 0 && (
          <Bloco titulo="Paleta">
            <div className="flex flex-wrap gap-2">
              {cores.map(([nome, hex]) => (
                <div key={nome} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 hud-corte shrink-0"
                    style={{ '--c': '4px', background: hex, boxShadow: 'inset 0 0 0 1px #ffffff22' }} />
                  <span className="hud-tec text-[9px] text-white/45">{nome} {hex}</span>
                </div>
              ))}
            </div>
            {d.contraste && <p className="text-[11px] text-white/45 mt-2.5 leading-relaxed">{d.contraste}</p>}
          </Bloco>
        )}

        {d.fluxoPrincipal?.length > 0 && (
          <Bloco titulo="Fluxo principal">
            {d.fluxoPrincipal.map((f, i) => (
              <div key={i} className="flex gap-2.5 py-1.5">
                <span className="hud-tec text-[10px] text-[#a855f7] shrink-0 w-4">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold">{f.passo}</div>
                  <div className="text-[11px] text-white/50 leading-relaxed">
                    vê {f.oQueVe} · faz {f.oQueFaz}
                  </div>
                  <div className="text-[11px] text-[#00ff64] leading-relaxed mt-0.5">
                    sabe que deu certo quando {f.comoSabeQueDeuCerto}
                  </div>
                </div>
              </div>
            ))}
          </Bloco>
        )}

        {d.estados?.length > 0 && (
          <Bloco titulo="Estados da interface">
            {d.estados.map((e, i) => (
              <div key={i} className="text-[11.5px] text-white/55 py-1 leading-relaxed">
                <span className="hud-caps text-[9px] text-white/35 mr-2">{e.estado}</span>
                {e.comoAparece}
              </div>
            ))}
          </Bloco>
        )}

        {d.oQueNaoFazer?.length > 0 && (
          <Bloco titulo="Proibido neste produto" cor="#ff4d8d">
            {d.oQueNaoFazer.map((x, i) => (
              <div key={i} className="text-[11.5px] text-white/55 py-0.5 flex gap-2">
                <Icon nome="fechar" tam={11} className="text-[#ff4d8d] shrink-0 mt-1" />{x}
              </div>
            ))}
          </Bloco>
        )}

        {d.acessibilidade?.length > 0 && (
          <Bloco titulo="Acessibilidade">
            {d.acessibilidade.map((x, i) => (
              <div key={i} className="text-[11.5px] text-white/55 py-0.5 flex gap-2">
                <Icon nome="check" tam={11} className="text-[#00ff64] shrink-0 mt-1" />{x}
              </div>
            ))}
          </Bloco>
        )}
      </div>
    </div>
  );
}

function Bloco({ titulo, cor = '#00e5ff', children }) {
  return (
    <div className="hud-corte p-3.5" style={{ '--c': '7px', background: '#00e5ff08', boxShadow: `inset 0 0 0 1px ${cor}2e` }}>
      <div className="hud-caps text-[9px] mb-2" style={{ color: cor }}>{titulo}</div>
      {children}
    </div>
  );
}

// ── Montagem da prévia ────────────────────────────────────────────────────
// O MVP é um punhado de arquivos soltos. Para vê-lo num iframe sem servidor,
// o CSS e o JS referenciados entram embutidos no HTML, e os links entre as
// páginas locais são desligados: clicar em app.html dentro do iframe tentaria
// navegar para um arquivo que não existe naquele contexto.
function montarPrevia(arquivos, rascunhos, pagina) {
  const ler = (nome) => rascunhos[nome] ?? arquivos.find(a => a.arquivo === nome)?.conteudo ?? '';
  let html = ler(pagina) || ler('index.html');
  if (!html) return '<!doctype html><meta charset="utf-8"><p style="font:14px system-ui;padding:24px">Sem página para exibir.</p>';

  html = html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (todo, arquivo) => {
    const css = ler(arquivo.replace(/^\.?\//, ''));
    return css ? `<style>\n${css}\n</style>` : todo;
  });

  html = html.replace(/<script[^>]+src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi, (todo, arquivo) => {
    const js = ler(arquivo.replace(/^\.?\//, ''));
    return js ? `<script>\n${js}\n</script>` : todo;
  });

  // Navegação entre páginas locais vira aviso em vez de erro de rede
  const avisoNavegacao = `<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href') || '';
  if (/^https?:/i.test(href)) return;
  e.preventDefault();
  console.info('Prévia: navegação para ' + href + ' desativada. Abra o arquivo no editor.');
}, true);
</script>`;

  return html.includes('</body>')
    ? html.replace('</body>', `${avisoNavegacao}</body>`)
    : html + avisoNavegacao;
}

function BotaoVista({ atual, onMudar }) {
  const opcoes = [
    { id: 'codigo', icone: 'cpu', titulo: 'Só o código' },
    { id: 'ambos', icone: 'grid', titulo: 'Código e prévia' },
    { id: 'previa', icone: 'olho', titulo: 'Só a prévia' },
  ];
  return (
    <div className="flex items-center">
      {opcoes.map(o => (
        <button key={o.id} onClick={() => onMudar(o.id)} title={o.titulo}
          className={`p-1.5 transition-colors ${
            atual === o.id ? 'text-[#00ff64] bg-[#00ff6414]' : 'text-white/35 hover:text-white/70'}`}>
          <Icon nome={o.icone} tam={14} />
        </button>
      ))}
    </div>
  );
}
