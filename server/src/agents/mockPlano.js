// Plano de exemplo determinístico usado no modo demo (sem ANTHROPIC_API_KEY).
// Mantém exatamente o mesmo shape do plano gerado pela IA.
export function mockPlano(projeto) {
  const bio = projeto.classificacao === 'biostartup';
  const nome = projeto.nome || 'Meu Projeto';
  const projecao = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    receita: Math.round(Math.pow(1.45, i) * 800),
    clientes: Math.round(Math.pow(1.38, i) * 3),
  }));

  const plano = {
    geradoEm: new Date().toISOString(),
    modelo: 'demo (sem API key)',
    produto: {
      propostaDeValor: `${nome} resolve um problema real do mercado ${bio ? 'de bioeconomia' : 'digital'} com uma solução simples de adotar e com retorno mensurável para o cliente.`,
      problema: 'O público-alvo perde tempo e dinheiro com processos manuais, sem visibilidade e sem ferramentas acessíveis.',
      solucao: `Plataforma digital que automatiza o fluxo principal do cliente${bio ? ', com rastreabilidade da cadeia produtiva e métricas de impacto ambiental' : ''}.`,
      publicoAlvo: bio ? 'Cooperativas, produtores da sociobiodiversidade e empresas com metas ESG' : 'Pequenas e médias empresas do setor',
      personas: [
        { nome: 'Ana, 34', descricao: 'Gestora que decide a compra', dor: 'Falta de visibilidade e retrabalho manual' },
        { nome: 'Carlos, 41', descricao: 'Operador que usa no dia a dia', dor: 'Ferramentas complexas que não conversam entre si' },
      ],
      funcionalidadesMvp: ['Cadastro e onboarding guiado', 'Fluxo principal automatizado', 'Painel de métricas', 'Notificações', 'Exportação de relatórios'],
      diferenciais: ['Simplicidade radical', 'Preço acessível para PMEs', bio ? 'Métricas de impacto ambiental nativas' : 'IA embarcada no fluxo', 'Suporte humano'],
    },
    negocio: {
      modeloDeNegocio: 'SaaS por assinatura mensal com plano freemium e upsell para planos pagos.',
      mercado: {
        tam: 'R$ 8,5 bilhões', sam: 'R$ 900 milhões', som: 'R$ 45 milhões',
        contexto: `Mercado ${bio ? 'de bioeconomia brasileiro em expansão, impulsionado por COP30 e editais públicos' : 'digital brasileiro em crescimento de dois dígitos ao ano'}. (Estimativas demo: gere com IA para valores fundamentados.)`,
      },
      concorrentes: [
        { nome: 'Concorrente A', forca: 'Marca estabelecida', fraqueza: 'Preço alto e onboarding lento' },
        { nome: 'Concorrente B', forca: 'Muitas integrações', fraqueza: 'UX complexa para PMEs' },
        { nome: 'Planilhas/processo manual', forca: 'Custo zero aparente', fraqueza: 'Erros, retrabalho e zero visibilidade' },
      ],
      pricing: ['Free: funcionalidades essenciais', 'PRO R$ 149/mês: operação completa', 'BUSINESS R$ 199/mês: equipe + suporte prioritário'],
      goToMarket: ['Conteúdo orgânico no nicho', 'Parcerias com associações do setor', 'Programa de indicação gamificado', 'Presença em eventos do ecossistema', bio ? 'Submissão a editais de bioeconomia (FINEP/BNDES)' : 'Mídia paga segmentada'],
      projecao12Meses: projecao,
      swot: {
        forcas: ['Time enxuto e ágil', 'Custo de operação baixo', 'Foco em nicho desatendido', 'Tecnologia própria'],
        fraquezas: ['Marca desconhecida', 'Capital limitado', 'Dependência de founders', 'Base de clientes zero'],
        oportunidades: [bio ? 'Editais COP30/bioeconomia' : 'Digitalização acelerada das PMEs', 'Concorrentes caros', 'Parcerias institucionais', 'Expansão LATAM'],
        ameacas: ['Entrada de player grande', 'Mudança regulatória', 'Ciclo de venda longo', 'Churn inicial alto'],
      },
    },
    engenharia: {
      stack: ['React + Vite (frontend)', 'Node.js + Express (API)', 'PostgreSQL/Supabase', 'IA: API Claude', 'Deploy: cloud gerenciada'],
      arquitetura: 'Monólito modular com API REST, autenticação JWT, filas para tarefas assíncronas e integração com IA via API. Preparado para extrair serviços conforme escala.',
      roadmapTecnico: [
        { fase: 'Fase 1: Núcleo', duracao: '6 semanas', entregas: ['Auth e onboarding', 'Fluxo principal', 'Painel básico'] },
        { fase: 'Fase 2: Tração', duracao: '6 semanas', entregas: ['Integrações', 'Relatórios', 'Billing'] },
        { fase: 'Fase 3: Escala', duracao: '8 semanas', entregas: ['API pública', 'Apps mobile', 'Observabilidade'] },
      ],
      riscosTecnicos: ['Dependência de APIs de terceiros', 'Custo de IA em escala', 'Dívida técnica no MVP'],
      custoInfraEstimado: 'R$ 800–1.500/mês nos primeiros 6 meses',
    },
    impacto: {
      ods: bio
        ? [
            { numero: 15, nome: 'Vida Terrestre', contribuicao: 'Valorização da floresta em pé via cadeias sustentáveis' },
            { numero: 8, nome: 'Trabalho Decente', contribuicao: 'Renda para comunidades produtoras' },
            { numero: 13, nome: 'Ação Climática', contribuicao: 'Rastreabilidade e compensação de carbono' },
          ]
        : [
            { numero: 8, nome: 'Trabalho Decente e Crescimento Econômico', contribuicao: 'Produtividade para PMEs' },
            { numero: 9, nome: 'Indústria, Inovação e Infraestrutura', contribuicao: 'Digitalização de processos' },
          ],
      kpisImpacto: ['Nº de clientes ativos', 'Horas economizadas/mês por cliente', bio ? 'tCO2e rastreadas/compensadas' : 'Redução de erros operacionais (%)', bio ? 'Famílias produtoras beneficiadas' : 'NPS'],
      praticasEsg: ['Compensação de carbono da operação (CarbonPay)', 'Política de diversidade no time', 'Dados: LGPD desde o dia 1', 'Fornecedores locais quando possível'],
      riscos: [
        { risco: 'Baixa adesão inicial', mitigacao: 'Validação contínua com early adopters e pivot rápido' },
        { risco: 'Fluxo de caixa apertado', mitigacao: 'Editais de fomento + venda antecipada de planos anuais' },
        { risco: bio ? 'Logística amazônica complexa' : 'Dependência de canal único', mitigacao: bio ? 'Parcerias com cooperativas e operadores locais' : 'Diversificação de canais de aquisição' },
      ],
      pegadaCarbono: 'Operação digital de baixa emissão (estimativa inicial < 5 tCO2e/ano). Recomenda-se calcular o passivo na Calculadora ZoomDev e compensar via CarbonPay com créditos certificados, priorizando projetos amazônicos.',
    },
    editais: {
      editaisRecomendados: [
        { nome: 'Centelha', orgao: 'FINEP/Fundações Estaduais', aderencia: bio ? 88 : 82, motivo: 'Ideação/MVP com subvenção para novos empreendimentos inovadores' },
        { nome: bio ? 'FINEP Bioeconomia' : 'FINEP Startup', orgao: 'FINEP', aderencia: bio ? 92 : 75, motivo: bio ? 'Foco direto em bioeconomia e sustentabilidade' : 'Investimento em startups de base tecnológica' },
        { nome: 'Sebrae Catalisa ICT', orgao: 'Sebrae', aderencia: 70, motivo: 'Aceleração e mentoria para negócios inovadores' },
      ],
      documentacaoNecessaria: ['CNPJ (ou CPF na pré-incubação)', 'Plano de negócios (este documento)', 'Pitch deck', 'Orçamento detalhado', 'Currículo dos fundadores', 'Certidões negativas'],
      dicasSubmissao: ['Responda exatamente o que o edital pergunta', 'Quantifique impacto e mercado', 'Mostre time complementar', 'Use o score de aderência da ZoomDev para priorizar'],
    },
  };

  const missoesValidacao = [
    { id: 'val_0', titulo: `Entreviste 5 potenciais clientes (${plano.produto.publicoAlvo})`, descricao: 'Valide se a dor descrita no plano é real e prioritária.', tipo: 'principal', xp: 30 },
    { id: 'val_1', titulo: 'Publique uma landing de captura e consiga 10 leads', descricao: 'Teste a proposta de valor com tráfego real.', tipo: 'principal', xp: 30 },
    { id: 'val_2', titulo: 'Analise o Concorrente A por 30 minutos', descricao: 'Confirme as fraquezas mapeadas no SWOT.', tipo: 'secundaria', xp: 30 },
    { id: 'val_3', titulo: 'Valide o preço PRO (R$ 149) com 3 leads', descricao: 'Registre reações: caro, justo ou barato.', tipo: 'secundaria', xp: 30 },
  ];

  return { plano, missoesValidacao };
}
