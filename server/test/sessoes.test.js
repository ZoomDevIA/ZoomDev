// Testes do encerramento de sessões.
//
// Existem porque a falha é invisível: a tela diz "pronto", a pessoa acredita
// que derrubou o computador do escritório, e o token continua valendo. Um erro
// aqui não aparece em lugar nenhum até virar um incidente.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-sessoes/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;

const { store } = await import('../src/store.js');
const { register, login, authMiddleware, encerrarSessao, encerrarSessoesDe, sessoesDe, idSessao, rotularAparelho } = await import('../src/auth.js');

const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 Version/17.0 Mobile/15E148 Safari/604.1';

function conta(sufixo) {
  const email = `sessao-${sufixo}@zd.dev`;
  register({ nome: 'Fundador', email, password: 'senha123456' }, rotularAparelho(UA_WIN));
  return email;
}

const entrar = (email, ua) => login({ email, password: 'senha123456' }, rotularAparelho(ua)).token;

function passa(token) {
  let seguiu = false;
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json() { return this; } };
  authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, () => { seguiu = true; });
  return seguiu;
}

test('encerramento de sessões', async (t) => {
  await t.test('rotula o aparelho sem guardar a impressão digital inteira', () => {
    assert.equal(rotularAparelho(UA_WIN), 'Chrome · Windows');
    assert.equal(rotularAparelho(UA_IOS), 'Safari · iOS');
    assert.equal(rotularAparelho(''), 'aparelho não identificado');
    assert.equal(rotularAparelho(UA_WIN).includes('537.36'), false, 'versão de build não entra');
  });

  await t.test('encerrar as outras derruba o escritório e mantém quem pediu', () => {
    const email = conta('a');
    const escritorio = entrar(email, UA_WIN);
    const celular = entrar(email, UA_IOS);
    const aqui = entrar(email, UA_WIN);
    const userId = store.sessions[aqui].userId;

    const n = encerrarSessoesDe(userId, { exceto: aqui });
    assert.equal(n, 3, 'as três anteriores caem: cadastro, escritório e celular');
    assert.equal(passa(escritorio), false, 'o token do escritório não vale mais');
    assert.equal(passa(celular), false);
    assert.equal(passa(aqui), true, 'quem pediu continua dentro');
  });

  await t.test('encerrar todas derruba inclusive quem pediu', () => {
    const email = conta('b');
    const aqui = entrar(email, UA_WIN);
    const userId = store.sessions[aqui].userId;
    encerrarSessoesDe(userId);
    assert.equal(passa(aqui), false);
  });

  await t.test('não encosta na sessão de outra pessoa', () => {
    const meu = entrar(conta('c'), UA_WIN);
    const alheio = entrar(conta('d'), UA_IOS);
    encerrarSessoesDe(store.sessions[meu].userId);
    assert.equal(passa(alheio), true, 'a conta ao lado segue conectada');
  });

  await t.test('desconecta um aparelho só, pelo identificador público', () => {
    const email = conta('f');
    const escritorio = entrar(email, UA_WIN);
    const celular = entrar(email, UA_IOS);
    const aqui = entrar(email, UA_WIN);
    const userId = store.sessions[aqui].userId;

    const alvo = sessoesDe(userId, aqui).find(s => s.aparelho === 'Safari · iOS');
    const r = encerrarSessao(userId, alvo.id);

    assert.equal(r.encerrada, true);
    assert.equal(r.aparelho, 'Safari · iOS', 'a interface pode dizer o que caiu');
    assert.equal(passa(celular), false, 'só o alvo cai');
    assert.equal(passa(escritorio), true, 'os outros seguem');
    assert.equal(passa(aqui), true);
  });

  await t.test('não desconecta sessão de outra pessoa pelo identificador', () => {
    const meu = entrar(conta('g'), UA_WIN);
    const alheio = entrar(conta('h'), UA_IOS);
    const idAlheio = idSessao(alheio);

    const r = encerrarSessao(store.sessions[meu].userId, idAlheio);
    assert.equal(r.encerrada, false, 'o dono é conferido antes');
    assert.equal(passa(alheio), true, 'a sessão do outro sobrevive');
  });

  await t.test('o identificador é resumo do token, não o token', () => {
    const tok = entrar(conta('i'), UA_WIN);
    const sid = idSessao(tok);
    assert.notEqual(sid, tok);
    assert.equal(tok.includes(sid), false, 'não é um pedaço do token');
    assert.equal(sid, idSessao(tok), 'é estável entre chamadas');
    assert.equal(passa(sid), false, 'o identificador não serve para entrar');
  });

  await t.test('a elevação do painel cai junto com as sessões', () => {
    const email = conta('j');
    const tok = entrar(email, UA_WIN);
    const userId = store.sessions[tok].userId;

    // Simula a janela elevada de 30 minutos aberta naquele navegador.
    // `sessoesPainel` é getter no store: dá para mexer no conteúdo, não para
    // trocar o objeto.
    store.sessoesPainel.elev1 = {
      userId,
      criadoEm: new Date().toISOString(),
      expiraEm: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
    store.sessoesPainel.deOutro = { userId: 'usr_outro', expiraEm: new Date(Date.now() + 30 * 60_000).toISOString() };

    encerrarSessoesDe(userId);

    assert.equal(store.sessoesPainel.elev1, undefined,
      'elevação velha reabriria o painel sem pedir a senha de novo');
    assert.ok(store.sessoesPainel.deOutro, 'a elevação de outra pessoa não é tocada');
  });

  await t.test('a listagem identifica a atual e nunca devolve o token', () => {
    const email = conta('e');
    entrar(email, UA_IOS);
    const aqui = entrar(email, UA_WIN);
    const lista = sessoesDe(store.sessions[aqui].userId, aqui);

    assert.equal(lista.filter(s => s.atual).length, 1);
    assert.equal(lista[0].atual, true, 'a atual vem primeiro');
    assert.ok(lista.some(s => s.aparelho === 'Safari · iOS'));
    for (const s of lista) {
      assert.equal('token' in s, false, 'token nunca sai do servidor');
      assert.deepEqual(Object.keys(s).sort(), ['aparelho', 'atual', 'criadoEm', 'expiraEm', 'id']);
    }
  });
});
