---
id: ZDG-INDEX
title: ZoomDev Genesis — Índice
collection: ZoomDev Genesis
layer: Kernel
knowledge: Institutional
evidence: STRATEGY
confidence: 100
version: Genesis 1.0
status: Published
language: pt-BR
owner: ZoomDev
---

# ZoomDev Genesis

> **The Cognitive Infrastructure for Regenerative Innovation**

Base de conhecimento corporativa da ZoomDev, organizada como um **sistema operacional**
e não como uma biblioteca — porque o verdadeiro produto da ZoomDev é o que ela sabe.

Não é documentação sobre o produto. É o **substrato cognitivo** que os agentes consultam:
a Maiá e as demais instâncias raciocinam por conceitos da Genesis, e cada resposta que
dão carrega o grau de confiança da fonte.

## Camadas

| Camada | Papel | Documentos |
|---|---|---|
| **Kernel** | Norma, linguagem e ontologia que regem todo o resto | ZDG-000 |
| **Foundation** | Constituição, identidade e princípios | ZDG-001 |
| **Cognition** | Arquitetura cognitiva e protocolos de instância | ZDG-002, ZDG-003 |
| **Science** | Corpus técnico, evidências e metodologias | ZDG-004 |
| **Agents** | Elenco, castas e cooperação | ZDG-005 |
| **Venture** | Criação de startups e biostartups | ZDG-006 |
| **ESG** | Impacto, ODS, carbono e conformidade | ZDG-007 |
| **Platform** | Produto, jornada e gamificação | ZDG-008 |
| **Governance** | Decisão, versionamento e auditoria | ZDG-009 |

## Documentos publicados

| ID | Título | Camada | Status |
|---|---|---|---|
| [ZDG-000](ZDG-000-documentation-standard.md) | ZoomDev Documentation Standard | Kernel | Approved |
| [ZDG-001](ZDG-001-constituicao.md) | Constituição da ZoomDev | Foundation | Approved |
| [ZDG-002](ZDG-002-arquitetura-cognitiva.md) | Arquitetura Cognitiva | Cognition | Approved |

## Documentos vivos fora da Genesis

Estes evoluem junto com o código e ficam em `docs/`:

- [`protocolo-instancia-cognitiva.md`](../protocolo-instancia-cognitiva.md) — PICs em operação
- [`impacto-regenerativo.md`](../impacto-regenerativo.md) — corpus, calculadora e radar
- [`gamificacao.md`](../gamificacao.md) · [`mercado-carbono.md`](../mercado-carbono.md) · [`design-system.md`](../design-system.md)

## Como ler

Todo documento declara no frontmatter: de onde vem a informação (`evidence`), quanto se
pode confiar nela (`confidence`), de que depende (`dependencies`) e a que se relaciona
(`related`). O grafo de conhecimento se monta sozinho a partir disso.

**Regra do elo mais fraco:** numa cadeia de raciocínio, o resultado herda o menor selo
envolvido. `HYPOTHESIS` e `VISION` jamais sustentam alegação comercial ou de carbono.
