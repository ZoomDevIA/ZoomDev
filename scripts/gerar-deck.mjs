// ═══════════════════════════════════════════════════════════════════════════
// GERADOR DE DECKS
//
// Converte um documento de docs/institucional/<nome>.html no PDF de mesmo
// nome, em 16:9 (338 × 190 mm), pronto para apresentar e enviar.
//
// Três coisas são embutidas na hora da geração, e não no arquivo fonte:
//
//   FONTES   vão em base64 dentro do documento. Sem isso o Chromium cai em
//            fonte de sistema e o deck sai com outra cara. As fontes já são
//            servidas da própria origem desde o pacote de blindagem, então
//            aqui é só reaproveitar os mesmos arquivos.
//   MARCA    LOGO_AQUI vira o símbolo e WORDMARK_AQUI vira o logotipo com o
//            nome, ambos como data URI.
//   IMAGENS  qualquer src="ASSET:arquivo.png" é trocado pelo conteúdo de
//            docs/institucional/assets/arquivo.png, também como data URI.
//
// O HTML fonte fica legível e editável: quem for mexer no texto abre o
// arquivo e mexe, sem encarar megabytes de base64.
//
// Uso:  node scripts/gerar-deck.mjs [nome-do-documento ...]
//       sem argumento, gera todos os .html de docs/institucional/
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = path.join(RAIZ, 'docs/institucional');
const ASSETS = path.join(PASTA, 'assets');
const SIMBOLO = path.join(RAIZ, 'web/public/assets/logo.webp');
const WORDMARK = path.join(RAIZ, 'web/public/assets/site/wordmark.webp');
const FONTES = path.join(RAIZ, 'web/public/assets/fontes');

// Só os subconjuntos latinos: os decks são em português e inglês, e o resto
// seria peso morto.
const FAMILIAS = [
  ['Inter', 'inter-latin.woff2'],
  ['Space Grotesk', 'space-grotesk-latin.woff2'],
  ['JetBrains Mono', 'jetbrains-mono-latin.woff2'],
];

const TIPO_POR_EXTENSAO = {
  '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
};

const b64 = (arquivo, tipo) =>
  `data:${tipo};base64,${fs.readFileSync(arquivo).toString('base64')}`;

const imagem = (arquivo) =>
  b64(arquivo, TIPO_POR_EXTENSAO[path.extname(arquivo).toLowerCase()] || 'application/octet-stream');

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

/** Troca os marcadores de marca e as referências ASSET: por data URI. */
function embutir(html) {
  return html
    .replace(/LOGO_AQUI/g, imagem(SIMBOLO))
    .replace(/WORDMARK_AQUI/g, imagem(WORDMARK))
    .replace(/ASSET:([\w.-]+)/g, (todo, arquivo) => {
      const caminho = path.join(ASSETS, arquivo);
      if (!fs.existsSync(caminho)) {
        console.warn(`aviso: imagem ausente, assets/${arquivo}. Sai um quadro vazio.`);
        return todo;
      }
      return imagem(caminho);
    });
}

const alvos = process.argv.slice(2).length
  ? process.argv.slice(2).map(n => n.replace(/\.html$/, ''))
  : fs.readdirSync(PASTA).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const contexto = await navegador.newContext();
const fontes = estiloDasFontes();

for (const nome of alvos) {
  const fonteHtml = path.join(PASTA, `${nome}.html`);
  const saidaPdf = path.join(PASTA, `${nome}.pdf`);
  if (!fs.existsSync(fonteHtml)) {
    console.warn(`aviso: ${nome}.html não existe. Pulando.`);
    continue;
  }

  const pagina = await contexto.newPage();
  await pagina.setContent(`<style>${fontes}</style>${embutir(fs.readFileSync(fonteHtml, 'utf8'))}`,
    { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);

  await pagina.pdf({
    path: saidaPdf,
    width: '338mm',
    height: '190mm',
    printBackground: true,
    preferCSSPageSize: true,
  });

  const laminas = await pagina.evaluate(() => document.querySelectorAll('.slide').length);
  await pagina.close();

  const kb = Math.round(fs.statSync(saidaPdf).size / 1024);
  console.log(`${nome}: ${laminas} lâminas · ${kb} KB`);
}

await navegador.close();
