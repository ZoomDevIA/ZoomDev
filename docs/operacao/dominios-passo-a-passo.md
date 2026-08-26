# Domínios ZoomDev · passo a passo de copiar e colar

Estado lido **direto dos servidores autoritativos** (Hostinger `solar.dns-parking.com`
e Registro.br `e.sec.dns.br`) em 2026-08-26. Confira com
`bash scripts/conferir-dominios.sh`.

**No ar:** `zoomdev.io` (vitrine) e `www.zoomdev.app` (app).
**Parados:** `www.zoomdev.io`, `zoomdev.app`, `zoomdev.com.br`, `www.zoomdev.com.br`.

> **Duas correções ao que este documento dizia antes.** A leitura autoritativa
> derrubou as duas.
>
> 1. **Endereço IP fixo no apex está certo.** Eu disse para trocar por CNAME.
>    Errado: `zoomdev.io` está no ar HOJE com um `A 69.46.46.109` literal, sem
>    achatamento nenhum. A Railway entrega um registro A para domínio de raiz
>    justamente porque CNAME na raiz é proibido pela norma do DNS. **Não mexa
>    nos registros A.**
> 2. **Não é preciso mover a zona `.com.br` para a Hostinger.** Aquilo saía da
>    premissa errada acima. Como o A no apex funciona, o Registro.br dá conta
>    de tudo. **Não troque os nameservers.**
>
> O trabalho inteiro é **quatro registros TXT**. Nada mais.

---

## O que está errado, exatamente

A Railway dá um `_railway-verify` **diferente para cada domínio**, apex e www
inclusive. Em cada zona, um hash foi lido do painel e colado nos dois nomes.
Resultado: em cada zona, exatamente um domínio validou, e é o dono do hash.

| Zona | Nome | Valor hoje | Veredito |
|---|---|---|---|
| `.io` | `_railway-verify` | `eac1f7ca9…` | correto, é o do apex |
| `.io` | `_railway-verify.www` | `eac1f7ca9…` | **errado**, é o hash do apex |
| `.app` | `_railway-verify` | `b676d76c7…` | **errado**, é o hash do www |
| `.app` | `_railway-verify.www` | `b676d76c7…` | correto, é o do www |
| `.com.br` | `_railway-verify` | ausente | **criar** |
| `.com.br` | `_railway-verify.www` | ausente | **criar** |

Há ainda um TXT `railway-verify=…` solto na **raiz** de cada uma das três zonas.
Ele é resto de uma tentativa antiga, a Railway não procura ali, e pode sair.
Opcional, não bloqueia nada.

---

## Passo 0 · Desligar a tradução automática

Na aba da Railway: botão direito → **"Mostrar sempre em inglês"**.

Traduzida, a página reescreve o texto **antes** de você copiar:

| A Railway escreve | O tradutor entrega |
|---|---|
| `_railway-verify` | `_verificação ferroviária` |

---

## Passo 1 · Colher os quatro hashes na Railway

Painel **Networking** → **`Show DNS records`** na linha de **cada** domínio
parado. Você só precisa do **TXT** de cada diálogo. Ignore o CNAME e o A: os
registros de rota já estão certos.

```
www.zoomdev.io      TXT -> railway-verify=________________________________
zoomdev.app         TXT -> railway-verify=________________________________
zoomdev.com.br      TXT -> railway-verify=________________________________
www.zoomdev.com.br  TXT -> railway-verify=________________________________
```

> **Se o diálogo de `zoomdev.app` mostrar exatamente
> `railway-verify=b676d76c76574d3553bcd36ef10d84be11fd9c21d3a4672f22a792c2e12eb3aa`**,
> minha leitura está errada e o problema é outro. Pare e me avise antes de
> mexer em qualquer coisa.

---

## Passo 2 · Hostinger, zona `zoomdev.io`

**Domínios → zoomdev.io → Gerenciar registros DNS**

**Editar** esta linha (ou apagar e recriar):

| Tipo | Nome | Valor de hoje |
|---|---|---|
| TXT | `_railway-verify.www` | `railway-verify=eac1f7ca93eda46cc04b0c64f7aa80e8913b05196445c66aab6f69e38b5da552` |

Trocar o valor pelo **TXT do diálogo de `www.zoomdev.io`**. TTL `300`.

**Não mexer em nada mais nesta zona.** Estas três estão certas:

```
A      zoomdev.io           69.46.46.109
CNAME  www                  ijy2h2ch.up.railway.app
TXT    _railway-verify      railway-verify=eac1f7ca9…
```

---

## Passo 3 · Hostinger, zona `zoomdev.app`

**Domínios → zoomdev.app → Gerenciar registros DNS**

**Editar** esta linha:

| Tipo | Nome | Valor de hoje |
|---|---|---|
| TXT | `_railway-verify` | `railway-verify=b676d76c76574d3553bcd36ef10d84be11fd9c21d3a4672f22a792c2e12eb3aa` |

Trocar o valor pelo **TXT do diálogo de `zoomdev.app`**. TTL `300`.

**Não mexer em nada mais.** Estas três estão certas:

```
A      zoomdev.app          69.46.46.114
CNAME  www                  5mckxtut.up.railway.app
TXT    _railway-verify.www  railway-verify=b676d76c7…
```

---

## Passo 4 · Registro.br, zona `zoomdev.com.br`

**Meus domínios → zoomdev.com.br → Editar zona → modo avançado**

> **Atenção ao formulário.** A coluna NOME mostra o nome completo, mas o campo
> quer só o **rótulo**: ele acrescenta `.zoomdev.com.br` sozinho. Digitar o
> nome completo cria `_railway-verify.zoomdev.com.br.zoomdev.com.br`. E `@`
> é inválido como nome.

**Criar duas linhas:**

| Nome | Tipo | Dados | TTL |
|---|---|---|---|
| `_railway-verify` | TXT | *TXT do diálogo de **zoomdev.com.br*** | `3600` |
| `_railway-verify.www` | TXT | *TXT do diálogo de **www.zoomdev.com.br*** | `3600` |

**Não apagar, sob nenhuma hipótese:**

```
TXT  (raiz)   v=spf1 include:_spf.mail.hostinger.com ~all      <- o SPF do e-mail
MX   (raiz)   5 mx1.hostinger.com                              <- o e-mail
MX   (raiz)   10 mx2.hostinger.com                             <- o e-mail
A    (raiz)   69.46.46.114
CNAME www     g0ej7d8a.up.railway.app
```

Apagar o SPF ou os MX derruba `contato@zoomdev.com.br`. Essa zona tem TXT de
mais de um tipo na raiz; edite pelo valor, não pela posição.

**E confirme a publicação da zona no fim.** O Registro.br publica em lote:
enquanto você não clicar em confirmar, a edição fica pendente e nada do que
você digitou existe no mundo. Foi isso que segurou a zona por dias.

---

## Passo 5 · Conferir

Espere de 5 a 60 minutos e rode:

```
bash scripts/conferir-dominios.sh
```

Quando estiver certo, a seção final vira:

```
═══ HASHES REPETIDOS DENTRO DA MESMA ZONA ═══
  zoomdev.io  vs  www.zoomdev.io          diferentes  (como a Railway espera)
  zoomdev.app  vs  www.zoomdev.app        diferentes  (como a Railway espera)
  zoomdev.com.br  vs  www.zoomdev.com.br  diferentes  (como a Railway espera)
```

Enquanto disser **IGUAIS**, aquele par não valida, não importa quanto tempo
você espere. O certificado sai sozinho depois da validação, em minutos.

---

## Se der errado

| Sintoma | O que é |
|---|---|
| Continua "Waiting for DNS update" depois de 1 h com tudo verde no script | fila da Railway; aí sim é esperar |
| O script diz AUSENTE e o Registro.br mostra a linha lá | a zona não foi publicada; volte e confirme |
| O e-mail `contato@` parou | o SPF ou um MX foi apagado junto; recrie pelos valores acima |
| O diálogo do apex e o do www mostram o mesmo hash | minha leitura está errada; me avise |

**Limite da Let's Encrypt: 5 certificados duplicados por semana.** Apagar e
recriar o mesmo domínio na Railway várias vezes no mesmo dia queima a cota e
trava tudo por sete dias. Mexa uma vez e espere.

---

## Depois que os seis estiverem verdes

Uma fragilidade que **não bloqueia nada hoje** e vale anotar: os três apex
usam endereço IP fixo, e a borda da Railway roda em IP que pode mudar. Se um
dia os apex caírem sozinhos sem ninguém ter mexido, é isso: basta reler o
diálogo e atualizar o A. Não é motivo para mexer agora.
