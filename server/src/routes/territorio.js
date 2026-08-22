// ═══════════════════════════════════════════════════════════════════════════
// ROTAS DO TERRITÓRIO E DA PROVA
//   GET  /territorio                    o mapa vivo: lotes em GeoJSON + selo
//   GET  /barramento                    o feed "agora" do ecossistema
//   POST /evidencias                    registra evidência na cadeia do lote
//   GET  /evidencias/:loteId            trilha completa + selo composto
//   GET  /evidencias/:loteId/verificar  confere a cadeia hash a hash
//
// O território demonstrativo é semeado UMA vez, pelo registrador real de
// evidências: as cadeias e os eventos que as telas mostram são verdadeiros,
// demonstrativo é o conteúdo, e a resposta carrega esse aviso.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { MUNICIPIO, LOTES } from '../data/territorio.js';
import { registrarEvidencia, trilha, seloDoLote, verificarCadeia, decomposicao } from '../services/custodia.js';
import { semearSePreciso } from '../services/territorioDemo.js';
import { recentes } from '../services/barramento.js';

export const territorioRouter = Router();

territorioRouter.get('/territorio', (_req, res) => {
  semearSePreciso();
  const features = LOTES.map(l => ({
    type: 'Feature',
    properties: {
      id: l.id, nome: l.nome, ha: l.ha, cultura: l.cultura, status: l.status,
      ...seloDoLote(l.id),
    },
    geometry: { type: 'Polygon', coordinates: l.poligono },
  }));
  const comEvidencia = features.filter(f => f.properties.status !== 'potencial');
  res.json({
    demonstracao: true,
    aviso: 'Lotes demonstrativos com geometria real de Macapá. Produtores reais substituem estes dados.',
    municipio: MUNICIPIO,
    fonteImagem: 'Esri World Imagery · Maxar · Earthstar Geographics',
    lotes: { type: 'FeatureCollection', features },
    totais: {
      lotes: comEvidencia.length,
      hectares: comEvidencia.reduce((s, f) => s + f.properties.ha, 0),
      potencialHa: features.filter(f => f.properties.status === 'potencial')
        .reduce((s, f) => s + f.properties.ha, 0),
    },
  });
});

territorioRouter.get('/barramento', (req, res) => {
  semearSePreciso();
  res.json({ eventos: recentes({ limite: Number(req.query.limite) || 20 }) });
});

territorioRouter.post('/evidencias', (req, res, next) => {
  try {
    const { loteId, tipo, descricao, selo, anexoHash } = req.body || {};
    const ev = registrarEvidencia({ loteId, tipo, descricao, selo, anexoHash }, req.user?.id || null);
    res.json({ evidencia: ev, selo: seloDoLote(String(loteId).trim()) });
  } catch (e) { next(e); }
});

territorioRouter.get('/evidencias/:loteId', (req, res) => {
  semearSePreciso();
  const loteId = req.params.loteId;
  res.json({
    loteId,
    selo: seloDoLote(loteId),
    decomposicao: decomposicao(loteId),
    trilha: trilha(loteId),
  });
});

territorioRouter.get('/evidencias/:loteId/verificar', (req, res) => {
  semearSePreciso();
  res.json(verificarCadeia(req.params.loteId));
});
