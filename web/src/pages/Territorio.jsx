import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapaGl, Marker, NavigationControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../lib/api.js';
import { Painel } from '../components/hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// TERRITÓRIO — o Mapa Vivo: imagem de satélite real, lotes em GeoJSON e o
// selo composto de cada um por cima. Clique num lote e a trilha de evidência
// aparece ao lado, com a verificação da cadeia de custódia a um botão.
// ═══════════════════════════════════════════════════════════════════════════

const COR_STATUS = {
  evidencia: '#00ff64',
  adesao: '#ffc531',
  potencial: '#00e5ff',
};
const ROTULO_STATUS = {
  evidencia: 'Evidência ativa',
  adesao: 'Adesão em curso',
  potencial: 'Potencial mapeado',
};
const COR_SELO = {
  VERIFICADO: '#00ff64', LAUDO: '#00e05a', CAMPO: '#a8e05a', PESQUISA: '#00c8ff',
  ESTRATEGIA: '#ffd700', HIPOTESE: '#ff9f43', VISAO: '#ffffff55',
};

// O estilo do mapa: só a camada de satélite, por raster tiles com atribuição.
const ESTILO_SATELITE = {
  version: 8,
  sources: {
    satelite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Imagem © Esri · Maxar · Earthstar Geographics',
      maxzoom: 18,
    },
  },
  layers: [
    { id: 'fundo', type: 'background', paint: { 'background-color': '#04140a' } },
    { id: 'satelite', type: 'raster', source: 'satelite' },
  ],
};

function centroide(coordenadas) {
  const anel = coordenadas[0];
  const n = anel.length - 1 || anel.length;
  let x = 0; let y = 0;
  for (let i = 0; i < n; i += 1) { x += anel[i][0]; y += anel[i][1]; }
  return [x / n, y / n];
}

export default function Territorio() {
  const caixaMapa = useRef(null);
  const mapa = useRef(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [loteAtivo, setLoteAtivo] = useState(null);
  const [trilha, setTrilha] = useState(null);
  const [verificacao, setVerificacao] = useState(null);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    api.territorio().then(setDados).catch(e => setErro(e.message));
    api.barramento(10).then(r => setEventos(r.eventos)).catch(() => {});
  }, []);

  // O mapa nasce quando os dados chegam, já com os lotes por cima
  useEffect(() => {
    if (!dados || !caixaMapa.current || mapa.current) return;
    const m = new MapaGl({
      container: caixaMapa.current,
      style: ESTILO_SATELITE,
      center: dados.municipio.centro,
      zoom: dados.municipio.zoom,
      attributionControl: { compact: true },
    });
    mapa.current = m;
    window.__mapaVivo = m;   // alça de inspeção: console do navegador e suporte
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    m.on('load', () => {
      m.addSource('lotes', { type: 'geojson', data: dados.lotes });
      m.addLayer({
        id: 'lotes-area', type: 'fill', source: 'lotes',
        paint: {
          'fill-color': ['match', ['get', 'status'],
            'evidencia', COR_STATUS.evidencia, 'adesao', COR_STATUS.adesao, COR_STATUS.potencial],
          'fill-opacity': ['match', ['get', 'status'], 'potencial', 0.10, 0.18],
        },
      });
      m.addLayer({
        id: 'lotes-borda', type: 'line', source: 'lotes',
        paint: {
          'line-color': ['match', ['get', 'status'],
            'evidencia', COR_STATUS.evidencia, 'adesao', COR_STATUS.adesao, COR_STATUS.potencial],
          'line-width': 2,
          'line-dasharray': ['match', ['get', 'status'], 'potencial', ['literal', [2, 2]], ['literal', [1, 0]]],
        },
      });
      m.addLayer({
        id: 'lote-escolhido', type: 'line', source: 'lotes',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': '#eafff5', 'line-width': 3 },
      });

      // Rótulos como marcadores HTML: herdam a tipografia da casa sem
      // depender de servidor de glyphs
      for (const f of dados.lotes.features) {
        const chip = document.createElement('div');
        chip.style.cssText = 'background:#02120add;color:#eafff5;font-family:JetBrains Mono,monospace;'
          + 'font-size:10px;padding:2px 7px;pointer-events:none;white-space:nowrap;'
          + `border-left:2px solid ${COR_STATUS[f.properties.status]}`;
        chip.textContent = f.properties.status === 'potencial'
          ? `${f.properties.nome} · ${f.properties.ha} ha`
          : `${f.properties.id} · ${f.properties.ha} ha · selo ${f.properties.confianca}`;
        new Marker({ element: chip, anchor: 'center' })
          .setLngLat(centroide(f.geometry.coordinates)).addTo(m);
      }

      m.on('click', 'lotes-area', (e) => escolher(e.features[0].properties));
      m.on('mouseenter', 'lotes-area', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'lotes-area', () => { m.getCanvas().style.cursor = ''; });
    });

    return () => { m.remove(); mapa.current = null; };
  }, [dados]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolher = (props) => {
    setLoteAtivo(props);
    setTrilha(null);
    setVerificacao(null);
    mapa.current?.setFilter('lote-escolhido', ['==', ['get', 'id'], props.id]);
    if (props.status !== 'potencial') {
      api.trilhaEvidencias(props.id).then(setTrilha).catch(() => {});
    }
  };

  const verificar = async () => {
    if (!loteAtivo) return;
    try { setVerificacao(await api.verificarCadeia(loteAtivo.id)); } catch { /* silencioso */ }
  };

  const totais = useMemo(() => dados?.totais, [dados]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Território · <span className="zd-gradient-text">{dados?.municipio?.nome || '…'} vivo</span>
          </h1>
          <p className="text-white/55 text-sm mt-1.5">
            Cada lote com o próprio selo, sobre imagem de satélite real. Clique num lote para abrir a trilha de evidência.
          </p>
        </div>
        {totais && (
          <div className="flex gap-3">
            {[[totais.hectares.toLocaleString('pt-BR'), 'ha sob manejo'],
              [totais.lotes, 'lotes ativos'],
              [totais.potencialHa.toLocaleString('pt-BR'), 'ha potenciais']].map(([v, l]) => (
              <div key={l} className="zd-stat-card rounded-xl px-4 py-2.5 text-center">
                <div className="font-heading text-lg font-bold">{v}</div>
                <div className="text-[10px] text-white/50">{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dados?.demonstracao && (
        <div className="text-[11px] text-white/40">
          ◌ {dados.aviso}
        </div>
      )}
      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-4 items-start">
        <div className="zd-card-glow rounded-2xl overflow-hidden relative">
          <div ref={caixaMapa} style={{ height: 520 }} />
          {/* posição inline de propósito: o hud.css força position:relative em
              todo filho direto de .zd-card-glow (o conteúdo acima do brilho),
              e só o estilo inline vence essa regra */}
          <div className="rounded-lg px-3 py-2"
            style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: '#02120ae6' }}>
            <div className="text-[9px] tracking-[.2em] text-[color:var(--zd-acento,#00e5ff)] font-mono uppercase mb-1.5">Legenda</div>
            {Object.entries(ROTULO_STATUS).map(([k, rotulo]) => (
              <div key={k} className="flex items-center gap-2 py-0.5 text-[11px] text-white/70">
                <span style={{
                  width: 16, height: 10, border: `1.5px ${k === 'potencial' ? 'dashed' : 'solid'} ${COR_STATUS[k]}`,
                  background: k === 'potencial' ? 'transparent' : `${COR_STATUS[k]}2e`,
                }} />
                {rotulo}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!loteAtivo && (
            <div className="zd-card rounded-xl p-5 text-sm text-white/50">
              🛰️ Selecione um lote no mapa para ver o selo composto, a trilha de evidência e a verificação da cadeia de custódia.
            </div>
          )}

          {loteAtivo && (
            <div className="zd-card-glow rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-heading font-bold">{loteAtivo.nome}</div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    {loteAtivo.id} · {loteAtivo.ha} ha{loteAtivo.cultura ? ` · ${loteAtivo.cultura}` : ''} · {ROTULO_STATUS[loteAtivo.status]}
                  </div>
                </div>
                {loteAtivo.status !== 'potencial' && (
                  <div className="text-right shrink-0">
                    <div className="font-heading text-2xl font-bold" style={{ color: COR_SELO[loteAtivo.selo] }}>
                      {loteAtivo.confianca}
                    </div>
                    <div className="text-[9px] tracking-wider text-white/40 font-mono uppercase">{loteAtivo.selo}</div>
                  </div>
                )}
              </div>

              {loteAtivo.status === 'potencial' && (
                <p className="text-xs text-white/50 mt-3">
                  Área apontada pelo motor 360° como apta à regeneração. Ainda sem adesão: nenhuma evidência, selo VISÃO por definição.
                </p>
              )}

              {trilha && (
                <div className="mt-4 space-y-2">
                  <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40">
                    Trilha de evidência · {trilha.trilha.length} registros · elo mais fraco governa
                  </div>
                  {trilha.trilha.slice(0, 5).map(ev => (
                    <div key={ev.id} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono" style={{ color: COR_SELO[ev.selo] }}>
                          {ev.selo} {trilha.trilha[0].id === ev.id ? '· mais recente' : ''}
                        </span>
                        <span className="text-[9px] text-white/30 font-mono">{ev.em.slice(0, 10)}</span>
                      </div>
                      <div className="text-[11.5px] text-white/65 mt-1 leading-snug">{ev.descricao}</div>
                    </div>
                  ))}

                  <button onClick={verificar}
                    className="w-full rounded-lg border border-white/15 hover:border-[#00ff6466] hover:bg-[#00ff640d] transition-colors py-2 text-xs text-white/70">
                    ⛓ Verificar cadeia de custódia
                  </button>
                  {verificacao && (
                    <Painel cor={verificacao.integra ? '#00ff64' : '#ff4d8d'} className="p-3 text-[11.5px]">
                      {verificacao.integra ? (
                        <>
                          <b className="text-[#00ff64]">Cadeia íntegra.</b>{' '}
                          <span className="text-white/60">
                            {verificacao.registros} registros encadeados, nenhuma alteração após o lacre.
                          </span>
                          <div className="font-mono text-[9px] text-white/35 mt-1.5 break-all">
                            âncora sha256 · {verificacao.ancora}
                          </div>
                        </>
                      ) : (
                        <>
                          <b className="text-[#ff4d8d]">Cadeia quebrada.</b>{' '}
                          <span className="text-white/60">
                            {verificacao.quebras.map(q => `posição ${q.posicao}: ${q.motivo}`).join(' · ')}
                          </span>
                        </>
                      )}
                    </Painel>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="zd-card rounded-xl p-4">
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-2">
              Barramento · agora
            </div>
            {eventos.length === 0 && <div className="text-xs text-white/35">Sem eventos ainda.</div>}
            {eventos.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-1 border-b border-white/5 last:border-0">
                <span className="text-[11px] text-white/60 font-mono truncate">{e.tipo}</span>
                <span className="text-[9.5px] font-mono shrink-0" style={{ color: COR_SELO[e.selo] || '#ffffff77' }}>
                  {e.selo} {e.confianca}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
