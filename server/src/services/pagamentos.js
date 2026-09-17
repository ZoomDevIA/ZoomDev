// ═══════════════════════════════════════════════════════════════════════════
// PAGAMENTOS: Stripe (assinaturas) e PIX (avulso)
//
// Integração real: com as chaves configuradas, cobra de verdade.
// Sem chaves, roda em modo simulado com o MESMO fluxo e os mesmos estados:
// o que muda é só quem processa. Nada de código morto esperando produção.
//
// PIX: payload EMV gerado conforme o padrão do Banco Central (BR Code), com
// CRC16-CCITT calculado. O código copia-e-cola funciona em qualquer banco.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { store, save, id } from '../store.js';
import { config } from '../config.js';
import { movimentarSeiva } from './seiva.js';

export const pagamentosConfig = {
  stripeAtivo: Boolean(process.env.STRIPE_SECRET_KEY),
  pixAtivo: Boolean(process.env.PIX_CHAVE),
  pixChave: process.env.PIX_CHAVE || 'contato@zoomdev.com.br',
  pixNome: (process.env.PIX_NOME || 'ZOOMDEV OS').slice(0, 25),
  pixCidade: (process.env.PIX_CIDADE || 'BELEM').slice(0, 15),
  urlBase: process.env.ZOOMDEV_URL || 'http://localhost:5173',
  // Feiras e apresentações: com isto ligado, o próprio usuário confirma a
  // transação simulada e vê o fluxo completo. Desligado (o padrão), só o
  // administrador confirma o que ninguém pagou.
  demoLiberado: process.env.ZOOMDEV_PAGAMENTO_DEMO === '1',
};

const PRECO_STRIPE = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
};
const EVENTOS_STRIPE_MAX = 5_000;

let stripeClient = null;
async function stripe() {
  if (!pagamentosConfig.stripeAtivo) return null;
  if (!stripeClient) {
    const { default: Stripe } = await import('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

const dataStripe = (segundos) => segundos ? new Date(Number(segundos) * 1000).toISOString() : null;

function planoPorPrecoStripe(priceId) {
  return Object.entries(PRECO_STRIPE).find(([, idPreco]) => idPreco === priceId)?.[0] || null;
}

function encontrarUsuarioStripe({ customerId, subscriptionId, userId } = {}) {
  if (userId && store.users[userId]) return store.users[userId];
  return Object.values(store.users).find(user =>
    (customerId && user.assinatura?.stripeCustomerId === customerId)
    || (subscriptionId && user.assinatura?.stripeSubscriptionId === subscriptionId),
  ) || null;
}

function atualizarAssinaturaStripe(user, subscription, extras = {}) {
  if (!user || !subscription) return null;
  const planoId = subscription.metadata?.planoId
    || planoPorPrecoStripe(subscription.items?.data?.[0]?.price?.id)
    || extras.planoId
    || user.assinatura?.plano
    || user.plano;
  user.assinatura = {
    ...(user.assinatura || {}),
    plano: planoId,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    cancelarNoFimDoPeriodo: Boolean(subscription.cancel_at_period_end),
    fimDoPeriodo: dataStripe(subscription.current_period_end),
    atualizadaEm: new Date().toISOString(),
    ...extras,
  };
  if (['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status) && planoId) user.plano = planoId;
  return user.assinatura;
}

function registrarEventoStripe(evento) {
  if (!evento?.id) return false;
  if (!store.stripeEventos || typeof store.stripeEventos !== 'object') store.stripeEventos = {};
  if (store.stripeEventos[evento.id]) return true;
  store.stripeEventos[evento.id] = { tipo: evento.type, em: new Date().toISOString() };
  const ids = Object.keys(store.stripeEventos);
  if (ids.length > EVENTOS_STRIPE_MAX) {
    ids.sort((a, b) => store.stripeEventos[a].em.localeCompare(store.stripeEventos[b].em))
      .slice(0, ids.length - EVENTOS_STRIPE_MAX)
      .forEach(idEvento => delete store.stripeEventos[idEvento]);
  }
  return false;
}

// ── PIX: BR Code (EMV) ────────────────────────────────────────────────────

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF): exigido pelo BR Code. */
function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Campo EMV: ID + tamanho (2 dígitos) + valor. */
const emv = (idCampo, valor) => `${idCampo}${String(valor.length).padStart(2, '0')}${valor}`;

/** Remove acentos e caracteres fora do padrão aceito pelo BR Code. */
const limpar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase();

/**
 * Gera o payload PIX copia-e-cola (BR Code estático com valor).
 * @param {number} valor   em reais
 * @param {string} txid    identificador da transação (máx. 25 chars)
 */
export function gerarPixPayload(valor, txid) {
  const chave = pagamentosConfig.pixChave;
  const merchant = emv('00', 'BR.GOV.BCB.PIX') + emv('01', chave);
  const txidLimpo = String(txid).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  let payload =
    emv('00', '01') +                                    // payload format indicator
    emv('26', merchant) +                                // merchant account information
    emv('52', '0000') +                                  // merchant category code
    emv('53', '986') +                                   // moeda: BRL
    emv('54', valor.toFixed(2)) +                        // valor
    emv('58', 'BR') +                                    // país
    emv('59', limpar(pagamentosConfig.pixNome).slice(0, 25)) +
    emv('60', limpar(pagamentosConfig.pixCidade).slice(0, 15)) +
    emv('62', emv('05', txidLimpo));                     // additional data: txid

  payload += '6304';                                     // CRC placeholder
  return payload + crc16(payload);
}

/** QR Code do PIX em data URI (SVG), sem dependência externa no cliente. */
export async function gerarPixQr(payload) {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: { dark: '#04140b', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}

// ── Estado das transações ─────────────────────────────────────────────────
export function transacoes() {
  if (!store.transacoes) store.transacoes = {};
  return store.transacoes;
}

function registrar(t) {
  transacoes()[t.id] = t;
  save();
  return t;
}

export const transacoesDoUsuario = (userId) =>
  Object.values(transacoes())
    .filter(t => t.userId === userId)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

// ── Assinatura de plano (Stripe Checkout) ─────────────────────────────────

/**
 * Cria a sessão de checkout do plano. Com Stripe configurado, devolve a URL
 * real; sem, devolve uma URL interna que simula o retorno do gateway.
 */
export async function criarCheckoutPlano(user, planoId) {
  const plano = config.plans.find(p => p.id === planoId);
  if (user.plano !== 'free' && user.assinatura && (
    user.assinatura.stripeSubscriptionId
    || user.assinatura.transacaoId
    || ['active', 'trialing', 'past_due', 'unpaid'].includes(user.assinatura.status)
  )) {
    throw Object.assign(new Error('Você já possui uma assinatura. Use “Gerenciar assinatura” para trocar ou cancelar seu plano.'), { status: 409 });
  }
  if (!plano) throw Object.assign(new Error('Plano não encontrado.'), { status: 404 });
  if (plano.preco <= 0) throw Object.assign(new Error('O plano Free não exige pagamento.'), { status: 400 });

  const txId = id('txn');
  const base = {
    id: txId, userId: user.id, tipo: 'assinatura', planoId,
    descricao: `Assinatura ${plano.nome}`,
    valor: plano.preco, moeda: 'BRL',
    creditos: plano.creditos,
    status: 'pendente', metodo: 'stripe',
    criadoEm: new Date().toISOString(),
  };

  const s = await stripe();
  if (!s) {
    // Simulado: mesmo fluxo, mesmos estados, confirmação manual
    return registrar({ ...base, simulado: true, url: `${pagamentosConfig.urlBase}/planos?checkout=${txId}` });
  }

  const priceId = PRECO_STRIPE[planoId];
  const sessao = await s.checkout.sessions.create({
    mode: 'subscription',
    ...(user.assinatura?.stripeCustomerId
      ? { customer: user.assinatura.stripeCustomerId }
      : { customer_email: user.email }),
    client_reference_id: txId,
    line_items: [priceId ? { price: priceId, quantity: 1 } : {
      price_data: {
        currency: 'brl',
        recurring: { interval: 'month' },
        unit_amount: Math.round(plano.preco * 100),
        product_data: {
          name: `ZoomDev OS ${plano.nome}`,
          description: plano.descricao,
        },
      },
      quantity: 1,
    }],
    success_url: `${pagamentosConfig.urlBase}/planos?sucesso=${txId}`,
    cancel_url: `${pagamentosConfig.urlBase}/planos?cancelado=${txId}`,
    metadata: { txId, userId: user.id, planoId },
    subscription_data: { metadata: { txId, userId: user.id, planoId } },
  });

  return registrar({ ...base, simulado: false, url: sessao.url, stripeSessionId: sessao.id });
}

// ── Compra avulsa via PIX (créditos e carbono) ────────────────────────────

export async function criarPix({ user, valor, descricao, tipo = 'credito', meta = {} }) {
  const v = Math.round(Number(valor) * 100) / 100;
  if (!(v > 0)) throw Object.assign(new Error('Valor inválido.'), { status: 400 });

  const txId = id('pix');
  const payload = gerarPixPayload(v, txId);
  const qr = await gerarPixQr(payload);

  return registrar({
    id: txId, userId: user.id, tipo, descricao,
    valor: v, moeda: 'BRL',
    status: 'aguardando_pagamento', metodo: 'pix',
    simulado: !pagamentosConfig.pixAtivo,
    pix: {
      payload, qr,
      chave: pagamentosConfig.pixChave,
      beneficiario: pagamentosConfig.pixNome,
      expiraEm: new Date(Date.now() + 3600_000).toISOString(),
    },
    meta,
    criadoEm: new Date().toISOString(),
  });
}

// ── Confirmação (webhook do Stripe ou conciliação PIX) ────────────────────

/**
 * Confirma uma transação e aplica o efeito: crédito de seiva, upgrade de plano
 * ou liberação da compra de carbono. Idempotente.
 */
export function confirmarTransacao(txId, { origem = 'manual', stripeSubscription = null, stripeCustomerId = null } = {}) {
  const t = transacoes()[txId];
  if (!t) throw Object.assign(new Error('Transação não encontrada.'), { status: 404 });
  if (t.status === 'pago') {
    const usuarioPago = store.users[t.userId];
    if (usuarioPago && stripeSubscription) atualizarAssinaturaStripe(usuarioPago, stripeSubscription, { transacaoId: t.id });
    else if (usuarioPago && stripeCustomerId && t.tipo === 'assinatura') {
      usuarioPago.assinatura = { ...(usuarioPago.assinatura || {}), stripeCustomerId };
    }
    if (stripeSubscription || stripeCustomerId) save();
    return { transacao: t, jaProcessada: true };
  }

  const user = store.users[t.userId];
  if (!user) throw Object.assign(new Error('Usuário da transação não encontrado.'), { status: 404 });

  t.status = 'pago';
  t.pagoEm = new Date().toISOString();
  t.origemConfirmacao = origem;
  t.comprovante = crypto.randomBytes(16).toString('hex');

  if (t.tipo === 'assinatura') {
    user.plano = t.planoId;
    if (t.creditos > 0) movimentarSeiva({ user, quantidade: t.creditos, tipo: 'assinatura_credito', descricao: `Seiva do plano ${t.planoId}`, transacaoId: t.id, origem });
    if (stripeSubscription) atualizarAssinaturaStripe(user, stripeSubscription, { desde: t.pagoEm, transacaoId: t.id });
    else user.assinatura = {
      ...(user.assinatura || {}), plano: t.planoId, desde: t.pagoEm, transacaoId: t.id,
      ...(stripeCustomerId ? { stripeCustomerId } : {}), status: user.assinatura?.status || 'active',
    };
  } else if (t.tipo === 'credito') {
    if (t.meta?.creditos > 0) movimentarSeiva({ user, quantidade: t.meta.creditos, tipo: 'compra_seiva', descricao: t.descricao, transacaoId: t.id, origem });
  } else if (t.tipo === 'carbono') {
    const pedido = store.carbonOrders[t.meta?.pedidoId];
    if (pedido) {
      pedido.status = 'pago';
      pedido.pagoEm = t.pagoEm;
      // Em produção, aqui dispara a aposentadoria no registro público
      pedido.certificado = { emitidoEm: t.pagoEm, comprovante: t.comprovante, pendente: 'aposentadoria em registro público' };
    }
  }

  save();
  return { transacao: t, jaProcessada: false };
}

/** Valida a assinatura do webhook do Stripe (quando configurado). */
async function assinaturaDaSessao(s, sessao) {
  const subscriptionId = typeof sessao.subscription === 'string' ? sessao.subscription : sessao.subscription?.id;
  return subscriptionId ? s.subscriptions.retrieve(subscriptionId) : null;
}

// A Stripe vem migrando o campo de assinatura das faturas entre versões de
// API. Aceitar as duas formas evita que um upgrade de versão interrompa a
// renovação de Seiva.
function assinaturaDaFatura(invoice) {
  const subscription = invoice.subscription
    || invoice.parent?.subscription_details?.subscription
    || invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id || null;
}

async function sincronizarAssinaturaStripe(s, subscription) {
  const user = encontrarUsuarioStripe({
    userId: subscription.metadata?.userId,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    subscriptionId: subscription.id,
  });
  if (!user) return null;
  atualizarAssinaturaStripe(user, subscription);
  if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
    user.plano = 'free';
    user.assinatura.encerradaEm = new Date().toISOString();
  }
  save();
  return user;
}

async function creditarRenovacaoStripe(s, invoice) {
  // A primeira fatura e confirmada pelo checkout. So ciclos mensais recebem
  // uma nova Seiva aqui, evitando duplicar o credito inicial.
  if (invoice.billing_reason !== 'subscription_cycle') return { ignorado: 'fatura_inicial_ou_ajuste' };
  const subscriptionId = assinaturaDaFatura(invoice);
  if (!subscriptionId || !invoice.id) return { ignorado: 'fatura_sem_assinatura' };
  if (Object.values(transacoes()).some(t => t.meta?.stripeInvoiceId === invoice.id)) return { jaProcessada: true };

  const subscription = await s.subscriptions.retrieve(subscriptionId);
  const user = await sincronizarAssinaturaStripe(s, subscription);
  if (!user) return { ignorado: 'usuario_nao_encontrado' };
  const planoId = subscription.metadata?.planoId || planoPorPrecoStripe(subscription.items?.data?.[0]?.price?.id) || user.plano;
  const plano = config.plans.find(p => p.id === planoId);
  if (!plano || plano.creditos <= 0) return { ignorado: 'plano_sem_creditos' };

  const transacao = {
    id: id('sub'), userId: user.id, tipo: 'renovacao_assinatura', planoId,
    descricao: `Renovação mensal ${plano.nome}`,
    valor: (invoice.amount_paid || 0) / 100, moeda: String(invoice.currency || 'brl').toUpperCase(),
    creditos: plano.creditos, status: 'pago', metodo: 'stripe',
    criadoEm: new Date().toISOString(), pagoEm: new Date().toISOString(),
    origemConfirmacao: 'stripe_webhook', comprovante: invoice.payment_intent || invoice.id,
    meta: { stripeInvoiceId: invoice.id, stripeSubscriptionId: subscriptionId },
  };
  transacoes()[transacao.id] = transacao;
  movimentarSeiva({ user, quantidade: plano.creditos, tipo: 'renovacao_assinatura', descricao: `Seiva da renovação do plano ${plano.nome}`, transacaoId: transacao.id, origem: 'stripe_webhook' });
  save();
  return { transacao };
}

async function registrarFalhaDePagamento(s, invoice) {
  const subscriptionId = assinaturaDaFatura(invoice);
  const user = encontrarUsuarioStripe({ customerId: invoice.customer, subscriptionId });
  if (!user) return { ignorado: 'usuario_nao_encontrado' };
  const subscription = subscriptionId ? await s.subscriptions.retrieve(subscriptionId) : null;
  if (subscription) atualizarAssinaturaStripe(user, subscription);
  else user.assinatura = { ...(user.assinatura || {}), status: 'past_due' };
  user.assinatura.ultimaFalhaEm = new Date().toISOString();
  user.assinatura.ultimaFaturaStripeId = invoice.id;
  save();
  return { userId: user.id, status: user.assinatura.status };
}

async function reconciliarAssinaturaDoUsuario(s, user) {
  if (user.assinatura?.stripeCustomerId) return user.assinatura;
  const anterior = transacoesDoUsuario(user.id).find(t => t.metodo === 'stripe' && t.stripeSessionId);
  if (!anterior) return null;
  const sessao = await s.checkout.sessions.retrieve(anterior.stripeSessionId, { expand: ['subscription'] });
  const subscription = await assinaturaDaSessao(s, sessao);
  if (subscription) atualizarAssinaturaStripe(user, subscription, { transacaoId: anterior.id });
  else if (sessao.customer) user.assinatura = { ...(user.assinatura || {}), stripeCustomerId: sessao.customer };
  save();
  return user.assinatura;
}

export async function criarPortalCliente(user) {
  const s = await stripe();
  if (!s) throw Object.assign(new Error('O portal do Stripe não está disponível enquanto os pagamentos estiverem em modo simulado.'), { status: 503, publico: true });
  await reconciliarAssinaturaDoUsuario(s, user);
  const customer = user.assinatura?.stripeCustomerId;
  if (!customer) throw Object.assign(new Error('Não encontramos uma assinatura Stripe ativa para esta conta.'), { status: 404, publico: true });
  const sessao = await s.billingPortal.sessions.create({ customer, return_url: `${pagamentosConfig.urlBase}/planos` });
  return { url: sessao.url };
}

export function resumoAssinatura(user) {
  const assinatura = user.assinatura || null;
  if (!assinatura) return null;
  return {
    plano: assinatura.plano || user.plano, status: assinatura.status || 'active',
    cancelarNoFimDoPeriodo: Boolean(assinatura.cancelarNoFimDoPeriodo),
    fimDoPeriodo: assinatura.fimDoPeriodo || null,
    portalDisponivel: Boolean(pagamentosConfig.stripeAtivo && assinatura.stripeCustomerId),
  };
}

/** Valida a assinatura e processa o ciclo completo dos webhooks do Stripe. */
export async function processarWebhookStripe(rawBody, assinatura) {
  const s = await stripe();
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !segredo) throw Object.assign(new Error('Webhook do Stripe não configurado.'), { status: 503, publico: true });

  const evento = s.webhooks.constructEvent(rawBody, assinatura, segredo);
  if (store.stripeEventos?.[evento.id]) return { jaProcessado: true, evento: evento.type };
  let resultado;
  if (evento.type === 'checkout.session.completed') {
    const sessao = evento.data.object;
    const txId = sessao.client_reference_id || sessao.metadata?.txId;
    const subscription = await assinaturaDaSessao(s, sessao);
    resultado = txId
      ? confirmarTransacao(txId, { origem: 'stripe_webhook', stripeSubscription: subscription, stripeCustomerId: sessao.customer })
      : { ignorado: 'checkout_sem_transacao' };
  } else if (evento.type === 'invoice.paid' || evento.type === 'invoice.payment_succeeded') {
    resultado = await creditarRenovacaoStripe(s, evento.data.object);
  } else if (evento.type === 'invoice.payment_failed') {
    resultado = await registrarFalhaDePagamento(s, evento.data.object);
  } else if (evento.type === 'customer.subscription.created' || evento.type === 'customer.subscription.updated' || evento.type === 'customer.subscription.deleted') {
    const user = await sincronizarAssinaturaStripe(s, evento.data.object);
    resultado = user ? { userId: user.id, status: user.assinatura.status } : { ignorado: 'usuario_nao_encontrado' };
  } else {
    resultado = { ignorado: evento.type };
  }
  registrarEventoStripe(evento);
  save();
  return { evento: evento.type, ...resultado };
}

/** Estado da integração, para o painel de configurações. */
export function statusPagamentos() {
  const chaveStripe = process.env.STRIPE_SECRET_KEY || '';
  return {
    stripe: {
      ativo: pagamentosConfig.stripeAtivo,
      modo: !pagamentosConfig.stripeAtivo ? 'simulado' : chaveStripe.startsWith('sk_test_') ? 'teste' : 'produção',
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      portal: pagamentosConfig.stripeAtivo,
      precosRecorrentes: Boolean(PRECO_STRIPE.pro && PRECO_STRIPE.business),
      comoAtivar: 'Defina STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET no ambiente.',
    },
    pix: {
      ativo: pagamentosConfig.pixAtivo,
      modo: pagamentosConfig.pixAtivo ? 'produção' : 'simulado',
      chave: pagamentosConfig.pixAtivo ? pagamentosConfig.pixChave : 'não configurada',
      beneficiario: pagamentosConfig.pixNome,
      comoAtivar: 'Defina PIX_CHAVE, PIX_NOME e PIX_CIDADE no ambiente. O BR Code já é gerado no padrão do Banco Central.',
      nota: 'A conciliação automática exige integração com o PSP (banco). Sem ela, confirme manualmente no painel.',
    },
  };
}
