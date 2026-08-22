// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/isometric: benchmark do registro de remoção durável de carbono.
// Leitura apenas. O modo (demonstração ou real) vem do serviço e viaja em
// toda resposta, para a tela nunca vestir demo de dado vivo.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { estadoIsometric, benchmarkIsometric, projetosIsometric } from '../services/isometric.js';

export const isometricRouter = Router();

isometricRouter.get('/estado', (_req, res) => res.json(estadoIsometric()));

isometricRouter.get('/benchmark', (_req, res, next) => {
  benchmarkIsometric().then(d => res.json(d)).catch(next);
});

isometricRouter.get('/projetos', (_req, res, next) => {
  projetosIsometric().then(d => res.json(d)).catch(next);
});
