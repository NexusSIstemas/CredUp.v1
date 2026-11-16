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

RCLONE_REMOTE=$(sed -n 's/^BACKUP_GOOGLE_DRIVE_REMOTE=//p' "$ENV_FILE" | tail -n 1)
RCLONE_DIRECTORY=$(sed -n 's/^BACKUP_GOOGLE_DRIVE_DIRECTORY=//p' "$ENV_FILE" | tail -n 1)
DRIVE_RETENTION_DAYS=$(sed -n 's/^BACKUP_GOOGLE_DRIVE_RETENTION_DAYS=//p' "$ENV_FILE" | tail -n 1)

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > "$BACKUP_DIR/credup-$TIMESTAMP.dump"

BACKUP_FILE="$BACKUP_DIR/credup-$TIMESTAMP.dump"

if [ -n "$RCLONE_REMOTE" ] || [ -n "$RCLONE_DIRECTORY" ]; then
  if [ -z "$RCLONE_REMOTE" ] || [ -z "$RCLONE_DIRECTORY" ]; then
    echo "Defina BACKUP_GOOGLE_DRIVE_REMOTE e BACKUP_GOOGLE_DRIVE_DIRECTORY juntos."
    exit 1
  fi
  if ! command -v rclone >/dev/null 2>&1; then
    echo "rclone não está instalado; a cópia no Google Drive não pode ser confirmada."
    exit 1
  fi

  rclone copyto "$BACKUP_FILE" "$RCLONE_REMOTE:$RCLONE_DIRECTORY/$(basename "$BACKUP_FILE")" \
    --checksum \
    --retries 3 \
    --low-level-retries 10

  if [ -n "$DRIVE_RETENTION_DAYS" ]; then
    rclone delete "$RCLONE_REMOTE:$RCLONE_DIRECTORY" \
      --include 'credup-*.dump' \
      --min-age "${DRIVE_RETENTION_DAYS}d"
    rclone rmdirs "$RCLONE_REMOTE:$RCLONE_DIRECTORY"
  fi

  echo "Cópia externa confirmada em $RCLONE_REMOTE:$RCLONE_DIRECTORY"
fi

find "$BACKUP_DIR" \
  -type f \
  -name 'credup-*.dump' \
  -mtime "+$RETENTION_DAYS" \
  -delete

echo "Backup criado em $BACKUP_FILE"
