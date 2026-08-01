# Jornada do Usuário ZoomDev — desenho implementado e sugestões de aprimoramento

> Implementação: `server/src/routes/projects.js` (encadeamento) + `web/src/pages/*`.
> Decisão de pricing do fundador: **PRO R$ 149/mês · BUSINESS R$ 199/mês** (Free R$ 0).

## 1. A jornada encadeada (como está no produto)

```
Caixa de Ideação ──► Classificação ──► 5 Agentes geram o Plano ──► DOCX/PDF
      │                (startup ×          (Produto, Negócio,          │
      │                 biostartup,         Engenharia, Impacto,       ▼
      │                 auto pela IA)       Editais — em paralelo)   O PLANO VIRA COMBUSTÍVEL:
      │                                                             o sistema puxa o plano e
      └── botão 🍃 Calculadora de                                   abre a fase de VALIDAÇÃO
          Passivo Ambiental (CarbonPay)                             com missões derivadas dele
```

1. **Ideação inteligente:** o fundador descreve a ideia; escolhe 🚀 Startup / 🌿 BioStartup
   ou deixa a IA decidir. A classificação automática mostra a justificativa ("por que a IA
   entendeu que é bio") e a jornada correspondente aparece imediatamente (Semente → Floresta).
2. **Geração viva:** os 5 agentes trabalham em paralelo com progresso em tempo real (SSE).
   Custo exibido antes (60 🌿) e **estorno automático** se qualquer agente falhar (QA-gate).
3. **Plano como insumo, não fim:** ao concluir, o sistema (a) salva o plano diagramado
   (visível na plataforma, baixável em DOCX e PDF), (b) marca Ideação como concluída,
   (c) **abre a fase de Validação** e (d) preenche-a com missões geradas PELO próprio plano
   (entrevistas com o público-alvo do plano, validação do pricing do plano, teste do
   concorrente do SWOT). Celebração: XP + conquistas + subida de nível.
4. **Validação gamificada:** missões principais destravam o avanço para MVP; cada missão
   dá XP + seiva (créditos reais de IA). O loop fecha: jogar gera créditos que geram IA.
5. **Carbono transversal:** a calculadora é acessível desde a caixa de ideação; calcular dá
   XP e a conquista "Guardião da Floresta"; compensar via CarbonPay dá "Pegada Compensada".

## 2. Sugestões de aprimoramento da jornada (roadmap recomendado)

### Curto prazo (alta alavancagem, baixo esforço)
1. **Classificação com confirmação em 1 clique:** quando a IA classifica com confiança
   média/baixa, mostrar "Entendi como BioStartup — confirmar ou trocar?" antes de seguir.
   Evita jornada errada sem fricção para os casos óbvios.
2. **Preview do plano durante a geração:** à medida que cada agente conclui, renderizar a
   seção correspondente já no builder (não só o status). Sensação de "está nascendo".
3. **Momento épico de avanço de fase:** animação de "evolução" (Semente→Broto) em tela
   cheia no primeiro avanço — é o momento mais memorável do loop; hoje é um toast.
4. **Missão de carbono na trilha bio:** para biostartups, injetar automaticamente a missão
   "Calcule seu passivo ambiental" na fase de Validação (conecta as duas features novas).
5. **Nome sugerido pela IA visível na ideação:** exibir o `nomeSugerido` como placeholder
   clicável antes de criar o projeto.

### Médio prazo
6. **Fases MVP/Tração/Escala com o mesmo padrão "output → próxima fase":** no MVP, o
   builder gera o produto e as missões de Tração derivam do go-to-market do plano; na
   Tração, métricas reais (usuários/receita) viram as missões de Escala. A regra geral:
   **cada fase termina produzindo o insumo que abre a seguinte** — nunca um beco sem saída.
7. **Auto-Pitch encadeado:** ao concluir Validação, gerar automaticamente o pitch deck
   (o protótipo já previa "Auto-Pitch") usando plano + resultados das missões.
8. **Editais como boss battles:** o Agente Editais já entrega score de aderência; conectar
   com prazo real do edital + checklist e recompensa épica na aprovação.
9. **Copiloto persistente (estilo `startup_copilot` do protótipo):** chat lateral que conhece
   o plano e as missões, com o provocador de inatividade do protótipo ("Silêncio não constrói
   startup…") reformulado como nudge gentil de streak.
10. **Certificado público CarbonPay:** integrar API de retirement (Patch/Cloverly) e emitir
    certificado com serial do registro — transforma o CarbonPay de demo em receita real.

### Diferenciais estruturais (manter sempre)
- **Créditos justos:** custo antes da ação + estorno em falha (nenhum concorrente faz).
- **XP só por progresso real** (plano gerado, missão executada, fase avançada) — nunca por
  ações vazias. É o que separa gamificação de gimmick.
- **Ejeção total:** quando o builder de MVP gerar código, o repositório completo é do usuário.

## 3. Nomes canônicos (herdados do protótipo Base44 — usar nas próximas fases)

- **Agentes amazônicos (trilha bio):** Curupira AI (biodiversidade/mapeamento florestal),
  Iara AI (recursos hídricos), Boto AI (comunidades tradicionais/etnociências),
  Seringueiro AI (cadeias produtivas sustentáveis), Tucuju AI (protocolos COP30/acordos
  climáticos).
- **Zoom Intelligence:** nome do copiloto geral da plataforma.
- **CarbonPay:** fintech verde — marketplace de créditos + PIX + calculadora de sequestro
  (área/bioma/tipo de projeto → tCO2/ano) a incorporar na página Carbono.
- 8 fases de maturação do StartupStudio do protótipo (Ideação, Canvas, ICP, Pesquisa,
  Validação, MVP, Roadmap, Pitch) podem virar sub-etapas das 5 fases da jornada gamificada.
