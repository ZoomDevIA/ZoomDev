// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/pagamentos: assinaturas (Stripe) e cobranças avulsas (PIX).
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { store, save } from '../store.js';
import { config } from '../config.js';
import {
  criarCheckoutPlano, criarPix, confirmarTransacao,
  transacoesDoUsuario, transacoes, statusPagamentos, pagamentosConfig,
} from '../services/pagamentos.js';
import { awardXP } from '../services/gamification.js';
import { isAdmin } from '../auth.js';

export const pagamentosRouter = Router();

// Estado da integração (o que está em produção e o que está simulado)
pagamentosRouter.get('/status', (_req, res) => res.json(statusPagamentos()));

// Histórico do usuário
pagamentosRouter.get('/transacoes', (req, res) => res.json(transacoesDoUsuario(req.user.id)));

pagamentosRouter.get('/transacoes/:id', (req, res) => {
  const t = transacoes()[req.params.id];
  if (!t || t.userId !== req.user.id) return res.status(404).json({ error: 'Transação não encontrada.' });
  res.json(t);
});

// ── Assinatura de plano ───────────────────────────────────────────────────
pagamentosRouter.post('/assinar', async (req, res, next) => {
  try {
    const t = await criarCheckoutPlano(req.user, req.body?.planoId);
    res.json(t);
  } catch (e) { next(e); }
});

// ── Pacotes de seiva via PIX ──────────────────────────────────────────────
export const PACOTES_SEIVA = [
  { id: 'seiva_500', nome: '500 seiva', creditos: 500, preco: 39, descricao: 'Um plano de negócios completo + folga' },
  { id: 'seiva_1500', nome: '1.500 seiva', creditos: 1500, preco: 99, descricao: 'Plano + MVP + análises', destaque: true },
  { id: 'seiva_5000', nome: '5.000 seiva', creditos: 5000, preco: 279, descricao: 'Para quem toca vários projetos' },
];

pagamentosRouter.get('/pacotes', (_req, res) => res.json(PACOTES_SEIVA));

pagamentosRouter.post('/seiva', async (req, res, next) => {
  try {
    const pacote = PACOTES_SEIVA.find(p => p.id === req.body?.pacoteId);
    if (!pacote) return res.status(400).json({ error: 'Pacote inválido.' });
    const t = await criarPix({
      user: req.user, valor: pacote.preco,
      descricao: `${pacote.nome} de seiva`,
      tipo: 'credito', meta: { creditos: pacote.creditos, pacoteId: pacote.id },
    });
    res.json(t);
  } catch (e) { next(e); }
});

// ── PIX para compra de carbono ────────────────────────────────────────────
pagamentosRouter.post('/carbono/:pedidoId', async (req, res, next) => {
  try {
    const pedido = store.carbonOrders[req.params.pedidoId];
    if (!pedido || pedido.userId !== req.user.id) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (pedido.status === 'pago') return res.status(409).json({ error: 'Pedido já pago.' });
    const t = await criarPix({
      user: req.user, valor: pedido.valorTotal,
      descricao: `Compensação de ${pedido.toneladas} tCO₂e`,
      tipo: 'carbono', meta: { pedidoId: pedido.id },
    });
    res.json(t);
  } catch (e) { next(e); }
});

// ── Confirmação ───────────────────────────────────────────────────────────
// O usuário confirma o próprio PIX quando a conciliação automática não está
// ativa; o administrador pode confirmar qualquer transação.
pagamentosRouter.post('/transacoes/:id/confirmar', (req, res, next) => {
  try {
    const t = transacoes()[req.params.id];
    if (!t) return res.status(404).json({ error: 'Transação não encontrada.' });
    if (t.userId !== req.user.id && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Sem permissão sobre esta transação.' });
    }
    if (!t.simulado && !isAdmin(req.user)) {
      return res.status(409).json({ error: 'Esta cobrança é confirmada automaticamente pelo provedor de pagamento.' });
    }
    // Transação SIMULADA é a que nasce quando não há meio de pagamento
    // configurado: nada foi pago. Deixá-la ser confirmada pelo próprio dono
    // era entregar seiva e plano de graça a quem descobrisse a rota. Só o
    // administrador confirma, ou a instalação inteira declara que está em
    // demonstração (ZOOMDEV_PAGAMENTO_DEMO=1), para feiras e apresentações.
    if (t.simulado && !isAdmin(req.user) && !pagamentosConfig.demoLiberado) {
      return res.status(402).json({
        error: 'Pagamento ainda não configurado nesta instalação. Peça a confirmação ao administrador.',
        code: 'PAGAMENTO_NAO_CONFIGURADO',
      });
    }
    const r = confirmarTransacao(req.params.id, { origem: isAdmin(req.user) ? 'admin' : 'usuario' });
    let gam = null;
    if (!r.jaProcessada && t.tipo === 'carbono') gam = awardXP(req.user, 'compensacao_carbono', { transacao: t.id });
    save();
    res.json({ ...r, gamificacao: gam, creditos: store.users[t.userId].creditos, plano: store.users[t.userId].plano });
  } catch (e) { next(e); }
});

pagamentosRouter.post('/transacoes/:id/cancelar', (req, res) => {
  const t = transacoes()[req.params.id];
  if (!t || (t.userId !== req.user.id && !isAdmin(req.user))) return res.status(404).json({ error: 'Transação não encontrada.' });
  if (t.status === 'pago') return res.status(409).json({ error: 'Transação já paga não pode ser cancelada.' });
  t.status = 'cancelada';
  t.canceladoEm = new Date().toISOString();
  save();
  res.json(t);
});

// Planos com o preço oficial
pagamentosRouter.get('/planos', (req, res) => {
  res.json(config.plans.map(p => ({ ...p, atual: req.user.plano === p.id })));
});
