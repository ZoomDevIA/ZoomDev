// ═══════════════════════════════════════════════════════════════════════════
// VARREDURA DE CONTRASTE
//
// Abre a plataforma num navegador de verdade, com o tema pedido, e lista todo
// texto cujo contraste contra o próprio fundo fica abaixo do piso.
//
// Existe porque contraste é o defeito que ninguém vê no próprio monitor: quem
// escreveu a tela leu o texto sem esforço, e a pessoa que não conseguir ler
// vai concluir que a plataforma está quebrada, não que a cor está errada.
//
// LEIA O NÚMERO SEMPRE CONTRA UM CONTROLE. Rodar só no tema claro não diz
// nada: é preciso comparar com o escuro, que é o que já está no ar.
// Medições nas mesmas seis rotas (o total cresce junto com a interface):
//   ago/2026 (1ª)  escuro  87 · claro 59
//   ago/2026 (2ª)  escuro 118 · claro 77   ← claro segue ~35% melhor que a base
//
// Uso:  node scripts/varrer-contraste.mjs [claro|profundo|carbono|floresta|vazio]
//       Exige a plataforma no ar em localhost:4000 e um token em token.txt.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const token = fs.readFileSync(process.env.ZD_TOKEN_FILE || 'token.txt', 'utf8').trim();
const fundo = process.argv[2] || 'claro';
const ROTAS = ['/dashboard', '/agentes', '/projetos', '/impacto', '/editais', '/configuracoes'];

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await (await nav.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
await pg.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded' });
await pg.evaluate(([t, f]) => {
  localStorage.setItem('zd_token', t);
  localStorage.setItem('zd_tema', JSON.stringify({ acento: '#0077b6', marca: '#1f7a3a', fundo: f }));
}, [token, fundo]);

let total = 0;
for (const rota of ROTAS) {
  await pg.goto('http://localhost:4000' + rota, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1600);
  const ruins = await pg.evaluate(() => {
    // color-mix() devolve `color(srgb 0.29 0.41 0.5)`, com canais de 0 a 1, e
    // `rgb()` devolve 0 a 255. Ler os dois com a mesma régua faz cor escura
    // parecer clara e inventa defeito onde não tem.
    const lum = (c) => {
      const m = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
      const escala = /^color\(/.test(c) ? 1 : 255;
      const f = (v) => { v /= escala; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
    };
    const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      const t = (e.childNodes[0] && e.childNodes[0].nodeType === 3 ? e.childNodes[0].textContent : '').trim();
      if (!t || t.length < 2) continue;
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.2) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      let bg = 'rgba(0, 0, 0, 0)', p = e;
      while (p && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bg = getComputedStyle(p).backgroundColor; p = p.parentElement; }
      const cr = razao(cs.color, bg);
      if (cr < 2.2) out.push({ txt: t.slice(0, 24), cor: cs.color, razao: +cr.toFixed(2), classe: String(e.className).slice(0, 46) });
    }
    return out;
  });
  total += ruins.length;
  console.log(`${rota.padEnd(16)} ilegiveis: ${ruins.length}`);
  ruins.slice(0, 6).forEach(r => console.log(`   ${String(r.razao).padStart(5)}  ${r.cor.padEnd(24)} ${r.txt.padEnd(26)} ${r.classe}`));
}
console.log(`\nfundo "${fundo}" · total ilegivel nas ${ROTAS.length} rotas: ${total}`);
await nav.close();
