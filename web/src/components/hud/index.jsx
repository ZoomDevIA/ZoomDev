import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES HUD — a superfície React sobre as primitivas de hud.css.
//
// A regra que mantém a coerência: nenhuma tela desenha borda, chanfro ou
// medidor por conta própria. Tudo passa por aqui. Quando o desenho da moldura
// mudar, muda em um lugar só.
//
// Cada componente aceita `cor` (hex) e repassa como variável CSS, de modo que
// um painel de agente roxo e um de carbono ciano usem a mesma estrutura.
// ═══════════════════════════════════════════════════════════════════════════

const CIANO = '#00e5ff';

/** Converte hex + alfa (0 a 255) na notação #rrggbbaa. */
function tom(hex, alfa) {
  return `${hex}${alfa.toString(16).padStart(2, '0')}`;
}

const BASE_PAINEL = [0x06, 0x14, 0x0d];

/**
 * Mistura a cor do agente sobre o fundo escuro do painel e devolve um hex
 * OPACO. O preenchimento do painel HUD não pode ser translúcido: ele cobre a
 * camada da borda, e qualquer transparência deixa a borda vazar e pintar o
 * cartão inteiro.
 */
export function tingir(hex, intensidade = 0.08) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const m = rgb.map((c, i) => Math.round(BASE_PAINEL[i] + (c - BASE_PAINEL[i]) * intensidade));
  return `#${m.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

// ── Painel ────────────────────────────────────────────────────────────────
export function Painel({
  children, cor = CIANO, aceso = false, quatroCantos = false,
  tamanho = '', vivo = false, className = '', style, ...resto
}) {
  return (
    <div
      className={`hud-painel ${quatroCantos ? 'hud-4' : ''} ${aceso ? 'hud-aceso' : ''} ${
        tamanho === 'p' ? 'hud-p' : tamanho === 'g' ? 'hud-g' : ''} ${vivo ? 'hud-vivo' : ''} ${className}`}
      style={{ '--cor': aceso ? tom(cor, 0x8a) : tom(cor, 0x3d), ...style }}
      {...resto}
    >
      {children}
    </div>
  );
}

// ── Cantoneiras ───────────────────────────────────────────────────────────
export function Cantoneira({ children, cor = CIANO, tam = 14, className = '', style, ...resto }) {
  return (
    <div className={`hud-cantoneira ${className}`}
      style={{ '--cor': tom(cor, 0x99), '--tam': `${tam}px`, ...style }} {...resto}>
      {children}
    </div>
  );
}

// ── Rótulo com linha-guia ─────────────────────────────────────────────────
export function Rotulo({ children, cor = CIANO, ponto = true, className = '', style }) {
  return (
    <div className={`hud-rotulo ${ponto ? 'ponto' : ''} ${className}`}
      style={{ color: cor, ...style }}>
      {children}
    </div>
  );
}

// ── Divisor angular ───────────────────────────────────────────────────────
export function Divisor({ children, className = '' }) {
  return (
    <div className={`hud-divisor ${className}`}>
      {children && <span className="hud-caps text-[10px] shrink-0">{children}</span>}
    </div>
  );
}

// ── Etiqueta ──────────────────────────────────────────────────────────────
export function Etiqueta({ children, cor = CIANO, className = '', ...resto }) {
  return (
    <span className={`hud-etiqueta ${className}`}
      style={{ color: cor, background: tom(cor, 0x14), boxShadow: `inset 0 0 0 1px ${tom(cor, 0x3d)}` }}
      {...resto}>
      {children}
    </span>
  );
}

// ── Barra segmentada ──────────────────────────────────────────────────────
export function Barra({ valor = 0, cor = CIANO, altura = 10, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(valor) || 0));
  return (
    <div className={`hud-barra ${className}`}
      style={{ height: altura, color: cor, borderColor: tom(cor, 0x3d) }}
      role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Medidor circular ──────────────────────────────────────────────────────
export function Anel({ valor = 0, cor = CIANO, tam = 74, children, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(valor) || 0));
  return (
    <div className={`hud-anel ${className}`}
      style={{ '--pct': pct, '--cor': cor, width: tam, height: tam }}>
      <div className="text-center leading-none">
        {children ?? <span className="hud-tec font-bold text-sm" style={{ color: cor }}>{Math.round(pct)}</span>}
      </div>
    </div>
  );
}

// ── Abas ──────────────────────────────────────────────────────────────────
export function Abas({ itens, ativo, onMudar, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="tablist">
      {itens.map(it => (
        <button
          key={it.id}
          role="tab"
          aria-selected={ativo === it.id}
          onClick={() => onMudar(it.id)}
          className={`hud-aba hud-caps px-3.5 py-2 text-[11px] flex items-center gap-1.5 ${
            ativo === it.id ? 'ativa' : ''}`}
        >
          {it.icone}{it.label}
        </button>
      ))}
    </div>
  );
}

// ── Botões ────────────────────────────────────────────────────────────────
export function Botao({ children, variante = 'cheio', className = '', ...resto }) {
  const base = variante === 'cheio' ? 'hud-botao' : 'hud-botao-vazio';
  return (
    <button className={`${base} inline-flex items-center justify-center gap-2 ${className}`} {...resto}>
      {children}
    </button>
  );
}

// ── Campo de texto ────────────────────────────────────────────────────────
export function Campo({ multilinha = false, className = '', ...resto }) {
  const Tag = multilinha ? 'textarea' : 'input';
  return <Tag className={`hud-campo ${className}`} {...resto} />;
}

// ── Bloco de estatística ──────────────────────────────────────────────────
export function Estatistica({ valor, rotulo, cor = CIANO, icone = null, className = '' }) {
  return (
    <Painel tamanho="p" cor={cor} className={`p-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        {icone && <span style={{ color: cor }}>{icone}</span>}
        <div className="hud-tec font-bold text-xl leading-none" style={{ color: cor }}>{valor}</div>
      </div>
      <div className="hud-caps text-[9px] text-white/40 mt-1.5 leading-tight">{rotulo}</div>
    </Painel>
  );
}

// ── Marcador de estado ────────────────────────────────────────────────────
export function Pulso({ cor = '#00ff64', ativo = true, titulo, className = '' }) {
  return (
    <span
      className={`${ativo ? 'hud-pulso' : ''} shrink-0 ${className}`}
      style={ativo ? { color: cor } : {
        width: 7, height: 7, background: '#ffffff24', transform: 'rotate(45deg)', display: 'inline-block',
      }}
      title={titulo}
      aria-hidden={!titulo}
    />
  );
}

// ── Cabeçalho de seção ────────────────────────────────────────────────────
// Rótulo à esquerda, linha até a borda e ação opcional à direita.
export function Secao({ rotulo, titulo, descricao, cor = CIANO, acao = null, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <Rotulo cor={cor}>{rotulo}</Rotulo>
          {titulo && <h2 className="font-heading text-lg md:text-xl font-bold mt-1.5">{titulo}</h2>}
          {descricao && <p className="text-white/45 text-[13px] mt-1 max-w-2xl">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
