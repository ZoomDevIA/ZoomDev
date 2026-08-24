// Os defeitos de interface da auditoria. Metade é conta (infinito na
// calculadora), metade é tela, e para a parte de tela o teste lê o JSX: é o
// mesmo recurso do chassi.test.js, e existe porque nenhum destes derruba
// nada — eles só entregam um número errado, uma barra cheia ou um cabeçalho
// dobrado, calados.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calcularPassivo } from '../src/services/passivoAmbiental.js';
import { resumoElenco } from '../src/services/elenco.js';

const RAIZ = new URL('../../', import.meta.url).pathname;
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

/** Percorre o resultado inteiro exigindo que todo número seja finito. */
function todosFinitos(o, caminho = '') {
  for (const [k, v] of Object.entries(o || {})) {
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `${caminho}${k} saiu ${v}`);
    else if (v && typeof v === 'object') todosFinitos(v, `${caminho}${k}.`);
  }
}

test('a calculadora não produz infinito', async (t) => {
  await t.test('1e999 num campo não vira inventário infinito', () => {
    // Number('1e999') é Infinity, e Infinity atravessava o Math.max: o
    // inventário inteiro saía como "Infinity tCO2e" e o custo de compensação
    // como "R$ Infinity".
    const r = calcularPassivo({ energiaKwhMes: '1e999', gasolinaLitrosMes: '1e999' });
    todosFinitos(r);
    assert.equal(r.totalTco2eAno, calcularPassivo({}).totalTco2eAno,
      'valor impossível é descartado como campo em branco, não vira teto inventado');
  });

  await t.test('texto e negativo continuam virando zero', () => {
    const vazio = calcularPassivo({});
    const lixo = calcularPassivo({ energiaKwhMes: 'muita', gasolinaLitrosMes: -500 });
    assert.equal(lixo.totalTco2eAno, vazio.totalTco2eAno, 'entrada inválida equivale a campo em branco');
  });

  await t.test('entrada plausível continua contando as fontes', () => {
    const r = calcularPassivo({ energiaKwhMes: 350, funcionariosEscritorio: 3, gastoNuvemReaisMes: 500 });
    todosFinitos(r);
    assert.ok(r.totalTco2eAno > 0, 'o inventário de uma operação real não pode dar zero');
    assert.ok(r.fontes.length >= 2, 'cada campo preenchido vira uma fonte no inventário');
  });
});

test('o painel conta os agentes em vez de cravar o número', async (t) => {
  await t.test('resumoElenco devolve o placar vivo', () => {
    const r = resumoElenco();
    assert.ok(Number.isInteger(r.total) && r.total > 0);
    assert.ok(Number.isInteger(r.ativos) && r.ativos <= r.total);
  });

  await t.test('o JSX do painel não tem mais o "23/35" cravado', () => {
    const admin = ler('web/src/pages/Admin.jsx');
    assert.ok(!admin.includes('>23/35<'), 'número cravado voltou ao painel');
    assert.match(admin, /overview\?\.elenco/, 'o placar vem do servidor');
  });
});

test('as telas que a auditoria apontou', async (t) => {
  await t.test('a barra de progresso lê o campo que o servidor manda', () => {
    const cfg = ler('web/src/pages/Configuracoes.jsx');
    assert.ok(!cfg.includes('nivel.proximoNivelXp'), 'proximoNivelXp não existe no payload: a barra ficava sempre cheia');
    assert.match(cfg, /nivel\.proximoXp/, 'o nome certo do campo é proximoXp');
    assert.match(cfg, /nivel\.progresso/, 'o progresso vem pronto do servidor, com o piso do nível descontado');
  });

  await t.test('o filtro do dossiê filtra por algo que os dados têm', () => {
    const imp = ler('web/src/pages/Impacto.jsx');
    assert.ok(!imp.includes('dossie?.evidencias'), 'a rota nunca mandou "evidencias"');
    assert.match(imp, /e\.selo === filtro/, 'filtra pelo grau de evidência, que os efeitos carregam');
  });

  await t.test('o botão Tudo da vitrine volta a buscar', () => {
    const home = ler('web/src/pages/Home.jsx');
    assert.ok(!/if \(filtro === 'todos'\) return;/.test(home),
      'a saída antecipada deixava o botão Tudo inerte na volta');
  });

  await t.test('o Termos não desenha um segundo cabeçalho dentro do chassi', () => {
    const legal = ler('web/src/pages/Legal.jsx');
    assert.match(legal, /dentroDoChassi/, 'a página precisa saber se já está dentro do Layout');
    assert.match(legal, /\{!dentroDoChassi && \(\s*<header/, 'o cabeçalho próprio só sai para o visitante');
  });

  await t.test('a paleta ⌘K não repete item do menu', () => {
    const layout = ler('web/src/components/Layout.jsx');
    assert.match(layout, /EXTRAS_PALETA/, 'os extras entram por uma lista separada');
    assert.match(layout, /existente\.apelidos/, 'rótulo repetido empresta os apelidos em vez de virar linha nova');
  });

  await t.test('nenhuma tela devolve "Carregando" sem antes olhar o erro', () => {
    // A regra: quem tem estado de erro e saída antecipada de carga usa o
    // componente Carga, que põe o erro na frente. Carregando eterno é o pior
    // aviso possível, porque não parece aviso: parece rede lenta.
    for (const arquivo of ['web/src/pages/Agentes.jsx', 'web/src/pages/Painel.jsx', 'web/src/pages/Admin.jsx']) {
      const texto = ler(arquivo);
      assert.match(texto, /import Carga from/, `${arquivo} não usa o componente de carga`);
    }
    assert.ok(!ler('web/src/pages/Agentes.jsx').includes('Carregando elenco…</div>'),
      'a saída antecipada crua voltou a Agentes');
  });

  await t.test('a trilha de auditoria pede o mesmo número que anuncia', () => {
    const painel = ler('web/src/pages/Painel.jsx');
    assert.match(painel, /const LIMITE_AUDITORIA = 500;/);
    assert.ok(!painel.includes('painelAuditoria(200)'), 'pedia 200 e dizia 500');
  });
});
