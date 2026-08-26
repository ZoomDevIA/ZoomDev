# Domínios ZoomDev · passo a passo de copiar e colar

Estado medido em 2026-08-26 21:53 UTC. Confira com `bash scripts/conferir-dominios.sh`.

**No ar:** `zoomdev.io` (vitrine) e `www.zoomdev.app` (app).
**Parados:** `www.zoomdev.io`, `zoomdev.app`, `zoomdev.com.br`, `www.zoomdev.com.br`.
Os quatro parados só redirecionam. Nada de negócio depende deles.

---

## Passo 0 · Desligar a tradução automática

Na aba da Railway, clique com o botão direito e escolha **"Mostrar sempre em inglês"**
(ou desative o tradutor no ícone da barra de endereço).

Com a página traduzida, o navegador reescreve o texto **antes** de você copiar:

| O que a Railway escreve | O que o tradutor entrega |
|---|---|
| `_railway-verify` | `_verificação ferroviária` |
| `ZOOMDEV_URL` | `URL_ZOOMDEV` |

Colar isso no DNS cria um registro que nunca vai validar.

---

## Passo 1 · Colher os quatro pares na Railway

No painel **Networking**, clique em **`Show DNS records`** na linha de **cada**
domínio parado. Cada diálogo traz dois registros, e os dois são **exclusivos
daquele nome**.

Anote assim:

```
www.zoomdev.io      CNAME -> ______________________.up.railway.app
                    TXT   -> railway-verify=________________________________

zoomdev.app         CNAME -> ______________________.up.railway.app
                    TXT   -> railway-verify=________________________________

zoomdev.com.br      CNAME -> ______________________.up.railway.app
                    TXT   -> railway-verify=________________________________

www.zoomdev.com.br  CNAME -> ______________________.up.railway.app
                    TXT   -> railway-verify=________________________________
```

> **Se o diálogo do apex e o do www mostrarem o MESMO hash**, minha leitura
> está errada e o problema é outro. Nesse caso pare aqui e me avise: não mexa
> em nada, porque o resto do plano deixa de valer.

---

## Passo 2 · Hostinger, zona `zoomdev.io`

Painel: **Domínios → zoomdev.io → DNS / Nameservers → Gerenciar registros DNS**

### 2.1 · Apagar o TXT errado

Procure a linha:

| Tipo | Nome | Valor |
|---|---|---|
| TXT | `_railway-verify.www` | `railway-verify=eac1f7ca93eda46cc04b0c64f7aa80e8913b05196445c66aab6f69e38b5da552` |

Esse valor é o hash do **apex**, não o do www. Clique na lixeira.

### 2.2 · Criar o TXT certo

| Campo | O que digitar |
|---|---|
| Tipo | `TXT` |
| Nome | `_railway-verify.www` |
| Valor / Conteúdo | *o TXT do diálogo de **www.zoomdev.io** (passo 1)* |
| TTL | `300` |

### 2.3 · Não mexer

Estas duas linhas estão certas e sustentam o domínio que já funciona:

| Tipo | Nome | Valor |
|---|---|---|
| TXT | `_railway-verify` | `railway-verify=eac1f7ca9…` |
| CNAME | `www` | `ijy2h2ch.up.railway.app` |

---

## Passo 3 · Hostinger, zona `zoomdev.app`

Painel: **Domínios → zoomdev.app → Gerenciar registros DNS**

### 3.1 · Apagar o TXT errado

| Tipo | Nome | Valor |
|---|---|---|
| TXT | `_railway-verify` | `railway-verify=b676d76c76574d3553bcd36ef10d84be11fd9c21d3a4672f22a792c2e12eb3aa` |

Esse é o hash do **www**, não o do apex. Lixeira.

### 3.2 · Criar o TXT certo

| Campo | O que digitar |
|---|---|
| Tipo | `TXT` |
| Nome | `_railway-verify` |
| Valor / Conteúdo | *o TXT do diálogo de **zoomdev.app** (passo 1)* |
| TTL | `300` |

### 3.3 · Apagar o A do apex

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `69.46.46.114` |

Esse IP é do alvo do `www.zoomdev.app`, copiado. A Railway roda a borda em IP
rotativo e valida pelo **nome**, não pelo número: apex com IP cravado não
valida hoje e quebra quando o IP girar. Lixeira.

### 3.4 · Criar o CNAME do apex

A Hostinger achata CNAME no apex sozinha, então isto funciona:

| Campo | O que digitar |
|---|---|
| Tipo | `CNAME` |
| Nome | `@` |
| Aponta para | *o CNAME do diálogo de **zoomdev.app** (passo 1)* |
| TTL | `300` |

> Se a Hostinger recusar `@` em CNAME, tente o nome em branco. Se recusar as
> duas, me avise: aí a saída é diferente.

### 3.5 · Não mexer

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `www` | `5mckxtut.up.railway.app` |
| TXT | `_railway-verify.www` | `railway-verify=b676d76c7…` |

---

## Passo 4 · A zona `zoomdev.com.br`

Aqui há uma decisão antes do copiar e colar.

**O Registro.br não tem ALIAS nem achatamento de CNAME no apex.** A norma do
DNS proíbe CNAME na raiz de uma zona, e quem contorna isso é o provedor, com
um tipo próprio (ALIAS, ANAME, CNAME flattening). O Registro.br não oferece
nenhum. Ou seja: `zoomdev.com.br` **sem www** não tem como apontar para a
Railway de forma estável enquanto a zona estiver lá.

### Caminho A · Mover o DNS do `.com.br` para a Hostinger (recomendado)

Resolve o apex e deixa as três zonas no mesmo lugar. Duas coisas medidas
agora deixam esse caminho mais seguro do que parece:

- o seu e-mail **já é da Hostinger**: `zoomdev.com.br` tem
  `MX 5 mx1.hostinger.com` e `MX 10 mx2.hostinger.com`. Ao assumir a zona,
  ela recria esses MX sozinha;
- os nameservers da Hostinger que já servem `zoomdev.io` e `zoomdev.app` são
  `solar.dns-parking.com` e `lunar.dns-parking.com`. São os mesmos que a
  `.com.br` vai usar.

**1. Antes de tudo, anote os MX atuais**, para conferir depois:

```
5   mx1.hostinger.com
10  mx2.hostinger.com
```

**2. Hostinger** → **Domínios → Adicionar domínio** → `zoomdev.com.br` →
escolher **usar os nameservers da Hostinger**. Confira que ela mostra os dois
abaixo; se mostrar outros, use os dela.

```
solar.dns-parking.com
lunar.dns-parking.com
```

**3. Registro.br** → `zoomdev.com.br` → **Alterar servidores DNS**.

Hoje está assim (DNS do próprio Registro.br):

```
e.sec.dns.br
f.sec.dns.br
```

Apague os dois e coloque:

```
solar.dns-parking.com
lunar.dns-parking.com
```

Salve e **confirme**. A delegação leva de 30 minutos a algumas horas.

**4. Confira que a delegação virou**, antes de criar qualquer registro:

```
bash scripts/conferir-dominios.sh
```

**5. Com a zona na Hostinger**, crie os quatro registros:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| CNAME | `@` | *CNAME do diálogo de **zoomdev.com.br*** | `300` |
| CNAME | `www` | *CNAME do diálogo de **www.zoomdev.com.br*** | `300` |
| TXT | `_railway-verify` | *TXT do diálogo de **zoomdev.com.br*** | `300` |
| TXT | `_railway-verify.www` | *TXT do diálogo de **www.zoomdev.com.br*** | `300` |

**6. Confira o e-mail.** Mande uma mensagem para `contato@zoomdev.com.br` de
outra conta e veja se chega. Se os MX não voltaram, recrie:

| Tipo | Nome | Valor | Prioridade |
|---|---|---|---|
| MX | `@` | `mx1.hostinger.com` | `5` |
| MX | `@` | `mx2.hostinger.com` | `10` |

### Caminho B · Ficar no Registro.br e desistir do apex

Mantém o e-mail sem risco, e só o `www.zoomdev.com.br` fica no ar.
`zoomdev.com.br` puro continua sem abrir.

Registro.br → `zoomdev.com.br` → **Editar zona** → **modo avançado**.

> No formulário, a coluna NOME mostra o nome completo, mas o campo quer só o
> **rótulo**: ele acrescenta `.zoomdev.com.br` sozinho. Digitar o nome
> completo cria `_railway-verify.zoomdev.com.br.zoomdev.com.br`.
> E `@` é inválido como nome.

**Apagar:**

| Nome | Tipo | Dados |
|---|---|---|
| *(em branco, o apex)* | A | `69.46.46.114` |

**Criar:**

| Nome | Tipo | Dados | TTL |
|---|---|---|---|
| `_railway-verify.www` | TXT | *TXT do diálogo de **www.zoomdev.com.br*** | `3600` |

**Não mexer:**

| Nome | Tipo | Dados |
|---|---|---|
| `www` | CNAME | `g0ej7d8a.up.railway.app` |

**Depois, na Railway:** apague a linha `zoomdev.com.br` do painel Networking.
Domínio que nunca vai validar ficaria em amarelo para sempre.

**E confirme a publicação da zona.** O Registro.br publica em lote: enquanto
você não clicar em confirmar/publicar no fim, a edição fica pendente e nada
do que você digitou existe no mundo. Foi isso que segurou a zona por dias.

---

## Passo 5 · Conferir

Espere de 5 a 60 minutos e rode:

```
bash scripts/conferir-dominios.sh
```

O que esperar quando estiver certo:

```
── www.zoomdev.io
   1. rota      resolve
   2. borda     a Railway reconhece o nome
   3. posse     presente
   4. TLS       NO AR

═══ HASHES REPETIDOS DENTRO DA MESMA ZONA ═══
  zoomdev.io  vs  www.zoomdev.io      diferentes  (como a Railway espera)
  zoomdev.app  vs  www.zoomdev.app    diferentes  (como a Railway espera)
```

Enquanto a seção de hashes disser **IGUAIS**, aquele par não vai validar,
não importa quanto tempo você espere.

O certificado sai sozinho depois da validação, normalmente em minutos. Se
passar de uma hora com as quatro etapas verdes, aí sim é fila da Railway.

---

## Se der errado

| Sintoma | O que é |
|---|---|
| O painel volta a "Waiting for DNS update" depois de horas | o TXT não é o daquele domínio; refaça o passo 1 lendo o diálogo **daquela linha** |
| A Hostinger recusa CNAME em `@` | me avise antes de inventar um A |
| O Registro.br mostra tudo verde e o script diz AUSENTE | a zona não foi publicada; volte e confirme |
| `curl` na sua máquina dá erro de nome no certificado | ainda não emitiu, é esperado até a validação passar |
| O e-mail `contato@` parou depois do caminho A | os MX não foram copiados junto |

Limite da Let's Encrypt: **5 certificados duplicados por semana** por conjunto
de nomes. Apagar e recriar o mesmo domínio na Railway várias vezes no mesmo
dia queima essa cota e trava tudo por uma semana. Mexa uma vez e espere.
