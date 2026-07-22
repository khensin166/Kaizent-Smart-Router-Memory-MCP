---
tags: [project, kaizent, ai-platform]
status: active
tech_stack: [TypeScript, Node.js, LiteLLM, SQLite, Docker, Ansible]
created: 2024-01-01
---

# Kaizent AI Engineering Platform

## Overview
Kaizent adalah AI Engineering Platform pribadi yang berfungsi sebagai **coding assistant**, **knowledge assistant**, dan **DevOps assistant**. Platform ini dirancang bukan sekadar chatbot, tetapi sistem AI yang memahami seluruh proyek — mulai dari dokumentasi, source code, hingga infrastruktur.

> "Kaizent harus menjadi engineer yang sudah bekerja bersamaku selama bertahun-tahun."

## Tech Stack
- **AI Routing:** LiteLLM + Kaizent Custom Router (Node.js/TypeScript)
- **MCP Servers:** Modular (Filesystem, Obsidian, SQLite, GitHub, Docker, Terminal)
- **Memory:** SQLite via `better-sqlite3` (modular, bisa upgrade ke Vector DB)
- **Infrastructure:** Docker Compose + Caddy + Ansible
- **Knowledge Base:** Obsidian Vault (mount ke container)

## Architecture
```
User (VS Code)
     │
     ▼
Kaizent Router (port 3000)
     │
     ├── LiteLLM (port 4000) ─── OpenAI / Gemini / OpenRouter
     │
     ├── MCP Filesystem (port 8080)
     ├── MCP Obsidian (port 8081)
     ├── MCP SQLite (port 8082)
     ├── MCP GitHub (port 8083)
     ├── MCP Docker (port 8084)
     └── MCP Terminal (port 8085)
     
Memory Service (port 3001) ── SQLite
```

## Key Decisions
| Keputusan | Alasan | Tanggal |
|-----------|--------|---------|
| LiteLLM sebagai routing engine | Mendukung banyak provider out-of-the-box | 2024-01-01 |
| MCP Modular (per domain) | Mudah dipelihara dan dikembangkan secara independen | 2024-01-01 |
| SQLite untuk memory | Ringan, tidak butuh daemon, mudah backup | 2024-01-01 |
| Ansible untuk deployment | Idempotent, no manual SSH config | 2024-01-01 |

## Repositories
- Main: `d:\Work\MIFX\Kaizent-Smart-Router-Memory-MCP`

## Links & References
- [[Architecture/Kaizent Architecture]]
- [[DevOps/Docker/Docker Compose Setup]]
- [[Roadmap/Kaizent Roadmap]]
