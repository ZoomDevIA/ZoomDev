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

## Os quatro valores, já colhidos e conferidos

Colhidos do painel em 2026-08-26 e conferidos contra o DNS publicado: os seis
domínios têm **seis hashes distintos**, e cada domínio parado está publicado
com o hash do vizinho. Diagnóstico confirmado, nada a adivinhar.

| Domínio | Hash correto (do painel) | O que está publicado hoje |
|---|---|---|
| `www.zoomdev.io` | `ff4e2abd…cd4b` | o hash de `zoomdev.io` |
| `zoomdev.app` | `7c8c7162…c8a8` | o hash de `www.zoomdev.app` |
| `zoomdev.com.br` | `a715e231…7318` | nada em `_railway-verify` |
| `www.zoomdev.com.br` | `0f41eccb…881f` | nada em `_railway-verify` |

---

## Passo 1 · Hostinger, zona `zoomdev.io`

**Domínios → zoomdev.io → Gerenciar registros DNS**

Achar a linha `TXT` de nome `_railway-verify.www` e **trocar o valor** por:

```
railway-verify=ff4e2abd507d5d23051d5dfb6b6beafba593def14c1265e6f4f9adc75b48cd4b
```

TTL `300`. O valor velho ali é `railway-verify=eac1f7ca9…`, que é o hash do
apex. É ele que está segurando o domínio.

**Não mexer no resto desta zona:**

```
A      zoomdev.io           69.46.46.109
CNAME  www                  ijy2h2ch.up.railway.app
TXT    _railway-verify      railway-verify=eac1f7ca9…      <- este é o certo, fica
```

---

## Passo 2 · Hostinger, zona `zoomdev.app`

**Domínios → zoomdev.app → Gerenciar registros DNS**

Achar a linha `TXT` de nome `_railway-verify` e **trocar o valor** por:

```
railway-verify=7c8c71628d3059b631ca21fe214456dc63a7081d86d0b5705022a4d6eaf4c8a8
```

TTL `300`. O valor velho ali é `railway-verify=b676d76c7…`, que é o hash do www.

**Não mexer no resto desta zona:**

```
A      zoomdev.app          69.46.46.114
CNAME  www                  5mckxtut.up.railway.app
TXT    _railway-verify.www  railway-verify=b676d76c7…      <- este é o certo, fica
```

---

## Passo 3 · Registro.br, zona `zoomdev.com.br`

**Meus domínios → zoomdev.com.br → Editar zona → modo avançado**

> **O campo NOME quer só o rótulo.** Ele acrescenta `.zoomdev.com.br` sozinho.
> Digitar o nome completo cria `_railway-verify.zoomdev.com.br.zoomdev.com.br`.
> E `@` é inválido como nome.

**Criar duas linhas:**

| Nome | Tipo | Dados | TTL |
|---|---|---|---|
| `_railway-verify` | TXT | `railway-verify=a715e23178d0da3baa921cdc6b0f0c2dadd0aa6f08760154f9b47470fb647318` | `3600` |
| `_railway-verify.www` | TXT | `railway-verify=0f41eccb80a0789ba3e183fb4e0c74ef118305beb2f9ca21227c922addb6881f` | `3600` |

> O valor do apex é o mesmo `a715e231…` que hoje está solto na **raiz** da
> zona. O valor sempre esteve certo; o nome é que estava errado, por
> orientação minha. Depois de criar a linha nova, a da raiz pode sair.

**Não apagar, sob nenhuma hipótese:**

```
TXT   (raiz)   v=spf1 include:_spf.mail.hostinger.com ~all     <- o SPF do e-mail
MX    (raiz)   5 mx1.hostinger.com                             <- o e-mail
MX    (raiz)   10 mx2.hostinger.com                            <- o e-mail
A     (raiz)   69.46.46.114
CNAME www      g0ej7d8a.up.railway.app
```

Essa zona tem TXT de mais de um tipo na raiz. **Edite pelo valor, não pela
posição:** apagar o SPF ou um MX derruba `contato@zoomdev.com.br`.

**E confirme a publicação da zona no fim.** O Registro.br publica em lote:
enquanto você não confirmar, a edição fica pendente e nada existe no mundo.
Foi isso que segurou a zona por dias.

---

## Passo 4 · Conferir

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
| Um par continua "IGUAIS" no script depois de publicar | o valor colado não foi o da tabela; confira caractere a caractere |

**Limite da Let's Encrypt: 5 certificados duplicados por semana.** Apagar e
recriar o mesmo domínio na Railway várias vezes no mesmo dia queima a cota e
trava tudo por sete dias. Mexa uma vez e espere.

---

## Depois que os seis estiverem verdes

Uma fragilidade que **não bloqueia nada hoje** e vale anotar: os três apex
usam endereço IP fixo, e a borda da Railway roda em IP que pode mudar. Se um
dia os apex caírem sozinhos sem ninguém ter mexido, é isso: basta reler o
diálogo e atualizar o A. Não é motivo para mexer agora.
