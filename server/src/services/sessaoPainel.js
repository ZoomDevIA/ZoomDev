// ═══════════════════════════════════════════════════════════════════════════
// SESSÃO ELEVADA DO PAINEL — segunda porta para a área de administração.
//
// Estar logado na plataforma não abre o painel. Para entrar, o administrador
// confirma a senha de novo e recebe um token curto (30 min) que só vale para
// as rotas do painel. Se a aba ficar aberta e alguém sentar na cadeira, a
// janela já expirou.
//
// Três camadas:
//   1. papel de administrador     — quem pode tentar
//   2. reconfirmação de senha     — prova de que é a pessoa
//   3. token com prazo + trilha   — toda ação fica registrada
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { store, save, id } from '../store.js';
import { conferirSenha, pode } from '../auth.js';

/**
 * Quem tem porta no painel: administrador e editor. O fundador constrói na
 * plataforma e não tem o que fazer aqui — a checagem é por capacidade, não
 * por papel, para que um papel novo não precise mexer nesta função.
 */
export function podeAbrirPainel(user) {
  return pode(user, 'usuarios.ler') || pode(user, 'comunidade.curar');
}

const DURACAO_MS = 30 * 60 * 1000;   // 30 minutos de janela
const MAX_TENTATIVAS = 5;            // por usuário
const JANELA_BLOQUEIO_MS = 10 * 60 * 1000;

const tentativas = new Map();        // userId → { erros, ate }

function limparExpiradas() {
  const agora = Date.now();
  for (const [tok, s] of Object.entries(store.sessoesPainel)) {
    if (new Date(s.expiraEm).getTime() < agora) delete store.sessoesPainel[tok];
  }
}

/** Trilha de auditoria: quem fez o quê, quando e de onde. Mantém as 500 últimas. */
export function registrarAuditoria({ ator, acao, alvo = null, detalhe = null, ip = null }) {
  const registro = {
    id: id('aud'),
    em: new Date().toISOString(),
    atorId: ator?.id || null,
    atorNome: ator?.nome || 'sistema',
    atorEmail: ator?.email || null,
    acao,
    alvo,
    detalhe,
    ip,
  };
  store.auditoria.unshift(registro);
  if (store.auditoria.length > 500) store.auditoria.length = 500;
  save();
  return registro;
}

export function listarAuditoria(limite = 100) {
  return store.auditoria.slice(0, Math.min(Number(limite) || 100, 500));
}

function ipDe(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || null;
}

export function elevar(req) {
  const user = req.user;
  const senha = String(req.body?.senha || '');

  if (!podeAbrirPainel(user)) {
    registrarAuditoria({ ator: user, acao: 'painel.acesso_negado', detalhe: 'papel sem permissão', ip: ipDe(req) });
    throw Object.assign(new Error('Esta área é restrita à administração.'), { status: 403 });
  }

  const bloqueio = tentativas.get(user.id);
  if (bloqueio?.ate && bloqueio.ate > Date.now()) {
    const faltam = Math.ceil((bloqueio.ate - Date.now()) / 60000);
    throw Object.assign(new Error(`Muitas tentativas. Tente de novo em ${faltam} min.`), { status: 429 });
  }

  if (!conferirSenha(senha, user.passwordHash)) {
    const atual = bloqueio && bloqueio.ate > Date.now() - JANELA_BLOQUEIO_MS ? bloqueio : { erros: 0 };
    atual.erros += 1;
    if (atual.erros >= MAX_TENTATIVAS) atual.ate = Date.now() + JANELA_BLOQUEIO_MS;
    tentativas.set(user.id, atual);
    registrarAuditoria({ ator: user, acao: 'painel.senha_incorreta', detalhe: `tentativa ${atual.erros}`, ip: ipDe(req) });
    throw Object.assign(new Error('Senha incorreta.'), { status: 401 });
  }

  tentativas.delete(user.id);
  limparExpiradas();

  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + DURACAO_MS).toISOString();
  store.sessoesPainel[token] = { userId: user.id, criadoEm: new Date().toISOString(), expiraEm, ip: ipDe(req) };
  save();
  registrarAuditoria({ ator: user, acao: 'painel.entrada', detalhe: 'sessão elevada aberta', ip: ipDe(req) });
  return { token, expiraEm, duracaoMinutos: DURACAO_MS / 60000 };
}

export function encerrar(req) {
  const token = req.headers['x-zd-painel'];
  if (token && store.sessoesPainel[token]) {
    delete store.sessoesPainel[token];
    save();
    registrarAuditoria({ ator: req.user, acao: 'painel.saida', ip: ipDe(req) });
  }
  return { ok: true };
}

export function estadoSessao(req) {
  const token = req.headers['x-zd-painel'];
  const s = token ? store.sessoesPainel[token] : null;
  const valida = Boolean(s && s.userId === req.user.id && new Date(s.expiraEm).getTime() > Date.now());
  return {
    elevado: valida,
    expiraEm: valida ? s.expiraEm : null,
    podeEntrar: podeAbrirPainel(req.user),
  };
}

/** Middleware das rotas do painel. Exige o token elevado, não só o login. */
export function exigirElevacao(req, res, next) {
  const token = req.headers['x-zd-painel'];
  const s = token ? store.sessoesPainel[token] : null;
  if (!s || s.userId !== req.user.id) {
    return res.status(401).json({ error: 'Confirme sua senha para abrir o painel.', code: 'PAINEL_NAO_ELEVADO' });
  }
  if (new Date(s.expiraEm).getTime() <= Date.now()) {
    delete store.sessoesPainel[token];
    save();
    return res.status(401).json({ error: 'Sua sessão do painel expirou. Confirme a senha novamente.', code: 'PAINEL_EXPIRADO' });
  }
  req.painel = s;
  req.auditar = (acao, extra = {}) => registrarAuditoria({ ator: req.user, acao, ip: ipDe(req), ...extra });
  next();
}
