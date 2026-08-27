# Destravar o certificado dos domínios na Railway

Passo a passo pelo navegador, sem terminal e sem token.

---

## Por que isto é necessário

Quando o DNS de um domínio customizado é corrigido **depois** de a Railway já
ter começado a validar, o trabalho de emissão do certificado fica preso em
`in progress` e nunca mais anda. O painel não tem botão para isso, e o
endpoint de nova tentativa recusa, porque ele só age sobre trabalho que
**falhou**, não sobre trabalho **travado**.

A única saída self-service é a mutation `customDomainIssueCertificate` da API
pública. Dois casos no fórum oficial da Railway terminaram assim: um estava
travado há 5 horas, o outro há 15, e nos dois o certificado saiu em menos de
2 minutos depois da mutation.

É exatamente o nosso caso: os hashes e os alvos foram corrigidos **depois** de
a Railway já estar validando havia mais de um dia.

---

## Passo 1 · Pegar os três identificadores

Abra o painel da Railway e entre no **serviço da aplicação**, aquele que tem os
domínios. A barra de endereço do navegador vai estar assim:

```
https://railway.com/project/AAAAAAAA/service/BBBBBBBB?environmentId=CCCCCCCC
```

Copie os três trechos:

| Onde está na URL | Como se chama |
|---|---|
| depois de `/project/` | `projectId` |
| depois de `/service/` | `serviceId` |
| depois de `?environmentId=` | `environmentId` |

São três códigos com hífens, tipo `22a1b623-eeba-4ca5-8bd8-9217bc9afbed`.

Se a URL não mostrar o `environmentId`, clique no seletor de ambiente (canto
superior) e escolha **production**: ele aparece.

---

## Passo 2 · Abrir o playground

Com a mesma aba logada, abra:

```
https://railway.com/graphiql
```

É o console de consultas da própria Railway. Ele usa a sua sessão, então **não
pede token**.

A tela tem três partes: o editor à esquerda, o resultado à direita, e um botão
de **▶ play** no meio, no topo.

---

## Passo 3 · Listar os domínios e pegar o id de cada um

Apague o que estiver no editor da esquerda e cole isto, **trocando os três
códigos** pelos seus:

```graphql
query {
  domains(
    projectId: "AAAAAAAA"
    environmentId: "CCCCCCCC"
    serviceId: "BBBBBBBB"
  ) {
    customDomains {
      id
      domain
      status {
        certificateStatus
        dnsRecords {
          hostlabel
          requiredValue
          currentValue
          status
        }
      }
    }
  }
}
```

Clique no **▶**.

À direita aparece a lista dos seis domínios. Para cada um:

- **`id`** é o que você precisa anotar
- **`domain`** diz de qual domínio é aquele bloco
- **`certificateStatus`** diz se já saiu
- **`requiredValue` contra `currentValue`** mostra, pela própria API, se o DNS
  bate

Anote o `id` dos **quatro travados**:

```
www.zoomdev.io      id: ________________________________
zoomdev.app         id: ________________________________
zoomdev.com.br      id: ________________________________
www.zoomdev.com.br  id: ________________________________
```

> **Aproveite para olhar o `requiredValue` do `zoomdev.com.br`.** Se ele pedir
> algo diferente de um CNAME, a questão de mover a zona para a Hostinger morre
> aqui, sem precisar de suporte.

---

## Passo 4 · Disparar a emissão, um domínio por vez

Apague o editor e cole isto, trocando pelo `id` do **primeiro** travado:

```graphql
mutation {
  customDomainIssueCertificate(id: "COLE-O-ID-AQUI")
}
```

Clique no **▶**.

A resposta certa é:

```json
{
  "data": {
    "customDomainIssueCertificate": true
  }
}
```

`true` significa que a Railway aceitou o pedido e recomeçou a emissão.

**Repita para os outros três**, trocando só o `id`. São quatro execuções.

Se vier `false` ou um erro, anote a mensagem e pare: quer dizer que aquele
domínio tem outro impedimento, e insistir não ajuda.

---

## Passo 5 · Conferir

Espere de 1 a 3 minutos e abra no navegador:

```
https://www.zoomdev.io
https://zoomdev.app
https://www.zoomdev.com.br
```

Cada um deve carregar a plataforma. Clique no cadeado e confirme que diz
**Emitido para: aquele domínio**, e não `*.up.railway.app`.

Ou rode a conferência completa:

```
bash scripts/conferir-dominios.sh
```

No painel Networking, os triângulos amarelos viram o círculo verde.

---

## Se preferir por linha de comando

Existe um script no repositório que faz tudo sozinho, incluindo descobrir os
identificadores. Ele lista sem mudar nada, e só dispara com `--emitir`:

```
export RAILWAY_TOKEN='token-de-conta'
node scripts/railway-certificado.mjs           # só lista
node scripts/railway-certificado.mjs --emitir  # dispara nos travados
```

O token se cria em `railway.com/account/tokens`, tipo **conta**. Ele vem de
variável de ambiente e nunca de argumento, porque argumento aparece na lista
de processos e no histórico do shell.

---

## O que não fazer

**Não apague nem readicione domínio no painel.** Cada readição gera um alvo
`.up.railway.app` novo e um hash `_railway-verify` novo, o que invalida todo o
DNS que já está certo. Além disso consome a cota da Let's Encrypt, que é de 5
certificados duplicados por semana por conjunto de nomes.

**Não rode a mutation em rajada.** Uma vez por domínio basta. Se não resolver,
o problema é outro e repetir só queima cota.

---

## Fontes

- Caso travado 5 horas, resolvido pela mutation:
  station.railway.com/questions/custom-domain-certificates-stuck-at-val-d9d135e5
- Caso travado 15 horas, mesma solução:
  station.railway.com/questions/custom-domains-never-register-on-the-edg
- Consulta de domínios: docs.railway.com/integrations/api/manage-domains
- Playground: railway.com/graphiql
