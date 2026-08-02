// Testes do ZoomDev Studio: diagramação do documento e extração de anexos.
//
// O foco aqui não é cobertura de linha: são os dois pontos onde um erro sai
// caro. O renderizador recebe texto que veio de um modelo que leu a internet,
// então escapar é questão de segurança e não de estética. E o extrator recebe
// arquivo enviado por qualquer usuário logado, então precisa recusar o que não
// entende em vez de devolver lixo para dentro do contexto dos agentes.
import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { montarDocumento } from '../src/services/documentoZoomDoc.js';
import { extrair } from '../src/services/extracao.js';

test('diagramação do documento', async (t) => {
  await t.test('escapa HTML vindo do modelo em texto e em atributo', () => {
    const html = montarDocumento({
      produto: {
        sumarioExecutivo: '<script>alert(1)</script> & "aspas"',
        problema: { descricao: 'ok', selo: 'PESQUISA' },
      },
      negocio: {
        economiaUnitaria: {
          ticketMedio: 100, cacEstimado: 50, ltv: 1000, razaoLtvCac: 20,
          paybackMeses: 1, mesesDeVida: 10, premissas: [],
          margemContribuicao: '" onload="alert(1)',
        },
      },
    }, { nome: 'Teste' });

    assert.ok(!html.includes('<script>alert(1)</script>'), 'a tag não pode sair viva');
    assert.ok(html.includes('&lt;script&gt;'), 'a tag precisa sair escapada');
    assert.ok(!html.includes('onload="alert(1)"'), 'atributo não pode ser injetado');
  });

  await t.test('escapa aspas dentro dos atributos dos blocos vivos', () => {
    const html = montarDocumento({
      negocio: {
        financeiro: { investimentoNecessario: 'R$ 1" onerror="x', pontoDeEquilibrio: '', usoDosRecursos: [], pedido: '' },
      },
    }, {});
    const bloco = html.match(/<div data-bloco="indicador"[^>]*>/)?.[0] || '';
    assert.ok(bloco.includes('&quot;'), 'as aspas precisam virar entidade');
    // A sequência "onerror" continua no texto, e tudo bem: o que não pode é
    // ela vir seguida de aspas de verdade, que é o que fecharia o atributo
    // anterior e abriria um novo.
    assert.ok(!bloco.includes('onerror="'), 'nenhum atributo novo pode nascer do valor');
    assert.equal(bloco.match(/"/g).length % 2, 0, 'as aspas do atributo precisam fechar em pares');
  });

  await t.test('não emite cabeçalho de seção sem conteúdo', () => {
    const html = montarDocumento({ produto: { sumarioExecutivo: 'Só isto.' } }, {});
    assert.ok(html.includes('Sumário executivo'));
    assert.ok(!html.includes('Lean Canvas'), 'seção sem dado não deve aparecer');
    assert.ok(!html.includes('Economia unitária'));
    assert.ok(!/<table/.test(html), 'tabela vazia não deve ser emitida');
  });

  await t.test('monta as quatorze seções quando o plano vem completo', () => {
    const html = montarDocumento(planoCompleto(), { nome: 'Completo' });
    for (const secao of ['Sumário executivo', 'O problema', 'Solução e proposta de valor',
      'Lean Canvas', 'Mercado', 'Quem é o cliente', 'Concorrência e diferenciação',
      'Modelo de negócio e preço', 'Economia unitária', 'Go-to-market',
      'Produto e roadmap', 'Métrica-Norte e OKRs', 'Impacto',
      'Financeiro, riscos e o pedido', 'Evidência e fontes']) {
      assert.ok(html.includes(secao), `faltou a seção ${secao}`);
    }
    assert.ok(html.includes('data-bloco="selo"'), 'o selo de evidência precisa estar no documento');
    assert.ok(html.includes('data-bloco="citacao"'), 'as fontes viram citação');
  });
});

test('extração de anexos', async (t) => {
  await t.test('lê texto puro', async () => {
    const r = await extrair({ nome: 'nota.txt', tipo: 'text/plain', buffer: Buffer.from('Linha um\n\n\n\nLinha dois') });
    assert.equal(r.tipo, 'texto');
    assert.equal(r.texto, 'Linha um\n\nLinha dois', 'linhas em branco em excesso são colapsadas');
  });

  await t.test('lê o texto dos slides de um PPTX', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Proposta &amp; valor</a:t><a:t>Segunda linha</a:t></p:sld>');
    zip.file('ppt/slides/slide2.xml', '<p:sld><a:t>Mercado</a:t></p:sld>');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const r = await extrair({ nome: 'deck.pptx', tipo: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer });
    assert.equal(r.paginas, 2);
    assert.ok(r.texto.includes('Proposta & valor'), 'entidades XML voltam ao texto original');
    assert.ok(r.texto.includes('--- Slide 2 ---'));
  });

  await t.test('recusa arquivo vazio e binário disfarçado de texto', async () => {
    await assert.rejects(() => extrair({ nome: 'x.txt', tipo: 'text/plain', buffer: Buffer.alloc(0) }),
      /vazio/i);
    const binario = Buffer.from(Array.from({ length: 400 }, (_, i) => (i % 3 === 0 ? 0 : 65)));
    await assert.rejects(() => extrair({ nome: 'x.bin', tipo: 'application/octet-stream', buffer: binario }),
      /não suportado/i);
  });

  await t.test('recusa formato antigo do Office com instrução do que fazer', async () => {
    await assert.rejects(
      () => extrair({ nome: 'antigo.doc', tipo: 'application/msword', buffer: Buffer.from('qualquer coisa') }),
      /\.docx/,
    );
  });

  await t.test('imagem volta como imagem, não como texto', async () => {
    // PNG mínimo válido o bastante para o caminho de código
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
    const r = await extrair({ nome: 'foto.png', tipo: 'image/png', buffer: png });
    assert.equal(r.tipo, 'imagem');
    assert.equal(r.texto, '');
    assert.equal(r.imagem.mime, 'image/png');
    assert.ok(r.imagem.base64.length > 0);
  });
});

function planoCompleto() {
  return {
    pesquisa: { fontes: [{ titulo: 'IBGE', url: 'https://ibge.gov.br' }], lacunas: ['preço regional'] },
    produto: {
      sumarioExecutivo: 'Resumo.', tese: 'Tese.',
      problema: { descricao: 'Dor.', tarefa: 'Tarefa.', contextoDisparo: 'Quando.', solucoesAtuais: ['planilha'], custoDeNaoResolver: 'Caro.', selo: 'PESQUISA' },
      solucao: { descricao: 'Solução.', propostaDeValor: 'Valor.', comoFunciona: ['passo'], oQueMuda: 'Muda.', naoFazemos: ['logística'] },
      personas: [{ nome: 'Ana', papel: 'Compradora', contexto: 'Contexto.', dor: 'Dor.', ganho: 'Ganho.', quemPaga: 'Ela.' }],
      roadmap: [{ etapa: 'Piloto', prazo: '3 meses', entregas: ['app'], criterioDeSaida: '20 lotes' }],
      funcionalidadesMvp: ['cadastro'],
    },
    mercado: {
      mercado: {
        tam: { valor: 'R$ 1 bi', comoChegamos: 'conta', fonte: 'IBGE', selo: 'PESQUISA' },
        sam: { valor: 'R$ 100 mi', comoChegamos: 'recorte', recorte: 'PA', selo: 'PESQUISA' },
        som: { valor: 'R$ 5 mi', comoChegamos: '5%', prazo: '36 meses', selo: 'ESTRATEGIA' },
        deBaixoParaCima: { clientesAlcancaveis: '600', ticketMedio: 'R$ 100', resultado: 'R$ 720 mil', divergencia: 'tempo' },
        tendencias: [{ tendencia: 'Rastreio', efeito: 'Demanda', fonte: 'MAPA' }],
      },
      concorrentes: [{ nome: 'X', tipo: 'Direto', forca: 'F', fraqueza: 'W', preco: 'R$ 10' }],
      oceanoAzul: { eliminar: ['a'], reduzir: ['b'], aumentar: ['c'], criar: ['d'], novaCurva: 'Nova.' },
      barreirasDeEntrada: ['confiança'],
      regulacao: [{ norma: 'LGPD', orgao: 'ANPD', exigencia: 'consentimento', prazo: 'já' }],
    },
    negocio: {
      modeloDeNegocio: { descricao: 'Marketplace.', comoEntraDinheiro: 'Take rate.', recorrencia: 'Safra.' },
      leanCanvas: { problema: ['a'], solucao: ['b'], metricasChave: ['c'], propostaUnica: 'd', vantagemInjusta: 'e', canais: ['f'], segmentos: ['g'], estruturaCustos: ['h'], fontesReceita: ['i'] },
      precificacao: [{ plano: 'Pro', preco: 'R$ 99', paraQuem: 'PME', inclui: ['tudo'] }],
      economiaUnitaria: { ticketMedio: 100, cacEstimado: 200, custoServirMensal: 20, margemContribuicao: '70%', mesesDeVida: 20, ltv: 2000, razaoLtvCac: 10, paybackMeses: 2, premissas: ['x'], selo: 'ESTRATEGIA' },
      projecao36Meses: [{ mes: 1, receita: 0, clientes: 0, custos: 100 }, { mes: 12, receita: 500, clientes: 5, custos: 300 }],
      financeiro: { investimentoNecessario: 'R$ 1 mi', usoDosRecursos: [{ rubrica: 'Time', percentual: 50, para: 'campo' }], pontoDeEquilibrio: 'Mês 26', pedido: 'R$ 1 mi por 24 meses.' },
    },
    crescimento: {
      bullseye: { candidatos: ['a'], testar: [{ canal: 'b', hipotese: 'h', custoTeste: 'R$ 1 mil', sinalDeSucesso: 's' }], foco: { canal: 'b', porque: 'p', comoEscalar: 'e' } },
      metricaNorte: { metrica: 'Lotes', porque: 'p', valorHoje: '0', meta12Meses: '100', contraMetrica: 'Prazo' },
      okrs: [{ objetivo: 'O', resultados: ['r'], trimestre: 'T1' }],
      funil: [{ etapa: 'topo', metricaChave: 'm', referencia: 'r' }],
      retencao: { estrategia: 'e', gatilhosDeUso: ['g'], sinaisDeAbandono: ['s'] },
      primeiros90Dias: [{ semana: 'S1', foco: 'f', entrega: 'e' }],
    },
    impacto: {
      teoriaDaMudanca: { insumos: ['i'], atividades: ['a'], resultados: ['r'], impacto: 'imp' },
      ods: [{ numero: 8, nome: 'Trabalho decente', meta: '8.3', contribuicao: 'c', indicador: 'i' }],
      pegada: { escopo1: 'e1', escopo2: 'e2', escopo3: 'e3', estimativaTonAno: 40, comoReduzir: ['r'], comoCompensar: 'c', selo: 'HIPOTESE' },
      kpisImpacto: [{ indicador: 'Renda', unidade: 'R$', linhaDeBase: '0', meta: '+1000', comoMedir: 'm' }],
      riscos: [{ risco: 'r', probabilidade: 'Alta', impacto: 'Médio', mitigacao: 'm', sinalDeAlerta: 's' }],
      fomento: [{ programa: 'Centelha', orgao: 'FINEP', aderencia: 80, porque: 'p', oQuePreparar: 'q' }],
      grauDeEvidencia: { nivelGeral: 'ESTRATEGIA', elosFracos: ['x'], comoSubir: ['y'] },
    },
  };
}
