# ZoomDev Studio

O espaço de trabalho onde a ideia vira empresa. Duas janelas, uma trilha de
fases, e um palco diferente para cada etapa da jornada.

---

## 1. A ideia por trás do desenho

Ferramentas como Lovable e Base44 acertaram numa coisa: **conversa de um lado,
resultado do outro, na mesma tela**. Quem descreve uma mudança quer ver a
mudança acontecer, não navegar até outra página para conferir.

O Studio adota essa forma e muda o conteúdo. Onde essas ferramentas mostram
código o tempo todo, aqui a janela da direita muda conforme a fase do projeto:

| Fase | Palco à direita | O que se faz |
|---|---|---|
| Ideação | **Documento** | O plano de negócios num editor de verdade |
| Validação | **Missões** | O que testar na rua, e o quadro de hipóteses |
| MVP | **Estúdio** | Árvore de arquivos, editor de código e prévia ao vivo |
| Tração | **Métricas** | Economia unitária, pista de caixa, plano contra realizado |
| Escala | **Dataroom** | Prontidão para investidor, material e parecer do conselho |

A janela da esquerda é sempre a mesma: o **Console**, onde se escreve, anexa,
dita por voz e acompanha o raciocínio dos agentes.

**Rota:** `/studio/:id`. A caixa de ideação da home leva direto para lá.
A ficha detalhada do projeto continua em `/projetos/:id`.

---

## 2. Chassi

`web/src/components/studio/Chassi.jsx`

- Divisor arrastável entre as duas janelas, com a proporção guardada em
  `localStorage` (`zd_studio_console`). Quem trabalha o dia inteiro no editor
  quer o palco maior e não deve reajustar a cada visita.
- Operável por teclado: setas movem 2%, `Home` e `End` vão aos extremos.
- Abaixo de 1024px o divisor desaparece e as janelas viram abas. Espremer um
  editor de texto e um console lado a lado num tablet não serve a nenhum dos
  dois.

A altura do Studio é **medida em tempo de execução** (`getBoundingClientRect`),
não subtraída da viewport com um número fixo: qualquer mudança na altura do
cabeçalho quebraria a conta fixa em silêncio.

---

## 3. ZoomDoc, o editor

`web/src/components/zoomdoc/`

Um editor feito para **um** documento, o plano de negócios. Por isso faz bem as
quarenta coisas que esse documento pede em vez de fazer mal as mil que o Word
acumulou.

**Núcleo:** ProseMirror via TipTap 3.

**A camada ZoomDev por cima:**

- Página A4 com margem, sombra e canto chanfrado da marca.
- **Dois temas de folha**: escuro por padrão (a plataforma é escura, e papel
  branco de escritório dentro dela cansa a vista) e claro para quem vai
  imprimir. O botão do sol alterna; `Ctrl+P` imprime sempre em claro.
- Estilos de parágrafo da marca, não uma lista genérica de fontes.
- Numeração automática de seções por CSS `counter`: o documento se organiza
  sozinho conforme os títulos entram e saem.
- Sumário lateral que se reconstrói a cada alteração de título, com busca.
- Tabelas redimensionáveis.
- **Salvamento automático** 1,1 segundo após a última tecla, com aviso ao
  fechar a aba se algo ainda estiver pendente.

### Blocos vivos

Três nós de documento que o Word só conseguiria imitar desenhando caixinhas:

| Bloco | Para quê | Atributos |
|---|---|---|
| `blocoIndicador` | Um número que sustenta um argumento | valor, rótulo, nota, cor |
| `blocoSelo` | O grau de evidência daquela afirmação | nível, texto, fonte |
| `blocoCitacaoFonte` | De onde veio o dado | texto, fonte, url |

Sendo estrutura e não formatação, o selo continua legível para o motor que
calcula o grau de evidência do plano inteiro pela regra do elo mais fraco.
Uma caixinha desenhada à mão não teria como ser lida.

Tudo é serializado em `data-*` no HTML, então o documento salvo é texto puro e
volta idêntico na abertura seguinte.

---

## 4. Caixa de contexto

`web/src/components/studio/CaixaContexto.jsx`

Quatro entradas na mesma caixa.

### Teclado
`Enter` envia, `Shift+Enter` quebra linha. A caixa cresce com o conteúdo até um
teto e volta quando esvazia.

### Anexos

| Formato | Como é lido |
|---|---|
| PDF | `pdf-parse`; PDF digitalizado sem texto é recusado com explicação |
| DOCX | `mammoth` |
| PPTX | ZIP de XML lido slide a slide via `JSZip` |
| TXT, MD, CSV | direto, com detecção de binário disfarçado |
| PNG, JPEG, WEBP, GIF | seguem como imagem para o modelo, que enxerga |
| Áudio e vídeo | transcritos pelo Deepgram |

Limite de 25 MB. **O arquivo não é guardado**: chega na memória, é lido, e o que
sobra é o texto extraído dentro do projeto do dono. Guardar o binário criaria
uma responsabilidade de custódia que a plataforma não precisa assumir.

### Voz
Web Speech API, roda no próprio aparelho, sem custo. A onda de nível vem do
microfone por `AnalyserNode` e é separada do reconhecimento: é prova visual de
que o microfone está captando, porque sem ela silêncio do reconhecedor e
microfone mudo parecem a mesma coisa. Onde não há suporte (Firefox), o botão
não aparece, em vez de aparecer e falhar no clique.

### Pré-leitura
Enquanto a pessoa digita, um passe barato extrai setor, público, modelo e
território, e mostra o que já entendeu em etiquetas. Quando ela envia, a geração
pesada já começa abastecida.

Quatro travas de disparo, e elas não são detalhe de implementação — sem elas
isso chamaria a IA a cada tecla:

1. mínimo de 25 palavras
2. pausa de 1,6 s desde a última tecla
3. teto de uma chamada a cada 20 s
4. memória por conteúdo: reescrever a mesma frase não dispara de novo

**Custo: zero.** Cobrar pela pré-leitura ensinaria o fundador a evitar
justamente o passo que melhora o resultado dele.

---

## 5. O Plano de Negócios ZoomDev

`server/src/agents/planoZoomDev.js` · `server/src/services/documentoZoomDoc.js`

Dezessete seções, cada uma com um instrumento consagrado em vez de prosa livre.

| # | Seção | Instrumento |
|---|---|---|
| 1 | Sumário executivo | o plano inteiro em uma página |
| 2 | O problema | Jobs to be Done |
| 3 | Solução e proposta de valor | inclui escopo negativo |
| 4 | Lean Canvas | os nove quadros |
| 5 | Mercado | "por que agora" + TAM/SAM/SOM nos dois sentidos |
| 6 | Cliente | personas separando quem sente a dor de quem assina |
| 7 | Concorrência | matriz ERRC do Oceano Azul, regulação com custo |
| 8 | Fosso competitivo | o que se acumula, em 12 e 36 meses, e o que o dissolve |
| 9 | Modelo de negócio e preço | planos e take rate |
| 10 | Economia unitária | CAC, LTV, payback, margem de contribuição |
| 11 | Go-to-market | Bullseye: listar amplo, testar barato, focar em um |
| 12 | Produto e roadmap | etapas com critério de saída objetivo |
| 13 | Métrica-Norte e OKRs | com contra-métrica obrigatória |
| 14 | A hipótese mais arriscada | experimento com custo, prazo, prova de vida e de morte |
| 15 | Impacto | teoria da mudança, ODS, GHG Protocol por escopo |
| 16 | Time | lacunas com mês de entrada, custo e plano até lá |
| 17 | Financeiro, riscos e o pedido | três cenários com gatilho, comparáveis de saída |

### As seis perguntas que o plano passou a responder

As quatorze seções originais descreviam bem o negócio. Faltavam as perguntas
que um investidor faz antes de olhar qualquer planilha, e que separam plano
de apresentação:

- **Por que agora?** O que mudou no mundo, quando, e por quanto tempo a janela
  fica aberta. Resposta que serviria para qualquer negócio está errada.
- **Por que você e não o incumbente com mais dinheiro?** É o fosso: o que se
  acumula com o uso e fica impossível de refazer para trás. Plano que não tem
  fosso hoje diz isso e mostra o caminho, em vez de inventar vantagem injusta.
- **E se der errado?** Três cenários, cada um com o gatilho observável que diz
  em qual deles o negócio entrou e a decisão que esse gatilho dispara.
- **Qual é a crença mais frágil?** Uma frase que, se for falsa, derruba o plano,
  virada experimento com custo em reais, prazo em semanas, o número que confirma
  e o número que manda mudar de rota.
- **Quem falta no time e quando entra?** Contratar todo mundo no mês 1 não é
  plano, é lista de desejos.
- **Como é a saída?** O EXIT do IDEA TO EXIT com número em cima: quem comprou
  empresa parecida, por quanto, em que ano. Sem comparável na pesquisa, a lista
  volta vazia — inventar múltiplo é mentira que se confere em trinta segundos.

Todas carregam selo de evidência, e as fontes da pesquisa passaram a guardar
endereço, data de publicação e data de acesso. Página de governo muda de lugar:
sem a data de acesso, um link quebrado vira "a fonte não existe" em vez de "a
fonte se mudou".

### Como a geração acontece

**Onda 1 — pesquisa.** Um agente com acesso à internet levanta tamanho de
mercado, concorrentes reais, regulação brasileira aplicável e, quando o
território foi informado, o que é específico daquela região. O resultado é
estruturado num dossiê.

**Onda 2 — cinco agentes em paralelo**, todos alimentados pelo mesmo dossiê:
Produto, Mercado, Negócio, Crescimento e Impacto.

Escrever antes de pesquisar é o que produz plano bonito e falso. Quando a
pesquisa falha, o plano ainda sai, mas os selos de evidência caem e isso fica
dito dentro do documento.

### Território

O plano pergunta onde o negócio vai operar **na hora de gerar**, não como um
pop-up na primeira visita: permissão pedida fora de contexto é negada.

- A cidade digitada é o que alimenta a pesquisa.
- A coordenada do navegador é opcional e é gravada com **uma casa decimal**:
  dá a região, não o endereço.
- "Prefiro não informar" é gravado. Quem recusou uma vez não é perguntado de
  novo, e o plano sai igual, só sem o recorte regional.

### Compatibilidade

O plano novo se projeta no formato antigo (`paraFormatoClassico`), então a
ficha do projeto, a exportação em DOCX e PDF, o Conselho dos Agentes e o
construtor de MVP continuam funcionando sem alteração. O documento rico
continua sendo a fonte.

---

## 6. Conversa que edita o documento

Quando o pedido no console é uma mudança no plano, o agente devolve
**substituições exatas** de trechos do HTML, não o documento inteiro reescrito.

Isso não é economia de token à toa: é o que impede o agente de refazer trinta
páginas para trocar uma frase e, no caminho, apagar tudo que o fundador
escreveu à mão. Se nenhum trecho casar, o documento não é tocado.

---

## 7. Palco do MVP

`web/src/components/studio/PalcoEstudio.jsx` · `server/src/agents/mvpBuilder.js`

### A direção de UX/UI vem antes do código

Sem ela, cada arquivo inventava a própria aparência e o resultado eram cinco
arquivos que não se pareciam com nada, muito menos entre si.

Agora a construção começa por um passe do **Diretor de UX/UI**, que decide e
registra:

| Bloco | O que resolve |
|---|---|
| Conceito | uma frase que amarra o produto a uma sensação, não "moderno e intuitivo" |
| Personalidade | três a cinco adjetivos num eixo escolhido, não tudo ao mesmo tempo |
| Paleta | hexadecimais concretos, com a razão de contraste declarada e conferida |
| Tipografia | fontes de sistema e escala em números, porque não há CDN neste MVP |
| Forma | raio, densidade, sombra e borda: é o que faz cinco arquivos virarem um produto |
| Arquitetura de informação | cada tela com um objetivo único e os elementos em ordem |
| Fluxo principal | cada passo diz o que a pessoa vê, faz e **como sabe que deu certo** |
| Estados | vazio, carregando, erro, sucesso e primeira visita |
| Microinterações | poucas e com propósito |
| Acessibilidade | foco visível, alvo de 44px, rótulo em todo campo, cor nunca sozinha |
| O que não fazer | o proibido neste produto, para a decisão não voltar disfarçada |

Os cinco arquivos seguintes recebem essa direção como restrição, não como
sugestão. Se o passe de direção falhar, entra uma direção determinística: um
MVP coerente com regras simples é melhor que cinco arquivos com estéticas
diferentes.

O briefing fica visível no Studio pelo botão da gota, e um resumo dele entra no
README que sai no ZIP. Quando o fundador pedir uma mudança visual, ele fala a
partir de uma decisão escrita, e não de "deixa mais bonito".

### O editor

- Árvore de arquivos recolhível, com marca de alterado e não salvo.
- CodeMirror 6 com destaque para HTML, CSS e JavaScript.
- `Ctrl+S` salva; o arquivo salvo é o mesmo que sai no ZIP, sem cópia de
  exibição.
- Prévia ao vivo por `srcdoc`, com CSS e JS embutidos na hora. Um `iframe` não
  carrega o cabeçalho de autorização, então buscar a página no servidor
  devolveria 401 — e montar o HTML no cliente ainda faz a prévia refletir o que
  está no editor agora, não o que foi salvo da última vez.

---

## 8. Preço em seiva

Recalibrado com a chegada do Studio. O plano deixou de ser cinco chamadas de
texto e passou a ser uma pesquisa real na internet mais cinco agentes
escrevendo dezessete seções com esquema fechado.

| Operação | Custo |
|---|---|
| Plano de negócios ZoomDev | **180 🌿** |
| Construção do MVP | **120 🌿** |
| Revisão do documento pelo agente | **10 🌿** |
| Rodada de conversa no console | **5 🌿** |
| Transcrição de um áudio | **15 🌿** |
| Classificação da ideia | grátis |
| Pré-leitura | grátis |

Com os 500 🌿 iniciais, o plano gratuito entrega dois planos completos e o
Studio inteiro. O PRO (3.000 🌿) dá cerca de dezesseis planos por mês.

---

## 9. Variáveis de ambiente

| Variável | Para quê | Sem ela |
|---|---|---|
| `ANTHROPIC_API_KEY` | todos os agentes | o Studio não gera plano nem responde no console |
| `DEEPGRAM_API_KEY` | transcrição de áudio anexado | anexar áudio fica indisponível; o ditado por voz continua funcionando de graça |

`GET /api/status` mostra o estado de cada uma em português, com o que fazer
quando falta.

---

## 10. Mapa dos arquivos

```
web/src/pages/Studio.jsx                    a página, o estado e o salvamento
web/src/components/studio/
  Chassi.jsx                                duas janelas e o divisor
  BarraFase.jsx                             a trilha de fases
  Console.jsx                               trilha, raciocínio, fontes
  CaixaContexto.jsx                         teclado, anexo, voz, pré-leitura
  useDitado.js                              Web Speech API e onda de nível
  usePreLeitura.js                          as quatro travas de disparo
  PedidoLocal.jsx                           consentimento de território
  Palco.jsx                                 roteia a fase para o palco
  PalcoDocumento.jsx  PalcoMissoes.jsx
  PalcoEstudio.jsx    PalcoMetricas.jsx
  PalcoDataroom.jsx
  Editor.jsx                                CodeMirror 6
web/src/components/zoomdoc/
  ZoomDoc.jsx                               o editor
  Barra.jsx                                 as ferramentas
  Sumario.jsx                               a espinha do documento
  blocos.jsx                                indicador, selo, citação
web/src/zoomdoc.css                         a folha, a página, os blocos

server/src/routes/studio.js                 todas as rotas do Studio
server/src/agents/planoZoomDev.js           as duas ondas de geração
server/src/services/documentoZoomDoc.js     JSON para HTML do editor
server/src/services/extracao.js             PDF, DOCX, PPTX, texto, imagem
server/src/services/transcricao.js          Deepgram
server/test/studio.test.js                  escape do renderizador e extração
```
