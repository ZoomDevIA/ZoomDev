# Pitch Startup World Cup, renome do Coin Max e a linha branca do PDF

Três entregas de uma tacada só, ligadas pelo mesmo documento: o deck de
inscrição para o Startup World Cup Florianópolis 2026.

---

## 1. Biogenesis virou Coin Max

Renome do bioinsumo em toda a plataforma, feito em três camadas com critérios
diferentes.

| Camada | O que aconteceu | Por quê |
|---|---|---|
| Texto visível | tudo virou **Coin Max** | é o nome do produto, tem que ser único |
| Identificadores de código | renomeados junto | `science/biogenesis.js` → `science/coinmax.js`, `sequestroBiogenesis` → `sequestroCoinMax`, `CULTURAS_BIOGENESIS` → `CULTURAS_COINMAX`, `producaoComBiogenesisTon` → `producaoComCoinMaxTon` |
| Rotas de API | renomeadas | `/impacto/biogenesis` → `/impacto/coinmax`, `/carbon/biogenesis` → `/carbon/coinmax` |
| Id do agente no banco | **mantido** como `biogenesis` | está gravado em conversas e projetos existentes. O que mudou foi o nome de exibição, para `Coin Max AI` |

### O que continuou com o nome antigo, de propósito

- **A empresa** segue **COT BioTechnology**. O produto mudou, o fabricante não.
  `IDENTIDADE` ganhou um campo `fabricante` separado da `marca`, que antes
  vinham grudados numa string só.
- **O token continua BIOGEN.** O lastro dele é tonelada verificada de CO₂e,
  não o insumo que a gerou. Renomear a sigla amarraria um ativo a um
  fornecedor, e um dia haverá mais de um.

### Um defeito encontrado no caminho

A aba de dossiê da página `/impacto` lia `identidade.dosagem.litrosPorHectare`.
O objeto `IDENTIDADE` nunca teve `dosagem`: a leitura estourava em
`TypeError` e derrubava o componente inteiro. Havia mais quatro campos
inexistentes na mesma lista (`registroMapa`, `registrante`, `desenvolvedor`,
`nomeHistorico`).

A lista foi alinhada com a forma real do objeto, e ganhou um `.filter` que
descarta campo vazio, para o mesmo erro não voltar quando alguém acrescentar
uma linha nova.

---

## 2. A linha branca entre os cartões

O PDF do deck mostrava um filete claro separando um cartão do outro. Não era
impressão de quem olhava.

### A medição

Cada página foi rasterizada a 150 dpi e teve o brilho médio medido linha a
linha:

```
linhas do topo   ....  12,31  11,31  11,31  11,30  11,31
linha do meio    ....  44,23
linhas do rodapé ....   9,29   9,08   8,98   9,70  255,00   ← branco puro
colunas          ....  esquerda 13,13   direita 8,88 e 254,35  ← branco puro
```

### A causa

O cartão tem exatamente 338 × 190 mm, o mesmo tamanho da página. A conversão
de milímetro para pixel não fecha em número inteiro, e sobra uma fração de
pixel na borda direita e na de baixo que elemento nenhum pinta. O fundo padrão
de uma página PDF é branco.

### A correção, em duas partes

```css
.slide  { box-shadow: 0 0 0 3mm var(--fundo); }
.sangria { position: fixed; inset: -4mm; background: var(--fundo); }
```

A sombra é só espalhamento: pinta 3 mm para fora da caixa, e o recorte da
página apara o excesso. Isso resolveu doze das treze páginas.

A última não tem quebra forçada depois dela, e ali o Chromium apara o
transbordo de tinta na altura exata do documento, devolvendo o filete de um
pixel. Elemento com `position: fixed` é repetido em toda página impressa e não
depende do fluxo, então a camada de sangria cobre o caso que sobrou.

### Verificado

Contagem de pixels claros na borda, com a página rasterizada em escala inteira
(1690 × 950, que é 338:190 exato, sem preenchimento do rasterizador):

| Documento | Páginas | Pixels claros na borda | Pico |
|---|---|---|---|
| `swc-pitch-2026` | 14 | **0** | 20,3 |
| `deck-cidades-regenerativas` | 13 | **0** | 20,3 |

O pico de 20,3 é o próprio gradiente do deck, não papel.

---

## 3. O pitch

`docs/institucional/swc-pitch-2026.html` e o PDF de mesmo nome.

### A engenharia reversa dos dois documentos oficiais

O formulário de inscrição e o template da Pegasus não pedem a mesma ordem, e
a diferença é intencional.

| Origem | Ordem | Serve para |
|---|---|---|
| Formulário | Problem, Solution, Product, Business Model, Market, Competition, Growth, Traction, Financials, Team, Funding | checklist de triagem |
| Template Pegasus | Cover, Problem, Solution, **Traction**, Business Model, Market, Financials, Team, Competition, Funding, Summary | roteiro de palco, com tempo por lâmina |

Tração sobe da oitava para a quarta posição no palco: a Pegasus quer prova de
realidade antes de o candidato pedir crédito pelo tamanho do mercado.

**A escolha:** ordem de palco, com o índice das 11 obrigatórias na capa,
cada uma com o número da página. O jurado de checklist encontra tudo numa
olhada e a narrativa continua sendo a que a própria Pegasus recomenda.

### Orçamento de tempo

São 4 minutos de pitch e 2 de perguntas. O selo de segundos ao lado do rótulo
de cada lâmina soma 225 nas doze de conteúdo; os 15 restantes são 10 segundos
de capa e 5 de fecho, que não levam selo. Total: 240.

### As 14 lâminas

| # | Lâmina | Obrigatória | Seg |
|---|---|---|---|
| 01 | Cover | — | 10 |
| 02 | Problem Statement | 1 | 25 |
| 03 | Proposed Solution | 2 | 25 |
| 04 | The Evidence | apoia 2 e 3 | 20 |
| 05 | Product Details | 3 | 20 |
| 06 | Current Traction | 8 | 20 |
| 07 | Business Model | 4 | 20 |
| 08 | Market Opportunity | 5 | 20 |
| 09 | Growth Strategy | 7 | 15 |
| 10 | Financials | 9 | 15 |
| 11 | Team | 10 | 20 |
| 12 | Competition | 6 | 15 |
| 13 | Current Funding Status | 11 | 10 |
| 14 | Summary | — | 5 |

### A lâmina das duas folhas, e a frase que decidimos não escrever

O par de fotos entra inteiro, com `object-fit: contain` e não `cover`:
recortar foto de evidência para caber na moldura comeria as pontas dos
lóbulos, que é justamente o que se está comparando.

A cadeia de causa vai em três degraus, cada um com o selo que o sustenta:

| Degrau | Afirmação | Selo |
|---|---|---|
| 1 | Área foliar a partir de +30% | LAUDO 90 |
| 2 | +2,99 tCO₂e por hectare por ano, cenário conservador | ESTIMATIVA |
| 3 | "30% a mais de descarbonização" | **não escrito** |

O terceiro degrau ficou de fora porque não fecha. Fotossíntese não escala em
linha reta com área foliar, e carbono assimilado não é carbono sequestrado. E
o protocolo interno da plataforma já determina que o ganho de sequestro por
área foliar fica "sempre em modo ESTIMATIVA até haver MRV instrumentado":
escrever o contrário no deck seria a empresa contrariando a própria regra em
público, na lâmina que fala do produto.

A lâmina diz isso na cara, e transforma o limite em argumento:

> We could claim thirty percent more decarbonization on this slide. Our own
> protocol forbids it until instrumented MRV and third-party verification are
> in place. That rule is not a disclaimer. It is the product.

### Tração, sem maquiagem

A empresa é pré-receita. A lâmina 06 divide a tela em duas: à esquerda o que é
fato de sistema e pode ser aberto e conferido; à direita, em roxo, o que falta
preencher. CAC, LTV, retenção, churn e NPS aparecem declarados como ainda não
mensuráveis, em vez de inventados.

### Mercado, duas contas independentes

O template exige demonstrar um bilhão de dólares. A lâmina traz as duas contas
que ele pede, cada uma com a fonte impressa:

- **Top-down:** mercado voluntário de carbono em US$ 15,8 bi (2025), com a
  faixa de 2030 apresentada dos dois lados, US$ 7 a 35 bi pelo MSCI e US$ 120
  bi pela Mordor. Mostrar a estimativa conservadora junto da otimista é o
  mesmo princípio do selo de evidência aplicado a mercado.
- **Bottoms-up:** 28 milhões de hectares de pastagem degradada com potencial
  de conversão (Embrapa, publicado em *Land*) × 2,99 tCO₂e/ha/ano do nosso
  próprio motor = 83,8 Mt CO₂e por ano. A US$ 20 a tonelada, US$ 1,68 bi de
  valor bruto anual. Ao take rate de 12%, US$ 201 milhões de receita
  potencial só no Brasil.

### Campos que dependem do fundador

Tudo que está com a classe `.preencher`, em roxo, é dado que só o fundador
tem, e por isso não foi inventado:

- **Team:** nomes, formação, trajetória, prêmios, patentes
- **Funding Status:** estágio, captado, pedido, runway
- **Traction:** pipeline nomeado, hectares sob carta de intenção, usuários
- **Summary:** nome completo, e-mail e URL de produção no card de contato

---

## Mapa

```
server/src/science/coinmax.js            perfil técnico, IDENTIDADE com fabricante
server/src/science/biogen.js             por que o token continua BIOGEN
server/src/routes/impacto.js             rota /coinmax
server/src/routes/carbon.js              rotas /coinmax e /coinmax/opcoes
web/src/pages/Impacto.jsx                dossiê alinhado com a forma real do objeto
docs/institucional/swc-pitch-2026.html   o pitch, editável
docs/institucional/assets/               as duas fotos e o QR do vídeo
scripts/gerar-deck.mjs                   gerador parametrizado, embute marca e imagens
```

## Limites conhecidos

- Os dois links de vídeo enviados apontam para o mesmo `CRcbrivAIpY`: mudava
  só o parâmetro de rastreio do compartilhamento. O card final tem um QR só.
- O custo de inferência por seiva na lâmina de modelo de negócio é premissa
  declarada, não medição. A contabilidade por chamada precisa existir antes de
  a margem virar número com selo.
- As taxas de conversão do financeiro são a linha mais frágil do deck, e estão
  marcadas como tal na própria lâmina. É onde o Q&A vai bater.
