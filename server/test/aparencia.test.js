// ═══════════════════════════════════════════════════════════════════════════
// TESTES DA APARÊNCIA: tema claro e guarda de contraste
//
// Os dois defeitos que estes testes existem para pegar são invisíveis:
//
// 1. Alguém escreve `text-white/33` numa tela nova. No tema escuro fica certo.
//    No tema claro fica BRANCO SOBRE PAPEL, ou seja, sumido. Nada dá erro,
//    nenhum teste de componente falha, e o defeito só aparece para quem usa o
//    tema claro, que é justamente quem não vai reportar em detalhe.
//
// 2. Alguém escolhe um acento que some no fundo, ou acento e marca iguais. A
//    tela abre, nada quebra, e a conclusão é "a plataforma está estragada".
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = new URL('../../', import.meta.url).pathname;
const CSS = fs.readFileSync(path.join(RAIZ, 'web/src/hud.css'), 'utf8');

const {
  FUNDOS, ACENTOS, contraste, distancia, guardaDeContraste, normalizar, DISTANCIA_MINIMA,
} = await import(path.join(RAIZ, 'web/src/lib/tema.js'));

/**
 * Varre as telas e devolve os passos de opacidade de uma família de classe.
 * `prefixo` isola a variante: '' pega o estado parado, 'hover:' pega o realce.
 */
function passosUsados(familia, prefixo = '') {
  const achados = new Set();
  // Sem o prefixo, a busca precisa recusar `hover:text-white/70`, senão os
  // dois estados viram um só e a guarda da variante nunca vê nada de novo.
  const antes = prefixo ? prefixo.replace(':', '\\:') : '(?<![\\w:-])';
  const varrer = (dir) => {
    for (const nome of fs.readdirSync(dir)) {
      const alvo = path.join(dir, nome);
      if (fs.statSync(alvo).isDirectory()) { varrer(alvo); continue; }
      if (!/\.jsx?$/.test(nome)) continue;
      const texto = fs.readFileSync(alvo, 'utf8');
      for (const m of texto.matchAll(new RegExp(`${antes}${familia}\\/(\\d+)`, 'g'))) achados.add(m[1]);
    }
  };
  varrer(path.join(RAIZ, 'web/src'));
  return [...achados].sort((a, b) => Number(a) - Number(b));
}

test('tema claro', async (t) => {
  await t.test('o fundo claro existe e declara a própria tinta', () => {
    const claro = FUNDOS.claro;
    assert.equal(claro.claridade, 'claro');
    assert.equal(/^\d+ \d+ \d+$/.test(claro.tinta), true, 'tinta precisa ser tripla RGB, para aceitar alfa');
    for (const [id, f] of Object.entries(FUNDOS)) {
      assert.equal(typeof f.tinta, 'string', `${id} sem tinta`);
      assert.equal(['claro', 'escuro'].includes(f.claridade), true, `${id} sem claridade`);
    }
  });

  await t.test('o texto do tema claro tem contraste de leitura sobre o papel', () => {
    const [r, g, b] = FUNDOS.claro.tinta.split(' ').map(Number);
    const hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
    const razao = contraste(hex, FUNDOS.claro.pagina);
    assert.equal(razao >= 7, true, `tinta sobre papel deu ${razao.toFixed(2)}:1, e o piso de texto corrido é 7:1`);
  });

  // ── A guarda que impede o tema claro de apodrecer ────────────────────────
  for (const familia of ['text-white', 'bg-white', 'border-white']) {
    await t.test(`todo passo de ${familia} usado nas telas tem inversão no tema claro`, () => {
      const faltando = passosUsados(familia).filter(n => !CSS.includes(`.${familia}\\/${n} {`));
      assert.deepEqual(faltando, [],
        `estes passos ficariam brancos sobre papel: ${faltando.map(n => `${familia}/${n}`).join(', ')}`);
    });
  }

  // ── A mesma guarda para o passar do mouse ────────────────────────────────
  // O Tailwind compila `hover:text-white/70` como um seletor próprio. Inverter
  // `.text-white/70` não toca nele, e o defeito que sobra é o mais cruel de
  // todos: a tela está certa parada e o texto some no item que a pessoa mira.
  for (const familia of ['text-white', 'bg-white', 'border-white']) {
    await t.test(`todo passo de hover:${familia} tem inversão no tema claro`, () => {
      const propriedade = familia === 'text-white' ? 'color'
        : familia === 'bg-white' ? 'background-color' : 'border-color';
      const faltando = passosUsados(familia, 'hover:')
        .filter(n => !CSS.includes(`.hover\\:${familia}\\/${n}:hover { ${propriedade}`));
      assert.deepEqual(faltando, [],
        `no tema claro estes sumiriam ao passar o mouse: ${faltando.map(n => `hover:${familia}/${n}`).join(', ')}`);
    });
  }

  await t.test('passos diferentes nunca caem na mesma opacidade', () => {
    for (const familia of ['text-white', 'bg-white', 'border-white']) {
      const valores = passosUsados(familia).map(n =>
        CSS.match(new RegExp(`\\.${familia}\\\\/${n} \\{[^}]*/ ([\\d.]+)\\)`))?.[1]);
      const unicos = new Set(valores);
      assert.equal(unicos.size, valores.length,
        `${familia}: ${valores.length} passos viraram ${unicos.size} opacidades, a hierarquia colapsou`);
    }
  });
});

test('guarda de contraste', async (t) => {
  await t.test('o padrão passa limpo', () => {
    assert.deepEqual(guardaDeContraste(null), []);
  });

  await t.test('acento que some no fundo é acusado, com a razão medida', () => {
    // Cinza escuro sobre o verde-noite: contraste baixo de verdade.
    const avisos = guardaDeContraste({ acento: '#0d2018', fundo: 'profundo' });
    const aviso = avisos.find(a => a.campo === 'acento');
    assert.ok(aviso, 'deveria acusar o acento');
    assert.equal(aviso.razao < 3, true);
    assert.match(aviso.texto, /3:1/);
  });

  await t.test('acento vivo no escuro é acusado no claro, e é esse o ponto', () => {
    const noEscuro = guardaDeContraste({ acento: '#00e5ff', fundo: 'profundo' });
    const noClaro = guardaDeContraste({ acento: '#00e5ff', fundo: 'claro' });
    assert.equal(noEscuro.some(a => a.campo === 'acento'), false);
    assert.equal(noClaro.some(a => a.campo === 'acento'), true,
      'ciano sobre papel some: trocar de fundo precisa reavaliar o acento');
  });

  await t.test('acento e marca quase iguais são acusados', () => {
    const avisos = guardaDeContraste({ acento: '#00e5ff', marca: '#00dcf5', fundo: 'profundo' });
    assert.equal(avisos.some(a => /perto demais/.test(a.texto)), true);
  });

  // ── A calibração do limiar, verificada e não confiada ────────────────────
  await t.test('nenhum par da paleta oficial dispara o alarme de distância', () => {
    for (const a of ACENTOS) {
      for (const b of ACENTOS) {
        if (a.id === b.id) continue;
        assert.equal(distancia(a.hex, b.hex) >= DISTANCIA_MINIMA, true,
          `${a.id} e ${b.id} deram ${Math.round(distancia(a.hex, b.hex))}, abaixo do limiar de ${DISTANCIA_MINIMA}`);
      }
    }
  });

  await t.test('a distância enxerga matiz, que é onde o contraste da WCAG é cego', () => {
    const ciano = '#00e5ff', verde = '#00ff64';
    assert.equal(contraste(ciano, verde) < 1.3, true, 'pela WCAG são quase a mesma cor');
    assert.equal(distancia(ciano, verde) >= DISTANCIA_MINIMA, true, 'e ainda assim são distinguíveis');
  });

  await t.test('a guarda normaliza a entrada antes de julgar', () => {
    // Tema com lixo dentro não pode derrubar a guarda: ela vira a última coisa
    // rodando antes de aplicar, e se ela cair não sobra nenhum aviso.
    assert.deepEqual(guardaDeContraste({ acento: 'roubado', fundo: 'inexistente' }), []);
    assert.equal(normalizar({ fundo: 'claro' }).fundo, 'claro');
  });
});
