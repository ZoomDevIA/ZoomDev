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
  return [...document.querySelectorAll('.slide')].map((s, i) => {
    const caixa = s.getBoundingClientRect();
    let excesso = 0, espremidos = [];
    for (const f of s.children) {
      const b = f.getBoundingClientRect();
      if (getComputedStyle(f).position === 'absolute') continue;
      // Altura pedida contra altura entregue. A folga de 3 px existe porque
      // caixa de linha de texto arredonda: um h1 com descida costuma pedir
      // 2 px a mais do que ocupa, e isso não corta nada. Corte de verdade,
      // como o do par de fotos, veio com 35 px de diferença.
      const pedida = f.scrollHeight, entregue = Math.round(b.height);
      if (pedida - entregue > 3) espremidos.push(`${f.className || f.tagName} ${entregue}/${pedida}`);
      excesso = Math.max(excesso, Math.round(b.bottom - (caixa.bottom - 0)));
    }
    const rolagem = s.scrollHeight - Math.round(caixa.height);
    return { n: i + 1, rolagem, excesso, espremidos };
  });
});

for (const s of r) {
  const mal = s.rolagem > 1 || s.espremidos.length;
  console.log(
    String(s.n).padStart(2, '0'),
    mal ? 'ESTOURA' : 'ok     ',
    'rolagem:' + String(s.rolagem).padStart(4),
    s.espremidos.length ? ' espremido: ' + s.espremidos.join(' | ') : '',
  );
}
await nav.close();
