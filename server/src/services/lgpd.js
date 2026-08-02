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

export const VERSAO_TERMOS = '2026-08-01';

export function exportarDados(user) {
  const projetos = Object.values(store.projects).filter(p => p.userId === user.id);
  const pedidos = Object.values(store.carbonOrders).filter(o => o.userId === user.id);
  const transacoes = Object.values(store.transacoes || {}).filter(t => t.userId === user.id);
  const planos = Object.values(store.planosCompensacao || {}).filter(p => p.userId === user.id);

  return {
    geradoEm: new Date().toISOString(),
    aviso: 'Exportação completa dos dados associados a esta conta, conforme a Lei 13.709/2018 (LGPD), '
         + 'artigo 18. Não inclui segredos do sistema, como o hash da sua senha e os tokens de sessão.',
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
      missoes: p.missoes || [],
      mvp: p.mvp ? { status: p.mvp.status, construidoEm: p.mvp.construidoEm, arquivos: (p.mvp.arquivos || []).map(a => a.arquivo) } : null,
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
      mantidos.push(p.id);
    } else {
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
  user.papel = null;
  encerrarSessoesDe(user.id);
  save();

  return {
    ok: true,
    projetosApagados: apagados.length,
    projetosMantidosAnonimos: mantidos.length,
    anonimizadoEm: user.anonimizadoEm,
  };
}

export function registrarAceiteTermos(user) {
  user.termosAceitos = { versao: VERSAO_TERMOS, em: new Date().toISOString() };
  save();
  return user.termosAceitos;
}
