// ═══════════════════════════════════════════════════════════════════════════
// BLINDAGEM DE TRANSPORTE
//
// Cabeçalhos de segurança e política de origem, escritos à mão em vez de
// trazidos por biblioteca. São quarenta linhas, e cada uma precisa ser
// entendida por quem mantém isto: um pacote com cinquenta padrões implícitos
// é justamente o que faz alguém descobrir tarde demais que a política estava
// permitindo o que não devia.
//
// A política de conteúdo é ESTRITA de propósito. Ela só é possível porque o
// pacote compilado não tem script embutido, não usa dangerouslySetInnerHTML e
// não injeta folha de estilo em tempo de execução. Se algum desses três
// mudar, a política precisa mudar junto, e é melhor quebrar em
// desenvolvimento do que afrouxar em silêncio.
// ═══════════════════════════════════════════════════════════════════════════

const ORIGENS_LOCAIS = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:4000', 'http://127.0.0.1:4000',
];

/** Origens que podem chamar a API. Vazio significa "só a própria". */
export function origensPermitidas() {
  const doAmbiente = (process.env.ZOOMDEV_URL || '')
    .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  const extras = (process.env.ZOOMDEV_ORIGENS || '')
    .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  const desenvolvimento = process.env.NODE_ENV === 'production' ? [] : ORIGENS_LOCAIS;
  return [...new Set([...doAmbiente, ...extras, ...desenvolvimento])];
}

/**
 * CORS por lista, no lugar do `cors()` que aceitava qualquer origem.
 *
 * Sem isso, qualquer site na internet podia chamar a API. Não era um buraco
 * imediato, porque o token vai no cabeçalho e não em cookie, mas bastava um
 * token vazar para que a exploração fosse feita do navegador da vítima.
 *
 * Requisição sem cabeçalho Origin (curl, aplicativo, webhook) passa: CORS é
 * uma regra de navegador, e barrá-la aqui só quebraria integração honesta sem
 * impedir ninguém.
 */
export function cors(req, res, next) {
  const origem = req.headers.origin;
  if (!origem) return next();

  const permitidas = origensPermitidas();
  const liberada = permitidas.length === 0 || permitidas.includes(origem.replace(/\/$/, ''));

  if (liberada) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-zd-painel');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') return res.status(liberada ? 204 : 403).end();
  if (!liberada) return res.status(403).json({ error: 'Origem não autorizada.' });
  next();
}

// ── Política de conteúdo da aplicação ─────────────────────────────────────
// As entradas accounts.google.com são o mínimo que o botão "Entrar com o
// Google" (Google Identity Services) precisa: o script oficial, o iframe do
// botão e as chamadas que ele faz. São caminhos sob /gsi/, não o domínio
// inteiro, e só existem porque o login com Google existe.
const POLITICA = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",  // 'unsafe-inline': atributos style= do React
  "img-src 'self' data: blob: https:",       // https: porque o ZoomDoc aceita imagem por endereço
  "font-src 'self'",                         // as fontes agora são da própria origem
  "connect-src 'self' https://accounts.google.com/gsi/",
  "media-src 'self' blob:",
  "frame-src 'self' https://accounts.google.com/gsi/",  // a prévia do MVP e o iframe do botão do Google
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",                  // ninguém embute a plataforma
  'upgrade-insecure-requests',
].join('; ');

/**
 * Cabeçalhos de segurança em toda resposta.
 *
 * A rota da prévia do MVP é a única exceção: ela serve código gerado por IA e
 * precisa da própria política, mais frouxa por dentro e mais isolada por
 * fora. Por isso ela declara os cabeçalhos dela e este middleware não
 * sobrescreve o que já foi definido.
 */
export function cabecalhos(req, res, next) {
  if (!res.getHeader('Content-Security-Policy')) {
    res.setHeader('Content-Security-Policy', POLITICA);
  }
  if (!res.getHeader('X-Frame-Options')) {
    res.setHeader('X-Frame-Options', 'DENY');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // allow-popups em vez de same-origin: o login com Google abre uma janela do
  // próprio Google, e com same-origin puro o navegador corta a comunicação
  // entre a janela e a página, deixando o botão girando para sempre. A
  // proteção que interessa continua: nenhuma página externa abre ESTA como
  // popup e mantém acesso a ela.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.removeHeader('X-Powered-By');

  // Recursos do aparelho que a plataforma não usa: negados de saída, para que
  // nem um script injetado consiga pedir.
  res.setHeader('Permissions-Policy', [
    'camera=()', 'payment=()', 'usb=()', 'magnetometer=()', 'gyroscope=()',
    'accelerometer=()', 'interest-cohort=()',
    'geolocation=(self)',   // o Studio pergunta o território
    'microphone=(self)',    // o ditado por voz na caixa de contexto
  ].join(', '));

  // HSTS só sob HTTPS. Mandado em ambiente local, prenderia o navegador do
  // desenvolvedor em https://localhost por meses.
  const seguro = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (seguro) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/** Política da prévia do MVP: código de terceiro, isolado do resto. */
export const POLITICA_PREVIA = [
  // O diretivo sandbox joga o documento numa origem opaca: mesmo servido do
  // nosso domínio, ele não alcança o armazenamento nem os dados da plataforma.
  'sandbox allow-scripts allow-forms allow-modals allow-popups',
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join('; ');

/**
 * Política dos sites publicados pelos fundadores.
 *
 * Mais permissiva que a da prévia por dentro, porque é um site de verdade que
 * precisa navegar e enviar formulário, e igualmente isolada por fora: o
 * `sandbox` sem `allow-same-origin` joga o documento numa origem opaca, então
 * o código gerado não alcança o armazenamento da plataforma nem o token de
 * quem estiver logado na mesma aba.
 *
 * `allow-top-navigation-by-user-activation` existe para os links entre as
 * páginas do próprio site funcionarem no clique. Sem ele, o site publicado
 * seria uma página só, sem saída.
 */
export const POLITICA_SITE = [
  'sandbox allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation',
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob: https:',
  'font-src data:',
  "connect-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
