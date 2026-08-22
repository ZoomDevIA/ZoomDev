// ═══════════════════════════════════════════════════════════════════════════
// LOGIN COM GOOGLE — verificação do ID token do Google Identity Services.
//
// O navegador mostra o botão oficial do Google; o Google devolve ao navegador
// um ID token (JWT assinado com RS256) e o navegador o envia para cá. Este
// módulo confere a assinatura e as alegações do token SEM dependência nova:
// o crypto nativo do Node verifica RS256, e a chave pública vem do JWKS que o
// Google publica em https://www.googleapis.com/oauth2/v3/certs, com cache.
//
// Dois modos, no padrão da casa (email.js, isometric.js):
//   ATIVO       com GOOGLE_CLIENT_ID definido: o botão aparece na tela de
//               login e o token é verificado de verdade
//   DESLIGADO   sem a variável: a rota responde 503 explicando o que falta e
//               a tela nem oferece o botão
//
// Só o CLIENT_ID é necessário: no fluxo de ID token ele é público por
// definição (vai no HTML da página). Não existe segredo do Google aqui.
//
// O que é conferido antes de aceitar um token, e por quê:
//   assinatura   senão qualquer um fabrica um JWT com o e-mail alheio
//   iss          o emissor tem que ser o próprio Google
//   aud          um token emitido para OUTRO site não pode logar neste
//   exp          token vencido é token morto (com 60s de tolerância de relógio)
//   email_verified  conta Google sem e-mail confirmado não prova posse dele
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';

const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const URL_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const EMISSORES = ['https://accounts.google.com', 'accounts.google.com'];
const TOLERANCIA_RELOGIO_S = 60;
const CACHE_JWKS_MS = 6 * 60 * 60 * 1000;

export function modoLoginGoogle() {
  return CLIENT_ID ? 'ativo' : 'desligado';
}

export function clientIdGoogle() {
  return CLIENT_ID || null;
}

// ── JWKS com cache ─────────────────────────────────────────────────────────
// O Google gira as chaves de tempos em tempos. O cache expira em horas e,
// além disso, um `kid` desconhecido força uma rebusca imediata: é assim que
// uma rotação de chave no meio da janela não derruba o login de ninguém.

let jwksCache = { em: 0, chaves: [] };

async function buscarJwks(forcar = false) {
  const agora = Date.now();
  if (!forcar && jwksCache.chaves.length && agora - jwksCache.em < CACHE_JWKS_MS) {
    return jwksCache.chaves;
  }
  const r = await fetch(URL_JWKS);
  if (!r.ok) {
    throw Object.assign(new Error(`Não consegui buscar as chaves públicas do Google (${r.status}).`), { status: 502 });
  }
  const corpo = await r.json();
  jwksCache = { em: agora, chaves: corpo.keys || [] };
  return jwksCache.chaves;
}

async function chavePorKid(kid) {
  let chaves = await buscarJwks();
  let jwk = chaves.find(c => c.kid === kid);
  if (!jwk) {
    chaves = await buscarJwks(true);
    jwk = chaves.find(c => c.kid === kid);
  }
  return jwk || null;
}

// ── Decodificação e verificação do JWT ─────────────────────────────────────

function b64url(texto) {
  return Buffer.from(String(texto).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function decodificarParte(parte) {
  try { return JSON.parse(b64url(parte).toString('utf8')); } catch { return null; }
}

function recusa(motivo) {
  return Object.assign(new Error(`Login com Google recusado: ${motivo}`), { status: 401 });
}

/**
 * Verifica um ID token do Google e devolve a identidade confirmada.
 * Lança 401 com o motivo em qualquer falha; nunca aceita "quase".
 */
export async function verificarCredencialGoogle(credential) {
  if (modoLoginGoogle() === 'desligado') {
    throw Object.assign(
      new Error('Login com Google não está configurado nesta instalação (defina GOOGLE_CLIENT_ID).'),
      { status: 503 },
    );
  }
  const partes = String(credential || '').split('.');
  if (partes.length !== 3) throw recusa('o token não tem o formato de um JWT');

  const [cabecalhoB64, corpoB64, assinaturaB64] = partes;
  const cabecalho = decodificarParte(cabecalhoB64);
  const corpo = decodificarParte(corpoB64);
  if (!cabecalho || !corpo) throw recusa('não consegui decodificar o token');
  if (cabecalho.alg !== 'RS256') throw recusa(`algoritmo inesperado (${cabecalho.alg})`);

  const jwk = await chavePorKid(cabecalho.kid);
  if (!jwk) throw recusa('a chave que assinou o token não está entre as chaves públicas do Google');

  const chavePublica = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const validaAssinatura = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${cabecalhoB64}.${corpoB64}`),
    chavePublica,
    b64url(assinaturaB64),
  );
  if (!validaAssinatura) throw recusa('assinatura inválida');

  if (!EMISSORES.includes(corpo.iss)) throw recusa(`emissor inesperado (${corpo.iss})`);
  if (corpo.aud !== CLIENT_ID) throw recusa('o token foi emitido para outra aplicação');
  const agoraS = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(corpo.exp) || corpo.exp < agoraS - TOLERANCIA_RELOGIO_S) throw recusa('token expirado');
  if (corpo.email_verified !== true) throw recusa('o e-mail desta conta Google não está verificado');
  if (!String(corpo.email || '').includes('@')) throw recusa('o token não carrega um e-mail');

  return {
    email: String(corpo.email).trim().toLowerCase(),
    nome: corpo.name || null,
    foto: corpo.picture || null,
    sub: corpo.sub,
  };
}

// Os testes assinam tokens com uma chave própria e a plantam aqui: assim a
// verificação inteira roda sem rede e sem depender do Google estar de pé.
export const _interno = {
  plantarJwks(chaves) { jwksCache = { em: Date.now(), chaves }; },
  limparJwks() { jwksCache = { em: 0, chaves: [] }; },
};
