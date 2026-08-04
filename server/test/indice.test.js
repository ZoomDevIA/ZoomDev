// Testes do índice do ecossistema, o número do reator.
//
// A regra que estes testes protegem: subíndice sem base para medir devolve
// null, não zero. Zero por cento de missões concluídas quando não existe
// missão nenhuma é uma afirmação falsa, e um medidor que afirma falso derruba
// a confiança no painel inteiro. É o tipo de erro que passa despercebido
// porque a tela continua bonita.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-indice/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;

const { indiceEcossistema, snapshotEcossistema } = await import('../src/agents/sextaFeira.js');

const base = ({ comPlano = 0, total = 0, feitas = 0, missoes = 0, cruzamentos = [], aceite = null }) => ({
  projetos: { total, comPlano, missoes: { total: missoes, concluidas: feitas } },
  editais: { cruzamentos },
  bus: { taxaAceite: aceite },
});

test('índice do ecossistema', async (t) => {
  await t.test('sem base não vira zero', () => {
    const i = indiceEcossistema(base({}));
    assert.equal(i.geral, null, 'sem nada medido, não existe índice geral');
    assert.equal(i.medidos, 0);
    for (const p of i.partes) assert.equal(p.valor, null, `${p.id} sem base`);
  });

  await t.test('mede só o que tem base e diz quantos mediu', () => {
    const i = indiceEcossistema(base({ total: 4, comPlano: 3 }));
    assert.equal(i.partes.find(p => p.id === 'estrutura').valor, 75);
    assert.equal(i.partes.find(p => p.id === 'execucao').valor, null);
    assert.equal(i.medidos, 1);
    assert.equal(i.de, 4);
    assert.equal(i.geral, 75, 'com um subíndice só, o geral é ele mesmo');
  });

  await t.test('a média é ponderada e ignora o que não tem base', () => {
    // estrutura 100 (peso 3) e adesão 50 (peso 2) → (300 + 100) / 5 = 80
    const i = indiceEcossistema(base({ total: 2, comPlano: 2, aceite: 50 }));
    assert.equal(i.geral, 80);
  });

  await t.test('captação conta cruzamento forte sobre o total', () => {
    const cruzamentos = [{ score: 90 }, { score: 61 }, { score: 30 }, { score: 10 }];
    const i = indiceEcossistema(base({ cruzamentos }));
    assert.equal(i.partes.find(p => p.id === 'captacao').valor, 50);
  });

  await t.test('zero de verdade continua sendo zero', () => {
    const i = indiceEcossistema(base({ total: 3, comPlano: 0 }));
    assert.equal(i.partes.find(p => p.id === 'estrutura').valor, 0, 'projetos sem plano é zero medido');
    assert.equal(i.medidos, 1);
  });

  await t.test('o snapshot já traz o índice pronto', () => {
    const s = snapshotEcossistema();
    assert.ok(s.indice, 'o painel não precisa refazer a conta');
    assert.equal(s.indice.de, 4);
  });

  await t.test('projeto sem lista de missões não derruba o snapshot', async () => {
    const { store } = await import('../src/store.js');
    store.projects.quebrado = {
      id: 'quebrado', userId: 'x', nome: 'Incompleto', descricao: 'sem campos',
      fase: 'ideacao', classificacao: 'startup',
    };
    // Antes disto, um registro incompleto devolvia 500 e apagava o painel inteiro.
    const s = snapshotEcossistema();
    assert.equal(typeof s.projetos.missoes.total, 'number');
    delete store.projects.quebrado;
  });
});
