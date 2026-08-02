# Protocolo de Instância Cognitiva (PIC) — Sexta-Feira e os 25 agentes

> "O nudge certo, do agente certo, na hora certa." — regra de ouro da Sexta-Feira

## O que é um PIC

O **Protocolo de Instância Cognitiva** é o documento vivo que define a mente de um agente
da ZoomDev OS: identidade, missão, domínios de maestria, ferramentas, regras inegociáveis,
protocolo de cooperação e ciclo de evolução. Cada agente da plataforma tem o seu; a
Sexta-Feira tem o mais completo — e é a única capaz de **propor evoluções no próprio protocolo**.

```
server/src/protocols/
├── picSextaFeira.js   → PIC da Sexta-Feira (versão base 1.0.0 + renderizador)
└── picAgentes.js      → PICs dos 25 agentes (especialidade, cooperação, gatilhos)
```

## Sexta-Feira 🕶️ — a inteligência-mestra

A Sexta-Feira enxerga o ecossistema inteiro e responde ao **administrador** no super
dashboard (`/admin`). Seus pilares:

| Pilar | Implementação |
|---|---|
| **Visão total** | `snapshotEcossistema()` — usuários, projetos, fases, missões, carbono, seiva, tudo em tempo real. Nada é inventado: cada frase dela cita o dado. |
| **Radar Unicórnio** | Score explicável 0–100 por projeto: Plano (25) + Execução (25) + Validação (20) + Fomento (15) + Impacto/ESG (15). Tiers: ≥80 Unicórnio em formação 🦄 · ≥60 Alto potencial 🚀 · ≥40 Promissor 🌿 · <40 Semente 🌱 |
| **Matriz de fomento** | Cruzamento contínuo editais × projetos com score de aderência e dias de prazo. Aderência ≥70 com prazo ≤60 dias dispara nudge automático. |
| **Internet em tempo real** | `conversarComInternet()` usa o server tool `web_search` do Claude (com tratamento de `pause_turn`) para tendências, novos editais e movimentos de concorrentes. |
| **Relatórios executivos** | HTML diagramado com identidade ZoomDev: resumo executivo, radar decomposto, matriz, carbono e Agent Bus. |
| **Autoaperfeiçoamento governado** | Observa → diagnostica → **propõe** → admin aprova → versiona (semver) → rollback em um clique. Nunca muda sozinha. |

### Ciclo de evolução do PIC

```
┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐
│ OBSERVAR │ → │ DIAGNOSTICAR │ → │  PROPOR  │ → │  APROVAR  │ → │VERSIONAR │
│ snapshot │   │ maior lacuna │   │ cirúrgico│   │ (humano!) │   │ + rollback│
└──────────┘   └──────────────┘   └──────────┘   └───────────┘   └──────────┘
```

- Estado persistido em `db.pic`: `{ versaoAtual, versoes[], propostas[] }`
- Cada proposta traz: seção, texto antes/depois, justificativa **com dados do ecossistema**
- Aprovação gera versão minor (1.0.0 → 1.1.0) com notas e histórico completo
- Rollback cria nova versão com o conteúdo restaurado (o histórico nunca é apagado)

## Os 25 agentes — um organismo, cinco camadas

A Sexta-Feira orquestra os agentes em camadas, acionadas por eventos do ecossistema:

| Camada | Agentes | Gatilho de acionamento |
|---|---|---|
| Estratégica | CEO, CFO, Investidor, Mercado | Radar ≥ 60 ou fase Tração |
| Execução | CTO, Dev Master, React, Flutter, Deploy, UX | Fase MVP |
| Crescimento | CMO, Growth Hacker, HR | Tração/Escala |
| Bio-amazônica | Curupira, Iara, Boto, Seringueiro, Tucuju, Bio Agente, Bio Amazônia, Carbono, ESG | Toda biostartup |
| Fomento | Editais IA, Jurídico, Financeiro | Aderência ≥ 70 ou prazo ≤ 30 dias |

Cada PIC de agente define: **identidade**, **especialidade profunda**, **rede de cooperação**
(a quem passar o bastão) e **gatilhos preditivos** que a Sexta-Feira monitora.

## Agent Bus — antecipação gamificada

O Agent Bus (`server/src/services/agentBus.js`) transforma análise preditiva em ação:

- Analisa o estado real de cada fundador (projetos, missões, conquistas, editais)
- Gera **nudges assinados pelo agente especialista** ("Curupira antecipou: …")
- Cada nudge é gamificado: cita XP, seiva ou conquista em jogo, e tem ação de 1 clique
- **Máximo 2 nudges/dia por fundador** — inteligência que não vira spam
- Nudge dispensado (por chave estável) nunca volta; aceites alimentam o KPI de taxa de aceite
- A Sexta-Feira monitora a taxa (meta ≥ 35%) e propõe ajustes de frequência via PIC

Prioridade dos gatilhos: fase pronta para avançar → plano não gerado → prazo de edital →
missão parada → radar ≥ 80 (hora de captar) → carbono (calcular → compensar).

## Governança e privacidade

- **Admin**: primeiro usuário registrado, ou o e-mail definido em `ZOOMDEV_ADMIN_EMAIL`
- **LGPD by design**: a Sexta-Feira reporta agregados; dados sensíveis não saem do contexto do dono
- **Anti-greenwashing**: comunicação de carbono sempre como "emissões compensadas com créditos verificados" (ISO 14068-1 / CONAR)
- **Humano no comando**: nenhuma mudança de protocolo sem aprovação explícita do administrador

## Endpoints

```
GET  /api/nudges                          nudges do dia (Agent Bus)
POST /api/nudges/:id/dispensar|aceitar    feedback do fundador

GET  /api/admin/overview                  snapshot completo do ecossistema
POST /api/admin/chat                      conversa com a Sexta-Feira (web search quando há API key)
POST /api/admin/relatorios                gera relatório executivo diagramado
GET  /api/admin/relatorios/:id.html       abre o relatório
GET  /api/admin/pic                       protocolo ativo + versões + propostas
POST /api/admin/pic/propor                pede proposta de evolução à Sexta-Feira
POST /api/admin/pic/propostas/:id/aprovar | rejeitar
POST /api/admin/pic/rollback              restaura conteúdo de uma versão anterior
GET  /api/admin/pics-agentes              PICs dos 25 agentes
```

## Modo demo

Sem `ANTHROPIC_API_KEY`, a Sexta-Feira responde com inteligência determinística **calculada
dos dados reais do ecossistema** (nunca placeholders): radar, matriz, recomendações e
propostas de evolução funcionam de ponta a ponta. Com a chave configurada, ela ganha
raciocínio pleno do claude-fable-5 e pesquisa na internet em tempo real.
