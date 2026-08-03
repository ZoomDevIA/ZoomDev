// Autenticação simples: e-mail + senha (scrypt) e tokens de sessão em memória persistida.
import crypto from 'node:crypto';
import { store, save, id } from './store.js';
import { config } from './config.js';
import { newUserGamification } from './services/gamification.js';
import { PAPEIS, capacidadesDe, pode as podeCap } from './services/permissoes.js';

function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${h}`;
}

function verify(password, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(candidate, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function hashSenha(senha) { return hash(senha); }
export function conferirSenha(senha, hashArmazenado) { return verify(String(senha || ''), hashArmazenado); }

export function register({ email, password, nome }) {
  email = String(email || '').trim().toLowerCase();
  if (!email.includes('@') || String(password || '').length < 8) {
    throw Object.assign(new Error('E-mail inválido ou senha com menos de 8 caracteres.'), { status: 400 });
  }
  if (Object.values(store.users).some(u => u.email === email)) {
    throw Object.assign(new Error('Já existe uma conta com este e-mail.'), { status: 409 });
  }
  const userId = id('usr');
  store.users[userId] = {
    id: userId,
    email,
    nome: nome || email.split('@')[0],
    passwordHash: hash(password),
    // Sem papel gravado: quem se cadastra sozinho é fundador, salvo a regra de
    // bootstrap (primeiro usuário / ZOOMDEV_ADMIN_EMAIL) resolvida em papelDe().
    papel: null,
    ativo: true,
    plano: 'free',
    creditos: config.credits.initial,
    criadoEm: new Date().toISOString(),
    gamification: newUserGamification(),
  };
  save();
  return createSession(userId);
}

/** Criação por um administrador: papel explícito, sem sessão automática. */
export function criarUsuario({ email, nome, senha, papel }) {
  email = String(email || '').trim().toLowerCase();
  if (!email.includes('@')) throw Object.assign(new Error('E-mail inválido.'), { status: 400 });
  if (String(senha || '').length < 8) throw Object.assign(new Error('A senha precisa de pelo menos 8 caracteres.'), { status: 400 });
  if (!PAPEIS[papel]) throw Object.assign(new Error('Papel inválido.'), { status: 400 });
  if (Object.values(store.users).some(u => u.email === email)) {
    throw Object.assign(new Error('Já existe uma conta com este e-mail.'), { status: 409 });
  }
  consolidarBootstrap();
  const userId = id('usr');
  store.users[userId] = {
    id: userId,
    email,
    nome: nome || email.split('@')[0],
    passwordHash: hash(senha),
    papel,
    ativo: true,
    plano: 'free',
    creditos: config.credits.initial,
    criadoEm: new Date().toISOString(),
    gamification: newUserGamification(),
  };
  save();
  return publicUser(store.users[userId]);
}

export function login({ email, password }) {
  email = String(email || '').trim().toLowerCase();
  const user = Object.values(store.users).find(u => u.email === email);
  if (!user || !verify(String(password || ''), user.passwordHash)) {
    throw Object.assign(new Error('E-mail ou senha inválidos.'), { status: 401 });
  }
  if (user.ativo === false) {
    throw Object.assign(new Error('Esta conta está desativada. Fale com o administrador.'), { status: 403 });
  }
  return createSession(user.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSÕES COM PRAZO
//
// Antes o token não vencia nunca: um que vazasse hoje continuaria entrando
// daqui a um ano, e nem trocar de aparelho ou de emprego encerrava o acesso.
//
// O prazo é DESLIZANTE, não fixo. Quem usa a plataforma toda semana nunca é
// deslogado, porque cada requisição empurra o vencimento para frente. Quem
// sumiu por trinta dias volta pelo login. Prazo fixo curto obrigaria a
// relogar no meio de um plano de negócios sendo escrito, e prazo fixo longo
// não protege de nada.
//
// A renovação só é gravada quando resta menos de um dia da janela: sem isso,
// cada clique reescreveria o banco inteiro.
// ═══════════════════════════════════════════════════════════════════════════

const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;   // 30 dias sem uso encerram
const RENOVA_A_PARTIR_DE = 24 * 60 * 60 * 1000; // grava a renovação uma vez por dia

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const agora = Date.now();
  store.sessions[token] = {
    userId,
    criadoEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + VALIDADE_MS).toISOString(),
  };
  limparSessoesVencidas();
  save();
  return { token, user: publicUser(store.users[userId]) };
}

/** Varre as sessões vencidas. Roda no login e no pulso diário. */
export function limparSessoesVencidas() {
  const agora = Date.now();
  let removidas = 0;
  for (const [tok, s] of Object.entries(store.sessions)) {
    // Sessão anterior a esta mudança não tem prazo: ganha um a partir da
    // criação, em vez de ser invalidada e derrubar todo mundo de uma vez.
    const limite = s.expiraEm
      ? Date.parse(s.expiraEm)
      : Date.parse(s.criadoEm || 0) + VALIDADE_MS;
    if (!Number.isFinite(limite) || limite < agora) { delete store.sessions[tok]; removidas++; }
  }
  return removidas;
}

/** Encerra todas as sessões de um usuário (usado ao desativar ou trocar papel). */
export function encerrarSessoesDe(userId) {
  for (const [tok, s] of Object.entries(store.sessions)) {
    if (s.userId === userId) delete store.sessions[tok];
  }
}

export function publicUser(u) {
  const { passwordHash, ...rest } = u;
  const papel = papelDe(u);
  return {
    ...rest,
    papel,
    papelInfo: PAPEIS[papel],
    capacidades: capacidadesDe(papel),
    isAdmin: papel === 'admin' && u.ativo !== false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Papel efetivo
//
// Instalação nova não tem administrador gravado. Nesse caso vale a regra de
// bootstrap: ZOOMDEV_ADMIN_EMAIL, ou o primeiro usuário registrado. Assim que
// alguém recebe papel 'admin' de verdade, a regra se aposenta, por isso
// consolidarBootstrap() grava o papel antes de qualquer mudança no quadro.
// ═══════════════════════════════════════════════════════════════════════════
function bootstrapAdminId() {
  if (Object.values(store.users).some(u => u.papel === 'admin')) return null;
  if (config.adminEmail) {
    return Object.values(store.users).find(u => u.email === config.adminEmail)?.id || null;
  }
  return Object.values(store.users).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))[0]?.id || null;
}

export function papelDe(user) {
  if (!user) return null;
  if (PAPEIS[user.papel]) return user.papel;
  return bootstrapAdminId() === user.id ? 'admin' : 'fundador';
}

/** Grava o papel de quem é admin só pela regra de bootstrap, antes de mudar o quadro. */
export function consolidarBootstrap() {
  const alvo = bootstrapAdminId();
  if (alvo && store.users[alvo]) {
    store.users[alvo].papel = 'admin';
    store.users[alvo].ativo = store.users[alvo].ativo !== false;
    save();
  }
}

export function isAdmin(user) {
  return Boolean(user) && user.ativo !== false && papelDe(user) === 'admin';
}

export function pode(user, capacidade) {
  return podeCap({ ...user, papel: papelDe(user) }, capacidade);
}

export function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const session = store.sessions[token];
  if (!session || !store.users[session.userId]) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const agora = Date.now();
  const limite = session.expiraEm
    ? Date.parse(session.expiraEm)
    : Date.parse(session.criadoEm || 0) + VALIDADE_MS;

  if (!Number.isFinite(limite) || limite < agora) {
    delete store.sessions[token];
    save();
    return res.status(401).json({ error: 'Sua sessão expirou por inatividade. Entre de novo.', code: 'SESSAO_EXPIRADA' });
  }

  // Renovação deslizante, gravada no máximo uma vez por dia
  if (limite - agora < VALIDADE_MS - RENOVA_A_PARTIR_DE) {
    session.expiraEm = new Date(agora + VALIDADE_MS).toISOString();
    save();
  }

  const user = store.users[session.userId];
  if (user.ativo === false) {
    return res.status(403).json({ error: 'Conta desativada.' });
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

export function adminMiddleware(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador do ecossistema.' });
  }
  next();
}

/** Fábrica de middleware por capacidade: o jeito preferido de proteger rotas. */
export function exigir(capacidade) {
  return (req, res, next) => {
    if (!pode(req.user, capacidade)) {
      return res.status(403).json({
        error: 'Seu nível de acesso não permite esta ação.',
        capacidadeNecessaria: capacidade,
      });
    }
    next();
  };
}
