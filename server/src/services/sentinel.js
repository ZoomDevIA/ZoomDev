// ═══════════════════════════════════════════════════════════════════════════
// SENTINEL-2 · NDVI POR LOTE — o satélite como testemunha contínua.
//
// O NDVI (índice de vigor da vegetação, -1 a 1) vem do Sentinel-2 do
// programa Copernicus da União Europeia: 10 metros de pixel, revisita de ~5
// dias, gratuito. A série temporal por lote é a evidência de manejo que
// ninguém digita: a planta responde, o satélite registra.
//
// Dois modos, no padrão da casa (email.js, isometric.js, loginGoogle.js):
//   REAL           com COPERNICUS_CLIENT_ID e COPERNICUS_CLIENT_SECRET
//                  (criados de graça em dataspace.copernicus.eu), usa a
//                  Statistical API oficial sobre o polígono do lote
//   DEMONSTRACAO   sem as chaves, série determinística plausível, SEMPRE
//                  rotulada, que NUNCA vira evidência na cadeia
//
// A regra do Selo aplicada a satélite: NDVI real registrado vira evidência
// CAMPO (instrumento sem laudo assinado); NDVI demonstrativo não vira nada,
// e a rota de registro recusa com a explicação, em vez de fingir.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { LOTES } from '../data/territorio.js';
import { registrarEvidencia } from './custodia.js';

const CLIENT_ID = process.env.COPERNICUS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.COPERNICUS_CLIENT_SECRET || '';
const URL_TOKEN = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const URL_ESTATISTICA = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';
const QUINZENAS = 12;   // ~6 meses de série

export function modoSentinel() {
  return CLIENT_ID && CLIENT_SECRET ? 'real' : 'demonstracao';
}

// ── Modo real: OAuth2 client-credentials + Statistical API ─────────────────
// Os nomes de campo seguem a documentação pública do Copernicus Data Space;
// como toda integração daqui, a primeira chamada autenticada confere o
// formato de verdade e este bloco se ajusta se a doc tiver mudado.

let tokenCache = { em: 0, valor: null };

async function tokenCopernicus() {
  if (tokenCache.valor && Date.now() - tokenCache.em < 8 * 60 * 1000) return tokenCache.valor;
  const r = await fetch(URL_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw Object.assign(new Error(`Copernicus recusou a autenticação (${r.status}).`), { status: 502 });
  const corpo = await r.json();
  tokenCache = { em: Date.now(), valor: corpo.access_token };
  return tokenCache.valor;
}

const EVALSCRIPT_NDVI = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [{ id: "ndvi", bands: 1 }, { id: "dataMask", bands: 1 }] };
}
function evaluatePixel(s) {
  return { ndvi: [(s.B08 - s.B04) / (s.B08 + s.B04)], dataMask: [s.dataMask] };
}`;

async function serieReal(lote) {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - QUINZENAS * 15 * 24 * 3600 * 1000);
  const r = await fetch(URL_ESTATISTICA, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await tokenCopernicus()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        bounds: { geometry: { type: 'Polygon', coordinates: lote.poligono } },
        data: [{ type: 'sentinel-2-l2a', dataFilter: { maxCloudCoverage: 40 } }],
      },
      aggregation: {
        timeRange: { from: inicio.toISOString(), to: fim.toISOString() },
        aggregationInterval: { of: 'P15D' },
        evalscript: EVALSCRIPT_NDVI,
        resx: 10, resy: 10,
      },
    }),
  });
  if (!r.ok) {
    const detalhe = await r.text().catch(() => '');
    throw Object.assign(new Error(`Copernicus respondeu ${r.status}: ${detalhe.slice(0, 200)}`), { status: 502 });
  }
  const corpo = await r.json();
  return (corpo.data || []).map(p => ({
    data: p.interval?.from?.slice(0, 10),
    ndvi: Number(p.outputs?.ndvi?.bands?.B0?.stats?.mean?.toFixed?.(3) ?? NaN),
  })).filter(p => Number.isFinite(p.ndvi));
}

// ── Modo demonstração: determinístico por lote ─────────────────────────────
// A mesma série a cada chamada (semente = id do lote), com tendência de
// recuperação e ruído curto: plausível de olhar, impossível de confundir com
// medida, porque a resposta grita `demonstracao` e a data para no presente.

function serieDemonstrativa(loteId) {
  const semente = crypto.createHash('sha256').update(loteId).digest();
  const serie = [];
  const agora = Date.now();
  for (let i = 0; i < QUINZENAS; i += 1) {
    const base = 0.46 + (0.26 * i) / (QUINZENAS - 1);          // recuperação
    const ruido = ((semente[i] / 255) - 0.5) * 0.07;            // ±0,035
    const estacao = Math.sin(i / 1.9) * 0.02;
    serie.push({
      data: new Date(agora - (QUINZENAS - 1 - i) * 15 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      ndvi: Number(Math.max(0.2, Math.min(0.9, base + ruido + estacao)).toFixed(3)),
    });
  }
  return serie;
}

export async function ndviDoLote(loteId) {
  const lote = LOTES.find(l => l.id === loteId);
  if (!lote) throw Object.assign(new Error('Lote desconhecido.'), { status: 404 });

  const modo = modoSentinel();
  const serie = modo === 'real' ? await serieReal(lote) : serieDemonstrativa(loteId);
  const media = serie.length
    ? Number((serie.reduce((s, p) => s + p.ndvi, 0) / serie.length).toFixed(3)) : null;
  const tendencia = serie.length >= 2
    ? Number((serie[serie.length - 1].ndvi - serie[0].ndvi).toFixed(3)) : null;

  return {
    modo,
    fonte: modo === 'real'
      ? 'Sentinel-2 L2A · Copernicus Data Space · Statistical API (10 m, quinzenal)'
      : 'Série demonstrativa determinística; defina COPERNICUS_CLIENT_ID e COPERNICUS_CLIENT_SECRET para o NDVI real.',
    loteId, serie, media, tendencia,
  };
}

/**
 * Grava a leitura NDVI real como evidência CAMPO na cadeia do lote.
 * Em modo demonstração RECUSA: número inventado não entra na cadeia, e a
 * mensagem diz exatamente o que falta para poder entrar.
 */
export async function registrarNdviComoEvidencia(loteId, userId = null) {
  if (modoSentinel() !== 'real') {
    throw Object.assign(new Error(
      'O NDVI demonstrativo não vira evidência: a cadeia só aceita medida real. '
      + 'Defina COPERNICUS_CLIENT_ID e COPERNICUS_CLIENT_SECRET (conta gratuita em dataspace.copernicus.eu) e tente de novo.',
    ), { status: 409 });
  }
  const { serie, media, tendencia } = await ndviDoLote(loteId);

  // Céu fechado a safra inteira, polígono fora da cobertura ou resposta com
  // outro formato devolvem série vazia. Sem esta guarda, a linha seguinte
  // estourava num 500 genérico justamente no módulo cuja razão de existir é
  // explicar o que a medição diz.
  if (!serie.length) {
    throw Object.assign(new Error(
      'Não há leitura de satélite utilizável para este lote no período: todas as passagens vieram com nuvem '
      + 'acima do limite ou fora da cobertura. Tente de novo depois da próxima passagem do Sentinel-2.',
    ), { status: 422 });
  }

  const ultima = serie[serie.length - 1];
  // Uma leitura só não tem tendência: dizer "tendência +null" numa descrição
  // que entra lacrada na cadeia de custódia seria inventar informação.
  const trecho = Number.isFinite(tendencia)
    ? `· tendência ${tendencia >= 0 ? '+' : ''}${tendencia} em ${serie.length} quinzenas`
    : `· leitura única, ainda sem tendência`;

  return registrarEvidencia({
    loteId,
    tipo: 'ndvi-satelite',
    selo: 'CAMPO',
    descricao: `NDVI Sentinel-2: última leitura ${ultima.ndvi} em ${ultima.data} · média ${media} `
      + `${trecho} (Copernicus, 10 m)`,
  }, userId);
}
