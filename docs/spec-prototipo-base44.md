# Spec do Protótipo Base44 (ZoomDev OS): extração do app real

> Fonte: bundle de produção de `zoom-dev-os.base44.app` + schemas de entidades via conector
> Base44 (ago/2026). Referência de fidelidade para as próximas fases de desenvolvimento.

## Estrutura de páginas

- **Core:** Dashboard, AIStudio, StartupStudio, MVPBuilder, EditorVisual, PlatformExplorer,
  Projects, Ideas, Team, Library, Integrations, Settings, Plans, Analytics, Community,
  Marketplace (=CarbonPay), Editais, Investors
- **Bio:** BioStartups, Bioeconomia, Comunidades, Carbono, Rastreabilidade, ESG,
  Biodiversidade, Projetos Amazônicos, Editais Específicos, Protocolos Cognitivos,
  Agentes Amazônicos, BioMarketplace
- **Avançados:** StrategyCore, AutoPitch, DigitalTwin, SwarmIntelligence, SmartActions,
  IoTMonitor, AgentEconomy, Coopetition, ExecutionHub, AuditTrail, KnowledgeNetwork,
  FinanceLab, ProductivityHub, ServiceMarketplace, BudgetControl, EquityManager,
  CarbonImpactReport

## Sidebar e layout

Sidebar colapsável com 7 itens: Strategy Core (badge "IA") · Dashboard · Agentes · Projetos ·
Bioeconomia · CarbonPay (badge "Fintech") · Configurações. Rodapé: card "Zoom Intelligence /
Sua IA de confiança / Online". Topbar com tabs (Plataforma, Agentes, Projetos, Bio Startups,
Editais, Investidores, CarbonPay), sino de notificações e command palette (Cmd+K).
Botão flutuante do Copiloto no canto inferior direito.

## Dashboard (copy literal)

- Hero: "Bem-vindo de volta, {nome}! 👋" + "Transforme ideias em impacto real. A Amazônia
  inspira. A tecnologia impulsiona."
- 4 quick actions → função `analyzeStartup` (market | financial | edital | competitor),
  retorna análise + recomendações + Score /10
- Card "Jornada da sua Startup": Ideação → Validação → MVP → Tração → Escala
- 6 stat-cards: Projetos Ativos, Ideias Criadas, MVPs, Investidores, Score de Impacto,
  Comunidade
- Chat "Zoom Intelligence" embutido (persistência em ChatLog)
- Banner: "Novo edital FINEP Bioeconomia aberto: R$ 200 milhões…"

## Fluxo de ideação do protótipo

- Landing: "Crie. Construa. Escale. Transforme o futuro." / "Do conceito ao produto pronto.
  20 agentes especialistas trabalhando em paralelo: CEO, CTO, CMO, Dev, Jurídico, ESG e mais."
- Prompt-box com tabs (Aplicativo Web / Mobile / Créditos de Carbono), placeholder
  "Descreva sua ideia, vamos dar vida a ela...", botões Importar e Microfone, CTA "Criar com IA"
- Copiloto = agente `startup_copilot` (Base44 agents SDK) com provocador de inatividade após 45s
- StartupStudio: 8 fases de maturação (Ideação, Canvas, ICP, Pesquisa, Validação, MVP,
  Roadmap, Pitch), cada uma com 4 ferramentas; outputs salvos em `StageOutput`
  (status rascunho → validado)

## Agentes

- **5 amazônicos (is_bio):** Curupira AI (guardião da biodiversidade e mapeamento florestal),
  Iara AI (recursos hídricos amazônicos), Boto AI (comunidades tradicionais e etnociências),
  Seringueiro AI (cadeias produtivas sustentáveis e bioeconomia), Tucuju AI (protocolos COP30
  e acordos climáticos globais)
- **20 gerais:** CEO AI, CTO AI, CMO AI, CFO AI, UX Designer, Dev Master, Jurídico,
  Financeiro, ESG Impacto, Bio Agente, Editais IA, Growth Hacker, Investidor IA,
  Bio Agente Amazônia, Carbono AI, React Dev, Flutter Dev, Deploy AI, HR AI, Mercado

## CarbonPay (protótipo)

- Stats: Créditos Disponíveis (tCO₂), Projetos Certificados, Transações, Preço Médio $/tCO₂
- Itens seed: gateway PIX, Auditoria MRV (Verra VCS), Tokenização (1 token = 1 tCO₂),
  REDD+ Amazônia ($35/t), SAF Cacau Bahia, Cerrado, Pantanal
- **Calculadora de sequestro:** área (ha) × duração × bioma (6 opções) × tipo de projeto →
  tCO₂/ano, receita estimada e "árvores equivalentes" (complementar à calculadora de
  passivo já implementada: uma mede emissões, a outra mede potencial de geração de créditos)
- CarbonPurchaseModal: quantidade tCO₂ + pagamento PIX (função `carbonPay` → pix_code + QR)
  ou cartão (Stripe)
- Entidade `CarbonTransaction`: buyer/seller, carbon_tons, price_per_ton, payment_method
  (pix/stripe), payment_status, transaction_hash

## Entidades (30)

MarketplaceItem, AgentListing, BioIngredient, ServiceListing, CommunityMember, Notification,
Agent, Investor, BioModule, Project, Idea, LibraryResource, CapTableEntry, KnowledgeAsset,
ChatLog, CoopetitionMatch, BudgetRule, SmartAction, Integration, AuditLog, FinancialScenario,
TaskExecution, TeamMember, MVP, Edital, StageOutput, IoTSensor, StrategyIntent,
CarbonTransaction, User.

## Divergências resolvidas

| Item | Protótipo | Decisão ZoomDev |
|---|---|---|
| Planos | Free R$0 / Starter R$49 / Pro R$99 | **Free R$0 / PRO R$149 / BUSINESS R$199** (decisão do fundador) |
| Créditos de uso | Inexistentes no código | Implementados ("seiva") com estorno em falha |
| Gamificação | Inexistente | Núcleo do produto (XP, níveis bio, missões, conquistas) |
| Geração de MVP | CRUD sem geração de código | Roadmap: builder real com ejeção total do código |
| Backend functions | analyzeStartup, sendNotificationEmail, stripeCheckout, carbonPay | Reimplementar no servidor próprio nas próximas fases |
