// O roteador de modelos é regra de dinheiro: cada tier recebe exatamente os
// parâmetros que aceita, e o mapa de papéis tem os padrões decididos pelo
// fundador (ago/2026). Se alguém trocar um padrão sem querer, este teste conta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { _interno } from '../src/agents/claude.js';
import { store } from '../src/store.js';
import { modeloDoPapel, definirModelo, mapaAtual } from '../src/services/modelosIA.js';

test('mapa de modelos por módulo', async (t) => {
  await t.test('papéis e padrões decididos', () => {
    assert.equal(config.modelos.plano, 'claude-opus-5');
    assert.equal(config.modelos.pesquisa, 'claude-sonnet-5');
    assert.equal(config.modelos.codigo, 'claude-sonnet-5');
    assert.equal(config.modelos.chat, 'claude-sonnet-5');
    assert.equal(config.modelos.extracao, 'claude-haiku-4-5');
    assert.equal(config.modelos.gerado, 'claude-haiku-4-5');
  });

  await t.test('haiku não recebe effort nem fallbacks', () => {
    const p = _interno.porTier('claude-haiku-4-5', 'low');
    assert.equal(p.output_config, undefined);
    assert.equal(p.fallbacks, undefined);
    assert.equal(p.betas, undefined);
  });

  await t.test('sonnet recebe effort, mas não fallbacks', () => {
    const p = _interno.porTier('claude-sonnet-5', 'medium');
    assert.deepEqual(p.output_config, { effort: 'medium' });
    assert.equal(p.fallbacks, undefined);
  });

  await t.test('fable e opus 5 recebem effort e fallbacks de recusa', () => {
    for (const m of ['claude-fable-5', 'claude-opus-5']) {
      const p = _interno.porTier(m, 'high');
      assert.deepEqual(p.output_config, { effort: 'high' });
      assert.equal(p.fallbacks, 'default');
      assert.deepEqual(p.betas, ['server-side-fallback-2026-07-01']);
    }
  });

  await t.test('troca em tempo real: admin > env > principal, com restauração', () => {
    store.modelosIA = {};
    // Sem escolha do admin, vale o padrão do env
    assert.equal(modeloDoPapel('chat'), config.modelos.chat);

    // O admin promove o chat para o tier premium: vale na hora
    const depois = definirModelo('chat', 'claude-opus-5');
    assert.equal(modeloDoPapel('chat'), 'claude-opus-5');
    assert.equal(depois.personalizado, true);
    assert.equal(depois.padrao, config.modelos.chat);

    // O mapa reflete a escolha e o restante segue no padrão
    const mapa = mapaAtual();
    assert.equal(mapa.find(p => p.id === 'chat').modelo, 'claude-opus-5');
    assert.equal(mapa.find(p => p.id === 'plano').personalizado, false);

    // A troca vira evento auditável no barramento
    const ev = store.eventos.find(e => e.tipo === 'ia.modelo.trocado');
    assert.ok(ev, 'evento ia.modelo.trocado publicado');
    assert.equal(ev.dados.para, 'claude-opus-5');

    // Restaurar (null) volta ao padrão do env
    const restaurado = definirModelo('chat', null);
    assert.equal(restaurado.personalizado, false);
    assert.equal(modeloDoPapel('chat'), config.modelos.chat);
  });

  await t.test('papel ou modelo fora da lista são recusados com 400', () => {
    assert.throws(() => definirModelo('inexistente', 'claude-opus-5'), /Papel desconhecido/);
    assert.throws(() => definirModelo('chat', 'gpt-9'), /fora da lista/);
    try { definirModelo('chat', 'gpt-9'); } catch (e) { assert.equal(e.status, 400); }
  });

  await t.test('prompt de sistema sai com cache_control; vazio sai undefined', () => {
    const s = _interno.sistemaCacheado('Você é um agente.');
    assert.deepEqual(s, [{ type: 'text', text: 'Você é um agente.', cache_control: { type: 'ephemeral' } }]);
    assert.equal(_interno.sistemaCacheado(''), undefined);
    assert.equal(_interno.sistemaCacheado(undefined), undefined);
  });
});
