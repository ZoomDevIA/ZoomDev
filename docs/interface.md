# Primeira dobra, caixa de contexto e a moldura da Maiá

Três correções de interface, nascidas de três capturas de tela da produção.
Nenhuma delas muda a paleta, a tipografia ou a estrutura das telas: mudam
onde as coisas ficam, quanto ocupam e como são acionadas.

---

## 1. A dobra que não fechava

A área de ideação nascia alta demais. Título, caixa de texto e os dois
seletores enchiam a tela, e o botão de construir ficava abaixo do que o
navegador mostrava. A ação principal exigia rolagem para aparecer.

### A altura vem de medição, não de estimativa

O cabeçalho é lido em tempo de execução, com `ResizeObserver`, e a seção de
ideação recebe `calc(100dvh - altura do cabeçalho)` como altura mínima, com o
conteúdo centrado nela.

Duas escolhas explicam esse desenho:

| | |
|---|---|
| Por que medir | num celular estreito o cabeçalho quebra de linha e fica mais alto. Subtrair um valor fixo erraria justamente onde o espaço é escasso |
| Por que `dvh` e não `vh` | `vh` ignora a barra do navegador móvel, que aparece e some. Com `vh` o botão sairia da tela exatamente quando a barra estivesse visível |

É altura **mínima**, não fixa: numa tela muito baixa o conteúdo simplesmente
ultrapassa e a página rola, sem cortar nada.

### A caixa de texto cresce com o texto

Antes tinha cinco linhas fixas, cheias de vazio enquanto ninguém escrevia.
Agora nasce curta e cresce conforme se digita, até um teto proporcional à
janela (24% da altura, 22% em tela estreita).

### O defeito que só apareceu na medição

No celular de 360 px a caixa vazia media 148 px, quase o dobro do esperado
para duas linhas. A causa não era o conteúdo: era o **texto de exemplo**. O
navegador dimensiona `scrollHeight` pelo placeholder, e o exemplo longo
embrulhava em cinco linhas.

Foi confirmado apagando o placeholder na marra, no console: a altura caiu de
156 para 88 px na mesma hora.

A correção é uma frase curta para tela estreita e a longa para as demais,
escolhidas por largura. Isso sozinho devolveu 62 px, o que fez o botão caber.

### Verificado

| Tela | Fim do botão | Altura da janela | Cabe |
|---|---|---|---|
| 360 × 740 | 735 | 740 | sim |
| 390 × 844 | 717 | 844 | sim |
| 768 × 1024 | 756 | 1024 | sim |
| 1280 × 800 | 647 | 800 | sim |
| 1920 × 1080 | 787 | 1080 | sim |

Sem rolagem horizontal em nenhuma delas.

---

## 2. A caixa de contexto dos módulos

Ela abria para baixo e cobria o botão de construir e os números do
ecossistema. Ou seja: escondia a ação principal no exato momento em que a
pessoa estava decidindo se ligava o módulo.

### Passou a abrir para cima

Acima dos seletores está a área de digitação, que ninguém está usando
enquanto escolhe um módulo. O lado é decidido na abertura, com a posição real
do cartão na janela, e ela desce quando não há espaço acima.

A caixa não recebe clique (`pointer-events: none`): o mouse atravessa e o
gesto de sair do cartão continua fechando, como se espera de uma dica.

### E encolheu no texto, não no corte

O corpo tinha 268 caracteres e rendia seis linhas. Encurtar visualmente, com
teto de altura e corte, esconderia meia frase e deixaria a pessoa sem a
informação. O texto foi encurtado **na origem**, em `server/src/routes/home.js`,
onde ele mora justamente para nunca descrever algo diferente do que o módulo
faz. Os ganhos continuam completos, todos eles: o detalhe está ali, em leitura
de varredura.

Resultado: 183 px de altura para 168 no desktop, com a tipografia um ponto
menor em cada nível, e nada oculto.

### No celular

Sem mouse não existe passar por cima. O toque no corpo do cartão abre a caixa,
o toque em qualquer outro lugar fecha, e a alavanca segue com a função dela.

---

## 3. A moldura da Maiá

O copiloto ainda era o desenho antigo: círculo com borda verde grossa e uma
gaveta de cantos arredondados. Fora da linguagem do resto da plataforma.

### Três peças, sempre as mesmas

```
ANEL ──fio── PAINEL
```

O anel segura o rosto. O fio é a linha-guia do HUD, com terminador em ponto.
O painel é a superfície chanfrada que carrega o texto.

| Estado | O que aparece |
|---|---|
| Recolhido | só o anel, com o arco luminoso girando devagar |
| Prévia | o fio se desenha e o painel abre à esquerda, com nome e função |
| Aberto | a janela do chat, com a mesma composição no cabeçalho |

Na prévia a composição é **espelhada** em relação ao desenho de referência,
painel à esquerda e anel à direita, porque o widget vive no canto inferior
direito da tela: abrir para a direita seria abrir para fora da janela. No
cabeçalho da janela aberta, onde há largura, a ordem original volta.

O anel é um cone de gradiente recortado por máscara radial. Assim ele vira
anel de verdade, sem pintar o miolo, que é onde a Maiá aparece.

### O defeito dos dois passos que viraram um

No celular o primeiro toque devia abrir a prévia e o segundo a conversa. Na
prática o primeiro toque já abria a conversa.

A causa: **tocar num botão também dá foco a ele**, e o `onFocus` abria a
prévia. Quando o clique chegava, a prévia já estava aberta, e o mesmo gesto
seguia direto para a conversa.

A correção usa `:focus-visible`, que o navegador aplica em foco de teclado mas
não em foco vindo de ponteiro:

```js
onFocus={(e) => { if (e.target.matches(':focus-visible')) setPrevia(true); }}
```

Conferido no navegador com emulação de toque: primeiro toque abre a prévia com
162 px, segundo toque abre a conversa.

### O que mais mudou por dentro

- Bolhas de mensagem com a mesma borda de um pixel dos painéis, em escala menor.
  O conteúdo de cada bolha vai dentro de um elemento, porque o preenchimento do
  painel é pintado por `::after` e cobriria um nó de texto solto.
- Campo e botão de enviar passam a usar `hud-campo` e `hud-botao`.
- `Escape` fecha, o cursor entra no campo ao abrir.
- `backdrop-filter` saiu: o preenchimento já é opaco, então ele custava GPU sem
  aparecer.

---

## Mapa

```
web/src/pages/Home.jsx              medição do cabeçalho, dobra, caixa que cresce
web/src/components/ModuloSwitch.jsx caixa de contexto: lado, tamanho, toque
web/src/components/Copiloto.jsx     anel, fio, painel, janela
web/src/hud.css                     seção "MOLDURA DA MAIÁ"
server/src/routes/home.js           texto dos módulos, encurtado na origem
```

## Limites conhecidos

- A referência `Moldura de perfil_MAIA.png` chegou como imagem na conversa e
  não está no repositório. A moldura foi programada a partir dela, não medida
  em cima do arquivo. Subindo o PNG para `web/public/assets/`, dá para acertar
  proporção e curvatura no detalhe.
- O lado da caixa de contexto usa uma estimativa de altura (190 px) para
  decidir se abre para cima. Se o texto de um módulo crescer muito, a decisão
  fica conservadora, nunca errada, mas pode escolher o lado de baixo quando o
  de cima ainda caberia.


---

## 4. Os quatro botões que viraram caixas vazias

No Dashboard, os atalhos de análise apareciam como quatro molduras sem rótulo
nenhum. Os textos estavam no código o tempo todo.

### A causa

O chanfro com contorno é feito em duas camadas: `::before` pinta a linha e
`::after` pinta o preenchimento um pixel menor. Para o conteúdo não ficar
embaixo do preenchimento, existia esta regra:

```css
.hud-painel > * { position: relative; z-index: 1; }
```

Ela levanta os **elementos** filhos. O que ela não alcança é **texto solto**:
um nó de texto não é `*`, não aceita `position` nem `z-index`, e continuava
sendo pintado abaixo do `::after`.

Os botões eram exatamente isso:

```jsx
<button className="zd-stat-card …">{a.icon} {a.label}</button>
```

Texto direto, sem elemento em volta. O preenchimento passava por cima.

### A correção

As duas camadas foram para `z-index: -1`, em `.hud-painel` e no bloco de
retrofit das classes antigas. Assim **tudo** o que o elemento contém, texto
solto inclusive, é desenhado por cima. O `isolation: isolate` que já existia é
o que impede o `-1` de escapar para trás da página.

Corrigir na folha de estilo, e não nos quatro botões, foi a escolha certa: o
mesmo defeito esperava em qualquer tela que escrevesse texto direto dentro de
um bloco chanfrado, e ninguém iria lembrar da regra na décima tela.

### Verificação

Uma varredura em 13 rotas mediu, para cada bloco chanfrado, se o preenchimento
continuava presente e se algo cobria o conteúdo. Resultado: **nenhum painel
perdeu o fundo** e a única sobreposição restante é o widget da Maiá sobre si
mesmo, igual em todas as rotas.
