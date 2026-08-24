// As seções que um investidor procura primeiro (por que agora, fosso,
// cenários, hipótese mais arriscada, time, comparáveis de saída) são as mais
// fáceis de perder numa refatoração: elas vivem em dois lugares distantes, o
// esquema do agente e o diagramador do documento. Este teste amarra os dois.
import test from 'node:test';
import assert from 'node:assert/strict';
import { montarDocumento } from '../src/services/documentoZoomDoc.js';
import { _interno } from '../src/agents/planoZoomDev.js';

const { paraFormatoClassico, montarSwot, BLOCOS } = _interno;

const esquemaDe = (id) => BLOCOS.find(b => b.id === id).schema.properties;

// Um plano pequeno, mas com todas as seções novas preenchidas.
const PLANO = {
  produto: {
    problema: { descricao: 'Açaí do Cunani perde valor por falta de rastreio.' },
    solucao: { descricao: 'Passaporte digital do lote.', propostaDeValor: 'Cada caixa com origem provada.' },
    personas: [{ nome: 'Cooperativa', papel: 'Beneficiadora', contexto: 'Oiapoque', dor: 'Preço baixo' }],
    funcionalidadesMvp: ['Passaporte do lote'],
  },
  mercado: {
    mercado: {
      tam: { valor: 'R$ 8 bi', comoChegamos: 'IBGE 2024 x preço médio', fonte: 'IBGE', selo: 'PESQUISA' },
      som: { valor: 'R$ 12 mi', comoChegamos: 'cooperativas do Oiapoque', prazo: '36 meses', selo: 'ESTRATEGIA' },
    },
    regulacao: [{ norma: 'RDC 331', orgao: 'ANVISA', exigencia: 'Controle microbiológico', prazo: '90 dias', custoEstimado: 'R$ 18 mil' }],
    porQueAgora: {
      oQueMudou: 'A EUDR passou a exigir prova de origem para produto florestal na Europa.',
      quando: 'dezembro de 2024',
      janela: '24 meses até o primeiro ciclo de auditoria',
      fonte: 'Regulamento UE 2023/1115',
      selo: 'PESQUISA',
    },
    comparaveisDeSaida: [
      { empresa: 'Agrotools', comprador: 'Grupo Boticário', valor: 'não divulgado', ano: '2022', porQueSeParece: 'Rastreio socioambiental de cadeia agrícola' },
    ],
  },
  negocio: {
    leanCanvas: { vantagemInjusta: 'Contrato com 9 cooperativas' },
    economiaUnitaria: { ticketMedio: 900, razaoLtvCac: 4 },
    projecao36Meses: [{ mes: 1, receita: 0, clientes: 0, custos: 12000 }],
    cenarios: [
      { nome: 'pessimista', premissa: 'EUDR adiada', receitaAno1: 'R$ 90 mil', receitaAno3: 'R$ 400 mil', gatilho: 'Nenhuma cooperativa renova em 6 meses', oQueFazer: 'Cortar time de campo e virar software puro' },
      { nome: 'base', premissa: 'EUDR em vigor', receitaAno1: 'R$ 240 mil', receitaAno3: 'R$ 2,1 mi', gatilho: 'Duas renovações no semestre', oQueFazer: 'Manter o plano' },
      { nome: 'otimista', premissa: 'Exportador exige passaporte', receitaAno1: 'R$ 520 mil', receitaAno3: 'R$ 6 mi', gatilho: 'Um exportador fecha contrato guarda-chuva', oQueFazer: 'Antecipar a contratação do time comercial' },
    ],
    fosso: {
      hojeTemos: 'Nenhum fosso ainda: temos apenas um piloto.',
      oQueSeAcumula: 'A série histórica de NDVI por lote, que ninguém consegue refazer para trás.',
      em12Meses: '400 lotes com histórico contínuo',
      em36Meses: 'Base usada como referência de preço pelo comprador',
      oQueDestruiria: 'O comprador aceitar autodeclaração em vez de série medida.',
      selo: 'HIPOTESE',
    },
    time: {
      quemJaTem: ['Fundador com 12 anos de campo'],
      lacunas: [{ papel: 'Engenheiro de dados', quando: 'mês 4', custoMensal: 'R$ 14 mil', porque: 'Sentinel-2 em escala', comoResolverAntes: 'Contrato de 20h com consultoria' }],
      conselheiros: ['Pesquisador do Embrapa Amapá'],
    },
    financeiro: { investimentoNecessario: 'R$ 600 mil', pedido: 'R$ 600 mil por 18 meses até 400 lotes ativos.' },
  },
  crescimento: {
    hipoteseMaisArriscada: {
      hipotese: 'A cooperativa paga R$ 900 por mês pelo passaporte do lote.',
      porqueEArriscada: 'Hoje ela não paga por nada digital.',
      comoTestar: 'Carta de intenção paga com 3 cooperativas',
      custoDoTeste: 'R$ 8 mil',
      prazo: '6 semanas',
      provaDeVida: '2 das 3 assinam com pagamento antecipado',
      provaDeMorte: 'Nenhuma assina sem subsídio',
      planoB: 'Cobrar do exportador, não da cooperativa.',
    },
  },
  impacto: {
    riscos: [{ risco: 'Seca prolongada', probabilidade: 'média', impacto: 'alto', mitigacao: 'Diversificar lotes', sinalDeAlerta: 'NDVI cai 2 meses seguidos' }],
    grauDeEvidencia: { nivelGeral: 'HIPOTESE', elosFracos: ['Ninguém pagou ainda'] },
  },
  pesquisa: {
    fontes: [{ titulo: 'Produção da Extração Vegetal', url: 'https://sidra.ibge.gov.br/tabela/289', publicadoEm: '2024', acessadoEm: '2026-08-24', tipo: 'órgão oficial' }],
    lacunas: ['Preço pago ao extrativista no Oiapoque'],
  },
};

test('o plano carrega as seções que o investidor procura', async (t) => {
  await t.test('o esquema do agente pede cada uma delas', () => {
    const mercado = esquemaDe('mercado').mercado ? esquemaDe('mercado') : {};
    assert.ok(mercado.porQueAgora, 'mercado.porQueAgora existe no esquema');
    assert.ok(mercado.comparaveisDeSaida, 'mercado.comparaveisDeSaida existe no esquema');
    assert.ok(
      esquemaDe('mercado').regulacao.items.properties.custoEstimado,
      'regulação sem custo é lista de obrigações sem orçamento',
    );

    const negocio = esquemaDe('negocio');
    assert.ok(negocio.cenarios, 'negocio.cenarios existe no esquema');
    assert.ok(negocio.fosso, 'negocio.fosso existe no esquema');
    assert.ok(negocio.time, 'negocio.time existe no esquema');
    assert.ok(negocio.cenarios.items.properties.gatilho, 'cenário sem gatilho é enfeite');
    assert.ok(negocio.time.properties.lacunas.items.properties.quando, 'contratação sem mês não é plano');

    assert.ok(esquemaDe('crescimento').hipoteseMaisArriscada, 'crescimento.hipoteseMaisArriscada existe');
  });

  await t.test('a encomenda proíbe inventar comparável de saída', () => {
    const enc = BLOCOS.find(b => b.id === 'mercado').encomenda;
    assert.match(enc, /lista vazia/, 'sem comparável encontrado, a lista volta vazia');
    assert.match(enc, /porQueAgora/);
  });

  await t.test('a pesquisa guarda endereço e data de acesso da fonte', () => {
    const f = _interno.PESQUISA_SCHEMA.properties.fontes.items.properties;
    assert.ok(f.url && f.acessadoEm && f.publicadoEm, 'fonte sem endereço e data não é conferível');
  });
});

test('o documento diagrama as seções novas', async (t) => {
  const html = montarDocumento(PLANO, { nome: 'Cunani Açaí' });

  await t.test('cada seção nova vira título no documento', () => {
    for (const titulo of ['Por que agora', 'Fosso competitivo', 'A hipótese mais arriscada', 'Time', 'Três cenários e seus gatilhos', 'Comparáveis de saída']) {
      assert.ok(html.includes(`>${titulo}<`), `seção "${titulo}" saiu no documento`);
    }
  });

  await t.test('o conteúdo das seções chega ao documento, não só o cabeçalho', () => {
    assert.match(html, /EUDR passou a exigir prova de origem/);
    assert.match(html, /série histórica de NDVI/);
    assert.match(html, /Nenhuma cooperativa renova em 6 meses/);
    assert.match(html, /Engenheiro de dados/);
    assert.match(html, /Agrotools/);
    assert.match(html, /R\$ 18 mil/, 'o custo da regulação entra na tabela');
  });

  await t.test('fonte sai com endereço, tipo e data de acesso', () => {
    assert.match(html, /sidra\.ibge\.gov\.br/);
    assert.match(html, /2026-08-24/);
  });

  await t.test('seção sem dado não aparece', () => {
    const magro = montarDocumento({ produto: PLANO.produto }, {});
    for (const titulo of ['Fosso competitivo', 'A hipótese mais arriscada', 'Time', 'Por que agora']) {
      assert.ok(!magro.includes(`>${titulo}<`), `"${titulo}" não pode aparecer vazio`);
    }
  });

  await t.test('nada do plano entra cru no HTML', () => {
    const veneno = JSON.parse(JSON.stringify(PLANO));
    veneno.negocio.fosso.oQueSeAcumula = '<img src=x onerror="alert(1)">';
    const sujo = montarDocumento(veneno, {});
    assert.ok(!sujo.includes('<img src=x'), 'o conteúdo do modelo é escapado');
    assert.match(sujo, /&lt;img src=x/);
  });
});

test('a ficha clássica aproveita as seções novas', async (t) => {
  await t.test('o por que agora abre o contexto de mercado', () => {
    const c = paraFormatoClassico(PLANO);
    assert.match(c.negocio.mercado.contexto, /EUDR/);
  });

  await t.test('a SWOT usa o fosso dos dois lados', () => {
    const s = montarSwot(PLANO);
    assert.ok(s.forcas.some(f => /NDVI/.test(f)), 'o que se acumula é força');
    assert.ok(s.ameacas.some(a => /autodeclaração/.test(a)), 'o que dissolve o fosso é ameaça');
    assert.ok(s.oportunidades.some(o => /EUDR/.test(o)), 'a janela aberta é oportunidade');
  });

  await t.test('plano sem as seções novas não quebra a ficha', () => {
    const c = paraFormatoClassico({ produto: {}, mercado: {}, negocio: {}, crescimento: {}, impacto: {} });
    assert.equal(c.negocio.mercado.contexto, '');
    assert.deepEqual(c.negocio.swot.ameacas, []);
  });
});
