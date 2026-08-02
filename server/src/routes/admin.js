// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/admin — super dashboard do ecossistema (Sexta-Feira).
// Todas exigem papel de administrador (adminMiddleware aplicado no index).
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { store, save } from '../store.js';
import {
  snapshotEcossistema, chatAdmin, gerarRelatorio, relatorioHtml,
  initPic, picAtual, proporEvolucao, aprovarProposta, rejeitarProposta, rollbackPic,
} from '../agents/sextaFeira.js';
import { PICS_AGENTES } from '../protocols/picAgentes.js';

export const adminRouter = Router();

// Visão geral do ecossistema (stats + radar + matriz editais × projetos)
adminRouter.get('/overview', (_req, res) => {
  res.json(snapshotEcossistema());
});

// Chat com a Sexta-Feira (janela de conversação do administrador)
adminRouter.post('/chat', async (req, res, next) => {
  try {
    const { mensagens = [] } = req.body || {};
    if (!mensagens.length || mensagens[mensagens.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Envie a mensagem do administrador.' });
    }
    const r = await chatAdmin(mensagens);
    req.user.sextaFeiraChat = [
      ...(req.user.sextaFeiraChat || []),
      { role: 'user', content: mensagens[mensagens.length - 1].content },
      { role: 'assistant', content: r.resposta },
    ].slice(-50);
    save();
    res.json(r);
  } catch (e) { next(e); }
});

adminRouter.get('/chat', (req, res) => {
  res.json(req.user.sextaFeiraChat || []);
});

// Relatórios executivos do ecossistema
adminRouter.post('/relatorios', async (_req, res, next) => {
  try {
    const rel = await gerarRelatorio();
    const { snapshot, ...meta } = rel;
    res.json({ ...meta, stats: { projetos: snapshot.projetos.total, usuarios: snapshot.usuarios.total, unicornios: snapshot.radar.unicornios } });
  } catch (e) { next(e); }
});

adminRouter.get('/relatorios', (_req, res) => {
  const lista = Object.values(store.reports)
    .sort((a, b) => b.geradoEm.localeCompare(a.geradoEm))
    .slice(0, 20)
    .map(r => ({ id: r.id, geradoEm: r.geradoEm, picVersao: r.picVersao, resumo: r.resumo.slice(0, 220) + (r.resumo.length > 220 ? '…' : '') }));
  res.json(lista);
});

adminRouter.get('/relatorios/:id.html', (req, res) => {
  const rel = store.reports[req.params.id];
  if (!rel) return res.status(404).json({ error: 'Relatório não encontrado.' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(relatorioHtml(rel));
});

// PIC da Sexta-Feira: estado, evolução governada e rollback
adminRouter.get('/pic', (_req, res) => {
  const pic = initPic();
  res.json({
    versaoAtual: pic.versaoAtual,
    conteudoAtual: picAtual().conteudo,
    versoes: pic.versoes.map(v => ({ versao: v.versao, criadoEm: v.criadoEm, origem: v.origem, notas: v.notas })).reverse(),
    propostas: pic.propostas,
  });
});

adminRouter.post('/pic/propor', async (_req, res, next) => {
  try { res.json(await proporEvolucao()); } catch (e) { next(e); }
});

adminRouter.post('/pic/propostas/:id/aprovar', (req, res, next) => {
  try { res.json(aprovarProposta(req.params.id)); } catch (e) { next(e); }
});

adminRouter.post('/pic/propostas/:id/rejeitar', (req, res, next) => {
  try { res.json(rejeitarProposta(req.params.id)); } catch (e) { next(e); }
});

adminRouter.post('/pic/rollback', (req, res, next) => {
  try {
    const { versao } = req.body || {};
    if (!versao) return res.status(400).json({ error: 'Informe a versão de destino.' });
    res.json(rollbackPic(versao));
  } catch (e) { next(e); }
});

// PICs dos 25 agentes da plataforma (painel de consulta)
adminRouter.get('/pics-agentes', (_req, res) => {
  res.json(PICS_AGENTES);
});
