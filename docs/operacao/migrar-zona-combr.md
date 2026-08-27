# Mover a zona `zoomdev.com.br` do Registro.br para a Hostinger

> **NÃO É NECESSÁRIO.** Em 2026-08-27 o `zoomdev.com.br` subiu pelo próprio
> Registro.br, com certificado válido, sem ALIAS e sem trocar nameservers. Este
> documento fica como registro da pesquisa, não como plano a executar.

Levantamento de 2026-08-27, com medição nos servidores autoritativos e leitura
da documentação oficial dos dois provedores.

---

## Por que a migração morreu

A premissa era que o apex do `.com.br` precisava de `CNAME @`, que o
Registro.br não cria, e que por isso a única saída seria levar a zona inteira
para um provedor que achata apex.

A premissa estava errada em dois pontos, e os dois foram medidos.

**Primeiro:** a Railway não exigiu CNAME no apex. O `requiredValue` que a
própria API devolveu para o `zoomdev.com.br` é atendível dentro do Registro.br,
sem ALIAS e sem achatamento. O que estava errado no DNS era outra coisa: o
alvo de rota e o hash `_railway-verify` tinham sido lidos uma vez por zona e
colados nos dois domínios daquela zona. Cada domínio tem os seus.

**Segundo:** depois de o DNS ficar certo, os quatro domínios continuaram
parados por horas, e isso não era DNS nenhum. A API mostrou
`DNS_RECORD_STATUS_PROPAGATED` com `CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP`:
o trabalho de emissão tinha travado porque o DNS foi corrigido **depois** de a
validação começar. Quatro `customDomainIssueCertificate` destravaram, e os seis
domínios subiram em menos de dois minutos. O procedimento está em
`railway-destravar-certificado.md`.

Resultado: em 2026-08-27 o `zoomdev.com.br` e o `www.zoomdev.com.br` respondem
com certificado válido, pelos nameservers do Registro.br, com o DNSSEC intacto
e o e-mail da empresa em nenhum momento em risco.

**Não execute este documento.** Ele fica pelo que a pesquisa derrubou abaixo,
que continua verdade e vale para qualquer migração de zona futura.

---

## O que a pesquisa derrubou

Três coisas que pareciam verdade e não são.

### O Registro.br não permite desligar o DNSSEC

O FAQ oficial responde à pergunta *"É possível desativar o DNSSEC para
domínios vinculados aos servidores DNS do Registro.br?"* com **"Não"**.

Não existe aba nem botão de DNSSEC separado. O DS mora dentro do formulário de
servidores DNS, num botão `+ DNSSEC`. Quando você troca os nameservers e deixa
os campos de DNSSEC vazios, as duas mudanças saem na **mesma publicação**.

Consequência: a ordem clássica da RFC 6781 (tirar o DS, esperar expirar, só
então trocar a delegação) **não é executável aqui**. As duas coisas são
atômicas.

### Existe uma janela de indisponibilidade inevitável

TTL do DS na zona pai `.com.br`: **3600 segundos**, medido em cache frio no
Cloudflare e confirmado no Google.

No instante da publicação, o DS some e a Hostinger passa a responder sem
assinatura. Mas todo resolvedor que já tem o DS `15666` em cache continua
exigindo assinatura por até uma hora, e devolve **SERVFAIL** para o domínio
inteiro nesse período. Site e e-mail, os dois.

O consolo é real e vale saber: SERVFAIL é falha **temporária**. O servidor
remetente não devolve a mensagem, ele enfileira e tenta de novo. O Gmail
insiste por cerca de 45 horas; o padrão da indústria é 4 a 5 dias. Numa janela
de uma hora, o e-mail **atrasa, não se perde**.

O Registro.br republica a zona `.br` a cada ~3 minutos, então a publicação em
si é rápida. O que demora é o cache do mundo.

### Os nameservers da Hostinger são diferentes por zona

Medição:

```
zoomdev.io      solar.dns-parking.com   lunar.dns-parking.com
zoomdev.app     cosmos.dns-parking.com  nova.dns-parking.com
```

A Hostinger atribui um par por zona e documenta isso: *"Nameservers may vary
by domain; always use the exact values shown in your hPanel."*

**Nunca copie o par de uma zona irmã, nem deste documento.** Leia o par que o
hPanel mostrar para o `zoomdev.com.br` e use exatamente aquele. Delegar para
servidores que não conhecem a zona derruba o domínio inteiro.

---

## O inventário, confirmado por caminhada NSEC

Fotografia da zona durante a pesquisa, antes da correção. Serve para mostrar o
método, não para consultar valor atual: o estado válido de hoje está em
`dominios-passo-a-passo.md`.

A zona é assinada, e uma zona assinada revela os próprios nomes. A caminhada
NSEC confirma que existem **exatamente 8 nomes** e nada escondido:

| Nome | Tipo | Valor | TTL |
|---|---|---|---|
| `@` | A | `69.46.46.114` | 3600 |
| `@` | MX | `5 mx1.hostinger.com` | 3600 |
| `@` | MX | `10 mx2.hostinger.com` | 3600 |
| `@` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | 3600 |
| `@` | TXT | `railway-verify=a715e231…fb647318` | 3600 |
| `www` | CNAME | `mgpczs5o.up.railway.app` | 3600 |
| `_dmarc` | TXT | `v=DMARC1; p=none` | 3600 |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com` | 3600 |
| `hostingermail-b._domainkey` | CNAME | `hostingermail-b.dkim.mail.hostinger.com` | 3600 |
| `hostingermail-c._domainkey` | CNAME | `hostingermail-c.dkim.mail.hostinger.com` | 3600 |
| `_railway-verify` | TXT | `railway-verify=a715e23178d0da3baa921cdc6b0f0c2dadd0aa6f08760154f9b47470fb647318` | 3600 |
| `_railway-verify.www` | TXT | `railway-verify=0f41eccb80a0789ba3e183fb4e0c74ef118305beb2f9ca21227c922addb6881f` | 3600 |

Não existem: `autodiscover`, `autoconfig`, `_autodiscover._tcp` (SRV),
`webmail`, `mail`, `imap`, `smtp`, `ftp`, `cpanel`, `AAAA`, `CAA`.

A documentação da Hostinger confirma que o e-mail dela usa exatamente **7
registros**: 2 MX, 1 SPF, 3 DKIM e 1 DMARC. Está tudo aí.

---

## A Hostinger NÃO recria o e-mail sozinha

Prova medida: `zoomdev.io` e `zoomdev.app` já estão no DNS da Hostinger e têm
**zero** registros de e-mail. Sem MX, sem SPF, sem DKIM.

Se a delegação virar com a zona vazia, entra em vigor a regra de MX implícito:
o e-mail passa a ser entregue no registro A da raiz, que é a borda da Railway.
A Railway não é servidor de e-mail. **Toda mensagem para o domínio é
rejeitada.**

Por isso a zona precisa estar montada **antes** da troca.

---

## Dá para montar a zona antes de trocar a delegação

A Central de Ajuda da Hostinger é explícita: *"Even if your domain's
nameservers point to an external provider, you can still pre-configure DNS
records."*

**Atenção a uma contradição na própria Hostinger:** a página de tutorial dela
afirma o oposto. Antes de assumir compromisso, teste: crie um TXT descartável
no editor de zona e veja se salva. Se salvar, o caminho está aberto. Se não
salvar, **pare e replaneje** — jamais troque os nameservers com a zona vazia.

---

## Quatro armadilhas de execução

**O botão "Redefinir registros DNS"** fica no rodapé do editor da Hostinger.
Um clique apaga MX, SPF e os três DKIM de uma vez. Nunca role até o fim do
editor sem necessidade. Se clicar por engano, use a aba **DNS history** com o
botão Restore.

**Não existe tipo "ALIAS" no menu da Hostinger.** O procedimento documentado é
escolher **CNAME** e usar `@` no campo Nome. O painel achata sozinho e publica
um registro A. Foi assim que o apex do `zoomdev.io` passou a funcionar.

**ALIAS convivendo com MX não está provado nesta conta.** Nenhuma das duas
zonas irmãs tem MX, então a coexistência nunca foi exercitada aqui. Antes de
trocar a delegação, consulte `zoomdev.com.br` tipo MX **apontando direto para
os nameservers da Hostinger** e confirme que os dois MX aparecem. Se não
aparecerem, pare.

**SPF duplicado.** Se você criar o SPF à mão e depois clicar em "Connect
automatically" no painel de e-mail, ficam dois TXT com `v=spf1` na zona, e o
SPF passa a falhar (`permerror`). Escolha um caminho: como a zona vai ser
montada à mão, **não clique em "Connect automatically"**.

---

## Reverter custa mais do que ir

Assimetria medida:

```
Registro.br publica a delegação NS com TTL  3600  (1 hora)
Hostinger publica o NS dentro da zona  com TTL 86400  (24 horas)
```

Ir para a Hostinger custa no máximo 1 hora de janela. **Voltar pode custar 24
horas.** Não planeje reverter: planeje consertar na frente, na Hostinger, com
TTL 300. E se reverter mesmo assim, **não apague a zona da Hostinger** — deixe
as duas existindo.

---

## Como saber que deu certo, de verdade

O critério **não** é "abriu no meu navegador". Um resolvedor não validante
abre o site enquanto metade da internet está com SERVFAIL.

| Portão | O que exigir |
|---|---|
| DNSSEC saiu | `dnssec-debugger.verisignlabs.com` sem DS para `zoomdev.com.br` |
| Delegação virou | os dois nameservers da Hostinger respondendo com AA |
| E-mail vivo | mandar de `contato@zoomdev.com.br` para um Gmail, abrir, três pontos, **Mostrar original**, e exigir **SPF: PASS** e **DKIM: PASS** |
| Apex no ar | abrir `https://zoomdev.com.br` e ver no cadeado **Emitido para: zoomdev.com.br**, não `*.up.railway.app` |

O portão do e-mail merece atenção: o DMARC da zona é `p=none`, então mensagem
sem assinatura **não é rejeitada nem devolvida**. Ela sai, chega, e a
reputação do domínio se degrada em silêncio. Só o "Mostrar original" revela.
Repita o teste 24 horas depois.

---

## A alternativa que se considerou, e que não foi preciso usar

O plano B era abrir mão do apex e apagar a linha `zoomdev.com.br` do painel da
Railway: quem digitasse sem o `www` não chegaria a lugar nenhum, e em troca o
e-mail da empresa nunca entraria em risco.

Não foi preciso. O apex subiu pelo Registro.br mesmo. Fica registrado porque a
troca continua válida como raciocínio: **apex de domínio que não sustenta
material nenhum não vale uma janela de indisponibilidade de e-mail.** O pitch
cita `zoomdev.io` e `www.zoomdev.app`; o `.com.br` é apelido de entrada.
