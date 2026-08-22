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
import { MUNICIPIO, LOTES, COOPERATIVAS } from '../data/territorio.js';
import { registrarEvidencia, trilha, seloDoLote, verificarCadeia, decomposicao } from '../services/custodia.js';
import { semearSePreciso } from '../services/territorioDemo.js';
import { recentes } from '../services/barramento.js';
import { ndviDoLote, registrarNdviComoEvidencia, modoSentinel } from '../services/sentinel.js';
import { seloResultante } from '../science/selos.js';

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

// Ranking de cooperativas do cockpit: hectares do recorte e o selo composto
// dos lotes que cada uma agrega (elo mais fraco entre eles, como sempre).
territorioRouter.get('/territorio/cooperativas', (_req, res) => {
  semearSePreciso();
  const ranking = COOPERATIVAS.map(c => {
    const selos = c.lotes.map(id => seloDoLote(id).selo);
    const composto = seloResultante(selos);
    return { nome: c.nome, ha: c.ha, lotes: c.lotes, selo: composto.id, confianca: composto.confianca };
  }).sort((a, b) => b.confianca - a.confianca || b.ha - a.ha);
  res.json({ demonstracao: true, ranking });
});

// ── NDVI por satélite ──────────────────────────────────────────────────────
territorioRouter.get('/territorio/ndvi/:loteId', (req, res, next) => {
  semearSePreciso();
  ndviDoLote(req.params.loteId).then(d => res.json(d)).catch(next);
});

// Só o NDVI REAL entra na cadeia; o demonstrativo é recusado com instrução.
territorioRouter.post('/territorio/ndvi/:loteId/registrar', (req, res, next) => {
  semearSePreciso();
  registrarNdviComoEvidencia(req.params.loteId, req.user?.id || null)
    .then(ev => res.json({ evidencia: ev, selo: seloDoLote(req.params.loteId) }))
    .catch(next);
});

territorioRouter.get('/territorio/sentinel/estado', (_req, res) => {
  res.json({
    modo: modoSentinel(),
    configurado: modoSentinel() === 'real',
    instrucoes: modoSentinel() === 'real' ? null
      : 'Crie a conta gratuita em dataspace.copernicus.eu, gere um OAuth client e defina '
        + 'COPERNICUS_CLIENT_ID e COPERNICUS_CLIENT_SECRET. Sem elas a série NDVI é demonstrativa.',
  });
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
