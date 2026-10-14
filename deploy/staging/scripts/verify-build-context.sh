#!/usr/bin/env sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
dockerignore="$root/.dockerignore"
web_dockerfile="$root/deploy/staging/Dockerfile.web"
api_dockerfile="$root/backend/Dockerfile.staging"
compose_file="$root/deploy/staging/docker-compose.staging.yml"

require_line() {
  expected="$1"
  file="$2"
  if ! grep -Fqx "$expected" "$file"; then
    printf '%s\n' "Required build-context policy is missing." >&2
    exit 1
  fi
}

require_line '.env' "$dockerignore"
require_line '.env.*' "$dockerignore"
require_line '**/.env' "$dockerignore"
require_line '**/.env.*' "$dockerignore"
require_line '*.env' "$dockerignore"
require_line '*.env.*' "$dockerignore"
require_line '**/*.env' "$dockerignore"
require_line '**/*.env.*' "$dockerignore"

if grep -Eq '^COPY[[:space:]]+\.[[:space:]]+\.' "$web_dockerfile"; then
  printf '%s\n' 'Web image must not copy the complete build context.' >&2
  exit 1
fi

for source in \
  'COPY package.json package-lock.json ./' \
  'COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json postcss.config.js tailwind.config.ts ./' \
  'COPY public ./public' \
  'COPY src ./src'; do
  require_line "$source" "$web_dockerfile"
done

require_line 'ENV VITE_API_URL=/api/v1' "$web_dockerfile"
require_line 'COPY backend/pom.xml pom.xml' "$api_dockerfile"
require_line 'COPY backend/src src' "$api_dockerfile"

if grep -Eq '^[[:space:]]*VITE_[A-Za-z0-9_]+:' "$compose_file"; then
  printf '%s\n' 'Frontend VITE_* build arguments must not be supplied by Compose.' >&2
  exit 1
fi

printf '%s\n' 'Build-context policy verified without reading environment values.'