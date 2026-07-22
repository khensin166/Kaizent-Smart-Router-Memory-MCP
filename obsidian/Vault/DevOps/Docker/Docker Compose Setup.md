---
tags: [devops, docker, kaizent]
created: 2024-01-01
---

# Docker Compose Setup

## Development

```bash
# Jalankan semua service dengan hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Lihat logs
docker compose logs -f kaizent-router

# Stop semua
docker compose down
```

## Production

```bash
# Deploy production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --pull always --force-recreate

# Update satu service
docker compose pull kaizent-router && docker compose up -d kaizent-router
```

## Service Ports

| Service | Port |
|---------|------|
| Kaizent Router | 3000 |
| LiteLLM | 4000 |
| Memory Service | 3001 |
| MCP Filesystem | 8080 |
| MCP Obsidian | 8081 |

## Troubleshooting

### Container tidak mau start
```bash
docker compose logs <service-name>
docker inspect <container-name>
```

### SQLite file permission error
```bash
# Pastikan folder data/sqlite sudah ada
mkdir -p data/sqlite
chmod 755 data/sqlite
```
