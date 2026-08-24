// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAMAÇÃO DO PLANO — do JSON dos agentes para o documento do ZoomDoc.
//
// O que sai daqui é o HTML que abre dentro do editor: títulos numerados
// automaticamente pelo CSS, tabelas de verdade, e os três blocos vivos da
// plataforma (indicador, selo de evidência, citação com fonte).
//
// Duas regras de ouro deste arquivo:
//
//   1. TUDO É ESCAPADO. O conteúdo veio de um modelo de linguagem que leu a
//      internet. Interpolar isso cru em HTML seria injeção de script servida
//      de bandeja, dentro do editor do próprio usuário.
//
//   2. SEÇÃO SEM DADO NÃO APARECE. Cabeçalho seguido de vazio é pior que
//      ausência: dá a impressão de que a geração falhou pela metade.
// ═══════════════════════════════════════════════════════════════════════════

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const temAlgo = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim()));

// ── Tijolos ────────────────────────────────────────────────────────────────
const h1 = (t) => `<h1>${esc(t)}</h1>`;
const h2 = (t) => `<h2>${esc(t)}</h2>`;
const h3 = (t) => `<h3>${esc(t)}</h3>`;
const h4 = (t) => `<h4>${esc(t)}</h4>`;
const p = (t) => (temAlgo(t) ? `<p>${esc(t)}</p>` : '');
const citacao = (t) => (temAlgo(t) ? `<blockquote><p>${esc(t)}</p></blockquote>` : '');
const regua = () => '<hr>';

const ul = (itens) => (temAlgo(itens)
  ? `<ul>${itens.filter(temAlgo).map(i => `<li><p>${esc(i)}</p></li>`).join('')}</ul>` : '');

const ol = (itens) => (temAlgo(itens)
  ? `<ol>${itens.filter(temAlgo).map(i => `<li><p>${esc(i)}</p></li>`).join('')}</ol>` : '');

/** Tabela com cabeçalho. linhas = array de arrays. */
function tabela(cabecalho, linhas) {
  const uteis = (linhas || []).filter(l => l.some(temAlgo));
  if (!uteis.length) return '';
  const th = cabecalho.map(c => `<th><p>${esc(c)}</p></th>`).join('');
  const tr = uteis.map(l => `<tr>${l.map(c => `<td><p>${esc(c)}</p></td>`).join('')}</tr>`).join('');
  return `<table class="zd-tabela"><tbody><tr>${th}</tr>${tr}</tbody></table>`;
}

const indicador = (valor, rotulo, nota = '', cor = '#00e5ff') => (temAlgo(valor)
  ? `<div data-bloco="indicador" data-valor="${esc(valor)}" data-rotulo="${esc(rotulo)}" data-nota="${esc(nota)}" data-cor="${esc(cor)}"></div>`
  : '');

const seloDe = (nivel, texto, fonte = '') => (temAlgo(texto)
  ? `<div data-bloco="selo" data-nivel="${esc(nivel || 'ESTRATEGIA')}" data-texto="${esc(texto)}" data-fonte="${esc(fonte)}"></div>`
  : '');

const fonteCitada = (texto, fonte, url = '') => (temAlgo(texto)
  ? `<div data-bloco="citacao" data-texto="${esc(texto)}" data-fonte="${esc(fonte)}" data-url="${esc(url)}"></div>`
  : '');

const brl = (n) => (Number.isFinite(Number(n))
  ? `R$ ${Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : String(n ?? ''));

// ═══════════════════════════════════════════════════════════════════════════
// O DOCUMENTO
// ═══════════════════════════════════════════════════════════════════════════

export function montarDocumento(plano, projeto = {}) {
  const { produto = {}, mercado = {}, negocio = {}, crescimento = {}, impacto = {}, pesquisa } = plano || {};
  const partes = [];
  const B = (...x) => partes.push(...x.filter(Boolean));

  // ── 1. Sumário executivo ────────────────────────────────────────────────
  B(
    h1('Sumário executivo'),
    p(produto.sumarioExecutivo),
    produto.tese ? citacao(produto.tese) : '',
    painelDeNumeros(negocio, mercado),
    impacto.grauDeEvidencia?.nivelGeral
      ? seloDe(impacto.grauDeEvidencia.nivelGeral,
          'Grau de evidência geral deste plano, pela regra do elo mais fraco.',
          (impacto.grauDeEvidencia.elosFracos || []).slice(0, 2).join(' · '))
      : '',
  );

  // ── 2. O problema ───────────────────────────────────────────────────────
  const pr = produto.problema || {};
  B(
    h1('O problema'),
    p(pr.descricao),
    temAlgo(pr.tarefa) ? h2('A tarefa que o cliente contrata') : '',
    p(pr.tarefa),
    p(pr.contextoDisparo),
    temAlgo(pr.solucoesAtuais) ? h2('O que ele usa hoje') : '',
    ul(pr.solucoesAtuais),
    temAlgo(pr.custoDeNaoResolver) ? h2('O custo de não resolver') : '',
    p(pr.custoDeNaoResolver),
    pr.selo ? seloDe(pr.selo, pr.descricao || 'Diagnóstico do problema') : '',
  );

  // ── 3. Solução e proposta de valor ──────────────────────────────────────
  const so = produto.solucao || {};
  B(
    h1('Solução e proposta de valor'),
    so.propostaDeValor ? citacao(so.propostaDeValor) : '',
    p(so.descricao),
    temAlgo(so.comoFunciona) ? h2('Como funciona') : '',
    ol(so.comoFunciona),
    temAlgo(so.oQueMuda) ? h2('O que muda para o cliente') : '',
    p(so.oQueMuda),
    temAlgo(so.naoFazemos) ? h2('O que deliberadamente não fazemos') : '',
    temAlgo(so.naoFazemos) ? p('Escopo negativo vale tanto quanto escopo. O que está nesta lista não entra no produto, e dizer isso agora evita o pedido de amanhã.') : '',
    ul(so.naoFazemos),
  );

  // ── 4. Lean Canvas ──────────────────────────────────────────────────────
  const lc = negocio.leanCanvas;
  if (lc) {
    B(
      h1('Lean Canvas'),
      p('O negócio inteiro num quadro só. Cada bloco é uma aposta que pode ser testada isoladamente.'),
      tabela(['Bloco', 'Conteúdo'], [
        ['Problema', (lc.problema || []).join(' · ')],
        ['Segmentos de clientes', (lc.segmentos || []).join(' · ')],
        ['Proposta única de valor', lc.propostaUnica],
        ['Solução', (lc.solucao || []).join(' · ')],
        ['Canais', (lc.canais || []).join(' · ')],
        ['Fontes de receita', (lc.fontesReceita || []).join(' · ')],
        ['Estrutura de custos', (lc.estruturaCustos || []).join(' · ')],
        ['Métricas-chave', (lc.metricasChave || []).join(' · ')],
        ['Vantagem injusta', lc.vantagemInjusta],
      ]),
    );
  }

  // ── 5. Mercado ──────────────────────────────────────────────────────────
  const mk = mercado.mercado || {};
  const pqa = mercado.porQueAgora;
  if (mk.tam || mk.som || pqa?.oQueMudou) {
    B(h1('Mercado'));

    // A primeira pergunta de qualquer investidor, respondida antes do
    // primeiro número: por que este negócio não existia cinco anos atrás.
    if (temAlgo(pqa?.oQueMudou)) {
      B(
        h2('Por que agora'),
        citacao(pqa.oQueMudou),
        tabela(['Dimensão', 'Resposta'], [
          ['Quando mudou', pqa.quando],
          ['Por quanto tempo a janela fica aberta', pqa.janela],
        ]),
        pqa.fonte ? fonteCitada('A mudança que abriu a janela', pqa.fonte) : '',
        pqa.selo ? seloDe(pqa.selo, 'Leitura do momento de entrada neste mercado.') : '',
      );
    }

    if (mk.tam || mk.som) B(
      h2('De cima para baixo'),
      tabela(['Camada', 'Valor', 'Como chegamos', 'Evidência'], [
        ['TAM · mercado total', mk.tam?.valor, mk.tam?.comoChegamos, mk.tam?.selo],
        ['SAM · mercado atendível', mk.sam?.valor, mk.sam?.comoChegamos, mk.sam?.selo],
        ['SOM · mercado alcançável', mk.som?.valor, mk.som?.comoChegamos, mk.som?.selo],
      ]),
      mk.tam?.fonte ? fonteCitada(`TAM: ${mk.tam.valor}`, mk.tam.fonte) : '',
    );

    const bx = mk.deBaixoParaCima;
    if (bx) {
      B(
        h2('De baixo para cima'),
        p('A mesma conta refeita do chão: clientes que dá para alcançar de verdade, vezes o ticket. Quando as duas contas divergem muito, a divergência é o assunto — não o número maior.'),
        tabela(['Premissa', 'Valor'], [
          ['Clientes alcançáveis', bx.clientesAlcancaveis],
          ['Ticket médio', bx.ticketMedio],
          ['Resultado', bx.resultado],
        ]),
        temAlgo(bx.divergencia) ? p(bx.divergencia) : '',
      );
    }

    if (temAlgo(mk.tendencias)) {
      B(
        h2('Tendências que empurram ou travam'),
        tabela(['Tendência', 'Efeito no negócio', 'Fonte'],
          mk.tendencias.map(t => [t.tendencia, t.efeito, t.fonte])),
      );
    }
  }

  // ── 6. Cliente ──────────────────────────────────────────────────────────
  if (temAlgo(produto.personas)) {
    B(h1('Quem é o cliente'));
    for (const x of produto.personas) {
      B(
        h2(x.nome),
        p(`${x.papel}. ${x.contexto}`),
        tabela(['Dimensão', 'Descrição'], [
          ['Dor', x.dor],
          ['Ganho esperado', x.ganho],
          ['Quem assina o contrato', x.quemPaga],
        ]),
      );
    }
  }

  // ── 7. Concorrência e oceano azul ───────────────────────────────────────
  // Regulação e barreiras moram aqui dentro, então a seção precisa abrir
  // também quando o mercado é novo e ainda não tem concorrente nomeado.
  if (temAlgo(mercado.concorrentes) || mercado.oceanoAzul
      || temAlgo(mercado.regulacao) || temAlgo(mercado.barreirasDeEntrada)) {
    B(h1('Concorrência e diferenciação'));
    if (temAlgo(mercado.concorrentes)) {
      B(
        h2('Quem já disputa esse espaço'),
        tabela(['Concorrente', 'Tipo', 'Força', 'Fraqueza', 'Preço'],
          mercado.concorrentes.map(c => [c.nome, c.tipo, c.forca, c.fraqueza, c.preco])),
      );
    }
    const oa = mercado.oceanoAzul;
    if (oa) {
      B(
        h2('Matriz ERRC'),
        p('Quatro perguntas que reposicionam a curva de valor: o que o setor inteiro faz e não precisa, o que dá para reduzir, o que merece ser levado além do padrão e o que ninguém oferece ainda.'),
        temAlgo(oa.eliminar) ? h4('Eliminar') : '', ul(oa.eliminar),
        temAlgo(oa.reduzir) ? h4('Reduzir') : '', ul(oa.reduzir),
        temAlgo(oa.aumentar) ? h4('Aumentar') : '', ul(oa.aumentar),
        temAlgo(oa.criar) ? h4('Criar') : '', ul(oa.criar),
        temAlgo(oa.novaCurva) ? p(oa.novaCurva) : '',
      );
    }
    if (temAlgo(mercado.barreirasDeEntrada)) {
      B(h2('Barreiras de entrada'), ul(mercado.barreirasDeEntrada));
    }
    if (temAlgo(mercado.regulacao)) {
      B(
        h2('Regulação aplicável'),
        tabela(['Norma', 'Órgão', 'O que exige', 'Prazo', 'Custo estimado'],
          mercado.regulacao.map(r => [r.norma, r.orgao, r.exigencia, r.prazo, r.custoEstimado])),
      );
    }
  }

  // ── 7b. Fosso competitivo ───────────────────────────────────────────────
  const fs = negocio.fosso;
  if (temAlgo(fs?.oQueSeAcumula) || temAlgo(fs?.hojeTemos)) {
    B(
      h1('Fosso competitivo'),
      p('Diferencial é o que separa hoje. Fosso é o que separa mais a cada mês que passa. A pergunta aqui não é se alguém consegue copiar, é quanto custa copiar daqui a três anos.'),
      p(fs.hojeTemos),
      temAlgo(fs.oQueSeAcumula) ? h2('O que se acumula com o uso') : '',
      p(fs.oQueSeAcumula),
      tabela(['Horizonte', 'Onde o fosso chega'], [
        ['Em 12 meses', fs.em12Meses],
        ['Em 36 meses', fs.em36Meses],
      ]),
      temAlgo(fs.oQueDestruiria) ? h2('O que dissolveria este fosso') : '',
      temAlgo(fs.oQueDestruiria) ? p('Registrado de propósito. Fosso que ninguém sabe como perder é fosso que ninguém está defendendo.') : '',
      p(fs.oQueDestruiria),
      fs.selo ? seloDe(fs.selo, 'Avaliação da vantagem defensável deste negócio.') : '',
    );
  }

  // ── 8. Modelo de negócio e preço ────────────────────────────────────────
  const mn = negocio.modeloDeNegocio;
  if (mn || temAlgo(negocio.precificacao)) {
    B(
      h1('Modelo de negócio e preço'),
      p(mn?.descricao),
      p(mn?.comoEntraDinheiro),
      temAlgo(mn?.recorrencia) ? p(mn.recorrencia) : '',
    );
    if (temAlgo(negocio.precificacao)) {
      B(
        h2('Planos'),
        tabela(['Plano', 'Preço', 'Para quem', 'Inclui'],
          negocio.precificacao.map(x => [x.plano, x.preco, x.paraQuem, (x.inclui || []).join(' · ')])),
      );
    }
  }

  // ── 9. Economia unitária ────────────────────────────────────────────────
  const eu = negocio.economiaUnitaria;
  if (eu) {
    B(
      h1('Economia unitária'),
      p('As contas que decidem se crescer resolve ou agrava o problema de caixa. Um negócio com economia unitária negativa piora a cada cliente novo.'),
      indicador(brl(eu.ticketMedio), 'Ticket médio mensal', 'receita por cliente', '#00e5ff'),
      indicador(brl(eu.cacEstimado), 'Custo de aquisição', 'CAC por cliente conquistado', '#ffc531'),
      indicador(brl(eu.ltv), 'Valor do cliente', `LTV ao longo de ${eu.mesesDeVida || '—'} meses`, '#00ff64'),
      indicador(`${eu.razaoLtvCac ?? '—'}x`, 'LTV sobre CAC',
        Number(eu.razaoLtvCac) >= 3 ? 'acima de 3: sustenta crescimento pago' : 'abaixo de 3: escalar consome caixa',
        Number(eu.razaoLtvCac) >= 3 ? '#00ff64' : '#ff4d8d'),
      indicador(`${eu.paybackMeses ?? '—'} meses`, 'Payback do CAC', 'tempo até o cliente pagar o que custou trazê-lo', '#a855f7'),
      temAlgo(eu.margemContribuicao) ? p(`Margem de contribuição: ${eu.margemContribuicao}`) : '',
      temAlgo(eu.premissas) ? h2('Premissas destas contas') : '',
      ul(eu.premissas),
      eu.selo ? seloDe(eu.selo, 'Números de economia unitária deste plano.') : '',
    );
  }

  // ── 10. Go-to-market ────────────────────────────────────────────────────
  const bs = crescimento.bullseye;
  if (bs) {
    B(
      h1('Go-to-market'),
      p('Método Bullseye: listar amplo, testar barato, focar em um. A maioria dos negócios morre tentando estar em nove canais ao mesmo tempo.'),
      temAlgo(bs.candidatos) ? h2('Canais candidatos') : '',
      ul(bs.candidatos),
    );
    if (temAlgo(bs.testar)) {
      B(
        h2('O que testar agora'),
        tabela(['Canal', 'Hipótese', 'Custo do teste', 'Sinal de sucesso'],
          bs.testar.map(t => [t.canal, t.hipotese, t.custoTeste, t.sinalDeSucesso])),
      );
    }
    if (bs.foco?.canal) {
      B(
        h2('Onde apostar'),
        indicador(bs.foco.canal, 'Canal de foco', bs.foco.porque, '#ffc531'),
        p(bs.foco.comoEscalar),
      );
    }
    if (temAlgo(crescimento.funil)) {
      B(
        h2('Funil'),
        tabela(['Etapa', 'Métrica-chave', 'Referência de mercado'],
          crescimento.funil.map(f => [f.etapa, f.metricaChave, f.referencia])),
      );
    }
  }

  // ── 11. Produto e roadmap ───────────────────────────────────────────────
  if (temAlgo(produto.roadmap) || temAlgo(produto.funcionalidadesMvp)) {
    B(h1('Produto e roadmap'));
    if (temAlgo(produto.funcionalidadesMvp)) {
      B(h2('O que entra no MVP'), ul(produto.funcionalidadesMvp));
    }
    if (temAlgo(produto.roadmap)) {
      B(
        h2('Etapas'),
        tabela(['Etapa', 'Prazo', 'Entregas', 'Critério de saída'],
          produto.roadmap.map(r => [r.etapa, r.prazo, (r.entregas || []).join(' · '), r.criterioDeSaida])),
      );
    }
  }

  // ── 12. Métrica-Norte e OKRs ────────────────────────────────────────────
  const mnorte = crescimento.metricaNorte;
  if (mnorte || temAlgo(crescimento.okrs)) {
    B(h1('Métrica-Norte e OKRs'));
    if (mnorte) {
      B(
        indicador(mnorte.metrica, 'Métrica-Norte', mnorte.porque, '#00ff64'),
        tabela(['Dimensão', 'Valor'], [
          ['Hoje', mnorte.valorHoje],
          ['Meta em 12 meses', mnorte.meta12Meses],
          ['Contra-métrica', mnorte.contraMetrica],
        ]),
        temAlgo(mnorte.contraMetrica)
          ? p('A contra-métrica existe para impedir que a métrica-norte suba pelo motivo errado. Sem ela, todo número é manipulável.')
          : '',
      );
    }
    for (const o of crescimento.okrs || []) {
      B(h3(`${o.objetivo}${o.trimestre ? ` (${o.trimestre})` : ''}`), ul(o.resultados));
    }
    const ret = crescimento.retencao;
    if (ret) {
      B(
        h2('Retenção'),
        p(ret.estrategia),
        temAlgo(ret.gatilhosDeUso) ? h4('Gatilhos de uso') : '', ul(ret.gatilhosDeUso),
        temAlgo(ret.sinaisDeAbandono) ? h4('Sinais de abandono') : '', ul(ret.sinaisDeAbandono),
      );
    }
    if (temAlgo(crescimento.primeiros90Dias)) {
      B(
        h2('Primeiros 90 dias'),
        tabela(['Período', 'Foco', 'Entrega'],
          crescimento.primeiros90Dias.map(x => [x.semana, x.foco, x.entrega])),
      );
    }
  }

  // ── 12b. A hipótese mais arriscada ──────────────────────────────────────
  const hip = crescimento.hipoteseMaisArriscada;
  if (temAlgo(hip?.hipotese)) {
    B(
      h1('A hipótese mais arriscada'),
      p('Todo plano se apoia numa crença que ainda não foi testada. Nomear a mais frágil e transformá-la em experimento é a diferença entre empreender e apostar.'),
      citacao(hip.hipotese),
      p(hip.porqueEArriscada),
      h2('O experimento'),
      tabela(['Dimensão', 'Definição'], [
        ['Como testar', hip.comoTestar],
        ['Custo do teste', hip.custoDoTeste],
        ['Prazo', hip.prazo],
        ['Prova de vida', hip.provaDeVida],
        ['Prova de morte', hip.provaDeMorte],
      ]),
      temAlgo(hip.planoB) ? h2('Se a hipótese cair') : '',
      p(hip.planoB),
    );
  }

  // ── 13. Impacto ─────────────────────────────────────────────────────────
  if (impacto.teoriaDaMudanca || temAlgo(impacto.ods)) {
    B(h1('Impacto'));
    const tm = impacto.teoriaDaMudanca;
    if (tm) {
      B(
        h2('Teoria da mudança'),
        tabela(['Elo', 'Conteúdo'], [
          ['Insumos', (tm.insumos || []).join(' · ')],
          ['Atividades', (tm.atividades || []).join(' · ')],
          ['Resultados', (tm.resultados || []).join(' · ')],
          ['Impacto', tm.impacto],
        ]),
      );
    }
    if (temAlgo(impacto.ods)) {
      B(
        h2('Objetivos de Desenvolvimento Sustentável'),
        tabela(['ODS', 'Meta', 'Contribuição', 'Indicador'],
          impacto.ods.map(o => [`${o.numero} · ${o.nome}`, o.meta, o.contribuicao, o.indicador])),
      );
    }
    const pg = impacto.pegada;
    if (pg) {
      B(
        h2('Pegada de carbono'),
        p('Separada pelos três escopos do GHG Protocol, porque é assim que qualquer auditoria, edital ou comprador de crédito vai pedir.'),
        tabela(['Escopo', 'O que abrange'], [
          ['Escopo 1 · emissões diretas', pg.escopo1],
          ['Escopo 2 · energia comprada', pg.escopo2],
          ['Escopo 3 · cadeia de valor', pg.escopo3],
        ]),
        pg.estimativaTonAno
          ? indicador(`${pg.estimativaTonAno} tCO₂e`, 'Estimativa anual', 'ordem de grandeza, a confirmar por inventário', '#7dd3a0')
          : '',
        temAlgo(pg.comoReduzir) ? h4('Como reduzir antes de compensar') : '', ul(pg.comoReduzir),
        temAlgo(pg.comoCompensar) ? p(pg.comoCompensar) : '',
        pg.selo ? seloDe(pg.selo, 'Estimativa de pegada de carbono.') : '',
      );
    }
    if (temAlgo(impacto.kpisImpacto)) {
      B(
        h2('Indicadores de impacto'),
        tabela(['Indicador', 'Unidade', 'Linha de base', 'Meta', 'Como medir'],
          impacto.kpisImpacto.map(k => [k.indicador, k.unidade, k.linhaDeBase, k.meta, k.comoMedir])),
      );
    }
  }

  // ── 13b. Time ───────────────────────────────────────────────────────────
  const tm2 = negocio.time;
  if (temAlgo(tm2?.quemJaTem) || temAlgo(tm2?.lacunas)) {
    B(
      h1('Time'),
      p('Quem já está, quem falta, e em que mês cada pessoa entra. Investidor não compra organograma cheio, compra sequência de contratações que o dinheiro dele sustenta.'),
      temAlgo(tm2.quemJaTem) ? h2('Quem já está') : '',
      ul(tm2.quemJaTem),
      temAlgo(tm2.lacunas) ? h2('O que falta e quando entra') : '',
      temAlgo(tm2.lacunas)
        ? tabela(['Papel', 'Quando entra', 'Custo mensal', 'Por quê', 'Como se resolve até lá'],
            tm2.lacunas.map(l => [l.papel, l.quando, l.custoMensal, l.porque, l.comoResolverAntes]))
        : '',
      temAlgo(tm2.conselheiros) ? h2('Conselho e apoio externo') : '',
      ul(tm2.conselheiros),
    );
  }

  // ── 14. Financeiro, riscos e o pedido ───────────────────────────────────
  B(h1('Financeiro, riscos e o pedido'));
  const fin = negocio.financeiro;
  if (fin) {
    B(
      h2('Necessidade de recursos'),
      indicador(fin.investimentoNecessario, 'Investimento necessário', fin.pontoDeEquilibrio, '#00e5ff'),
      temAlgo(fin.usoDosRecursos)
        ? tabela(['Rubrica', '%', 'Para quê'],
            fin.usoDosRecursos.map(u => [u.rubrica, `${u.percentual}%`, u.para]))
        : '',
      temAlgo(fin.pedido) ? h2('O pedido') : '',
      fin.pedido ? citacao(fin.pedido) : '',
    );
  }
  if (temAlgo(negocio.projecao36Meses)) {
    B(
      h2('Projeção de 36 meses'),
      p('Marcos anuais. A série mensal completa alimenta os gráficos do painel de tração.'),
      tabela(['Mês', 'Receita', 'Clientes', 'Custos'],
        negocio.projecao36Meses
          .filter(x => [1, 6, 12, 18, 24, 30, 36].includes(x.mes))
          .map(x => [`Mês ${x.mes}`, brl(x.receita), String(x.clientes ?? ''), brl(x.custos)])),
    );
  }
  if (temAlgo(negocio.cenarios)) {
    B(
      h2('Três cenários e seus gatilhos'),
      p('A projeção acima é o cenário base. Estes são os três caminhos possíveis, cada um com o sinal observável que diz em qual deles o negócio entrou e a decisão que esse sinal dispara. Cenário sem gatilho é enfeite; com gatilho, vira regra de condução.'),
      tabela(['Cenário', 'Premissa', 'Receita ano 1', 'Receita ano 3', 'Gatilho observável', 'O que fazer'],
        negocio.cenarios.map(c => [c.nome, c.premissa, c.receitaAno1, c.receitaAno3, c.gatilho, c.oQueFazer])),
    );
  }
  if (temAlgo(impacto.riscos)) {
    B(
      h2('Riscos'),
      tabela(['Risco', 'Probabilidade', 'Impacto', 'Mitigação', 'Sinal de alerta'],
        impacto.riscos.map(r => [r.risco, r.probabilidade, r.impacto, r.mitigacao, r.sinalDeAlerta])),
    );
  }
  if (temAlgo(mercado.comparaveisDeSaida)) {
    B(
      h2('Comparáveis de saída'),
      p('O EXIT do IDEA TO EXIT com número em cima. Quem comprou empresa parecida, por quanto e por quê. Não é promessa de valor: é a referência pública que diz qual é o teto conhecido deste mercado.'),
      tabela(['Empresa', 'Comprador', 'Valor', 'Ano', 'Por que se parece'],
        mercado.comparaveisDeSaida.map(c => [c.empresa, c.comprador, c.valor, c.ano, c.porQueSeParece])),
    );
  }
  if (temAlgo(impacto.fomento)) {
    B(
      h2('Fomento público compatível'),
      tabela(['Programa', 'Órgão', 'Aderência', 'Por quê', 'O que preparar'],
        // Aderência em um dígito veio na escala 0-10 (planos antigos): vira %
        impacto.fomento.map(f => [f.programa, f.orgao, `${f.aderencia > 0 && f.aderencia <= 10 ? f.aderencia * 10 : f.aderencia}%`, f.porque, f.oQuePreparar])),
    );
  }

  // ── Evidência e fontes ──────────────────────────────────────────────────
  const ge = impacto.grauDeEvidencia;
  if (ge || pesquisa?.fontes?.length) {
    B(regua(), h1('Evidência e fontes'));
    if (ge) {
      B(
        p('O grau de evidência do plano é o do seu ponto mais frágil, nunca a média. É a regra do elo mais fraco, e ela existe para que ninguém confunda um plano bem escrito com um plano bem sustentado.'),
        seloDe(ge.nivelGeral, 'Grau de evidência geral do plano.'),
        temAlgo(ge.elosFracos) ? h2('Elos mais fracos') : '', ul(ge.elosFracos),
        temAlgo(ge.comoSubir) ? h2('Como subir de nível') : '', ul(ge.comoSubir),
      );
    }
    if (pesquisa?.fontes?.length) {
      B(
        h2('Fontes consultadas'),
        // Página de governo muda de endereço. Sem a data de acesso, um link
        // quebrado vira "a fonte não existe" em vez de "a fonte se mudou".
        p('Cada linha traz o endereço e a data em que a página foi lida. Quem conferir daqui a um ano vai encontrar links mudados: a data de acesso é o que permite recuperar a versão certa.'),
        tabela(['Fonte', 'Tipo', 'Publicada em', 'Acessada em', 'Endereço'],
          pesquisa.fontes.map(f => [f.titulo || f.url, f.tipo, f.publicadoEm, f.acessadoEm, f.url])),
      );
    }
    if (temAlgo(pesquisa?.lacunas)) {
      B(
        h2('O que não foi encontrado'),
        p('Registrado de propósito. Lacuna declarada é honestidade; lacuna preenchida por estimativa com cara de dado é o começo de um plano que não se sustenta na primeira pergunta difícil.'),
        ul(pesquisa.lacunas),
      );
    }
  }

  return partes.filter(Boolean).join('\n');
}

// ── Painel de números do sumário ───────────────────────────────────────────
function painelDeNumeros(negocio, mercado) {
  const eu = negocio?.economiaUnitaria || {};
  const som = mercado?.mercado?.som?.valor;
  const blocos = [
    som ? indicador(som, 'Mercado alcançável', mercado?.mercado?.som?.prazo || '', '#a855f7') : '',
    eu.ticketMedio ? indicador(brl(eu.ticketMedio), 'Ticket médio mensal', '', '#00e5ff') : '',
    eu.razaoLtvCac ? indicador(`${eu.razaoLtvCac}x`, 'LTV sobre CAC', '', Number(eu.razaoLtvCac) >= 3 ? '#00ff64' : '#ff4d8d') : '',
    negocio?.financeiro?.investimentoNecessario
      ? indicador(negocio.financeiro.investimentoNecessario, 'Investimento buscado', '', '#ffc531') : '',
  ].filter(Boolean);
  return blocos.join('');
}
