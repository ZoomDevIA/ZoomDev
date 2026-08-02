# Mapa de Funcionalidades: Protótipo × Pitch × Plano de Negócios

> Fontes: módulos lazy-loaded e strings extraídos do bundle JS de produção do protótipo,
> screenshots internos do Plano de Negócios, pitch deck (15 slides).

## 1. O que o protótipo já contém (extraído do código de produção)

### Navegação principal (sidebar)
Dashboard · Agentes IA · Startup Studio / MVP Builder · Projetos · Bio Startups · Bioeconomia ·
CarbonPay · Editais & Oportunidades · Investidores · Marketplace · Comunidade · Analytics ·
Ideias · Equipe · Biblioteca · Integrações · Configurações

### Módulos avançados (labels no bundle)
Strategy Core · Editor (Visual) · Auto-Pitch · Zoom AI · Gêmeo Digital · Swarm · Governança ·
Execução · Auditoria · Financeiro · Orçamento · Equity · IoT · Impacto & ODS · Bio Market ·
Relatórios · Econ. Agentes · Coopetição

### Páginas/chunks identificados
| Chunk | Função observada |
|---|---|
| `MVPBuilder` | fluxo "Descreva sua ideia → IA expande e estrutura → Construa e lance" |
| `EditorVisual` | editor visual do app gerado |
| `PlatformExplorer` | escolha de jornada: **Zoom AI Startups** (geral, "20+ agentes IA especializados", studio de MVP, análise de mercado/concorrência, conexão com investidores, editais) × **Zoom AI Bio Startups** (bioeconomia, rastreabilidade + créditos de carbono, editais FINEP/BNDES/MCTI, "protocolos cognitivos amazônicos") |
| `Editais` + `EditaisEspecificosPage` | catálogo de editais com botão **"IA Calcular Aderência"** (score de compatibilidade projeto×edital); notificações ("Novo edital disponível: FINEP Bioeconomia 2025") |
| `BioStartups` / `BioModulePage` | agentes amazônicos: **ForestEye** (biodiversidade/mapeamento florestal), especialista em recursos hídricos, comunidades tradicionais/etnociências, cadeias produtivas sustentáveis; **EditalBot**; **BioBazaar**; ativação de agente via chat |
| `BioMarketplace` | marketplace de ingredientes bioeconômicos (ex.: óleos essenciais) |
| `AgentEconomy` | **economia de agentes**: listar e **alugar agentes por R$** entre startups (entidade `AgentListing`) |
| `ImpactDashboard` | Score de Impacto, taxa de conversão ideia→MVP, contagem de MVPs |
| `ExecutionHub` | notificações, calendário, sincronização de ações |
| `ProductivityHub` | comunicação/produtividade |
| `ComunidadesPage`, `ProjetosAmazonicosPage`, `BiodiversidadePage` | módulo bio expandido |

### Outros elementos confirmados
- Jornada em 5 estágios: **Ideação → Validação → MVP → Tração → Escala**
- Verticais: Health Tech, Impacto Social, Agro & Food, Educação, Fintech
- Stats do dashboard: Projetos Ativos, Ideias Criadas, MVPs, Score de Impacto
- Análises de IA: Análise de Mercado, Análise Financeira, Análise Competitiva
- CarbonPay: "Créditos de Carbono: gere renda certificando e vendendo créditos de carbono"
  (exemplo de prompt: fintech de crédito de carbono com PIX + rastreabilidade blockchain)
- Auth: e-mail/senha com verificação OTP por e-mail; social logins exibidos como "em breve"
- Billing: checkout Stripe (screenshots do plano de negócios: PRO R$ 69/mês, BUSINESS R$ 149/mês)
- Onboarding: tour guiado com tooltips
- Importação de arquivo e microfone no builder ("Importar", "Microfone")

## 2. Cruzamento com o Pitch Deck

| Promessa do pitch | Status no protótipo | Observação |
|---|---|---|
| 3 etapas: Brainstorming → Protótipo automático → Deploy 1-click | ✅ estrutura presente (MVPBuilder/EditorVisual) | deploy real não verificável no protótipo |
| Prompt Builder Inteligente | ✅ ("Descreva sua ideia → IA expande e estrutura") | |
| Editor Visual AI (drag-and-drop + chat) | ⚠️ parcial (`EditorVisual` existe; drag-and-drop não confirmado) | |
| Deploy 1-click + Supabase + CI/CD + domínios | ❌ mock/não presente | é diferencial a construir |
| 5 módulos/5 agentes integrados | ✅ ampliado (20+ agentes anunciados no explorer) | plano de negócios define os 5 núcleos: Produto, Negócio, Engenharia, Impacto, Editais |
| Jornada dupla geral × bio | ✅ (`PlatformExplorer`) | |
| Biblioteca Bio-Tech (componentes bio-inspirados) | ⚠️ parcial (Biblioteca no menu) | |
| Dashboard Analytics | ✅ (`ImpactDashboard`) | |
| Sistema de créditos | ⚠️ visível nos screenshots do PDF ("500 créditos", "Uso de Créditos") | mecânica não presente no bundle público |
| Planos Free/Pro/Premium/Enterprise | ⚠️ divergência de preço | pitch: Pro R$ 99, Premium R$ 199 · protótipo/Stripe: PRO R$ 69, BUSINESS R$ 149, **decidir tabela única** |
| Workspaces/colaboração | ⚠️ ("Equipe" no menu; workspaces nos screenshots) | |
| Aceleradora digital (mentoria, submissão a editais) | ✅ (Editais + aderência IA + Investidores) | |
| Gamificação | ❌ **ausente** (nenhuma string de XP/nível/conquista/missão no bundle) | objetivo central da nova plataforma: ver `gamificacao.md` |

## 3. Lacunas e inconsistências a resolver

1. **Pricing divergente** entre pitch (R$ 99/199) e protótipo (R$ 69/149): definir tabela oficial.
2. **Gamificação inexistente** no protótipo: será construída como filosofia central (não um add-on).
3. **Deploy real, GitHub, Supabase, domínios**: apenas prometidos; núcleo técnico a implementar.
4. **Sistema de créditos**: presente na UI, sem lógica visível; definir economia de créditos completa.
5. **Muitos módulos "casca"** (Gêmeo Digital, Swarm, IoT, Coopetição, Governança...), priorizar MVP:
   núcleo Builder + 5 agentes + créditos + gamificação primeiro; módulos avançados por fases.
6. Textos com erros de digitação no pitch/protótipo (ex.: "instânciação cognitva", "Comsuda estrutural")
: revisar copy na versão final.
