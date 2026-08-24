// ═══════════════════════════════════════════════════════════════════════════
// TESTE DO CHASSI: o modo foco não pode sequestrar a preferência de menu
//
// O defeito que este teste existe para pegar não dá erro em lugar nenhum: o
// modo foco recolhia a barra lateral chamando o mesmo estado que a pessoa
// controla pelo botão, e esse estado é gravado no navegador. Bastava visitar o
// Território uma vez para a preferência virar "recolhido" e o menu passar a
// nascer recolhido em toda tela e em toda sessão seguinte, sem explicação.
//
// A regra que sustenta o conserto: existe uma variável para a ESCOLHA da
// pessoa (gravada) e outra para o estado TEMPORÁRIO durante o foco (descartada
// na saída). Este teste garante que a gravação só olha a primeira.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = new URL('../../', import.meta.url).pathname;
const LAYOUT = fs.readFileSync(path.join(RAIZ, 'web/src/components/Layout.jsx'), 'utf8');

test('chassi: foco e preferência de menu são estados separados', async (t) => {
  await t.test('a gravação no navegador só recebe a preferência da pessoa', () => {
    const gravacoes = [...LAYOUT.matchAll(/localStorage\.setItem\(CHAVE_RECOLHIDO,\s*([A-Za-z]+)/g)]
      .map(m => m[1]);
    assert.deepEqual(gravacoes, ['preferenciaMenu'],
      'CHAVE_RECOLHIDO deve gravar preferenciaMenu, e nada além dela');
  });

  await t.test('o efeito do foco não escreve na preferência', () => {
    const efeito = LAYOUT.match(/if \(foco\) setRecolhidoNoFoco\(true\);[\s\S]{0,200}?\}, \[foco\]\);/);
    assert.ok(efeito, 'o efeito de entrada no foco existe');
    assert.ok(!/setPreferenciaMenu/.test(efeito[0]),
      'entrar ou sair do foco nunca pode chamar setPreferenciaMenu');
  });

  await t.test('o estado efetivo do menu deriva dos dois, na ordem certa', () => {
    assert.match(LAYOUT, /const recolhido = foco \? recolhidoNoFoco : preferenciaMenu;/);
    // O botão troca o estado certo conforme o contexto
    assert.match(LAYOUT, /const alternarMenu = \(\) => \(foco \? setRecolhidoNoFoco\(v => !v\) : setPreferenciaMenu\(v => !v\)\);/);
    assert.match(LAYOUT, /onClick=\{alternarMenu\}/);
  });

  await t.test('não sobrou o mecanismo antigo de guardar e devolver', () => {
    assert.ok(!/menuAntes/.test(LAYOUT), 'a gambiarra do ref menuAntes foi removida');
    assert.ok(!/setRecolhido\(/.test(LAYOUT), 'não existe mais um setter único de recolhido');
  });
});
