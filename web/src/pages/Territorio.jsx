import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapaGl, Marker, NavigationControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../lib/api.js';
import { useFoco } from '../lib/foco.js';
import Icon from '../components/Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// TERRITÓRIO · MODO COCKPIT
//
// Um protagonista e instrumentos ao redor. O menu lateral se retrai sozinho
// ao entrar (mecanismo de foco, o mesmo da Sexta-Feira) e volta ao sair; o
// mapa é um retângulo cinematográfico com moldura HUD (cantoneiras,
// telemetria ao vivo, REC); a lateral direita responde ao lote clicado com
// três visualizadores na altura exata do mapa; a régua de baixo dá o
// contexto do território, e o detalhe completo (cooperativas, adesão total,
// editais) vive uma dobra abaixo, atrás do botão Cockpit completo.
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

const grau = (v, eixo) => {
  const abs = Math.abs(v);
  const g = Math.floor(abs);
  const m = Math.round((abs - g) * 60);
  const hemi = eixo === 'lat' ? (v >= 0 ? 'N' : 'S') : (v >= 0 ? 'L' : 'W');
  return `${g}°${String(m).padStart(2, '0')}'${hemi}`;
};

export default function Territorio() {
  useFoco();   // o cockpit pede a tela: menu retrai ao entrar, volta ao sair

  const caixaMapa = useRef(null);
  const mapa = useRef(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [loteAtivo, setLoteAtivo] = useState(null);
  const [trilha, setTrilha] = useState(null);
  const [verificacao, setVerificacao] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [coop, setCoop] = useState(null);
  const [adesaoTotal, setAdesaoTotal] = useState(null);
  const [editais, setEditais] = useState([]);
  const [ndvi, setNdvi] = useState(null);
  const [ndviAviso, setNdviAviso] = useState(null);
  const [telemetria, setTelemetria] = useState(null);
  const [detalheAberto, setDetalheAberto] = useState(false);

  useEffect(() => {
    api.territorio().then(setDados).catch(e => setErro(e.message));
    api.barramento(8).then(r => setEventos(r.eventos)).catch(() => {});
    api.cooperativas().then(setCoop).catch(() => {});
    api.editais().then(l => setEditais((l || []).slice(0, 3))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dados) return;
    const hectares = dados.totais.hectares + dados.totais.potencialHa;
    api.simularImpacto({ culturaId: 'mandioca', hectares, cenarioId: 'conservador' })
      .then(setAdesaoTotal).catch(() => {});
  }, [dados]);

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

    // Telemetria da régua HUD: centro e zoom, atualizados a cada movimento
    const medir = () => {
      const c = m.getCenter();
      setTelemetria({ lat: c.lat, lon: c.lng, zoom: m.getZoom() });
    };
    medir();
    m.on('move', medir);

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

      // O cockpit nunca abre vazio: o primeiro lote com evidência já entra
      // selecionado e a lateral inteira acende com ele.
      const primeiro = dados.lotes.features.find(f => f.properties.status === 'evidencia');
      if (primeiro) escolher(primeiro.properties);
    });

    return () => { m.remove(); mapa.current = null; };
  }, [dados]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolher = (props) => {
    setLoteAtivo(props);
    setTrilha(null);
    setVerificacao(null);
    setNdvi(null);
    setNdviAviso(null);
    mapa.current?.setFilter('lote-escolhido', ['==', ['get', 'id'], props.id]);
    if (props.status !== 'potencial') {
      api.trilhaEvidencias(props.id).then(setTrilha).catch(() => {});
      api.ndvi(props.id).then(setNdvi).catch(() => {});
    }
  };

  const verificar = async () => {
    if (!loteAtivo) return;
    try { setVerificacao(await api.verificarCadeia(loteAtivo.id)); } catch { /* silencioso */ }
  };

  const ndviParaEvidencia = async () => {
    setNdviAviso(null);
    try {
      await api.registrarNdvi(loteAtivo.id);
      setNdviAviso({ ok: true, texto: 'Leitura NDVI lacrada na cadeia como evidência CAMPO.' });
      api.trilhaEvidencias(loteAtivo.id).then(setTrilha).catch(() => {});
    } catch (e) {
      setNdviAviso({ ok: false, texto: e.message });
    }
  };

  const fraco = trilha?.decomposicao?.length
    ? trilha.decomposicao[trilha.decomposicao.length - 1] : null;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-heading text-xl font-bold">
            Território · <span className="zd-gradient-text">{dados?.municipio?.nome || '…'} vivo</span>
          </h1>
          <span className="text-[8.5px] tracking-[.22em] font-mono uppercase text-white/30 hidden md:inline">
            modo cockpit · menu recolhido
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {dados?.lotes.features.filter(f => f.properties.status !== 'potencial').map(f => (
            <button key={f.properties.id} onClick={() => escolher(f.properties)}
              className={`rounded-lg px-2.5 py-1 text-[11px] border transition-colors font-mono ${
                f.properties.id === loteAtivo?.id
                  ? 'border-[#00ff6466] bg-[#00ff640d] text-white' : 'border-white/12 text-white/55 hover:border-white/30'}`}>
              {f.properties.id} · {f.properties.confianca}
            </button>
          ))}
        </div>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {/* ── o retângulo e os instrumentos ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-3.5 items-stretch">
        <div className="zd-card-glow rounded-2xl overflow-hidden relative">
          <div ref={caixaMapa} style={{ height: '100%', minHeight: 600 }} />

          <div className="zd-hud-canto no" style={{ position: 'absolute' }} />
          <div className="zd-hud-canto ne" style={{ position: 'absolute' }} />
          <div className="zd-hud-canto so" style={{ position: 'absolute' }} />
          <div className="zd-hud-canto se" style={{ position: 'absolute' }} />

          {/* régua de telemetria ao vivo */}
          <div className="font-mono text-[9px] tracking-[.14em] text-white/55 flex gap-4 items-center"
            style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: '#02120ae0', padding: '5px 15px', zIndex: 2,
              clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
            }}>
            <span>LAT <b className="text-white/90">{telemetria ? grau(telemetria.lat, 'lat') : '…'}</b></span>
            <span>LON <b className="text-white/90">{telemetria ? grau(telemetria.lon, 'lon') : '…'}</b></span>
            <span>ZOOM <b className="text-white/90">{telemetria ? telemetria.zoom.toFixed(1) : '…'}</b></span>
            <span>CAMADA <b style={{ color: 'var(--zd-acento, #00e5ff)' }}>SATÉLITE</b></span>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--zd-marca, #00ff64)' }}>
              <i className="zd-rec" /> MRV
            </span>
          </div>

          <div className="rounded-lg px-3 py-2"
            style={{ position: 'absolute', top: 58, left: 14, zIndex: 2, background: '#02120ae6' }}>
            <div className="text-[8px] tracking-[.2em] text-[color:var(--zd-acento,#00e5ff)] font-mono uppercase mb-1.5">Legenda</div>
            {Object.entries(ROTULO_STATUS).map(([k, rotulo]) => (
              <div key={k} className="flex items-center gap-2 py-0.5 text-[10.5px] text-white/70">
                <span style={{
                  width: 15, height: 9, border: `1.5px ${k === 'potencial' ? 'dashed' : 'solid'} ${COR_STATUS[k]}`,
                  background: k === 'potencial' ? 'transparent' : `${COR_STATUS[k]}2e`,
                }} />
                {rotulo}
              </div>
            ))}
          </div>
        </div>

        {/* ── os três visualizadores, na altura do mapa ─────────────────── */}
        <aside className="flex flex-col gap-3.5">
          <div className="zd-card-glow rounded-2xl p-4" style={{ flex: 1.2 }}>
            {!loteAtivo && <div className="text-xs text-white/45">🛰️ Clique num lote do mapa.</div>}
            {loteAtivo && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[8.5px] tracking-[.2em] font-mono uppercase text-[color:var(--zd-acento,#00e5ff)] mb-1">
                      Lote · {ROTULO_STATUS[loteAtivo.status]}
                    </div>
                    <div className="font-heading font-bold text-[15px] leading-tight">{loteAtivo.nome}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">
                      {loteAtivo.id} · {loteAtivo.ha} ha{loteAtivo.cultura ? ` · ${loteAtivo.cultura}` : ''}
                    </div>
                  </div>
                  {loteAtivo.status !== 'potencial' && (
                    <div className="text-right shrink-0">
                      <div className="font-heading text-3xl font-bold" style={{ color: COR_SELO[loteAtivo.selo] }}>
                        {loteAtivo.confianca}
                      </div>
                      <div className="text-[8px] tracking-wider text-white/40 font-mono uppercase">selo {loteAtivo.selo}</div>
                    </div>
                  )}
                </div>

                {trilha?.decomposicao && (
                  <div className="mt-3 space-y-1">
                    {trilha.decomposicao.slice(0, 4).map(f => (
                      <div key={f.tipo} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-white/60 capitalize truncate">{f.tipo.replace(/-/g, ' ')}</span>
                        <b className="font-mono text-[9.5px] shrink-0" style={{ color: COR_SELO[f.selo] }}>
                          {f.selo} {f.confianca}{fraco?.tipo === f.tipo ? ' ← fraco' : ''}
                        </b>
                      </div>
                    ))}
                  </div>
                )}

                {verificacao && (
                  <div className={`text-[10.5px] mt-2.5 leading-snug ${verificacao.integra ? 'text-[#00ff64]' : 'text-[#ff4d8d]'}`}>
                    {verificacao.integra
                      ? `⛓ Cadeia íntegra · ${verificacao.registros} elos lacrados`
                      : `⚠ Cadeia quebrada: ${verificacao.quebras.map(q => `posição ${q.posicao}`).join(', ')}`}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={verificar}
                    className="flex-1 rounded-lg border border-white/15 hover:border-[#00ff6466] px-2 py-1.5 text-[10.5px] text-white/70 transition-colors">
                    ⛓ Verificar cadeia
                  </button>
                  <Link to={`/p/${loteAtivo.id}`} target="_blank"
                    className="flex-1 rounded-lg border border-white/15 hover:border-[#00e5ff66] px-2 py-1.5 text-[10.5px] text-white/70 transition-colors text-center">
                    Passaporte ↗
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="zd-card rounded-2xl p-4" style={{ flex: 1 }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8.5px] tracking-[.2em] font-mono uppercase text-white/40">
                NDVI · Sentinel-2 {ndvi ? `· ${ndvi.serie.length} quinzenas` : ''}
              </span>
              {ndvi && (
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${ndvi.modo === 'real'
                  ? 'text-[#00ff64] border-[#00ff6455]' : 'text-[#a855f7] border-[#a855f755]'}`} title={ndvi.fonte}>
                  {ndvi.modo === 'real' ? 'AO VIVO' : 'DEMO'}
                </span>
              )}
            </div>
            {!ndvi && <div className="text-[10.5px] text-white/35">Aguardando lote…</div>}
            {ndvi && (
              <>
                <svg viewBox="0 0 300 58" className="w-full" style={{ height: 58 }}>
                  <polyline fill="none" stroke="#00e5ff44" strokeWidth="1" strokeDasharray="3 3" points="2,54 298,54" />
                  <polyline fill="none" stroke="#00ff64" strokeWidth="1.7"
                    points={ndvi.serie.map((p, i) =>
                      `${(i / (ndvi.serie.length - 1)) * 296 + 2},${54 - (p.ndvi - 0.2) / 0.7 * 48}`).join(' ')} />
                </svg>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[9.5px] font-mono text-white/45">
                    média {ndvi.media} · tend. {ndvi.tendencia >= 0 ? '+' : ''}{ndvi.tendencia}
                  </span>
                  <button onClick={ndviParaEvidencia}
                    className="text-[9.5px] font-mono rounded border border-white/15 hover:border-[#00ff6466] px-2 py-0.5 text-white/60 transition-colors">
                    ⛓ virar evidência
                  </button>
                </div>
                {ndviAviso && (
                  <div className={`text-[9.5px] mt-1.5 leading-snug ${ndviAviso.ok ? 'text-[#00ff64]' : 'text-[#ffc531]'}`}>
                    {ndviAviso.texto}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="zd-card rounded-2xl p-4 overflow-hidden" style={{ flex: 1.1 }}>
            <div className="text-[8.5px] tracking-[.2em] font-mono uppercase text-white/40 mb-1.5">
              Barramento · agora
            </div>
            {eventos.slice(0, 6).map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-[3px] border-b border-white/5 last:border-0">
                <span className="text-[10px] text-white/60 font-mono truncate">{e.tipo}</span>
                <span className="text-[9px] font-mono shrink-0" style={{ color: COR_SELO[e.selo] || '#ffffff77' }}>
                  {e.selo} {e.confianca}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── régua inferior, na largura do retângulo ───────────────────────── */}
      {dados && (
        <div className="grid md:grid-cols-[repeat(4,1fr)_1.7fr] gap-3.5">
          {[
            [dados.totais.hectares.toLocaleString('pt-BR'), 'ha sob manejo', '#00ff64'],
            [dados.totais.lotes, 'lotes ativos', '#00e5ff'],
            [dados.totais.potencialHa.toLocaleString('pt-BR'), 'ha potenciais', '#ffc531'],
            [adesaoTotal ? Math.round(adesaoTotal.resumo.co2eSequestradoTonAno).toLocaleString('pt-BR') : '…',
              'tCO₂e/ano · potencial · EST', '#a855f7'],
          ].map(([v, l, cor]) => (
            <div key={l} className="zd-stat-card rounded-xl px-4 py-3">
              <div className="font-heading text-xl font-bold" style={{ color: cor }}>{v}</div>
              <div className="text-[9px] tracking-[.14em] font-mono uppercase text-white/40 mt-0.5">{l}</div>
            </div>
          ))}
          <div className="zd-card rounded-xl px-4 py-3 flex items-center gap-3" style={{ borderColor: '#ffc53133' }}>
            <div className="flex-1 min-w-0">
              <div className="text-[8.5px] tracking-[.18em] font-mono uppercase text-[#ffc531] mb-1">Editais · radar</div>
              <div className="text-[11px] text-white/70 truncate">
                {editais.length ? editais.map(e => e.nome || e.titulo).slice(0, 2).join(' · ') : 'sem editais no radar'}
              </div>
            </div>
            <button onClick={() => setDetalheAberto(v => !v)}
              className="rounded-lg border border-white/15 hover:border-[#00e5ff66] px-3 py-1.5 text-[10.5px] text-white/70 transition-colors shrink-0">
              {detalheAberto ? 'Fechar detalhe' : 'Cockpit completo →'}
            </button>
          </div>
        </div>
      )}

      {dados?.demonstracao && (
        <div className="text-[10.5px] text-white/35">◌ {dados.aviso}</div>
      )}

      {/* ── o detalhe completo, uma dobra abaixo ──────────────────────────── */}
      {detalheAberto && (
        <div className="grid md:grid-cols-3 gap-3.5 items-start">
          <div className="zd-card rounded-2xl p-5">
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-3">
              Ranking regenerativo · cooperativas
            </div>
            {coop?.ranking.map((c, i) => (
              <div key={c.nome} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-[11px] font-mono text-white/35 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-[12.5px] text-white/85 font-semibold">{c.nome}</div>
                  <div className="text-[10px] text-white/40">{c.ha.toLocaleString('pt-BR')} ha · {c.lotes.join(', ')}</div>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: COR_SELO[c.selo] }}>
                  {c.selo} {c.confianca}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-white/35 mt-2.5">
              O selo da cooperativa é o elo mais fraco dos lotes que ela agrega: subir junto é o jogo.
            </p>
          </div>

          <div className="zd-card rounded-2xl p-5" style={{ borderColor: '#a855f733' }}>
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-[#a855f7] mb-3">
              Se o município inteiro aderir · motor 360°
            </div>
            {adesaoTotal && (
              <>
                <div className="space-y-2">
                  {[
                    ['Área total', `${(dados.totais.hectares + dados.totais.potencialHa).toLocaleString('pt-BR')} ha`],
                    ['Pessoas alimentadas/ano', adesaoTotal.resumo.pessoasAlimentadasAno.toLocaleString('pt-BR')],
                    ['Mitigação estimada', `${adesaoTotal.resumo.co2eSequestradoTonAno.toLocaleString('pt-BR')} tCO₂e/ano`],
                    ['Valor econômico', `R$ ${Math.round(adesaoTotal.resumo.impactoEconomicoReais).toLocaleString('pt-BR')}/ano`],
                    ['ODS tocados', adesaoTotal.resumo.odsAtendidos],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/50">{l}</span>
                      <b className="text-white/90 font-mono text-[11.5px]">{v}</b>
                    </div>
                  ))}
                </div>
                <div className="text-[9.5px] font-mono text-[#a855f7] mt-3">
                  ◌ ESTIMATIVA · cenário conservador, mandioca · projeção do motor, não medida
                </div>
              </>
            )}
          </div>

          <div className="zd-card rounded-2xl p-5" style={{ borderColor: '#ffc53133' }}>
            <div className="text-[9px] tracking-[.2em] font-mono uppercase text-[#ffc531] mb-3">
              Editais compatíveis · radar
            </div>
            {editais.map(e => (
              <div key={e.id || e.nome} className="py-2 border-b border-white/5 last:border-0">
                <div className="text-[12.5px] text-white/85 font-semibold leading-snug">{e.nome || e.titulo}</div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  {e.orgao || e.fonte || ''}{e.prazo ? ` · até ${String(e.prazo).slice(0, 10)}` : ''}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-white/35 mt-2.5">
              A aderência fina por projeto vive em <b className="text-white/60">Crescer → Editais</b>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
