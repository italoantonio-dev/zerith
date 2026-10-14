#!/usr/bin/env sh
set -eu

script=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/validate-staging-secrets.sh

random_base64() {
  head -c "$1" /dev/urandom | base64 | tr -d '\n'
}

run_valid() {
  jwt=$(random_base64 "$1")
  postgres=$(random_base64 48)
  demo=$(random_base64 48)
  device=$(random_base64 48)
  env -i PATH="$PATH" \
    POSTGRES_PASSWORD="$postgres" \
    JWT_SECRET="$jwt" \
    ZERITH_DEMO_PASSWORD="$demo" \
    ZERITH_DEVICE_KEY="$device" \
    /bin/sh "$script" >/dev/null
}

run_invalid() {
  name="$1"
  value="$2"
  postgres=$(random_base64 48)
  demo=$(random_base64 48)
  device=$(random_base64 48)
  if env -i PATH="$PATH" \
    POSTGRES_PASSWORD="$postgres" \
    JWT_SECRET="$value" \
    ZERITH_DEMO_PASSWORD="$demo" \
    ZERITH_DEVICE_KEY="$device" \
    /bin/sh "$script" >/dev/null 2>&1; then
    printf '%s\n' "Expected invalid JWT fixture was accepted: $name" >&2
    exit 1
  fi
}

run_valid 32
run_valid 48
run_invalid placeholder 'CHANGE_ME_JWT_SECRET'
run_invalid short 'YWJj'
run_invalid malformed 'this-is-not-base64-and-is-not-a-jwt-secret'
run_invalid trivial 'QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE='

printf '%s\n' 'Staging secret validation positive and negative cases passed.'
