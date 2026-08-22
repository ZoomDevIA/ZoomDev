// ═══════════════════════════════════════════════════════════════════════════
// CONECTOR ISOMETRIC — o registro de remoção durável de carbono (CDR).
//
// A Isometric (registry.isometric.com) é o registro que a ZoomDev usa como
// referência de padrão internacional: dados abertos, verificação paga pelo
// comprador e API pública documentada em docs.isometric.com. Este conector
// lê o registro para alimentar o benchmark de CDR mostrado aos fundadores e
// investidores da plataforma.
//
// Dois modos, escolhidos pelo ambiente, no mesmo espírito do email.js:
//   REAL           com ISOMETRIC_CLIENT_SECRET e ISOMETRIC_TOKEN, fala com a
//                  API de verdade (sandbox ou produção via ISOMETRIC_AMBIENTE)
//   DEMONSTRACAO   sem as chaves, serve um retrato estático do registro no
//                  MESMO formato de resposta, sempre rotulado como demo
//
// A API real exige os dois cabeçalhos em toda chamada (verificado: sem eles,
// produção e sandbox respondem 401) e pagina no estilo Relay:
//   { page_info: { has_next_page, end_cursor }, nodes: [...], total_count }
//
// Honestidade do elo mais fraco: o modo demonstração usa números publicados
// pela própria Isometric e pela imprensa até o fechamento desta versão, e
// toda resposta carrega `modo` e `fonte` para a tela nunca apresentar demo
// como dado vivo. Os nomes de campo do modo real seguem a documentação e
// devem ser conferidos na primeira chamada autenticada (ver normalizar*).
// ═══════════════════════════════════════════════════════════════════════════

const CHAVE_SECRETA = process.env.ISOMETRIC_CLIENT_SECRET || '';
const TOKEN = process.env.ISOMETRIC_TOKEN || '';
const AMBIENTE = (process.env.ISOMETRIC_AMBIENTE || 'sandbox').toLowerCase();

const BASES = {
  sandbox: 'https://api.sandbox.isometric.com/registry/v0',
  producao: 'https://api.isometric.com/registry/v0',
};

export function modoIsometric() {
  return CHAVE_SECRETA && TOKEN ? 'real' : 'demonstracao';
}

export function ambienteIsometric() {
  return BASES[AMBIENTE] ? AMBIENTE : 'sandbox';
}

// ── Camada HTTP do modo real ────────────────────────────────────────────────

async function chamar(caminho, params = {}) {
  const base = BASES[ambienteIsometric()];
  const url = new URL(base + caminho);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const r = await fetch(url, {
    headers: {
      'X-Client-Secret': CHAVE_SECRETA,
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) {
    const detalhe = await r.text().catch(() => '');
    throw Object.assign(
      new Error(`Isometric respondeu ${r.status} em ${caminho}: ${detalhe.slice(0, 200)}`),
      { status: 502 },
    );
  }
  return r.json();
}

// Percorre a paginação Relay até juntar todos os nós (com teto de segurança).
async function todasAsPaginas(caminho, { maxPaginas = 10 } = {}) {
  const nos = [];
  let cursor = null;
  for (let i = 0; i < maxPaginas; i += 1) {
    const pagina = await chamar(caminho, cursor ? { after: cursor } : {});
    nos.push(...(pagina.nodes || []));
    if (!pagina.page_info?.has_next_page) break;
    cursor = pagina.page_info.end_cursor;
  }
  return nos;
}

// ── Normalização ────────────────────────────────────────────────────────────
// A tela fala português e não deve depender do formato do provedor. Tudo que
// sai deste módulo passa por aqui, no modo real e no modo demonstração.

const VIAS = {
  'enhanced-weathering': { id: 'enhanced-weathering', nome: 'Intemperismo de rochas (ERW)', elegivelZoomDev: true },
  biochar: { id: 'biochar', nome: 'Biochar', elegivelZoomDev: true },
  'bio-oil': { id: 'bio-oil', nome: 'Bio-óleo em poço profundo', elegivelZoomDev: false },
  'biomass-storage': { id: 'biomass-storage', nome: 'Armazenamento de biomassa', elegivelZoomDev: false },
  dac: { id: 'dac', nome: 'Captura direta do ar (DAC)', elegivelZoomDev: false },
  outro: { id: 'outro', nome: 'Outras vias', elegivelZoomDev: false },
};

function via(id) {
  return VIAS[id] || { ...VIAS.outro, id: id || 'outro' };
}

function normalizarProjeto(bruto) {
  return {
    id: bruto.id || null,
    nome: bruto.name || bruto.nome || 'Projeto sem nome',
    fornecedor: bruto.supplier?.name || bruto.fornecedor || null,
    via: via(bruto.pathway || bruto.via),
    pais: bruto.country || bruto.pais || null,
    creditosEmitidos: Number(bruto.credits_issued ?? bruto.creditosEmitidos ?? 0),
    creditosAposentados: Number(bruto.credits_retired ?? bruto.creditosAposentados ?? 0),
    durabilidadeAnos: Number(bruto.durability_years ?? bruto.durabilidadeAnos ?? 0) || null,
    url: bruto.registry_url || bruto.url || null,
  };
}

// ── Modo demonstração ───────────────────────────────────────────────────────
// Retrato mínimo e verossímil do registro, no formato Relay da API real.
// Fatos de referência pública (imprensa e o próprio registro aberto no
// navegador); os volumes são ordens de grandeza, não extrato oficial.

const DEMO_PROJETOS = {
  page_info: { has_next_page: false, end_cursor: null },
  total_count: 6,
  nodes: [
    {
      id: 'demo-inplanet-sp', name: 'ERW em lavouras tropicais · São Paulo',
      supplier: { name: 'InPlanet' }, pathway: 'enhanced-weathering', country: 'Brasil',
      credits_issued: 400, credits_retired: 225, durability_years: 10000,
      registry_url: 'https://registry.isometric.com',
    },
    {
      id: 'demo-angloamerican-br', name: 'ERW com rejeito de mineração · Brasil',
      supplier: { name: 'Anglo American + parceiros' }, pathway: 'enhanced-weathering', country: 'Brasil',
      credits_issued: 0, credits_retired: 0, durability_years: 10000,
      registry_url: 'https://registry.isometric.com',
    },
    {
      id: 'demo-altcarbon-in', name: 'ERW no delta do Ganges', supplier: { name: 'Alt Carbon' },
      pathway: 'enhanced-weathering', country: 'Índia',
      credits_issued: 1200, credits_retired: 800, durability_years: 10000,
    },
    {
      id: 'demo-biochar-eu', name: 'Biochar com armazenamento em solo agrícola', supplier: { name: 'Fornecedor europeu de biochar' },
      pathway: 'biochar', country: 'União Europeia',
      credits_issued: 5000, credits_retired: 3100, durability_years: 1000,
    },
    {
      id: 'demo-charm-us', name: 'Bio-óleo injetado em poço profundo', supplier: { name: 'Charm Industrial' },
      pathway: 'bio-oil', country: 'Estados Unidos',
      credits_issued: 9000, credits_retired: 7400, durability_years: 1000,
    },
    {
      id: 'demo-vaulted-us', name: 'Biomassa residual em poço geológico', supplier: { name: 'Vaulted Deep' },
      pathway: 'biomass-storage', country: 'Estados Unidos',
      credits_issued: 18000, credits_retired: 12000, durability_years: 10000,
    },
  ],
};

// ── Consulta com cache ──────────────────────────────────────────────────────
// O benchmark muda devagar; dez minutos de cache evitam custo e latência sem
// esconder atualização relevante de ninguém.

const CACHE_MS = 10 * 60 * 1000;
let cacheProjetos = { em: 0, dados: null };

export async function projetosIsometric() {
  if (modoIsometric() === 'demonstracao') {
    return {
      modo: 'demonstracao',
      fonte: 'Retrato estático no formato da API (docs.isometric.com); ative as chaves para dados vivos.',
      projetos: DEMO_PROJETOS.nodes.map(normalizarProjeto),
    };
  }
  const agora = Date.now();
  if (!cacheProjetos.dados || agora - cacheProjetos.em > CACHE_MS) {
    const nos = await todasAsPaginas('/projects');
    cacheProjetos = { em: agora, dados: nos.map(normalizarProjeto) };
  }
  return {
    modo: 'real',
    fonte: `Registro Isometric ao vivo (${ambienteIsometric()}).`,
    projetos: cacheProjetos.dados,
  };
}

// Agregação que a tela de investidores mostra: o mercado de CDR por via,
// com a leitura ZoomDev de onde o Coin Max se encaixa.
export async function benchmarkIsometric() {
  const { modo, fonte, projetos } = await projetosIsometric();

  const porVia = {};
  for (const p of projetos) {
    const chave = p.via.id;
    porVia[chave] ??= { via: p.via, projetos: 0, creditosEmitidos: 0, creditosAposentados: 0, paises: new Set() };
    porVia[chave].projetos += 1;
    porVia[chave].creditosEmitidos += p.creditosEmitidos;
    porVia[chave].creditosAposentados += p.creditosAposentados;
    if (p.pais) porVia[chave].paises.add(p.pais);
  }

  const vias = Object.values(porVia)
    .map(v => ({ ...v, paises: [...v.paises].sort() }))
    .sort((a, b) => b.creditosEmitidos - a.creditosEmitidos);

  return {
    modo,
    fonte,
    ambiente: ambienteIsometric(),
    totais: {
      projetos: projetos.length,
      creditosEmitidos: vias.reduce((s, v) => s + v.creditosEmitidos, 0),
      creditosAposentados: vias.reduce((s, v) => s + v.creditosAposentados, 0),
    },
    vias,
    brasil: projetos.filter(p => p.pais === 'Brasil'),
    // O encaixe honesto da ZoomDev nesse registro, na linguagem do Selo:
    leituraZoomDev: {
      elegiveis: ['enhanced-weathering', 'biochar'],
      resumo:
        'A Isometric certifica remoção durável (200 a 1.000+ anos). Carbono orgânico de solo via '
        + 'bioestimulante não é via elegível: o caminho do Coin Max lá é indireto, por co-aplicação '
        + 'com ERW (precedente InPlanet, Brasil) ou biochar em solo agrícola. O carbono de solo do '
        + 'Coin Max segue a trilha Verra/SBCE.',
      selo: 'PESQUISA',
    },
  };
}

// Estado da integração, sem nunca ecoar segredo.
export function estadoIsometric() {
  return {
    modo: modoIsometric(),
    ambiente: ambienteIsometric(),
    configurado: modoIsometric() === 'real',
    instrucoes:
      modoIsometric() === 'real'
        ? null
        : 'Defina ISOMETRIC_CLIENT_SECRET e ISOMETRIC_TOKEN (geradas em registry.isometric.com/account/settings) '
          + 'e, opcionalmente, ISOMETRIC_AMBIENTE=producao. Sem elas o conector serve o modo demonstração.',
  };
}

// Só para os testes conseguirem exercitar a normalização sem rede.
export const _interno = { normalizarProjeto, via, DEMO_PROJETOS };
