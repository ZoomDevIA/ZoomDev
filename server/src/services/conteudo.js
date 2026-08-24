// ═══════════════════════════════════════════════════════════════════════════
// CONTEÚDO PESADO FORA DO ÍNDICE
//
// O banco é um arquivo JSON só, reescrito POR INTEIRO a cada gravação. Com
// duzentos quilobytes isso é irrelevante. O problema é o que passou a morar
// dentro dele:
//
//   documento      o HTML do plano no ZoomDoc, de 25 a 40 KB por projeto
//   mvp.arquivos   o código gerado, perto de 50 KB por projeto
//   planoZoomDev   a estrutura das dezessete seções
//   anexos         o texto extraído do que a pessoa enviou, até 40 KB cada
//   trilha         a conversa com os agentes
//
// Somando, um projeto ativo carrega perto de 150 KB. Mil projetos põem o banco
// em 150 MB, e cada salvamento automático do editor, que acontece um segundo
// depois de cada tecla, reescreveria os 150 MB inteiros para trocar uma frase.
//
// A correção separa ÍNDICE de CONTEÚDO. O índice continua no db.json e fica
// pequeno: nome, fase, missões, métricas, tudo que as listas precisam. O
// conteúdo de cada projeto vai para um arquivo próprio, gravado só quando
// aquele projeto muda.
//
// O cache em memória existe porque o Studio lê o documento em quase toda
// requisição. Ele não tem invalidação por tempo de propósito: este processo é
// o único que escreve nesses arquivos, então o cache nunca fica velho.
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { store, save } from '../store.js';

/**
 * Os campos que saem do índice. `mvpArquivos` é achatado de propósito: guardar
 * `mvp` inteiro levaria também o status e a data, que as listas precisam ler
 * sem tocar no disco.
 */
export const CAMPOS_PESADOS = ['documento', 'planoZoomDev', 'trilha', 'anexos', 'mvpArquivos'];

const cache = new Map();

function pasta() {
  const dir = path.join(config.dataDir, 'conteudo');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const arquivoDe = (projetoId) => path.join(pasta(), `${sanear(projetoId)}.json`);

// O id vem da URL em algumas rotas, e daqui vira nome de arquivo. Sem esta
// trava, `../../etc/passwd` viraria caminho válido.
//
// A regra RECUSA em vez de limpar. Limpar transformaria `../../etc/passwd` em
// `etcpasswd`, um projeto que não existe, e a leitura devolveria vazio como se
// estivesse tudo bem: o ataque falharia em silêncio e um bug de verdade
// também. Recusar faz os dois aparecerem.
const ID_VALIDO = /^[A-Za-z0-9_-]+$/;

function sanear(id) {
  const bruto = String(id ?? '');
  if (!ID_VALIDO.test(bruto)) {
    throw Object.assign(new Error('Identificador de projeto inválido.'), { status: 400 });
  }
  return bruto;
}

/** Devolve o conteúdo do projeto. Nunca devolve nulo: ausência é objeto vazio. */
export function lerConteudo(projetoId) {
  const chave = sanear(projetoId);
  if (cache.has(chave)) return cache.get(chave);

  let dados = {};
  try {
    const arquivo = arquivoDe(chave);
    if (fs.existsSync(arquivo)) dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    // Conteúdo corrompido não pode derrubar o projeto inteiro: o índice
    // continua de pé e a pessoa vê o projeto sem o documento, em vez de erro.
    console.error(`conteudo: falha ao ler ${projetoId}: ${e.message}`);
  }
  cache.set(chave, dados);
  return dados;
}

/**
 * Grava só os campos passados, mantendo os outros. A escrita é atômica: em
 * arquivo temporário e depois renomeada, para que uma queda no meio não deixe
 * um documento pela metade no lugar do que estava certo.
 */
export function gravarConteudo(projetoId, alteracoes) {
  const chave = sanear(projetoId);
  const atual = lerConteudo(chave);
  const novo = { ...atual };

  for (const [campo, valor] of Object.entries(alteracoes)) {
    if (valor === undefined) delete novo[campo];
    else novo[campo] = valor;
  }

  cache.set(chave, novo);

  const destino = arquivoDe(chave);
  const temporario = `${destino}.tmp`;
  try {
    fs.writeFileSync(temporario, JSON.stringify(novo));
    fs.renameSync(temporario, destino);
  } catch (e) {
    try { fs.unlinkSync(temporario); } catch { /* nada a limpar */ }
    throw e;
  }

  // O índice guarda só as marcas que as listas precisam, sem abrir o arquivo.
  const proj = store.projects[chave];
  if (proj) {
    proj.temDocumento = Boolean(novo.documento);
    proj.anexosCount = (novo.anexos || []).length;
  }

  return novo;
}

export function apagarConteudo(projetoId) {
  const chave = sanear(projetoId);
  cache.delete(chave);
  try { fs.unlinkSync(arquivoDe(chave)); } catch { /* já não existia */ }
}

/**
 * Projeto do índice somado ao conteúdo, pronto para ir ao cliente.
 *
 * Devolve objeto NOVO, sem escrever nada de volta no índice: se o conteúdo
 * fosse colado no objeto guardado em memória, o próximo save() o levaria de
 * volta para dentro do db.json e desfaria toda esta separação em silêncio.
 */
export function hidratar(proj) {
  if (!proj) return proj;
  const c = lerConteudo(proj.id);
  const { mvpArquivos, ...resto } = c;
  return {
    ...proj,
    ...resto,
    mvp: proj.mvp ? { ...proj.mvp, arquivos: mvpArquivos || [] } : proj.mvp,
  };
}

/** Os arquivos do MVP, sem carregar o resto do conteúdo para a resposta. */
export function arquivosMvp(projetoId) {
  return lerConteudo(projetoId).mvpArquivos || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRAÇÃO
//
// Roda uma vez, na subida. Projetos gravados antes desta mudança têm os campos
// pesados dentro do db.json; a migração os move para fora e enxuga o índice.
//
// Idempotente: projeto já migrado não tem os campos, então não entra na conta.
// ═══════════════════════════════════════════════════════════════════════════
export function migrarConteudo() {
  let migrados = 0;
  let bytesMovidos = 0;

  for (const proj of Object.values(store.projects)) {
    const pesados = {};

    for (const campo of ['documento', 'planoZoomDev', 'trilha', 'anexos']) {
      if (proj[campo] !== undefined) {
        pesados[campo] = proj[campo];
        delete proj[campo];
      }
    }
    if (proj.mvp?.arquivos) {
      pesados.mvpArquivos = proj.mvp.arquivos;
      delete proj.mvp.arquivos;
    }

    if (!Object.keys(pesados).length) continue;

    bytesMovidos += Buffer.byteLength(JSON.stringify(pesados), 'utf8');
    // Mescla em vez de sobrescrever: se um projeto tiver conteúdo dos dois
    // lados, por causa de uma migração interrompida, nada se perde.
    gravarConteudo(proj.id, pesados);
    migrados++;
  }

  if (migrados) {
    save();
    console.log(`conteúdo: ${migrados} projeto(s) migrado(s), ${(bytesMovidos / 1024).toFixed(0)} KB fora do índice`);
  }
  return { migrados, bytesMovidos };
}

/** Só para os testes: esquece o que está em memória. */
export function limparCache() {
  cache.clear();
}
