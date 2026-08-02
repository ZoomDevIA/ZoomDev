---
id: ZDG-000
title: ZoomDev Documentation Standard
subtitle: A norma editorial que rege toda a Genesis
collection: ZoomDev Genesis
layer: Kernel
domain: Standard
knowledge: Institutional
evidence: STRATEGY
confidence: 100
importance: Critical
version: Genesis 1.0
status: Approved
language: pt-BR
owner: ZoomDev
review: Annual
dependencies: []
related: [ZDG-001, ZDG-002, ZDG-003]
---

# ZoomDev Documentation Standard (ZDS)

> Antes de escrever a Constituição, escreve-se a norma que diz como ela deve ser escrita.

A OpenAI tem o Model Spec. A NASA tem seus Engineering Standards. O Kubernetes tem
seu Documentation Style Guide. A ZoomDev tem o **ZDG-000**.

Sem uma norma editorial definida antes do conteúdo, uma base de conhecimento com
centenas de documentos vira um arquivo morto: cada peça escrita de um jeito, nada
referenciável, nada consumível por agentes cognitivos.

---

## 1. Arquitetura: um sistema operacional, não uma biblioteca

A Genesis não se organiza por "livros". Ela se organiza como um **sistema operacional
do conhecimento** — porque o verdadeiro produto da ZoomDev é o que ela sabe.

```
ZoomDev Genesis
│
├── Kernel        norma, linguagem, ontologia — o que rege todo o resto
├── Foundation    constituição, identidade, princípios
├── Science       corpus técnico, evidências, metodologias
├── Cognition     arquitetura cognitiva, protocolos de instância
├── Agents        elenco, castas, cooperação
├── Venture       criação de startups e biostartups
├── ESG           impacto, ODS, carbono, conformidade
├── APIs          contratos e integrações
├── Platform      produto, jornada, gamificação
├── Marketplace   economia interna e ativos
├── Governance    decisão, versionamento, auditoria
└── References    fontes, glossário, bibliografia
```

**Kernel** é a camada que nenhuma documentação costuma ter. A nossa tem — porque
quando existirem 3.000 arquivos, é o Kernel que impede o caos.

---

## 2. ZDL — ZoomDev Description Language

Todo documento da Genesis é Markdown enriquecido com **metadados cognitivos** em YAML.
Não é enfeite: é o que permite a um agente raciocinar sobre o documento sem lê-lo inteiro.

```yaml
---
id: ZDG-001              # identificador único e permanente
title: ...               # título canônico
layer: Foundation        # camada do sistema operacional
domain: Constitution     # domínio temático
knowledge: Institutional # tipo de conhecimento (ver §4)
evidence: STRATEGY       # natureza da informação (ver §3)
confidence: 100          # grau de confiança 0-100 (ver §3)
importance: Critical     # Critical | High | Normal | Low
version: Genesis 1.0     # versão semântica da coleção
status: Approved         # ciclo de vida (ver §5)
owner: ZoomDev
review: Annual           # periodicidade de revisão
dependencies: [ZDG-000]  # do que este documento depende
related: [ZDG-002]       # documentos correlatos
---
```

**Regra de ouro:** um documento sem frontmatter completo não entra na Genesis.

---

## 3. Marcadores de evidência e grau de confiança

Toda informação declara **de onde vem** e **quanto se pode confiar nela**. Este é o
mesmo Selo de Evidência que governa os cálculos da plataforma — norma e produto
falam a mesma língua.

| Marcador | Significado | Confiança |
|---|---|---|
| `EVIDENCE` | Resultado documentado e verificável | 75–100 |
| `STRATEGY` | Estratégia ou plano institucional | 60 |
| `HYPOTHESIS` | Hipótese apresentada, sem validação independente | 50 |
| `PROPOSAL` | Proposta arquitetônica em avaliação | 40 |
| `VISION` | Aspiração institucional, manifesto | 10 |

Escala de confiança dentro de `EVIDENCE`:

```
100  🏛️  Verificado — documento oficial verificável por terceiro
 90  🌱  Laudo — assinado por responsável técnico habilitado
 80  🌾  Campo — observado e registrado, sem instrumentação completa
 75  📄  Pesquisa — literatura científica ou dado estatístico oficial
```

**Consequência prática, não decorativa:**
- Confiança ≥ 75 sustenta alegação comercial e entra em cálculo de crédito de carbono
- Confiança 80 sustenta comunicação, mas **não** gera crédito sem MRV instrumentado
- `HYPOTHESIS` e `VISION` **jamais** sustentam alegação comercial, ambiental ou de crédito

**Regra do elo mais fraco:** numa cadeia de raciocínio, o resultado herda o menor selo envolvido.

---

## 4. Taxonomia do conhecimento

```
Knowledge
├── Institutional    identidade, cultura, governança
├── Scientific       ciência, pesquisa, evidência
├── Business         mercado, modelo, finanças
├── Technology       engenharia, plataforma, infraestrutura, API
├── Cognitive        arquitetura de agentes, protocolos
├── Operational      processo, execução, suporte
├── Legal            jurídico, compliance, regulatório
└── Impact           ESG, ODS, bioeconomia, carbono
```

---

## 5. Ciclo de vida

```
Draft  →  Review  →  Approved  →  Published  →  Archived
```

Nenhum documento é apagado. Documento superado vai para `Archived` com referência
ao sucessor. **O histórico é patrimônio.**

---

## 6. Tipos de documento

`Constituição` · `Framework` · `Norma` · `Protocolo` · `Arquitetura` · `Manual` ·
`Guia` · `Especificação` · `RFC` · `Artigo` · `Pesquisa` · `Taxonomia`

---

## 7. Convenções

- **Arquivo**: `ZDG-NNN-slug-em-minusculas.md`
- **Diagramas**: Mermaid como padrão
- **Idioma**: pt-BR no corpo; identificadores técnicos em inglês
- **Referências**: todo documento declara `dependencies` e `related` — o grafo se
  monta sozinho
- **Densidade**: escreva para quem decide. Sem enchimento, sem repetição, sem
  adjetivo que não carrega informação

---

## 8. Por que isto existe

Uma base de conhecimento bem normatizada não serve só a pessoas. Ela vira **substrato
cognitivo**: a Maiá e os demais agentes consultam a Genesis por conceito, não por
arquivo, e cada resposta que dão ao fundador carrega o grau de confiança da fonte.

É a diferença entre uma IA que opina e uma IA que sabe — e sabe o quanto sabe.
