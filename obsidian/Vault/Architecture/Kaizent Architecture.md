---
tags: [architecture, kaizent]
created: 2024-01-01
---

# Kaizent Architecture

## Service Map

| Service | Port | Teknologi | Fungsi |
|---------|------|-----------|--------|
| `kaizent-router` | 3000 | Node.js/Express | Routing layer di atas LiteLLM |
| `litellm` | 4000 | LiteLLM | Proxy ke AI Providers |
| `kaizent-memory` | 3001 | Node.js + SQLite | Penyimpanan sesi & memori |
| `mcp-filesystem` | 8080 | MCP SDK + SSE | Akses file |
| `mcp-obsidian` | 8081 | MCP SDK + SSE | Akses Obsidian Vault |
| `mcp-sqlite` | 8082 | MCP SDK + SSE | Query SQLite |
| `mcp-github` | 8083 | MCP SDK + SSE | Interaksi GitHub |
| `mcp-docker` | 8084 | MCP SDK + SSE | Monitoring Docker |
| `mcp-terminal` | 8085 | MCP SDK + SSE | Eksekusi command |

## Data Flow

```
1. User kirim pesan dari VS Code
2. Kaizent Router terima request
3. Router ambil memory context dari Memory Service (port 3001)
4. Router forward ke LiteLLM dengan model yang sesuai + tools MCP
5. LiteLLM hubungi AI Provider (OpenAI/Gemini/OpenRouter)
6. AI Provider kembalikan response (mungkin disertai tool call)
7. Jika ada tool call, Router dispatch ke MCP Server yang sesuai
8. MCP Server eksekusi tool dan kembalikan hasil
9. Hasil diteruskan kembali ke AI Provider untuk final response
10. Response dikembalikan ke user
11. Router simpan percakapan ke Memory Service
```

## Volume Mounts

| Host Path | Container Path | Service |
|-----------|----------------|---------|
| `./data/sqlite` | `/data/sqlite` | kaizent-memory |
| `./obsidian/Vault` | `/vault` | mcp-obsidian |
| `./data` | `/data` | mcp-filesystem |

## Network
Semua service berada dalam Docker network `kaizent_network` (bridge).
Hanya `kaizent-router` dan `litellm` yang expose port ke host.
