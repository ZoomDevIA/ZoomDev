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
//
// ── Por que `cor` não tem valor padrão ────────────────────────────────────
// Sem cor pedida, o componente NÃO escreve estilo em linha: deixa a folha de
// estilo decidir, e a folha usa a variável de tema. Um padrão fixo aqui, por
// mais discreto que fosse, venceria a escolha da pessoa em todo painel da
// plataforma, e o tema viraria enfeite.
//
// Quando a cor É passada, ela é semântica (roxo é ciência, magenta é erro, a
// cor de um agente é a identidade dele) e deve mesmo vencer o tema.
// ═══════════════════════════════════════════════════════════════════════════

/** Cor de acento vinda do tema, para quando o valor precisa ir em linha. */
export const ACENTO = 'var(--zd-acento)';
export const MARCA = 'var(--zd-marca)';

/**
 * Aplica alfa (0 a 255) a uma cor.
 *
 * Hex vira a notação #rrggbbaa, que é curta e barata. Qualquer outra coisa,
 * inclusive `var(--zd-acento)`, passa por color-mix: sem isso, concatenar o
 * alfa produziria `var(--zd-acento)8a`, que o navegador descarta em silêncio e
 * deixa o elemento sem cor nenhuma.
 */
function tom(cor, alfa) {
  if (typeof cor === 'string' && cor.startsWith('#')) {
    return `${cor}${alfa.toString(16).padStart(2, '0')}`;
  }
  return `color-mix(in srgb, ${cor} ${Math.round((alfa / 255) * 100)}%, transparent)`;
}

const BASE_PAINEL = [0x06, 0x14, 0x0d];

/**
 * Mistura a cor do agente sobre o fundo escuro do painel e devolve um hex
 * OPACO. O preenchimento do painel HUD não pode ser translúcido: ele cobre a
 * camada da borda, e qualquer transparência deixa a borda vazar e pintar o
 * cartão inteiro.
 */
export function tingir(hex, intensidade = 0.08) {
  // Precisa de canais para misturar: sem hex, devolve o fundo do painel do tema.
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 'var(--zd-painel)';
  const n = parseInt(String(hex).replace('#', ''), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const m = rgb.map((c, i) => Math.round(BASE_PAINEL[i] + (c - BASE_PAINEL[i]) * intensidade));
  return `#${m.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

// ── Painel ────────────────────────────────────────────────────────────────
export function Painel({
  children, cor, aceso = false, quatroCantos = false,
  tamanho = '', vivo = false, className = '', style, ...resto
}) {
  return (
    <div
      className={`hud-painel ${quatroCantos ? 'hud-4' : ''} ${aceso ? 'hud-aceso' : ''} ${
        tamanho === 'p' ? 'hud-p' : tamanho === 'g' ? 'hud-g' : ''} ${vivo ? 'hud-vivo' : ''} ${className}`}
      style={cor ? { '--cor': aceso ? tom(cor, 0x8a) : tom(cor, 0x3d), ...style } : style}
      {...resto}
    >
      {children}
    </div>
  );
}

// ── Cantoneiras ───────────────────────────────────────────────────────────
export function Cantoneira({ children, cor, tam = 14, className = '', style, ...resto }) {
  return (
    <div className={`hud-cantoneira ${className}`}
      style={{ ...(cor ? { '--cor': tom(cor, 0x99) } : {}), '--tam': `${tam}px`, ...style }} {...resto}>
      {children}
    </div>
  );
}

// ── Rótulo com linha-guia ─────────────────────────────────────────────────
export function Rotulo({ children, cor, ponto = true, className = '', style }) {
  return (
    <div className={`hud-rotulo ${ponto ? 'ponto' : ''} ${className}`}
      style={{ color: cor || ACENTO, ...style }}>
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
export function Etiqueta({ children, cor, className = '', ...resto }) {
  return (
    <span className={`hud-etiqueta ${className}`}
      // A cor entra como VARIÁVEL, não como `color` inline. Estilo inline vence
      // qualquer folha, e era isso que impedia o tema claro de escurecer a
      // etiqueta: no papel, âmbar puro como texto tem contraste 1,0.
      style={cor
        ? { '--cor': cor, background: tom(cor, 0x14), boxShadow: `inset 0 0 0 1px ${tom(cor, 0x3d)}` }
        : undefined}
      {...resto}>
      {children}
    </span>
  );
}

// ── Barra segmentada ──────────────────────────────────────────────────────
export function Barra({ valor = 0, cor, altura = 10, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(valor) || 0));
  return (
    <div className={`hud-barra ${className}`}
      style={{ height: altura, color: cor || ACENTO, ...(cor ? { borderColor: tom(cor, 0x3d) } : {}) }}
      role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Medidor circular ──────────────────────────────────────────────────────
export function Anel({ valor = 0, cor, tam = 74, children, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(valor) || 0));
  const c = cor || ACENTO;
  return (
    <div className={`hud-anel ${className}`}
      style={{ '--pct': pct, '--cor': c, width: tam, height: tam }}>
      <div className="text-center leading-none">
        {children ?? <span className="hud-tec font-bold text-sm" style={{ color: c }}>{Math.round(pct)}</span>}
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
export function Estatistica({ valor, rotulo, cor, icone = null, className = '' }) {
  const c = cor || ACENTO;
  return (
    <Painel tamanho="p" cor={cor} className={`p-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        {icone && <span style={{ color: c }}>{icone}</span>}
        <div className="hud-tec font-bold text-xl leading-none" style={{ color: c }}>{valor}</div>
      </div>
      <div className="hud-caps text-[9px] text-white/40 mt-1.5 leading-tight">{rotulo}</div>
    </Painel>
  );
}

// ── Marcador de estado ────────────────────────────────────────────────────
export function Pulso({ cor = MARCA, ativo = true, titulo, className = '' }) {
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
export function Secao({ rotulo, titulo, descricao, cor, acao = null, children }) {
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
