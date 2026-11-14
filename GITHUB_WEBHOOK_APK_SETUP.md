# Panduan Integrasi GitHub Webhook & Distribusi APK Otomatis

Platform ini memungkinkan Anda mendistribusikan file APK Android langsung melalui website portofolio tanpa mengubah workflow CI/CD repositori Anda. Cukup upload file `.apk` ke **GitHub Releases**, dan sistem akan otomatis memproses, mengekstrak metadata, mengunggah ke MinIO, serta menampilkannya di halaman `/apps`.

---

## 🚀 Alur Kerja Sistem

```
GitHub Release (Upload .apk) 
       │
       ▼ Webhook (X-Hub-Signature-256)
API Server (/api/v1/webhooks/github)
       │
       ▼ Asynchronous Event
Worker (worker-portofolio-v2)
       ├── 1. Unduh binary .apk dari GitHub
       ├── 2. Ekstrak package_name, version_code, label & icon (app-info-parser)
       ├── 3. Simpan binary APK & icon ke MinIO Object Storage
       └── 4. Update data aplikasi & rilis di database PostgreSQL
       │
       ▼
Halaman Web /apps & QR Code Scan
```

---

## 🛠️ Step-by-Step Setup Webhook di GitHub

### Langkah 1: Daftarkan Repositori di Dashboard
1. Buka dashboard portofolio Anda di `/dashboard/apps`.
2. Klik tombol **"Daftarkan Repository"**.
3. Isi informasi:
   - **Repository Slug**: Format `owner/repo_name` (contoh: `exa-dev/my-pos-mobile`).
   - **Private Repo**: Centang jika repositori bersifat private, lalu masukkan **GitHub Personal Access Token (PAT)** dengan scope `repo`.
   - **Asset Regex Filter**: Default `.*\.apk$` (memastikan hanya file APK yang diproses).
4. Klik **"Simpan & Daftarkan"**.
5. Sistem akan menghasilkan **Webhook Secret** unik untuk repositori Anda. Salin secret tersebut.

---

### Langkah 2: Konfigurasi Webhook di GitHub
1. Buka repository target Anda di browser: `https://github.com/<owner>/<repo_name>`.
2. Masuk ke tab **Settings** > **Webhooks** (di menu sebelah kiri).
3. Klik tombol **"Add webhook"** (mungkin diminta memasukkan password GitHub Anda).
4. Isi formulir webhook dengan pengaturan berikut:

| Pengaturan | Nilai yang Harus Diisi |
| :--- | :--- |
| **Payload URL** | `https://eka-dev.cloud/api/v1/webhooks/github` (atau domain server Anda) |
| **Content type** | `application/json` (⚠️ Wajib pilih JSON) |
| **Secret** | Masukkan **Webhook Secret** yang disalin dari Dashboard pada Langkah 1 |
| **SSL verification** | Pilih **Enable SSL verification** |

5. Pada bagian **"Which events would you like to trigger this webhook?"**:
   - Pilih opsi: **"Let me select individual events."**
   - Hapus centang pada *"Pushes"*.
   - Beri centang HANYA pada opsi **"Releases"**.
6. Pastikan opsi **Active** tercentang.
7. Klik tombol **"Add webhook"**.

GitHub akan mengirim ping `200 OK` pertama kali untuk memvalidasi endpoint.

---

## 📦 Cara Mempublikasikan Rilis APK

1. Di repository Anda, masuk ke tab **Releases** > **Draft a new release**.
2. Pilih atau buat tag baru (misal: `v1.0.0`).
3. Tulis Release title dan Changelog / Catatan Rilis.
4. Pada kotak **"Attach binaries by dropping them here or selecting them"**, unggah file APK Anda (misal: `app-release.apk`).
5. Klik **"Publish release"**.

Dalam hitungan detik:
- GitHub memicu webhook ke server portofolio Anda.
- Background worker mengunduh APK, membaca metadata (`versionCode`, `versionName`, app icon), dan mengunggahnya ke MinIO storage.
- Aplikasi langsung muncul di halaman **`/apps`** lengkap dengan tombol download dan QR code untuk di-scan dari HP Android.

---

## ⚡ Fitur Manual Sync (Reconcile)
Jika Anda baru saja mendaftarkan repository yang sudah memiliki rilis sebelumnya:
1. Buka `/dashboard/apps`.
2. Temukan repository yang diinginkan.
3. Klik tombol **"Sync Now"**.
4. Worker akan langsung menghubungi GitHub REST API (`GET /repos/{owner}/{repo}/releases/latest`) dan memproses rilis terbaru tanpa menunggu trigger webhook.

---

## 🔄 Perpindahan atau Rename Repositori (Repo Migration)
Jika repositori GitHub Anda dipindahkan ke organisasi baru (misal: dari `exa31/winmix` ke `eka-dev-ecosystem/winmix`) atau diganti namanya:
1. **Auto-Healing Otomatis**:
   - Jika webhook tetap dikirimkan ke endpoint kami dengan Webhook Secret yang valid, sistem backend akan **secara otomatis mendeteksi perpindahan repositori** berdasarkan kecocokan nama repositori dan validasi HMAC SHA-256 signature.
   - Slug repositori di database akan diperbarui secara otomatis tanpa downtime atau kehilangan riwayat rilis aplikasi.
2. **Update Manual melalui Dashboard**:
   - Anda juga dapat memperbarui slug repositori kapan saja melalui dashboard di `/dashboard/apps`.
   - Klik tombol **Edit** (ikon pensil) pada kartu repositori.
   - Ubah kolom **Repository Slug** ke alamat baru (contoh: `eka-dev-ecosystem/winmix`), lalu klik **"Save Changes"**.
3. **Pengecekan Konfigurasi Webhook**:
   - Klik tombol **Webhook Info** (ikon informasi `i`) pada kartu repositori di dashboard untuk melihat Payload URL, Webhook Secret, dan tautan langsung ke halaman Webhooks repositori GitHub terkait.

---

## 🌐 Endpoint API Publik

| Endpoint | Method | Keterangan |
| :--- | :--- | :--- |
| `/api/v1/apps` | `GET` | Menampilkan seluruh aplikasi yang aktif dan versi rilis terbarunya |
| `/api/v1/apps/{package_name}` | `GET` | Detail lengkap aplikasi dan riwayat versi rilis |
| `/api/v1/apps/{package_name}/download` | `GET` | Download / stream APK versi terbaru (hemat RAM & count download) |
| `/api/v1/apps/{package_name}/download/{version_code}` | `GET` | Download file APK versi tertentu |
| `/api/v1/apps/{package_name}/check-update?version_code={code}` | `GET` | Cek apakah tersedia versi lebih baru untuk fitur in-app update |
