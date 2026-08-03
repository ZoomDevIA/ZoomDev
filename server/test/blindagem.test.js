// Testes do pacote de blindagem: sessão com prazo, política de origem,
// isolamento da prévia e os direitos do titular sobre os dados do Studio.
//
// Cada um destes existe porque a falha correspondente é silenciosa. Um token
// que não vence continua funcionando e ninguém percebe. Uma exportação
// incompleta parece completa. Um expurgo que não roda não deixa rastro. Sem
// teste, tudo isso volta na primeira refatoração distraída.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Banco próprio e limpo a cada execução. Sem isso o teste escreveria no banco
// de desenvolvimento e, pior, falharia na segunda rodada porque os usuários
// criados na primeira ainda estariam lá. As importações são dinâmicas porque
// a configuração lê a variável de ambiente no momento em que é carregada.
const DIR_TESTE = new URL('../../.tmp-test-blindagem/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;

const { store } = await import('../src/store.js');
const { authMiddleware, limparSessoesVencidas, register } = await import('../src/auth.js');
const { cors, origensPermitidas, POLITICA_PREVIA } = await import('../src/services/blindagem.js');
const { exportarDados, excluirConta, expurgarAnexosVencidos, RETENCAO_ANEXOS_DIAS } = await import('../src/services/lgpd.js');
const { emitirPrevia, lerPrevia, montarPrevia } = await import('../src/services/previa.js');
const { lerConteudo, gravarConteudo, hidratar, migrarConteudo } = await import('../src/services/conteudo.js');

// ── Auxiliares de requisição e resposta ───────────────────────────────────
function resposta() {
  const cabecalhos = {};
  return {
    cabecalhos,
    statusCode: 200,
    corpo: null,
    setHeader(k, v) { cabecalhos[k.toLowerCase()] = v; },
    getHeader(k) { return cabecalhos[k.toLowerCase()]; },
    removeHeader(k) { delete cabecalhos[k.toLowerCase()]; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.corpo = o; return this; },
    end() { return this; },
  };
}

function usuarioDeTeste(sufixo) {
  const r = register({ nome: 'Teste', email: `blindagem-${sufixo}@zd.dev`, password: 'senha123456' });
  return { token: r.token, user: store.users[r.user.id] };
}

test('sessão com prazo', async (t) => {
  await t.test('token válido passa e é renovado sem regravar toda hora', () => {
    const { token } = usuarioDeTeste('a');
    const antes = store.sessions[token].expiraEm;
    assert.ok(antes, 'a sessão nasce com prazo');

    const res = resposta();
    let seguiu = false;
    authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, () => { seguiu = true; });
    assert.equal(seguiu, true);
    assert.equal(store.sessions[token].expiraEm, antes, 'sessão recém-criada não regrava o prazo a cada clique');
  });

  await t.test('token vencido é recusado e apagado', () => {
    const { token } = usuarioDeTeste('b');
    store.sessions[token].expiraEm = new Date(Date.now() - 1000).toISOString();

    const res = resposta();
    let seguiu = false;
    authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, () => { seguiu = true; });

    assert.equal(seguiu, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.corpo.code, 'SESSAO_EXPIRADA');
    assert.equal(store.sessions[token], undefined, 'a sessão morta sai do banco');
  });

  await t.test('sessão antiga sem prazo ganha um em vez de derrubar todo mundo', () => {
    const { token } = usuarioDeTeste('c');
    // Como ficavam as sessões antes desta mudança
    store.sessions[token] = { userId: store.sessions[token].userId, criadoEm: new Date().toISOString() };

    const res = resposta();
    let seguiu = false;
    authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, () => { seguiu = true; });
    assert.equal(seguiu, true, 'quem já estava logado não é expulso pela migração');
  });

  await t.test('a varredura remove só o que venceu', () => {
    const viva = usuarioDeTeste('d');
    const morta = usuarioDeTeste('e');
    store.sessions[morta.token].expiraEm = new Date(Date.now() - 1000).toISOString();

    limparSessoesVencidas();
    assert.ok(store.sessions[viva.token], 'sessão viva permanece');
    assert.equal(store.sessions[morta.token], undefined, 'sessão vencida sai');
  });
});

test('política de origem', async (t) => {
  await t.test('requisição sem Origin passa (curl, webhook, aplicativo)', () => {
    const res = resposta();
    let seguiu = false;
    cors({ headers: {}, method: 'GET' }, res, () => { seguiu = true; });
    assert.equal(seguiu, true);
  });

  await t.test('origem fora da lista é barrada', () => {
    const anterior = process.env.ZOOMDEV_URL;
    const ambiente = process.env.NODE_ENV;
    process.env.ZOOMDEV_URL = 'https://zoomdev.app';
    process.env.NODE_ENV = 'production';
    try {
      const res = resposta();
      let seguiu = false;
      cors({ headers: { origin: 'https://site-qualquer.example' }, method: 'GET' }, res, () => { seguiu = true; });
      assert.equal(seguiu, false);
      assert.equal(res.statusCode, 403);
      assert.equal(res.getHeader('access-control-allow-origin'), undefined);
    } finally {
      process.env.ZOOMDEV_URL = anterior;
      process.env.NODE_ENV = ambiente;
    }
  });

  await t.test('origem configurada é liberada e ecoada', () => {
    const anterior = process.env.ZOOMDEV_URL;
    process.env.ZOOMDEV_URL = 'https://zoomdev.app';
    try {
      assert.ok(origensPermitidas().includes('https://zoomdev.app'));
      const res = resposta();
      let seguiu = false;
      cors({ headers: { origin: 'https://zoomdev.app' }, method: 'GET' }, res, () => { seguiu = true; });
      assert.equal(seguiu, true);
      assert.equal(res.getHeader('access-control-allow-origin'), 'https://zoomdev.app');
      assert.equal(res.getHeader('vary'), 'Origin');
    } finally { process.env.ZOOMDEV_URL = anterior; }
  });
});

test('prévia do MVP isolada', async (t) => {
  const arquivos = [
    { arquivo: 'index.html', conteudo: '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><h1>Oi</h1><script src="app.js"></script></body></html>' },
    { arquivo: 'styles.css', conteudo: 'h1 { color: lime; }' },
    { arquivo: 'app.js', conteudo: 'localStorage.setItem("x", "1");' },
  ];

  await t.test('a política joga o documento em origem opaca', () => {
    assert.match(POLITICA_PREVIA, /^sandbox /, 'sem sandbox, código gerado rodaria na origem da plataforma');
    assert.ok(!POLITICA_PREVIA.includes('allow-same-origin'),
      'allow-same-origin devolveria à prévia o alcance do token de quem está logado');
    assert.match(POLITICA_PREVIA, /frame-ancestors 'self'/, 'só a própria plataforma pode embutir');
  });

  await t.test('o bilhete é opaco, vence, e some depois de vencido', () => {
    const { bilhete } = emitirPrevia({ userId: 'u1', projetoId: 'p1', arquivos, pagina: 'index.html' });
    assert.ok(bilhete.length >= 32, 'bilhete curto seria adivinhável');
    assert.ok(!bilhete.includes('p1'), 'o bilhete não carrega o id do projeto');
    assert.ok(lerPrevia(bilhete), 'bilhete recém-emitido vale');
    assert.equal(lerPrevia('inventado'), null);
  });

  await t.test('o CSS e o JS entram embutidos, porque não há servidor de arquivos', () => {
    const html = montarPrevia(arquivos, 'index.html');
    assert.ok(html.includes('h1 { color: lime; }'), 'o CSS precisa estar no documento');
    assert.ok(!html.includes('href="styles.css"'), 'a referência externa sai');
    assert.ok(html.includes('localStorage.setItem("x", "1")'), 'o JS precisa estar no documento');
  });

  await t.test('o substituto de armazenamento vem antes do código do produto', () => {
    const html = montarPrevia(arquivos, 'index.html');
    const substituto = html.indexOf('sessionStorage');
    const produto = html.indexOf('localStorage.setItem("x"');
    assert.ok(substituto >= 0, 'em origem opaca localStorage lança, e o MVP guarda estado nele');
    assert.ok(substituto < produto, 'se o substituto vier depois, o primeiro acesso já estoura');
  });
});

test('direitos do titular sobre os dados do Studio', async (t) => {
  // O conteúdo pesado mora fora do índice, então o projeto de teste também é
  // montado nos dois lugares: assim o teste exercita o caminho de verdade.
  function projetoComTudo(userId) {
    const p = {
      id: `prj_teste_${userId}`, userId, nome: 'Projeto', descricao: 'Ideia',
      classificacao: 'startup', fase: 'ideacao', criadoEm: new Date().toISOString(),
      publicado: false, plano: { geradoEm: 'x' },
      metricas: { receitaMensal: 100 },
      mvp: { status: 'pronto' },
    };
    store.projects[p.id] = p;
    gravarConteudo(p.id, {
      documento: '<h1>Plano</h1><p>Texto que a pessoa escreveu.</p>',
      planoZoomDev: { versao: 'zoomdev-1' },
      trilha: [{ id: 'u1', papel: 'usuario', texto: 'ajuste o mercado' }],
      anexos: [{ nome: 'edital.pdf', tipo: 'pdf', texto: 'Conteúdo do edital', em: new Date().toISOString() }],
      mvpArquivos: [{ arquivo: 'index.html', conteudo: '<h1>MVP</h1>' }],
    });
    return p;
  }

  await t.test('a exportação leva o documento, a trilha, os anexos e a localização', () => {
    const { user } = usuarioDeTeste('f');
    user.local = { cidade: 'Belém', uf: 'PA', lat: -1.4, lon: -48.5 };
    projetoComTudo(user.id);

    const e = exportarDados(user);
    assert.ok(e.politicaDeRetencao, 'o titular precisa saber por quanto tempo cada coisa fica');
    assert.deepEqual(e.conta.localizacao.cidade, 'Belém');

    const p = e.projetos.find(x => x.nome === 'Projeto');
    assert.match(p.documento, /Texto que a pessoa escreveu/, 'o documento é o dado mais pessoal do projeto');
    assert.equal(p.trilha.length, 1);
    assert.equal(p.anexos[0].texto, 'Conteúdo do edital');
    assert.equal(p.metricas.receitaMensal, 100);
    assert.equal(p.mvp.arquivos[0].conteudo, '<h1>MVP</h1>', 'o código gerado é trabalho da pessoa');
    assert.ok(!JSON.stringify(e).includes('passwordHash'), 'segredo do sistema não é dado do titular');
  });

  await t.test('a exclusão apaga localização, documento, trilha e anexos', () => {
    const { user } = usuarioDeTeste('g');
    user.local = { cidade: 'Belém', uf: 'PA' };
    const privado = projetoComTudo(user.id);
    const publico = projetoComTudo(`${user.id}-pub`);
    publico.userId = user.id;
    publico.publicado = true;

    const r = excluirConta(user);

    assert.equal(store.projects[privado.id], undefined, 'projeto privado vai embora inteiro');
    assert.equal(user.local, undefined, 'localização é o dado que menos justifica sobreviver');
    assert.equal(store.projects[publico.id].userId, null, 'o projeto público perde o vínculo');
    const restou = lerConteudo(publico.id);
    assert.equal(restou.documento, undefined, 'o texto da pessoa não é conteúdo público');
    assert.equal(restou.anexos, undefined);
    assert.equal(restou.trilha, undefined);
    assert.ok(r.removidos.length > 0, 'a resposta ao titular diz o que saiu, não só "ok"');
  });

  await t.test('anexo vencido tem o conteúdo expurgado e o registro preservado', () => {
    const { user } = usuarioDeTeste('h');
    const p = projetoComTudo(user.id);
    const velho = RETENCAO_ANEXOS_DIAS + 1;
    gravarConteudo(p.id, {
      anexos: [
        { nome: 'antigo.pdf', tipo: 'pdf', texto: 'Texto antigo', em: new Date(Date.now() - velho * 86400000).toISOString() },
        { nome: 'novo.pdf', tipo: 'pdf', texto: 'Texto recente', em: new Date().toISOString() },
      ],
    });

    const n = expurgarAnexosVencidos();
    assert.ok(n >= 1);
    const anexos = lerConteudo(p.id).anexos;
    assert.equal(anexos[0].texto, '', 'o conteúdo sai');
    assert.ok(anexos[0].expurgadoEm, 'a data do expurgo fica');
    assert.equal(anexos[0].nome, 'antigo.pdf', 'o registro de que existiu permanece');
    assert.equal(anexos[1].texto, 'Texto recente', 'o que está no prazo não é tocado');

    assert.equal(expurgarAnexosVencidos(), 0, 'rodar de novo não mexe no que já foi expurgado');
  });
});

test('conteúdo pesado fora do índice', async (t) => {
  await t.test('o índice fica pequeno e o conteúdo vai para arquivo próprio', () => {
    const { user } = usuarioDeTeste('i');
    const proj = {
      id: 'prj_leveza', userId: user.id, nome: 'Leve', descricao: 'x',
      fase: 'ideacao', criadoEm: new Date().toISOString(), mvp: { status: 'pronto' },
    };
    store.projects[proj.id] = proj;

    const documento = '<h1>Plano</h1>'.repeat(2000);   // perto de 28 KB
    gravarConteudo(proj.id, { documento });

    // O peso não pode ter ido parar no objeto guardado em memória, senão o
    // próximo save() o levaria de volta para dentro do db.json.
    assert.equal(proj.documento, undefined, 'o índice não guarda o documento');
    assert.equal(proj.temDocumento, true, 'o índice guarda só a marca');
    assert.ok(Buffer.byteLength(JSON.stringify(proj)) < 1000, 'o projeto no índice continua pequeno');

    assert.equal(lerConteudo(proj.id).documento, documento, 'o conteúdo volta inteiro');
  });

  await t.test('hidratar junta os dois sem sujar o índice', () => {
    const { user } = usuarioDeTeste('j');
    const proj = {
      id: 'prj_hidrata', userId: user.id, nome: 'Hidrata', fase: 'ideacao',
      criadoEm: new Date().toISOString(), mvp: { status: 'pronto' },
    };
    store.projects[proj.id] = proj;
    gravarConteudo(proj.id, {
      documento: '<h1>Oi</h1>',
      mvpArquivos: [{ arquivo: 'index.html', conteudo: '<b>x</b>' }],
    });

    const completo = hidratar(proj);
    assert.equal(completo.documento, '<h1>Oi</h1>');
    assert.equal(completo.mvp.arquivos[0].arquivo, 'index.html', 'os arquivos voltam aninhados no mvp');
    assert.equal(proj.documento, undefined, 'hidratar devolve cópia, não contamina o índice');
  });

  await t.test('a migração move o que já estava dentro do índice, e só uma vez', () => {
    const { user } = usuarioDeTeste('k');
    const proj = {
      id: 'prj_antigo', userId: user.id, nome: 'Antigo', fase: 'ideacao',
      criadoEm: new Date().toISOString(),
      // Como os projetos eram gravados antes desta mudança
      documento: '<h1>Documento antigo</h1>',
      anexos: [{ nome: 'a.pdf', texto: 'x' }],
      mvp: { status: 'pronto', arquivos: [{ arquivo: 'index.html', conteudo: 'html' }] },
    };
    store.projects[proj.id] = proj;

    const primeira = migrarConteudo();
    assert.ok(primeira.migrados >= 1);
    assert.equal(proj.documento, undefined, 'o campo sai do índice');
    assert.equal(proj.mvp.arquivos, undefined, 'os arquivos saem de dentro do mvp');
    assert.equal(lerConteudo(proj.id).documento, '<h1>Documento antigo</h1>', 'nada se perde');
    assert.equal(lerConteudo(proj.id).mvpArquivos[0].conteudo, 'html');

    const segunda = migrarConteudo();
    assert.equal(segunda.migrados, 0, 'rodar de novo não faz nada: já migrou');
  });

  await t.test('id de projeto com travessia de caminho é recusado', () => {
    assert.throws(() => lerConteudo('../../etc/passwd'), /inválido/i);
    assert.throws(() => gravarConteudo('', { documento: 'x' }), /inválido/i);
  });
});
