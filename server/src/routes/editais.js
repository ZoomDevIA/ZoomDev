// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/editais — radar interativo com match automático e alertas.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { store } from '../store.js';
import {
  editaisAbertos, todosEditais, matchesDoProjeto, matchesDoUsuario,
  calcularMatch, resumoRadar, varrer,
} from '../services/radarEditais.js';
import { alertas, marcarAlertaLido, pulsar, resumoPulso } from '../services/pulsoDiario.js';
import { isAdmin } from '../auth.js';

export const editaisRouter = Router();

// Lista de editais abertos, com dias restantes
editaisRouter.get('/', (_req, res) => res.json(editaisAbertos()));

// Estado do radar (última varredura, cobertura, execuções)
editaisRouter.get('/radar', (_req, res) => res.json(resumoRadar()));

// Melhores matches de todos os projetos do usuário
editaisRouter.get('/matches', (req, res) => {
  const minimo = Number(req.query.minimo) || 0;
  res.json(matchesDoUsuario(req.user.id, minimo));
});

// Matches de um projeto específico, com decomposição explicável
editaisRouter.get('/matches/:projetoId', (req, res) => {
  const proj = store.projects[req.params.projetoId];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  res.json(matchesDoProjeto(proj));
});

// Aderência detalhada de um edital para um projeto
editaisRouter.post('/:id/aderencia', (req, res) => {
  const edital = todosEditais().find(e => e.id === req.params.id);
  if (!edital) return res.status(404).json({ error: 'Edital não encontrado.' });
  const proj = store.projects[req.body?.projetoId];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  res.json(calcularMatch(edital, proj));
});

// Alertas do radar para o usuário
editaisRouter.get('/alertas', (req, res) => {
  res.json(alertas(req.user.id, { apenasNaoLidos: req.query.naoLidos === 'true' }));
});

editaisRouter.post('/alertas/:id/lido', (req, res) => {
  if (!marcarAlertaLido(req.user.id, req.params.id)) return res.status(404).json({ error: 'Alerta não encontrado.' });
  res.json({ ok: true });
});

// Varredura sob demanda (admin) — força busca imediata
editaisRouter.post('/varrer', async (req, res, next) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Apenas o administrador pode forçar uma varredura.' });
    res.json(await pulsar({ forcar: true }));
  } catch (e) { next(e); }
});

editaisRouter.get('/pulso', (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Acesso restrito.' });
  res.json(resumoPulso());
});
