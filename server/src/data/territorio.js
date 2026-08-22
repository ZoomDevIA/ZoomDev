// ═══════════════════════════════════════════════════════════════════════════
// TERRITÓRIO DEMONSTRATIVO — Macapá · AP.
//
// Lotes com geometria real (zona rural a oeste de Macapá, WGS 84) e nomes
// fictícios, para o Mapa Vivo nascer funcionando antes dos primeiros
// produtores reais. TUDO deste arquivo é demonstração e as respostas da API
// dizem isso; quando um lote real entrar, ele convive com estes até o
// administrador removê-los.
//
// As sementes de evidência abaixo passam pelo MESMO registrarEvidencia() do
// uso real: cadeia de custódia, selo composto e eventos no barramento são
// verdadeiros; demonstrativo é só o conteúdo.
// ═══════════════════════════════════════════════════════════════════════════

export const MUNICIPIO = {
  nome: 'Macapá',
  uf: 'AP',
  centro: [-51.13, 0.06],   // [lon, lat] — a oeste do centro urbano
  zoom: 12,
};

export const LOTES = [
  {
    id: 'AP-0042', nome: 'Sítio Boa Esperança', ha: 735, cultura: 'mandioca regenerativa',
    status: 'evidencia',   // evidência ativa
    poligono: [[
      [-51.185, 0.088], [-51.158, 0.093], [-51.148, 0.072],
      [-51.160, 0.052], [-51.184, 0.058], [-51.185, 0.088],
    ]],
  },
  {
    id: 'AP-0038', nome: 'Fazenda Águas do Norte', ha: 512, cultura: 'açaí de terra firme',
    status: 'evidencia',
    poligono: [[
      [-51.132, 0.106], [-51.108, 0.102], [-51.106, 0.082],
      [-51.128, 0.078], [-51.132, 0.106],
    ]],
  },
  {
    id: 'AP-0051', nome: 'Comunidade Rio Pedreira', ha: 488, cultura: 'mandioca',
    status: 'adesao',      // adesão em curso
    poligono: [[
      [-51.152, 0.044], [-51.128, 0.040], [-51.126, 0.020],
      [-51.150, 0.024], [-51.152, 0.044],
    ]],
  },
  {
    id: 'POT-001', nome: 'Potencial mapeado', ha: 1200, cultura: null,
    status: 'potencial',   // apontado pelo motor 360°, sem adesão ainda
    poligono: [[
      [-51.212, 0.036], [-51.188, 0.030], [-51.186, 0.008],
      [-51.214, 0.012], [-51.212, 0.036],
    ]],
  },
];

// Cooperativas do retrato demonstrativo, para o ranking do cockpit. Os selos
// vêm dos lotes que cada uma agrega; hectares somados abaixo são o recorte.
export const COOPERATIVAS = [
  { nome: 'COOPAB', ha: 735, lotes: ['AP-0042'] },
  { nome: 'AGROVALE', ha: 512, lotes: ['AP-0038'] },
  { nome: 'RIO PEDREIRA', ha: 488, lotes: ['AP-0051'] },
];

// Trilha inicial de cada lote com evidência: passa pelo registrador real.
export const SEMENTES_EVIDENCIA = {
  'AP-0042': [
    { tipo: 'linha-de-base', selo: 'LAUDO', descricao: 'Linha de base do solo coletada: pH 4,9 · MO 1,8% · 9 amostras compostas (demonstração)' },
    { tipo: 'aplicacao', selo: 'VERIFICADO', descricao: '2ª aplicação Coin Max registrada: 5 L/ha · nota fiscal vinculada · ART do responsável (demonstração)' },
    { tipo: 'fotos', selo: 'CAMPO', descricao: '12 fotos georreferenciadas do talhão 3: EXIF íntegro, dentro do polígono (demonstração)' },
    { tipo: 'laudo-foliar', selo: 'LAUDO', descricao: 'Laudo foliar assinado: área foliar +31,2% vs testemunha, metodologia descrita (demonstração)' },
    { tipo: 'sensores', selo: 'CAMPO', descricao: 'Leitura de sensores sincronizada: umidade do solo 34% · 4 sondas (demonstração)' },
  ],
  'AP-0038': [
    { tipo: 'linha-de-base', selo: 'LAUDO', descricao: 'Linha de base do solo coletada: 6 amostras compostas em terra firme (demonstração)' },
    { tipo: 'contrato', selo: 'VERIFICADO', descricao: 'Contrato de manejo assinado com a cooperativa, registro em cartório (demonstração)' },
    { tipo: 'laudo-solo', selo: 'LAUDO', descricao: 'Laudo de fertilidade do ciclo: MO subiu 0,3 ponto no talhão norte (demonstração)' },
  ],
  'AP-0051': [
    { tipo: 'visita', selo: 'CAMPO', descricao: 'Visita técnica de adesão: croqui da área e termo de interesse assinado (demonstração)' },
    { tipo: 'plano', selo: 'ESTRATEGIA', descricao: 'Plano de manejo proposto para o primeiro ciclo (demonstração)' },
  ],
};
