# Motor de Impacto Regenerativo 360°

Traduz a aplicação prática do Biogenesis COT BioTechnology em impacto real e mensurável.
Cada número carrega o Selo de Evidência que o sustenta e o cenário é **conservador por padrão**.

---

## As cinco dimensões

```
                    ┌─────────────────────────┐
                    │  BIOGENESIS COT em campo │
                    └────────────┬─────────────┘
                                 ↓
                    ganho de biomassa / área foliar
                                 ↓
   ┌──────────────┬──────────────┼──────────────┬──────────────┐
   ↓              ↓              ↓              ↓              ↓
🍽️ ALIMENTAR  ⚡ ENERGIA    🌳 CARBONO    💰 ECONOMIA    🇺🇳 ODS
 produção      resíduo →      sequestro      renda +        Agenda
 adicional     biodigestor    adicional      energia +      2030
    ↓          → biogás           ↓          crédito           ↓
 kcal →        → kWh          tCO₂e          R$/ano        13 ODS
 pessoas/ano   comunidade                                  justificados
```

## 1. Segurança alimentar
Produção adicional → kcal → **pessoas-ano em equivalente calórico** (referência FAO: 2.100 kcal/dia).
Métrica declarada como *equivalente calórico*, nunca como "alimenta X pessoas" — honestidade metodológica.

## 2. Transição energética verde justa — o elo que ninguém conecta

Este é o diferencial. A cadeia completa:

```
biomassa extra → resíduo agrícola → biodigestão anaeróbia → biogás
                                                              ↓
                            ┌─────────────────────────────────┴──────────────┐
                            ↓                                                ↓
                  🔥 ROTA TÉRMICA                                  💡 ROTA ELÉTRICA
                  cocção comunitária                               motor-gerador
                  substitui GLP (botijão P13)                      substitui diesel
                            ↓                                                ↓
                  famílias com fogão limpo                          domicílios com energia
```

**Balanço fechado — regra inegociável:** cada m³ de biogás segue **uma** rota. O mesmo
conteúdo energético **nunca** é contabilizado como GLP e diesel ao mesmo tempo. A divisão
é explícita (padrão 50/50) e aparece na interface. Dupla contagem é o erro que destrói a
credibilidade de qualquer projeto de carbono — o motor é arquitetado para torná-la impossível.

**Por que "justa"** (definição OIT): a energia é gerada e gerida **pela própria comunidade**.
Quem regenera o território é dono da energia e da renda que produz — não fornecedor de
matéria-prima barata para terceiros. Isso responde à dependência de diesel transportado por
longas distâncias fluviais na Amazônia.

### Parâmetros (selo 📄 Pesquisa)
| Parâmetro | Valor |
|---|---|
| Biogás por tonelada de sólidos voláteis | 350 m³ |
| Matéria seca do resíduo fresco | 35% |
| Sólidos voláteis / matéria seca | 80% |
| Metano no biogás | 60% |
| Energia do biogás | 6,0 kWh/m³ |
| Eficiência do motor-gerador | 35% |
| Botijão P13 evitado | 175 kWh · 37,4 kgCO₂e |
| Diesel evitado | 3,4 kWh/L · 2,6 kgCO₂e/L |
| Domicílio rural amazônico | 1.800 kWh/ano |

## 3. Carbono e ecossistemas
Sequestro adicional pelo ganho de biomassa: matéria seca × 47% (fração de carbono, IPCC) × 3,667 (CO₂/C).
**Sempre em modo `ESTIMATIVA`.** Vira crédito apenas com MRV instrumentado, verificação por
terceira parte acreditada, aposentadoria em registro público e avaliação de adicionalidade e permanência.

## 4. Economia / bioeconomia
Receita agrícola adicional + economia de energia (impacto direto) apresentadas **separadamente**
do potencial de crédito de carbono — que só se realiza após verificação e nunca é somado como certo.

## 5. ODS — justificados, não declarados
Até 13 ODS, cada um com o número da simulação que o sustenta. ODS 2, 7, 13 e 15 são o núcleo;
ODS 10 e 17 vêm da estrutura do programa (quilombolas, indígenas, PNDR, IFAP).

---

## Programa INCEMA/MIDR — o caso-âncora real

| | |
|---|---|
| Instrumento | Termo de Fomento, Lei 13.019/2014 art. 51 |
| Valor global | **R$ 3.798.400,00** |
| Executor | INCEMA (OSC, CNPJ 05.480.483/0001-92) |
| Concedente | Secretaria da Pesca e Aquicultura do Amapá |
| Execução financeira | OCB — Sistema de Cooperativas do Amapá |
| Política pública | PNDR — Política Nacional de Desenvolvimento Regional |
| Beneficiários | 17 entidades · 732 famílias · 1.148 ha declarados |
| Insumo | 17.220 L a R$ 140/L · 5 L/ha · 3.444 ha-aplicação |
| Motivação | Decreto estadual nº 6.621/AP — emergência fitossanitária na mandioca |
| Verificação | SEI/MIDR 5205257 · CRC 83DFD260 |

Perfil dos beneficiários: **4 entidades quilombolas/indígenas** e **5 extrativistas** entre as 17.

### Divergência documental detectada
O Plano de Trabalho declara **1.148 ha**, mas a soma das culturas listadas resulta em **1.508 ha**.
A plataforma **expõe o conflito e adota o valor mais conservador** (1.148 ha), sinalizando a
necessidade de reconciliação com o concedente antes de qualquer uso em MRV ou emissão de crédito.

> Princípio: a plataforma nunca escolhe um número em silêncio.

## Endpoints

```
POST /api/impacto/simular            simulação 360° (culturaId, hectares, cenarioId)
GET  /api/impacto/simular-programa   impacto agregado do programa INCEMA
GET  /api/impacto/fomento            dados verificados do programa
GET  /api/impacto/biogen             conceito da criptomoeda BIOGEN
```
