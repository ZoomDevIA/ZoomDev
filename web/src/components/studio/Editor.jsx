import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

// ═══════════════════════════════════════════════════════════════════════════
// EDITOR DE CÓDIGO — CodeMirror 6 embrulhado para o Studio.
//
// Duas decisões que evitam os bugs clássicos de embutir CodeMirror em React:
//
//  1. A instância é criada UMA vez e vive num ref. Recriá-la a cada render
//     perderia o cursor, o histórico de desfazer e a rolagem.
//  2. Quando o conteúdo muda por fora (o agente reescreveu o arquivo), o
//     texto é trocado por transação, não recriando o estado. E a troca só
//     acontece se o texto for realmente diferente, senão cada tecla digitada
//     voltaria como "mudança externa" e o cursor pularia para o começo.
// ═══════════════════════════════════════════════════════════════════════════

const linguagem = new Compartment();
const somenteLeituraComp = new Compartment();

function idiomaDe(arquivo = '') {
  if (arquivo.endsWith('.js') || arquivo.endsWith('.jsx') || arquivo.endsWith('.json')) return javascript();
  if (arquivo.endsWith('.css')) return css();
  if (arquivo.endsWith('.html') || arquivo.endsWith('.htm')) return html();
  return [];
}

export default function Editor({ arquivo, valor = '', onMudar, somenteLeitura = false }) {
  const caixa = useRef(null);
  const vista = useRef(null);
  const onMudarRef = useRef(onMudar);
  onMudarRef.current = onMudar;

  // Monta uma vez
  useEffect(() => {
    if (!caixa.current) return;
    const v = new EditorView({
      parent: caixa.current,
      state: EditorState.create({
        doc: valor,
        extensions: [
          basicSetup,
          oneDark,
          linguagem.of(idiomaDe(arquivo)),
          somenteLeituraComp.of(EditorState.readOnly.of(somenteLeitura)),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': { height: '100%', fontSize: '12.5px', background: 'transparent' },
            '.cm-scroller': { fontFamily: '"JetBrains Mono", ui-monospace, monospace' },
            '.cm-gutters': { background: '#06140d', border: 'none', color: '#ffffff2e' },
            '.cm-activeLine': { background: '#00e5ff0a' },
            '.cm-activeLineGutter': { background: '#00e5ff14', color: '#00e5ff' },
            '&.cm-focused': { outline: 'none' },
          }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onMudarRef.current?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    vista.current = v;
    return () => { v.destroy(); vista.current = null; };
  }, []);

  // Troca de arquivo ou reescrita vinda do agente
  useEffect(() => {
    const v = vista.current;
    if (!v) return;
    if (v.state.doc.toString() !== valor) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: valor } });
    }
    v.dispatch({ effects: linguagem.reconfigure(idiomaDe(arquivo)) });
  }, [arquivo, valor]);

  useEffect(() => {
    vista.current?.dispatch({
      effects: somenteLeituraComp.reconfigure(EditorState.readOnly.of(somenteLeitura)),
    });
  }, [somenteLeitura]);

  return <div ref={caixa} className="h-full overflow-hidden" />;
}
