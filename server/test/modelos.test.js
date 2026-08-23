// O roteador de modelos é regra de dinheiro: cada tier recebe exatamente os
// parâmetros que aceita, e o mapa de papéis tem os padrões decididos pelo
// fundador (ago/2026). Se alguém trocar um padrão sem querer, este teste conta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { _interno } from '../src/agents/claude.js';

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

  await t.test('prompt de sistema sai com cache_control; vazio sai undefined', () => {
    const s = _interno.sistemaCacheado('Você é um agente.');
    assert.deepEqual(s, [{ type: 'text', text: 'Você é um agente.', cache_control: { type: 'ephemeral' } }]);
    assert.equal(_interno.sistemaCacheado(''), undefined);
    assert.equal(_interno.sistemaCacheado(undefined), undefined);
  });
});
