#!/usr/bin/env sh
set -eu

# Execute na VPS a partir de deploy/staging, passando o arquivo privado por --env-file.
# O dump contém dados do staging: mantenha o diretório de destino com permissões restritas.
: "${BACKUP_DIR:?Defina BACKUP_DIR com um diretório seguro fora do repositório}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
output="$BACKUP_DIR/zerith-staging-$stamp.dump"
docker compose --env-file "${STAGING_ENV_FILE:?Defina STAGING_ENV_FILE}" -f docker-compose.staging.yml \
  exec -T postgres pg_dump -U "${POSTGRES_USER:-zerith}" -d "${POSTGRES_DB:-zerith}" -Fc > "$output"
chmod 600 "$output"
printf 'Backup criado: %s\n' "$output"
