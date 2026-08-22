---
id: ZDG-011
title: Dossiê de Parceria Isometric
subtitle: As rotas reais da ZoomDev na remoção durável de carbono
collection: ZoomDev Genesis
layer: Strategy
domain: Carbon
knowledge: Institutional
evidence: RESEARCH
confidence: 75
importance: High
version: Genesis 1.0
status: Approved
language: pt-BR
owner: ZoomDev
review: Trimestral
dependencies: [ZDG-010]
related: [ZDG-007, ZDG-012]
---

# Dossiê de Parceria Isometric

Material de base para a conversa com a Isometric (e com a InPlanet). Fatos
verificados nas fontes primárias em 22/08/2026; reconferir antes de cada
reunião.

## 1. O que a Isometric é, verificado

- Registro de **remoção durável de carbono** (200 a 1.000+ anos), com
  protocolos abertos, dados de LCA públicos por crédito e API documentada
  (docs.isometric.com; sandbox `api.sandbox.isometric.com`, produção
  `api.isometric.com`, cabeçalhos `X-Client-Secret` + Bearer).
- **Quem paga é o comprador**: taxa fixa de verificação por pedido, variável
  por via; o fornecedor não paga o registro. O desenho elimina o conflito
  "registro pago por quem quer aprovar".
- A conta Supplier da Zoom Dev existe (código ZOXVS) e as chaves de API são
  geradas em Settings → API Keys (access token com validade de 1 ano +
  client secret).

## 2. A verdade da elegibilidade

Carbono orgânico de solo elevado por bioestimulante — a via direta do Coin
Max — **não é via elegível na Isometric**. Dizer isso primeiro é o que
diferencia a ZoomDev de quem chega vendendo fumaça. As rotas reais:

### Rota A · Enhanced Rock Weathering (prioritária)

- Via certificada, protocolo atualizado; a **InPlanet emitiu os primeiros
  créditos de ERW do mundo sob a Isometric, com agricultores em São Paulo**;
  Anglo American lançou projeto de ERW no Brasil com a Isometric.
- Encaixe ZoomDev: **co-aplicação de pó de basalto com o Coin Max nos
  mesmos lotes**. A mesma visita, o mesmo polígono, a mesma cadeia de
  custódia atendem os dois produtos; o pó de rocha ainda corrige acidez do
  solo degradado, com sinergia agronômica plausível a ensaiar.
- Papel: originadora/agregadora de pequenos produtores (o que a InPlanet
  faz com fazendas maiores). A agregação de lotes pequenos numa operação
  certificável é exatamente o modelo da plataforma.

### Rota B · Biochar com armazenamento em solo agrícola

- Via certificada com módulo específico de solos agrícolas e durabilidade
  de 200 ou 1.000 anos (com medição de refletância para o degrau maior).
- Encaixe amazônico: caroço de açaí e resíduos da bioeconomia como matéria
  prima; o biochar aplicado nos lotes Coin Max fecha ciclo regional e pode
  nascer como biostartup de um founder do cohort.

### Rota C · API pública (sem parceria formal, disponível já)

- O conector `isometric.js` da plataforma lê o registro (projetos,
  emissões, aposentadorias, LCA) e alimenta o benchmark CDR da página de
  investidores. Basta colar as chaves; o modo demonstração vira real.

## 3. O que propor na conversa

1. **Curto prazo**: acesso sandbox pleno e conversa técnica sobre requisitos
   de MRV para agregadores de smallholders em ERW no Brasil.
2. **Médio prazo**: piloto de ERW em um conjunto de lotes Coin Max no Amapá,
   com parceiro técnico de geoquímica (InPlanet ou universidade), MRV
   submetido via Certify.
3. **Argumento de credibilidade**: a plataforma já opera cadeia de custódia
   com hash encadeado, selo por evidência e passaporte público por lote;
   a diligência começa feita (mapeamento formal em ZDG-010).

## 4. Riscos e respostas

| Risco | Resposta |
|-------|----------|
| ERW exige geoquímica que não dominamos | Parceria técnica, não construção própria; o valor da ZoomDev é agregação + evidência |
| Custo de MRV por hectare para produtor pequeno | Diluição por agregação de lotes; é o modelo Boomitra, premiado e financiado |
| Isometric nunca aceitar solo orgânico | Dois trilhos: solo orgânico segue Verra/SBCE; ERW/biochar seguem Isometric |
| Percepção "juiz e parte" | Verificação de toneladas é sempre de terceira parte; o Selo transporta prova, não a julga (ZDG-010 §4) |

## 5. Contatos e próximos passos operacionais

- Formulário de suppliers: isometric.com/suppliers (conta ZOXVS já criada).
- Chaves de API: Settings → API Keys → `ISOMETRIC_CLIENT_SECRET` e
  `ISOMETRIC_TOKEN` na Railway (o painel troca sozinho para AO VIVO).
- Ciência da co-aplicação basalto + Coin Max: frente da COT (ensaio a
  desenhar), pré-requisito do piloto da Rota A.
