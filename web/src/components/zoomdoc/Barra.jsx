import React, { useState } from 'react';
import Icon from '../Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// BARRA DO ZOOMDOC — as ferramentas do editor.
//
// Organizada por grupos separados por divisor, na ordem em que se usa ao
// escrever: estrutura, fonte, ênfase, cor, alinhamento, listas, inserção.
// Cada botão mostra o estado ativo lendo do editor, então a barra é o espelho
// do cursor e não um painel de intenções.
//
// Em tela estreita, os grupos menos usados recolhem atrás de "mais".
// ═══════════════════════════════════════════════════════════════════════════

const ESTILOS = [
  { id: 'titulo1', label: 'Título 1', nivel: 1 },
  { id: 'titulo2', label: 'Título 2', nivel: 2 },
  { id: 'titulo3', label: 'Título 3', nivel: 3 },
  { id: 'corpo', label: 'Corpo do texto', nivel: 0 },
];

const CORES = ['#ffffff', '#00ff64', '#00e5ff', '#ffc531', '#ff4d8d', '#a855f7', '#9fb8ad'];
const REALCES = ['#00ff6433', '#00e5ff33', '#ffc53144', '#ff4d8d33', '#a855f733'];

function Bt({ ativo, titulo, onClick, desabilitado, children }) {
  return (
    <button type="button" title={titulo} aria-label={titulo} aria-pressed={ativo}
      disabled={desabilitado} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`p-1.5 transition-colors shrink-0 ${
        ativo ? 'text-[#04140a] bg-[#00e5ff]' : 'text-white/50 hover:text-[#00e5ff] hover:bg-white/5'} ${
        desabilitado ? 'opacity-25 cursor-not-allowed' : ''}`}
      style={ativo ? { clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' } : undefined}>
      {children}
    </button>
  );
}

const Divisor = () => <span className="w-px h-5 bg-white/10 mx-1 shrink-0" />;

export default function Barra({ editor, fontes = [], sumarioAberto, onSumario, tema = 'escuro', onTema, acoes }) {
  const [mais, setMais] = useState(false);
  // Editor destruído ainda chega aqui em modo estrito, e ler o estado dele
  // derruba a barra inteira.
  if (!editor || editor.isDestroyed) return null;

  const estiloAtual = editor.isActive('heading', { level: 1 }) ? 'titulo1'
    : editor.isActive('heading', { level: 2 }) ? 'titulo2'
    : editor.isActive('heading', { level: 3 }) ? 'titulo3' : 'corpo';

  const aplicarEstilo = (id) => {
    const e = ESTILOS.find(x => x.id === id);
    if (!e) return;
    e.nivel === 0
      ? editor.chain().focus().setParagraph().run()
      : editor.chain().focus().toggleHeading({ level: e.nivel }).run();
  };

  const inserirLink = () => {
    const anterior = editor.getAttributes('link').href || '';
    const url = window.prompt('Endereço do link:', anterior);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const inserirImagem = () => {
    const url = window.prompt('Endereço da imagem:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border-b border-[#00e5ff1f] bg-[#07120e] shrink-0">
      {/* As ferramentas rolam na horizontal quando não cabem; "mais" e as ações
          do documento ficam ancoradas fora da rolagem, senão o botão de regerar
          o plano some para fora da tela justo em janela estreita. */}
      <div className="flex items-center gap-0.5 px-2 py-1.5">
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
        <Bt titulo={sumarioAberto ? 'Ocultar sumário' : 'Mostrar sumário'} ativo={sumarioAberto} onClick={onSumario}>
          <Icon nome="lista" tam={15} />
        </Bt>
        <Divisor />

        <Bt titulo="Desfazer" desabilitado={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Icon nome="atualizar" tam={15} className="-scale-x-100" />
        </Bt>
        <Bt titulo="Refazer" desabilitado={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Icon nome="atualizar" tam={15} />
        </Bt>
        <Divisor />

        <select value={estiloAtual} onChange={(e) => aplicarEstilo(e.target.value)}
          title="Estilo do parágrafo"
          className="hud-campo text-[11px] px-2 py-1 shrink-0 w-[128px]">
          {ESTILOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>

        <select
          value={fontes.find(f => editor.isActive('textStyle', { fontFamily: f.css }))?.id || ''}
          onChange={(e) => {
            const f = fontes.find(x => x.id === e.target.value);
            f?.css ? editor.chain().focus().setFontFamily(f.css).run()
                   : editor.chain().focus().unsetFontFamily().run();
          }}
          title="Fonte"
          className="hud-campo text-[11px] px-2 py-1 shrink-0 w-[120px]">
          {fontes.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <Divisor />

        <Bt titulo="Negrito" ativo={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b className="text-[13px] leading-none px-0.5">B</b>
        </Bt>
        <Bt titulo="Itálico" ativo={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i className="text-[13px] leading-none px-0.5 font-serif">I</i>
        </Bt>
        <Bt titulo="Sublinhado" ativo={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="text-[13px] leading-none px-0.5 underline">U</span>
        </Bt>
        <Bt titulo="Tachado" ativo={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="text-[13px] leading-none px-0.5 line-through">S</span>
        </Bt>
        <Bt titulo="Código" ativo={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <span className="hud-tec text-[11px] leading-none px-0.5">{'</>'}</span>
        </Bt>
        <Divisor />

        <Seletor titulo="Cor do texto" icone="gota" cores={CORES}
          onEscolher={(c) => editor.chain().focus().setColor(c).run()}
          onLimpar={() => editor.chain().focus().unsetColor().run()} />
        <Seletor titulo="Realce" icone="editar" cores={REALCES}
          onEscolher={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
          onLimpar={() => editor.chain().focus().unsetHighlight().run()} />
        <Divisor />

        {[['left', 'Alinhar à esquerda'], ['center', 'Centralizar'], ['right', 'Alinhar à direita'], ['justify', 'Justificar']]
          .map(([a, t], i) => (
            <Bt key={a} titulo={t} ativo={editor.isActive({ textAlign: a })}
              onClick={() => editor.chain().focus().setTextAlign(a).run()}>
              <span className="block w-[15px] space-y-[2px]" aria-hidden>
                {[0, 1, 2].map(l => (
                  <span key={l} className="block h-[2px] bg-current"
                    style={{
                      width: l === 1 && a !== 'justify' ? '70%' : '100%',
                      marginLeft: l === 1 && a === 'center' ? '15%' : l === 1 && a === 'right' ? '30%' : 0,
                    }} />
                ))}
              </span>
            </Bt>
          ))}
        <Divisor />

        <Bt titulo="Lista com marcadores" ativo={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <Icon nome="lista" tam={15} />
        </Bt>
        <Bt titulo="Lista numerada" ativo={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <span className="hud-tec text-[10px] leading-none px-0.5">1.</span>
        </Bt>
        <Bt titulo="Citação" ativo={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <span className="text-[15px] leading-none px-0.5">"</span>
        </Bt>
      </div>

        <span className="w-px h-5 bg-white/10 mx-1 shrink-0" />
        <button type="button" onClick={() => setMais(v => !v)} title="Mais ferramentas"
          className={`p-1.5 shrink-0 transition-colors ${mais ? 'text-[#00e5ff]' : 'text-white/40 hover:text-white/80'}`}>
          <Icon nome="chevron" tam={15} className={mais ? 'rotate-180' : ''} />
        </button>

        {acoes && <div className="flex items-center gap-1.5 shrink-0 pl-1">{acoes}</div>}
      </div>

      {mais && (
        <div className="flex items-center gap-0.5 px-2 pb-1.5 overflow-x-auto border-t border-white/5 pt-1.5">
          <Bt titulo="Inserir tabela"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Icon nome="grid" tam={15} />
          </Bt>
          <Bt titulo="Adicionar coluna" desabilitado={!editor.can().addColumnAfter()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <span className="hud-tec text-[10px]">+col</span>
          </Bt>
          <Bt titulo="Adicionar linha" desabilitado={!editor.can().addRowAfter()}
            onClick={() => editor.chain().focus().addRowAfter().run()}>
            <span className="hud-tec text-[10px]">+lin</span>
          </Bt>
          <Bt titulo="Remover tabela" desabilitado={!editor.can().deleteTable()}
            onClick={() => editor.chain().focus().deleteTable().run()}>
            <Icon nome="lixeira" tam={14} />
          </Bt>
          <Divisor />
          <Bt titulo="Link" ativo={editor.isActive('link')} onClick={inserirLink}>
            <Icon nome="externo" tam={15} />
          </Bt>
          <Bt titulo="Imagem" onClick={inserirImagem}>
            <Icon nome="olho" tam={15} />
          </Bt>
          <Bt titulo="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <span className="block w-4 h-[2px] bg-current" />
          </Bt>
          <Divisor />
          <Bt titulo="Bloco de indicador"
            onClick={() => editor.chain().focus().inserirIndicador({ valor: '0', rotulo: 'Indicador', cor: '#00e5ff' }).run()}>
            <Icon nome="grafico" tam={15} />
          </Bt>
          <Bt titulo="Selo de evidência"
            onClick={() => editor.chain().focus().inserirSelo({ nivel: 'ESTRATEGIA', texto: 'Afirmação a sustentar' }).run()}>
            <Icon nome="escudo" tam={15} />
          </Bt>
          <Bt titulo="Citação com fonte"
            onClick={() => editor.chain().focus().inserirCitacaoFonte({ texto: 'Trecho citado', fonte: 'Fonte', url: '' }).run()}>
            <Icon nome="documento" tam={15} />
          </Bt>
          <Divisor />
          <Bt titulo="Limpar formatação"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Icon nome="fechar" tam={14} />
          </Bt>
          <Divisor />
          {/* Ver a folha como ela vai sair na impressão, sem sair do editor */}
          <Bt titulo={tema === 'claro' ? 'Folha escura (tela)' : 'Folha clara (impressão)'}
            ativo={tema === 'claro'} onClick={onTema}>
            <Icon nome="sol" tam={15} />
          </Bt>
          <Bt titulo="Imprimir ou salvar em PDF" onClick={() => window.print()}>
            <Icon nome="download" tam={15} />
          </Bt>
        </div>
      )}
    </div>
  );
}

function Seletor({ titulo, icone, cores, onEscolher, onLimpar }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative shrink-0">
      <Bt titulo={titulo} ativo={aberto} onClick={() => setAberto(v => !v)}>
        <Icon nome={icone} tam={15} />
      </Bt>
      {aberto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAberto(false)} />
          <div className="absolute top-full left-0 mt-1 z-30 hud-painel hud-p p-2 flex gap-1.5"
            style={{ '--cor': '#00e5ff85' }}>
            {cores.map(c => (
              <button key={c} type="button" title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onEscolher(c); setAberto(false); }}
                className="w-5 h-5 hud-corte" style={{ '--c': '4px', background: c, boxShadow: 'inset 0 0 0 1px #ffffff22' }} />
            ))}
            <button type="button" title="Remover"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onLimpar(); setAberto(false); }}
              className="w-5 h-5 text-white/40 hover:text-[#ff4d8d] flex items-center justify-center">
              <Icon nome="fechar" tam={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
