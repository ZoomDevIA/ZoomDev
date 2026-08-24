// ═══════════════════════════════════════════════════════════════════════════
// TESTE DO MVP BUILDER · a ponte entre o que os agentes escrevem e o que o
// construtor lê
//
// Este é o teste que não existia quando o defeito mais caro da plataforma
// passou meses no ar: o construtor procurava campos com nomes que nenhum
// agente escrevia (`propostaValor`, `dores`, `funcionalidades`,
// `modeloReceita`), todos caíam nos valores de reserva, e TODO MVP saía
// montado sobre "Cadastro simples · Painel de acompanhamento · Relatórios
// exportáveis" em vez do plano do fundador. Nada dava erro. O produto saía
// bonito, funcional e genérico, e a culpa parecia ser do modelo de IA.
//
// A regra que este arquivo protege: o plano abaixo está escrito EXATAMENTE no
// formato que `planoDeNegocios.js` e a projeção de `planoZoomDev.js`
// produzem. Se alguém renomear um campo em qualquer um dos dois sem atualizar
// o mapa do construtor, um destes testes quebra.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import { _interno } from '../src/agents/mvpBuilder.js';

// Um plano real, resumido, no formato que sai dos agentes.
const PROJETO = {
  nome: 'Cunani Açaí',
  descricao: 'Cooperativa de açaí de Cunani para a Flórida',
  classificacao: 'biostartup',
  vertical: 'Bioeconomia',
  plano: {
    produto: {
      propostaDeValor: 'Açaí quilombola rastreado da palmeira ao contêiner, com repartição de benefícios registrada.',
      problema: 'O extrativista vende rápido e barato porque não tem frio na origem nem comprador final.',
      solucao: 'Cooperativa que compra com preço mínimo, processa e exporta com rastreabilidade lote a lote.',
      publicoAlvo: 'Extrativistas de Cunani e importadores de polpa na Flórida',
      personas: [
        { nome: 'Raimundo', papel: 'Extrativista cooperado', contexto: 'Vive em Cunani', dor: 'Fruto perecível e preço ditado pelo atravessador' },
        { nome: 'Michael', papel: 'Comprador na Flórida', contexto: 'Distribuidora de congelados', dor: 'Fornecedores sem rastreabilidade real de origem' },
      ],
      funcionalidadesMvp: [
        'Registro de coleta por cooperado com peso e comunidade',
        'Rastreabilidade lote a lote com QR code',
        'Contrato de fornecimento com preço mínimo pré-safra',
        'Painel de gestão da cooperativa',
      ],
      diferenciais: ['Identidade de origem quilombola de Cunani', 'Canal direto cooperativa a distribuidor'],
    },
    negocio: {
      modeloDeNegocio: 'Cooperativa que compra do cooperado e vende polpa B2B no Brasil e purê para a Flórida.',
      pricing: ['Polpa Macapá B2B: R$ 14/kg', 'Purê Exportação: US$ 4,20/kg FOB'],
      concorrentes: [{ nome: 'Amazonbai', forca: 'Pioneira em rastreabilidade', fraqueza: 'Escala pequena' }],
      goToMarket: ['Testar outbound direto a importadores da Flórida'],
    },
    engenharia: {
      stack: ['HTML/CSS/JS puro', 'Armazenamento local'],
      arquitetura: 'Painel estático com dados locais e exportação por arquivo.',
      roadmapTecnico: [
        { fase: 'Base legal e verificação de campo', duracao: 'Meses 1 a 8', entregas: ['Censo de campo em Cunani', 'Cadastro no SisGen protocolado'] },
        { fase: 'Processamento', duracao: 'Meses 9 a 18', entregas: ['Unidade operando'] },
      ],
    },
    impacto: {
      ods: [{ numero: 2, nome: 'Fome Zero', contribuicao: 'Elimina o atravessador entre Cunani e o mercado.' }],
      kpisImpacto: ['Renda anual por família cooperada: +50% até o mês 24'],
    },
  },
};

const RESERVAS = [
  'Cadastro simples', 'Painel de acompanhamento', 'Relatórios exportáveis',
  'Processo manual e demorado', 'Falta de visibilidade dos dados', 'Custo alto de operação',
];

test('mvp builder: o plano do fundador chega inteiro ao construtor', async (t) => {
  const ctx = _interno.contexto(PROJETO);

  await t.test('proposta, problema, solução e público vêm do plano', () => {
    assert.match(ctx.proposta, /Açaí quilombola rastreado/);
    assert.match(ctx.problema, /não tem frio na origem/);
    assert.match(ctx.solucao, /preço mínimo/);
    assert.match(ctx.publico, /Extrativistas de Cunani/);
    assert.notEqual(ctx.proposta, PROJETO.descricao, 'a proposta do plano ganha da descrição crua da ideia');
  });

  await t.test('as funcionalidades do MVP são as do plano, não as de reserva', () => {
    assert.equal(ctx.funcionalidades.length, 4);
    assert.ok(ctx.funcionalidades.some(f => /QR code/.test(f)));
    for (const reserva of RESERVAS) {
      assert.ok(!ctx.funcionalidades.includes(reserva), `"${reserva}" é valor de reserva e não pode aparecer`);
    }
  });

  await t.test('as dores saem das personas, que são mais concretas que o enunciado', () => {
    assert.equal(ctx.dores.length, 2);
    assert.ok(ctx.dores.some(d => /atravessador/.test(d)));
    assert.ok(ctx.dores.some(d => /rastreabilidade real/.test(d)));
  });

  await t.test('modelo de negócio e preços são os que o agente escreveu', () => {
    assert.match(ctx.modelo, /Cooperativa que compra do cooperado/);
    assert.notEqual(ctx.modelo, 'Assinatura mensal', 'o padrão genérico não pode vencer o plano');
    assert.equal(ctx.precos.length, 2);
    assert.ok(ctx.precos.some(p => /R\$ 14\/kg/.test(p)));
  });

  await t.test('diferenciais, stack e impacto chegam preenchidos', () => {
    assert.match(ctx.diferencial, /quilombola de Cunani/);
    assert.equal(ctx.stack.length, 2);
    assert.match(ctx.impacto, /Elimina o atravessador/);
    assert.equal(ctx.ods.length, 1);
  });

  await t.test('o escopo do MVP é a primeira fase do roadmap', () => {
    assert.deepEqual(ctx.mvpEscopo, ['Censo de campo em Cunani', 'Cadastro no SisGen protocolado']);
  });

  await t.test('sem plano nenhum, o construtor ainda funciona com o que existe', () => {
    const cru = _interno.contexto({ nome: 'Ideia', descricao: 'Uma ideia sem plano ainda.', classificacao: 'startup' });
    assert.equal(cru.proposta, 'Uma ideia sem plano ainda.');
    assert.deepEqual(cru.funcionalidades, []);
    assert.equal(cru.modelo, 'Assinatura mensal');
  });
});
