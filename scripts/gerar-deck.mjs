// ═══════════════════════════════════════════════════════════════════════════
// GERADOR DO DECK INSTITUCIONAL
//
// Converte docs/institucional/deck-cidades-regenerativas.html no PDF de
// mesmo nome, em 16:9 (338 × 190 mm), pronto para apresentar e enviar.
//
// Duas coisas são embutidas na hora da geração, e não no arquivo fonte:
//
//   LOGO    vira data URI, para o PDF não depender de arquivo externo.
//   FONTES  vão em base64 dentro do documento. Sem isso o Chromium cai em
//           fonte de sistema e o deck sai com outra cara. As fontes já são
//           servidas da própria origem desde o pacote de blindagem, então
//           aqui é só reaproveitar os mesmos arquivos.
//
// O HTML fonte fica legível e editável: quem for mexer no texto abre o
// arquivo e mexe, sem encarar quilobytes de base64.
//
// Uso:  node scripts/gerar-deck.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTE_HTML = path.join(RAIZ, 'docs/institucional/deck-cidades-regenerativas.html');
const SAIDA_PDF = path.join(RAIZ, 'docs/institucional/deck-cidades-regenerativas.pdf');
const LOGO = path.join(RAIZ, 'web/public/assets/logo.webp');
const FONTES = path.join(RAIZ, 'web/public/assets/fontes');

// Só os subconjuntos latinos: o deck é em português e o resto seria peso morto.
const FAMILIAS = [
  ['Inter', 'inter-latin.woff2'],
  ['Space Grotesk', 'space-grotesk-latin.woff2'],
  ['JetBrains Mono', 'jetbrains-mono-latin.woff2'],
];

const b64 = (arquivo, tipo) =>
  `data:${tipo};base64,${fs.readFileSync(arquivo).toString('base64')}`;

function estiloDasFontes() {
  return FAMILIAS.map(([familia, arquivo]) => {
    const caminho = path.join(FONTES, arquivo);
    if (!fs.existsSync(caminho)) {
      console.warn(`aviso: fonte ausente, ${arquivo}. O deck sai com fonte de sistema.`);
      return '';
    }
    // Um só peso declarado por família, com `font-weight` em faixa: as fontes
    // do projeto são variáveis, e o mesmo arquivo serve do regular ao bold.
    return `@font-face{font-family:'${familia}';src:url('${b64(caminho, 'font/woff2')}') format('woff2');`
      + 'font-weight:100 900;font-style:normal;font-display:block}';
  }).join('\n');
}

const html = fs.readFileSync(FONTE_HTML, 'utf8')
  .replace('LOGO_AQUI', b64(LOGO, 'image/webp'));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const pagina = await (await navegador.newContext()).newPage();

await pagina.setContent(`<style>${estiloDasFontes()}</style>${html}`, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);

await pagina.pdf({
  path: SAIDA_PDF,
  width: '338mm',
  height: '190mm',
  printBackground: true,
  preferCSSPageSize: true,
});

const laminas = await pagina.evaluate(() => document.querySelectorAll('.slide').length);
await navegador.close();

const kb = Math.round(fs.statSync(SAIDA_PDF).size / 1024);
console.log(`deck gerado: ${laminas} lâminas · ${kb} KB · ${path.relative(RAIZ, SAIDA_PDF)}`);
