import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

// ═══════════════════════════════════════════════════════════════════════════
// BLOCOS VIVOS DO ZOOMDOC
//
// Um plano de negócios não é só prosa. Ele tem três coisas que o Word só
// consegue imitar desenhando caixinhas à mão, e que aqui são estrutura de
// verdade, com atributos que o sistema lê:
//
//   INDICADOR       um número que sustenta um argumento
//   SELO            o grau de evidência daquela afirmação
//   CITAÇÃO/FONTE   de onde veio o dado, com o endereço junto
//
// Sendo nós do documento e não formatação, o selo continua legível para o
// motor que calcula o grau de evidência do plano inteiro pela regra do elo
// mais fraco. Uma caixinha desenhada à mão não teria como ser lida.
//
// Todos guardam os atributos em data-* no HTML, então o documento salvo é
// texto puro e volta idêntico na próxima abertura.
// ═══════════════════════════════════════════════════════════════════════════

// ── Selo de Evidência ─────────────────────────────────────────────────────
// A escala é a mesma da doutrina da plataforma. Abaixo de 75 a afirmação não
// sustenta crédito de carbono, e o selo diz isso na cara do leitor.
export const NIVEIS_SELO = [
  { id: 'VERIFICADO', peso: 100, cor: '#00ff64', desc: 'Documento oficial conferido' },
  { id: 'LAUDO', peso: 90, cor: '#00e5ff', desc: 'Laudo técnico assinado' },
  { id: 'CAMPO', peso: 80, cor: '#7dd3a0', desc: 'Medição em campo' },
  { id: 'PESQUISA', peso: 75, cor: '#ffc531', desc: 'Literatura científica' },
  { id: 'ESTRATEGIA', peso: 60, cor: '#ff9f43', desc: 'Projeção estratégica' },
  { id: 'HIPOTESE', peso: 50, cor: '#ff4d8d', desc: 'Hipótese a testar' },
  { id: 'VISAO', peso: 10, cor: '#a855f7', desc: 'Visão de futuro' },
];

export const seloDe = (id) => NIVEIS_SELO.find(n => n.id === id) || NIVEIS_SELO[4];

// Atributo que vira data-* no HTML e volta na leitura, sem cerimônia.
const attr = (nome, padrao = '') => ({
  default: padrao,
  parseHTML: (el) => el.getAttribute(`data-${nome}`) ?? padrao,
  renderHTML: (attrs) => (attrs[nome] ? { [`data-${nome}`]: attrs[nome] } : {}),
});

// ═══════════════════════════════════════════════════════════════════════════
// INDICADOR
// ═══════════════════════════════════════════════════════════════════════════

function VistaIndicador({ node, updateAttributes, editor }) {
  const { valor, rotulo, nota, cor } = node.attrs;
  const editavel = editor.isEditable;
  return (
    <NodeViewWrapper className="zd-bloco-indicador" style={{ '--cor': cor || '#00e5ff' }}>
      <div className="zd-bi-barra" />
      <div className="zd-bi-corpo">
        <Campo valor={valor} editavel={editavel} className="zd-bi-valor"
          placeholder="0" onMudar={(v) => updateAttributes({ valor: v })} />
        <Campo valor={rotulo} editavel={editavel} className="zd-bi-rotulo"
          placeholder="o que este número mede" onMudar={(v) => updateAttributes({ rotulo: v })} />
        {(nota || editavel) && (
          <Campo valor={nota} editavel={editavel} className="zd-bi-nota"
            placeholder="base de cálculo ou período" onMudar={(v) => updateAttributes({ nota: v })} />
        )}
      </div>
      {editavel && (
        <div className="zd-bloco-cores" contentEditable={false}>
          {['#00e5ff', '#00ff64', '#ffc531', '#ff4d8d', '#a855f7'].map(c => (
            <button key={c} type="button" title={`Cor ${c}`} onClick={() => updateAttributes({ cor: c })}
              className="zd-bloco-cor" style={{ background: c, outline: cor === c ? '1px solid #fff' : 'none' }} />
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const BlocoIndicador = Node.create({
  name: 'blocoIndicador',
  group: 'block',
  atom: true,               // não tem conteúdo editável por dentro: os campos são atributos
  draggable: true,

  addAttributes: () => ({
    valor: attr('valor', '0'),
    rotulo: attr('rotulo', 'Indicador'),
    nota: attr('nota', ''),
    cor: attr('cor', '#00e5ff'),
  }),

  parseHTML: () => [{ tag: 'div[data-bloco="indicador"]' }],
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-bloco': 'indicador', class: 'zd-bloco-indicador' })];
  },
  addNodeView() { return ReactNodeViewRenderer(VistaIndicador); },

  addCommands() {
    return {
      inserirIndicador: (attrs = {}) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// SELO DE EVIDÊNCIA
// ═══════════════════════════════════════════════════════════════════════════

function VistaSelo({ node, updateAttributes, editor }) {
  const { nivel, texto, fonte } = node.attrs;
  const s = seloDe(nivel);
  const editavel = editor.isEditable;
  return (
    <NodeViewWrapper className="zd-bloco-selo" style={{ '--cor': s.cor }}>
      <div className="zd-selo-topo" contentEditable={false}>
        {editavel ? (
          <select value={nivel} onChange={(e) => updateAttributes({ nivel: e.target.value })}
            className="zd-selo-select" style={{ color: s.cor }}>
            {NIVEIS_SELO.map(n => <option key={n.id} value={n.id}>{n.id} · {n.peso}%</option>)}
          </select>
        ) : (
          <span className="zd-selo-etiqueta" style={{ color: s.cor }}>{s.id} · {s.peso}%</span>
        )}
        <span className="zd-selo-desc">{s.desc}</span>
        {s.peso < 75 && (
          <span className="zd-selo-aviso" title="Abaixo de 75% não sustenta crédito de carbono">
            não sustenta crédito
          </span>
        )}
      </div>
      <Campo valor={texto} editavel={editavel} className="zd-selo-texto"
        placeholder="A afirmação que este selo qualifica"
        onMudar={(v) => updateAttributes({ texto: v })} />
      {(fonte || editavel) && (
        <Campo valor={fonte} editavel={editavel} className="zd-selo-fonte"
          placeholder="origem da evidência"
          onMudar={(v) => updateAttributes({ fonte: v })} />
      )}
    </NodeViewWrapper>
  );
}

export const BlocoSelo = Node.create({
  name: 'blocoSelo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes: () => ({
    nivel: attr('nivel', 'ESTRATEGIA'),
    texto: attr('texto', ''),
    fonte: attr('fonte', ''),
  }),

  parseHTML: () => [{ tag: 'div[data-bloco="selo"]' }],
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-bloco': 'selo', class: 'zd-bloco-selo' })];
  },
  addNodeView() { return ReactNodeViewRenderer(VistaSelo); },

  addCommands() {
    return {
      inserirSelo: (attrs = {}) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// CITAÇÃO COM FONTE
// ═══════════════════════════════════════════════════════════════════════════

function VistaCitacao({ node, updateAttributes, editor }) {
  const { texto, fonte, url } = node.attrs;
  const editavel = editor.isEditable;
  return (
    <NodeViewWrapper className="zd-bloco-citacao">
      <Campo valor={texto} editavel={editavel} className="zd-cit-texto" multilinha
        placeholder="Trecho citado" onMudar={(v) => updateAttributes({ texto: v })} />
      <div className="zd-cit-rodape">
        <Campo valor={fonte} editavel={editavel} className="zd-cit-fonte"
          placeholder="autor, obra ou instituição" onMudar={(v) => updateAttributes({ fonte: v })} />
        {editavel ? (
          <Campo valor={url} editavel className="zd-cit-url"
            placeholder="endereço (opcional)" onMudar={(v) => updateAttributes({ url: v })} />
        ) : url ? (
          <a href={url} target="_blank" rel="noreferrer noopener" className="zd-cit-url">{url}</a>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const BlocoCitacaoFonte = Node.create({
  name: 'blocoCitacaoFonte',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes: () => ({
    texto: attr('texto', ''),
    fonte: attr('fonte', ''),
    url: attr('url', ''),
  }),

  parseHTML: () => [{ tag: 'div[data-bloco="citacao"]' }],
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-bloco': 'citacao', class: 'zd-bloco-citacao' })];
  },
  addNodeView() { return ReactNodeViewRenderer(VistaCitacao); },

  addCommands() {
    return {
      inserirCitacaoFonte: (attrs = {}) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});

// ── Campo de texto de atributo ────────────────────────────────────────────
// contentEditable puro, sem estado de React: o valor mora no atributo do nó.
// Escrever de volta a cada tecla remontaria o cursor no início, então a
// gravação acontece na saída do campo.
function Campo({ valor, editavel, className, placeholder, multilinha = false, onMudar }) {
  if (!editavel) {
    return <div className={className}>{valor || ''}</div>;
  }
  return (
    <div
      className={`${className} zd-campo-bloco`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onMudar(e.currentTarget.textContent.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multilinha) { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') e.currentTarget.blur();
        e.stopPropagation();   // as teclas do bloco não são atalhos do editor
      }}
    >
      {valor || ''}
    </div>
  );
}
