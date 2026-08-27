# Domínios ZoomDev · resolvido

**Os seis estão no ar desde 2026-08-27.** Este documento virou registro do que
aconteceu. Para conferir o estado a qualquer momento:

```
bash scripts/conferir-dominios.sh
```

| Endereço | Papel | Comportamento |
|---|---|---|
| `zoomdev.io` | vitrine | serve a plataforma |
| `www.zoomdev.app` | app | serve a plataforma |
| `www.zoomdev.io` | apelido | 301 para `zoomdev.io` |
| `zoomdev.app` | apelido | 301 para `www.zoomdev.app` |
| `zoomdev.com.br` | apelido | 301 para `zoomdev.io` |
| `www.zoomdev.com.br` | apelido | 301 para `zoomdev.io` |

E a regra da vitrine: `zoomdev.io/entrar` vai para `www.zoomdev.app/entrar`,
porque sessão e origem registrada no Google moram num endereço só.

---

## As duas causas, que eram a mesma

Quatro domínios ficaram parados por mais de um dia. Havia duas causas, e as
duas eram **um valor lido uma vez por zona e colado nos dois domínios da
zona**, em camadas diferentes.

### Camada 1 · o hash de posse

A Railway dá um `_railway-verify` **diferente para cada domínio**, apex e www
inclusive. Em cada zona, um hash foi lido do painel e colado nos dois nomes.
Resultado: em cada zona exatamente um domínio validou, e era o dono do hash.

O sintoma enganava: o registro existia, resolvia, e o painel do provedor de DNS
mostrava bolinha verde. Só que era o hash do vizinho.

### Camada 2 · o alvo de rota

Mesmo erro, agora no CNAME. Cada domínio recebe um alvo
`<id>.up.railway.app` exclusivo, e cada alvo tem **IP próprio**:

```
ijy2h2ch -> 69.46.46.109      oe2p294j -> 69.46.46.119
5mckxtut -> 69.46.46.114      hpav2muv -> 69.46.46.120
g0ej7d8a -> 69.46.46.68       mgpczs5o -> 69.46.46.45
```

Seis IPs distintos: apontar dois domínios para o mesmo alvo nunca ia validar.

### O que faltava depois de corrigir os dois

Nada no DNS. A API da Railway confirmava `DNS_RECORD_STATUS_PROPAGATED` nos
seis, e mesmo assim quatro seguiam parados por horas.

O motivo: como o DNS foi corrigido **depois** de a Railway já ter começado a
validar, o trabalho ficou preso em `CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP`.
Nesse estado ela não tenta de novo sozinha, o painel não tem botão, e o
endpoint de nova tentativa recusa porque só age sobre trabalho que FALHOU.

A saída foi a mutation `customDomainIssueCertificate`, e os quatro subiram.
Procedimento em `railway-destravar-certificado.md`.

---

## O que ficou provado no caminho

**A migração da zona `.com.br` não é necessária.** O `zoomdev.com.br` está no
ar pelo Registro.br, com certificado válido, sem ALIAS e sem trocar
nameservers. A Railway aceita o apex ali do mesmo jeito que aceita o do `.io`
na Hostinger. O estudo da migração fica em `migrar-zona-combr.md` como
registro, e com ele some o risco ao e-mail da empresa.

**Não é caso de CAA, DNSSEC, limite de plano nem porta.** Todos medidos e
descartados. As três zonas não têm CAA; só a `.com.br` tem DNSSEC e ele
valida; o plano Pro permite 20 domínios e há 7; os seis usam a mesma porta que
os dois que já funcionavam.

---

## Os valores, para referência

| Domínio | Alvo de rota | Hash de posse termina em |
|---|---|---|
| `zoomdev.io` | `ijy2h2ch.up.railway.app` | `5da552` |
| `www.zoomdev.io` | `oe2p294j.up.railway.app` | `b48cd4b` |
| `zoomdev.app` | `hpav2muv.up.railway.app` | `af4c8a8` |
| `www.zoomdev.app` | `5mckxtut.up.railway.app` | `2eb3aa` |
| `zoomdev.com.br` | `g0ej7d8a.up.railway.app` | `647318` |
| `www.zoomdev.com.br` | `mgpczs5o.up.railway.app` | `b6881f` |

Nomes dos servidores de cada zona, que **variam** e não devem ser deduzidos de
uma zona irmã:

```
zoomdev.io       solar.dns-parking.com    lunar.dns-parking.com
zoomdev.app      cosmos.dns-parking.com   nova.dns-parking.com
zoomdev.com.br   e.sec.dns.br             f.sec.dns.br
```

---

## Se um cair no futuro

1. Rode `bash scripts/conferir-dominios.sh` e veja em qual das quatro etapas
   ele parou.
2. Se parar na etapa 3 ou 4 com o DNS certo, é o trabalho encravado: siga o
   `railway-destravar-certificado.md`.
3. **Nunca apague e readicione o domínio no painel.** Isso gera alvo e hash
   novos, invalida o DNS que está certo, e consome a cota da Let's Encrypt, que
   é de 5 certificados duplicados por semana.

Uma fragilidade conhecida e sem urgência: os três apex resolvem para IP fixo, e
a borda da Railway pode mudar de IP. Se um apex cair sozinho sem ninguém ter
mexido, é isso, e a correção é reler o alvo no painel.
