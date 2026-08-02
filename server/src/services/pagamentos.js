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

export const pagamentosConfig = {
  stripeAtivo: Boolean(process.env.STRIPE_SECRET_KEY),
  pixAtivo: Boolean(process.env.PIX_CHAVE),
  pixChave: process.env.PIX_CHAVE || 'contato@zoomdev.com.br',
  pixNome: (process.env.PIX_NOME || 'ZOOMDEV OS').slice(0, 25),
  pixCidade: (process.env.PIX_CIDADE || 'BELEM').slice(0, 15),
  urlBase: process.env.ZOOMDEV_URL || 'http://localhost:5173',
};

let stripeClient = null;
async function stripe() {
  if (!pagamentosConfig.stripeAtivo) return null;
  if (!stripeClient) {
    const { default: Stripe } = await import('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
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

  const sessao = await s.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: txId,
    line_items: [{
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
export function confirmarTransacao(txId, { origem = 'manual' } = {}) {
  const t = transacoes()[txId];
  if (!t) throw Object.assign(new Error('Transação não encontrada.'), { status: 404 });
  if (t.status === 'pago') return { transacao: t, jaProcessada: true };

  const user = store.users[t.userId];
  if (!user) throw Object.assign(new Error('Usuário da transação não encontrado.'), { status: 404 });

  t.status = 'pago';
  t.pagoEm = new Date().toISOString();
  t.origemConfirmacao = origem;
  t.comprovante = crypto.randomBytes(16).toString('hex');

  if (t.tipo === 'assinatura') {
    user.plano = t.planoId;
    user.creditos += t.creditos || 0;
    user.assinatura = { plano: t.planoId, desde: t.pagoEm, transacaoId: t.id };
  } else if (t.tipo === 'credito') {
    user.creditos += t.meta?.creditos || 0;
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
export async function processarWebhookStripe(rawBody, assinatura) {
  const s = await stripe();
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !segredo) throw Object.assign(new Error('Webhook do Stripe não configurado.'), { status: 503 });

  const evento = s.webhooks.constructEvent(rawBody, assinatura, segredo);
  if (evento.type === 'checkout.session.completed') {
    const txId = evento.data.object.client_reference_id || evento.data.object.metadata?.txId;
    if (txId) return confirmarTransacao(txId, { origem: 'stripe_webhook' });
  }
  return { ignorado: evento.type };
}

/** Estado da integração, para o painel de configurações. */
export function statusPagamentos() {
  return {
    stripe: {
      ativo: pagamentosConfig.stripeAtivo,
      modo: pagamentosConfig.stripeAtivo ? 'produção' : 'simulado',
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
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
