#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# CONFERÊNCIA DOS DOMÍNIOS ZOOMDEV
#
# Roda os quatro testes que importam, na ordem em que a Railway os avalia, e
# diz em qual deles cada nome parou. Rode depois de cada alteração de DNS.
#
# A ORDEM NÃO É DECORATIVA. A Railway só emite certificado depois de duas
# coisas: o nome apontar para a borda dela (CNAME ou apex achatado), E o TXT
# de posse existir em `_railway-verify.<nome-completo>` com o hash daquele
# domínio. Falhando qualquer uma, o painel fica em "Waiting for DNS update"
# para sempre, sem dizer qual das duas falhou. É esse silêncio que este
# script quebra.
#
# O HASH É POR DOMÍNIO, NÃO POR ZONA. Cada domínio adicionado na Railway
# ganha um `_railway-verify` DIFERENTE, inclusive apex e www da mesma zona.
# Copiar o hash do apex para o www não funciona: o registro existe, resolve,
# aparece verde no painel do provedor de DNS, e mesmo assim a Railway nunca
# valida. Foi assim que www.zoomdev.io e zoomdev.app ficaram parados.
#
# LIMITE DESTE AMBIENTE. Dentro do ambiente de agente da Anthropic todo TLS
# de saída é interceptado e reemitido por um gateway, então `openssl` daqui
# devolve sempre um certificado do gateway e o teste de certificado daria
# verde e vermelho sem relação com a realidade. Por isso a etapa 4 mede pelo
# CORPO da resposta, que o gateway não forja: ou o HTML da vitrine chega, ou
# não chega.
#
# Uso:  bash scripts/conferir-dominios.sh
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

# Os dois que servem conteúdo de verdade. Os outros quatro são apelidos que
# só redirecionam, e por isso não seguram nem a inscrição nem uma demonstração.
declare -A PAPEL=(
  ["zoomdev.io"]="VITRINE, serve conteúdo"
  ["www.zoomdev.app"]="APP, serve conteúdo"
  ["www.zoomdev.io"]="apelido, redireciona para zoomdev.io"
  ["zoomdev.app"]="apelido, redireciona para www.zoomdev.app"
  ["zoomdev.com.br"]="apelido, redireciona para zoomdev.io"
  ["www.zoomdev.com.br"]="apelido, redireciona para zoomdev.io"
)
HOSTS=(zoomdev.io www.zoomdev.app www.zoomdev.io zoomdev.app zoomdev.com.br www.zoomdev.com.br)

ok()   { printf "\033[32m%s\033[0m" "$1"; }
mal()  { printf "\033[31m%s\033[0m" "$1"; }
meio() { printf "\033[33m%s\033[0m" "$1"; }

doh() { # doh <nome> <tipo>  -> uma linha com os dados, ou vazio
  curl -sS --max-time 12 "https://dns.google/resolve?name=$1&type=$2" 2>/dev/null | python3 -c "
import sys, json
try: d = json.load(sys.stdin)
except Exception: raise SystemExit
print(' '.join(a['data'].strip('\"') for a in d.get('Answer', [])))
"
}

echo "═══════════════════════════════════════════════════════════════════════"
echo " CONFERÊNCIA DOS DOMÍNIOS · $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "═══════════════════════════════════════════════════════════════════════"

declare -a PENDENTES=()

for h in "${HOSTS[@]}"; do
  echo
  echo "── $h  ·  ${PAPEL[$h]}"

  # 1. O nome resolve para alguma coisa?
  rota=$(doh "$h" A)
  if [[ -z "$rota" ]]; then
    printf "   1. rota      "; mal "NÃO RESOLVE"; echo "  (nenhum A nem CNAME)"
    PENDENTES+=("$h: criar o registro de rota que a Railway pedir")
    continue
  fi
  printf "   1. rota      "; ok "resolve"; echo "  $rota"

  # 2. A borda da Railway reconhece este Host?
  #    Nome conhecido devolve 301 com o cabeçalho x-railway. Nome desconhecido
  #    na mesma borda devolve 403 com x-deny-reason: resolve_no_records.
  cab=$(curl -sS -m 15 -o /dev/null -D - "http://$h/" 2>/dev/null | tr -d '\r')
  if grep -qi '^x-railway' <<<"$cab"; then
    printf "   2. borda     "; ok "a Railway reconhece o nome"; echo
  else
    printf "   2. borda     "; mal "a Railway NÃO reconhece"
    echo "  $(grep -i '^x-deny-reason' <<<"$cab" || echo '(sem motivo)')"
    PENDENTES+=("$h: a rota chega noutro lugar, conferir o alvo no painel")
    continue
  fi

  # 3. O TXT de posse, no nome certo e com hash próprio.
  txt=$(doh "_railway-verify.$h" TXT)
  if [[ -z "$txt" ]]; then
    printf "   3. posse     "; mal "TXT AUSENTE"
    echo "  em _railway-verify.$h"
    PENDENTES+=("$h: criar TXT em _railway-verify.$h com o hash DESTE domínio")
  else
    printf "   3. posse     "; ok "presente"; echo "  ${txt:0:38}…"
  fi

  # 4. O certificado, medido pelo corpo da resposta.
  #    2 KB porque o <title> da vitrine vem depois de um bloco de <meta> e de
  #    pré-carregamento de fonte: 400 bytes paravam antes dele e davam
  #    "resposta inesperada" justamente nos dois domínios que funcionam.
  corpo=$(curl -sS -m 20 "https://$h/" 2>&1 | head -c 2048)
  if grep -q '<title>ZoomDev' <<<"$corpo"; then
    printf "   4. TLS       "; ok "NO AR"; echo "  (o HTML da plataforma chega)"
  elif grep -qi 'certificate subject name\|SSL' <<<"$corpo"; then
    printf "   4. TLS       "; mal "sem certificado"; echo "  (a Railway ainda não emitiu)"
  else
    printf "   4. TLS       "; meio "resposta inesperada"; echo "  ${corpo:0:70}"
  fi
done

# ── O hash repetido dentro da mesma zona ───────────────────────────────────
# Este é o defeito que não aparece em lugar nenhum: o registro existe, resolve,
# e o painel do provedor mostra bolinha verde. Só que é o hash do vizinho.
echo
echo "═══ HASHES REPETIDOS DENTRO DA MESMA ZONA ═══"
echo "  A Railway dá um hash diferente para CADA domínio. Dois nomes da mesma"
echo "  zona com o MESMO hash significa que um deles recebeu o do outro, e é"
echo "  esse que nunca vai validar."
for par in "zoomdev.io www.zoomdev.io" "zoomdev.app www.zoomdev.app" "zoomdev.com.br www.zoomdev.com.br"; do
  set -- $par
  a=$(doh "_railway-verify.$1" TXT); b=$(doh "_railway-verify.$2" TXT)
  printf "  %-34s " "$1  vs  $2"
  if [[ -z "$a" || -z "$b" ]]; then meio "um dos dois não existe"; echo
  elif [[ "$a" == "$b" ]]; then mal "IGUAIS"; echo "  <- um dos dois está com o hash do outro"
  else ok "diferentes"; echo "  (como a Railway espera)"
  fi
done

# ── O que fazer agora ──────────────────────────────────────────────────────
echo
echo "═══ PENDÊNCIAS ═══"
if [[ ${#PENDENTES[@]} -eq 0 ]]; then
  ok "  nenhuma"; echo
else
  printf '  · %s\n' "${PENDENTES[@]}"
fi

cat <<'FIM'

═══ COMO PEGAR O VALOR CERTO NA RAILWAY ═══

  Para CADA domínio parado, no painel Networking:
    1. clique em "Show DNS records" NA LINHA DAQUELE domínio
    2. o diálogo traz DOIS registros, e os dois são exclusivos daquele nome:
         CNAME  <nome>              -> <algo>.up.railway.app
         TXT    _railway-verify.<nome-completo>  -> railway-verify=<hash>
    3. copie os dois. Não reaproveite o do apex no www, nem o contrário.

  ARMADILHA DA TRADUÇÃO AUTOMÁTICA. Com a página traduzida para português, o
  navegador reescreve o texto ANTES de você copiar: "_railway-verify" vira
  "_verificação ferroviária". Desligue a tradução na aba da Railway antes de
  copiar qualquer coisa.

  NO REGISTRO.BR, modo avançado: a coluna NOME mostra o nome completo, mas o
  formulário quer só o rótulo, porque ele acrescenta a zona sozinho. Para
  _railway-verify.zoomdev.com.br digite `_railway-verify`. Para o www, digite
  `_railway-verify.www`. E confirme a publicação da zona no fim: o Registro.br
  publica em lote e a edição fica pendente até você confirmar.

  APEX COM ENDEREÇO IP FIXO NÃO SERVE. A Railway roda a borda em IP rotativo
  e valida pelo nome, não pelo número. Na Hostinger use CNAME no apex, que ela
  achata sozinha. No Registro.br, se não houver CNAME de apex, use o valor que
  o diálogo da Railway indicar para apex.
FIM
