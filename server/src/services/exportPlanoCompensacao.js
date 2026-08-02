// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO DO PLANO DE COMPENSAÇÃO — HTML diagramado e DOCX
// Documento pronto para board, investidor, edital e relatório ESG.
// ═══════════════════════════════════════════════════════════════════════════
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const brl = (v) => `R$ ${num(v, 0)}`;

// ── HTML ──────────────────────────────────────────────────────────────────
export function planoCompensacaoHtml(registro, user) {
  const { plano, inventario } = registro;
  const m = plano.medir, red = plano.reduzir, comp = plano.compensar;

  const barra = (pct, cor) =>
    `<div class="bar"><div style="width:${Math.min(100, pct)}%;background:${cor}"></div></div>`;

  const linhasFontes = m.maioresFontes.map(f => `
    <tr><td>${esc(f.label)}</td><td>Escopo ${f.escopo}</td><td class="r"><b>${num(f.tco2e)}</b> t</td>
    <td class="dim">${esc(f.fator)}</td></tr>`).join('');

  const linhasAcoes = red.acoes.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${esc(a.titulo)}</b><br><span class="dim">${esc(a.como)}</span></td>
      <td class="r"><b style="color:#00ff64">${num(a.potencialReducaoTon)}</b> t<br><span class="dim">${a.percentualDoTotal}% do total</span></td>
      <td><span class="chip">${esc(a.custoRelativo)}</span><br><span class="dim">${esc(a.prazo)}</span></td>
    </tr>`).join('');

  const linhasRoadmap = red.roadmap.map(r => `
    <tr>
      <td><b>Ano ${r.ano}</b></td>
      <td>${barra(r.percentualReduzido, '#00ff64')}<span class="dim">${r.percentualReduzido}% reduzido</span></td>
      <td class="r">${num(r.reducaoAcumuladaTon)} t</td>
      <td class="r">${num(r.emissaoResidualTon)} t</td>
      <td class="dim">${r.acoesFoco.map(esc).join(' · ') || '—'}</td>
    </tr>`).join('');

  const linhasCredito = comp.rotaCredito.opcoes.map(o => `
    <tr><td><b>${esc(o.nome)}</b><br><span class="dim">${esc(o.padrao)}</span></td>
    <td class="r">${brl(o.precoPorTon)}/t</td><td class="r"><b>${brl(o.custoTotal)}</b>/ano</td></tr>`).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Plano de Compensação — ZoomDev OS</title>
<style>
  body{background:#030d07;color:#eaffea;font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:40px;line-height:1.6}
  .wrap{max-width:920px;margin:0 auto}
  h1{font-size:27px;margin:0}h2{font-size:15px;color:#00ff64;margin:34px 0 12px;text-transform:uppercase;letter-spacing:.08em}
  h3{font-size:14px;margin:20px 0 8px;color:#9adfff}
  .sub{color:#ffffff88;font-size:13px;margin-top:6px}
  .grad{background:linear-gradient(135deg,#00ff64,#00c8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .steps{display:flex;gap:10px;margin:24px 0}
  .step{flex:1;border:1px solid #00ff6426;background:#05140a;border-radius:12px;padding:14px;text-align:center}
  .step .n{font-size:11px;color:#ffffff55}.step .t{font-size:15px;font-weight:700;color:#00ff64;margin-top:3px}
  .step .v{font-size:20px;font-weight:700;margin-top:6px}
  .card{border:1px solid #ffffff14;background:#05140a;border-radius:14px;padding:18px;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  td,th{padding:9px 8px;border-bottom:1px solid #ffffff11;text-align:left;vertical-align:top}
  th{color:#ffffff66;font-size:10.5px;text-transform:uppercase}.r{text-align:right}
  .dim{color:#ffffff55;font-size:11px}
  .chip{display:inline-block;border:1px solid #00c8ff33;border-radius:99px;padding:1px 8px;font-size:10.5px;color:#9adfff}
  .bar{height:7px;background:#ffffff12;border-radius:99px;overflow:hidden;margin-bottom:3px}.bar div{height:100%;border-radius:99px}
  .ok{border-left:3px solid #00ff64;padding-left:12px;margin:8px 0}
  .no{border-left:3px solid #ff6b6b;padding-left:12px;margin:8px 0;color:#ffb3b3}
  .foot{margin-top:40px;color:#ffffff44;font-size:11px;border-top:1px solid #ffffff11;padding-top:14px}
  li{margin-bottom:6px}
</style></head><body><div class="wrap">
  <h1>Plano de <span class="grad">Compensação de Carbono</span></h1>
  <div class="sub">${esc(user?.nome || 'Organização')} · gerado em ${new Date(plano.geradoEm).toLocaleString('pt-BR')} · horizonte de ${plano.horizonteAnos} anos</div>

  <div class="steps">
    <div class="step"><div class="n">ETAPA 1</div><div class="t">MEDIR</div><div class="v">${num(m.totalTco2eAno)} t</div><div class="dim">CO₂e/ano</div></div>
    <div class="step"><div class="n">ETAPA 2</div><div class="t">REDUZIR</div><div class="v">${red.metaPercentual}%</div><div class="dim">meta em ${plano.horizonteAnos} anos</div></div>
    <div class="step"><div class="n">ETAPA 3</div><div class="t">COMPENSAR</div><div class="v">${num(comp.aCompensarTonAno)} t</div><div class="dim">residual + margem</div></div>
  </div>

  <h2>1. Medir — inventário de emissões</h2>
  <div class="card">
    <p>Total estimado: <b style="color:#00ff64;font-size:18px">${num(m.totalTco2eAno)} tCO₂e/ano</b>
    <span class="dim">(faixa de ${num(m.incerteza.minimo)} a ${num(m.incerteza.maximo)} t · incerteza ±${m.incerteza.percentual}%)</span></p>
    <p class="dim">${esc(m.incerteza.nota)}</p>
    <h3>Por escopo</h3>
    <table><tr><th>Escopo</th><th>Emissão</th><th>Descrição</th></tr>
      <tr><td><b>1</b> Direto</td><td class="r"><b>${num(m.escopos.escopo1.tco2e)}</b> t</td><td class="dim">${esc(m.escopos.escopo1.descricao)}</td></tr>
      <tr><td><b>2</b> Energia</td><td class="r"><b>${num(m.escopos.escopo2.tco2e)}</b> t</td><td class="dim">${esc(m.escopos.escopo2.descricao)}</td></tr>
      <tr><td><b>3</b> Cadeia</td><td class="r"><b>${num(m.escopos.escopo3.tco2e)}</b> t</td><td class="dim">${esc(m.escopos.escopo3.descricao)}</td></tr>
    </table>
    <h3>Maiores fontes</h3>
    <table><tr><th>Fonte</th><th>Escopo</th><th class="r">Emissão</th><th>Fator</th></tr>${linhasFontes}</table>
    <p class="dim" style="margin-top:12px">Metodologia: ${esc(m.metodologia)}</p>
  </div>

  <h2>2. Reduzir — antes de compensar</h2>
  <div class="card">
    <p>Meta: <b style="color:#00ff64">reduzir ${red.metaPercentual}%</b> (${num(red.metaTonAno)} tCO₂e/ano) em ${plano.horizonteAnos} anos.
    Potencial técnico identificado: ${num(red.potencialTotalTon)} t.</p>
    <h3>Ações priorizadas por impacto e custo</h3>
    <table><tr><th>#</th><th>Ação</th><th class="r">Potencial</th><th>Custo / prazo</th></tr>${linhasAcoes || '<tr><td colspan="4" class="dim">Nenhuma oportunidade identificada para as fontes informadas.</td></tr>'}</table>
    <h3>Roadmap</h3>
    <table><tr><th>Período</th><th>Progresso</th><th class="r">Reduzido</th><th class="r">Residual</th><th>Foco</th></tr>${linhasRoadmap}</table>
  </div>

  <h2>3. Compensar — apenas o residual</h2>
  <div class="card">
    <p>Emissão residual após as reduções: <b>${num(comp.residualTonAno)} tCO₂e/ano</b>.
    Com margem de segurança de ${comp.margemSeguranca}%: <b style="color:#00c8ff">${num(comp.aCompensarTonAno)} tCO₂e/ano a compensar</b>.</p>
    ${comp.rotaPropria ? `
    <h3>Rota A — ${esc(comp.rotaPropria.rota)}</h3>
    <p>${esc(comp.rotaPropria.cultura)} em ${num(comp.rotaPropria.hectares, 0)} ha · mitigação estimada de
    <b style="color:#00ff64">${num(comp.rotaPropria.mitigacaoTonAno)} tCO₂e/ano</b> (${comp.rotaPropria.coberturaPercentual}% do necessário).</p>
    <p class="dim">${esc(comp.rotaPropria.vantagem)}</p>
    <p class="dim">Requisitos: ${comp.rotaPropria.requisitos.map(esc).join(' · ')}</p>` : ''}
    <h3>Rota B — ${esc(comp.rotaCredito.rota)}</h3>
    <table><tr><th>Projeto</th><th class="r">Preço</th><th class="r">Custo anual</th></tr>${linhasCredito}</table>
    <p class="dim">${esc(comp.rotaCredito.vantagem)}</p>
  </div>

  <h2>4. Conformidade na comunicação</h2>
  <div class="card">
    <h3>✅ O que você pode afirmar</h3>
    ${plano.conformidade.podeAfirmar.map(x => `<div class="ok">${esc(x)}</div>`).join('')}
    <h3>🚫 O que NÃO pode afirmar</h3>
    ${plano.conformidade.naoPodeAfirmar.map(x => `<div class="no">${esc(x)}</div>`).join('')}
    <p class="dim" style="margin-top:12px">Referência: ${esc(plano.conformidade.norma)}</p>
  </div>

  <h2>5. Alinhamento ODS</h2>
  <div class="card"><ul>${plano.ods.map(o => `<li><b>ODS ${o.ods} — ${esc(o.nome)}:</b> ${esc(o.motivo)}</li>`).join('')}</ul></div>

  <div class="foot">Gerado pela ZoomDev OS · Hierarquia de mitigação: medir → reduzir → compensar.
  Estimativa de triagem; a emissão de créditos exige MRV instrumentado, verificação por terceira parte e aposentadoria em registro público.</div>
</div></body></html>`;
}

// ── DOCX ──────────────────────────────────────────────────────────────────
const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: String(text), ...opts })], spacing: { after: 120 } });
const H = (text, level = HeadingLevel.HEADING_1) => new Paragraph({ text: String(text), heading: level, spacing: { before: 260, after: 130 } });

function tabela(cabecalho, linhas) {
  const cell = (t, bold = false) => new TableCell({
    width: { size: 100 / cabecalho.length, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text: String(t), bold, size: 19 })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: cabecalho.map(h => cell(h, true)) }),
      ...linhas.map(l => new TableRow({ children: l.map(c => cell(c)) })),
    ],
  });
}

export async function planoCompensacaoDocx(registro, user) {
  const { plano } = registro;
  const m = plano.medir, red = plano.reduzir, comp = plano.compensar;

  const filhos = [
    new Paragraph({ text: 'Plano de Compensação de Carbono', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${user?.nome || 'Organização'} · ${new Date(plano.geradoEm).toLocaleDateString('pt-BR')} · horizonte de ${plano.horizonteAnos} anos`, italics: true, size: 20 })],
    }),
    P('Hierarquia de mitigação: MEDIR → REDUZIR → COMPENSAR. Compensar antes de reduzir não constitui ação climática legítima.', { italics: true }),

    H('1. Medir — inventário de emissões'),
    P(`Total estimado: ${num(m.totalTco2eAno)} tCO₂e por ano (faixa de ${num(m.incerteza.minimo)} a ${num(m.incerteza.maximo)}; incerteza de ±${m.incerteza.percentual}%).`, { bold: true }),
    P(m.incerteza.nota),
    H('Emissões por escopo', HeadingLevel.HEADING_2),
    tabela(['Escopo', 'tCO₂e/ano', 'Descrição'], [
      ['1 — Direto', num(m.escopos.escopo1.tco2e), m.escopos.escopo1.descricao],
      ['2 — Energia', num(m.escopos.escopo2.tco2e), m.escopos.escopo2.descricao],
      ['3 — Cadeia de valor', num(m.escopos.escopo3.tco2e), m.escopos.escopo3.descricao],
    ]),
    H('Maiores fontes', HeadingLevel.HEADING_2),
    tabela(['Fonte', 'Escopo', 'tCO₂e/ano', 'Fator'],
      m.maioresFontes.map(f => [f.label, `Escopo ${f.escopo}`, num(f.tco2e), f.fator])),
    P(`Metodologia: ${m.metodologia}`, { italics: true, size: 18 }),

    H('2. Reduzir'),
    P(`Meta de redução: ${red.metaPercentual}% (${num(red.metaTonAno)} tCO₂e/ano) em ${plano.horizonteAnos} anos. Potencial técnico identificado: ${num(red.potencialTotalTon)} tCO₂e.`, { bold: true }),
    H('Ações priorizadas', HeadingLevel.HEADING_2),
    tabela(['Ação', 'Potencial (t)', '% do total', 'Custo', 'Prazo'],
      red.acoes.map(a => [a.titulo, num(a.potencialReducaoTon), `${a.percentualDoTotal}%`, a.custoRelativo, a.prazo])),
    ...red.acoes.slice(0, 5).flatMap(a => [P(`${a.titulo}`, { bold: true }), P(a.como, { size: 19 })]),
    H('Roadmap plurianual', HeadingLevel.HEADING_2),
    tabela(['Ano', 'Reduzido (t)', 'Residual (t)', '% reduzido', 'Foco'],
      red.roadmap.map(r => [`Ano ${r.ano}`, num(r.reducaoAcumuladaTon), num(r.emissaoResidualTon), `${r.percentualReduzido}%`, r.acoesFoco.join('; ') || '—'])),

    H('3. Compensar'),
    P(`Emissão residual após reduções: ${num(comp.residualTonAno)} tCO₂e/ano. Com margem de segurança de ${comp.margemSeguranca}%, o volume a compensar é de ${num(comp.aCompensarTonAno)} tCO₂e/ano.`, { bold: true }),
  ];

  if (comp.rotaPropria) {
    filhos.push(
      H(`Rota A — ${comp.rotaPropria.rota}`, HeadingLevel.HEADING_2),
      P(`${comp.rotaPropria.cultura} em ${num(comp.rotaPropria.hectares, 0)} ha, com mitigação estimada de ${num(comp.rotaPropria.mitigacaoTonAno)} tCO₂e/ano — cobre ${comp.rotaPropria.coberturaPercentual}% do necessário.`),
      P(comp.rotaPropria.vantagem, { italics: true }),
      P(`Requisitos: ${comp.rotaPropria.requisitos.join(' · ')}`, { size: 18 }),
    );
  }
  filhos.push(
    H(`Rota B — ${comp.rotaCredito.rota}`, HeadingLevel.HEADING_2),
    tabela(['Projeto', 'Padrão', 'R$/t', 'Custo anual'],
      comp.rotaCredito.opcoes.map(o => [o.nome, o.padrao, brl(o.precoPorTon), brl(o.custoTotal)])),
    P(comp.rotaCredito.vantagem, { italics: true }),

    H('4. Conformidade na comunicação'),
    H('O que pode ser afirmado', HeadingLevel.HEADING_2),
    ...plano.conformidade.podeAfirmar.map(x => P(`✓ ${x}`)),
    H('O que NÃO pode ser afirmado', HeadingLevel.HEADING_2),
    ...plano.conformidade.naoPodeAfirmar.map(x => P(`✗ ${x}`)),
    P(`Referência normativa: ${plano.conformidade.norma}`, { italics: true, size: 18 }),

    H('5. Alinhamento com os ODS'),
    ...plano.ods.map(o => P(`ODS ${o.ods} — ${o.nome}: ${o.motivo}`)),

    P('Documento gerado pela ZoomDev OS. Estimativa de triagem; a emissão de créditos de carbono exige MRV instrumentado, verificação por terceira parte acreditada e aposentadoria em registro público.', { italics: true, size: 17 }),
  );

  return Packer.toBuffer(new Document({ sections: [{ children: filhos }] }));
}
