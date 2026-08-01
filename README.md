# ZoomDev OS

Plataforma de vibe coding com filosofia gamificada — da ideia ao exit ("IDEA TO EXIT").

Criação de startups com IA multiagente (API Claude): geração de MVPs, planos de negócios,
sites e design, com trilha especializada em bioeconomia amazônica, editais e impacto.

## Documentação de fundação

| Documento | Conteúdo |
|---|---|
| [`docs/design-system.md`](docs/design-system.md) | Clone fiel do branding do protótipo Base44 — tokens, cores, fontes, componentes `zd-*`, animações |
| [`docs/mapa-funcionalidades.md`](docs/mapa-funcionalidades.md) | Funcionalidades do protótipo cruzadas com o pitch deck e o plano de negócios; lacunas e inconsistências |
| [`docs/pesquisa-concorrentes.md`](docs/pesquisa-concorrentes.md) | Pesquisa Base44 / Lovable / Abacus — falhas de interoperabilidade e UX, e o espaço da ZoomDev |
| [`docs/gamificacao.md`](docs/gamificacao.md) | Filosofia gamificada completa: jornada Semente→Floresta, missões, streaks, Launch Arena, economia de créditos |

| [`docs/mercado-carbono.md`](docs/mercado-carbono.md) | Pesquisa do mercado de créditos de carbono (SBCE, padrões, preços, GHG Protocol, anti-greenwashing) |
| [`docs/jornada-usuario.md`](docs/jornada-usuario.md) | Jornada encadeada implementada + sugestões de aprimoramento |
| [`docs/spec-prototipo-base44.md`](docs/spec-prototipo-base44.md) | Extração do app Base44 real: páginas, agentes, entidades, CarbonPay |

## Rodando o projeto

```bash
npm install
npm run dev          # API (porta 4000) + web (porta 5173)
```

- **Sem `ANTHROPIC_API_KEY`:** modo demo — planos de exemplo determinísticos, jornada completa funcional.
- **Com `ANTHROPIC_API_KEY`:** os 5 agentes rodam via API Claude (`claude-fable-5`, configurável em `ZOOMDEV_MODEL`).

## O que já está implementado

- **Ideação inteligente:** caixa de ideia com seletor 🚀 Startup / 🌿 BioStartup / ✨ auto-classificação pela IA (com justificativa exibida) e botão da calculadora de passivo ambiental.
- **5 agentes** (Produto, Negócio, Engenharia, Impacto, Editais) gerando o plano de negócios qualificado em paralelo, com progresso em tempo real (SSE).
- **Plano diagramado** (SWOT, TAM/SAM/SOM, projeção 12 meses, score de aderência a editais) com download em **DOCX** e **PDF**.
- **Jornada encadeada:** o plano gerado abre automaticamente a fase de Validação com missões derivadas do próprio plano.
- **Gamificação nativa:** XP por progresso real, níveis bio (Semente→Floresta), conquistas, streak, seiva (créditos) com **estorno automático em falha**.
- **Calculadora de passivo ambiental** (GHG Protocol, fatores MCTI/SIRENE) + **CarbonPay** (compensação com créditos verificados).
- Preços oficiais: **Free R$ 0 · PRO R$ 149 · BUSINESS R$ 199**.
