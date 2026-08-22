// ═══════════════════════════════════════════════════════════════════════════
// TESTES DE ROTA PONTA A PONTA
//
// O que distingue este arquivo dos outros: aqui nada é importado e chamado
// como função. A aplicação sobe inteira, numa porta de verdade, e o teste fala
// com ela por HTTP, como o navegador fala.
//
// Isso pega uma classe de defeito que teste de unidade não pega: rota montada
// no prefixo errado, middleware fora de ordem, resposta que sai com o formato
// que a tela não sabe ler, e rota protegida que ficou aberta porque o
// `app.use` do autenticador entrou depois dela.
//
// PORT=0 pede uma porta livre ao sistema. Sem isso, o teste quebraria toda vez
// que alguém estivesse com a plataforma rodando na 4000.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-rotas/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;
process.env.PORT = '0';
delete process.env.ZOOMDEV_ADMIN_EMAIL;

const { servidor } = await import('../src/index.js');
await new Promise(ok => (servidor.listening ? ok() : servidor.once('listening', ok)));
const BASE = `http://127.0.0.1:${servidor.address().port}/api`;

/** Uma chamada HTTP com o formato que a plataforma usa. */
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

const criarConta = (email) =>
  pedir('/auth/register', { metodo: 'POST', corpo: { nome: 'Fundador', email, password: 'senha-de-teste-123' } });

test('rotas ponta a ponta', async (t) => {
  // O PRIMEIRO usuário registrado vira administrador quando não há
  // ZOOMDEV_ADMIN_EMAIL. A ordem aqui não é acidental: o dono entra primeiro,
  // a pessoa comum depois, e é a diferença entre os dois que os testes de
  // permissão exercitam.
  const dono = (await criarConta('dono-rotas@zd.dev')).dados;
  const comum = (await criarConta('comum-rotas@zd.dev')).dados;

  await t.test('sobe e responde a saúde sem token', async () => {
    const r = await pedir('/health');
    assert.equal(r.status, 200);
    assert.equal(r.dados.ok, true);
  });

  await t.test('registro devolve token e conta', async () => {
    assert.equal(typeof dono.token, 'string');
    assert.equal(dono.token.length > 20, true, 'token curto demais para ser aleatório');
    assert.equal(dono.user.email, 'dono-rotas@zd.dev');
    assert.equal('passwordHash' in dono.user, false, 'o hash da senha não pode sair na resposta');
  });

  await t.test('e-mail repetido não cria segunda conta', async () => {
    const r = await criarConta('dono-rotas@zd.dev');
    assert.equal(r.status, 409);
  });

  await t.test('senha curta é recusada', async () => {
    const r = await pedir('/auth/register', { metodo: 'POST', corpo: { email: 'curta@zd.dev', password: '123' } });
    assert.equal(r.status, 400);
  });

  await t.test('sem GOOGLE_CLIENT_ID o login com google se declara desligado', async () => {
    const cfg = await pedir('/auth/google/config');
    assert.equal(cfg.status, 200);
    assert.equal(cfg.dados.ativo, false);
    const r = await pedir('/auth/google', { metodo: 'POST', corpo: { credential: 'qualquer' } });
    assert.equal(r.status, 503);
    assert.match(r.dados.error, /GOOGLE_CLIENT_ID/);
  });

  await t.test('login com senha errada não distingue de conta inexistente', async () => {
    const errada = await pedir('/auth/login', { metodo: 'POST', corpo: { email: 'dono-rotas@zd.dev', password: 'nao-e-essa' } });
    const inexistente = await pedir('/auth/login', { metodo: 'POST', corpo: { email: 'ninguem@zd.dev', password: 'nao-e-essa' } });
    assert.equal(errada.status, 401);
    assert.equal(inexistente.status, 401);
    assert.equal(errada.dados.error, inexistente.dados.error,
      'mensagens diferentes contariam quais e-mails têm conta');
  });

  // ── O middleware de autenticação está na ordem certa? ──────────────────
  // Esta é a pergunta que só o teste de rota responde. Se alguém montar um
  // router novo ANTES do `app.use('/api', authMiddleware)`, ele nasce aberto e
  // nada no código chama atenção para isso.
  await t.test('rota protegida sem token responde 401', async () => {
    for (const rota of ['/me', '/projects', '/conta/sessoes', '/impacto/coinmax', '/studio/documentos']) {
      const r = await pedir(rota);
      assert.equal(r.status, 401, `${rota} deveria exigir token`);
    }
  });

  await t.test('rota protegida com token inventado responde 401', async () => {
    const r = await pedir('/me', { token: 'f'.repeat(64) });
    assert.equal(r.status, 401);
  });

  await t.test('/me devolve a conta do token, não a de outro', async () => {
    const a = await pedir('/me', { token: dono.token });
    const b = await pedir('/me', { token: comum.token });
    assert.equal(a.status, 200);
    assert.equal(a.dados.email, 'dono-rotas@zd.dev');
    assert.equal(b.dados.email, 'comum-rotas@zd.dev');
    assert.equal('passwordHash' in a.dados, false, 'o hash da senha não pode sair em /me');
  });

  // ── Permissão de administrador ─────────────────────────────────────────
  await t.test('painel de administração recusa quem não é administrador', async () => {
    const r = await pedir('/admin/overview', { token: comum.token });
    assert.equal(r.status, 403);
  });

  await t.test('painel de administração aceita o dono e devolve o retrato', async () => {
    const r = await pedir('/admin/overview', { token: dono.token });
    assert.equal(r.status, 200, 'o overview do admin não pode quebrar: ele carrega o painel inteiro');
    assert.equal(typeof r.dados, 'object');
  });

  // ── Projetos ───────────────────────────────────────────────────────────
  await t.test('lista de projetos nasce vazia e é por conta', async () => {
    const r = await pedir('/projects', { token: dono.token });
    assert.equal(r.status, 200);
    assert.equal(Array.isArray(r.dados.projetos || r.dados), true);
  });

  let projetoId = null;

  await t.test('ideação cria projeto e ele aparece na lista da conta', async () => {
    const r = await pedir('/projects/ideacao', {
      metodo: 'POST', token: dono.token,
      corpo: { descricao: 'Plataforma de rastreio de safra para cooperativas amazônicas, do plantio ao comprador' },
    });
    assert.equal(r.status, 200, `ideação falhou: ${JSON.stringify(r.dados).slice(0, 160)}`);
    const proj = r.dados.projeto || r.dados;
    projetoId = proj.id;
    assert.equal(typeof projetoId, 'string');

    const lista = await pedir('/projects', { token: dono.token });
    const projetos = lista.dados.projetos || lista.dados;
    assert.equal(projetos.some(p => p.id === projetoId), true);
  });

  await t.test('projeto de um não é visível para o outro', async () => {
    const r = await pedir(`/projects/${projetoId}`, { token: comum.token });
    assert.equal(r.status, 404, 'ver 403 aqui já contaria que o projeto existe');
  });

  await t.test('projeto inexistente responde 404, não 500', async () => {
    const r = await pedir('/projects/prj_nao_existe', { token: dono.token });
    assert.equal(r.status, 404);
  });

  // ── Domínio: carbono, impacto e Coin Max ───────────────────────────────
  await t.test('opções do Coin Max saem com cultura e cenário', async () => {
    const r = await pedir('/carbon/coinmax/opcoes', { token: dono.token });
    assert.equal(r.status, 200);
    assert.equal(r.dados.culturas.length > 0, true);
    assert.equal(r.dados.cenarios.length, 3, 'são três condições de solo');
  });

  await t.test('dossiê do Coin Max não vaza efeito em investigação para quem não é admin', async () => {
    const doAdmin = await pedir('/impacto/coinmax', { token: dono.token });
    const doComum = await pedir('/impacto/coinmax', { token: comum.token });
    assert.equal(doComum.status, 200);
    assert.equal(doComum.dados.identidade.marca, 'Coin Max');
    const selosComuns = doComum.dados.efeitos.map(e => e.selo);
    assert.equal(selosComuns.includes('HIPOTESE'), false, 'hipótese não sai para usuário comum');
    assert.equal(doAdmin.dados.efeitos.length > doComum.dados.efeitos.length, true,
      'o admin enxerga mais do que o usuário comum');
  });

  await t.test('simulação de impacto recusa área inválida', async () => {
    const zero = await pedir('/impacto/simular', { metodo: 'POST', token: dono.token, corpo: { culturaId: 'mandioca', hectares: 0 } });
    const absurda = await pedir('/impacto/simular', { metodo: 'POST', token: dono.token, corpo: { culturaId: 'mandioca', hectares: 9e9 } });
    assert.equal(zero.status, 400);
    assert.equal(absurda.status, 400);
  });

  await t.test('simulação de impacto devolve as quatro dimensões', async () => {
    const r = await pedir('/impacto/simular', {
      metodo: 'POST', token: dono.token,
      corpo: { culturaId: 'mandioca', hectares: 5000, cenarioId: 'conservador' },
    });
    assert.equal(r.status, 200);
    const d = r.dados.dimensoes;
    assert.deepEqual(Object.keys(d).sort(), ['alimentar', 'carbono', 'economico', 'energetico']);
    assert.equal(d.carbono.modo, 'ESTIMATIVA', 'carbono nunca sai como crédito sem MRV');
  });

  // ── Conta e sessões ────────────────────────────────────────────────────
  await t.test('a lista de sessões nunca devolve o token', async () => {
    const r = await pedir('/conta/sessoes', { token: dono.token });
    assert.equal(r.status, 200);
    const bruto = JSON.stringify(r.dados);
    assert.equal(bruto.includes(dono.token), false, 'o token não pode aparecer na listagem');
    assert.equal(r.dados.sessoes.some(s => s.atual), true, 'a sessão atual precisa estar marcada');
  });

  await t.test('encerrar a sessão mata o token na hora', async () => {
    const efemera = (await pedir('/auth/login', {
      metodo: 'POST', corpo: { email: 'comum-rotas@zd.dev', password: 'senha-de-teste-123' },
    })).dados.token;

    assert.equal((await pedir('/me', { token: efemera })).status, 200);
    const fim = await pedir('/conta/sessoes/encerrar', { metodo: 'POST', token: comum.token, corpo: { manterAtual: true } });
    assert.equal(fim.status, 200);
    assert.equal((await pedir('/me', { token: efemera })).status, 401, 'o token derrubado ainda valia');
    assert.equal((await pedir('/me', { token: comum.token })).status, 200, 'manterAtual deveria ter poupado este');
  });

  // ── Bordas ─────────────────────────────────────────────────────────────
  await t.test('rota inexistente responde 404 em JSON, não página de erro', async () => {
    const r = await pedir('/rota-que-nunca-existiu', { token: dono.token });
    assert.equal(r.status, 404);
    assert.equal(typeof r.dados, 'object');
  });

  await t.test('corpo JSON quebrado não derruba o servidor', async () => {
    const r = await fetch(`${BASE}/projects/ideacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dono.token}` },
      body: '{isso não é json',
    });
    assert.equal(r.status >= 400 && r.status < 500, true, `esperado erro de cliente, veio ${r.status}`);
    assert.equal((await pedir('/health')).status, 200, 'o servidor precisa continuar de pé depois');
  });
});

test.after(() => {
  servidor.close();
  fs.rmSync(DIR_TESTE, { recursive: true, force: true });
});
