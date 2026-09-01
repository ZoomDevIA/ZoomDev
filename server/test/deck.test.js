// Os dois decks do Startup World Cup, conferidos como código.
//
// POR QUE ISTO EXISTE. A auditoria do pitch achou oito números desatualizados
// e duas divergências entre o inglês e o português: uma lâmina dizia 98 testes
// e a seguinte dizia 168, no mesmo arquivo; o inglês dizia 27 agentes onde o
// português dizia 35. Nada disso quebra build, nada disso aparece em revisão
// de código, e tudo isso chega na mão de investidor dentro de um PDF.
//
// A regra da casa é que número em documento institucional ou sai do sistema,
// ou é conferido contra o sistema. Este arquivo é a segunda metade dessa
// regra: o deck não é mais um texto solto, é uma saída verificada.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resumoElenco } from '../src/services/elenco.js';

const RAIZ = new URL('../../', import.meta.url).pathname;
const DECKS = path.join(RAIZ, 'docs/institucional');

/** Lê o deck sem comentário e sem folha de estilo: só o que vira página. */
function ler(nome) {
  const bruto = fs.readFileSync(path.join(DECKS, nome), 'utf8');
  return bruto
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
}

const EN = ler('swc-pitch-2026.html');
const PT = ler('swc-pitch-2026-pt.html');

// O banco de respostas é o texto que de fato entra no formulário. Ele saiu de
// sincronia com o deck uma vez, e ninguém percebeu: dizia 27 agentes e 98
// testes muito depois de o deck já dizer outra coisa.
const FORMULARIO = fs.readFileSync(path.join(DECKS, 'swc-formulario-respostas.md'), 'utf8');

/** O que de fato vai colado num campo: a citação sem o "> ", em uma linha. */
const citacao = (bloco) => bloco.trim().split('\n')
  .filter(l => l.startsWith('> ')).map(l => l.slice(2).trimEnd()).join(' ').trim();

// A citação quebra linha no meio da frase, e a quebra escondia contradição de
// verdade: três blocos diziam "281 automated\n> tests" enquanto um quarto dizia
// 290, e a conferência passava porque o "> " partia a expressão ao meio. Quem
// cola no formulário cola a frase inteira, então é a frase inteira que tem de
// ser conferida. Emendar só a continuação preserva a linha em branco entre
// parágrafos, que é "\n>" sem espaço.
const FORMULARIO_CORRIDO = FORMULARIO.replace(/\n> /g, ' ');

const laminas = (t) => t.match(/<section class="slide/g)?.length ?? 0;
const segundos = (t) => [...t.matchAll(/class="seg">(\d+)s/g)].reduce((s, m) => s + Number(m[1]), 0);

/** Os blocos <div class="num"> de cada lâmina, indexados pelo data-n. */
function blocosNumericos(t) {
  const mapa = new Map();
  for (const [, n, corpo] of t.matchAll(/<section class="slide[^"]*" data-n="(\d+)">([\s\S]*?)<\/section>/g)) {
    mapa.set(n, [...corpo.matchAll(/<div class="num[^"]*">([^<]+)<\/div>/g)].map(m => m[1].trim()));
  }
  return mapa;
}

// Vírgula decimal e ponto decimal são a mesma grandeza em idiomas diferentes.
const mesmoNumero = (a, b) => a.replace(',', '.') === b.replace(',', '.');

test('os dois decks contam a mesma história', async (t) => {
  await t.test('mesma quantidade de lâminas', () => {
    assert.equal(laminas(EN), laminas(PT), 'o português ganhou ou perdeu lâmina em relação ao inglês');
    assert.equal(laminas(EN), 14, 'a estrutura de 14 lâminas mudou sem o comentário de cabeçalho mudar junto');
  });

  await t.test('mesmo orçamento de tempo de palco', () => {
    // 225 nas doze lâminas de conteúdo, mais 10 de capa e 5 de fecho: os 240
    // segundos que a organização dá para o pitch.
    assert.equal(segundos(EN), 225);
    assert.equal(segundos(PT), 225, 'o selo de segundos do português saiu do lugar');
  });

  await t.test('os números em destaque batem lâmina a lâmina', () => {
    const en = blocosNumericos(EN), pt = blocosNumericos(PT);
    assert.deepEqual([...en.keys()], [...pt.keys()], 'as lâminas não estão na mesma ordem');
    for (const [n, valoresEn] of en) {
      const valoresPt = pt.get(n);
      assert.equal(valoresEn.length, valoresPt.length, `lâmina ${n}: quantidade de números em destaque difere`);
      valoresEn.forEach((v, i) => {
        // Texto traduzido ("Not 30%" / "Não 30%") passa; grandeza diferente, não.
        const puro = (s) => s.replace(/[^\d.,]/g, '');
        if (puro(v) || puro(valoresPt[i])) {
          assert.ok(mesmoNumero(puro(v), puro(valoresPt[i])),
            `lâmina ${n}: inglês diz "${v}" e português diz "${valoresPt[i]}"`);
        }
      });
    }
  });
});

test('o deck não contradiz o sistema nem a si mesmo', async (t) => {
  const { total } = resumoElenco();

  await t.test('a contagem de agentes é a do elenco vivo', () => {
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      const achados = [...texto.matchAll(/\b(\d\d)\s+(?:governed |AI |agentes |agents )/gi)].map(m => m[1]);
      assert.ok(achados.length > 0, `${nome}: nenhuma menção contável a agentes`);
      for (const n of achados) {
        assert.equal(Number(n), total,
          `${nome}: o deck diz ${n} agentes e o elenco tem ${total}`);
      }
    }
  });

  await t.test('a contagem de testes não se contradiz dentro do mesmo deck', () => {
    // O defeito original: a lâmina 5 dizia 98 e a lâmina 6 dizia 168.
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      const achados = new Set([...texto.matchAll(/\b(\d{2,4})\s+(?:automated tests|testes automatizados)/g)].map(m => m[1]));
      assert.equal(achados.size, 1, `${nome}: o deck cita ${[...achados].join(' e ')} testes em lugares diferentes`);
    }
    const numero = (t) => t.match(/\b(\d{2,4})\s+(?:automated tests|testes automatizados)/)[1];
    assert.equal(numero(EN), numero(PT), 'inglês e português discordam na contagem de testes');
  });

  await t.test('a contagem de seções do plano é a mesma nas duas lâminas que a citam', () => {
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      const achados = new Set([...texto.matchAll(/(\d\d)\s+(?:sections|seções)\b/g)].map(m => m[1]));
      assert.equal(achados.size, 1, `${nome}: o deck cita ${[...achados].join(' e ')} seções em lugares diferentes`);
    }
  });
});

test('o deck está pronto para sair da gaveta', async (t) => {
  await t.test('não sobrou campo de rascunho', () => {
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      assert.ok(!/bloco preencher/.test(texto), `${nome}: caixa de campo a preencher voltou ao deck`);
      assert.ok(!/class="vaga"/.test(texto), `${nome}: linha pontilhada de preenchimento voltou ao deck`);
      assert.ok(!/to complete before|a completar antes|credentials to add|credenciais a acrescentar/i.test(texto),
        `${nome}: rótulo de rascunho voltou ao deck`);
    }
  });

  await t.test('os endereços citados são os que estão no ar', () => {
    // O .com.br ainda não tem certificado. Citar endereço que não abre na frente
    // de investidor é pior do que não citar nenhum.
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      assert.match(texto, /zoomdev\.io/, `${nome}: a vitrine não é citada`);
      assert.match(texto, /www\.zoomdev\.app/, `${nome}: o produto não é citado`);
      assert.ok(!/>\s*zoomdev\.com\.br\s*</.test(texto),
        `${nome}: o .com.br voltou a ser citado como endereço do site`);
    }
  });

  await t.test('não voltou linguagem que enfraquece o pitch', () => {
    // Uma varredura feita à mão achou treze construções que tiravam força sem
    // acrescentar informação, e elas caem em três famílias. Piada interna que
    // não informa ("três movimentos, não quatro"). Muleta que pede licença
    // pelo que veio antes ("em bom português:"). E negação ou desculpa gastando
    // o maior tipo da lâmina ("Não 30%", "poderíamos escrever... nosso
    // protocolo proíbe"). O conteúdo honesto ficou; o tom de quem se desculpa
    // por ser honesto saiu. Este teste existe porque texto de deck é reescrito
    // aos poucos, e esse tom volta sozinho.
    const proibidas = [
      [/Não quatro|Not four/, 'piada interna: o título já lista os três'],
      [/Em bom português|Put plainly/, 'muleta que pede licença pelo parágrafo anterior'],
      [/Não 30%|Not 30%/, 'negação ocupando o número em destaque do cartão'],
      [/Poderíamos escrever|We could claim/, 'condicional que pede desculpa por ser honesto'],
      [/Não vamos vestir|not going to dress/, 'abre prometendo o que NÃO vai fazer'],
      [/esperamos ser questionad|expect to be challenged/, 'convida o ataque em vez de dar a régua'],
      [/concorrente de verdade|the real incumbent/, 'confessa que a tabela acima é irrelevante'],
      [/US\$ 7 a 120|US\$ 7 – 120/, 'intervalo de 17x lê como "não sabemos"'],
    ];
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      for (const [rx, porque] of proibidas) {
        assert.ok(!rx.test(texto), `${nome}: voltou "${rx.source}" — ${porque}`);
      }
    }
  });

  await t.test('o Centelha aparece na fase em que realmente está', () => {
    assert.match(EN, /contracting phase/, 'o inglês não diz que o Centelha está em contratação');
    assert.match(PT, /fase de contratação/, 'o português não diz que o Centelha está em contratação');
  });
});

test('o banco de respostas do formulário acompanha o deck', async (t) => {
  const { total } = resumoElenco();

  await t.test('a contagem de agentes é a mesma do elenco e do deck', () => {
    const achados = [...FORMULARIO_CORRIDO.matchAll(/\b(\d\d)\s+(?:governed |AI )/g)].map(m => Number(m[1]));
    assert.ok(achados.length >= 5, 'o formulário deixou de citar a contagem de agentes');
    for (const n of achados) {
      assert.equal(n, total, `o formulário diz ${n} agentes e o elenco tem ${total}`);
    }
  });

  await t.test('a contagem de testes não contradiz o deck', () => {
    const noDeck = EN.match(/\b(\d{2,4})\s+automated tests/)[1];
    const achados = new Set([...FORMULARIO_CORRIDO.matchAll(/\b(\d{2,4})\s+automated tests/g)].map(m => m[1]));
    assert.equal(achados.size, 1, `o formulário cita ${[...achados].join(' e ')} testes em lugares diferentes`);
    assert.equal([...achados][0], noDeck, 'o formulário e o deck discordam na contagem de testes');
  });

  await t.test('não voltou a linguagem que enfraquece', () => {
    for (const [rx, porque] of [
      [/Three moves, not four/, 'piada interna'],
      [/Put plainly/, 'muleta que pede licença'],
      [/not going to dress/, 'abre prometendo o que NÃO vai fazer'],
      [/expect to be challenged/, 'convida o ataque'],
      [/The real incumbent/, 'anula a tabela acima'],
      [/fourteen-section/, 'o plano tem 17 seções'],
    ]) {
      assert.ok(!rx.test(FORMULARIO_CORRIDO), `formulário: voltou "${rx.source}" — ${porque}`);
    }
  });

  await t.test('cita os endereços que abrem, e não o que ainda não tem certificado', () => {
    assert.match(FORMULARIO, /zoomdev\.io/, 'a vitrine não é citada');
    assert.ok(!/\| Website \| https:\/\/zoomdev\.com\.br \|/.test(FORMULARIO),
      'o cadastro voltou a apontar para o .com.br, que ainda não abre');
  });

  await t.test('cada resposta cabe no limite do campo que declara', () => {
    // O texto foi reescrito; os contadores impressos ao lado precisam
    // acompanhar, senão o fundador cola algo que o campo trunca no meio.
    for (const [, rot, declarado, bloco] of
         FORMULARIO.matchAll(/\*\*(Curto|Médio|Longo) \(([\d.]+) caracteres\)\*\*\n\n((?:>.*\n)+)/g)) {
      const real = citacao(bloco).length;
      assert.equal(Number(declarado.replace('.', '')), real,
        `${rot}: declara ${declarado} caracteres e tem ${real}`);
      if (rot === 'Curto') {
        assert.ok(real <= 300, `${rot}: ${real} caracteres, acima do teto de 300 do campo curto`);
      }
    }
    for (const [, declarado, bloco] of
         FORMULARIO.matchAll(/Máximo 50 palavras\. \*\*(\d+) palavras:\*\*\n\n((?:>.*\n)+)/g)) {
      const real = citacao(bloco).split(/\s+/).length;
      assert.equal(Number(declarado), real, `declara ${declarado} palavras e tem ${real}`);
      assert.ok(real <= 50, `resposta com ${real} palavras, acima do máximo de 50`);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// O CARGO APARECE EM SETE LUGARES, EM TRÊS ARQUIVOS
//
// Trocar quem é CEO parece uma linha e são sete: o cartão do time e o rodapé
// de contato, em inglês e em português, mais o texto da resposta 10 e a linha
// "Founder full name" da tabela de cadastro. Já aconteceu de o formulário
// ficar meses atrás do deck sem ninguém notar, porque nada quebrava.
//
// A LEITURA É POR PAR RÓTULO-NOME, não por rótulo exato. A primeira versão
// deste teste procurava ">CEO</div>" e teria passado batido quando o cargo
// virou "Founder & CEO": título composto é o caso normal numa startup, não a
// exceção. Aqui o rótulo é capturado inteiro e a pergunta é se ele CONTÉM o
// cargo.
// ═══════════════════════════════════════════════════════════════════════════

/** Os pares rótulo-nome do deck: cartão da lâmina de time e rodapé de contato. */
function cargosNoDeck(texto) {
  const pares = [];
  const time = texto.match(/<section class="slide[^"]*" data-n="11">([\s\S]*?)<\/section>/)?.[1] ?? '';
  // No cartão o rótulo vem antes do nome; no rodapé, depois.
  for (const [, rotulo, nome] of time.matchAll(/<div class="cap"[^>]*>([^<]+)<\/div>\s*<h3[^>]*>([^<]+)</g)) {
    pares.push([rotulo.trim(), nome.trim()]);
  }
  const contato = texto.match(/<div class="contato">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? '';
  for (const [, nome, rotulo] of contato.matchAll(/<b>([^<]+)<\/b>\s*·\s*([^<]+)<\/div>/g)) {
    pares.push([rotulo.trim(), nome.trim()]);
  }
  return pares;
}

/** Os pares do formulário: "Nome Sobrenome, Cargo." no começo de cada parágrafo.
 *
 *  Ancorado no vocabulário de cargos, e não no "> " da citação, porque emendar
 *  as continuações também come o "> " do primeiro parágrafo do bloco: o Aldo
 *  ficava invisível e o teste dizia que ninguém assinava como CEO. Exigir um
 *  cargo conhecido é mais estreito do que exigir a marca da citação, e não
 *  captura qualquer "Nome Sobrenome," que apareça no meio de uma frase. */
function cargosNoFormulario(texto) {
  const CARGOS = 'Founder|Fundador|Co-founder|Cofundador|CEO|CTO';
  return [...texto.matchAll(
    new RegExp(`([A-ZÁ-Ú][a-zà-ú]+ [A-ZÁ-Ú][a-zà-ú]+), ((?:${CARGOS})[^.]{0,24})\\.`, 'g'))]
    .map(m => [m[2].trim(), m[1].trim()]);
}

test('o time diz a mesma coisa nos três arquivos', async (t) => {
  const ARQUIVOS = [
    ['inglês', cargosNoDeck(EN)],
    ['português', cargosNoDeck(PT)],
    ['formulário', cargosNoFormulario(FORMULARIO_CORRIDO)],
  ];
  // "&amp;" no HTML e "and" no formulário são a mesma conjunção, então a
  // pergunta é se o rótulo CONTÉM o cargo, não se é igual a ele.
  const carrega = (pares, cargo) =>
    new Set(pares.filter(([rot]) => new RegExp(`(?<![\\w-])${cargo}\\b`).test(rot)).map(([, nome]) => nome));

  await t.test('cada arquivo aponta um CEO, e é sempre a mesma pessoa', () => {
    const porArquivo = ARQUIVOS.map(([nome, pares]) => [nome, carrega(pares, 'CEO')]);
    for (const [nome, quem] of porArquivo) {
      assert.equal(quem.size, 1,
        `${nome}: ${quem.size === 0 ? 'ninguém assina como CEO' : `${[...quem].join(' e ')} assinam como CEO`}`);
    }
    const todos = new Set(porArquivo.flatMap(([, quem]) => [...quem]));
    assert.equal(todos.size, 1, `os arquivos discordam de quem é o CEO: ${[...todos].join(' e ')}`);
  });

  await t.test('quem funda e quem cofunda não se confundem', () => {
    // "Cofundador" contém "fundador" e "Co-founder" contém "founder". O que
    // separa os dois é a caixa: a forma composta minusculiza o segundo
    // elemento, e a busca é sensível a maiúscula. A negativa de hífen antes
    // segura o caso de alguém escrever "Co-Founder".
    for (const [nome, pares] of ARQUIVOS) {
      const fundadores = new Set([
        ...carrega(pares, 'Founder'), ...carrega(pares, 'Fundador'),
      ]);
      const cofundadores = new Set([
        ...carrega(pares, 'Co-founder'), ...carrega(pares, 'Cofundador'),
      ]);
      assert.equal(fundadores.size, 1, `${nome}: ${[...fundadores].join(' e ') || 'ninguém'} assina como fundador`);
      for (const quem of cofundadores) {
        assert.ok(!fundadores.has(quem), `${nome}: ${quem} aparece como fundador e como cofundador`);
      }
    }
  });

  await t.test('o rodapé de contato repete o cartão do time', () => {
    // É o cartão de visita da última lâmina: quem investir liga para quem
    // estiver ali. Cargo que mudou no time e não mudou aqui é nome errado.
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      const pares = cargosNoDeck(texto);
      const noTime = new Map(pares.slice(0, 4).map(([rot, quem]) => [quem, rot]));
      const noRodape = pares.slice(4);
      assert.ok(noRodape.length >= 2, `${nome}: o rodapé de contato deixou de nomear as pessoas`);
      for (const [rot, quem] of noRodape) {
        assert.equal(rot, noTime.get(quem),
          `${nome}: ${quem} é "${noTime.get(quem)}" no time e "${rot}" no rodapé`);
      }
    }
  });

  await t.test('a linha de cadastro do formulário nomeia o fundador', () => {
    // O campo "Founder full name" é por onde a organização entra em contato.
    // Ficou apontando para a pessoa errada uma vez, e ninguém viu.
    const [fundador] = new Set([...carrega(cargosNoDeck(EN), 'Founder')]);
    const linha = FORMULARIO.match(/\| Founder full name \| ([^|]+) \|/)?.[1]?.trim();
    assert.equal(linha, fundador, `o cadastro diz "${linha}" e o deck diz "${fundador}"`);
  });

  await t.test('as quatro pessoas do time continuam nos dois decks', () => {
    // Reordenar cartão é operação de recortar e colar, e recortar perde gente.
    for (const [nome, texto] of [['inglês', EN], ['português', PT]]) {
      for (const pessoa of ['Aldo Siqueira', 'Bruno Nascimento', 'Poliana Gomes', 'Leandro Andrade']) {
        assert.ok(texto.includes(pessoa), `${nome}: ${pessoa} sumiu do deck`);
      }
    }
  });

  await t.test('os dois decks trazem o mesmo telefone, e um só', () => {
    // Telefone de contato desatualizado é o defeito mais caro de um deck: o
    // investidor liga, não atende, e não há segunda tentativa.
    const numeros = (t) => new Set([...t.matchAll(/\+55[\s\d-]{10,}/g)].map(m => m[0].trim()));
    const en = numeros(EN), pt = numeros(PT);
    assert.equal(en.size, 1, `inglês: o deck traz ${en.size} telefones (${[...en].join(' e ')})`);
    assert.deepEqual([...en], [...pt], 'inglês e português trazem telefones diferentes');
  });
});
