// PDF do plano: renderiza o HTML diagramado com Chromium (playwright) quando disponível.
// Sem Chromium/playwright, o chamador oferece o HTML para impressão no navegador.
import { paginaHtml } from './exportHtml.js';

let pwChecked = false;
let pw = null;

async function getPlaywright() {
  if (pwChecked) return pw;
  pwChecked = true;
  try {
    pw = await import('playwright');
  } catch {
    try {
      // Ambiente ZoomDev cloud: playwright global
      pw = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
    } catch {
      pw = null;
    }
  }
  return pw;
}

export async function planoParaPdf(projeto) {
  const mod = await getPlaywright();
  if (!mod) return null;
  const html = paginaHtml(projeto);
  let browser;
  try {
    const launchOpts = { args: ['--no-sandbox'] };
    if (process.env.PLAYWRIGHT_CHROMIUM_PATH) launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
    browser = await mod.chromium.launch(launchOpts);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
    return pdf;
  } catch (e) {
    console.error('exportPdf: falha ao renderizar', e.message);
    return null;
  } finally {
    try { await browser?.close(); } catch {}
  }
}
