// ═══════════════════════════════════════════════════════════════════════════
// PLANO DE NEGÓCIOS ZOOMDEV — a metodologia da casa em dezessete seções.
//
// Um plano de negócios genérico é um texto que ninguém lê duas vezes. O que
// diferencia este é que cada seção usa um instrumento consagrado em vez de
// prosa livre, e cada afirmação carrega o grau de evidência que a sustenta:
//
//    1  Sumário executivo              o plano inteiro em uma página
//    2  O problema (JTBD)              a tarefa que o cliente contrata
//    3  Solução e proposta de valor    o que muda para ele
//    4  Lean Canvas                    o negócio num quadro só
//    5  Mercado e "por que agora"      TAM/SAM/SOM nos dois sentidos
//    6  Cliente: personas              quem sente a dor e quem assina
//    7  Concorrência e Oceano Azul     matriz ERRC
//    8  Fosso competitivo              o que se acumula e defende com o tempo
//    9  Modelo de negócio e preço      como entra dinheiro
//   10  Economia unitária              CAC, LTV, payback, margem
//   11  Go-to-market (Bullseye)        dezenove canais, três testes, um foco
//   12  Produto e roadmap              o que se constrói e em que ordem
//   13  Métrica-Norte e OKR            o número único e as metas do trimestre
//   14  A hipótese mais arriscada      a crença frágil virada experimento
//   15  Impacto: ODS e GHG             onde o negócio toca o mundo
//   16  Time                           quem falta, em que mês, por quanto
//   17  Financeiro, riscos e o pedido  cenários com gatilho, comparáveis, ask
//
// A GERAÇÃO ACONTECE EM DUAS ONDAS. A primeira é uma pesquisa real na
// internet: mercado, concorrentes, regulação e o contexto do território
// informado. A segunda são cinco agentes que escrevem em paralelo, todos
// alimentados pelo mesmo dossiê de pesquisa. Escrever antes de pesquisar é o
// que produz plano bonito e falso.
// ═══════════════════════════════════════════════════════════════════════════

import { structured, conversarComInternet } from './claude.js';
import { config } from '../config.js';
import { modeloDoPapel } from '../services/modelosIA.js';

const str = { type: 'string' };
const num = { type: 'number' };
const arrStr = { type: 'array', items: str };
const obj = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const lista = (properties) => ({ type: 'array', items: obj(properties) });

const NIVEIS = ['VERIFICADO', 'LAUDO', 'CAMPO', 'PESQUISA', 'ESTRATEGIA', 'HIPOTESE', 'VISAO'];
const selo = { type: 'string', enum: NIVEIS };

// ═══════════════════════════════════════════════════════════════════════════
// ETAPAS — o que o fundador vê acontecendo enquanto espera
// ═══════════════════════════════════════════════════════════════════════════

export const ETAPAS = [
  { id: 'pesquisa', label: 'Pesquisando mercado, concorrência e regulação', agente: 'Atlas' },
  { id: 'produto', label: 'Escrevendo problema, solução e roadmap', agente: 'Produto' },
  { id: 'mercado', label: 'Dimensionando mercado e mapeando o oceano azul', agente: 'Mercado' },
  { id: 'negocio', label: 'Modelando receita, preço e economia unitária', agente: 'Negócio' },
  { id: 'crescimento', label: 'Escolhendo canais, métrica-norte e OKRs', agente: 'Crescimento' },
  { id: 'impacto', label: 'Medindo impacto, ODS, carbono e riscos', agente: 'Impacto' },
  { id: 'montagem', label: 'Diagramando o documento', agente: 'ZoomDoc' },
];

// ═══════════════════════════════════════════════════════════════════════════
// BLOCOS — cada um é um agente com esquema e encomenda próprios
// ═══════════════════════════════════════════════════════════════════════════

const BLOCOS = [
  {
    id: 'produto',
    nome: 'Agente Produto',
    cor: '#00e5ff',
    emoji: '🧩',
    schema: obj({
      sumarioExecutivo: str,
      tese: str,
      problema: obj({
        descricao: str,
        tarefa: str,                 // Jobs to be Done: a tarefa que o cliente contrata
        contextoDisparo: str,        // quando a dor aparece
        solucoesAtuais: arrStr,      // o que ele usa hoje, inclusive planilha e WhatsApp
        custoDeNaoResolver: str,
        selo,
      }),
      solucao: obj({
        descricao: str,
        propostaDeValor: str,
        comoFunciona: arrStr,
        oQueMuda: str,
        naoFazemos: arrStr,          // escopo negativo: o que o produto NÃO é
      }),
      personas: lista({ nome: str, papel: str, contexto: str, dor: str, ganho: str, quemPaga: str }),
      roadmap: lista({ etapa: str, prazo: str, entregas: arrStr, criterioDeSaida: str }),
      funcionalidadesMvp: arrStr,
    }),
    encomenda: `Escreva as seções de PRODUTO.
- sumarioExecutivo: um parágrafo denso que resume o negócio inteiro, do problema ao pedido. É a única parte que muita gente lê.
- tese: uma frase só, no formato "Acreditamos que X, porque Y, e provaremos com Z".
- problema em Jobs to be Done: qual TAREFA o cliente está contratando, em que momento a dor aparece, o que ele usa hoje (inclua os concorrentes invisíveis: planilha, caderno, WhatsApp, não fazer nada) e quanto custa não resolver.
- solucao: inclua "naoFazemos" com 3 a 4 coisas que o produto deliberadamente NÃO faz. Escopo negativo vale tanto quanto escopo.
- personas: 2 ou 3, sempre separando quem SENTE a dor de quem ASSINA o contrato.
- roadmap: 3 etapas com critério de saída objetivo, não "concluído".`,
  },

  {
    id: 'mercado',
    nome: 'Agente Mercado',
    cor: '#a855f7',
    emoji: '🌐',
    schema: obj({
      mercado: obj({
        tam: obj({ valor: str, comoChegamos: str, fonte: str, selo }),
        sam: obj({ valor: str, comoChegamos: str, recorte: str, selo }),
        som: obj({ valor: str, comoChegamos: str, prazo: str, selo }),
        deBaixoParaCima: obj({
          clientesAlcancaveis: str,
          ticketMedio: str,
          resultado: str,
          divergencia: str,          // por que bate ou não bate com o de cima para baixo
        }),
        tendencias: lista({ tendencia: str, efeito: str, fonte: str }),
      }),
      concorrentes: lista({ nome: str, tipo: str, forca: str, fraqueza: str, preco: str }),
      oceanoAzul: obj({
        eliminar: arrStr,
        reduzir: arrStr,
        aumentar: arrStr,
        criar: arrStr,
        novaCurva: str,
      }),
      barreirasDeEntrada: arrStr,
      regulacao: lista({ norma: str, orgao: str, exigencia: str, prazo: str, custoEstimado: str }),
      // A pergunta que separa boa ideia de boa oportunidade, e que todo
      // investidor faz nos primeiros cinco minutos.
      porQueAgora: obj({ oQueMudou: str, quando: str, janela: str, fonte: str, selo }),
      // O "EXIT" do IDEA TO EXIT deixa de ser slogan: quem comprou empresa
      // parecida, por quanto, e o que isso diz sobre o teto deste negócio.
      comparaveisDeSaida: lista({ empresa: str, comprador: str, valor: str, ano: str, porQueSeParece: str, fonte: str }),
    }),
    encomenda: `Escreva as seções de MERCADO.
- TAM, SAM e SOM com o CÁLCULO explícito em "comoChegamos", não só o número. Cite a fonte real que apareceu na pesquisa; se não houver, diga que é estimativa e baixe o selo.
- deBaixoParaCima: refaça a conta partindo de clientes alcançáveis vezes ticket. Se o resultado divergir muito do SOM de cima para baixo, EXPLIQUE a divergência em vez de esconder. Investidor faz essa conta na frente do fundador.
- concorrentes: 4 a 6, incluindo os indiretos e o "não fazer nada".
- oceanoAzul: matriz ERRC de verdade, com itens específicos deste mercado, e uma frase sobre a nova curva de valor.
- regulacao: normas brasileiras que de fato incidem (ANVISA, IBAMA, LGPD, Banco Central, CONAMA, INMETRO, o que couber), cada uma com o prazo típico de obtenção e o custo estimado em reais. Se não houver regulação relevante, devolva lista vazia em vez de inventar.
- porQueAgora: o que mudou no mundo (norma nova, tecnologia que barateou, comportamento, preço de insumo, programa público) que torna este negócio possível AGORA e não cinco anos atrás, com a data da mudança e por quanto tempo a janela fica aberta. Se a resposta serviria para qualquer negócio, ela está errada.
- comparaveisDeSaida: 2 a 4 empresas parecidas que foram compradas ou abriram capital, com comprador, valor, ano e por que se parecem. Se a pesquisa não trouxe nenhuma, devolva lista vazia: inventar múltiplo é o tipo de mentira que o investidor confere em trinta segundos.`,
  },

  {
    id: 'negocio',
    nome: 'Agente Negócio',
    cor: '#00ff64',
    emoji: '📊',
    schema: obj({
      modeloDeNegocio: obj({ descricao: str, comoEntraDinheiro: str, recorrencia: str }),
      leanCanvas: obj({
        problema: arrStr, solucao: arrStr, metricasChave: arrStr,
        propostaUnica: str, vantagemInjusta: str, canais: arrStr,
        segmentos: arrStr, estruturaCustos: arrStr, fontesReceita: arrStr,
      }),
      precificacao: lista({ plano: str, preco: str, paraQuem: str, inclui: arrStr }),
      economiaUnitaria: obj({
        ticketMedio: num, cacEstimado: num, custoServirMensal: num,
        margemContribuicao: str, mesesDeVida: num, ltv: num,
        razaoLtvCac: num, paybackMeses: num, premissas: arrStr, selo,
      }),
      projecao36Meses: lista({ mes: { type: 'integer' }, receita: num, clientes: { type: 'integer' }, custos: num }),
      // Uma projeção única é adivinhação com casas decimais. Três cenários com
      // gatilho dizem o que fazer quando a realidade não obedecer à planilha.
      cenarios: lista({
        nome: str,                   // pessimista · base · otimista
        premissa: str,
        receitaAno1: str,
        receitaAno3: str,
        gatilho: str,                // o que o fundador vê acontecer que confirma este cenário
        oQueFazer: str,              // a decisão que esse gatilho dispara
      }),
      // Por que, daqui a três anos, um concorrente com mais dinheiro não copia
      // isto num fim de semana.
      fosso: obj({
        hojeTemos: str,
        oQueSeAcumula: str,          // dado, relação, certificação, rede: o que fica mais forte com o uso
        em12Meses: str,
        em36Meses: str,
        oQueDestruiria: str,         // honestidade sobre o que dissolve o fosso
        selo,
      }),
      time: obj({
        quemJaTem: arrStr,
        lacunas: lista({ papel: str, quando: str, custoMensal: str, porque: str, comoResolverAntes: str }),
        conselheiros: arrStr,
      }),
      financeiro: obj({
        investimentoNecessario: str,
        usoDosRecursos: lista({ rubrica: str, percentual: num, para: str }),
        pontoDeEquilibrio: str,
        pedido: str,
      }),
    }),
    encomenda: `Escreva as seções de NEGÓCIO.
- leanCanvas: os nove quadros, cada um com itens curtos e específicos deste negócio.
- precificacao: 2 a 3 planos em reais, com o raciocínio de quem paga cada um.
- economiaUnitaria: números coerentes entre si. ticketMedio x mesesDeVida deve dar o ltv; ltv/cacEstimado deve dar a razão; cac/ticket deve dar o payback. Liste as premissas: um número sem premissa é chute com aparência de conta.
- projecao36Meses: 36 pontos, curva realista partindo de zero, com custos junto da receita. Nada de hóquei no primeiro ano.
- cenarios: exatamente três, chamados pessimista, base e otimista. Cada um com a premissa que o separa dos outros, a receita no ano 1 e no ano 3, o GATILHO observável que diz "estamos neste cenário" e a decisão que esse gatilho dispara. Cenário sem gatilho é enfeite de slide.
- fosso: por que este negócio fica mais difícil de copiar com o tempo, e o que exatamente se acumula (base de dados, relação com cooperativa, certificação, rede de fornecedores, custo de troca). Diga também o que destruiria o fosso. Se hoje não existe fosso, diga isso e mostre o caminho para construí-lo: fingir vantagem injusta é o erro mais comum do plano amador.
- time: quem já está no time, quais papéis faltam, EM QUE MÊS cada um entra, quanto custa por mês e como se resolve o buraco enquanto a pessoa não chega. Contratar todo mundo no mês 1 não é plano, é lista de desejos.
- financeiro.pedido: quanto se está pedindo, para durar quanto tempo, e qual marco esse dinheiro compra. "Precisamos de investimento" não é pedido.`,
  },

  {
    id: 'crescimento',
    nome: 'Agente Crescimento',
    cor: '#ffc531',
    emoji: '🚀',
    schema: obj({
      bullseye: obj({
        candidatos: arrStr,          // a lista larga
        testar: lista({ canal: str, hipotese: str, custoTeste: str, sinalDeSucesso: str }),
        foco: obj({ canal: str, porque: str, comoEscalar: str }),
      }),
      metricaNorte: obj({
        metrica: str, porque: str, valorHoje: str, meta12Meses: str,
        contraMetrica: str,          // o número que não pode piorar enquanto a norte sobe
      }),
      okrs: lista({ objetivo: str, resultados: arrStr, trimestre: str }),
      funil: lista({ etapa: str, metricaChave: str, referencia: str }),
      retencao: obj({ estrategia: str, gatilhosDeUso: arrStr, sinaisDeAbandono: arrStr }),
      primeiros90Dias: lista({ semana: str, foco: str, entrega: str }),
      // O plano inteiro fica de pé sobre uma crença. Esta seção nomeia a
      // crença mais frágil e transforma em experimento com data e custo.
      hipoteseMaisArriscada: obj({
        hipotese: str,               // a frase que, se for falsa, derruba o plano
        porqueEArriscada: str,
        comoTestar: str,
        custoDoTeste: str,
        prazo: str,
        provaDeVida: str,            // o resultado numérico que confirma
        provaDeMorte: str,           // o resultado que manda mudar de rota
        planoB: str,
      }),
    }),
    encomenda: `Escreva as seções de CRESCIMENTO usando o método Bullseye.
- candidatos: 8 a 12 canais possíveis para ESTE negócio, não a lista genérica dos dezenove.
- testar: os 3 mais promissores, cada um com hipótese falseável, custo do teste em reais e o sinal que diria "funcionou".
- foco: o único canal para o qual apostar, com o porquê.
- metricaNorte: UMA métrica que, se subir, significa que o negócio está entregando valor de verdade. Some sempre uma contra-métrica: métrica-norte sem contra-métrica é convite para trapacear o número.
- okrs: 2 objetivos com 3 resultados-chave numéricos cada.
- primeiros90Dias: plano semana a semana (pode agrupar em blocos de duas semanas), do que fazer segunda-feira que vem em diante.
- hipoteseMaisArriscada: UMA frase que, se for falsa, derruba o plano inteiro (normalmente não é "sabemos construir", é "alguém paga este preço por isto"). Transforme em experimento com custo em reais, prazo em semanas, o número que confirma e o número que manda mudar de rota. Termine com o plano B caso a hipótese caia.`,
  },

  {
    id: 'impacto',
    nome: 'Agente Impacto',
    cor: '#7dd3a0',
    emoji: '🌍',
    schema: obj({
      teoriaDaMudanca: obj({ insumos: arrStr, atividades: arrStr, resultados: arrStr, impacto: str }),
      ods: lista({ numero: { type: 'integer' }, nome: str, meta: str, contribuicao: str, indicador: str }),
      pegada: obj({
        escopo1: str, escopo2: str, escopo3: str,
        estimativaTonAno: num, comoReduzir: arrStr, comoCompensar: str, selo,
      }),
      kpisImpacto: lista({ indicador: str, unidade: str, linhaDeBase: str, meta: str, comoMedir: str }),
      riscos: lista({ risco: str, probabilidade: str, impacto: str, mitigacao: str, sinalDeAlerta: str }),
      fomento: lista({ programa: str, orgao: str, aderencia: { type: 'integer', minimum: 0, maximum: 100, description: 'Aderência do programa ao projeto, de 0 a 100 (um encaixe forte fica acima de 70)' }, porque: str, oQuePreparar: str }),
      grauDeEvidencia: obj({ nivelGeral: selo, elosFracos: arrStr, comoSubir: arrStr }),
    }),
    encomenda: `Escreva as seções de IMPACTO.
- teoriaDaMudanca: insumos, atividades, resultados e impacto, encadeados, sem salto lógico.
- ods: 2 a 3 Objetivos de Desenvolvimento Sustentável com a META numerada (ex.: 8.3) e um indicador que dê para medir de verdade.
- pegada: separe os três escopos do GHG Protocol. A estimativa em toneladas por ano pode ser grosseira, mas diga a base.
- riscos: 4 a 5, cada um com o SINAL DE ALERTA que aparece antes do problema. Risco sem sinal de alerta não é gerenciável.
- fomento: programas brasileiros reais e compatíveis, com o que precisa estar pronto antes de submeter.
- grauDeEvidencia: aplique a regra do elo mais fraco. O nível geral do plano é o do seu ponto mais frágil, nunca a média. Aponte os elos fracos e o que faria cada um subir de nível.`,
  },
];

// Quantos agentes escrevem o plano. A rota usa este número para calcular o
// estorno proporcional quando alguma seção não sai.
export const TOTAL_BLOCOS = BLOCOS.length;

// ═══════════════════════════════════════════════════════════════════════════
// PESQUISA — a primeira onda
// ═══════════════════════════════════════════════════════════════════════════

const PESQUISA_SCHEMA = obj({
  panorama: str,
  numeros: lista({ dado: str, valor: str, fonte: str, ano: str, url: str }),
  concorrentesEncontrados: lista({ nome: str, oQueFaz: str, sinal: str }),
  regulacaoEncontrada: arrStr,
  contextoLocal: str,
  // Fonte sem endereço e sem data de acesso não é fonte, é lembrança. O banco
  // e o edital conferem cada linha, e página de governo muda de lugar.
  fontes: lista({ titulo: str, url: str, publicadoEm: str, acessadoEm: str, tipo: str }),
  lacunas: arrStr,
});

async function pesquisar(projeto, local, aoVivo = () => {}) {
  const onde = descreverLocal(local);
  const pergunta = `Pesquise na internet, agora, o contexto de mercado para este negócio brasileiro e devolva um dossiê factual.

NEGÓCIO: ${projeto.nome}
DESCRIÇÃO: ${projeto.descricao}
TIPO: ${projeto.classificacao === 'biostartup' ? 'BioStartup (bioeconomia, impacto socioambiental)' : 'Startup'}
${projeto.vertical ? `VERTICAL: ${projeto.vertical}` : ''}
${onde ? `TERRITÓRIO: ${onde}` : ''}

Procure especificamente:
1. Tamanho e crescimento do mercado no Brasil, com número, ano e fonte.
2. Empresas que já atuam nisso aqui, incluindo as pequenas.
3. Regulação brasileira que incide sobre a operação.
4. Programas de fomento abertos ou recorrentes que se aplicam.
${onde ? `5. O que é específico de ${onde}: cadeias produtivas locais, arranjos, incentivos estaduais ou municipais.` : ''}

Regras: prefira fonte primária (IBGE, ministérios, agências, associações setoriais, relatórios de consultoria). Diga o ano de cada dado e o ENDEREÇO da página onde ele está. Onde não achar dado confiável, registre em "lacunas" em vez de estimar. Responda em pt-BR.`;

  const { texto, buscas } = await conversarComInternet({
    system: 'Você é Atlas, o agente de inteligência de mercado da ZoomDev OS. Pesquisa antes de afirmar, cita fonte e ano, e diz quando não encontrou.',
    messages: [{ role: 'user', content: pergunta }],
    effort: 'high',
    maxTokens: 10000,
    maxBuscas: 6,
    papel: 'pesquisa',
  });

  aoVivo(buscas);

  // A pesquisa vem em prosa; aqui ela é estruturada para virar insumo dos
  // cinco agentes seguintes sem que cada um precise reinterpretar o texto.
  const dossie = await structured({
    system: 'Você organiza um dossiê de pesquisa em JSON, sem inventar nada que não esteja no texto recebido.',
    user: `Organize este dossiê de pesquisa em JSON. Não acrescente dados que não estejam no texto.
Em "fontes", copie o endereço exatamente como apareceu; se o texto não trouxe endereço para aquela fonte, deixe url em branco em vez de inventar um. Em "tipo", diga o que é a fonte (órgão oficial, associação setorial, consultoria, imprensa, artigo acadêmico). Deixe "acessadoEm" em branco: quem preenche é o sistema.

${texto}`,
    schema: PESQUISA_SCHEMA,
    effort: 'low',
    maxTokens: 8000,
    papel: 'extracao',
  });

  // A data de acesso é do sistema, não do modelo: quem gerou o plano não sabe
  // que dia é hoje, e uma data errada na bibliografia invalida a citação
  // inteira aos olhos de quem confere.
  const hoje = new Date().toISOString().slice(0, 10);
  const fontes = (dossie.fontes || []).map(f => ({ ...f, acessadoEm: f.url ? hoje : '' }));

  return { ...dossie, fontes, buscas };
}

// ═══════════════════════════════════════════════════════════════════════════
// ORQUESTRAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gera o plano completo pela metodologia ZoomDev.
 * aoProgredir(id, dados) é chamado a cada etapa.
 * Retorna { plano, pesquisa, planoClassico }.
 */
export async function gerarPlanoZoomDev(projeto, { local, anexos = [], aoProgredir = () => {} } = {}) {
  if (!config.hasApiKey) {
    throw Object.assign(
      new Error('A geração do plano precisa da chave da IA configurada no servidor.'),
      { code: 'NO_API_KEY', status: 503, publico: true },
    );
  }

  // ── Onda 1: pesquisa ────────────────────────────────────────────────────
  aoProgredir('pesquisa', { estado: 'executando' });
  let pesquisa = null;
  try {
    pesquisa = await pesquisar(projeto, local, (buscas) =>
      aoProgredir('pesquisa', { estado: 'executando', detalhe: `${buscas} buscas na internet` }));
    aoProgredir('pesquisa', {
      estado: 'ok',
      detalhe: `${pesquisa.fontes?.length || 0} fontes · ${pesquisa.numeros?.length || 0} dados`,
    });
  } catch (e) {
    // Pesquisa é aceleração de qualidade, não requisito: sem internet o plano
    // ainda sai, mas os selos de evidência caem e isso fica dito no documento.
    aoProgredir('pesquisa', { estado: 'erro', detalhe: 'sem acesso à pesquisa; selos rebaixados' });
  }

  const base = contexto(projeto, local, pesquisa, anexos);

  // ── Onda 2: cinco agentes em paralelo ───────────────────────────────────
  //
  // Antes, o primeiro bloco que falhasse derrubava a geração inteira com um
  // throw: quatro agentes tinham escrito, o modelo já tinha sido pago nos
  // quatro, e o fundador recebia zero. Agora cada bloco tem uma segunda
  // chance e, se ainda assim cair, o plano sai com o que os outros
  // escreveram, dizendo em voz alta o que ficou faltando. Plano incompleto
  // e declarado é útil; plano nenhum não é.
  const resultados = {};
  const faltando = [];

  await Promise.all(BLOCOS.map(async (bloco) => {
    aoProgredir(bloco.id, { estado: 'executando' });
    const encomenda = `${bloco.encomenda}

SELO DE EVIDÊNCIA: onde o esquema pedir "selo", classifique honestamente a afirmação:
VERIFICADO (documento oficial conferido) · LAUDO (laudo técnico assinado) · CAMPO (medição em campo) · PESQUISA (literatura ou fonte primária citada) · ESTRATEGIA (projeção fundamentada) · HIPOTESE (a testar) · VISAO (futuro desejado).
Dado que veio da pesquisa com fonte e ano é PESQUISA. Estimativa própria é ESTRATEGIA. Nunca use VERIFICADO sem documento na mão.`;

    const escrever = () => structured({
      system: `${base}\n\nVocê é o ${bloco.nome} da ZoomDev OS.`,
      user: encomenda,
      schema: bloco.schema,
      effort: 'high',
      maxTokens: 16000,
      papel: 'plano',
    });

    try {
      resultados[bloco.id] = await escrever();
      aoProgredir(bloco.id, { estado: 'ok' });
    } catch (primeira) {
      // Uma segunda tentativa cobre a maioria das quedas: corte de resposta,
      // esquema recusado por um campo, instabilidade momentânea do provedor.
      aoProgredir(bloco.id, { estado: 'executando', detalhe: 'primeira tentativa falhou, refazendo' });
      try {
        resultados[bloco.id] = await escrever();
        aoProgredir(bloco.id, { estado: 'ok', detalhe: 'na segunda tentativa' });
      } catch (segunda) {
        faltando.push({ id: bloco.id, nome: bloco.nome, motivo: segunda.message.slice(0, 140) });
        aoProgredir(bloco.id, { estado: 'erro', detalhe: segunda.message.slice(0, 90) });
      }
    }
  }));

  // Todos caíram: aí não há plano nenhum para entregar, e o estorno é total.
  if (faltando.length === BLOCOS.length) {
    console.error('[plano] todos os blocos falharam:', faltando);
    throw Object.assign(
      new Error('Nenhum dos agentes conseguiu escrever o plano desta vez. A seiva foi devolvida; tente de novo em alguns minutos.'),
      { code: 'PLANO_VAZIO', status: 502, publico: true },
    );
  }

  aoProgredir('montagem', { estado: 'executando' });

  const plano = {
    versao: 'zoomdev-1',
    geradoEm: new Date().toISOString(),
    // O modelo que REALMENTE escreveu, resolvido no papel "plano". Antes o
    // documento carimbava config.model, o padrão do servidor, e mentia sempre
    // que o admin trocava o modelo do papel no painel.
    modelo: modeloDoPapel('plano'),
    local: local || null,
    pesquisa,
    ...resultados,
    // Só aparece quando falta alguma coisa: chave presente é sinal de plano
    // parcial, e quem consome (rota, documento, estorno) trata a partir dela.
    ...(faltando.length ? { secoesFaltando: faltando } : {}),
  };

  aoProgredir('montagem', { estado: 'ok' });

  return {
    plano,
    planoClassico: paraFormatoClassico(plano),
    faltando,
    fracaoEntregue: (BLOCOS.length - faltando.length) / BLOCOS.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTO — o que todos os agentes recebem
// ═══════════════════════════════════════════════════════════════════════════

function contexto(projeto, local, pesquisa, anexos) {
  const bio = projeto.classificacao === 'biostartup';
  const onde = descreverLocal(local);

  const linhas = [
    'Você é um dos agentes especialistas da ZoomDev OS, a plataforma brasileira que leva uma ideia da concepção ao exit.',
    'Vocês escrevem, juntos, um único Plano de Negócios pela metodologia ZoomDev. Cada agente responde por suas seções.',
    '',
    `PROJETO: ${projeto.nome}`,
    `TIPO: ${bio ? 'BioStartup (bioeconomia, sociobiodiversidade, impacto socioambiental)' : 'Startup'}`,
    projeto.vertical ? `VERTICAL: ${projeto.vertical}` : '',
    `IDEIA DO FUNDADOR: ${projeto.descricao}`,
    onde ? `TERRITÓRIO DE OPERAÇÃO: ${onde}. Use isso: cadeias locais, custos, distâncias, incentivos estaduais e cultura de consumo da região mudam o plano.` : '',
    bio ? 'CONTEXTO BIO: considere sociobiodiversidade, rastreabilidade da cadeia, repartição de benefícios, créditos de carbono e os editais de sustentabilidade (FINEP, BNDES, MCTI, fundos estaduais).' : '',
    '',
  ];

  if (pesquisa) {
    linhas.push(
      '═══ DOSSIÊ DE PESQUISA (levantado na internet agora) ═══',
      pesquisa.panorama || '',
      '',
      'DADOS ENCONTRADOS:',
      ...(pesquisa.numeros || []).map(n => `· ${n.dado}: ${n.valor} (${n.fonte}, ${n.ano})`),
      '',
      'CONCORRENTES ENCONTRADOS:',
      ...(pesquisa.concorrentesEncontrados || []).map(c => `· ${c.nome}: ${c.oQueFaz}`),
      '',
      (pesquisa.regulacaoEncontrada || []).length ? `REGULAÇÃO: ${pesquisa.regulacaoEncontrada.join('; ')}` : '',
      pesquisa.contextoLocal ? `CONTEXTO LOCAL: ${pesquisa.contextoLocal}` : '',
      (pesquisa.lacunas || []).length ? `LACUNAS (não encontrado, NÃO invente): ${pesquisa.lacunas.join('; ')}` : '',
      '',
      'Use estes dados com a fonte junto. O que não estiver aqui e você precisar afirmar, marque com selo mais baixo.',
      '',
    );
  } else {
    linhas.push(
      'AVISO: a pesquisa na internet falhou nesta geração. Não invente números com aparência de fonte. Onde faltar dado, diga que falta e classifique como ESTRATEGIA ou HIPOTESE.',
      '',
    );
  }

  const comTexto = anexos.filter(a => a.texto);
  if (comTexto.length) {
    linhas.push('═══ MATERIAL ANEXADO PELO FUNDADOR ═══');
    for (const a of comTexto) {
      linhas.push(`--- ${a.nome} (${a.tipo}) ---`, a.texto.slice(0, 24_000), '');
    }
    linhas.push('Este material vem do fundador: vale mais que estimativa externa. Use-o.', '');
  }

  linhas.push(
    'COMO ESCREVER:',
    '· pt-BR, frase direta, sem jargão de consultoria e sem adjetivo vazio ("inovador", "disruptivo", "revolucionário").',
    '· Todo número vem acompanhado de como foi obtido.',
    '· Específico deste negócio. Se a frase serviria para qualquer startup, ela está errada.',
    '· Valores em R$. Prazos em meses.',
    '· Nunca invente fonte, CNPJ, nome de empresa parceira ou processo administrativo.',
  );

  return linhas.filter(l => l !== '').join('\n');
}

function descreverLocal(local) {
  if (!local) return '';
  const partes = [local.cidade, local.uf, local.pais && local.pais !== 'Brasil' ? local.pais : null]
    .filter(Boolean);
  const base = partes.join(', ');
  return local.bioma ? `${base} (bioma ${local.bioma})` : base;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPATIBILIDADE — o plano novo alimenta o que já existia
//
// A ficha do projeto, o DOCX, o PDF, o Conselho dos Agentes e o construtor de
// MVP leem o formato antigo. Em vez de reescrever cinco consumidores, o plano
// novo se projeta no formato antigo. O documento rico continua sendo a fonte.
// ═══════════════════════════════════════════════════════════════════════════

function paraFormatoClassico(p) {
  const so = (v) => (typeof v === 'string' ? v : v?.valor || v?.descricao || '');
  return {
    geradoEm: p.geradoEm,
    modelo: p.modelo,
    metodologia: 'zoomdev-1',
    produto: {
      propostaDeValor: p.produto?.solucao?.propostaDeValor || '',
      problema: p.produto?.problema?.descricao || '',
      solucao: p.produto?.solucao?.descricao || '',
      publicoAlvo: (p.produto?.personas || []).map(x => x.nome).join(', '),
      personas: (p.produto?.personas || []).map(x => ({
        nome: x.nome, descricao: `${x.papel}. ${x.contexto}`, dor: x.dor,
      })),
      funcionalidadesMvp: p.produto?.funcionalidadesMvp || [],
      diferenciais: p.mercado?.oceanoAzul?.criar || [],
    },
    negocio: {
      modeloDeNegocio: p.negocio?.modeloDeNegocio?.descricao || '',
      mercado: {
        tam: so(p.mercado?.mercado?.tam),
        sam: so(p.mercado?.mercado?.sam),
        som: so(p.mercado?.mercado?.som),
        // A ficha clássica tem um campo só de contexto: o "por que agora" vale
        // mais nele do que a memória de cálculo do TAM, então vai na frente.
        contexto: [p.mercado?.porQueAgora?.oQueMudou, p.mercado?.mercado?.tam?.comoChegamos]
          .filter(Boolean).join(' ') || '',
      },
      concorrentes: (p.mercado?.concorrentes || []).map(c => ({
        nome: c.nome, forca: c.forca, fraqueza: c.fraqueza,
      })),
      pricing: (p.negocio?.precificacao || []).map(x => `${x.plano}: ${x.preco} — ${x.paraQuem}`),
      goToMarket: [
        ...(p.crescimento?.bullseye?.testar || []).map(t => `Testar ${t.canal}: ${t.hipotese}`),
        p.crescimento?.bullseye?.foco?.canal ? `Foco: ${p.crescimento.bullseye.foco.canal}` : '',
      ].filter(Boolean),
      // A ficha antiga mostra doze meses; o plano novo tem trinta e seis.
      projecao12Meses: (p.negocio?.projecao36Meses || []).slice(0, 12).map(x => ({
        mes: x.mes, receita: x.receita, clientes: x.clientes,
      })),
      swot: montarSwot(p),
    },
    engenharia: {
      stack: p.produto?.funcionalidadesMvp || [],
      arquitetura: p.produto?.solucao?.comoFunciona?.join(' ') || '',
      roadmapTecnico: (p.produto?.roadmap || []).map(r => ({
        fase: r.etapa, duracao: r.prazo, entregas: r.entregas,
      })),
      riscosTecnicos: (p.impacto?.riscos || []).map(r => r.risco).slice(0, 4),
      custoInfraEstimado: p.negocio?.economiaUnitaria?.custoServirMensal
        ? `R$ ${p.negocio.economiaUnitaria.custoServirMensal}/mês por cliente servido`
        : '',
    },
    impacto: {
      ods: (p.impacto?.ods || []).map(o => ({
        numero: o.numero, nome: o.nome, contribuicao: o.contribuicao,
      })),
      kpisImpacto: (p.impacto?.kpisImpacto || []).map(k => `${k.indicador} (${k.unidade}): ${k.meta}`),
      praticasEsg: p.impacto?.pegada?.comoReduzir || [],
      riscos: (p.impacto?.riscos || []).map(r => ({ risco: r.risco, mitigacao: r.mitigacao })),
      pegadaCarbono: [p.impacto?.pegada?.escopo1, p.impacto?.pegada?.escopo2, p.impacto?.pegada?.escopo3]
        .filter(Boolean).join(' ') || '',
    },
    editais: {
      editaisRecomendados: (p.impacto?.fomento || []).map(f => ({
        nome: f.programa, orgao: f.orgao, aderencia: f.aderencia, motivo: f.porque,
      })),
      documentacaoNecessaria: (p.impacto?.fomento || []).map(f => f.oQuePreparar).filter(Boolean),
      dicasSubmissao: p.impacto?.grauDeEvidencia?.comoSubir || [],
    },
  };
}

function montarSwot(p) {
  return {
    forcas: [
      p.negocio?.leanCanvas?.vantagemInjusta,
      p.negocio?.fosso?.oQueSeAcumula,
      ...(p.mercado?.oceanoAzul?.criar || []).slice(0, 2),
    ].filter(Boolean),
    fraquezas: (p.impacto?.grauDeEvidencia?.elosFracos || []).slice(0, 4),
    oportunidades: [
      p.mercado?.porQueAgora?.oQueMudou,
      ...(p.mercado?.mercado?.tendencias || []).map(t => t.tendencia),
    ].filter(Boolean).slice(0, 4),
    // O que dissolve o fosso é ameaça por definição, e é a única que o próprio
    // plano confessa.
    ameacas: [
      p.negocio?.fosso?.oQueDestruiria,
      ...(p.impacto?.riscos || []).map(r => r.risco),
    ].filter(Boolean).slice(0, 4),
  };
}

export { descreverLocal };

// Aberto para o teste: a ficha clássica é o que alimenta o MVP Builder e as
// exportações antigas, então uma quebra silenciosa aqui só apareceria no
// documento do usuário.
export const _interno = { paraFormatoClassico, montarSwot, BLOCOS, PESQUISA_SCHEMA };
