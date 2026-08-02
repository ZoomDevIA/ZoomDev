# Corpus Regenerativo, Calculadora e Radar de Editais

## 1. Corpus Regenerativo — conhecimento interno, não conteúdo

`server/src/science/corpus.js` é a camada **interna** que destila o acervo documental
do fundador em parâmetros, protocolos e doutrinas operacionais.

**Não é servido por nenhuma rota pública** e não contém — nem pode receber:
nomes de entidades, cooperativas, pessoas ou instituições; CNPJs; valores de contrato;
códigos de processo; contagens de beneficiários; ou localidades específicas de ensaio.

O que ele carrega é **conhecimento**: como a tecnologia se comporta, em que condições,
com que confiança. O usuário sente a qualidade do dado sem nunca ver a fonte.

### O achado que organiza tudo
A resposta do Biogenesis é **inversamente proporcional à qualidade inicial do solo**:

| Condição do solo | Ganho de produtividade | Confiança | Faixa |
|---|---|---|---|
| Degradado (ácido, sem correção) | **+200%** | 🌱 Laudo | 120–200% |
| Em recuperação | +80% | 🌾 Campo | 40–110% |
| Corrigido e manejado | +30% | 🌱 Laudo | 15–45% |

Isso inverte a lógica do agro convencional e transforma a tecnologia em **instrumento de
justiça social**: entrega mais onde a agricultura familiar mais sofre.

### As três doutrinas (injetadas em TODOS os PICs)
1. **Doutrina de Evidência** — escala de selos, regra do elo mais fraco, mecanismo ≠ resultado, balanço físico fechado, divergência se expõe.
2. **Doutrina Regenerativa** — visão 360°, hierarquia de mitigação, transição justa (OIT), ODS com número.
3. **Confidencialidade do Acervo** — o que nunca pode ser citado ao usuário; ao ser questionado sobre origem, responder pelo **nível de evidência**, nunca pelo documento.

---

## 2. PICs 2.0 governados — 27 agentes + Sexta-Feira

| | Antes | Agora |
|---|---|---|
| Sexta-Feira | v1.x, versionada no banco | **v2.0.0** com visão 360° e doutrinas |
| 27 agentes | v1.0.0 estáticos no código | **v2.0.0 versionados**, com histórico e rollback |

**Migração automática e não destrutiva** (`protocols/migracao.js`): quando a versão base do
código evolui, o sistema versiona no boot, calcula o **diff por agente** (quais campos mudaram)
e preserva o histórico. O administrador vê o que mudou e pode reverter.

As **doutrinas ficam fora das seções editáveis** pela autoevolução — são a base ética
compartilhada e só mudam por atualização de código, nunca por decisão autônoma da IA.

---

## 3. Calculadora de Passivo Ambiental

`server/src/services/passivoAmbiental.js`

**Perfis setoriais** — cada um pergunta só o que importa:
`digital` · `agro` · `industria` · `comercio` · `evento`

**Módulo agro** (novo): N₂O de fertilizante nitrogenado (4,29 kgCO₂e/kg N, IPCC 2019),
calcário agrícola, fermentação entérica, queima de resíduo em campo, defensivos, frete fluvial.

**Faixa de incerteza** em vez de número único — propagação em quadratura com incerteza por
escopo (E1 10%, E2 7%, E3 30%). *Um inventário honesto declara sua margem; número único é
falsa precisão.*

**Benchmark** por porte e setor para dar contexto ao resultado.

---

## 4. Plano de Compensação

`server/src/services/planoCompensacao.js` · exportável em **DOCX** e **HTML diagramado**

```
   MEDIR  →  REDUZIR  →  COMPENSAR
```

**Compensar antes de reduzir é greenwashing.** O motor força a ordem:

- **Medir**: inventário por escopo, maiores fontes, incerteza, metodologia
- **Reduzir**: 13 oportunidades catalogadas, priorizadas por `impacto ÷ custo`, com "ganhos rápidos" (baixo custo + economia financeira) destacados, e roadmap plurianual com curva acelerada no início
- **Compensar**: apenas o residual, com margem de 20%. Duas rotas comparadas — **área própria regenerada** (mantém o valor no território) vs **crédito verificado** (efeito imediato)

**Conformidade explícita** no documento: o que você **pode** e **não pode** afirmar
publicamente (ISO 14068-1 / CONAR). Mais alinhamento ODS justificado por número.

---

## 5. Radar de Editais + Pulso Diário

`server/src/services/radarEditais.js` e `pulsoDiario.js`

**Varredura diária.** Com `ANTHROPIC_API_KEY`, a Sexta-Feira busca na internet chamadas
abertas (FINEP, FAPs, Sebrae, BNDES, CNPq, Embrapii, CONFAP, MCTI), estrutura os dados e
descarta o que não tem prazo futuro ou fonte verificável. Sem chave, opera sobre a base
curada recalculando prazos e matches.

**Match multi-sinal explicável** (0–100), nunca um número solto:

| Sinal | Peso | O que avalia |
|---|---|---|
| Tema | 35 | Alinhamento bio × foco socioambiental da chamada |
| Estágio | 25 | Fase do projeto vs estágio esperado |
| Maturidade | 20 | Plano pronto e missões de validação concluídas |
| Prazo | 20 | Janela ideal (20 pts em 8–30 dias; penaliza < 7 dias) |

**Pulso Diário** — a plataforma trabalha enquanto o fundador dorme. A cada ciclo:
varre editais → recalcula matches de todos os projetos → atualiza o Radar Unicórnio →
gera alertas de novo match e de prazo curto (≤ 15 dias com score ≥ 70) → publica no app.

Agendamento: dispara no boot (se atrasado) e verifica a janela a cada 6h. Idempotente por dia.

## Endpoints

```
GET  /api/carbon/perfis                        perfis setoriais e campos
POST /api/carbon/calcular                      inventário com incerteza e benchmark
POST /api/carbon/plano-compensacao             gera o plano completo
GET  /api/carbon/plano-compensacao/:id.docx    documento Word
GET  /api/carbon/plano-compensacao/:id.html    versão diagramada

GET  /api/editais                              chamadas abertas com dias restantes
GET  /api/editais/radar                        estado do radar e cobertura
GET  /api/editais/matches                      melhores matches do usuário
GET  /api/editais/matches/:projetoId           matches com decomposição explicável
GET  /api/editais/alertas                      alertas gerados pelo pulso
POST /api/editais/varrer                       varredura sob demanda (admin)
```
