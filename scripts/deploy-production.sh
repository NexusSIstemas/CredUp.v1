#!/usr/bin/env sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$PROJECT_DIR/.env.production"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não está instalado."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Crie .env.production a partir de .env.production.example."
  exit 1
fi

if grep -q "CHANGE_ME" "$ENV_FILE"; then
  echo "Substitua todos os valores CHANGE_ME de .env.production."
  exit 1
fi

cd "$PROJECT_DIR"
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d --build --remove-orphans

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  ps
