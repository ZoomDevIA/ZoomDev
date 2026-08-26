# Registro.br · zona `zoomdev.com.br`, passo a passo

Objetivo: criar **dois** registros TXT. Nada mais é alterado.

Esta zona é a mais arriscada das três, porque é a única que carrega o e-mail
da empresa. Um clique errado aqui derruba `contato@zoomdev.com.br`, e isso não
avisa: a caixa simplesmente para de receber.

---

## O que a zona tem hoje

Lido do servidor autoritativo `e.sec.dns.br` em 2026-08-26. Use esta lista
para reconhecer cada linha na tela antes de tocar em qualquer uma.

| Nome | Tipo | Dados | Para que serve |
|---|---|---|---|
| *(raiz)* | A | `69.46.46.114` | leva `zoomdev.com.br` à borda da Railway |
| *(raiz)* | MX | `5 mx1.hostinger.com` | **o e-mail** |
| *(raiz)* | MX | `10 mx2.hostinger.com` | **o e-mail** |
| *(raiz)* | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | **o e-mail**, antispam |
| *(raiz)* | TXT | `railway-verify=a715e231…647318` | posse, **no nome errado** |
| `www` | CNAME | `g0ej7d8a.up.railway.app` | leva `www` à borda da Railway |

As três linhas marcadas em negrito são o e-mail. **Nenhuma delas é tocada
neste procedimento.**

Repare que existem **dois TXT diferentes na raiz**. É por isso que a regra
aqui é editar **pelo valor**, nunca pela posição na lista: as duas linhas
aparecem com o mesmo nome e o mesmo tipo, e só o conteúdo as distingue.

---

## Passo 1 · Chegar na zona

1. `registro.br` → entrar com a sua conta
2. **Meus domínios** → clicar em **`zoomdev.com.br`**
3. Na página do domínio, abrir a seção **DNS** e escolher **Editar zona**
4. Ligar o **modo avançado**

O modo avançado muda duas coisas: mostra todos os tipos de registro (o modo
simples esconde TXT) e passa a exibir o **nome completo** na coluna NOME.

> **Cuidado com a assimetria.** A coluna mostra o nome completo
> (`_railway-verify.zoomdev.com.br`), mas o **campo de digitação quer só o
> rótulo** (`_railway-verify`). Ele acrescenta `.zoomdev.com.br` sozinho.
> Digitar o nome completo no campo cria
> `_railway-verify.zoomdev.com.br.zoomdev.com.br`, que resolve, aparece verde
> na tela e nunca valida.

---

## Passo 2 · Criar a primeira linha

Clicar em adicionar registro e preencher:

| Campo | Valor |
|---|---|
| Nome | `_railway-verify` |
| Tipo | `TXT` |
| Dados / Valor | `railway-verify=a715e23178d0da3baa921cdc6b0f0c2dadd0aa6f08760154f9b47470fb647318` |
| TTL | `3600` |

Antes de seguir, confira que o valor **termina em `647318`**.

> `@` é inválido como nome no Registro.br. Para a raiz da zona o campo fica
> **em branco**. Aqui não se aplica: este registro tem nome próprio.

---

## Passo 3 · Criar a segunda linha

| Campo | Valor |
|---|---|
| Nome | `_railway-verify.www` |
| Tipo | `TXT` |
| Dados / Valor | `railway-verify=0f41eccb80a0789ba3e183fb4e0c74ef118305beb2f9ca21227c922addb6881f` |
| TTL | `3600` |

Confira que **termina em `b6881f`**, e que é **diferente** do valor do passo 2.

Os dois hashes são de domínios diferentes. Se as duas linhas ficarem com o
mesmo valor, nenhuma das duas valida. Foi exatamente esse o erro nas zonas
`.io` e `.app`.

---

## Passo 4 · Publicar

**Este é o passo que já falhou antes e segurou a zona por dias.**

O Registro.br não publica a cada edição. Ele acumula as alterações e só grava
quando você confirma. Procure o botão de **salvar / publicar / confirmar
alterações** no fim do formulário e clique.

Enquanto você não clicar, o que você digitou existe só na sua tela.

### Como saber se publicou de verdade

O número de série da zona muda a cada publicação. O de hoje é:

```
2026236001
```

Esse número é `ano + dia-do-ano + contador`: `2026`, dia `236` (24 de agosto),
publicação `001`. Ou seja, a zona **não é republicada desde 24 de agosto**.

Depois de publicar, o série tem que virar algo como `2026238001` ou maior.
Se continuar `2026236001`, **a publicação não aconteceu**, por mais verde que
a tela esteja.

Para conferir, rode aqui:

```
bash scripts/conferir-dominios.sh
```

ou peça para eu ler o série direto do `e.sec.dns.br`.

---

## Passo 5 · A linha antiga na raiz

Depois que a linha do passo 2 estiver publicada e funcionando, o TXT
`railway-verify=a715e231…` que hoje está na **raiz** pode ser apagado. Ele é
resto de uma orientação errada minha: a Railway procura em
`_railway-verify.<nome>`, não na raiz.

**Não apague antes**, e não apague junto com as criações. Faça numa segunda
edição, depois de confirmar que o novo está no ar. Duas razões:

- se algo der errado, o valor antigo ainda está lá para copiar
- é na raiz que moram o SPF e os MX, e mexer ali com pressa é como o e-mail cai

Ao apagar, confira que a linha selecionada tem `railway-verify=` no conteúdo,
e **não** `v=spf1`.

---

## O que NÃO fazer nesta zona

| Não faça | Por quê |
|---|---|
| Apagar o TXT `v=spf1 include:_spf.mail.hostinger.com ~all` | o e-mail passa a cair em spam ou a ser rejeitado |
| Apagar qualquer `MX` | `contato@zoomdev.com.br` para de receber |
| Mexer no `A` da raiz `69.46.46.114` | é o que leva o domínio à Railway |
| Mexer no `CNAME www` | idem, para o www |
| Trocar os servidores DNS | não é necessário; e derruba o e-mail junto |
| Usar `@` no campo Nome | inválido no Registro.br |
| Digitar o nome completo no campo Nome | vira `…zoomdev.com.br.zoomdev.com.br` |

---

## Depois

Espere de 15 a 60 minutos. O TTL desta zona é mais alto que o das outras
(3600 contra 300), então ela demora mais para aparecer.

O `www.zoomdev.com.br` deve subir. O `zoomdev.com.br` sem www é a incógnita:
o apex do `.io` e do `.app` funciona por **ALIAS**, que a Hostinger tem e o
Registro.br não. Se o www subir e o apex continuar parado, a causa é essa, e
aí a conversa passa a ser sobre mover a zona. Não antecipe.

**Não apague e recrie o domínio na Railway** se demorar. A Let's Encrypt
limita 5 certificados duplicados por semana, e queimar a cota trava tudo por
sete dias.
