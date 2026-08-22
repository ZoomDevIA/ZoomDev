// ═══════════════════════════════════════════════════════════════════════════
// TESTES DA CADEIA DE CUSTÓDIA E DO BARRAMENTO
//
// A aplicação sobe inteira e as rotas são exercitadas por HTTP, como nos
// outros arquivos. A diferença: aqui o teste também mete a mão no store de
// propósito, porque a promessa da cadeia é justamente detectar adulteração
// direta no banco, e só dá para provar isso adulterando de verdade.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-custodia/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;
process.env.PORT = '0';

const { servidor } = await import('../src/index.js');
const { store } = await import('../src/store.js');
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

test('cadeia de custódia e barramento', async (t) => {
  const conta = (await pedir('/auth/register', {
    metodo: 'POST',
    corpo: { nome: 'Fundador', email: 'custodia@zd.dev', password: 'senha-de-teste-123' },
  })).dados;
  const T = { token: conta.token };

  await t.test('território serve os lotes com selo composto calculado', async () => {
    const r = await pedir('/territorio', T);
    assert.equal(r.status, 200);
    assert.equal(r.dados.demonstracao, true);
    assert.equal(r.dados.lotes.type, 'FeatureCollection');
    const ap42 = r.dados.lotes.features.find(f => f.properties.id === 'AP-0042');
    // A trilha semeada tem CAMPO no meio: o elo mais fraco governa
    assert.equal(ap42.properties.selo, 'CAMPO');
    assert.equal(ap42.properties.confianca, 80);
    const pot = r.dados.lotes.features.find(f => f.properties.status === 'potencial');
    assert.equal(pot.properties.selo, 'VISAO', 'lote sem evidência ainda não provou nada');
    assert.equal(r.dados.totais.hectares, 735 + 512 + 488);
  });

  await t.test('a semeadura publica eventos com selo no barramento', async () => {
    const r = await pedir('/barramento?limite=50', T);
    assert.equal(r.status, 200);
    const tipos = new Set(r.dados.eventos.map(e => e.tipo));
    assert.equal(tipos.has('evidencia.registrada'), true);
    assert.equal(tipos.has('selo.recalculado'), true);
    for (const e of r.dados.eventos) {
      assert.equal(typeof e.selo, 'string', 'todo evento carrega o selo junto');
      assert.equal(typeof e.confianca, 'number');
    }
  });

  await t.test('registrar evidência estende a cadeia e recalcula o selo', async () => {
    const antes = (await pedir('/evidencias/AP-0051', T)).dados;
    assert.equal(antes.selo.selo, 'ESTRATEGIA', 'o plano proposto é o elo fraco da adesão');

    const r = await pedir('/evidencias', {
      metodo: 'POST', token: conta.token,
      corpo: { loteId: 'AP-0051', tipo: 'laudo-solo', selo: 'LAUDO', descricao: 'Laudo de solo do primeiro ciclo, assinado' },
    });
    assert.equal(r.status, 200);
    assert.equal(r.dados.selo.selo, 'ESTRATEGIA', 'elo fraco não sobe só porque entrou laudo');

    const depois = (await pedir('/evidencias/AP-0051', T)).dados;
    assert.equal(depois.trilha[0].tipo, 'laudo-solo', 'a trilha vem da mais nova para a mais velha');
    assert.equal(depois.trilha[0].anterior, depois.trilha[1].hash, 'cada elo referencia o hash do anterior');
  });

  await t.test('evidência sem selo válido ou sem descrição é recusada', async () => {
    const semSelo = await pedir('/evidencias', {
      metodo: 'POST', token: conta.token,
      corpo: { loteId: 'AP-0051', selo: 'PLATINA', descricao: 'uma descrição qualquer' },
    });
    assert.equal(semSelo.status, 400);
    const curta = await pedir('/evidencias', {
      metodo: 'POST', token: conta.token,
      corpo: { loteId: 'AP-0051', selo: 'CAMPO', descricao: 'curta' },
    });
    assert.equal(curta.status, 400);
  });

  await t.test('cadeia íntegra verifica limpa', async () => {
    const r = await pedir('/evidencias/AP-0042/verificar', T);
    assert.equal(r.status, 200);
    assert.equal(r.dados.integra, true);
    assert.equal(r.dados.quebras.length, 0);
    assert.equal(typeof r.dados.ancora, 'string');
  });

  await t.test('editar o passado quebra a corrente, e o verificador diz onde', async () => {
    // Adulteração direta no banco: reescreve a descrição de um elo do meio
    const alvo = store.evidencias['AP-0042'][1];
    const original = alvo.descricao;
    alvo.descricao = 'aplicação de 50 L/ha';   // dez vezes a dose, sem novo lacre

    const r = await pedir('/evidencias/AP-0042/verificar', T);
    assert.equal(r.dados.integra, false);
    assert.equal(r.dados.quebras.some(q => q.posicao === 1 && /alterado/.test(q.motivo)), true);

    alvo.descricao = original;   // restaura e a cadeia volta a fechar
    const limpo = await pedir('/evidencias/AP-0042/verificar', T);
    assert.equal(limpo.dados.integra, true);
  });

  await t.test('apagar um elo do meio também é detectado', async () => {
    const removido = store.evidencias['AP-0038'].splice(1, 1)[0];
    const r = await pedir('/evidencias/AP-0038/verificar', T);
    assert.equal(r.dados.integra, false);
    assert.equal(r.dados.quebras.some(q => /não referencia/.test(q.motivo)), true);
    store.evidencias['AP-0038'].splice(1, 0, removido);
  });

  await t.test('as rotas de prova exigem sessão', async () => {
    for (const rota of ['/territorio', '/barramento', '/evidencias/AP-0042']) {
      const r = await pedir(rota);
      assert.equal(r.status, 401, rota);
    }
  });

  servidor.close();
});
