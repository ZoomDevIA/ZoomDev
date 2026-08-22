// ═══════════════════════════════════════════════════════════════════════════
// TESTES DO CONECTOR ISOMETRIC
//
// Mesmo método do rotas.test.js: a aplicação sobe inteira numa porta livre e
// o teste fala HTTP com ela. Sem chaves no ambiente, o conector precisa servir
// o modo demonstração dizendo que é demonstração, no formato que a tela lê, e
// jamais deixar um segredo escapar pela resposta.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-isometric/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;
process.env.PORT = '0';
delete process.env.ISOMETRIC_CLIENT_SECRET;
delete process.env.ISOMETRIC_TOKEN;

const { servidor } = await import('../src/index.js');
await new Promise(ok => (servidor.listening ? ok() : servidor.once('listening', ok)));
const BASE = `http://127.0.0.1:${servidor.address().port}/api`;

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

test('conector isometric', async (t) => {
  const conta = (await pedir('/auth/register', {
    metodo: 'POST',
    corpo: { nome: 'Fundador', email: 'isometric@zd.dev', password: 'senha-de-teste-123' },
  })).dados;

  await t.test('rotas exigem sessão', async () => {
    const r = await pedir('/isometric/benchmark');
    assert.equal(r.status, 401);
  });

  await t.test('estado diz demonstração e ensina a ligar, sem vazar segredo', async () => {
    const r = await pedir('/isometric/estado', { token: conta.token });
    assert.equal(r.status, 200);
    assert.equal(r.dados.modo, 'demonstracao');
    assert.equal(r.dados.configurado, false);
    assert.match(r.dados.instrucoes, /ISOMETRIC_CLIENT_SECRET/);
    const texto = JSON.stringify(r.dados);
    assert.equal(/secret[^_]|token"?\s*:/i.test(texto.replace(/CLIENT_SECRET|ISOMETRIC_TOKEN/g, '')), false,
      'a resposta de estado não pode carregar valor de credencial');
  });

  await t.test('benchmark serve o formato da tela, rotulado como demonstração', async () => {
    const r = await pedir('/isometric/benchmark', { token: conta.token });
    assert.equal(r.status, 200);
    assert.equal(r.dados.modo, 'demonstracao');
    assert.equal(typeof r.dados.fonte, 'string');
    assert.equal(r.dados.totais.projetos > 0, true);
    assert.equal(r.dados.totais.creditosEmitidos > 0, true);
    assert.equal(Array.isArray(r.dados.vias), true);
    // As vias vêm ordenadas por volume, da maior para a menor
    const emitidos = r.dados.vias.map(v => v.creditosEmitidos);
    assert.deepEqual(emitidos, [...emitidos].sort((a, b) => b - a));
    // A leitura ZoomDev nunca promete elegibilidade que a Isometric não dá
    assert.deepEqual(r.dados.leituraZoomDev.elegiveis, ['enhanced-weathering', 'biochar']);
    assert.match(r.dados.leituraZoomDev.resumo, /não é via elegível/);
  });

  await t.test('projetos incluem o precedente brasileiro de ERW', async () => {
    const r = await pedir('/isometric/projetos', { token: conta.token });
    assert.equal(r.status, 200);
    assert.equal(r.dados.modo, 'demonstracao');
    const brasil = r.dados.projetos.filter(p => p.pais === 'Brasil');
    assert.equal(brasil.length > 0, true, 'o retrato demo precisa conter o caso brasileiro');
    for (const p of r.dados.projetos) {
      assert.equal(typeof p.nome, 'string');
      assert.equal(typeof p.via.nome, 'string');
      assert.equal(typeof p.via.elegivelZoomDev, 'boolean');
    }
  });

  servidor.close();
});
