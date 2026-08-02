// Rotas da Calculadora de Passivo Ambiental e do CarbonPay (compensação).
import { Router } from 'express';
import crypto from 'node:crypto';
import { store, save, id } from '../store.js';
import {
  calcularPassivo, PROJETOS_CARBONPAY, FATORES,
  sequestroBiogenesis, CULTURAS_BIOGENESIS, CENARIOS_BIOGENESIS,
} from '../services/carbon.js';
import { awardXP } from '../services/gamification.js';
import { CARBONPAY_ITENS, SEQUESTRO_BIOMAS, SEQUESTRO_TIPOS } from '../data/seeds.js';

export const carbonRouter = Router();

// Marketplace CarbonPay (itens seed do protótipo) + stats agregadas
carbonRouter.get('/marketplace', (_req, res) => {
  const projetos = CARBONPAY_ITENS.filter(i => i.tons);
  const totalTons = projetos.reduce((s, i) => s + i.tons, 0);
  const precoMedio = Math.round(projetos.reduce((s, i) => s + i.precoPorTon, 0) / projetos.length);
  res.json({
    stats: {
      creditosDisponiveis: totalTons,
      projetosCertificados: projetos.length,
      transacoes: Object.keys(store.carbonOrders).length,
      precoMedio,
    },
    itens: CARBONPAY_ITENS,
    biomas: SEQUESTRO_BIOMAS,
    tipos: SEQUESTRO_TIPOS,
  });
});

// Calculadora de SEQUESTRO (protótipo): quanto uma área pode GERAR de créditos
carbonRouter.post('/sequestro', (req, res) => {
  const { areaHa, bioma = 'amazonia', tipo = 'restauracao', duracaoAnos = 10, precoPorTon = 90 } = req.body || {};
  const area = Math.max(0, Number(areaHa) || 0);
  const anos = Math.min(40, Math.max(1, Number(duracaoAnos) || 10));
  const b = SEQUESTRO_BIOMAS[bioma] || SEQUESTRO_BIOMAS.amazonia;
  const t = SEQUESTRO_TIPOS[tipo] || SEQUESTRO_TIPOS.restauracao;
  const preco = Math.max(10, Number(precoPorTon) || 90);

  const tco2PorAno = Math.round(area * b.taxa * t.mult * 10) / 10;
  const tco2Total = Math.round(tco2PorAno * anos * 10) / 10;
  const receitaAnual = Math.round(tco2PorAno * preco * 100) / 100;
  res.json({
    entrada: { areaHa: area, bioma: b.nome, tipo: t.nome, duracaoAnos: anos, precoPorTon: preco },
    tco2PorAno,
    tco2Total,
    receitaAnualEstimada: receitaAnual,
    receitaTotalEstimada: Math.round(receitaAnual * anos * 100) / 100,
    arvoresEquivalentes: Math.round(tco2PorAno * 7),
    avisos: [
      'Estimativa simplificada por bioma/tipo — a certificação real exige metodologia aprovada (VCS/Gold Standard), linha de base e verificação por auditor (VVB).',
      'Receita bruta antes de custos de certificação (tipicamente 20-40% do valor no primeiro ciclo).',
    ],
  });
});

// Compra no CarbonPay com PIX (mock demo) ou cartão — espelho do CarbonPurchaseModal
carbonRouter.post('/comprar', (req, res) => {
  const { itemId, toneladas, metodo = 'pix', projetoZoomDevId } = req.body || {};
  const item = CARBONPAY_ITENS.find(i => i.id === itemId && i.tons);
  const ton = Math.max(0.1, Number(toneladas) || 0);
  if (!item) return res.status(400).json({ error: 'Item de carbono inválido.' });
  if (!['pix', 'cartao'].includes(metodo)) return res.status(400).json({ error: 'Método de pagamento inválido.' });

  const orderId = id('co2');
  const total = Math.round(ton * item.precoPorTon * 100) / 100;
  const pedido = {
    id: orderId,
    userId: req.user.id,
    projetoZoomDevId: projetoZoomDevId || null,
    item: item.nome,
    padrao: item.padrao,
    bioma: item.bioma,
    toneladas: ton,
    precoPorTon: item.precoPorTon,
    valorTotal: total,
    metodo,
    status: 'aguardando_pagamento',
    // Demo: código PIX ilustrativo. Produção: gateway PIX real + retirement no registro.
    pixCode: metodo === 'pix' ? `00020126580014BR.GOV.BCB.PIX01ZOOMDEV-DEMO-${orderId.toUpperCase()}520400005303986540${total.toFixed(2)}5802BR5910ZOOMDEV OS6009BELEM-PA`.slice(0, 140) : null,
    transactionHash: crypto.randomBytes(16).toString('hex'),
    certificado: null,
    criadoEm: new Date().toISOString(),
  };
  store.carbonOrders[orderId] = pedido;
  const gam = awardXP(req.user, 'compensacao_carbono', { pedido: orderId, toneladas: ton });
  save();
  res.json({
    pedido,
    gamificacao: gam,
    aviso: 'Demo: após o pagamento, os créditos são aposentados em registro público (Verra/Gold Standard) e o certificado com serial fica disponível.',
  });
});

carbonRouter.get('/fatores', (_req, res) => {
  res.json({ fatores: FATORES, projetos: PROJETOS_CARBONPAY });
});

// Sequestro adicional com Biogenesis COT — modo ESTIMATIVA vs CRÉDITO VERIFICÁVEL
carbonRouter.get('/biogenesis/opcoes', (_req, res) => {
  res.json({ culturas: CULTURAS_BIOGENESIS, cenarios: CENARIOS_BIOGENESIS });
});

carbonRouter.post('/biogenesis', (req, res, next) => {
  try {
    const { culturaId, hectares, cenarioId, passivoTco2eAno } = req.body || {};
    if (!culturaId || !hectares) return res.status(400).json({ error: 'Informe culturaId e hectares.' });
    res.json(sequestroBiogenesis({ culturaId, hectares, cenarioId, passivoTco2eAno }));
  } catch (e) { next(e); }
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
