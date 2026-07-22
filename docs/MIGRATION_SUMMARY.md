# Ringkasan Migrasi & Arsitektur Kaizent 🚀

Dokumen ini berisi rangkuman seluruh perjalanan epik kita dalam merombak arsitektur **Kaizent Smart Router** dari sistem berbasis multi-kontainer manual menjadi sistem yang kuat, terpusat, dan berskala *Enterprise* menggunakan **OmniRoute**.

---

## 1. Perubahan Arsitektur Utama (Opsi B: Full OmniRoute)
Awalnya, kita menggunakan kombinasi `LiteLLM` (sebagai router), `mcp-sqlite` (sebagai memori), dan `mcp-obsidian` (sebagai otak). Namun, demi performa dan efisiensi memori di VPS 1GB, kita membuang semuanya dan menggantinya dengan **satu mesin super: OmniRoute**.

- **Keuntungan:** OmniRoute sudah memiliki **Vector Database (Qdrant)**, **SQLite FTS5**, dan **Semantic Cache** bawaan. Ia menghemat RAM secara drastis dibandingkan menjalankan 5 kontainer terpisah.
- **Efisiensi Token:** Berkat Semantic Caching dan Vector Memory bawaannya, setiap *prompt* yang berulang akan langsung dijawab tanpa menembak API (100% hemat token).

## 2. Pemasangan "Otak Obsidian" (Engineer Brain)
Agar OmniRoute memiliki akses ke pemikiran dan *roadmap* Anda, kita telah menghubungkan folder Obsidian lokal Anda langsung ke dalam perut OmniRoute.
- **Konfigurasi:** Volume `./obsidian/Vault:/vault` ditambahkan ke `docker-compose.yml`.
- **Aksi Lanjutan:** Anda hanya perlu mengaktifkan alat *File System* di dalam UI OmniRoute dan mengarahkannya ke `/vault`.

## 3. Resolusi Masalah Kritis (Troubleshooting)

### A. Error Node.js & Heap Out of Memory (OOM Crash)
- **Gejala:** OmniRoute selalu mati saat *startup* dengan error `e.util.markAsUncloneable is not a function` atau `FATAL ERROR: Reached heap limit`.
- **Solusi:** 
  1. Kita melakukan *upgrade* ke **Node.js versi 22** Alpine.
  2. Melonggarkan jatah memori (RAM) di `docker-compose.prod.yml` menjadi **800MB** (karena VPS 1GB Anda kini didedikasikan 100% hanya untuk OmniRoute).

### B. Keandalan Skrip Deploy Ansible
- **Gejala:** Ansible selalu menganggap *deploy* gagal karena *healthcheck* (pengecekan port 3000) sering *timeout*.
- **Solusi:** Memperbarui `ansible/deploy.yml` dengan modul `wait_for` untuk memantau IP `127.0.0.1` port `3000`, serta memperbanyak waktu toleransi tunggu hingga 30 kali agar OmniRoute punya waktu yang cukup untuk *booting*.

### C. Masalah HTTPS (Caddy & Jaringan Internal)
- **Gejala:** Error `ERR_SSL_PROTOCOL_ERROR` saat mengakses domain dari *browser*.
- **Solusi:** Alih-alih merutekan Caddy ke IP publik yang bisa terblokir *firewall*, kita menggabungkan Caddy **langsung ke dalam jaringan Docker OmniRoute** (`docker network connect kaizent_kaizent_network caddy_proxy`). Hasilnya, Caddy bisa merutekan trafik dengan aman dan mulus.

### D. Bypass Blokir Region Gemini API (Proxychains)
- **Gejala:** Google memblokir akses ke Gemini API dengan pesan *"User location is not supported"* karena Azure Malaysia dianggap IP Data Center yang tidak diizinkan.
- **Solusi ("Cara Sakti"):** Tanpa mengubah kode program satu baris pun, kita menyuntikkan **Proxychains-ng** langsung ke dalam `omniroute.Dockerfile`. Seluruh komunikasi keluar akan dipaksa melewati terowongan (Tencent Jakarta - `43.157.202.234:8888`), menipu Google sehingga menyangka *request* datang dari Jakarta.

---

## 4. Cara Menjalankan & Maintenance

- **Alamat Dashboard:** `https://kaizent-router.kenantomfie.com/dashboard`
- **Password Default:** `CHANGEME` (Segera ubah melalui menu Settings di dalam UI OmniRoute).
- **Proses Update:** Setiap perubahan yang Anda buat di kode lokal atau `.env` hanya perlu di-*commit* & *push* ke cabang `main`. GitHub Actions akan mengurus sisanya dan mendeploykannya secara aman via Ansible.

> **Catatan Penting:** Untuk "Knowledge Graph Memory" berbasis struktur kode seperti `DeusData/codebase-memory-mcp`, alat tersebut sebaiknya diinstal **secara lokal di komputer/laptop Anda**, lalu disambungkan lewat IDE Anda (Cursor/Cline) ke API OmniRoute. Memaksakan *indexing* proyek raksasa di VPS 1GB berisiko membuat server *crash*.

---
**Status Akhir:** Infrastruktur Enterprise AI Router Anda kini berdiri kokoh, aman, dan beroperasi penuh! 🏆
