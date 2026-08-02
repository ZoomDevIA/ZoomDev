// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/impacto — Motor de Impacto Regenerativo 360°, dossiê Biogenesis,
// programa de fomento INCEMA/MIDR e conceito da criptomoeda BIOGEN.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { simular360 } from '../services/impactoRegenerativo.js';
import {
  IDENTIDADE, EVIDENCIAS, evidenciasComunicaveis,
  CENARIOS_UPLIFT, culturasLista,
} from '../science/biogenesis.js';
import { SELOS, ORDEM_SELOS } from '../science/selos.js';
import { resumoPrograma } from '../science/fomento.js';
import { BIOGEN, potencialBiogen } from '../science/biogen.js';

export const impactoRouter = Router();

// Dossiê Biogenesis: identidade, evidências e selos
impactoRouter.get('/biogenesis', (_req, res) => {
  res.json({
    identidade: IDENTIDADE,
    selos: ORDEM_SELOS.map(id => SELOS[id]),
    evidencias: EVIDENCIAS,
    cenarios: Object.values(CENARIOS_UPLIFT),
    culturas: culturasLista(),
  });
});

// Só as alegações que podem ir para comunicação comercial/ESG
impactoRouter.get('/biogenesis/comunicaveis', (_req, res) => {
  res.json(evidenciasComunicaveis());
});

// Programa de fomento INCEMA/MIDR (dados verificados)
impactoRouter.get('/fomento', (_req, res) => {
  res.json(resumoPrograma());
});

// Conceito da criptomoeda BIOGEN
impactoRouter.get('/biogen', (_req, res) => {
  res.json(BIOGEN);
});

// Simulação 360° — o coração do motor
impactoRouter.post('/simular', (req, res, next) => {
  try {
    const { culturaId, hectares, cenarioId } = req.body || {};
    if (!culturaId || !hectares) {
      return res.status(400).json({ error: 'Informe culturaId e hectares.' });
    }
    if (Number(hectares) <= 0 || Number(hectares) > 1_000_000) {
      return res.status(400).json({ error: 'Área inválida.' });
    }
    const sim = simular360({ culturaId, hectares, cenarioId });
    const biogen = potencialBiogen({
      co2eSequestradoTonAno: sim.dimensoes.carbono.co2eSequestradoTonAno,
      co2eEvitadoTonAno: sim.dimensoes.energetico.co2EvitadoTonAno,
    });
    res.json({ ...sim, biogen });
  } catch (e) { next(e); }
});

// Simulação aplicada ao programa INCEMA inteiro (impacto agregado do fomento real)
impactoRouter.get('/simular-programa', (req, res, next) => {
  try {
    const cenarioId = CENARIOS_UPLIFT[req.query.cenario] ? req.query.cenario : 'conservador';
    res.json(agregarPrograma(cenarioId));
  } catch (e) { next(e); }
});

function agregarPrograma(cenarioId) {
  const resumo = resumoPrograma();
  const acc = {
    pessoasAlimentadasAno: 0, energiaKwhAno: 0,
    co2eSequestradoTonAno: 0, co2eEvitadoTonAno: 0, impactoEconomicoReais: 0,
  };
  const porCultura = [];
  for (const { cultura, hectares } of resumo.culturas) {
    if (cultura === 'outras') continue;
    try {
      const sim = simular360({ culturaId: cultura, hectares, cenarioId });
      acc.pessoasAlimentadasAno += sim.resumo.pessoasAlimentadasAno;
      acc.energiaKwhAno += sim.resumo.energiaKwhAno;
      acc.co2eSequestradoTonAno += sim.resumo.co2eSequestradoTonAno;
      acc.co2eEvitadoTonAno += sim.resumo.co2eEvitadoTonAno;
      acc.impactoEconomicoReais += sim.resumo.impactoEconomicoReais;
      porCultura.push({ cultura, hectares, resumo: sim.resumo });
    } catch { /* cultura sem parâmetro — ignora */ }
  }
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    programa: resumo.programa.nome,
    valorGlobal: resumo.programa.valorGlobal,
    cenario: cenarioId,
    beneficiarios: resumo.beneficiarios,
    agregado: {
      pessoasAlimentadasAno: acc.pessoasAlimentadasAno,
      energiaKwhAno: Math.round(acc.energiaKwhAno),
      co2eSequestradoTonAno: r2(acc.co2eSequestradoTonAno),
      co2eEvitadoTonAno: r2(acc.co2eEvitadoTonAno),
      impactoEconomicoReais: Math.round(acc.impactoEconomicoReais),
    },
    porCultura,
    aviso: 'Estimativa agregada em cenário conservador, a partir das áreas declaradas no Plano de Trabalho. Não substitui MRV.',
  };
}
