// Exportação do Plano de Negócios em DOCX (lib docx — puro JS).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx';

const VERDE = '00A651';
const ESCURO = '0C2A18';
const CIANO = '0077A8';

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 }, children: [new TextRun({ text: t, color: ESCURO, bold: true })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, children: [new TextRun({ text: t, color: VERDE, bold: true })] });
const p = (t, opts = {}) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: String(t ?? ''), size: 22, ...opts })] });
const bullet = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: String(t ?? ''), size: 22 })] });
const bullets = (itens) => (itens || []).map(bullet);

function cell(text, { bold = false, fill = null, width = null } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold, size: 20, color: fill === ESCURO ? 'FFFFFF' : undefined })] })],
  });
}

function tabela(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCDDCF' },
    },
    rows,
  });
}

// "Gráfico" de barras em tabela: coluna de mês + barra proporcional com blocos sombreados
function projecaoTabela(projecao) {
  if (!projecao?.length) return [];
  const max = Math.max(...projecao.map(x => x.receita), 1);
  const rows = [new TableRow({ children: [cell('Mês', { bold: true, fill: ESCURO }), cell('Receita (R$)', { bold: true, fill: ESCURO }), cell('Clientes', { bold: true, fill: ESCURO }), cell('Evolução', { bold: true, fill: ESCURO, width: 40 })] })];
  for (const m of projecao) {
    const blocos = Math.max(1, Math.round((m.receita / max) * 20));
    rows.push(new TableRow({
      children: [
        cell(`M${m.mes}`),
        cell(m.receita.toLocaleString('pt-BR')),
        cell(String(m.clientes)),
        new TableCell({
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: '█'.repeat(blocos), color: VERDE, size: 18 })] })],
        }),
      ],
    }));
  }
  return [tabela(rows)];
}

function swotTabela(swot) {
  if (!swot) return [];
  const quad = (titulo, itens, cor) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({ children: [new TextRun({ text: titulo, bold: true, color: cor, size: 22 })] }),
      ...(itens || []).map(i => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: i, size: 20 })] })),
    ],
  });
  return [tabela([
    new TableRow({ children: [quad('FORÇAS', swot.forcas, VERDE), quad('FRAQUEZAS', swot.fraquezas, 'C0501A')] }),
    new TableRow({ children: [quad('OPORTUNIDADES', swot.oportunidades, CIANO), quad('AMEAÇAS', swot.ameacas, 'A02040')] }),
  ])];
}

export async function planoParaDocx(projeto) {
  const pl = projeto.plano;
  const bio = projeto.classificacao === 'biostartup';

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
      children: [new TextRun({ text: 'ZOOMDEV OS · PLANO DE NEGÓCIOS QUALIFICADO', color: VERDE, bold: true, size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 40 },
      children: [new TextRun({ text: projeto.nome, bold: true, size: 56, color: ESCURO })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({
        text: `${bio ? 'BioStartup — trilha bioeconomia amazônica' : 'Startup'} · ${projeto.vertical || ''} · Gerado em ${new Date(pl.geradoEm).toLocaleDateString('pt-BR')} pelos 5 agentes ZoomDev`,
        size: 20, color: '556655',
      })],
    }),

    h1('1. Produto'),
    p(pl.produto.propostaDeValor, { bold: true }),
    h2('Problema'), p(pl.produto.problema),
    h2('Solução'), p(pl.produto.solucao),
    h2('Público-alvo'), p(pl.produto.publicoAlvo),
    h2('Personas'),
    ...(pl.produto.personas || []).flatMap(pe => [p(`${pe.nome} — ${pe.descricao}. Dor: ${pe.dor}`)]),
    h2('Funcionalidades do MVP'), ...bullets(pl.produto.funcionalidadesMvp),
    h2('Diferenciais'), ...bullets(pl.produto.diferenciais),

    h1('2. Negócio'),
    p(pl.negocio.modeloDeNegocio),
    h2('Mercado'),
    tabela([
      new TableRow({ children: [cell('TAM', { bold: true, fill: ESCURO }), cell('SAM', { bold: true, fill: ESCURO }), cell('SOM', { bold: true, fill: ESCURO })] }),
      new TableRow({ children: [cell(pl.negocio.mercado.tam), cell(pl.negocio.mercado.sam), cell(pl.negocio.mercado.som)] }),
    ]),
    p(pl.negocio.mercado.contexto, { italics: true, size: 20 }),
    h2('Projeção 12 meses'), ...projecaoTabela(pl.negocio.projecao12Meses),
    h2('Concorrência'),
    tabela([
      new TableRow({ children: [cell('Concorrente', { bold: true, fill: ESCURO }), cell('Força', { bold: true, fill: ESCURO }), cell('Fraqueza explorável', { bold: true, fill: ESCURO })] }),
      ...(pl.negocio.concorrentes || []).map(c => new TableRow({ children: [cell(c.nome, { bold: true }), cell(c.forca), cell(c.fraqueza)] })),
    ]),
    h2('Pricing'), ...bullets(pl.negocio.pricing),
    h2('Go-to-market'), ...bullets(pl.negocio.goToMarket),
    h2('Análise SWOT'), ...swotTabela(pl.negocio.swot),

    h1('3. Engenharia'),
    h2('Arquitetura'), p(pl.engenharia.arquitetura),
    h2('Stack'), ...bullets(pl.engenharia.stack),
    h2('Roadmap técnico'),
    ...(pl.engenharia.roadmapTecnico || []).flatMap(f => [p(`${f.fase} (${f.duracao})`, { bold: true }), ...bullets(f.entregas)]),
    h2('Riscos técnicos'), ...bullets(pl.engenharia.riscosTecnicos),
    h2('Custo de infraestrutura'), p(pl.engenharia.custoInfraEstimado),

    h1('4. Impacto'),
    h2('ODS da ONU'),
    ...(pl.impacto.ods || []).map(o => p(`ODS ${o.numero} — ${o.nome}: ${o.contribuicao}`)),
    h2('KPIs de impacto'), ...bullets(pl.impacto.kpisImpacto),
    h2('Práticas ESG'), ...bullets(pl.impacto.praticasEsg),
    h2('Riscos e mitigação'),
    ...(pl.impacto.riscos || []).map(r => p(`• ${r.risco} → ${r.mitigacao}`)),
    h2('Pegada de carbono'), p(pl.impacto.pegadaCarbono),

    h1('5. Editais & Fomento'),
    ...(pl.editais.editaisRecomendados || []).flatMap(e => [
      p(`${e.nome} (${e.orgao}) — aderência ${e.aderencia}/100`, { bold: true }),
      p(e.motivo, { size: 20 }),
    ]),
    h2('Documentação necessária'), ...bullets(pl.editais.documentacaoNecessaria),
    h2('Dicas de submissão'), ...bullets(pl.editais.dicasSubmissao),

    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Gerado pela ZoomDev OS (${pl.modelo}) · IDEA TO EXIT`, size: 18, color: '778877' })] }),
  ];

  const doc = new Document({
    creator: 'ZoomDev OS',
    title: `Plano de Negócios — ${projeto.nome}`,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}
