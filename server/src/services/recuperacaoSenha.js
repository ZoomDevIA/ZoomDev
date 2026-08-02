// ═══════════════════════════════════════════════════════════════════════════
// RECUPERAÇÃO DE SENHA — o caminho de volta para quem esqueceu.
//
// Regras de segurança que valem a pena declarar, porque cada uma fecha um
// buraco concreto:
//
// · A rota de pedido responde SEMPRE igual, exista ou não a conta. Resposta
//   diferente por e-mail conhecido é um oráculo de enumeração de usuários.
// · O token vai por e-mail em texto claro, mas no banco fica só o hash. Se o
//   db.json vazar, os tokens em trânsito não viram acesso.
// · Uso único e prazo de 30 minutos. Usado ou vencido, é apagado.
// · Redefinir encerra todas as sessões da pessoa: se alguém entrou com a
//   senha antiga, cai fora no mesmo instante.
// · Limite de três pedidos por hora por conta, para o e-mail não virar arma.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { store, save } from '../store.js';
import { hashSenha, encerrarSessoesDe } from '../auth.js';
import { enviar, modeloRecuperacao, modeloSenhaAlterada, modoEmail } from './email.js';

const VALIDADE_MIN = 30;
const MAX_PEDIDOS_HORA = 3;

function digerir(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function limparVencidos() {
  const agora = Date.now();
  for (const [id, r] of Object.entries(store.recuperacoes)) {
    if (new Date(r.expiraEm).getTime() < agora) delete store.recuperacoes[id];
  }
}

function urlBase() {
  return (process.env.ZOOMDEV_URL || 'http://localhost:4000').replace(/\/+$/, '');
}

/**
 * Pede a redefinição. Devolve sempre o mesmo formato, com `link` preenchido
 * apenas quando não há provedor de e-mail E o ambiente não é produção: é o
 * que mantém o desenvolvimento possível sem abrir uma porta em produção.
 */
export async function pedirRedefinicao(email) {
  limparVencidos();
  const alvo = String(email || '').trim().toLowerCase();
  const user = Object.values(store.users).find(u => u.email === alvo);

  const resposta = { ok: true, modoEmail: modoEmail() };
  if (!user || user.ativo === false) return resposta;

  // Freio por conta: três pedidos por hora
  const umaHoraAtras = Date.now() - 3600_000;
  const recentes = Object.values(store.recuperacoes)
    .filter(r => r.userId === user.id && new Date(r.criadoEm).getTime() > umaHoraAtras);
  if (recentes.length >= MAX_PEDIDOS_HORA) return resposta;

  const token = crypto.randomBytes(32).toString('hex');
  const id = digerir(token);
  store.recuperacoes[id] = {
    userId: user.id,
    criadoEm: new Date().toISOString(),
    expiraEm: new Date(Date.now() + VALIDADE_MIN * 60_000).toISOString(),
  };
  save();

  const url = `${urlBase()}/redefinir?token=${token}`;
  const modelo = modeloRecuperacao({ nome: user.nome.split(' ')[0], url, minutos: VALIDADE_MIN });
  const envio = await enviar({ para: user.email, ...modelo });

  // Sem provedor e fora de produção: o link aparece na tela para não travar
  // o desenvolvimento. Em produção isso nunca acontece.
  if (!envio.entregue && process.env.NODE_ENV !== 'production') {
    resposta.link = url;
    resposta.aviso = 'Sem provedor de e-mail configurado. Este link aparece porque o ambiente não é produção.';
  }
  return resposta;
}

export async function redefinir({ token, senha }) {
  limparVencidos();
  if (String(senha || '').length < 8) {
    throw Object.assign(new Error('A nova senha precisa de pelo menos 8 caracteres.'), { status: 400 });
  }
  const id = digerir(String(token || ''));
  const pedido = store.recuperacoes[id];
  if (!pedido) {
    throw Object.assign(new Error('Este link é inválido ou já foi usado. Peça um novo.'), { status: 400 });
  }
  if (new Date(pedido.expiraEm).getTime() < Date.now()) {
    delete store.recuperacoes[id];
    save();
    throw Object.assign(new Error('Este link expirou. Peça um novo.'), { status: 400 });
  }
  const user = store.users[pedido.userId];
  if (!user) {
    delete store.recuperacoes[id];
    save();
    throw Object.assign(new Error('Conta não encontrada.'), { status: 404 });
  }

  user.passwordHash = hashSenha(String(senha));
  delete store.recuperacoes[id];
  encerrarSessoesDe(user.id);
  save();

  const quando = new Date().toLocaleString('pt-BR');
  await enviar({ para: user.email, ...modeloSenhaAlterada({ nome: user.nome.split(' ')[0], quando }) });
  return { ok: true, email: user.email };
}

/** Troca de senha por quem já está autenticado. Exige a senha atual. */
export async function trocarSenha(user, { atual, nova }) {
  const { conferirSenha } = await import('../auth.js');
  if (!conferirSenha(atual, user.passwordHash)) {
    throw Object.assign(new Error('A senha atual está incorreta.'), { status: 401 });
  }
  if (String(nova || '').length < 8) {
    throw Object.assign(new Error('A nova senha precisa de pelo menos 8 caracteres.'), { status: 400 });
  }
  if (String(nova) === String(atual)) {
    throw Object.assign(new Error('A nova senha precisa ser diferente da atual.'), { status: 400 });
  }
  user.passwordHash = hashSenha(String(nova));
  encerrarSessoesDe(user.id);
  save();
  await enviar({
    para: user.email,
    ...modeloSenhaAlterada({ nome: user.nome.split(' ')[0], quando: new Date().toLocaleString('pt-BR') }),
  });
  return { ok: true };
}
