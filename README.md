# Kaizent AI Engineering Platform

Kaizent adalah AI Engineering Platform pribadi yang berfungsi sebagai coding assistant, knowledge assistant, dan DevOps assistant. Proyek ini tidak hanya sebagai chatbot, melainkan platform AI utuh yang dapat memahami struktur proyek, mengingat keputusan, membaca dokumentasi, dan membantu operasional DevOps.

## Arsitektur

Kaizent terdiri dari beberapa layer utama:
1. **OmniRouter (LiteLLM + Kaizent Layer):** Menangani routing ke model AI (OpenAI, Gemini, dll) dan policy internal.
2. **MCP Server (Modular):** Micro-servers yang menyediakan _tools_ spesifik ke model AI, meliputi: Filesystem, SQLite, Obsidian, GitHub, Docker, dan Terminal.
3. **Agent Memory:** Menyimpan konteks percakapan secara persisten menggunakan SQLite (disiapkan untuk modularity ke Vector DB di masa depan).
4. **Knowledge Base:** Menggunakan Obsidian Vault yang di-_mount_ langsung ke dalam sistem agar AI dapat membaca SOP, panduan arsitektur, dan _meeting notes_.

## Development (Local)

Platform dikembangkan secara lokal menggunakan Docker Compose. 

1. Salin konfigurasi environment:
   ```bash
   cp .env.example .env
   ```
2. Jalankan _environment_ development:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

## Production Deployment

Deployment dilakukan via Ansible ke target VPS untuk memastikan konfigurasi yang _idempotent_ dan aman.

```bash
cd ansible
ansible-playbook -i inventory deploy.yml
```

_Note: VPS hanya berfungsi sebagai target deployment. Seluruh konfigurasi dan kode dikelola melalui Git di environment pengembangan lokal._
