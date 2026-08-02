// ═══════════════════════════════════════════════════════════════════════════
// ROTAS de elenco (castas e ativação) e do Conselho dos Agentes.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { store, save } from '../store.js';
import { elencoCompleto, definirAtivacao, agentesLegado, copiloto, TODOS_PICS } from '../services/elenco.js';
import { realizarConselho, conselhosDoProjeto, convocar } from '../services/conselho.js';
import { cena } from '../services/mundoVivo.js';
import { awardXP } from '../services/gamification.js';
import { isAdmin } from '../auth.js';

export const elencoRouter = Router();

// Elenco agrupado por casta
elencoRouter.get('/elenco', (_req, res) => res.json(elencoCompleto()));

// Copiloto ativo do fundador (Maiá)
elencoRouter.get('/copiloto', (_req, res) => res.json(copiloto()));

// PICs de todos os agentes (núcleo + herdados)
elencoRouter.get('/elenco/pics', (_req, res) => res.json(TODOS_PICS));

// Ativação/standby — só admin
elencoRouter.post('/elenco/:id/ativacao', (req, res, next) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Apenas o administrador gerencia o elenco.' });
    res.json(definirAtivacao(req.params.id, req.body?.ativo, req.user.email));
  } catch (e) { next(e); }
});

// Mundo Vivo — cena do vale voxel com falas do estado real
elencoRouter.get('/mundo', (req, res) => res.json(cena(req.user)));

// ── Conselho dos Agentes ──────────────────────────────────────────────────
elencoRouter.get('/projects/:id/conselho/convocacao', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  res.json(convocar(proj));
});

elencoRouter.post('/projects/:id/conselho', async (req, res, next) => {
  try {
    const proj = store.projects[req.params.id];
    if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
    const ata = await realizarConselho(proj, req.user);
    const gam = awardXP(req.user, 'conselho_realizado', { projeto: proj.id, veredito: ata.veredito.id });
    save();
    res.json({ ata, gamificacao: gam });
  } catch (e) { next(e); }
});

elencoRouter.get('/projects/:id/conselho', (req, res) => {
  const proj = store.projects[req.params.id];
  if (!proj || proj.userId !== req.user.id) return res.status(404).json({ error: 'Projeto não encontrado.' });
  res.json(conselhosDoProjeto(proj.id, req.user.id));
});

// Formato de compatibilidade { nucleo, bio, gerais } para as telas existentes
export function agentsHandler(_req, res) {
  res.json(agentesLegado());
}
