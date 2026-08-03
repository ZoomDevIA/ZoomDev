// ═══════════════════════════════════════════════════════════════════════════
// LGPD — os dois direitos que a plataforma precisa entregar sem intermediário:
// levar seus dados embora e sumir da base.
//
// EXPORTAR devolve tudo o que existe sobre a pessoa em JSON legível, com os
// projetos, o carbono, os pagamentos e o histórico de conversa. Sem hash de
// senha, sem token de sessão: isso é segredo do sistema, não dado do titular.
//
// EXCLUIR é anonimização, não DELETE. O motivo é concreto: apagar a linha do
// usuário quebraria os projetos publicados na vitrine, as transações que
// precisam de rastro fiscal e a trilha de auditoria que registra quem fez o
// quê. Então o vínculo com a pessoa é cortado (nome, e-mail e senha somem, os
// projetos privados vão junto) e o que sobrevive já não identifica ninguém.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { store, save } from '../store.js';
import { encerrarSessoesDe, papelDe } from '../auth.js';
import { lerConteudo, gravarConteudo, apagarConteudo } from './conteudo.js';

export const VERSAO_TERMOS = '2026-08-03';

// ═══════════════════════════════════════════════════════════════════════════
// RETENÇÃO DE ANEXOS
//
// O Studio guarda o TEXTO extraído do que a pessoa anexa: o edital em PDF, o
// plano antigo em DOCX, a transcrição da reunião com o sócio. O arquivo
// original nunca é gravado, mas o texto fica, e ele é o insumo dos agentes.
//
// Guardar isso para sempre seria acumular dado de terceiro (quem falou na
// reunião, quem assinou o documento) sem finalidade que justifique o prazo.
// A LGPD pede que o dado dure o tempo da finalidade, e a finalidade aqui é
// alimentar a geração do plano e as conversas do projeto.
//
// Seis meses cobrem com folga um ciclo de ideação até MVP. Depois disso o
// texto sai e fica só o registro de que existiu, para a pessoa entender o que
// aconteceu em vez de achar que o anexo sumiu sozinho.
// ═══════════════════════════════════════════════════════════════════════════
export const RETENCAO_ANEXOS_DIAS = 180;

export function expurgarAnexosVencidos() {
  const limite = Date.now() - RETENCAO_ANEXOS_DIAS * 24 * 60 * 60 * 1000;
  let expurgados = 0;

  for (const p of Object.values(store.projects)) {
    const anexos = lerConteudo(p.id).anexos;
    if (!anexos?.length) continue;

    let mexeu = false;
    const novos = anexos.map((a) => {
      if (a.expurgadoEm || !a.em || Date.parse(a.em) > limite) return a;
      expurgados++; mexeu = true;
      return {
        nome: a.nome, tipo: a.tipo, em: a.em,
        expurgadoEm: new Date().toISOString(),
        texto: '',
        nota: `Conteúdo removido após ${RETENCAO_ANEXOS_DIAS} dias, conforme a política de retenção.`,
      };
    });
    if (mexeu) gravarConteudo(p.id, { anexos: novos });
  }

  if (expurgados) save();
  return expurgados;
}

export function exportarDados(user) {
  // O conteúdo pesado mora fora do índice desde a separação do banco: a
  // exportação precisa buscá-lo, senão entregaria a ficha sem o documento.
  const projetos = Object.values(store.projects)
    .filter(p => p.userId === user.id)
    .map(p => ({ ...p, ...lerConteudo(p.id) }));
  const pedidos = Object.values(store.carbonOrders).filter(o => o.userId === user.id);
  const transacoes = Object.values(store.transacoes || {}).filter(t => t.userId === user.id);
  const planos = Object.values(store.planosCompensacao || {}).filter(p => p.userId === user.id);

  return {
    geradoEm: new Date().toISOString(),
    aviso: 'Exportação completa dos dados associados a esta conta, conforme a Lei 13.709/2018 (LGPD), '
         + 'artigo 18. Não inclui segredos do sistema, como o hash da sua senha e os tokens de sessão.',
    politicaDeRetencao: {
      anexos: `O texto extraído dos arquivos anexados é removido após ${RETENCAO_ANEXOS_DIAS} dias. `
            + 'O arquivo original nunca é gravado: ele é lido em memória e descartado.',
      sessoes: 'Uma sessão sem uso por 30 dias é encerrada e apagada.',
      localizacao: 'Guardada com uma casa decimal, o suficiente para a região e insuficiente para o endereço.',
    },
    conta: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: papelDe(user),
      plano: user.plano,
      creditos: user.creditos,
      criadoEm: user.criadoEm,
      ultimoAcesso: user.ultimoAcesso || null,
      termosAceitos: user.termosAceitos || null,
      // Território informado no Studio, com o consentimento e a data
      localizacao: user.local || null,
    },
    gamificacao: user.gamification || null,
    projetos: projetos.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      classificacao: p.classificacao,
      vertical: p.vertical,
      fase: p.fase,
      modulos: p.modulos || null,
      publicado: Boolean(p.publicado),
      criadoEm: p.criadoEm,
      plano: p.plano || null,
      // O documento do ZoomDoc é o texto que a pessoa escreveu, e por isso o
      // dado mais pessoal do projeto inteiro. Ficar de fora da exportação
      // seria entregar o índice e reter o livro.
      documento: p.documento || null,
      documentoEm: p.documentoEm || null,
      planoZoomDev: p.planoZoomDev || null,
      metricas: p.metricas || null,
      // Conversa do console: o que a pessoa pediu e o que os agentes responderam
      trilha: p.trilha || [],
      // Texto extraído do que ela anexou, com a data e o expurgo quando houve
      anexos: (p.anexos || []).map(a => ({
        nome: a.nome, tipo: a.tipo, em: a.em || null,
        texto: a.texto || '',
        expurgadoEm: a.expurgadoEm || null,
      })),
      missoes: p.missoes || [],
      mvp: p.mvp
        ? {
          status: p.mvp.status,
          construidoEm: p.mvp.construidoEm,
          // O código gerado é entregue por inteiro: é trabalho da pessoa
          arquivos: (p.mvpArquivos || []).map(a => ({ arquivo: a.arquivo, conteudo: a.conteudo })),
          design: p.mvp.design || null,
        }
        : null,
    })),
    carbono: { pedidos, planosCompensacao: planos },
    pagamentos: transacoes.map(t => ({
      id: t.id, tipo: t.tipo, situacao: t.situacao, valor: t.valor, criadoEm: t.criadoEm,
    })),
    conversas: {
      copiloto: user.chatLog || [],
      sextaFeira: user.sextaFeiraChat || [],
    },
  };
}

/**
 * Anonimiza a conta e apaga o que é só dela. Devolve o resumo do que foi feito,
 * para que a resposta ao titular seja específica em vez de um "ok" genérico.
 */
export function excluirConta(user, { removerPublicados = false } = {}) {
  const projetos = Object.values(store.projects).filter(p => p.userId === user.id);
  const apagados = [];
  const mantidos = [];

  for (const p of projetos) {
    if (p.publicado && !removerPublicados) {
      // O projeto continua na vitrine, mas sem vínculo com a pessoa.
      p.userId = null;
      p.autorAnonimo = true;
      p.curtidas = [];
      // Só o que a vitrine mostra sobrevive. O documento que a pessoa
      // escreveu, a conversa com os agentes e o texto do que ela anexou não
      // são conteúdo público: seguem a pessoa, e a pessoa está saindo.
      apagarConteudo(p.id);
      delete p.temDocumento;
      delete p.anexosCount;
      delete p.metricas;
      mantidos.push(p.id);
    } else {
      apagarConteudo(p.id);
      delete store.projects[p.id];
      apagados.push(p.id);
    }
  }

  // Pedidos de carbono e planos de compensação são só da pessoa.
  for (const [id, o] of Object.entries(store.carbonOrders)) {
    if (o.userId === user.id) delete store.carbonOrders[id];
  }
  for (const [id, pl] of Object.entries(store.planosCompensacao || {})) {
    if (pl.userId === user.id) delete store.planosCompensacao[id];
  }
  // Transações ficam, sem identificação: rastro financeiro tem prazo próprio.
  for (const t of Object.values(store.transacoes || {})) {
    if (t.userId === user.id) { t.userId = null; t.anonimizado = true; }
  }
  delete store.nudges[user.id];

  // A conta vira um registro sem pessoa dentro.
  const selo = crypto.randomBytes(6).toString('hex');
  user.nome = 'Conta removida';
  user.email = `removido-${selo}@excluido.local`;
  user.passwordHash = crypto.randomBytes(32).toString('hex');
  user.ativo = false;
  user.anonimizadoEm = new Date().toISOString();
  user.chatLog = [];
  user.sextaFeiraChat = [];
  // Território informado no Studio: some junto. É dado de localização, o tipo
  // que menos justifica sobreviver a um pedido de exclusão.
  delete user.local;
  user.papel = null;
  encerrarSessoesDe(user.id);
  save();

  return {
    ok: true,
    projetosApagados: apagados.length,
    projetosMantidosAnonimos: mantidos.length,
    anonimizadoEm: user.anonimizadoEm,
    removidos: [
      'nome, e-mail e senha',
      'localização informada',
      'documentos do ZoomDoc e conversas com os agentes',
      'texto dos arquivos anexados',
      'histórico de conversa com o copiloto',
      'sessões ativas em todos os aparelhos',
    ],
    mantidoSemIdentificacao: [
      'projetos publicados na vitrine, sem vínculo com você',
      'transações financeiras, por obrigação fiscal',
    ],
  };
}

export function registrarAceiteTermos(user) {
  user.termosAceitos = { versao: VERSAO_TERMOS, em: new Date().toISOString() };
  save();
  return user.termosAceitos;
}
