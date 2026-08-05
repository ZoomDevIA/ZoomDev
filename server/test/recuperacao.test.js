// Testes do caminho de volta quando o e-mail não sai.
//
// Este arquivo existe por causa de um incidente real: o dono da plataforma
// trocou a senha, ficou trancado do lado de fora e o "esqueci minha senha"
// não tinha como entregar o link, porque não havia provedor de e-mail
// configurado. O pedido funcionava, o link era gerado, e ninguém o via.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-recuperacao/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;
process.env.ZOOMDEV_URL = 'https://exemplo.test';

const { store } = await import('../src/store.js');
const { register, login } = await import('../src/auth.js');
const { pedirRedefinicao, redefinir, destravarNaPartida } = await import('../src/services/recuperacaoSenha.js');

/** Captura o que o servidor escreveu no log durante uma ação. */
async function comLog(acao) {
  const original = console.warn;
  let texto = '';
  console.warn = (...args) => { texto += args.join(' ') + '\n'; };
  try { return { valor: await acao(), texto }; }
  finally { console.warn = original; }
}

const linkDe = (texto) => texto.match(/https:\/\/\S+\/redefinir\?token=[a-f0-9]+/)?.[0];
const tokenDe = (link) => new URL(link).searchParams.get('token');

test('recuperação sem provedor de e-mail', async (t) => {
  await t.test('o link vai para o log do servidor, e não para a resposta', async () => {
    register({ nome: 'Dona', email: 'dona@zd.dev', password: 'senhaantiga1' });
    const { valor, texto } = await comLog(() => pedirRedefinicao('dona@zd.dev'));

    const link = linkDe(texto);
    assert.ok(link, 'o link precisa aparecer no log, senão a conta fica trancada');
    assert.ok(texto.includes('dona@zd.dev'));

    // A resposta HTTP é o ponto sensível: qualquer um a provoca, para
    // qualquer e-mail. Fora de produção o link vem junto para o
    // desenvolvimento não travar; em produção, nunca.
    const anterior = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { valor: emProd } = await comLog(() => pedirRedefinicao('dona@zd.dev'));
    process.env.NODE_ENV = anterior;
    assert.equal(emProd.link, undefined, 'em produção o link nunca sai na resposta');
    assert.equal(typeof valor, 'object');
  });

  await t.test('o link do log realmente redefine e a senha nova entra', async () => {
    register({ nome: 'Volta', email: 'volta@zd.dev', password: 'senhaantiga1' });
    const { texto } = await comLog(() => pedirRedefinicao('volta@zd.dev'));
    const token = tokenDe(linkDe(texto));

    await redefinir({ token, senha: 'senhanovaboa9@' });
    assert.ok(login({ email: 'volta@zd.dev', password: 'senhanovaboa9@' }).token);
    assert.throws(() => login({ email: 'volta@zd.dev', password: 'senhaantiga1' }), /inválidos/,
      'a senha antiga para de valer');
  });

  await t.test('o link é de uso único', async () => {
    register({ nome: 'Uma', email: 'uma@zd.dev', password: 'senhaantiga1' });
    const { texto } = await comLog(() => pedirRedefinicao('uma@zd.dev'));
    const token = tokenDe(linkDe(texto));
    await redefinir({ token, senha: 'primeirasenha1@' });
    await assert.rejects(() => redefinir({ token, senha: 'segundasenha1@' }), /inválido ou já foi usado/);
  });
});

test('destravamento de emergência na partida', async (t) => {
  await t.test('sem a variável, não faz nada', async () => {
    delete process.env.ZOOMDEV_RECUPERAR;
    const { valor, texto } = await comLog(() => destravarNaPartida());
    assert.equal(valor, null);
    assert.equal(texto, '', 'nenhum link é impresso sem pedido explícito');
  });

  await t.test('com a variável, imprime um link que funciona', async () => {
    register({ nome: 'Trancada', email: 'trancada@zd.dev', password: 'senhaantiga1' });
    process.env.ZOOMDEV_RECUPERAR = 'TRANCADA@zd.dev';   // maiúsculas não atrapalham
    const { valor, texto } = await comLog(() => destravarNaPartida());
    delete process.env.ZOOMDEV_RECUPERAR;

    assert.equal(valor.email, 'trancada@zd.dev');
    const token = tokenDe(linkDe(texto));
    await redefinir({ token, senha: 'entreidevolta1@' });
    assert.ok(login({ email: 'trancada@zd.dev', password: 'entreidevolta1@' }).token);
  });

  await t.test('e-mail que não existe não cria pedido nenhum', async () => {
    const antes = Object.keys(store.recuperacoes).length;
    process.env.ZOOMDEV_RECUPERAR = 'ninguem@zd.dev';
    const { valor } = await comLog(() => destravarNaPartida());
    delete process.env.ZOOMDEV_RECUPERAR;
    assert.equal(valor, null);
    assert.equal(Object.keys(store.recuperacoes).length, antes);
  });

  await t.test('destravar não troca a senha, só abre um caminho', async () => {
    register({ nome: 'Intacta', email: 'intacta@zd.dev', password: 'senhaantiga1' });
    process.env.ZOOMDEV_RECUPERAR = 'intacta@zd.dev';
    await comLog(() => destravarNaPartida());
    delete process.env.ZOOMDEV_RECUPERAR;

    // A senha continua a mesma: quem define variável de ambiente não escolhe
    // senha nenhuma, porque senha em variável fica em texto claro no painel
    // da hospedagem para sempre. O que ele ganha é um link de uso único.
    assert.ok(login({ email: 'intacta@zd.dev', password: 'senhaantiga1' }).token,
      'a senha anterior segue valendo até alguém usar o link');
  });
});
