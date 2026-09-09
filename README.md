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

**Pré-requisito:** Node.js 20 ou superior ([nodejs.org](https://nodejs.org)).

### Teste rápido — uma porta só

```bash
git clone https://github.com/Neroxxx2031/ZoomDev.git
cd ZoomDev
git checkout claude/vibe-coding-platform-huaz3v
npm install
npm run preview
```

Abra **http://localhost:4000** e crie sua conta. O primeiro usuário registrado
vira o administrador e ganha acesso ao painel da Sexta-Feira.

### Desenvolvimento — com recarga automática

```bash
npm run dev          # API na 4000 + web na 5173 (abra a 5173)
```

### Modos de operação

- **Sem `ANTHROPIC_API_KEY`:** modo demo — **tudo funciona**. Planos, MVP, Conselho,
  radar de editais e cálculos operam com geradores determinísticos sobre dados reais.
- **Com `ANTHROPIC_API_KEY`:** os agentes rodam via API Claude (`claude-fable-5`,
  configurável em `ZOOMDEV_MODEL`) e a Sexta-Feira ganha busca na internet.

### Variáveis de ambiente

| Variável | Para quê | Sem ela |
|---|---|---|
| `ANTHROPIC_API_KEY` | IA de verdade nos agentes | Modo demo determinístico |
| `ZOOMDEV_ADMIN_EMAIL` | Define quem é o administrador | Primeiro usuário registrado |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Cobrança de assinatura | Fluxo simulado |
| `PIX_CHAVE`, `PIX_NOME`, `PIX_CIDADE` | PIX em produção | BR Code válido, confirmação manual |
| `ZOOMDEV_DATA_DIR` | Onde os dados ficam | `server/data/` |
| SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY | Postgres de produção | Persistência JSON durante a migração |

Consulte [docs/supabase.md](docs/supabase.md) para configurar o Supabase.

### Publicando online

O servidor detecta `web/dist` e serve o frontend junto com a API — uma porta, um
processo. A porta vem de `PORT`, que Railway e Render injetam automaticamente.

#### Railway (recomendado)

1. Em [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Selecione `Neroxxx2031/ZoomDev` e a branch `claude/vibe-coding-platform-huaz3v`
3. O `railway.json` já aponta para o `Dockerfile` — o build começa sozinho
4. Em **Settings → Networking**, clique em **Generate Domain** para receber a URL pública
5. Em **Variables**, adicione o que quiser ativar (tudo opcional — sem nada, roda em modo demo)
6. Em **Settings → Volumes**, crie um volume montado em `/app/data` para os dados
   sobreviverem aos deploys

#### Render

Conecte o repositório em [render.com](https://render.com) — o `render.yaml` configura
build, porta, health check e disco persistente sozinho.

#### Qualquer host com Docker

```bash
docker build -t zoomdev .
docker run -p 4000:4000 -v zoomdev-dados:/app/data zoomdev
```

## O que já está implementado

- **Ideação inteligente:** caixa de ideia com seletor 🚀 Startup / 🌿 BioStartup / ✨ auto-classificação pela IA (com justificativa exibida) e botão da calculadora de passivo ambiental.
- **5 agentes** (Produto, Negócio, Engenharia, Impacto, Editais) gerando o plano de negócios qualificado em paralelo, com progresso em tempo real (SSE).
- **Plano diagramado** (SWOT, TAM/SAM/SOM, projeção 12 meses, score de aderência a editais) com download em **DOCX** e **PDF**.
- **Jornada encadeada:** o plano gerado abre automaticamente a fase de Validação com missões derivadas do próprio plano.
- **Gamificação nativa:** XP por progresso real, níveis bio (Semente→Floresta), conquistas, streak, seiva (créditos) com **estorno automático em falha**.
- **Calculadora de passivo ambiental** (GHG Protocol, fatores MCTI/SIRENE) + **CarbonPay** (compensação com créditos verificados).
- Preços oficiais: **Free R$ 0 · PRO R$ 149 · BUSINESS R$ 199**.
