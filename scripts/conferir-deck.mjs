// ═══════════════════════════════════════════════════════════════════════════
// CONFERIDOR DE LÂMINA
//
// Deck em HTML tem um defeito que não avisa: o flex da lâmina encolhe um filho
// quando o conteúdo aperta, e o `overflow: hidden` corta o que sobrou sem erro
// nenhum. Foi assim que o par de fotos perdeu legenda e selo sem nada quebrar.
//
// Este script mede, lâmina a lâmina, a altura pedida contra a entregue, e
// acusa quem está espremido ou estourando a caixa.
//
// Uso:  node scripts/conferir-deck.mjs docs/institucional/<arquivo>.html
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const arquivo = process.argv[2];
let html = fs.readFileSync(arquivo, 'utf8')
  .replace(/src="ASSET:[^"]*"/g, 'src=""')
  .replace(/LOGO_AQUI|WORDMARK_AQUI/g, '');

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await (await nav.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await pg.setContent(html, { waitUntil: 'load' });

const r = await pg.evaluate(() => {
  /** Área da interseção de duas caixas, em px². Zero quando não se tocam. */
  const cruzam = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
                         * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  return [...document.querySelectorAll('.slide')].map((s, i) => {
    const caixa = s.getBoundingClientRect();
    let excesso = 0, espremidos = [], sobrepostos = [];
    const noFluxo = [], soltos = [];
    for (const f of s.children) {
      const b = f.getBoundingClientRect();
      if (getComputedStyle(f).position === 'absolute') { soltos.push([f, b]); continue; }
      noFluxo.push([f, b]);
      // Altura pedida contra altura entregue. A folga de 3 px existe porque
      // caixa de linha de texto arredonda: um h1 com descida costuma pedir
      // 2 px a mais do que ocupa, e isso não corta nada. Corte de verdade,
      // como o do par de fotos, veio com 35 px de diferença.
      const pedida = f.scrollHeight, entregue = Math.round(b.height);
      if (pedida - entregue > 3) espremidos.push(`${f.className || f.tagName} ${entregue}/${pedida}`);
      excesso = Math.max(excesso, Math.round(b.bottom - (caixa.bottom - 0)));
    }

    // COLISÃO COM ELEMENTO SOLTO. Um filho `position: absolute` não gera altura
    // de rolagem: ele simplesmente pousa por cima do que estiver embaixo, sem
    // erro nenhum. Foi assim que o índice da capa passou a encobrir o parágrafo
    // quando o lockup cresceu, com o conferidor dizendo "ok" na mesma linha.
    for (const [solto, bs] of soltos) {
      for (const [fluxo, bf] of noFluxo) {
        if (cruzam(bs, bf) > 60) {
          sobrepostos.push(`${solto.className || solto.tagName} sobre ${fluxo.className || fluxo.tagName}`);
        }
      }
    }
    const rolagem = s.scrollHeight - Math.round(caixa.height);
    return { n: i + 1, rolagem, excesso, espremidos, sobrepostos };
  });
});

for (const s of r) {
  const mal = s.rolagem > 1 || s.espremidos.length || s.sobrepostos.length;
  console.log(
    String(s.n).padStart(2, '0'),
    mal ? 'ESTOURA' : 'ok     ',
    'rolagem:' + String(s.rolagem).padStart(4),
    s.espremidos.length ? ' espremido: ' + s.espremidos.join(' | ') : '',
    s.sobrepostos.length ? ' colisão: ' + s.sobrepostos.join(' | ') : '',
  );
}
await nav.close();
