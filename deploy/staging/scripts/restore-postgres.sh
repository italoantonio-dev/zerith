#!/usr/bin/env sh
set -eu

# Restauração substitui integralmente o banco de staging. Exige confirmação explícita.
: "${RESTORE_FILE:?Defina RESTORE_FILE com um dump .dump validado}"
: "${STAGING_ENV_FILE:?Defina STAGING_ENV_FILE}"
[ -r "$RESTORE_FILE" ] || { printf 'Arquivo de restore não pode ser lido.\n' >&2; exit 1; }
[ "${CONFIRM_STAGING_RESTORE:-}" = "ERASE_AND_RESTORE" ] || {
  printf 'Abortado. Defina CONFIRM_STAGING_RESTORE=ERASE_AND_RESTORE para continuar.\n' >&2
  exit 2
}

docker compose --env-file "$STAGING_ENV_FILE" -f docker-compose.staging.yml \
  exec -T postgres pg_restore -U "${POSTGRES_USER:-zerith}" -d "${POSTGRES_DB:-zerith}" \
  --clean --if-exists --no-owner < "$RESTORE_FILE"
printf 'Restauração concluída; execute as verificações de saúde antes de liberar acesso.\n'
