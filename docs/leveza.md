# Leveza

Duas mudanças que tiram peso do que trafega e do que é gravado, sem tocar em
uma linha de layout.

---

## 1. Imagens: 37,7 MB para 2,7 MB

`scripts/converter-imagens.py`

A plataforma carregava quarenta e oito PNGs de 1024 pixels. Quase todos
aparecem em tamanho muito menor: o retrato de agente que ocupa 96 pontos na
tela vinha em 1024, e num celular no 4G isso são segundos de espera por uma
imagem que ninguém vai olhar de perto.

### As larguras vêm do uso, não de chute

| Pasta | Largura | Por quê |
|---|---|---|
| `agents/` | 512 | maior uso é `w-24 h-28`, ou seja, 96×112 pontos; 512 cobre até tela de 3× e ainda serve de textura no vale 3D |
| `agents/faces/` | 256 | maior uso é o avatar de 96 pontos |
| `modules/` | 768 | cartões de módulo na home |
| `site/` | 1024 | arte de fundo e exemplos, largura de coluna larga |

Qualidade 82, método 6. O corte médio ficou em **93%**, com o pior caso em 86%
e o melhor em 98%.

### Miniaturas para as listas

A tela de elenco desenha vinte e cinco retratos em cartões de 56 pontos e
baixava 512 pixels de cada um. Cada retrato ganhou uma variante de 160 pixels,
e o `AgentAvatar` entrega as duas num `srcset` com o `sizes` da caixa real: o
navegador escolhe sozinho, já considerando a densidade da tela.

A largura da caixa é derivada da classe do Tailwind. `w-14` é 3,5rem, ou seja,
56 pixels, e a escala é sempre o número vezes quatro. Derivar evita repetir o
valor em toda chamada e sair de sincronia com a classe.

### O que isso deu na prática

| Página | Antes | Depois |
|---|---|---|
| Elenco de agentes | 1.270 KB | **345 KB** |
| Bioeconomia | 969 KB | **751 KB** |
| Home | 644 KB | 645 KB |

A home quase não muda porque ali o peso é o JavaScript, não a imagem.

### O favicon continua em PNG

96 pixels, 7 KB. O suporte a WebP em ícone de aba ainda é irregular fora do
Chrome, e é o único arquivo do site onde isso faz diferença.

**Dois erros que o script cometeu antes de ficar certo**, anotados para quem
for mexer nele:

1. O Google e o Pillow tratam fonte variável e imagem de forma diferente:
   nomear o arquivo por peso criava vinte referências para seis arquivos.
2. Na segunda execução o script tratava o `favicon.png` que ele mesmo gerou
   como original, convertia e apagava. **Script não pode comer a própria
   saída.** Hoje o favicon é excluído da entrada e gerado por último.

---

## 2. Conteúdo pesado fora do índice

`server/src/services/conteudo.js`

O banco é um arquivo JSON só, reescrito **por inteiro** a cada gravação. Com
duzentos quilobytes isso é irrelevante. O problema é o que passou a morar
dentro dele com a chegada do Studio:

| Campo | Peso típico |
|---|---|
| `documento` | 25 a 40 KB |
| `mvp.arquivos` | perto de 50 KB |
| `planoZoomDev` | 10 a 20 KB |
| `anexos` | até 40 KB cada |
| `trilha` | cresce com a conversa |

Somando, um projeto ativo carrega perto de 150 KB. Mil projetos poriam o banco
em 150 MB, e o salvamento automático do editor, que dispara um segundo depois
de cada tecla, reescreveria os 150 MB inteiros para trocar uma frase.

### A separação

**Índice** (`db.json`): nome, fase, missões, métricas, tudo que as listas
precisam. Ganhou duas marcas novas, `temDocumento` e `anexosCount`, para que a
lista saiba responder sem abrir arquivo nenhum.

**Conteúdo** (`conteudo/<projeto>.json`): um arquivo por projeto, gravado só
quando aquele projeto muda.

```
lerConteudo(projetoId)         do cache, ou do disco na primeira vez
gravarConteudo(id, alteracoes) mescla e grava de forma atômica
apagarConteudo(id)             usado pela exclusão de conta
hidratar(projeto)              índice + conteúdo, para a resposta ao cliente
arquivosMvp(id)                só o código, sem carregar o resto
migrarConteudo()               roda uma vez na subida
```

### Três decisões que valem ser explicadas

**`hidratar` devolve objeto novo.** Se o conteúdo fosse colado no objeto
guardado em memória, o próximo `save()` o levaria de volta para dentro do
`db.json` e desfaria toda a separação em silêncio.

**A escrita é atômica**, em arquivo temporário e depois renomeada. Uma queda no
meio da gravação deixaria um documento pela metade no lugar do que estava
certo.

**O identificador é recusado, não limpo.** Limpar transformaria
`../../etc/passwd` em `etcpasswd`, um projeto que não existe, e a leitura
devolveria vazio como se estivesse tudo bem: o ataque falharia em silêncio e um
bug de verdade também. Recusar faz os dois aparecerem.

### O cache não expira

Não é esquecimento: este processo é o único que escreve nesses arquivos, então
o cache nunca fica velho. Uma invalidação por tempo só adicionaria leituras de
disco sem corrigir nada.

### Migração

Roda na subida, é idempotente e move o que já estava dentro do índice. No banco
de teste: **1 projeto migrado, 41 KB fora do índice**, e o `db.json` caiu de
196 KB para 155 KB.

### Efeito na API

| Rota | Antes | Depois |
|---|---|---|
| `GET /projects` (lista) | carregava o documento de todo projeto | 5 KB, só o índice |
| `GET /projects/:id` | igual | hidratado, com documento e código |
| `PUT /studio/:id/documento` | reescrevia o banco inteiro | grava um arquivo de 26 KB |

---

## Como manter

```bash
# Converter imagens novas (mantém os originais para conferência)
python3 scripts/converter-imagens.py

# Depois de conferir na tela
python3 scripts/converter-imagens.py --apagar-originais

# Só regerar as miniaturas
python3 scripts/converter-imagens.py --so-miniaturas
```

Ao acrescentar arte de agente, o arquivo entra em `web/public/assets/agents/`
como PNG, roda o script, e as duas variantes saem prontas.

## Testes

`server/test/blindagem.test.js` ganhou quatro verificações da separação:

- o índice fica pequeno e o conteúdo vai para arquivo próprio
- `hidratar` junta os dois sem contaminar o índice
- a migração move o que estava dentro e roda uma vez só
- identificador com travessia de caminho é recusado

Cinquenta e dois testes no total, todos passando.
