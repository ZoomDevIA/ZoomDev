// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/impacto — Motor de Impacto Regenerativo 360° e ativo BIOGEN.
// Expõe apenas conhecimento técnico e níveis de confiança. O acervo documental
// (science/corpus.js) permanece interno e não é servido por nenhuma rota.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { simular360 } from '../services/impactoRegenerativo.js';
import {
  IDENTIDADE, EFEITOS_TECNICOS, efeitosComunicaveis,
  CENARIOS_UPLIFT, culturasLista,
} from '../science/biogenesis.js';
import { SELOS, ORDEM_SELOS } from '../science/selos.js';
import { ARQUETIPOS } from '../science/corpus.js';
import { BIOGEN, potencialBiogen } from '../science/biogen.js';
import { isAdmin } from '../auth.js';

export const impactoRouter = Router();

// Perfil técnico da tecnologia. Efeitos em investigação só aparecem para o admin.
impactoRouter.get('/biogenesis', (req, res) => {
  res.json({
    identidade: IDENTIDADE,
    selos: ORDEM_SELOS.map(id => SELOS[id]),
    efeitos: isAdmin(req.user) ? EFEITOS_TECNICOS : efeitosComunicaveis(),
    cenarios: Object.values(CENARIOS_UPLIFT),
    culturas: culturasLista(),
    arquetipos: ARQUETIPOS,
  });
});

impactoRouter.get('/biogen', (_req, res) => res.json(BIOGEN));

// Simulação 360°
impactoRouter.post('/simular', (req, res, next) => {
  try {
    const { culturaId, hectares, cenarioId, fracaoTermica } = req.body || {};
    if (!culturaId || !hectares) return res.status(400).json({ error: 'Informe culturaId e hectares.' });
    const ha = Number(hectares);
    if (!(ha > 0) || ha > 1_000_000) return res.status(400).json({ error: 'Área inválida.' });

    const sim = simular360({ culturaId, hectares: ha, cenarioId, fracaoTermica });
    const biogen = potencialBiogen({
      co2eSequestradoTonAno: sim.dimensoes.carbono.co2eSequestradoTonAno,
      co2eEvitadoTonAno: sim.dimensoes.energetico.co2EvitadoTonAno,
    });
    res.json({ ...sim, biogen });
  } catch (e) { next(e); }
});
