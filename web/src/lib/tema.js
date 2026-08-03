// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DE TEMA — a aparência nas mãos de quem usa.
//
// Toda a camada HUD é desenhada a partir de variáveis CSS. Este arquivo é
// quem escreve essas variáveis em :root, e por isso é o único lugar do
// sistema que decide como a plataforma se parece.
//
// A separação que sustenta o desenho:
//
//   COR DE TEMA      estrutura. Borda, linha-guia, aba ativa, campo, botão.
//                    Muda com o gosto de quem usa.
//   COR SEMÂNTICA    significado. Magenta é erro, roxo é ciência, âmbar é
//                    prazo, cada agente tem a sua. NÃO muda, porque mudar
//                    quebraria a leitura.
//
// O tema fica no navegador e também no perfil do servidor: assim ele segue a
// pessoa de um aparelho para outro, em vez de morar só no computador onde foi
// escolhido.
// ═══════════════════════════════════════════════════════════════════════════

export const CHAVE = 'zd_tema';

// ── Superfícies ───────────────────────────────────────────────────────────
// Cada fundo traz a escada inteira, do papel ao campo de texto. Derivar por
// cálculo daria tons lavados: a escada é escolhida à mão, tom a tom.
export const FUNDOS = {
  profundo: {
    nome: 'Profundo',
    descricao: 'O verde-noite original da ZoomDev.',
    pagina: '#030d07', painel: '#06140d', solido: '#04140a',
    elevado: '#0a1a12', hover: '#0e2419', campo: '#07170f',
  },
  carbono: {
    nome: 'Carbono',
    descricao: 'Cinza neutro. A cor não disputa com o conteúdo.',
    pagina: '#08090b', painel: '#101216', solido: '#0c0e11',
    elevado: '#171a20', hover: '#1f232b', campo: '#121419',
  },
  floresta: {
    nome: 'Floresta',
    descricao: 'Verde mais presente, para trilha de bioeconomia.',
    pagina: '#04120c', painel: '#082017', solido: '#061a13',
    elevado: '#0c2c20', hover: '#113828', campo: '#09221a',
  },
  vazio: {
    nome: 'Vazio',
    descricao: 'Preto absoluto. Contraste máximo em tela OLED.',
    pagina: '#000000', painel: '#0a0a0b', solido: '#060607',
    elevado: '#121214', hover: '#1b1b1e', campo: '#0d0d0f',
  },
};

// ── Acentos ───────────────────────────────────────────────────────────────
export const ACENTOS = [
  { id: 'ciano', nome: 'Ciano', hex: '#00e5ff' },
  { id: 'verde', nome: 'Verde', hex: '#00ff64' },
  { id: 'ambar', nome: 'Âmbar', hex: '#ffc531' },
  { id: 'magenta', nome: 'Magenta', hex: '#ff4d8d' },
  { id: 'roxo', nome: 'Roxo', hex: '#a855f7' },
  { id: 'gelo', nome: 'Gelo', hex: '#8ab4ff' },
  { id: 'lima', nome: 'Lima', hex: '#b8ff3d' },
  { id: 'coral', nome: 'Coral', hex: '#ff7a45' },
];

// ── Tipografia ────────────────────────────────────────────────────────────
// Só as três famílias que já estão servidas da própria origem. Oferecer uma
// quarta significaria voltar a buscar fonte de fora, e foi justamente isso que
// o pacote de blindagem tirou do caminho.
export const FONTES = {
  grotesk: { nome: 'Space Grotesk', css: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
  inter: { nome: 'Inter', css: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  mono: { nome: 'JetBrains Mono', css: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
  sistema: { nome: 'Do sistema', css: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
};

// ── Geometria ─────────────────────────────────────────────────────────────
export const ARESTAS = {
  reto: { nome: 'Reto', c: '0px', p: '0px', g: '0px' },
  chanfro: { nome: 'Chanfro', c: '10px', p: '6px', g: '16px' },
  largo: { nome: 'Chanfro largo', c: '16px', p: '10px', g: '24px' },
};

export const DENSIDADES = {
  compacto: { nome: 'Compacto', raiz: '14.5px' },
  confortavel: { nome: 'Confortável', raiz: '16px' },
  amplo: { nome: 'Amplo', raiz: '17.5px' },
};

export const MOVIMENTOS = {
  completo: 'Completo',
  reduzido: 'Reduzido',
  desligado: 'Desligado',
};

// ── Padrão ────────────────────────────────────────────────────────────────
// O sistema pode pedir menos movimento, e essa preferência vale como padrão de
// fábrica: quem tem enjoo de animação não deveria precisar descobrir a opção.
function movimentoDoSistema() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'completo';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduzido' : 'completo';
}

export function padrao() {
  return {
    acento: '#00e5ff',
    marca: '#00ff64',
    fundo: 'profundo',
    fonteTitulo: 'grotesk',
    fonteCorpo: 'inter',
    arestas: 'chanfro',
    densidade: 'confortavel',
    textura: true,
    movimento: movimentoDoSistema(),
    som: true,
    volume: 0.35,
  };
}

// ── Contraste ─────────────────────────────────────────────────────────────
// Sem esta trava, dá para escolher um acento que some no fundo e concluir que
// a plataforma quebrou. O aviso aparece antes de aplicar.
function canais(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia(hex) {
  const [r, g, b] = canais(hex).map(c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

/** Contraste mínimo de 3:1, o piso da WCAG para elemento gráfico e texto grande. */
export function acentoLegivel(hex, fundoId) {
  const f = FUNDOS[fundoId] || FUNDOS.profundo;
  return contraste(hex, f.pagina) >= 3;
}

// ── Normalização ──────────────────────────────────────────────────────────
// Tema vindo do servidor, do localStorage ou de uma versão antiga do app pode
// trazer qualquer coisa. Nada é aplicado sem passar por aqui.
export function normalizar(bruto) {
  const p = padrao();
  const t = { ...p, ...(bruto && typeof bruto === 'object' ? bruto : {}) };
  return {
    acento: HEX_VALIDO.test(t.acento) ? t.acento.toLowerCase() : p.acento,
    marca: HEX_VALIDO.test(t.marca) ? t.marca.toLowerCase() : p.marca,
    fundo: FUNDOS[t.fundo] ? t.fundo : p.fundo,
    fonteTitulo: FONTES[t.fonteTitulo] ? t.fonteTitulo : p.fonteTitulo,
    fonteCorpo: FONTES[t.fonteCorpo] ? t.fonteCorpo : p.fonteCorpo,
    arestas: ARESTAS[t.arestas] ? t.arestas : p.arestas,
    densidade: DENSIDADES[t.densidade] ? t.densidade : p.densidade,
    textura: Boolean(t.textura),
    movimento: MOVIMENTOS[t.movimento] ? t.movimento : p.movimento,
    som: Boolean(t.som),
    volume: Number.isFinite(Number(t.volume)) ? Math.min(1, Math.max(0, Number(t.volume))) : p.volume,
  };
}

// ── Aplicação ─────────────────────────────────────────────────────────────
export function aplicar(bruto) {
  if (typeof document === 'undefined') return normalizar(bruto);
  const t = normalizar(bruto);
  const r = document.documentElement;
  const f = FUNDOS[t.fundo];
  const a = ARESTAS[t.arestas];

  r.style.setProperty('--zd-acento', t.acento);
  r.style.setProperty('--zd-marca', t.marca);

  r.style.setProperty('--zd-pagina', f.pagina);
  r.style.setProperty('--zd-painel', f.painel);
  r.style.setProperty('--zd-solido', f.solido);
  r.style.setProperty('--zd-elevado', f.elevado);
  r.style.setProperty('--zd-hover', f.hover);
  r.style.setProperty('--zd-campo', f.campo);

  r.style.setProperty('--chanfro', a.c);
  r.style.setProperty('--chanfro-p', a.p);
  r.style.setProperty('--chanfro-g', a.g);

  r.style.setProperty('--zd-fonte-titulo', FONTES[t.fonteTitulo].css);
  r.style.setProperty('--zd-fonte-corpo', FONTES[t.fonteCorpo].css);

  r.dataset.textura = t.textura ? 'on' : 'off';
  r.dataset.movimento = t.movimento;
  r.dataset.densidade = t.densidade;

  // A barra do navegador no celular acompanha o fundo escolhido.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', f.pagina);

  // Quem depende do tema mas não é CSS (a camada de som, por exemplo) escuta
  // este aviso em vez de ficar lendo o localStorage a cada clique.
  window.dispatchEvent(new CustomEvent('zd:tema', { detail: t }));

  return t;
}

// ── Persistência ──────────────────────────────────────────────────────────
export function lerLocal() {
  try { return normalizar(JSON.parse(localStorage.getItem(CHAVE) || 'null')); }
  catch { return padrao(); }
}

export function gravarLocal(t) {
  try { localStorage.setItem(CHAVE, JSON.stringify(normalizar(t))); } catch { /* modo privado */ }
}

/**
 * Aplica o tema guardado antes do primeiro quadro. Chamado no ponto de entrada,
 * não num efeito de componente: em efeito, a tela pisca no tema padrão antes de
 * trocar, e o pisca é justamente o que denuncia que o tema é postiço.
 */
export function iniciar() {
  return aplicar(lerLocal());
}
