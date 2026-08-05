# Blindagem

O que protege a plataforma no transporte e o que protege as pessoas nos dados.
Sete decisões, cada uma com o motivo pelo qual existe.

---

## 1. Sessão com prazo

`server/src/auth.js`

Antes o token não vencia nunca. Um que vazasse hoje continuaria entrando daqui
a um ano, e nem trocar de aparelho ou de emprego encerrava o acesso.

O prazo é **deslizante, não fixo**:

| | |
|---|---|
| Validade | 30 dias sem uso |
| Renovação | cada requisição empurra o vencimento para frente |
| Gravação da renovação | no máximo uma vez por dia |
| Varredura das vencidas | no login e no pulso diário |

Prazo fixo curto obrigaria a relogar no meio de um plano de negócios sendo
escrito. Prazo fixo longo não protege de nada. O deslizante resolve os dois:
quem usa a plataforma toda semana nunca é deslogado, quem sumiu por trinta
dias volta pelo login.

A renovação só é gravada quando resta menos de um dia da janela. Sem essa
trava, cada clique reescreveria o banco inteiro.

**Migração sem susto:** sessão criada antes desta mudança não tem `expiraEm`.
Em vez de invalidá-la e derrubar todo mundo de uma vez, ela ganha um prazo
contado a partir da criação.

**No cliente:** quando o servidor recusa o token, o cliente da API o descarta
e dispara `zd:sessao-expirada`. Sem isso a pessoa ficaria numa tela logada que
falha em toda ação, sem entender por quê.

---

## 2. Cabeçalhos de segurança

`server/src/services/blindagem.js`

Escritos à mão em vez de trazidos por biblioteca. São quarenta linhas, e cada
uma precisa ser entendida por quem mantém isto.

| Cabeçalho | O que impede |
|---|---|
| `Content-Security-Policy` | script injetado executar; recurso externo carregar |
| `X-Frame-Options: DENY` | a plataforma ser embutida em iframe de terceiro |
| `X-Content-Type-Options: nosniff` | o navegador adivinhar tipo e executar o que não devia |
| `Referrer-Policy` | o endereço completo da página vazar em link externo |
| `Cross-Origin-Opener-Policy` | uma janela aberta manter alça sobre a nossa |
| `Cross-Origin-Resource-Policy` | outro site carregar nossos recursos |
| `Permissions-Policy` | câmera, pagamento, USB e sensores serem pedidos |
| `Strict-Transport-Security` | conexão em texto claro, só sob HTTPS |

A política de conteúdo é estrita:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self';
frame-src 'self'; object-src 'none'; base-uri 'none';
form-action 'self'; frame-ancestors 'none'
```

Ela só é possível porque o pacote compilado **não tem script embutido, não usa
`dangerouslySetInnerHTML` e não injeta folha de estilo em tempo de execução**.
Se algum desses três mudar, a política precisa mudar junto, e é melhor quebrar
em desenvolvimento do que afrouxar em silêncio.

O `'unsafe-inline'` em `style-src` existe pelos atributos `style=` do React.
Injeção de estilo é vetor muito mais fraco que injeção de script, e esse
continua fechado.

`img-src` aceita `https:` porque o ZoomDoc permite inserir imagem por endereço,
e isso é conteúdo do usuário.

**HSTS só sob HTTPS.** Mandado em ambiente local, prenderia o navegador do
desenvolvedor em `https://localhost` por um ano.

---

## 3. CORS por lista

Antes: `cors()` sem argumento, ou seja, qualquer origem da internet.

Não era um buraco imediato, porque o token vai no cabeçalho e não em cookie.
Mas bastava um token vazar para que a exploração fosse feita do navegador da
vítima, com a API respondendo normalmente.

Agora a lista sai de `ZOOMDEV_URL` (e de `ZOOMDEV_ORIGENS`, para quando houver
mais de um domínio). Fora de produção, as origens locais entram sozinhas.

**Requisição sem cabeçalho `Origin` passa.** CORS é regra de navegador; barrar
`curl`, aplicativo e webhook aqui só quebraria integração honesta sem impedir
ninguém.

---

## 4. Fontes da própria origem

`web/public/assets/fontes/`

As três famílias vinham do Google Fonts. Isso entregava o endereço de IP de
todo visitante a um terceiro **antes de qualquer aceite de termos**, e ainda
punha duas conexões externas no caminho do primeiro carregamento.

| | |
|---|---|
| Arquivos | 6 (Inter, Space Grotesk, JetBrains Mono, em latin e latin-ext) |
| Peso | 213 KB |
| Subconjuntos descartados | cirílico, grego, vietnamita |
| Conexões externas na plataforma | **zero** |

Duas fontes entram em `preload`: as do primeiro texto que aparece na tela.

O Google serve fontes variáveis, então o mesmo arquivo atende todos os pesos
de uma família. Nomear por peso criaria vinte referências para seis arquivos, e
quatorze delas apontariam para o vazio. É um erro fácil de cometer e difícil de
notar, porque o navegador cai silenciosamente na fonte de sistema.

---

## 5. Prévia do MVP isolada

`server/src/services/previa.js`

Duas perguntas que só têm resposta boa juntas.

**Um iframe não carrega o cabeçalho de autorização.** A rota antiga servia cada
arquivo cru de uma rota autenticada, e por isso respondia 401: a prévia nunca
aparecia de verdade.

**E se aparecesse, seria pior.** Código gerado por IA estaria rodando na mesma
origem da plataforma, com alcance ao `localStorage` e ao token de quem estivesse
logado.

A solução:

1. Quem está autenticado pede um **bilhete de dez minutos** (`POST /api/projects/:id/mvp/previa`).
2. O documento é servido por `GET /previa/:bilhete`, fora de `/api`, com política própria.
3. Essa política começa com `sandbox` sem `allow-same-origin`: o documento cai
   numa **origem opaca**. Desenha, roda script e recebe clique, mas não enxerga
   o armazenamento da plataforma.

Consequência: em origem opaca, `localStorage` lança exceção, e o MVP gerado
guarda estado justamente ali. Por isso entra um **substituto em memória** no
topo do documento, antes de qualquer script do produto. A prévia funciona
igual, e o que for digitado nela morre ao fechar a aba, que é o comportamento
correto para uma prévia.

O bilhete carrega o instantâneo dos arquivos, **inclusive os rascunhos não
salvos**: a prévia mostra o que está no editor agora.

Verificado no navegador: a prévia renderiza, `localStorage` funciona dentro
dela, e `localStorage.getItem('zd_token')` de dentro da prévia devolve nada.

---

## 6 e 7. Dados das pessoas

`server/src/services/lgpd.js`

### O que faltava na exportação

O Studio criou dados novos que não estavam saindo no pacote do titular. Agora
saem:

| Dado | Por que importa |
|---|---|
| Documento do ZoomDoc | é o texto que a pessoa escreveu, o dado mais pessoal do projeto |
| Trilha do console | o que ela pediu e o que os agentes responderam |
| Anexos | o texto extraído do que ela enviou |
| Localização | com o consentimento e a data |
| Métricas | os números do negócio dela |
| Código do MVP | por inteiro, é trabalho dela |
| Política de retenção | por quanto tempo cada coisa fica |

Entregar o índice e reter o livro não é exportação.

### O que faltava na exclusão

- A **localização não era apagada**. É o dado que menos justifica sobreviver a
  um pedido de exclusão.
- Projeto publicado ficava na vitrine **com o documento, a trilha e os anexos
  dentro**. Só o que a vitrine mostra sobrevive agora; o resto segue a pessoa,
  e a pessoa está saindo.

A resposta ao titular passou a listar o que saiu e o que ficou sem
identificação, em vez de um "ok" genérico.

### Retenção dos anexos

O arquivo original nunca é gravado: ele é lido em memória e descartado. O que
fica é o **texto extraído**, e ele é o insumo dos agentes.

Guardar isso para sempre seria acumular dado de terceiro (quem falou na
reunião, quem assinou o documento) sem finalidade que justifique o prazo.

| | |
|---|---|
| Prazo | 180 dias |
| Depois | o conteúdo sai, o registro de que existiu fica |
| Quando roda | no pulso diário, junto da varredura de sessões |

Seis meses cobrem com folga um ciclo de ideação até MVP. O registro fica para a
pessoa entender o que aconteceu, em vez de achar que o anexo sumiu sozinho.

A política de privacidade foi atualizada e a versão dos termos subiu para
`2026-08-03`.

---

## Como conferir

```bash
# Cabeçalhos
curl -sSD- -o /dev/null https://seu-dominio/api/health

# CORS: origem estranha deve responder 403
curl -sS -H "Origin: https://qualquer.example" https://seu-dominio/api/health

# Estado geral, em português
curl -s https://seu-dominio/api/status
```

O `/api/status` traz uma linha `blindagem` dizendo qual é a lista de origens
ativa e avisando quando ela está vazia.

## Testes

`server/test/blindagem.test.js`, 18 verificações:

- sessão renovada, vencida, migrada e varrida
- CORS sem `Origin`, com origem estranha e com origem configurada
- política da prévia sem `allow-same-origin`, bilhete opaco, CSS e JS embutidos,
  substituto de armazenamento antes do código do produto
- exportação com documento, trilha, anexos e localização, e sem hash de senha
- exclusão apagando localização e conteúdo do projeto publicado
- expurgo de anexo vencido, preservando o registro e não tocando no que está no prazo

Cada um existe porque a falha correspondente é silenciosa. Um token que não
vence continua funcionando e ninguém percebe. Uma exportação incompleta parece
completa. Um expurgo que não roda não deixa rastro.

---

## 8. Encerrar sessões: o computador esquecido no escritório

Trocar a senha sempre derrubou todas as sessões, e continua derrubando. Mas
essa é uma resposta cara para o problema mais comum: lembrar que a conta ficou
aberta num computador que não é seu. Quem faz isso troca uma senha que
funcionava, decora a nova e volta a entrar em todos os aparelhos.

Agora existe a resposta barata.

### O que a pessoa vê

`Configurações → Aparelhos conectados` lista cada sessão aberta, com o
aparelho e a data de entrada, e marca a atual. Dois caminhos:

| Ação | O que faz |
|---|---|
| **Encerrar as outras** | derruba todas menos esta. É o caso comum: você está resolvendo o susto de dentro da plataforma e não deveria ser deslogado no meio |
| **sair de todos, inclusive deste** | derruba tudo, para quando o aparelho esquecido pode ser justamente este |

### Nenhuma das duas pede a senha

De propósito. Quem já está autenticado só consegue se derrubar da própria
conta, o que no pior caso é um inconveniente resolvido com um login. Exigir a
senha no minuto do susto trabalharia contra a segurança, não a favor.

A exclusão de conta continua exigindo, porque ali o custo do erro é
irreversível.

### O rótulo do aparelho, e o que ele não guarda

Sem saber de qual aparelho veio cada sessão, a lista vira uma coluna de datas e
ninguém decide qual encerrar, que é justamente quando é preciso decidir rápido.

Mas guardar o User-Agent inteiro seria guardar uma impressão digital: versão de
build, arquitetura, capacidades. Isso identifica a pessoa e nunca foi
necessário aqui.

O que fica gravado são duas palavras, `Chrome · Windows`, e mais nada. **O
endereço de IP não é guardado em nenhum momento.** Um teste verifica que a
versão de build não sobrevive ao rótulo.

### O aviso fecha o ciclo

Um e-mail sai a cada encerramento, dizendo quantas sessões caíram. Se não foi
você, o e-mail é como você fica sabendo. O encerramento vale mesmo sem serviço
de e-mail configurado.

### Desconectar UM aparelho

Encerrar tudo é a resposta do pânico. A do dia a dia é reconhecer na lista o
computador que não deveria estar lá e tirar só aquele.

Para isso cada sessão precisa de um nome, e o nome **não pode ser o token**:
devolver o token na listagem entregaria a chave de uma sessão a quem está em
outra, e bastaria ler a resposta para roubar o acesso do aparelho ao lado.

O identificador é um resumo do token (`sha256`, dezesseis caracteres). Serve
para dizer "encerre esta" e não serve para entrar. Como é derivado por hash em
vez de gravado, as sessões que já existiam ganharam identificador sem migração
nenhuma.

O dono é conferido antes de encerrar: sem isso, quem descobrisse o
identificador de outra pessoa derrubaria a sessão dela.

### Onde o controle aparece

| Lugar | Por quê |
|---|---|
| `Configurações → Aparelhos conectados` | é a conta de quem quer que seja |
| `Administração → Acesso` | é a conta com o maior poder da plataforma, e é ali que se lembra do risco |

É **o mesmo componente** nos dois lugares. Duplicar a tela garantiria que uma
das duas ficasse para trás na primeira mudança.

A aba Acesso não exige capacidade nenhuma além de já poder entrar no painel:
ela fala da sua própria conta, e pedir permissão para ver onde a própria
credencial está aberta seria pedir permissão para se proteger.

### Testes

Oito, em `server/test/sessoes.test.js`, porque a falha aqui é invisível: a
tela diz "pronto", a pessoa acredita que derrubou o escritório e o token
continua valendo.

- as outras caem e a atual sobrevive
- encerrar todas derruba inclusive quem pediu
- a conta ao lado não é tocada
- desconectar um aparelho derruba só aquele
- o identificador de outra pessoa não derruba a sessão dela
- o identificador é resumo do token, não pedaço dele, e não serve para entrar
- a listagem marca a atual e **nunca devolve o token**
- o rótulo não carrega a impressão digital do navegador

**Conferido no navegador**, com três sessões reais de aparelhos diferentes:
desconectar "Chrome · Windows" pela aba Acesso fez aquele token passar a
devolver 401, enquanto o tablet e o aparelho de onde o pedido saiu seguiram
em 200.

---

## 9. Quando o e-mail não sai e a conta tranca

Isto entrou depois de um incidente real. O dono da plataforma trocou a senha,
não conseguiu mais entrar, e o "esqueci minha senha" não tinha como ajudar:
sem `RESEND_API_KEY` nem `SMTP_URL`, o pedido funcionava, o link era gerado e
**ninguém o recebia**. O fluxo dizia "o link chega em instantes" e o link não
chegava nunca.

Três coisas foram feitas.

### O link vai para o log do servidor

Sem provedor de e-mail, o link de redefinição é impresso no log, com aviso em
destaque. Quem hospeda a plataforma lê o log e recupera a conta.

**Nunca na resposta HTTP.** A diferença é tudo: a resposta HTTP qualquer pessoa
provoca, para qualquer e-mail, e sairia com o link de tomada de conta na mão. O
log do servidor só é lido por quem já controla a hospedagem, e quem controla a
hospedagem já poderia editar o banco de qualquer jeito.

Fora de produção o link continua aparecendo na tela, como sempre, para o
desenvolvimento não travar.

### A tela para de mentir

Sem provedor configurado, dizer "o link chega em instantes" é falso. Agora a
tela diz que a instalação está sem serviço de e-mail e onde o link está de
verdade.

O texto é condicional (*"se existir uma conta com este e-mail"*) e lembra o
teto de três pedidos por hora, porque afirmar que o link foi gerado revelaria
que a conta existe, e seria um oráculo de enumeração pela porta dos fundos.

### Destravamento de emergência: `ZOOMDEV_RECUPERAR`

Para quando nem o formulário está ao alcance, por freio de tentativas ou tela
fora do ar. Basta a variável com o e-mail da conta:

```
ZOOMDEV_RECUPERAR=voce@exemplo.com
```

Na partida, o servidor imprime um link de uso único no log. Apague a variável
depois: enquanto existir, um link novo sai a cada reinício.

**Ela não recebe senha, só e-mail.** Senha em variável de ambiente ficaria em
texto claro no painel da hospedagem, para sempre. O que ela emite é um caminho
com prazo, não uma credencial.

Quem define variável de ambiente já manda no processo inteiro: isto não abaixa
nenhuma barreira que já não estivesse abaixada.

### A elevação do painel cai junto

Encerrar sessão passou a encerrar também a **janela elevada do painel
administrativo**, que vive num armazém separado e antes sobrevivia.

Sozinha ela nunca abriu nada: toda rota de `/api` passa primeiro pelo
`authMiddleware`, e sem sessão de login válida a requisição morre antes de
chegar ao painel. O problema era outro: quem entrasse de novo **no mesmo
navegador, dentro dos 30 minutos**, encontraria a elevação velha ainda válida
e abriria o painel **sem reconfirmar a senha**. E o cadeado do painel existe
justamente para reconfirmar quem é, logo depois de um evento de credencial.

Encerrar sessão é encerrar tudo o que aquela sessão conquistou.

### Duas notas operacionais que valem lembrar

- **O freio de tentativas mora em memória.** Reiniciar o serviço zera o
  bloqueio de login na hora. É a saída mais rápida para quem errou a senha
  oito vezes e ficou preso por dez minutos.
- **Trocar a senha encerra todas as sessões**, inclusive a de quem trocou. Isso
  é intencional, e é por isso que a tela manda de volta para o login.

### Testes

Nove, em `server/test/recuperacao.test.js`:

- o link vai para o log, e **não** para a resposta em produção
- o link do log realmente redefine, e a senha nova entra
- o link é de uso único
- sem a variável, o destravamento não faz nada
- com a variável, o link impresso funciona
- e-mail inexistente não cria pedido nenhum
- **destravar não troca a senha**: a anterior segue valendo até alguém usar o link
