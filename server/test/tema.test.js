// Testes da persistência de tema.
//
// A rota recebe um objeto inteiro montado no navegador, e é a única do sistema
// com esse formato. Sem lista fechada, ela viraria um campo livre gravado no
// perfil: qualquer chave, qualquer tamanho, qualquer conteúdo. Estes testes
// existem porque a falha seria silenciosa (o tema continua funcionando) e só
// apareceria no dia em que alguém usasse o perfil como depósito.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-tema/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;

const { store } = await import('../src/store.js');
const { register } = await import('../src/auth.js');
const { contaRouter } = await import('../src/routes/conta.js');

// A rota PATCH / é a primeira camada do roteador. Chamá-la direto evita subir
// um servidor HTTP só para exercitar uma validação.
const patch = contaRouter.stack.find(c => c.route?.path === '/' && c.route.methods.patch).route.stack[0].handle;

function resposta() {
  return {
    statusCode: 200,
    corpo: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.corpo = o; return this; },
  };
}

function usuario(sufixo) {
  const r = register({ nome: 'Teste', email: `tema-${sufixo}@zd.dev`, password: 'senha123456' });
  return store.users[r.user.id];
}

function enviar(user, body) {
  const res = resposta();
  patch({ user, body }, res);
  return res;
}

test('persistência de tema', async (t) => {
  await t.test('grava o que é válido e devolve no perfil público', () => {
    const u = usuario('a');
    const res = enviar(u, { tema: { acento: '#A855F7', fundo: 'carbono', densidade: 'compacto', volume: 0.6 } });
    assert.equal(res.statusCode, 200);
    assert.equal(u.tema.acento, '#a855f7', 'hex é normalizado para minúsculo');
    assert.equal(u.tema.fundo, 'carbono');
    assert.equal(res.corpo.tema.densidade, 'compacto', 'o tema volta junto do perfil');
  });

  await t.test('descarta campo que não existe no tema', () => {
    const u = usuario('b');
    enviar(u, { tema: { acento: '#00e5ff', papelDeParede: 'x'.repeat(5000), papel: 'admin' } });
    assert.deepEqual(Object.keys(u.tema), ['acento'], 'só o campo conhecido entra');
    assert.notEqual(u.papel, 'admin', 'o tema não é caminho para escalar papel');
  });

  await t.test('descarta valor fora do formato', () => {
    const u = usuario('c');
    enviar(u, {
      tema: {
        acento: 'javascript:alert(1)',
        marca: '#00ff64',
        fundo: '../../etc/passwd',
        volume: 99,
      },
    });
    assert.equal(u.tema.acento, undefined, 'cor que não é hex não entra');
    assert.equal(u.tema.fundo, undefined, 'travessia de caminho não entra');
    assert.equal(u.tema.marca, '#00ff64');
    assert.equal(u.tema.volume, 1, 'volume é preso na faixa em vez de recusado');
  });

  await t.test('objeto sem nenhum campo aproveitável é recusado', () => {
    const u = usuario('d');
    const res = enviar(u, { tema: { nada: true } });
    assert.equal(res.statusCode, 400);
    assert.equal(u.tema, undefined, 'nada é gravado quando nada é válido');
  });

  await t.test('editar o nome continua funcionando sem tema', () => {
    const u = usuario('e');
    const res = enviar(u, { nome: 'Fundadora' });
    assert.equal(res.statusCode, 200);
    assert.equal(u.nome, 'Fundadora');
  });
});
