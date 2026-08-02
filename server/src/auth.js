// Autenticação simples: e-mail + senha (scrypt) e tokens de sessão em memória persistida.
import crypto from 'node:crypto';
import { store, save, id } from './store.js';
import { config } from './config.js';
import { newUserGamification } from './services/gamification.js';

function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${h}`;
}

function verify(password, stored) {
  const [salt, h] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(candidate, 'hex'));
}

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
    plano: 'free',
    creditos: config.credits.initial,
    criadoEm: new Date().toISOString(),
    gamification: newUserGamification(),
  };
  save();
  return createSession(userId);
}

export function login({ email, password }) {
  email = String(email || '').trim().toLowerCase();
  const user = Object.values(store.users).find(u => u.email === email);
  if (!user || !verify(String(password || ''), user.passwordHash)) {
    throw Object.assign(new Error('E-mail ou senha inválidos.'), { status: 401 });
  }
  return createSession(user.id);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  store.sessions[token] = { userId, criadoEm: new Date().toISOString() };
  save();
  return { token, user: publicUser(store.users[userId]) };
}

export function publicUser(u) {
  const { passwordHash, ...rest } = u;
  return { ...rest, isAdmin: isAdmin(u) };
}

// Admin do ecossistema: e-mail definido em ZOOMDEV_ADMIN_EMAIL ou, sem env, o primeiro usuário registrado
export function isAdmin(user) {
  if (!user) return false;
  if (config.adminEmail) return user.email === config.adminEmail;
  const primeiro = Object.values(store.users).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))[0];
  return primeiro?.id === user.id;
}

export function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const session = store.sessions[token];
  if (!session || !store.users[session.userId]) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  req.user = store.users[session.userId];
  next();
}

export function adminMiddleware(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador do ecossistema.' });
  }
  next();
}
