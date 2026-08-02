// Relatório HTML diagramado do Plano de Negócios: usado na visualização e na geração do PDF.
// Gráficos em SVG inline (barras de projeção, quadrantes SWOT, score de aderência).

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`;

function barrasProjecao(projecao) {
  if (!projecao?.length) return '';
  const max = Math.max(...projecao.map(p => p.receita), 1);
  const W = 720, H = 220, pad = 34;
  const bw = (W - pad * 2) / projecao.length - 8;
  const bars = projecao.map((p, i) => {
    const h = Math.max(3, (p.receita / max) * (H - pad * 2));
    const x = pad + i * ((W - pad * 2) / projecao.length) + 4;
    const y = H - pad - h;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" fill="url(#gz)"/>
      <text x="${x + bw / 2}" y="${H - pad + 16}" font-size="10" fill="#557" text-anchor="middle">M${p.mes}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px">
    <defs><linearGradient id="gz" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#00c8ff"/><stop offset="100%" stop-color="#00e05a"/>
    </linearGradient></defs>
    <text x="${pad}" y="18" font-size="12" fill="#345" font-weight="700">Receita projetada (12 meses): pico ${fmtBRL(max)}</text>
    ${bars}
  </svg>`;
}

function quadranteSwot(swot) {
  if (!swot) return '';
  const box = (titulo, itens, cor) => `
    <div style="border:1.5px solid ${cor};border-radius:10px;padding:12px 14px">
      <div style="font-weight:700;color:${cor};font-size:13px;text-transform:uppercase;letter-spacing:.04em">${titulo}</div>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.55">
        ${(itens || []).map(i => `<li>${esc(i)}</li>`).join('')}
      </ul>
    </div>`;
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    ${box('Forças', swot.forcas, '#0a9a50')}
    ${box('Fraquezas', swot.fraquezas, '#c04a10')}
    ${box('Oportunidades', swot.oportunidades, '#0a7ab0')}
    ${box('Ameaças', swot.ameacas, '#a02040')}
  </div>`;
}

function scoreBar(valor) {
  return `<div style="background:#e8efe9;border-radius:6px;height:10px;width:140px;display:inline-block;vertical-align:middle">
    <div style="background:linear-gradient(90deg,#00c060,#00a8d8);height:10px;border-radius:6px;width:${Math.min(100, valor)}%"></div>
  </div> <b>${valor}</b>/100`;
}

export function planoParaHtml(projeto) {
  const p = projeto.plano;
  if (!p) return '<p>Plano ainda não gerado.</p>';
  const bio = projeto.classificacao === 'biostartup';
  const section = (emoji, titulo, corpo) => `
    <section style="margin:26px 0;page-break-inside:avoid">
      <h2 style="font-size:19px;border-bottom:2.5px solid #00c060;padding-bottom:6px;color:#0c2a18">${emoji} ${titulo}</h2>
      ${corpo}
    </section>`;
  const lista = (itens) => `<ul style="padding-left:20px;line-height:1.7">${(itens || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const kv = (rows) => `<table style="width:100%;border-collapse:collapse;font-size:13px">${rows.map(([k, v]) =>
    `<tr><td style="padding:7px 10px;border:1px solid #dde7de;background:#f2f8f3;font-weight:600;width:180px">${esc(k)}</td><td style="padding:7px 10px;border:1px solid #dde7de">${v}</td></tr>`).join('')}</table>`;

  return `
<div style="font-family:'Segoe UI',Inter,Arial,sans-serif;color:#17251c;max-width:820px;margin:0 auto;padding:8px 4px">
  <header style="background:linear-gradient(135deg,#04120a,#0a2f1a);border-radius:14px;padding:30px 34px;color:#fff;margin-bottom:8px">
    <div style="font-size:11px;letter-spacing:.22em;color:#00e05a;font-weight:700">ZOOMDEV OS · PLANO DE NEGÓCIOS QUALIFICADO</div>
    <h1 style="margin:10px 0 4px;font-size:30px">${esc(projeto.nome)}</h1>
    <div style="color:#9fd8b4;font-size:13px">
      ${bio ? '🌿 BioStartup: trilha bioeconomia amazônica' : '🚀 Startup'} · Vertical: ${esc(projeto.vertical || '–')} · Gerado em ${new Date(p.geradoEm).toLocaleDateString('pt-BR')} pelos 5 agentes ZoomDev
    </div>
    <p style="margin:14px 0 0;font-size:14.5px;line-height:1.6;color:#e6f5ea">${esc(p.produto?.propostaDeValor)}</p>
  </header>

  ${section('🧩', 'Produto: Agente Produto', `
    ${kv([
      ['Problema', esc(p.produto.problema)],
      ['Solução', esc(p.produto.solucao)],
      ['Público-alvo', esc(p.produto.publicoAlvo)],
    ])}
    <h3 style="font-size:14px;margin:14px 0 6px">Personas</h3>
    ${(p.produto.personas || []).map(pe => `<p style="margin:4px 0;font-size:13px"><b>${esc(pe.nome)}</b>: ${esc(pe.descricao)}. <i>Dor: ${esc(pe.dor)}</i></p>`).join('')}
    <h3 style="font-size:14px;margin:14px 0 6px">Funcionalidades do MVP</h3>${lista(p.produto.funcionalidadesMvp)}
    <h3 style="font-size:14px;margin:14px 0 6px">Diferenciais</h3>${lista(p.produto.diferenciais)}
  `)}

  ${section('📊', 'Negócio: Agente Negócio', `
    <p style="font-size:13.5px">${esc(p.negocio.modeloDeNegocio)}</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0">
      ${[['TAM', p.negocio.mercado.tam], ['SAM', p.negocio.mercado.sam], ['SOM', p.negocio.mercado.som]].map(([l, v]) => `
        <div style="border:1.5px solid #bfe6cc;border-radius:10px;padding:12px;text-align:center;background:#f4fbf6">
          <div style="font-size:11px;color:#3a6b4a;font-weight:700">${l}</div>
          <div style="font-size:17px;font-weight:800;color:#0c5c30">${esc(v)}</div>
        </div>`).join('')}
    </div>
    <p style="font-size:12px;color:#456">${esc(p.negocio.mercado.contexto)}</p>
    ${barrasProjecao(p.negocio.projecao12Meses)}
    <h3 style="font-size:14px;margin:16px 0 6px">Concorrência</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">
      <tr style="background:#0c2a18;color:#fff"><th style="padding:7px;text-align:left">Concorrente</th><th style="padding:7px;text-align:left">Força</th><th style="padding:7px;text-align:left">Fraqueza explorável</th></tr>
      ${(p.negocio.concorrentes || []).map(c => `<tr><td style="padding:7px;border:1px solid #dde7de"><b>${esc(c.nome)}</b></td><td style="padding:7px;border:1px solid #dde7de">${esc(c.forca)}</td><td style="padding:7px;border:1px solid #dde7de">${esc(c.fraqueza)}</td></tr>`).join('')}
    </table>
    <h3 style="font-size:14px;margin:16px 0 6px">Pricing</h3>${lista(p.negocio.pricing)}
    <h3 style="font-size:14px;margin:16px 0 6px">Go-to-market</h3>${lista(p.negocio.goToMarket)}
    <h3 style="font-size:14px;margin:16px 0 8px">Análise SWOT</h3>
    ${quadranteSwot(p.negocio.swot)}
  `)}

  ${section('⚙️', 'Engenharia: Agente Engenharia', `
    ${kv([
      ['Arquitetura', esc(p.engenharia.arquitetura)],
      ['Custo de infra', esc(p.engenharia.custoInfraEstimado)],
    ])}
    <h3 style="font-size:14px;margin:14px 0 6px">Stack</h3>${lista(p.engenharia.stack)}
    <h3 style="font-size:14px;margin:14px 0 6px">Roadmap técnico</h3>
    ${(p.engenharia.roadmapTecnico || []).map(f => `
      <div style="border-left:3px solid #00a8d8;padding:6px 12px;margin:8px 0;background:#f3fafc">
        <b>${esc(f.fase)}</b> <span style="color:#567;font-size:12px">(${esc(f.duracao)})</span>
        ${lista(f.entregas)}
      </div>`).join('')}
    <h3 style="font-size:14px;margin:14px 0 6px">Riscos técnicos</h3>${lista(p.engenharia.riscosTecnicos)}
  `)}

  ${section('🌍', 'Impacto: Agente Impacto', `
    <h3 style="font-size:14px;margin:4px 0 6px">ODS da ONU</h3>
    ${(p.impacto.ods || []).map(o => `<p style="margin:4px 0;font-size:13px"><b style="color:#0a7ab0">ODS ${o.numero}, ${esc(o.nome)}:</b> ${esc(o.contribuicao)}</p>`).join('')}
    <h3 style="font-size:14px;margin:14px 0 6px">KPIs de impacto</h3>${lista(p.impacto.kpisImpacto)}
    <h3 style="font-size:14px;margin:14px 0 6px">Práticas ESG</h3>${lista(p.impacto.praticasEsg)}
    <h3 style="font-size:14px;margin:14px 0 6px">Riscos e mitigação</h3>
    ${(p.impacto.riscos || []).map(r => `<p style="margin:4px 0;font-size:13px">⚠️ <b>${esc(r.risco)}</b> → ${esc(r.mitigacao)}</p>`).join('')}
    <p style="font-size:13px;background:#f0f9f2;border:1px solid #cde8d5;border-radius:8px;padding:10px">🍃 <b>Pegada de carbono:</b> ${esc(p.impacto.pegadaCarbono)}</p>
  `)}

  ${section('📋', 'Editais & Fomento: Agente Editais', `
    ${(p.editais.editaisRecomendados || []).map(e => `
      <div style="border:1px solid #dde7de;border-radius:10px;padding:12px 14px;margin:8px 0">
        <b>${esc(e.nome)}</b> <span style="color:#567;font-size:12px">· ${esc(e.orgao)}</span><br/>
        <span style="font-size:12px">Aderência: ${scoreBar(e.aderencia)}</span>
        <p style="margin:6px 0 0;font-size:12.5px;color:#345">${esc(e.motivo)}</p>
      </div>`).join('')}
    <h3 style="font-size:14px;margin:14px 0 6px">Documentação necessária</h3>${lista(p.editais.documentacaoNecessaria)}
    <h3 style="font-size:14px;margin:14px 0 6px">Dicas de submissão</h3>${lista(p.editais.dicasSubmissao)}
  `)}

  <footer style="margin-top:30px;padding-top:12px;border-top:1px solid #cde;color:#789;font-size:11px">
    Gerado pela ZoomDev OS (${esc(p.modelo)}) · IDEA TO EXIT · Este plano é insumo vivo: a fase de Validação da sua jornada já está desbloqueada com missões derivadas deste documento.
  </footer>
</div>`;
}

export function paginaHtml(projeto) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Plano de Negócios: ${esc(projeto.nome)}</title>
<style>@page{margin:18mm 14mm} body{margin:0;background:#fff}</style>
</head><body>${planoParaHtml(projeto)}</body></html>`;
}
