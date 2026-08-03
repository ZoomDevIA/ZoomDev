import { lerLocal } from './tema.js';

// ═══════════════════════════════════════════════════════════════════════════
// SOM DE INTERFACE — sintetizado, não baixado.
//
// A decisão que manda neste arquivo: nenhum arquivo de áudio. Um pacote de
// sons de jogo custa centenas de kilobytes e brigaria com o trabalho de
// leveza. Aqui cada som é feito na hora, com osciladores e envelope, e o custo
// no pacote é o tamanho deste texto.
//
// Três regras de convivência:
//
//   1. O contexto de áudio só nasce no primeiro gesto da pessoa. Não é só
//      educação: navegador nenhum deixa tocar antes disso.
//   2. Volume baixo por padrão, e um botão de silêncio sempre à vista.
//   3. Som é retorno, não trilha. Cada um dura menos de meio segundo e
//      nenhum se repete sozinho.
// ═══════════════════════════════════════════════════════════════════════════

let ctx = null;
let mestre = null;
let ligado = true;
let volume = 0.35;
let ultimoToque = 0;

/** Envelope curto: ataque quase instantâneo e queda exponencial. Som de
 *  interface com ataque lento soa como sino, e sino atrasa a leitura. */
function nota({ freq, dur = 0.09, tipo = 'sine', ganho = 1, ate = null, atraso = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + atraso;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t + dur);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, ganho), t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(mestre);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ── O repertório ──────────────────────────────────────────────────────────
const SONS = {
  // Clique comum: duas notas curtas subindo. Curto o bastante para não pesar
  // quando a pessoa clica dez vezes seguidas.
  clique: () => {
    nota({ freq: 880, dur: 0.045, tipo: 'triangle', ganho: 0.16 });
    nota({ freq: 1320, dur: 0.05, tipo: 'triangle', ganho: 0.1, atraso: 0.035 });
  },
  // Ação principal: mais corpo, uma quinta abaixo dando peso.
  acao: () => {
    nota({ freq: 440, dur: 0.1, tipo: 'square', ganho: 0.07 });
    nota({ freq: 880, dur: 0.09, tipo: 'triangle', ganho: 0.16 });
    nota({ freq: 1760, dur: 0.11, tipo: 'sine', ganho: 0.09, atraso: 0.05 });
  },
  // Passar o mouse: quase inaudível, só o suficiente para a mão sentir o alvo.
  toque: () => nota({ freq: 2400, dur: 0.02, tipo: 'triangle', ganho: 0.035 }),
  sucesso: () => {
    [660, 880, 1320].forEach((f, i) => nota({ freq: f, dur: 0.13, tipo: 'sine', ganho: 0.13, atraso: i * 0.055 }));
  },
  erro: () => {
    nota({ freq: 220, dur: 0.16, tipo: 'sawtooth', ganho: 0.1, ate: 130 });
    nota({ freq: 214, dur: 0.16, tipo: 'sawtooth', ganho: 0.06, ate: 126 });
  },
  // Conquista: arpejo de quatro notas com brilho no fim.
  conquista: () => {
    [523, 659, 784, 1047].forEach((f, i) => nota({ freq: f, dur: 0.2, tipo: 'triangle', ganho: 0.13, atraso: i * 0.065 }));
    nota({ freq: 2093, dur: 0.35, tipo: 'sine', ganho: 0.07, atraso: 0.26 });
  },
  // Subida de nível: varredura para cima e acorde aberto por cima dela.
  nivel: () => {
    nota({ freq: 300, dur: 0.42, tipo: 'sawtooth', ganho: 0.06, ate: 1400 });
    [784, 988, 1175, 1568].forEach((f, i) => nota({ freq: f, dur: 0.3, tipo: 'sine', ganho: 0.12, atraso: 0.2 + i * 0.05 }));
  },
  // Agente terminou de escrever: varredura descendente, som de "pronto".
  varredura: () => nota({ freq: 1900, dur: 0.24, tipo: 'triangle', ganho: 0.09, ate: 420 }),
  abrir: () => nota({ freq: 520, dur: 0.11, tipo: 'sine', ganho: 0.11, ate: 1040 }),
  fechar: () => nota({ freq: 1040, dur: 0.1, tipo: 'sine', ganho: 0.09, ate: 480 }),
  xp: () => {
    nota({ freq: 1046, dur: 0.09, tipo: 'triangle', ganho: 0.12 });
    nota({ freq: 1568, dur: 0.11, tipo: 'sine', ganho: 0.09, atraso: 0.06 });
  },
};

function acordar() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return;
  ctx = new Contexto();
  mestre = ctx.createGain();
  mestre.gain.value = volume;
  mestre.connect(ctx.destination);
}

export function tocar(nome) {
  if (!ligado || !SONS[nome]) return;
  acordar();
  if (!ctx) return;
  try { SONS[nome](); } catch { /* aba em segundo plano, sem drama */ }
}

/** Vibração curta no celular. Silenciosa em quem não tem o recurso. */
export function vibrar(padrao = [12, 60, 22]) {
  if (!ligado) return;
  try { navigator.vibrate?.(padrao); } catch { /* sem vibração, sem problema */ }
}

export function configurar({ som, volume: v }) {
  ligado = Boolean(som);
  volume = Math.min(1, Math.max(0, Number(v) || 0));
  if (mestre) mestre.gain.value = volume;
}

export function estaLigado() { return ligado; }

// ── Ligação com a interface ───────────────────────────────────────────────
// Um ouvinte só, na raiz, em vez de um adereço em cada botão. Assim toda tela
// da plataforma ganha retorno sonoro sem precisar ser reescrita, e desligar o
// som é remover um ouvinte, não vasculhar cem componentes.

const ACAO = '.hud-botao, .zd-gradient-btn, [type="submit"]';
const CLICAVEL = 'button, a[href], [role="switch"], [role="tab"], .zd-menu-item, .hud-aba';
const APONTAVEL = '.zd-menu-item, .hud-aba, .hud-botao, .hud-botao-vazio, .hud-vivo';

function aoClicar(e) {
  const alvo = e.target.closest?.(CLICAVEL);
  if (!alvo || alvo.disabled) return;
  tocar(alvo.closest(ACAO) ? 'acao' : 'clique');
}

function aoApontar(e) {
  if (!e.target.closest?.(APONTAVEL)) return;
  const agora = performance.now();
  if (agora - ultimoToque < 70) return;   // freio: passar rápido por uma lista viraria chiado
  ultimoToque = agora;
  tocar('toque');
}

export function ligarNaInterface() {
  const primeiroGesto = () => acordar();
  document.addEventListener('pointerdown', primeiroGesto, { once: true });
  document.addEventListener('keydown', primeiroGesto, { once: true });
  document.addEventListener('click', aoClicar, true);
  // Só onde existe mouse: no toque não há "passar por cima", e o evento
  // sintético que o navegador emite depois do toque duplicaria o som.
  const temMouse = window.matchMedia?.('(hover: hover)').matches;
  if (temMouse) document.addEventListener('pointerover', aoApontar, true);

  const doTema = () => { const t = lerLocal(); configurar({ som: t.som, volume: t.volume }); };
  doTema();
  window.addEventListener('zd:tema', doTema);

  return () => {
    document.removeEventListener('click', aoClicar, true);
    document.removeEventListener('pointerover', aoApontar, true);
    window.removeEventListener('zd:tema', doTema);
  };
}
