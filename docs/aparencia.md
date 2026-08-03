# Aparência, foco, transição e som

Quatro entregas de uma vez, todas sobre a mesma coisa: como a plataforma se
comporta enquanto alguém a usa por horas.

---

## 1. O motor de tema

O guia de estilo era uma vitrine de administrador: mostrava as peças e
ninguém podia mexer. Agora ele é um painel de controle dentro de
**Configurações → Aparência**, e a prévia não é maquete, são os mesmos
componentes do resto do sistema reagindo às mesmas variáveis.

### O que a pessoa escolhe

| Ajuste | Opções |
|---|---|
| Cor de acento | oito predefinições e hex livre |
| Cor da marca | as mesmas oito |
| Fundo | Profundo, Carbono, Floresta, Vazio |
| Tipografia | Space Grotesk, Inter, JetBrains Mono, do sistema |
| Arestas | reto, chanfro, chanfro largo |
| Densidade | compacto, confortável, amplo |
| Grade e varredura | ligadas ou desligadas |
| Movimento | completo, reduzido, desligado |
| Som | ligado ou desligado, com volume |

### A separação que sustenta tudo

```
TEMA        acento, marca, escada de superfícies, chanfro, tipografia
SEMÂNTICA   âmbar é atenção · magenta é erro · roxo é ciência
            e a cor de cada agente é a identidade dele
```

A segunda coluna **não** segue o tema, de propósito. Se o vermelho de erro
virasse verde porque alguém gosta de verde, a plataforma continuaria bonita e
passaria a mentir.

### Como funciona por dentro

`web/src/lib/tema.js` escreve as variáveis em `:root` e é o único lugar do
sistema que decide aparência. As folhas de estilo foram convertidas: 134 cores
fixas viraram `var()` e `color-mix()`.

Três decisões que valem registro:

**Os valores padrão ficam no CSS, não no JavaScript.** Se o script demorar,
falhar ou estiver desligado, a plataforma continua inteira em vez de aparecer
sem cor nenhuma.

**O tema é aplicado no ponto de entrada, antes do primeiro quadro.** Dentro de
um efeito de componente, a tela pisca no padrão e só depois troca, e é esse
pisca que denuncia que a personalização é postiça.

**A escada de fundo é escolhida à mão, tom a tom.** Derivar página, painel,
elevado e campo por cálculo a partir de uma cor só dá tons lavados. Cada
preset traz os seis degraus escritos.

### O defeito que a medição pegou

Depois de converter as folhas, o fundo mudava mas a borda dos painéis
continuava ciano em qualquer tema.

A causa estava no componente, não no CSS: `Painel` tinha `cor = '#00e5ff'`
como padrão e escrevia esse valor em linha, vencendo a variável. Um padrão
fixo num componente usado em toda tela anula o tema inteiro.

A correção: **sem cor pedida, o componente não escreve estilo em linha**.
Deixa a folha decidir, e a folha usa a variável. Quando a cor É passada, ela é
semântica e deve mesmo vencer.

O mesmo cuidado valeu para `tom()`, que concatenava alfa em hex e produzia
`var(--zd-acento)8a`, uma cor que o navegador descarta em silêncio.

### Trava de contraste

Acento com menos de 3:1 contra o fundo escolhido dispara um aviso com a razão
medida. Não bloqueia, porque a escolha é de quem usa, mas ninguém fica sem
saber por que as bordas sumiram.

### Onde o tema mora

No navegador **e** no perfil do servidor. Entrar num computador novo traz a
plataforma do jeito que a pessoa deixou. A rota `PATCH /api/conta` aceita o
tema por **lista fechada**: campo fora da lista é descartado, valor fora do
formato é descartado. Seis testes guardam isso, inclusive o de que o tema não
é caminho para escalar papel.

### Limite conhecido

Cor escrita à mão em componente de tela continua fixa. Isso cobre cores
semânticas, que devem mesmo ficar, mas também alguns acentos estruturais em
telas antigas. O chassi, os painéis, botões, campos, abas, etiquetas, menu e
fundo seguem o tema, que é o que domina a tela.

---

## 2. Modo foco

O Studio é onde o fundador passa horas. Ali, o menu lateral aberto e a barra
de abas somavam quase 300 px de cromo que ninguém estava usando.

Ao abrir o Studio: o menu recolhe para a régua de ícones e o cabeçalho sobe e
some. Medido em 1440 × 900, o palco passou de **703 px para 783 px** de altura
e o console ganhou 195 px de largura.

**Quem pede é a tela, não o chassi.** A página declara que quer foco e o
Layout obedece, então o Studio não precisa saber que existe uma barra lateral.

Nada é destrutivo:

- a preferência de menu recolhido que a pessoa já tinha é guardada na entrada
  e devolvida na saída;
- uma faixa fina no topo traz o cabeçalho de volta ao encostar o mouse ou
  tocar;
- `Esc` dispensa o foco sem sair da tela;
- no celular o foco não vale, porque lá o cabeçalho carrega o botão que abre o
  menu, e recolher os dois deixaria a pessoa numa tela sem saída aparente.

O cabeçalho encolhe sem que a janela mude de tamanho, então o chassi dispara
um aviso (`zd:chassi`) para quem mede a própria altura. Sem ele, o palco
ficaria curto no espaço que acabou de ganhar.

---

## 3. Transição e ignição

### Entrada de tela

Envelope de 0,3 s com opacidade e um deslocamento de 9 px para cima. Só
`transform` e `opacity`, que o navegador resolve na GPU sem recalcular layout.
Curta de propósito: transição longa parece elegante na primeira vez e vira
atraso na décima.

### Ignição

Entre digitar a senha e ver o painel existe um vazio de um a dois segundos.
Antes era uma palavra pulsando. Agora é a partida: dois arcos girando em
sentidos opostos ao redor da logo, quatro linhas de estado acendendo em
sequência e uma barra enchendo.

Sentidos opostos porque um arco só lê como "ícone girando", e dois leem como
máquina ligando.

Não é enfeite gratuito: a espera existe de qualquer jeito, e espera com
narrativa é espera mais curta na cabeça de quem espera.

Três regras que o desenho respeita:

- a aplicação monta **atrás** da cortina, então quando ela sai já está tudo
  pronto;
- clicar pula, porque na décima vez ninguém quer assistir de novo;
- com movimento desligado, ela nem aparece.

A cortina fica no mesmo lugar da árvore o tempo todo, para que a chegada do
perfil não reinicie a sequência do zero.

---

## 4. Som

**Sintetizado no navegador. Nenhum arquivo de áudio.**

Essa é a decisão que manda no módulo. Um pacote de sons de jogo custa centenas
de kilobytes e brigaria com o trabalho de leveza. Cada som aqui é feito na
hora com osciladores e envelope, e o custo no pacote é o tamanho do texto de
`web/src/lib/som.js`.

| Evento | Som |
|---|---|
| Clique | duas notas curtas subindo |
| Ação principal | quinta abaixo dando corpo, mais brilho no fim |
| Passar o mouse | quase inaudível, só para a mão sentir o alvo |
| Sucesso | tríade em arpejo |
| Erro | serra grave descendo |
| Conquista | quatro notas com brilho no fim |
| Subida de nível | varredura para cima e acorde aberto |
| Agente terminou | varredura descendente |

### Convivência

1. O contexto de áudio só nasce no primeiro gesto. Não é educação apenas:
   navegador nenhum deixa tocar antes disso.
2. Volume baixo por padrão e **um alto-falante no cabeçalho**. Som que só pode
   ser desligado dentro das configurações é som que a pessoa desliga fechando
   a aba.
3. Retorno, não trilha: cada som dura menos de meio segundo e nenhum se repete
   sozinho.
4. O tique de passar o mouse tem freio de 70 ms e só existe onde há mouse. Sem
   o freio, percorrer uma lista viraria chiado; no toque, o evento sintético
   duplicaria o som do clique.

**Um ouvinte só, na raiz.** Toda tela ganhou retorno sonoro sem ser reescrita,
e desligar é remover um ouvinte, não vasculhar cem componentes.

---

## 5. Retorno sensorial

- **XP que sobe da ação.** Ganhou 25 XP, o número sobe do ponto onde você
  clicou e some em 1,5 s. É o retorno mais viciante que existe em jogo e custa
  um elemento e uma animação.
- **Subida de nível** em escala maior, na cor de acento, com som próprio.
- **Vibração no celular**, só em conquista e em nível. Usar em tudo
  transformaria o aparelho num chocalho.

---

## Mapa

```
web/src/lib/tema.js                          modelo, presets, contraste, aplicação
web/src/lib/som.js                           síntese, repertório, ligação na interface
web/src/lib/foco.js                          contexto do modo foco e aviso de chassi
web/src/components/configuracoes/Aparencia.jsx   o painel com prévia ao vivo
web/src/components/Ignicao.jsx               a partida
web/src/components/Sensorial.jsx             som e XP flutuante nos eventos
web/src/components/Layout.jsx                foco, silenciador, transição de rota
web/src/styles.css                           variáveis de tema e densidade
web/src/hud.css                              chaves de tema, foco, ignição, ganho
server/src/routes/conta.js                   persistência do tema por lista fechada
server/test/tema.test.js                     6 testes da validação
```

## Limites conhecidos

- **Sem tema claro.** As quatro superfícies são escuras. Um tema claro exige
  rever o contraste de texto de cada tela, não só trocar os seis tons.
- **A trava de contraste avalia só o acento contra a página.** Uma combinação
  ruim entre acento e marca passa sem aviso.
- **O documento do Studio (`zoomdoc.css`) tem paleta própria**, porque ele
  imita papel A4 e precisa continuar imprimível. Não segue o tema.
