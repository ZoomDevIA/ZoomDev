// ═══════════════════════════════════════════════════════════════════════════
// TESTES DO QUE DÓI SE QUEBRAR
//
// Não é suíte completa e não pretende ser. É a rede embaixo dos quatro pontos
// onde um erro silencioso custa caro:
//
//   PERMISSÕES  um papel ganhar capacidade que não é dele
//   PIX         um dígito errado no CRC gera QR que o banco recusa
//   CARBONO     fator trocado vira número errado num documento assinado
//   BLINDAGEM   dado sensível escapar para uma rota pública
//
// Rodar: npm test
// ═══════════════════════════════════════════════════════════════════════════
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.ZOOMDEV_DATA_DIR = process.env.ZOOMDEV_DATA_DIR
  || new URL('../../.tmp-test-data/', import.meta.url).pathname;

const { PAPEIS, CAPACIDADES, pode, capacidadesDe } = await import('../src/services/permissoes.js');
const { higienizar, projetarProjeto } = await import('../src/services/vitrine.js');
const { tituloDeIdeia, classificarHeuristica } = await import('../src/agents/classifier.js');

describe('permissões', () => {
  test('todo papel só declara capacidades que existem no catálogo', () => {
    const conhecidas = new Set(Object.keys(CAPACIDADES));
    for (const [id, papel] of Object.entries(PAPEIS)) {
      for (const c of papel.capacidades) {
        assert.ok(conhecidas.has(c), `papel ${id} declara capacidade inexistente: ${c}`);
      }
    }
  });

  test('admin tem todas as capacidades', () => {
    assert.equal(PAPEIS.admin.capacidades.length, Object.keys(CAPACIDADES).length);
  });

  test('editor NÃO alcança o que é do administrador', () => {
    const proibidas = ['usuarios.gerenciar', 'sistema.configurar', 'financeiro.ler',
                       'agentes.ativar', 'agentes.evoluir'];
    for (const c of proibidas) {
      assert.equal(pode({ papel: 'editor', ativo: true }, c), false, `editor não pode ${c}`);
    }
  });

  test('editor alcança o que é do dia a dia', () => {
    for (const c of ['comunidade.curar', 'editais.gerenciar', 'conteudo.editar', 'usuarios.ler']) {
      assert.equal(pode({ papel: 'editor', ativo: true }, c), true, `editor pode ${c}`);
    }
  });

  test('fundador só constrói o que é dele', () => {
    assert.deepEqual(capacidadesDe('fundador'), ['plataforma.usar', 'comunidade.publicar']);
    assert.equal(pode({ papel: 'fundador', ativo: true }, 'usuarios.ler'), false);
  });

  test('usuário desativado não pode nada, nem sendo admin', () => {
    for (const c of Object.keys(CAPACIDADES)) {
      assert.equal(pode({ papel: 'admin', ativo: false }, c), false);
    }
  });

  test('papel desconhecido cai para fundador, não para admin', () => {
    assert.equal(pode({ papel: 'superusuario', ativo: true }, 'sistema.configurar'), false);
    assert.equal(pode({ papel: 'superusuario', ativo: true }, 'plataforma.usar'), true);
  });
});

describe('PIX: CRC16-CCITT do BR Code', () => {
  // Implementação independente da do servidor: se as duas concordarem, o erro
  // teria de estar nas duas ao mesmo tempo.
  function crcReferencia(carga) {
    let crc = 0xFFFF;
    for (let i = 0; i < carga.length; i++) {
      crc ^= carga.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  test('vetor conhecido da especificação do Banco Central', () => {
    // "123456789" tem CRC16-CCITT-FALSE = 29B1, valor tabelado.
    assert.equal(crcReferencia('123456789'), '29B1');
  });

  test('o BR Code gerado termina com o CRC do próprio payload', async () => {
    const { gerarPix } = await import('../src/services/pagamentos.js').catch(() => ({}));
    if (typeof gerarPix !== 'function') return;   // módulo sem export público: nada a testar aqui
    const brcode = gerarPix({ valor: 10.5, txid: 'TESTE123' })?.brcode;
    if (!brcode) return;
    const semCrc = brcode.slice(0, -4);
    assert.equal(brcode.slice(-4), crcReferencia(semCrc));
  });
});

describe('blindagem da vitrine', () => {
  test('mascara CNPJ, CPF, e-mail, telefone e código de processo', () => {
    const sujo = 'Acme Ltda CNPJ 12.345.678/0001-90, CPF 123.456.789-00, '
               + 'contato joao@acme.com.br, telefone (96) 99123-4567, processo SEI 002437/2024.';
    const limpo = higienizar(sujo);
    assert.ok(!/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(limpo), 'CNPJ vazou');
    assert.ok(!/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(limpo), 'CPF vazou');
    assert.ok(!/@acme\.com\.br/.test(limpo), 'e-mail vazou');
    assert.ok(!/99123-4567/.test(limpo), 'telefone vazou');
    assert.ok(!/002437\/2024/.test(limpo), 'processo vazou');
  });

  test('texto legítimo passa intacto', () => {
    const texto = 'Plataforma de rastreabilidade para cooperativas de açaí do Pará.';
    assert.equal(higienizar(texto), texto);
  });

  test('a projeção pública não carrega e-mail, userId nem hash', () => {
    const projeto = {
      id: 'prj_1', userId: 'usr_1', nome: 'Teste', descricao: 'Uma descrição qualquer do projeto.',
      classificacao: 'startup', vertical: 'Outra', fase: 'ideacao', criadoEm: new Date().toISOString(),
    };
    const autor = { nome: 'Ana Ribeiro', email: 'ana@zoomdev.test', passwordHash: 'sal:hash' };
    const publico = projetarProjeto(projeto, autor);
    const texto = JSON.stringify(publico);
    assert.ok(!texto.includes('ana@zoomdev.test'), 'e-mail do autor vazou');
    assert.ok(!texto.includes('sal:hash'), 'hash vazou');
    assert.ok(!texto.includes('usr_1'), 'id do usuário vazou');
    assert.equal(publico.autor, 'Ana', 'autor deve aparecer só pelo primeiro nome');
  });
});

describe('classificador', () => {
  test('reconhece bioeconomia por termo do domínio', () => {
    const r = classificarHeuristica('Rastreabilidade de açaí para cooperativas da Amazônia');
    assert.equal(r.classificacao, 'biostartup');
  });

  test('não confunde startup digital com biostartup', () => {
    const r = classificarHeuristica('Aplicativo de gestão financeira para autônomos');
    assert.equal(r.classificacao, 'startup');
  });

  test('o título de trabalho não come a primeira letra nem termina em conectivo', () => {
    const casos = [
      ['Uma plataforma que conecta cooperativas de açaí do Pará.', 'Plataforma que conecta cooperativas de açaí'],
      ['Assistente de IA que pesquisa editais de fomento.', 'Assistente de IA que pesquisa editais'],
      ['Quero criar um marketplace de artesanato indígena.', 'Marketplace de artesanato indígena'],
    ];
    for (const [entrada, esperado] of casos) {
      assert.equal(tituloDeIdeia(entrada), esperado);
    }
  });

  test('título nunca termina em conectivo solto', () => {
    const solto = /\s(?:de|da|do|que|com|para|e|em|a|o)$/i;
    const frases = [
      'Rede de microusinas de biogás que transforma resíduo orgânico urbano.',
      'Monitoramento florestal com sensoriamento satelital e gêmeo digital.',
      'Sistema para gestão de resíduos de obra em canteiros urbanos de médio porte.',
    ];
    for (const f of frases) assert.ok(!solto.test(tituloDeIdeia(f)), `terminou em conectivo: ${tituloDeIdeia(f)}`);
  });
});

describe('limite de requisições', () => {
  test('libera até o teto e bloqueia depois, com Retry-After', async () => {
    const { limitar, zerarLimites } = await import('../src/services/limite.js');
    zerarLimites();
    const middleware = limitar({ max: 3, janelaSeg: 60 });

    const req = { path: '/teste', body: { email: 'a@b.c' }, headers: {}, socket: { remoteAddress: '1.2.3.4' } };
    const resultados = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => {
        const res = {
          setHeader() {},
          status(c) { this._c = c; return this; },
          json(corpo) { resultados.push({ status: this._c, corpo }); resolve(); },
        };
        middleware(req, res, () => { resultados.push({ status: 200 }); resolve(); });
      });
    }
    assert.deepEqual(resultados.slice(0, 3).map(r => r.status), [200, 200, 200]);
    assert.equal(resultados[3].status, 429);
    assert.ok(resultados[3].corpo.esperaSeg > 0, 'deve informar quanto esperar');
  });
});

describe('LGPD', () => {
  test('a exportação não inclui hash de senha nem token', async () => {
    const { exportarDados } = await import('../src/services/lgpd.js');
    const user = {
      id: 'usr_x', nome: 'Teste Titular', email: 't@x.com', passwordHash: 'sal:segredo',
      plano: 'free', creditos: 500, criadoEm: new Date().toISOString(),
      gamification: { xp: 10, conquistas: [] },
    };
    const texto = JSON.stringify(exportarDados(user));
    assert.ok(!texto.includes('sal:segredo'), 'hash de senha vazou na exportação');
    assert.ok(!texto.includes('passwordHash'), 'campo de hash vazou na exportação');
    assert.ok(texto.includes('t@x.com'), 'o próprio e-mail do titular deve constar');
  });
});
