// Os defeitos médios da auditoria: fuso, paginação, mensagem de erro que
// vazava o de dentro e plano parcial que era jogado fora inteiro. Nenhum
// derrubava o servidor, e por isso mesmo nenhum apareceria sem teste.
import test from 'node:test';
import assert from 'node:assert/strict';
import { hojeBR, ontemBR, diasEntre, diasAtePrazo, fimDoDiaBR } from '../src/services/calendario.js';
import { paraCliente, GENERICA } from '../src/services/erros.js';
import { _interno as iso } from '../src/services/isometric.js';
import { diasParaPrazo } from '../src/services/unicornio.js';

test('o dia é o de Brasília, não o do contêiner', async (t) => {
  // 22h de 24/ago em Brasília = 01h de 25/ago em UTC.
  const noiteBR = Date.parse('2026-08-24T22:00:00-03:00');

  await t.test('às dez da noite ainda é hoje', () => {
    assert.equal(new Date(noiteBR).toISOString().slice(0, 10), '2026-08-25', 'em UTC já virou');
    assert.equal(hojeBR(noiteBR), '2026-08-24', 'para quem está aqui, não virou');
    assert.equal(ontemBR(noiteBR), '2026-08-23');
  });

  await t.test('a sequência não quebra para quem entra sempre à noite', () => {
    // Três noites seguidas às 22h: o dia BR anda de um em um.
    const noites = [
      Date.parse('2026-08-24T22:00:00-03:00'),
      Date.parse('2026-08-25T22:00:00-03:00'),
      Date.parse('2026-08-26T22:00:00-03:00'),
    ].map(hojeBR);
    assert.deepEqual(noites, ['2026-08-24', '2026-08-25', '2026-08-26']);
    assert.equal(hojeBR(Date.parse('2026-08-25T22:00:00-03:00')), ontemBR(Date.parse('2026-08-26T22:00:00-03:00')),
      'o dia de ontem de hoje é o dia de hoje de ontem: é isso que mantém o streak');
  });

  await t.test('meia-noite em ponto e um segundo antes ficam em dias diferentes', () => {
    assert.equal(hojeBR(Date.parse('2026-08-24T23:59:59-03:00')), '2026-08-24');
    assert.equal(hojeBR(Date.parse('2026-08-25T00:00:00-03:00')), '2026-08-25');
  });

  await t.test('prazo de edital acaba à meia-noite daqui', () => {
    const fim = fimDoDiaBR('2026-09-30');
    assert.equal(new Date(fim).toISOString(), '2026-10-01T02:59:59.999Z', 'meia-noite BR, não UTC');

    // Às 21h30 do último dia ainda restam horas para submeter.
    const tarde = Date.parse('2026-09-30T21:30:00-03:00');
    assert.equal(diasAtePrazo('2026-09-30', tarde), 1, 'ainda aberto, não encerrado');
    assert.ok(diasAtePrazo('2026-09-30', Date.parse('2026-10-01T00:30:00-03:00')) <= 0, 'depois da virada, fechado');
  });

  await t.test('data inválida devolve null, não NaN nem "vence hoje"', () => {
    assert.equal(diasAtePrazo('trinta de setembro'), null);
    assert.equal(diasEntre('2026-01-01', 'nunca'), null);
    assert.equal(diasParaPrazo({ prazo: '' }), null);
  });

  await t.test('diasEntre conta dias inteiros', () => {
    assert.equal(diasEntre('2026-08-24', '2026-08-26'), 2);
    assert.equal(diasEntre('2026-08-24', '2026-08-24'), 0);
    assert.equal(diasEntre('2026-12-31', '2027-01-01'), 1);
  });
});

test('a mensagem de erro não entrega o de dentro', async (t) => {
  await t.test('4xx sai inteiro: foi escrito para o usuário ler', () => {
    const r = paraCliente(Object.assign(new Error('Seiva insuficiente: custa 180 🌿.'), { status: 402 }));
    assert.match(r.error, /Seiva insuficiente/);
    assert.equal(r.ref, undefined);
  });

  await t.test('5xx de terceiro vira frase neutra com referência', () => {
    const vazando = Object.assign(
      new Error('Isometric respondeu 502 em /projects: {"internal_id":"acct_9931","host":"api.sandbox"}'),
      { status: 502 },
    );
    const r = paraCliente(vazando, 'teste');
    assert.equal(r.error, GENERICA);
    assert.ok(!/internal_id|api\.sandbox/.test(JSON.stringify(r)), 'nada do corpo do terceiro atravessa');
    assert.match(r.ref, /^[A-Z0-9]{6}$/, 'sai um código para casar com o log');
  });

  await t.test('o "não configurado" é público de propósito', () => {
    const r = paraCliente(Object.assign(
      new Error('Login com Google não está configurado nesta instalação (defina GOOGLE_CLIENT_ID).'),
      { status: 503, publico: true },
    ));
    assert.match(r.error, /GOOGLE_CLIENT_ID/, 'quem opera precisa saber o que falta');
    assert.equal(r.ref, undefined);
  });

  await t.test('erro sem status é tratado como nosso', () => {
    const r = paraCliente(new Error('Cannot read properties of undefined (reading "nodes")'), 'teste');
    assert.equal(r.error, GENERICA);
    assert.ok(!/undefined/.test(r.error));
  });
});

test('o conector Isometric não duplica nem devolve NaN', async (t) => {
  await t.test('has_next_page sem cursor encerra em vez de repetir a página', async () => {
    let chamadas = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      chamadas += 1;
      return {
        ok: true,
        json: async () => ({ nodes: [{ id: 'a' }], page_info: { has_next_page: true, end_cursor: null } }),
      };
    };
    try {
      const nos = await iso.todasAsPaginas('/projects');
      assert.equal(chamadas, 1, 'sem cursor novo, não há próxima página para pedir');
      assert.equal(nos.length, 1, 'o mesmo nó não entra dez vezes');
    } finally {
      globalThis.fetch = original;
    }
  });

  await t.test('cursor repetido também encerra', async () => {
    let chamadas = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      chamadas += 1;
      return {
        ok: true,
        json: async () => ({ nodes: [{ id: 'a' }], page_info: { has_next_page: true, end_cursor: 'mesmo' } }),
      };
    };
    try {
      const nos = await iso.todasAsPaginas('/projects');
      assert.equal(chamadas, 2, 'a segunda chamada descobre que o cursor não andou');
      assert.equal(nos.length, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  await t.test('campo numérico estranho vira zero, não NaN', () => {
    const p = iso.normalizarProjeto({ id: 'x', credits_issued: 'não informado', credits_retired: null, durability_years: 'mil' });
    assert.equal(p.creditosEmitidos, 0);
    assert.equal(p.creditosAposentados, 0);
    assert.equal(p.durabilidadeAnos, null);
    assert.ok(Number.isFinite(p.creditosEmitidos + p.creditosAposentados), 'a soma do benchmark continua um número');
  });
});
