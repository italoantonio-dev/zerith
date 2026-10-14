#!/usr/bin/env sh
set -eu

reject_unsafe_value() {
  name="$1"
  value=$(printenv "$name" || true)
  upper=$(printf '%s' "$value" | tr '[:lower:]' '[:upper:]')

  case "$upper" in
    ''|CHANGE_ME_*|REPLACE_ME_*|REPLACE_WITH_*|*EXAMPLE*|*PLACEHOLDER*|*PASSWORD*|*SECRET*|*TOKEN*)
      printf '%s must be set to a non-placeholder staging secret outside the repository.\n' "$name" >&2
      exit 1
      ;;
  esac

  if [ "${#value}" -lt 16 ]; then
    printf '%s must meet the minimum staging-secret length.\n' "$name" >&2
    exit 1
  fi
}

require_jwt_secret() {
  value=$(printenv JWT_SECRET || true)

  reject_unsafe_value JWT_SECRET

  case "$value" in
    *[!A-Za-z0-9+/=]*|*=*?*=*|*===*)
      printf '%s\n' 'JWT_SECRET must use a single-line Base64 representation.' >&2
      exit 1
      ;;
  esac

  if ! printf '%s' "$value" | base64 -d >/dev/null 2>&1; then
    printf '%s\n' 'JWT_SECRET must use valid Base64 encoding.' >&2
    exit 1
  fi

  decoded_bytes=$(printf '%s' "$value" | base64 -d | wc -c | tr -d '[:space:]')
  if [ "$decoded_bytes" -lt 32 ]; then
    printf '%s\n' 'JWT_SECRET must encode at least 32 random bytes.' >&2
    exit 1
  fi

  distinct_characters=$(printf '%s' "$value" | fold -w 1 | sort -u | wc -l | tr -d '[:space:]')
  if [ "$distinct_characters" -lt 16 ]; then
    printf '%s\n' 'JWT_SECRET must not use a trivial or repetitive value.' >&2
    exit 1
  fi
}

reject_unsafe_value POSTGRES_PASSWORD
require_jwt_secret
reject_unsafe_value ZERITH_DEMO_PASSWORD
reject_unsafe_value ZERITH_DEVICE_KEY
