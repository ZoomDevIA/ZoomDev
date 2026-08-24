#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# CONFERÊNCIA DOS DOMÍNIOS ZOOMDEV
#
# Roda os testes na ordem em que eles importam e diz em que etapa a coisa
# parou. A ordem não é decorativa: certificado só existe se o DNS chega na
# Railway, e redirecionamento só é testável depois do certificado. Testar
# fora de ordem produz diagnóstico errado.
#
# LIMITE IMPORTANTE, descoberto na marra: dentro do ambiente de agente da
# Anthropic todo TLS de saída é interceptado e REEMITIDO por um gateway. O
# `openssl` de lá devolve sempre um certificado assinado por "Anthropic Egress
# Gateway", com o nome que você pediu, mesmo que a Railway não tenha emitido
# nada. Isso faz o teste de certificado dar verde e vermelho alternadamente,
# sem relação com a realidade. Por isso a etapa 3 não mede: ela imprime o que
# você precisa rodar na SUA máquina, onde o TLS é o de verdade.
#
# Uso:  bash scripts/conferir-dominios.sh
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

APP_RAILWAY="zoomdev-os-production.up.railway.app"

HOSTS=(
  "zoomdev.io"
  "www.zoomdev.io"
  "zoomdev.app"
  "www.zoomdev.app"
  "zoomdev.com.br"
  "www.zoomdev.com.br"
)

# Registro de cada TLD, para ler a delegação na fonte em vez de num cache.
declare -A RDAP=(
  ["zoomdev.io"]="https://rdap.identitydigital.services/rdap/domain/zoomdev.io"
  ["zoomdev.app"]="https://pubapi.registry.google/rdap/domain/zoomdev.app"
)

verde()    { printf "\033[32m%s\033[0m" "$1"; }
vermelho() { printf "\033[31m%s\033[0m" "$1"; }
amarelo()  { printf "\033[33m%s\033[0m" "$1"; }

# ── 1. A delegação na fonte ────────────────────────────────────────────────
# O resolvedor recursivo guarda a delegação antiga por horas depois de ela
# mudar. Quem sabe a verdade é o registro do TLD, e é ele que respondemos
# aqui: um "SUSPENSO" vindo do Google DNS pode ser só cache velho.
echo "════════ 1. DELEGAÇÃO NO REGISTRO (fonte da verdade) ════════"
for d in zoomdev.io zoomdev.app; do
  printf "  %-16s " "$d"
  curl -sS --max-time 20 "${RDAP[$d]}" 2>/dev/null | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('(RDAP não respondeu)'); raise SystemExit
st=[s.lower() for s in (d.get('status') or [])]
ns=sorted(n.get('ldhName','') for n in d.get('nameservers',[]))
ev={e['eventAction']:e['eventDate'] for e in d.get('events',[])}
retido = any('hold' in s for s in st) or any('suspend' in n for n in ns)
print(('SUSPENSO' if retido else 'livre'), '|', ','.join(ns) or '(sem NS)', '| mudou em', ev.get('last changed','?'))
"
done
printf "  %-16s " "zoomdev.com.br"
echo "(Registro.br, sem RDAP público equivalente; ver etapa 2)"

# ── 2. Para onde cada nome aponta ──────────────────────────────────────────
echo
echo "════════ 2. DNS APONTANDO PARA A RAILWAY ════════"
for h in "${HOSTS[@]}"; do
  printf "  %-22s " "$h"
  curl -sS --max-time 12 "https://dns.google/resolve?name=$h&type=A" 2>/dev/null | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('(falhou)'); raise SystemExit
alvos=[a['data'] for a in d.get('Answer',[])]
print(' -> '.join(alvos) if alvos else '(nenhum registro)')
"
done
echo
echo "  Os TXT de posse que a Railway exige:"
for h in zoomdev.io zoomdev.app; do
  printf "  %-22s " "$h"
  curl -sS --max-time 12 "https://dns.google/resolve?name=$h&type=TXT" 2>/dev/null | python3 -c "
import sys,json
ans=[a['data'] for a in json.load(sys.stdin).get('Answer',[]) if 'railway-verify' in a.get('data','')]
print(ans[0][:56]+'…' if ans else '(nenhum railway-verify)')
" 2>/dev/null || echo "(falhou)"
done

# ── 3. O certificado, que só a sua máquina consegue medir ──────────────────
echo
echo "════════ 3. CERTIFICADO ════════"
amarelo "  NÃO MEDÍVEL DAQUI"; echo " (o gateway de saída reemite todo TLS e falsearia o teste)"
echo "  Rode estes comandos no SEU terminal. O que importa é a linha issuer:"
echo "  emissor 'Let's Encrypt' ou 'Google Trust Services' = a Railway emitiu."
echo "  emissor da Railway genérico, ou erro de nome, = ainda não emitiu."
echo
for h in "${HOSTS[@]}"; do
  echo "    openssl s_client -connect $h:443 -servername $h </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer"
done

# ── 4. O aplicativo, pelo endereço que a Railway gera ──────────────────────
echo
echo "════════ 4. O APLICATIVO EM SI ════════"
printf "  %-40s " "$APP_RAILWAY"
curl -sS --max-time 15 "https://$APP_RAILWAY/api/health" 2>&1 | head -c 90
echo

# ── 5. Os redirecionamentos, depois que o certificado sair ─────────────────
echo
echo "════════ 5. REDIRECIONAMENTOS (conferir depois do certificado) ════════"
echo "  Rode no SEU terminal, um por linha, e compare com o esperado:"
cat <<'ESPERADO'
    curl -sI https://www.zoomdev.io/       | grep -i '^location'   # -> https://zoomdev.io/
    curl -sI https://zoomdev.io/entrar     | grep -i '^location'   # -> https://www.zoomdev.app/entrar
    curl -sI https://zoomdev.app/          | grep -i '^location'   # -> https://www.zoomdev.app/
    curl -sI https://zoomdev.com.br/       | grep -i '^location'   # -> https://zoomdev.io/
    curl -sI https://www.zoomdev.com.br/   | grep -i '^location'   # -> https://zoomdev.io/
    curl -s  https://zoomdev.io/           | head -c 120           # a vitrine, não página de estacionamento
    curl -s  https://www.zoomdev.app/api/health                    # {"ok":true,...}
ESPERADO
