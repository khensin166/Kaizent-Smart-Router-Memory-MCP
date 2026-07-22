#!/bin/sh
# Kaizent Backup Script
# Jalankan dari root project directory
# Usage: ./scripts/backup.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="kaizent_backup_$TIMESTAMP"

echo "🔄 Starting Kaizent backup: $BACKUP_NAME"

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

# ── 1. Backup SQLite database ──────────────────────────────────────────────────
SQLITE_SRC="$PROJECT_ROOT/data/sqlite"
if [ -d "$SQLITE_SRC" ]; then
  echo "  📦 Backing up SQLite..."
  tar -czf "$BACKUP_DIR/${BACKUP_NAME}_sqlite.tar.gz" -C "$SQLITE_SRC" .
  echo "  ✅ SQLite backup done"
fi

# ── 2. Backup Obsidian Vault ───────────────────────────────────────────────────
VAULT_SRC="$PROJECT_ROOT/obsidian/Vault"
if [ -d "$VAULT_SRC" ]; then
  echo "  📦 Backing up Obsidian Vault..."
  tar -czf "$BACKUP_DIR/${BACKUP_NAME}_vault.tar.gz" \
    --exclude="$VAULT_SRC/.obsidian/workspace*" \
    --exclude="$VAULT_SRC/.trash" \
    -C "$VAULT_SRC" .
  echo "  ✅ Vault backup done"
fi

# ── 3. Backup konfigurasi ──────────────────────────────────────────────────────
CONFIG_SRC="$PROJECT_ROOT/config"
if [ -d "$CONFIG_SRC" ]; then
  echo "  📦 Backing up config..."
  tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" -C "$CONFIG_SRC" .
  echo "  ✅ Config backup done"
fi

# ── 4. Bersihkan backup lama (simpan 7 hari terakhir) ─────────────────────────
echo "  🧹 Cleaning backups older than 7 days..."
find "$BACKUP_DIR" -name "kaizent_backup_*" -mtime +7 -exec rm -f {} \;

echo ""
echo "✅ Backup selesai: $BACKUP_DIR/$BACKUP_NAME*"
