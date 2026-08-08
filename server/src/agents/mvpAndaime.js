// ═══════════════════════════════════════════════════════════════════════════
// ANDAIME DO MVP: as páginas extras, o SEO, o PWA e o backend
//
// POR QUE ISTO NÃO É UMA PEÇA DE IA. As cinco peças escritas por agente são as
// que dependem de redação: a proposta de valor da landing, a tela do produto,
// a lógica. Sitemap, manifesto, service worker e servidor não dependem de
// redação nenhuma: dependem do nome do projeto e da lista de páginas. Pedir a
// um modelo que escreva um robots.txt custa crédito, custa segundo e ainda
// pode sair errado. Aqui sai sempre igual, sempre válido, de graça.
//
// A CONSEQUÊNCIA MAIS IMPORTANTE é a costura: o HTML escrito pelo agente não
// sabe que existe manifesto, service worker ou página de preços. Em vez de
// pedir isso no prompt e torcer, o andaime COSTURA depois, no HTML pronto.
// Vale para o modo demo e para o modo IA, do mesmo jeito.
//
// O agente escreve o conteúdo. O andaime garante a mecânica.
// ═══════════════════════════════════════════════════════════════════════════

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const barra = (t) => String(t ?? '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mvp';

/** As páginas do site, na ordem em que aparecem na navegação. */
export const PAGINAS = [
  { arquivo: 'index.html', titulo: 'Início', prioridade: '1.0' },
  { arquivo: 'precos.html', titulo: 'Preços', prioridade: '0.8' },
  { arquivo: 'sobre.html', titulo: 'Sobre', prioridade: '0.7' },
  { arquivo: 'app.html', titulo: 'Entrar no app', prioridade: '0.9' },
];

/** Arquivos de andaime, para aparecerem no acompanhamento da construção. */
export const ANDAIMES = [
  { id: 'paginas', nome: 'Páginas do site', emoji: '📄', arquivo: 'precos.html', papel: 'Preços e sobre, com a navegação entre elas' },
  { id: 'seo', nome: 'SEO', emoji: '🔍', arquivo: 'sitemap.xml', papel: 'Meta tags, dados estruturados, sitemap e robots' },
  { id: 'pwa', nome: 'App instalável', emoji: '📱', arquivo: 'manifest.webmanifest', papel: 'Manifesto, ícone e service worker' },
  { id: 'backend', nome: 'Backend', emoji: '🗄️', arquivo: 'api/servidor.js', papel: 'Dados, API REST e login do produto' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SEO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * O bloco que vai dentro do <head> de cada página.
 *
 * `canonical` e og:url usam um endereço relativo de propósito: o MVP ainda não
 * tem domínio, e cravar um endereço inventado é pior do que não cravar nenhum.
 * O README explica a troca de uma linha quando o domínio existir.
 */
function cabecaSeo(ctx, pagina) {
  const titulo = pagina.arquivo === 'index.html'
    ? `${ctx.nome} · ${ctx.proposta.slice(0, 60)}`
    : `${pagina.titulo} · ${ctx.nome}`;
  const descricao = String(ctx.proposta || ctx.descricao || ctx.nome).slice(0, 155);

  const dados = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: ctx.nome,
    description: descricao,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
  };

  return `  <meta name="description" content="${esc(descricao)}">
  <meta name="theme-color" content="${ctx.corTema}">
  <link rel="canonical" href="./${pagina.arquivo}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descricao)}">
  <meta property="og:url" content="./${pagina.arquivo}">
  <meta property="og:image" content="./icone.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(titulo)}">
  <meta name="twitter:description" content="${esc(descricao)}">
  <link rel="icon" href="./icone.svg" type="image/svg+xml">
  <link rel="manifest" href="./manifest.webmanifest">
  <script type="application/ld+json">${JSON.stringify(dados)}</script>`;
}

function sitemap(ctx) {
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = PAGINAS.map(p => `  <url>
    <loc>https://SEU-DOMINIO/${p.arquivo}</loc>
    <lastmod>${hoje}</lastmod>
    <priority>${p.prioridade}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${ctx.nome}: troque SEU-DOMINIO pelo domínio real antes de publicar. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /
# A área logada não deve ser indexada: não tem conteúdo público e polui o índice.
Disallow: /app.html
Disallow: /api/

Sitemap: https://SEU-DOMINIO/sitemap.xml
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PWA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ícone em SVG, não em PNG.
 *
 * Um MVP gerado não tem designer para desenhar ícone, e um PNG genérico ficaria
 * pior do que a inicial do projeto sobre a cor da marca. SVG ainda escala em
 * qualquer densidade sem gerar seis arquivos.
 */
function icone(ctx) {
  const inicial = esc(String(ctx.nome).trim().charAt(0).toUpperCase() || 'Z');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${esc(ctx.nome)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ctx.corTema}"/>
      <stop offset="100%" stop-color="${ctx.corApoio}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0b1220"/>
  <rect x="28" y="28" width="456" height="456" rx="92" fill="none" stroke="url(#g)" stroke-width="10"/>
  <text x="256" y="256" fill="url(#g)" font-family="system-ui, sans-serif" font-size="248"
        font-weight="700" text-anchor="middle" dominant-baseline="central">${inicial}</text>
</svg>
`;
}

function manifesto(ctx) {
  return JSON.stringify({
    name: ctx.nome,
    short_name: String(ctx.nome).slice(0, 12),
    description: String(ctx.proposta || ctx.nome).slice(0, 155),
    start_url: './index.html',
    scope: './',
    display: 'standalone',
    background_color: '#0b1220',
    theme_color: ctx.corTema,
    lang: 'pt-BR',
    icons: [
      { src: './icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }, null, 2) + '\n';
}

/**
 * Service worker com cache do casco.
 *
 * A estratégia é rede primeiro com cache de reserva, e não cache primeiro: num
 * MVP em validação o conteúdo muda todo dia, e cache primeiro entregaria a
 * versão de ontem para quem acabou de receber o link. O cache existe para a
 * segunda visita sem rede, não para economizar banda.
 */
function serviceWorker(ctx) {
  const casco = ['./', ...PAGINAS.map(p => `./${p.arquivo}`), './styles.css', './app.js', './icone.svg', './manifest.webmanifest'];
  return `/* ${ctx.nome}: service worker.
   Rede primeiro, cache de reserva. Troque CACHE a cada publicação para
   invalidar o que ficou guardado. */
var CACHE = '${barra(ctx.nome)}-v1';
var CASCO = ${JSON.stringify(casco, null, 2).replace(/\n/g, '\n')};

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CASCO); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n !== CACHE; }).map(function (n) {
      return caches.delete(n);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  // Só GET entra no cache. POST e DELETE vão direto para a rede: guardar
  // resposta de escrita devolveria dado velho no lugar do que acabou de mudar.
  if (e.request.method !== 'GET') return;
  // Chamada de API nunca é servida do cache: prefere falhar a mentir.
  if (e.request.url.indexOf('/api/') !== -1) return;

  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (achado) {
        return achado || caches.match('./index.html');
      });
    })
  );
});
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINAS EXTRAS
// ═══════════════════════════════════════════════════════════════════════════

function navegacao(atual) {
  const itens = PAGINAS.map(p => p.arquivo === atual
    ? `<span class="zd-nav-atual" aria-current="page">${esc(p.titulo)}</span>`
    : `<a href="./${p.arquivo}">${esc(p.titulo)}</a>`).join('\n      ');
  return `  <nav class="zd-nav" aria-label="Navegação do site">
    <div class="zd-nav-caixa">
      ${itens}
    </div>
  </nav>`;
}

/**
 * O CSS da navegação vive aqui, e não no styles.css, por um motivo prático: o
 * styles.css do modo IA é escrito pelo agente e pode não ter estas classes. A
 * navegação precisa funcionar nos dois modos, então carrega o próprio estilo.
 * Os nomes levam prefixo `zd-` para não colidir com o que o agente inventar.
 */
const CSS_NAV = `<style>
  .zd-nav{border-top:1px solid rgba(255,255,255,.12);margin-top:48px;padding:20px 0 32px}
  .zd-nav-caixa{max-width:1100px;margin:0 auto;padding:0 20px;display:flex;flex-wrap:wrap;gap:20px;
    font-size:14px;font-family:system-ui,sans-serif}
  .zd-nav a{color:inherit;opacity:.62;text-decoration:none}
  .zd-nav a:hover,.zd-nav a:focus-visible{opacity:1;text-decoration:underline}
  .zd-nav-atual{opacity:1;font-weight:600}
  @media print{.zd-nav{display:none}}
</style>`;

function paginaPrecos(ctx) {
  const cartoes = ctx.precos.map(p => {
    const itens = (p.itens || []).map(i => `<li>${esc(i)}</li>`).join('\n            ');
    return `        <article class="card${p.destaque ? ' card-destaque' : ''}">
          <h2>${esc(p.nome)}</h2>
          <p class="preco">${esc(p.preco)}</p>
          <ul>
            ${itens}
          </ul>
          <a class="btn" href="./app.html">Começar</a>
        </article>`;
  }).join('\n');

  return montarPagina(ctx, PAGINAS[1], `      <h1>Planos e preços</h1>
      <p class="sub">${esc(ctx.modelo)}. Sem fidelidade, cancele quando quiser.</p>
      <div class="grid">
${cartoes}
      </div>
      <p class="nota">Os valores acima saíram do plano de negócios e valem para a fase de validação. Reveja quando tiver os primeiros clientes pagantes.</p>`);
}

function paginaSobre(ctx) {
  const dores = ctx.dores.map(d => `<li>${esc(d)}</li>`).join('\n          ');
  const ods = (ctx.ods || []).slice(0, 8)
    .map(o => `<span class="tag">${esc(typeof o === 'string' ? o : (o.nome || `ODS ${o.ods}`))}</span>`).join(' ');

  return montarPagina(ctx, PAGINAS[2], `      <h1>Sobre ${esc(ctx.nome)}</h1>
      <p class="sub">${esc(ctx.proposta)}</p>

      <h2>O problema</h2>
      <ul>
          ${dores}
      </ul>

      <h2>Para quem</h2>
      <p>${esc(ctx.publico)}</p>

      ${ctx.diferencial ? `<h2>O diferencial</h2>\n      <p>${esc(ctx.diferencial)}</p>` : ''}

      ${ctx.impacto ? `<h2>Impacto</h2>\n      <p>${esc(ctx.impacto)}</p>` : ''}
      ${ods ? `<p class="tags">${ods}</p>` : ''}`);
}

/** Casco comum das páginas de andaime, para as duas saírem iguais. */
function montarPagina(ctx, pagina, miolo) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pagina.titulo)} · ${esc(ctx.nome)}</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="conteudo">
    <div class="secao">
${miolo}
    </div>
  </main>
</body>
</html>
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND
// ═══════════════════════════════════════════════════════════════════════════

function apiDados(ctx) {
  return `/* ${ctx.nome}: guarda dos dados.
   Um arquivo JSON, sem banco e sem dependência. Serve para validar: quando o
   produto tiver usuário de verdade, troque este módulo por Postgres e o resto
   da API não muda, porque tudo passa por aqui. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVO = path.join(AQUI, 'dados.json');

const VAZIO = { usuarios: {}, sessoes: {}, registros: {}, leads: [] };

export const banco = carregar();

function carregar() {
  try {
    return { ...VAZIO, ...JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')) };
  } catch {
    return structuredClone(VAZIO);
  }
}

/* Grava em arquivo temporário e renomeia. Renomear é atômico no sistema de
   arquivos: ou o arquivo antigo está inteiro, ou o novo está inteiro. Gravar
   por cima deixaria um JSON pela metade se o processo caísse no meio. */
export function gravar() {
  const tmp = ARQUIVO + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(banco, null, 2));
  fs.renameSync(tmp, ARQUIVO);
}

export const novoId = (prefixo) =>
  prefixo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
`;
}

function apiAuth(ctx) {
  return `/* ${ctx.nome}: login do produto.
   Senha nunca é guardada. O que fica no banco é o resultado do scrypt com sal
   próprio por conta: se o dados.json vazar, ninguém entra com ele. */
import crypto from 'node:crypto';
import { banco, gravar, novoId } from './dados.js';

const VALIDADE_DIAS = 30;

export function embaralhar(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const chave = crypto.scryptSync(String(senha), sal, 64).toString('hex');
  return sal + ':' + chave;
}

export function conferir(senha, guardado) {
  const [sal, chave] = String(guardado || '').split(':');
  if (!sal || !chave) return false;
  const tentativa = crypto.scryptSync(String(senha), sal, 64);
  const esperado = Buffer.from(chave, 'hex');
  // Comparação de tempo constante: comparar com === vazaria, pelo tempo de
  // resposta, quantos bytes do início bateram.
  return tentativa.length === esperado.length && crypto.timingSafeEqual(tentativa, esperado);
}

export function registrar({ nome, email, senha }) {
  const alvo = String(email || '').trim().toLowerCase();
  if (!alvo.includes('@') || String(senha || '').length < 8) {
    throw Object.assign(new Error('E-mail inválido ou senha com menos de 8 caracteres.'), { status: 400 });
  }
  if (Object.values(banco.usuarios).some(u => u.email === alvo)) {
    throw Object.assign(new Error('Já existe uma conta com este e-mail.'), { status: 409 });
  }
  const id = novoId('usr');
  banco.usuarios[id] = {
    id, email: alvo,
    nome: nome || alvo.split('@')[0],
    hash: embaralhar(senha),
    criadoEm: new Date().toISOString(),
  };
  banco.registros[id] = [];
  return abrirSessao(id);
}

export function entrar({ email, senha }) {
  const alvo = String(email || '').trim().toLowerCase();
  const u = Object.values(banco.usuarios).find(x => x.email === alvo);
  // Mesma mensagem para conta que não existe e para senha errada: respostas
  // diferentes contariam a quem pergunta quais e-mails têm conta aqui.
  if (!u || !conferir(senha, u.hash)) {
    throw Object.assign(new Error('E-mail ou senha inválidos.'), { status: 401 });
  }
  return abrirSessao(u.id);
}

function abrirSessao(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  banco.sessoes[token] = {
    userId,
    expiraEm: new Date(Date.now() + VALIDADE_DIAS * 86400000).toISOString(),
  };
  gravar();
  return { token, usuario: publico(banco.usuarios[userId]) };
}

export function sair(token) {
  delete banco.sessoes[token];
  gravar();
}

export function usuarioDoToken(token) {
  const s = banco.sessoes[token];
  if (!s) return null;
  if (new Date(s.expiraEm).getTime() < Date.now()) {
    delete banco.sessoes[token];
    gravar();
    return null;
  }
  return banco.usuarios[s.userId] || null;
}

export const publico = (u) => (u ? { id: u.id, nome: u.nome, email: u.email } : null);
`;
}

function apiServidor(ctx) {
  const porta = 4100;
  return `/* ${ctx.nome}: API e servidor do site.
   Node puro, sem dependência nenhuma. Um comando sobe o produto inteiro:

     node api/servidor.js

   Serve os arquivos estáticos da pasta acima e responde a API em /api.
   Servir os dois do mesmo lugar evita CORS e evita explicar duas portas para
   quem só quer ver o MVP funcionando. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { banco, gravar, novoId } from './dados.js';
import { registrar, entrar, sair, usuarioDoToken, publico } from './auth.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(AQUI, '..');
const PORTA = Number(process.env.PORT || ${porta});

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
};

const responder = (res, status, corpo) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(corpo));
};

function corpoDe(req) {
  return new Promise((ok, falha) => {
    let bruto = '';
    req.on('data', p => {
      bruto += p;
      // Trava de tamanho: sem isto, um POST gigante enche a memória do processo.
      if (bruto.length > 1e6) { req.destroy(); falha(new Error('Corpo grande demais.')); }
    });
    req.on('end', () => { try { ok(bruto ? JSON.parse(bruto) : {}); } catch { ok({}); } });
  });
}

const tokenDe = (req) => String(req.headers.authorization || '').replace(/^Bearer /, '');

async function api(req, res, rota) {
  const corpo = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await corpoDe(req) : {};
  const usuario = usuarioDoToken(tokenDe(req));
  const exigirConta = () => {
    if (!usuario) { responder(res, 401, { erro: 'Faça login para continuar.' }); return false; }
    return true;
  };

  // ── Conta ──
  if (rota === '/api/auth/registrar' && req.method === 'POST') {
    return responder(res, 200, registrar(corpo));
  }
  if (rota === '/api/auth/entrar' && req.method === 'POST') {
    return responder(res, 200, entrar(corpo));
  }
  if (rota === '/api/auth/sair' && req.method === 'POST') {
    sair(tokenDe(req));
    return responder(res, 200, { ok: true });
  }
  if (rota === '/api/eu' && req.method === 'GET') {
    if (!exigirConta()) return;
    return responder(res, 200, { usuario: publico(usuario) });
  }

  // ── Registros: cada conta enxerga só os seus ──
  if (rota === '/api/registros' && req.method === 'GET') {
    if (!exigirConta()) return;
    return responder(res, 200, { registros: banco.registros[usuario.id] || [] });
  }
  if (rota === '/api/registros' && req.method === 'POST') {
    if (!exigirConta()) return;
    const titulo = String(corpo.titulo || '').trim();
    if (!titulo) return responder(res, 400, { erro: 'O título é obrigatório.' });
    const registro = {
      id: novoId('reg'),
      titulo,
      status: ['aberto', 'andamento', 'concluido'].includes(corpo.status) ? corpo.status : 'aberto',
      em: new Date().toISOString(),
    };
    (banco.registros[usuario.id] ||= []).push(registro);
    gravar();
    return responder(res, 201, { registro });
  }
  if (rota.startsWith('/api/registros/') && req.method === 'DELETE') {
    if (!exigirConta()) return;
    const id = rota.split('/')[3];
    const lista = banco.registros[usuario.id] || [];
    const i = lista.findIndex(r => r.id === id);
    if (i < 0) return responder(res, 404, { erro: 'Registro não encontrado.' });
    lista.splice(i, 1);
    gravar();
    return responder(res, 200, { ok: true });
  }

  // ── Lista de espera: escrever é público, ler não ──
  if (rota === '/api/leads' && req.method === 'POST') {
    const email = String(corpo.email || '').trim().toLowerCase();
    if (!email.includes('@')) return responder(res, 400, { erro: 'Informe um e-mail válido.' });
    banco.leads.push({
      nome: String(corpo.nome || '').slice(0, 120),
      email,
      contexto: String(corpo.contexto || '').slice(0, 500),
      em: new Date().toISOString(),
    });
    gravar();
    return responder(res, 201, { posicao: banco.leads.length });
  }
  if (rota === '/api/leads' && req.method === 'GET') {
    if (!exigirConta()) return;
    return responder(res, 200, { leads: banco.leads });
  }

  responder(res, 404, { erro: 'Rota não encontrada.' });
}

function estatico(req, res, rota) {
  const relativo = rota === '/' ? 'index.html' : decodeURIComponent(rota).replace(/^\\/+/, '');
  const alvo = path.join(SITE, relativo);
  // Trava de caminho: sem isto, um pedido a /../../etc/passwd sairia da pasta
  // do site e serviria arquivo do sistema.
  if (!alvo.startsWith(SITE)) { res.writeHead(403); return res.end('Fora do site.'); }
  fs.readFile(alvo, (erro, dados) => {
    if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado.'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream' });
    res.end(dados);
  });
}

http.createServer(async (req, res) => {
  const rota = new URL(req.url, 'http://localhost').pathname;
  try {
    if (rota.startsWith('/api/')) return await api(req, res, rota);
    estatico(req, res, rota);
  } catch (e) {
    responder(res, e.status || 500, { erro: e.message || 'Erro interno.' });
  }
}).listen(PORTA, () => {
  console.log('${ctx.nome} no ar em http://localhost:' + PORTA);
});
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COSTURA
// ═══════════════════════════════════════════════════════════════════════════

const REGISTRO_SW = `<script>
  // Service worker: só em https ou localhost, que é onde o navegador aceita.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
</script>`;

/**
 * Costura SEO, PWA e navegação em cada página HTML.
 *
 * Idempotente por marcador: se o bloco já está lá, não entra de novo. Isso
 * importa porque a costura roda sobre HTML que pode ter vindo do agente já
 * contendo parte disso.
 */
/**
 * Tags que a costura vai escrever e que portanto precisam sair antes.
 *
 * O gerador demo já escreve uma `description`, e o agente pode escrever
 * qualquer uma destas por conta própria. Duas `description` na mesma página é
 * defeito de SEO de verdade: o buscador escolhe uma e ninguém sabe qual. Aqui
 * a regra é uma só de cada, e a que vale é a do andaime, porque ela é derivada
 * do plano e não da improvisação de quem escreveu o HTML.
 */
const DUPLICADAS = [
  /[ \t]*<meta\s+name=["']description["'][^>]*>\s*\n?/gi,
  /[ \t]*<meta\s+name=["']theme-color["'][^>]*>\s*\n?/gi,
  /[ \t]*<meta\s+(?:property|name)=["'](?:og|twitter):[^"']*["'][^>]*>\s*\n?/gi,
  /[ \t]*<link\s+rel=["'](?:canonical|manifest)["'][^>]*>\s*\n?/gi,
  /[ \t]*<link\s+rel=["'][^"']*icon[^"']*["'][^>]*>\s*\n?/gi,
];

export function costurar(arquivos, ctx) {
  const MARCA = '<!-- zd:andaime -->';

  return arquivos.map(a => {
    if (!a.arquivo.endsWith('.html')) return a;
    let html = a.conteudo;
    if (html.includes(MARCA)) return a;
    if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) return a;

    const pagina = PAGINAS.find(p => p.arquivo === a.arquivo)
      || { arquivo: a.arquivo, titulo: ctx.nome, prioridade: '0.5' };

    // A limpeza só vale dentro do <head>: um <link rel="icon"> não aparece no
    // corpo, mas texto de exemplo dentro de um <code> poderia, e apagar
    // conteúdo visível da página seria pior do que a tag repetida.
    html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, (cabeca) =>
      DUPLICADAS.reduce((t, re) => t.replace(re, ''), cabeca));

    html = html.replace(/<\/head>/i, `${MARCA}\n${cabecaSeo(ctx, pagina)}\n${CSS_NAV}\n</head>`);
    html = html.replace(/<\/body>/i, `${navegacao(a.arquivo)}\n${REGISTRO_SW}\n</body>`);
    return { ...a, conteudo: html };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTAGEM
// ═══════════════════════════════════════════════════════════════════════════

/** Devolve os arquivos de andaime. Não depende de IA e nunca falha. */
export function gerarAndaime(ctx) {
  return [
    { arquivo: 'precos.html', conteudo: paginaPrecos(ctx) },
    { arquivo: 'sobre.html', conteudo: paginaSobre(ctx) },
    { arquivo: 'sitemap.xml', conteudo: sitemap(ctx) },
    { arquivo: 'robots.txt', conteudo: robots() },
    { arquivo: 'manifest.webmanifest', conteudo: manifesto(ctx) },
    { arquivo: 'icone.svg', conteudo: icone(ctx) },
    { arquivo: 'sw.js', conteudo: serviceWorker(ctx) },
    { arquivo: 'api/dados.js', conteudo: apiDados(ctx) },
    { arquivo: 'api/auth.js', conteudo: apiAuth(ctx) },
    { arquivo: 'api/servidor.js', conteudo: apiServidor(ctx) },
    { arquivo: 'api/package.json', conteudo: JSON.stringify({ name: barra(ctx.nome) + '-api', private: true, type: 'module' }, null, 2) + '\n' },
  ];
}

/** Seção do README que descreve o que o andaime acrescentou. */
export function textoEntrega(ctx) {
  return `
## Páginas

${PAGINAS.map(p => `- \`${p.arquivo}\` · ${p.titulo}`).join('\n')}

A navegação entre elas é costurada no rodapé de cada página.

## SEO

Cada página traz \`description\`, canonical, Open Graph, Twitter Card e dados
estruturados em JSON-LD. Há \`sitemap.xml\` e \`robots.txt\`.

**Antes de publicar:** troque \`SEU-DOMINIO\` pelo domínio real no
\`sitemap.xml\` e no \`robots.txt\`, e troque os \`href\` relativos do canonical
pelo endereço absoluto. São duas buscas e substituições.

## App instalável

\`manifest.webmanifest\`, \`icone.svg\` e \`sw.js\` fazem o MVP ser instalável
no celular. O service worker é rede primeiro com cache de reserva: num produto
em validação o conteúdo muda todo dia, e cache primeiro entregaria a versão de
ontem para quem acabou de receber o link.

O navegador só registra service worker em **https ou localhost**. Abrir o
arquivo com \`file://\` não instala, e isso não é defeito.

## Backend

\`\`\`bash
node api/servidor.js
\`\`\`

Sobe o site e a API na mesma porta, em http://localhost:4100. Node puro, sem
\`npm install\`.

| Rota | Método | O que faz |
|---|---|---|
| \`/api/auth/registrar\` | POST | cria conta e devolve token |
| \`/api/auth/entrar\` | POST | login |
| \`/api/auth/sair\` | POST | encerra a sessão |
| \`/api/eu\` | GET | conta do token |
| \`/api/registros\` | GET · POST | registros da conta |
| \`/api/registros/:id\` | DELETE | remove um registro |
| \`/api/leads\` | POST · GET | lista de espera: escrever é público, ler exige conta |

Senha nunca é guardada: fica o scrypt com sal próprio por conta. Os dados vão
para \`api/dados.json\`, gravado por renomeação atômica.

**Para ligar a interface na API:** em \`app.js\`, troque as funções
\`carregar\` e \`salvar\` por \`fetch('/api/registros')\` com o token no
cabeçalho \`Authorization\`. O resto da tela não muda.
`;
}
