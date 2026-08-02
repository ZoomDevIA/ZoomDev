import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Color, FontFamily, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import Barra from './Barra.jsx';
import Sumario from './Sumario.jsx';
import { BlocoIndicador, BlocoSelo, BlocoCitacaoFonte } from './blocos.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// ZOOMDOC — o editor de documentos da plataforma.
//
// Não é um clone do Word: é um editor feito para UM documento, o plano de
// negócios, e por isso faz melhor as quarenta coisas que esse documento pede
// em vez de fazer mal as mil que o Word acumulou.
//
// O núcleo é ProseMirror pelo TipTap. A camada ZoomDev por cima entrega:
//   · página A4 com margem, quebra visível e numeração
//   · estilos de parágrafo da marca, não uma lista genérica de fontes
//   · blocos vivos: indicador, selo de evidência, citação com fonte
//   · sumário que se reconstrói a cada alteração de título
//   · salvamento automático com marca de tempo
//
// A rolagem fica no contêiner das páginas, não na janela: assim a barra de
// ferramentas e o sumário permanecem fixos enquanto o texto corre.
// ═══════════════════════════════════════════════════════════════════════════

const CHAVE_TEMA = 'zd_doc_tema';

const FONTES = [
  { id: '', label: 'Padrão ZoomDev', css: '' },
  { id: 'inter', label: 'Inter', css: 'Inter, sans-serif' },
  { id: 'grotesk', label: 'Space Grotesk', css: '"Space Grotesk", sans-serif' },
  { id: 'mono', label: 'JetBrains Mono', css: '"JetBrains Mono", monospace' },
  { id: 'georgia', label: 'Georgia', css: 'Georgia, serif' },
  { id: 'times', label: 'Times New Roman', css: '"Times New Roman", serif' },
  { id: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
];

export default function ZoomDoc({
  conteudo,
  aoMudar,
  somenteLeitura = false,
  titulo = 'Plano de Negócios',
  subtitulo,
  salvandoEm = null,
  acoes = null,
}) {
  const [sumarioAberto, setSumarioAberto] = useState(true);
  const [estrutura, setEstrutura] = useState([]);
  const [tema, setTema] = useState(() => localStorage.getItem(CHAVE_TEMA) || 'escuro');

  useEffect(() => { localStorage.setItem(CHAVE_TEMA, tema); }, [tema]);

  const editor = useEditor({
    editable: !somenteLeitura,
    extensions: [
      // Na versão 3 do TipTap o StarterKit já traz sublinhado e link: reimportar
      // as duas extensões registraria o mesmo nó duas vezes.
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'zd-codigo' } },
        link: { openOnClick: false, HTMLAttributes: { rel: 'noreferrer noopener' } },
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'zd-imagem' } }),
      Placeholder.configure({ placeholder: 'Comece a escrever, ou peça um ajuste no console ao lado…' }),
      CharacterCount,
      Table.configure({ resizable: true, HTMLAttributes: { class: 'zd-tabela' } }),
      TableRow, TableHeader, TableCell,
      BlocoIndicador, BlocoSelo, BlocoCitacaoFonte,
    ],
    content: conteudo || '',
    onUpdate: ({ editor: ed }) => {
      aoMudar?.(ed.getHTML());
      setEstrutura(extrairEstrutura(ed));
    },
    editorProps: {
      attributes: {
        class: 'zd-pagina-conteudo outline-none',
        spellcheck: 'true',
      },
    },
  }, [somenteLeitura]);

  // Conteúdo trocado por fora (o agente reescreveu o documento)
  //
  // O `isDestroyed` não é zelo excessivo: em modo estrito o React monta,
  // desmonta e remonta o componente, e o efeito ainda roda uma vez segurando
  // a instância antiga do editor. Sem essa guarda, a página quebra ao abrir.
  useEffect(() => {
    if (!vivo(editor) || conteudo == null) return;
    if (editor.getHTML() === conteudo) return;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(conteudo, false);
    // Preserva o cursor quando possível: reescrever o documento embaixo de
    // alguém que está digitando é a pior coisa que um editor pode fazer.
    try { editor.commands.setTextSelection({ from, to }); } catch { /* fora de alcance */ }
    setEstrutura(extrairEstrutura(editor));
  }, [conteudo, editor]);

  useEffect(() => { if (vivo(editor)) setEstrutura(extrairEstrutura(editor)); }, [editor]);

  const irPara = useCallback((pos) => {
    if (!vivo(editor)) return;
    editor.commands.focus();
    editor.commands.setTextSelection(pos);
    const el = editor.view.domAtPos(pos)?.node;
    (el?.nodeType === 1 ? el : el?.parentElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [editor]);

  const palavras = vivo(editor) ? editor.storage.characterCount.words() : 0;
  const paginas = Math.max(1, Math.ceil(palavras / 480));

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0a1410]">
      {!somenteLeitura && (
        <Barra editor={editor} fontes={FONTES}
          sumarioAberto={sumarioAberto} onSumario={() => setSumarioAberto(v => !v)}
          tema={tema} onTema={() => setTema(t => (t === 'claro' ? 'escuro' : 'claro'))}
          acoes={acoes} />
      )}

      <div className="flex-1 flex min-h-0">
        {sumarioAberto && estrutura.length > 0 && (
          <Sumario estrutura={estrutura} onIr={irPara} />
        )}

        <div className="flex-1 overflow-y-auto min-w-0 zd-folha" data-tema={tema}>
          <div className="zd-pagina">
            <header className="zd-cabecalho">
              <div className="zd-marca">
                <img src="/assets/logo.png" alt="" width="20" height="20" />
                <span>ZOOMDEV OS</span>
              </div>
              <h1 className="zd-titulo-doc">{titulo}</h1>
              {subtitulo && <p className="zd-subtitulo-doc">{subtitulo}</p>}
            </header>

            <EditorContent editor={editor} />

            <footer className="zd-rodape-doc">
              <span>{titulo}</span>
              <span>Gerado na ZoomDev OS</span>
            </footer>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[#00e5ff1f] flex items-center gap-3 shrink-0 hud-tec text-[9px] text-white/32">
        <span>{palavras} palavras</span>
        <span className="text-white/12">|</span>
        <span>~{paginas} página{paginas > 1 ? 's' : ''}</span>
        {salvandoEm && (
          <>
            <span className="text-white/12">|</span>
            <span className="text-[#00ff64]">salvo {salvandoEm}</span>
          </>
        )}
        {somenteLeitura && (
          <span className="ml-auto text-[#ffc531]">somente leitura</span>
        )}
      </div>
    </div>
  );
}

/** Editor existente e ainda não destruído: usar um destruído derruba a página. */
const vivo = (editor) => Boolean(editor && !editor.isDestroyed);

/** Lê os títulos do documento para montar o sumário. */
function extrairEstrutura(editor) {
  const itens = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const texto = node.textContent.trim();
      if (texto) itens.push({ nivel: node.attrs.level, texto, pos: pos + 1 });
    }
  });
  return itens;
}
