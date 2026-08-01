// Rotas da Calculadora de Passivo Ambiental e do CarbonPay (compensação).
import { Router } from 'express';
import { store, save, id } from '../store.js';
import { calcularPassivo, PROJETOS_CARBONPAY, FATORES } from '../services/carbon.js';
import { awardXP } from '../services/gamification.js';

export const carbonRouter = Router();

carbonRouter.get('/fatores', (_req, res) => {
  res.json({ fatores: FATORES, projetos: PROJETOS_CARBONPAY });
});

carbonRouter.post('/calcular', (req, res) => {
  const resultado = calcularPassivo(req.body || {});
  const gam = awardXP(req.user, 'calculo_carbono', { total: resultado.totalTco2eAno });
  save();
  res.json({ resultado, gamificacao: gam });
});

// Pedido de compensação (demo: registra a intenção; produção integraria API de
// retirement — Patch/Cloverly/conta em registro — e emitiria certificado público)
carbonRouter.post('/compensar', (req, res) => {
  const { projetoId, toneladas, projetoZoomDevId } = req.body || {};
  const projeto = PROJETOS_CARBONPAY.find(p => p.id === projetoId);
  const ton = Math.max(0.1, Number(toneladas) || 0);
  if (!projeto) return res.status(400).json({ error: 'Projeto de compensação inválido.' });

  const orderId = id('co2');
  const pedido = {
    id: orderId,
    userId: req.user.id,
    projetoZoomDevId: projetoZoomDevId || null,
    projeto: projeto.nome,
    padrao: projeto.padrao,
    toneladas: ton,
    valorTotal: Math.round(ton * projeto.precoPorTon * 100) / 100,
    status: 'aguardando_pagamento',
    // Em produção: após pagamento → retirement no registro → serial público no certificado
    certificado: null,
    criadoEm: new Date().toISOString(),
  };
  store.carbonOrders[orderId] = pedido;
  const gam = awardXP(req.user, 'compensacao_carbono', { pedido: orderId, toneladas: ton });
  save();
  res.json({ pedido, gamificacao: gam, aviso: 'Demo: pedido registrado. Em produção, a compensação gera aposentadoria em registro público (Verra/Gold Standard) com certificado rastreável.' });
});

carbonRouter.get('/pedidos', (req, res) => {
  res.json(Object.values(store.carbonOrders).filter(o => o.userId === req.user.id));
});
