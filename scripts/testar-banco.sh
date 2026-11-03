#!/usr/bin/env bash
# Roda os testes de segurança e estoque (supabase/tests/catalogo_estoque.sql)
# no banco local do Supabase e falha se algum teste der errado.
# Uso: npx supabase db start   (ou: npx supabase db reset)
#      bash scripts/testar-banco.sh
set -euo pipefail

URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
ARQ="$(dirname "$0")/../supabase/tests/catalogo_estoque.sql"

# -q sem mensagens; -A -t só os dados; separador "|". O arquivo termina com
# "select n, teste, ok, detalhe from resultados" e um rollback (nada fica gravado).
saida="$(psql "$URL" -v ON_ERROR_STOP=1 -q -A -t -F '|' -f "$ARQ")"

total=$(printf '%s\n' "$saida" | grep -cE '^[0-9]+\|' || true)
falhas=$(printf '%s\n' "$saida" | awk -F'|' '/^[0-9]+\|/ && $3 != "t"' || true)

printf '%s\n' "$saida" | awk -F'|' '/^[0-9]+\|/ { printf "%s %3s  %s%s\n", ($3=="t" ? "ok  " : "FALHOU"), $1, $2, ($4 != "" ? "  (" $4 ")" : "") }'

if [ "$total" -eq 0 ]; then
  echo "Nenhum resultado de teste: confira se o banco subiu com migrações e carga." >&2
  exit 1
fi
if [ -n "$falhas" ]; then
  echo "$(printf '%s\n' "$falhas" | wc -l) de $total testes falharam." >&2
  exit 1
fi
echo "Todos os $total testes passaram."
