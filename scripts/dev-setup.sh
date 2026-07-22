#!/bin/sh
# Kaizent Dev Setup Script
# Jalankan sekali untuk menyiapkan environment development lokal
# Usage: ./scripts/dev-setup.sh

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Setting up Kaizent development environment..."

# Copy .env jika belum ada
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo "  📝 Created .env from .env.example — please fill in your API keys"
else
  echo "  ✅ .env already exists"
fi

# Buat direktori data yang diperlukan
mkdir -p "$PROJECT_ROOT/data/sqlite"
mkdir -p "$PROJECT_ROOT/data/backups"
mkdir -p "$PROJECT_ROOT/data/memory"

echo "  ✅ Data directories created"

# Install semua npm dependencies
for dir in \
  "src/router" \
  "src/memory" \
  "src/mcp/filesystem" \
  "src/mcp/obsidian" \
  "src/mcp/github" \
  "src/mcp/docker" \
  "src/mcp/terminal" \
  "src/mcp/sqlite"
do
  if [ -f "$PROJECT_ROOT/$dir/package.json" ]; then
    echo "  📦 Installing $dir..."
    (cd "$PROJECT_ROOT/$dir" && npm install --silent)
  fi
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your API keys"
echo "  2. Run: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d"
echo "  3. Test: curl http://localhost:3000/health"
