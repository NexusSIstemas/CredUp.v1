#!/usr/bin/env sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$PROJECT_DIR/.env.production"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo .env.production não encontrado."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > "$BACKUP_DIR/credup-$TIMESTAMP.dump"

find "$BACKUP_DIR" \
  -type f \
  -name 'credup-*.dump' \
  -mtime "+$RETENTION_DAYS" \
  -delete

echo "Backup criado em $BACKUP_DIR/credup-$TIMESTAMP.dump"
