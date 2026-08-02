---
id: ZDG-008
title: Plataforma e Jornada
subtitle: Arquitetura técnica e experiência
collection: ZoomDev Genesis
layer: Platform
domain: Architecture
knowledge: Technology
evidence: EVIDENCE
confidence: 100
importance: High
version: Genesis 1.0
status: Approved
language: pt-BR
owner: ZoomDev
review: Quarterly
dependencies: [ZDG-002, ZDG-006]
related: [ZDG-009]
---

# Plataforma e Jornada

## Stack

**Monorepo npm workspaces**

| Camada | Tecnologia |
|---|---|
| API | Node.js, Express, ESM |
| IA | Claude via `@anthropic-ai/sdk`, saída estruturada com JSON Schema |
| Web | React 18, Vite, React Router, Tailwind |
| 3D | three.js self-hosted (sem CDN) |
| Documentos | `docx` para Word, HTML diagramado para PDF |
| Pagamentos | Stripe (assinatura) e PIX BR Code (avulso) |
| Persistência | JSON com interface trocável por Postgres |

---

## Princípios de engenharia

### Modo demo funcional
Sem chave de API, **tudo funciona**: planos, MVP, conselho, radar e cálculos
operam com geradores determinísticos alimentados por dados reais. Nenhuma tela
morta esperando produção.

### Estorno automático
Falha da IA nunca queima crédito do usuário. É contrato, não cortesia.

### Explicabilidade obrigatória
Nenhum score aparece sem decomposição. Radar Unicórnio mostra as cinco dimensões;
match de edital mostra os quatro sinais com o motivo escrito.

### Degradação graciosa
O mundo 3D detecta a capacidade do dispositivo e escolhe entre três níveis de
qualidade, com fallback textual quando não há WebGL.

---

## Segurança e privacidade

- Senhas com scrypt, tokens de sessão em store
- Papel de administrador por e-mail configurado ou primeiro usuário registrado
- Rotas administrativas com middleware dedicado
- Webhook do Stripe com validação de assinatura sobre corpo bruto
- **LGPD por desenho:** dados do usuário não saem do contexto do usuário
- **Acervo blindado:** auditoria automatizada verifica vazamento de identificadores
  em todas as rotas

---

## Pulso Diário

A plataforma trabalha enquanto o fundador dorme:

```
varre editais → recalcula matches → atualiza radar → gera alertas → publica
```

Idempotente por dia, dispara no boot se atrasado, verifica a janela a cada 6 horas.
