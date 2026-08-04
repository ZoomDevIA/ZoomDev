# A ponte de comando da Sexta-Feira

O painel era uma pilha de cartões: oito números soltos no topo, três seções
empilhadas e um chat na lateral. Tinha toda a informação e nenhuma hierarquia,
e por isso não respondia a pergunta que o administrador faz primeiro: **está
indo bem?**

Agora é uma ponte, na gramática do HUD de nave.

---

## 1. A regra de cor que manda em tudo

```
O REATOR usa a cor do tema.  TODO O RESTO é cinza translúcido.
```

É o que faz a composição funcionar. Na referência o azul aparece num lugar só
e o resto é estrutura apagada. Se tudo brilhasse, nada brilharia.

Por isso `nave.css` define seus próprios níveis de branco (`--n-linha`,
`--n-texto`, `--n-fraco`) e **não toca em `--zd-acento`**. Trocar o tema muda o
reator; o chassi da ponte continua igual em qualquer tema.

Isso valeu também para as peças que já existiam. O score do Radar Unicórnio
saía em verde, ciano e dourado; virou **nível de branco**, que é como a
referência mostra força de sinal: quanto mais forte, mais claro.

---

## 2. O reator, e o número que ele mede

O círculo não é enfeite: é o **índice do ecossistema**, calculado no servidor
a partir dos dados que já existiam.

| Subíndice | O que mede | Peso |
|---|---|---|
| Estrutura | projetos que viraram plano de negócios | 3 |
| Execução | missões concluídas sobre as abertas | 3 |
| Captação | cruzamentos edital × projeto com aderência ≥ 60 | 2 |
| Adesão | nudges aceitos sobre enviados | 2 |

### A regra que sustenta a honestidade do medidor

**Subíndice sem base para medir devolve `null`, não zero.**

Zero por cento de missões concluídas quando não existe missão nenhuma é uma
afirmação falsa. O painel mostraria um ponteiro no chão e o administrador
tomaria decisão em cima disso. Na tela, `null` aparece como "sem base" e o arco
correspondente fica vazado; a média ponderada ignora o que não tem base, e o
miolo diz **"3 de 4 medidos"**.

Seis testes guardam a regra, incluindo o caso em que zero é zero de verdade.

### Por que os arcos são SVG

`stroke-dasharray` num círculo dá a porcentagem exata. Arco desenhado por
gradiente cônico erra alguns graus, e medidor que erra é pior que medidor
nenhum. A coroa de traços e a varredura, essas sim, são CSS: são textura, não
medida, e assim são duzentos traços sem duzentos elementos.

---

## 3. As peças do chassi

| Peça | O que é, e por que não é enfeite |
|---|---|
| **Telemetria** | a lista técnica densa da coluna esquerda. Rótulo, linha pontilhada, valor monoespaçado. Dá densidade sem pedir atenção |
| **Carteira** | a cinta segmentada. Cada bloco é um projeto do radar, com altura pelo score. Blocos vazios seriam decoração; assim é um gráfico |
| **Botões em D** | as quatro abas, com um lado reto e outro chanfrado |
| **Estado do protocolo** | versão do PIC, propostas pendentes, agentes em campo |
| **Fundo** | vinheta radial e grade de pontos, em `background-image`. Nenhuma imagem baixada, e desliga junto com a textura no painel de Aparência |

---

## 4. Foco total

Abrir a ponte recolhe o chassi inteiro: some a barra superior e o menu lateral
vira régua de ícones. `Esc` devolve os dois de uma vez.

Isso não é código novo: a ponte apenas **pede** o modo foco, com o mesmo
`useFoco(true)` que o Studio já usava. A tela declara o que quer e o chassi
obedece.

No celular o foco não vale, porque lá o cabeçalho carrega o botão que abre o
menu.

---

## 5. Responsividade

O desenho de três colunas só existe em tela larga. Abaixo disso ele não
encolhe: **se reorganiza**. Encolher um instrumento até caber é como o painel
deixa de ser legível.

| Largura | Arranjo |
|---|---|
| ≥ 1536 px | três colunas: telemetria, reator, estado e conversa |
| 1024 a 1535 | duas colunas; estado e conversa descem inteiros para o fim |
| < 1024 | coluna única; o reator escala para 78% da largura |

O tamanho do reator é `min(78vw, 380px)` e o número do miolo usa unidade de
contêiner (`cqw`), então ele acompanha o círculo em vez de depender da janela.

---

## 6. Dois defeitos encontrados no caminho

**O painel inteiro caía com 500.** Um projeto sem a lista de missões fazia
`snapshotEcossistema` estourar em `p.missoes.length`, e a resposta 500 apagava
a visão do ecossistema inteira. Registro incompleto, vindo de versão antiga ou
de gravação pela metade, não pode ter esse poder: agora conta como zero e o
resto continua legível. O mesmo endurecimento valeu para `descricao` e
`fasesConcluidas` no cálculo do radar. Há teste para isso.

**Abrir a ponte pulava o reator.** O chat rolava para a última mensagem com
`scrollIntoView`, que rola o ancestral rolável mais próximo, e o mais próximo
ali é a página. Corrigido movendo o `scrollTop` da própria caixa de mensagens.

---

## Mapa

```
server/src/agents/sextaFeira.js       indiceEcossistema() e o snapshot endurecido
server/src/services/unicornio.js      radar tolerante a registro incompleto
server/test/indice.test.js            7 testes do índice e do snapshot
web/src/components/nave/Reator.jsx    o núcleo, arcos e legendas
web/src/nave.css                      o chassi neutro, o reator e o arranjo
web/src/pages/Admin.jsx               a composição da ponte
```

## Limites conhecidos

- **A referência é um skin de desktop**, com um visualizador de áudio no centro
  e um arquivo de configuração à esquerda. Copiar idêntico significaria
  mostradores que não medem nada, e um HUD que finge dado perde exatamente a
  credibilidade que o desenho tenta transmitir. O que foi copiado é a
  gramática: densidade, hierarquia e um alvo de cor só.
- **A carteira mostra 48 projetos no máximo.** Acima disso os segmentos ficam
  finos demais para distinguir.
- **O índice é uma composição escolhida por nós**, com pesos escritos à mão.
  Ele é honesto sobre o que mede, mas não é padrão de mercado.
