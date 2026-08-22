// ═══════════════════════════════════════════════════════════════════════════
// TESTES DO LOGIN COM GOOGLE
//
// O Google não participa: os testes geram um par de chaves RSA, plantam a
// pública no cache JWKS do serviço e assinam os próprios tokens. Assim a
// verificação inteira (assinatura, emissor, audiência, validade, e-mail
// confirmado) roda sem rede, e o que se testa é exatamente o código que vai
// julgar um token de verdade.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-google/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;
process.env.PORT = '0';
const CLIENT_ID = 'zoomdev-teste.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_ID = CLIENT_ID;

const { servidor } = await import('../src/index.js');
const { _interno } = await import('../src/services/loginGoogle.js');
await new Promise(ok => (servidor.listening ? ok() : servidor.once('listening', ok)));
const BASE = `http://127.0.0.1:${servidor.address().port}/api`;

// ── Par de chaves do "Google de teste" ─────────────────────────────────────
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = 'chave-de-teste';
_interno.plantarJwks([{ ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }]);

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function assinarToken(corpo, { kid = KID } = {}) {
  const cabecalho = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 300,
    email_verified: true,
    sub: 'sub-' + (corpo.email || 'x'),
    ...corpo,
  }));
  const assinatura = crypto.sign('RSA-SHA256', Buffer.from(`${cabecalho}.${payload}`), privateKey);
  return `${cabecalho}.${payload}.${b64url(assinatura)}`;
}

async function pedir(rota, { metodo = 'GET', token, corpo } = {}) {
  const r = await fetch(BASE + rota, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
  });
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  return { status: r.status, dados };
}

test('login com google', async (t) => {
  await t.test('a configuração pública anuncia o recurso e o client id', async () => {
    const r = await pedir('/auth/google/config');
    assert.equal(r.status, 200);
    assert.equal(r.dados.ativo, true);
    assert.equal(r.dados.clientId, CLIENT_ID);
  });

  await t.test('token válido cria a conta, abre sessão e registra os termos', async () => {
    const r = await pedir('/auth/google', {
      metodo: 'POST',
      corpo: { credential: assinarToken({ email: 'neo@zd.dev', name: 'Neo' }) },
    });
    assert.equal(r.status, 200);
    assert.equal(typeof r.dados.token, 'string');
    assert.equal(r.dados.user.email, 'neo@zd.dev');
    assert.equal(r.dados.user.nome, 'Neo');
    assert.equal(Boolean(r.dados.user.termosAceitos), true);
    assert.equal('passwordHash' in r.dados.user, false, 'nenhum hash pode sair na resposta');

    const eu = await pedir('/me', { token: r.dados.token });
    assert.equal(eu.status, 200);
    assert.equal(eu.dados.email, 'neo@zd.dev');
  });

  await t.test('conta criada pelo google não abre por senha (sem porta lateral)', async () => {
    const r = await pedir('/auth/login', {
      metodo: 'POST',
      corpo: { email: 'neo@zd.dev', password: '' },
    });
    assert.equal(r.status, 401);
    const r2 = await pedir('/auth/login', {
      metodo: 'POST',
      corpo: { email: 'neo@zd.dev', password: 'null' },
    });
    assert.equal(r2.status, 401);
  });

  await t.test('o mesmo google entra na mesma conta, sem duplicar', async () => {
    const a = await pedir('/auth/google', {
      metodo: 'POST', corpo: { credential: assinarToken({ email: 'neo@zd.dev', name: 'Neo' }) },
    });
    const b = await pedir('/auth/google', {
      metodo: 'POST', corpo: { credential: assinarToken({ email: 'neo@zd.dev', name: 'Neo' }) },
    });
    assert.equal(a.dados.user.id, b.dados.user.id);
  });

  await t.test('conta de senha existente recebe o google como segunda porta', async () => {
    const cadastro = await pedir('/auth/register', {
      metodo: 'POST',
      corpo: { nome: 'Aldo', email: 'aldo@zd.dev', password: 'senha-de-teste-123' },
    });
    assert.equal(cadastro.status, 200);
    const google = await pedir('/auth/google', {
      metodo: 'POST', corpo: { credential: assinarToken({ email: 'aldo@zd.dev', name: 'Aldo S' }) },
    });
    assert.equal(google.status, 200);
    assert.equal(google.dados.user.id, cadastro.dados.user.id, 'mesmo e-mail é a mesma conta');
    // e a senha continua funcionando
    const senha = await pedir('/auth/login', {
      metodo: 'POST', corpo: { email: 'aldo@zd.dev', password: 'senha-de-teste-123' },
    });
    assert.equal(senha.status, 200);
  });

  await t.test('token para outra aplicação é recusado', async () => {
    const r = await pedir('/auth/google', {
      metodo: 'POST',
      corpo: { credential: assinarToken({ email: 'x@zd.dev', aud: 'outra-app.apps.googleusercontent.com' }) },
    });
    assert.equal(r.status, 401);
    assert.match(r.dados.error, /outra aplicação/);
  });

  await t.test('token vencido é recusado', async () => {
    const r = await pedir('/auth/google', {
      metodo: 'POST',
      corpo: { credential: assinarToken({ email: 'x@zd.dev', exp: Math.floor(Date.now() / 1000) - 3600 }) },
    });
    assert.equal(r.status, 401);
    assert.match(r.dados.error, /expirado/);
  });

  await t.test('e-mail não verificado no google é recusado', async () => {
    const r = await pedir('/auth/google', {
      metodo: 'POST',
      corpo: { credential: assinarToken({ email: 'x@zd.dev', email_verified: false }) },
    });
    assert.equal(r.status, 401);
    assert.match(r.dados.error, /não está verificado/);
  });

  await t.test('assinatura de outra chave é recusada', async () => {
    const intruso = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const cab = b64url(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }));
    const corpo = b64url(JSON.stringify({
      iss: 'https://accounts.google.com', aud: CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 300,
      email: 'intruso@zd.dev', email_verified: true, sub: 'sub-intruso',
    }));
    const assinatura = crypto.sign('RSA-SHA256', Buffer.from(`${cab}.${corpo}`), intruso.privateKey);
    const r = await pedir('/auth/google', {
      metodo: 'POST', corpo: { credential: `${cab}.${corpo}.${b64url(assinatura)}` },
    });
    assert.equal(r.status, 401);
    assert.match(r.dados.error, /assinatura/);
  });

  await t.test('lixo no lugar do token é recusado sem quebrar', async () => {
    const r = await pedir('/auth/google', { metodo: 'POST', corpo: { credential: 'nao-e-um-jwt' } });
    assert.equal(r.status, 401);
  });

  servidor.close();
});
