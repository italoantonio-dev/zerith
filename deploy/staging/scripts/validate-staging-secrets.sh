#!/usr/bin/env sh
set -eu

reject_placeholder() {
  name="$1"
  value=$(printenv "$name" || true)

  case "$value" in
    ''|CHANGE_ME_*|REPLACE_ME_*|REPLACE_WITH_*|*example*|*EXAMPLE*|*placeholder*|*PLACEHOLDER*)
      printf '%s must be set to a real staging secret outside the repository.\n' "$name" >&2
      exit 1
      ;;
  esac
}

reject_placeholder POSTGRES_PASSWORD
reject_placeholder JWT_SECRET
reject_placeholder ZERITH_DEMO_PASSWORD
reject_placeholder ZERITH_DEVICE_KEY
