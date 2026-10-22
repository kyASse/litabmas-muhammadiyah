# Panduan Operasional Setup, Deployment, dan Rollback Hostinger Shared Hosting

Dokumen ini merupakan panduan operasional resmi dan terstandarisasi untuk melakukan konfigurasi, deployment otomatis berbasis GitHub Actions, serta prosedur penanganan pemulihan bencana (*disaster recovery* / *rollback*) pada infrastruktur **Hostinger Shared Hosting** untuk aplikasi **Sistem Penelitian Terintegrasi Standalone (RPL-2026)**.

---

## 1. Gambaran Umum Arsitektur Deployment

Untuk mengatasi keterbatasan sumber daya komputasi (*CPU*, *RAM*, dan batasan eksekusi proses) pada paket *shared hosting*, arsitektur pipeline menerapkan strategi **Runner-Side Build dengan RSync over SSH Terpisah**:

```text
[ Developer Machine ]
        │
        ▼ (git push / workflow_dispatch)
[ GitHub Repository ]
        │
        ▼
[ GitHub Actions Runner (Ubuntu Latest) ]
  ├── 1. Quality Gate (Laravel Pint, TypeScript Typecheck, Pest PHP)
  ├── 2. Build Aset Frontend (Node.js 22 + Vite -> public/build)
  ├── 3. Build Ketergantungan Backend (PHP 8.4 + Composer v2 --no-dev)
  └── 4. Transformasi Path (scripts/hostinger-prepare-public.js)
        │
        ▼ (RSync over SSH Port 65002)
[ Hostinger Shared Hosting Server ]
  ├── ~/litabmas_core/          <-- Direktori Core Laravel (Di Luar Web Root)
  │     ├── app/, bootstrap/, config/, database/, routes/, vendor/
  │     ├── storage/ (app, framework, logs)
  │     └── .env (Kredensial Sensitif)
  │
  ├── ~/litabmas_core_backup/   <-- Snapshot Cadangan Otomatis Terakhir
  │
  └── ~/public_html/            <-- Web Root (Dapat Diakses Publik)
        ├── index.php (Mengarah ke ../litabmas_core/...)
        ├── .htaccess
        ├── build/ (Aset JS/CSS)
        └── storage -> ../litabmas_core/storage/app/public
```

> [!IMPORTANT]
> **Invarian Isolasi Keamanan**: Seluruh berkas sensitif (`.env`, repositori `.git`, pustaka `vendor/`, berkas konfigurasi, serta penyimpanan privat `storage/`) **DILARANG KERAS** ditempatkan di dalam folder `public_html`. Direktori `public_html` hanya boleh memuat berkas publik hasil kompilasi dan titik masuk `index.php` yang jalurnya telah disesuaikan.

---

## 2. Bagian 1: Konfigurasi Akses SSH Hostinger

Hostinger Shared Hosting menggunakan port SSH kustom (**65002**), bukan port standar 22.

### Langkah 1.1: Aktivasi SSH di hPanel
1. Masuk ke dashboard **hPanel Hostinger** (https://hpanel.hostinger.com).
2. Pilih paket hosting domain terkait, lalu navigasi ke menu **Tingkat Lanjut (Advanced)** -> **Akses SSH (SSH Access)**.
3. Pastikan status SSH disetel ke **Aktif (Enabled)**.
4. Catat informasi koneksi yang ditampilkan di layar:
   - **SSH IP / Host**: Contoh `153.92.xxx.xxx` atau `access.hostinger.com`.
   - **Port SSH**: `65002`.
   - **SSH Username**: Contoh `u123456789`.
   - **SSH Password**: Kata sandi akun hosting (digunakan jika otentikasi kunci belum terpasang).

> [!IMPORTANT]
> **Catatan Alamat IP Dinamis GitHub Actions**: Pada menu Akses SSH hPanel, jangan membatasi atau mengaktifkan pembatasan daftar putih (*IP whitelisting*) untuk koneksi SSH. Mesin virtual GitHub Actions runner beroperasi pada rentang alamat IP publik dinamis yang selalu berubah setiap kali alur kerja dieksekusi. Membatasi akses SSH ke IP tertentu akan menyebabkan koneksi CI/CD ditolak (*connection refused / timed out*). Otentikasi telah diamankan sepenuhnya menggunakan pasangan kunci SSH (*SSH key pair*).

### Langkah 1.2: Pembuatan Pasangan Kunci SSH (SSH Key Pair)
Otentikasi deployment wajib menggunakan kunci SSH berbasis kriptografi modern (disarankan `ed25519` atau `rsa 4096-bit`) tanpa *passphrase* agar dapat dieksekusi secara otomatis oleh GitHub Actions.

Jalankan perintah berikut di terminal lokal:

```bash
# Membuat SSH key pair khusus deployment
ssh-keygen -t ed25519 -C "github-actions-litabmas-deploy" -f ~/.ssh/hostinger_deploy -N ""
```

Perintah di atas menghasilkan dua berkas:
- `~/.ssh/hostinger_deploy` (Kunci Privat / *Private Key*): Disimpan untuk GitHub Secrets.
- `~/.ssh/hostinger_deploy.pub` (Kunci Publik / *Public Key*): Dipasang di server Hostinger.

### Langkah 1.3: Pemasangan Kunci Publik di Server Hostinger
Kunci publik harus ditambahkan ke berkas `~/.ssh/authorized_keys` di Hostinger.

**Cara A: Melalui hPanel (Direkomendasikan)**
1. Pada menu **Akses SSH** di hPanel, gulir ke bagian **Kelola Kunci SSH (Manage SSH Keys)**.
2. Klik tombol **Tambah Kunci SSH (Add SSH Key)**.
3. Masukkan nama kunci (contoh: `github-actions-deploy`).
4. Salin seluruh isi berkas `~/.ssh/hostinger_deploy.pub` dan tempel ke kolom isian.
5. Simpan kunci.

**Cara B: Melalui Terminal Manual**
```bash
# Salin kunci publik ke server Hostinger
ssh-copy-id -i ~/.ssh/hostinger_deploy.pub -p 65002 u123456789@153.92.xxx.xxx
```

### Langkah 1.4: Pengaturan Izin Berkas SSH di Server
Login ke server via SSH untuk memastikan permission berkas SSH aman:

```bash
ssh -p 65002 u123456789@153.92.xxx.xxx -i ~/.ssh/hostinger_deploy
```

Setelah berhasil masuk, verifikasi dan perketat izin folder `.ssh`:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Langkah 1.5: Kompatibilitas Versi PHP 8.2+ di Hostinger & Terminal SSH
Aplikasi sistem penelitian Litabmas telah dikonfigurasikan dengan target platform **PHP 8.2** (`"platform": { "php": "8.2.0" }`), sehingga kompatibel penuh dan dapat berjalan mulus pada **PHP 8.2, PHP 8.3, maupun PHP 8.4**:

1. **Pengaturan PHP Web di hPanel**:
   - Buka **hPanel** -> **Tingkat Lanjut (Advanced)** -> **Konfigurasi PHP (PHP Configuration)**.
   - Pilih domain atau subdomain target (`riset.portalmu.org`).
   - Anda dapat memilih **PHP 8.2**, **PHP 8.3**, atau **PHP 8.4** (disarankan minimal PHP 8.2 atau 8.3).
   - Klik tombol **Perbarui (Update)** untuk menyimpan.
2. **Pengaturan PHP CLI di Terminal Hostinger**:
   - Lingkungan CLI SSH Hostinger secara bawaan menjalankan **PHP 8.2** (`/usr/bin/php`).
   - Karena seluruh dependensi vendor telah distandarisasi untuk mendukung PHP 8.2+, Anda dapat langsung menjalankan perintah `php artisan` secara normal di terminal tanpa perlu konfigurasi alias tambahan.
   - Pipeline GitHub Actions juga secara otomatis mendeteksi binary PHP yang tersedia (`php`, `/usr/bin/php`, atau alt-php) saat menjalankan perintah post-deployment.

> [!NOTE]
> Uji koneksi tanpa sandi dari terminal lokal untuk memastikan otentikasi kunci berhasil sebelum melanjutkan ke konfigurasi GitHub Actions:
> ```bash
> ssh -p 65002 -i ~/.ssh/hostinger_deploy u123456789@153.92.xxx.xxx "echo [SUKSES] Koneksi SSH Hostinger Terverifikasi"
> ```

---

## 3. Bagian 2: Konfigurasi GitHub Repository Secrets

Seluruh parameter koneksi dan jalur deployment dienkripsi secara aman melalui GitHub Secrets. Dilarang keras menuliskan kredensial langsung pada berkas kode maupun repositori publik.

### Tabel Daftar Rahasia (Secrets) Wajib

| Nama Secret GitHub | Tipe Nilai | Contoh Nilai | Deskripsi & Kegunaan |
|---|---|---|---|
| `HOSTINGER_SSH_HOST` | String | `153.92.12.34` atau `access.hostinger.com` | Alamat IP atau hostname server SSH Hostinger |
| `HOSTINGER_SSH_PORT` | Numerik | `65002` | Port SSH Hostinger (default: 65002) |
| `HOSTINGER_SSH_USER` | String | `u123456789` | Username akun SSH Hostinger |
| `HOSTINGER_SSH_KEY` | Multiline String | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Isi lengkap berkas private key `~/.ssh/hostinger_deploy` |
| `HOSTINGER_REMOTE_CORE_PATH` | Path String | `/home/u123456789/litabmas_core/` | Jalur absolut direktori core Laravel di server |
| `HOSTINGER_REMOTE_PUBLIC_PATH` | Path String | `/home/u123456789/public_html/` | Jalur absolut direktori root publik web |
| `APP_URL` | URL String | `https://litabmas.domain-kampus.ac.id` | Alamat kanonikal aplikasi web untuk uji smoke check |

### Prosedur Penambahan Secrets di GitHub:
1. Masuk ke halaman repositori di GitHub.
2. Buka tab **Settings** -> pilih menu samping **Secrets and variables** -> klik **Actions**.
3. Klik tombol **New repository secret**.
4. Masukkan nama rahasia sesuai tabel di atas beserta nilainya secara presisi.
5. Ulangi untuk seluruh 7 rahasia wajib.

> [!WARNING]
> Saat menyalin nilai `HOSTINGER_SSH_KEY`, pastikan menyertakan baris pembuka `-----BEGIN OPENSSH PRIVATE KEY-----` dan baris penutup `-----END OPENSSH PRIVATE KEY-----` tanpa ada spasi atau baris kosong berlebih di awal maupun akhir.

---

## 4. Bagian 3: Struktur Direktori Terisolasi di Hostinger

### 4.1 Hierarki Folder di Server

```text
/home/u123456789/
│
├── litabmas_core/                         <-- Direktori Utama Aplikasi
│   ├── app/                               <-- Logika Bisnis & Model Domain
│   ├── bootstrap/
│   │   ├── app.php
│   │   └── cache/                         <-- Wajib writable (chmod 775)
│   ├── config/
│   ├── database/                          <-- Migrations & Seeders
│   ├── routes/
│   ├── storage/                           <-- Wajib writable (chmod 775)
│   │   ├── app/
│   │   │   └── public/                    <-- Target symlink berkas publik
│   │   ├── framework/
│   │   │   ├── cache/
│   │   │   ├── sessions/
│   │   │   └── views/
│   │   └── logs/
│   ├── vendor/                            <-- Pustaka PHP (di-build di runner)
│   ├── .env                               <-- Berkas konfigurasi utama di server
│   ├── artisan
│   └── composer.json
│
├── litabmas_core_backup/                  <-- Direktori Cadangan Otomatis
│
└── public_html/                           <-- Web Root Publik
    ├── build/                             <-- Berkas bundle Vite (manifest.json, js, css)
    ├── storage -> /home/u123456789/litabmas_core/storage/app/public
    ├── .htaccess                          <-- Konfigurasi rewrite webserver Apache/LiteSpeed
    ├── index.php                          <-- Entrypoint modifikasi
    ├── favicon.ico
    └── robots.txt
```

### 4.2 Persiapan Struktur Direktori Awal (One-Time Setup)

Jalankan perintah berikut di server Hostinger via SSH sebelum deployment perdana:

```bash
# 1. Buat direktori core dan direktori backup
mkdir -p ~/litabmas_core
mkdir -p ~/litabmas_core_backup
mkdir -p ~/litabmas_core/bootstrap/cache
mkdir -p ~/litabmas_core/storage/app/public
mkdir -p ~/litabmas_core/storage/framework/cache
mkdir -p ~/litabmas_core/storage/framework/sessions
mkdir -p ~/litabmas_core/storage/framework/views
mkdir -p ~/litabmas_core/storage/logs

# 2. Atur izin akses direktori runtime
chmod -R 775 ~/litabmas_core/storage ~/litabmas_core/bootstrap/cache

# 3. Bersihkan konten bawaan public_html (jika masih memuat default page Hostinger)
# PERINGATAN: Pastikan Anda berada di direktori yang benar sebelum menghapus
cd ~/public_html
rm -f default.php index.html
```

### 4.3 Pembuatan Symlink Direktori Publik Storage

Pada shared hosting, perintah bawaan `php artisan storage:link` terkadang membuat symlink relatif yang gagal merujuk ke luar `public_html`. Gunakan symlink absolut:

```bash
# Di dalam direktori public_html
cd ~/public_html
ln -sfn /home/u123456789/litabmas_core/storage/app/public storage
```

Verifikasi hasil symlink dengan perintah `ls -la ~/public_html/storage`. Tautan harus mengarah ke direktori target yang valid.

---

## 5. Bagian 4: Setup Basis Data MySQL & Konfigurasi File .env

### Langkah 5.1: Pembuatan Database & Pengguna di hPanel
1. Masuk ke hPanel -> menu **Basis Data (Databases)** -> **Manajemen Database (Database Management)**.
2. Buat database baru:
   - **Nama Database**: Isi suffix (misal: `litabmas`). Nama lengkap menjadi `u123456789_litabmas`.
   - **Username Database**: Isi suffix (misal: `dbuser`). Username lengkap menjadi `u123456789_dbuser`.
   - **Password**: Hasilkan kata sandi kuat yang unik.
3. Klik **Buat (Create)**.
4. Pastikan user memiliki seluruh hak akses (*ALL PRIVILEGES*) pada database tersebut.

### Langkah 5.2: Inisialisasi Berkas .env di Server
Salin templat konfigurasi ke lokasi permanen `~/litabmas_core/.env`:

```bash
# Dari server Hostinger
cd ~/litabmas_core
touch .env
chmod 600 .env
```

Sunting file `.env` menggunakan editor teks server (`nano .env`) dengan nilai konfigurasi produksi berikut:

```ini
APP_NAME="Sistem Informasi Penelitian Terintegrasi"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://litabmas.domain-kampus.ac.id
APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u123456789_litabmas
DB_USERNAME=u123456789_dbuser
DB_PASSWORD=KataSandiDatabaseAndaYangKuat

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=public
QUEUE_CONNECTION=database

CACHE_STORE=file
CACHE_PREFIX=litabmas_cache_

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

# Konfigurasi Mail Server (SMTP Hostinger / Custom)
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=noreply@domain-kampus.ac.id
MAIL_PASSWORD=KataSandiEmailAnda
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="noreply@domain-kampus.ac.id"
MAIL_FROM_NAME="${APP_NAME}"

# Multi-Tenancy Invariant Scope
SUPER_ADMIN_GLOBAL_BYPASS=true
```

### Langkah 5.3: Penyiapan Application Encryption Key (APP_KEY)
Karena berkas aplikasi Laravel (`artisan` dan `vendor/`) baru akan ditransfer ke server saat deployment perdana GitHub Actions berlangsung, `APP_KEY` disiapkan terlebih dahulu dari komputer lokal pengembang:

1. Pada terminal komputer lokal Anda (tempat repositori aktif), jalankan perintah:
   ```bash
   php artisan key:generate --show
   ```
   *Atau jika tidak ada artisan lokal, gunakan perintah PHP berikut:*
   ```bash
   php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
   ```
2. Salin teks key yang dihasilkan (misal: `base64:vX7jK9...`) lalu masukkan ke dalam berkas `~/litabmas_core/.env` di server Hostinger pada baris `APP_KEY`:
   ```ini
   APP_KEY=base64:vX7jK9...
   ```
3. Simpan berkas `.env` (`Ctrl + O`, lalu `Enter`, lalu `Ctrl + X` pada nano).

> [!NOTE]
> **Migrasi Basis Data Otomatis**: Anda **tidak perlu menjalankan `php artisan migrate` secara manual**. Saat deployment perdana GitHub Actions dipicu (Bagian 5), pipeline CI/CD akan mentransfer seluruh berkas aplikasi (`artisan`, `app/`, `vendor/`), kemudian secara otomatis menjalankan `php artisan migrate --force` langsung di server Hostinger.

### Langkah 5.4: Eksekusi Seeder Awal (Opsional - Setelah Deploy Perdana)
Jika Anda membutuhkan data awal (seperti akun awal Super Admin atau master universitas) melalui seeder, jalankan perintah ini via SSH di Hostinger **setelah deployment perdana GitHub Actions selesai**:

```bash
cd ~/litabmas_core

# Jalankan seeder produksi
php artisan db:seed --force
```

---

## 6. Bagian 5: Mekanisme Eksekusi Deployment

Pipeline CI/CD terintegrasi pada GitHub Actions (`.github/workflows/deploy.yml`) mendukung dua jalur pemicu:

### 6.1 Jalur Otomatis (Push Trigger)
- **Branch `development`**: Menjalankan pengujian kualitas (*quality gate*) dan deployment ke lingkungan pementasan (*staging*).
- **Branch `main`**: Menjalankan pengujian kualitas dan deployment langsung ke lingkungan produksi (*production*).

### 6.2 Jalur Manual (Workflow Dispatch)
Pemicuan manual digunakan saat diperlukan deployment ulang tanpa komit baru, atau saat melakukan deployment pada jam operasional tertentu.

1. Buka tab **Actions** di repositori GitHub.
2. Pada daftar alur kerja di sebelah kiri, pilih **Hostinger Shared Hosting Deployment**.
3. Klik tombol menu tarik-turun **Run workflow**.
4. Tentukan parameter:
   - **Branch**: Pilih cabang sumber (`main` atau `development`).
   - **Environment**: Pilih `production` atau `staging`.
   - **Dry Run**: Pilih `false` untuk deployment riil, atau `true` untuk simulasi transfer berkas RSync tanpa perubahan di server.
5. Klik **Run workflow**.

### 6.3 Tahapan Kerja Siklus Pipeline
Siklus deployment yang dieksekusi oleh pipeline GitHub Actions terdiri dari urutan presisi berikut:

```text
[Step 1: Quality Gate]
  ├── Validasi gaya kode: ./vendor/bin/pint --test
  ├── Validasi tipe frontend: npm run types
  ├── Pengujian unit skrip: npx vitest run tests/Unit/Scripts/
  └── Pengujian unit & fitur: ./vendor/bin/pest

[Step 2: Build & Packaging (Runner-Side)]
  ├── Instalasi dependensi npm: npm ci
  ├── Kompilasi bundel aset: npm run build
  ├── Instalasi dependensi komposer: composer install --no-dev --prefer-dist --optimize-autoloader
  └── Modifikasi index.php: node scripts/hostinger-prepare-public.js public_dist "${CORE_DIR:-litabmas_core}"

[Step 3: Transfer RSync over SSH]
  ├── Snapshot pencadangan: rsync ~/litabmas_core/ ke ~/litabmas_core_backup/ (exclude: storage/)
  ├── Sinkronisasi direktori core (exclude: .env, storage, .git)
  └── Sinkronisasi direktori public (exclude: storage symlink)

[Step 4: Post-Deployment Remote Commands]
  ├── php artisan down --render="errors::503"
  ├── php artisan migrate --force
  ├── php artisan storage:link
  ├── php artisan optimize:clear
  ├── php artisan optimize
  ├── php artisan down --render=false || php artisan up
  └── Smoke Check HTTP 200 OK via cURL
```

---

## 7. Bagian 6: Prosedur Pemulihan Bencana & Rollback

Prosedur pemulihan bencana (*disaster recovery*) wajib dijalankan saat terjadi kegagalan fatal pada deployment, seperti galat HTTP 500 menyeluruh, kesalahan migrasi skema database, atau kegagalan inisialisasi aplikasi pasca-transfer.

> [!CAUTION]
> Tetap tenang dan lakukan tindakan secara sistematis. Jangan menghapus direktori `~/litabmas_core` atau `~/public_html` secara membabi-buta karena berkas konfigurasi `.env` dan direktori penyimpanan berkas penelitian `storage/` berada di server tersebut.

### Skenario A: Rollback Berkas Aplikasi (File Rollback)
Gunakan prosedur ini apabila terjadi galat logika kode, kesalahan berkas build aset, atau error runtime PHP setelah sinkronisasi RSync.

*(Catatan: Jika alias `~/.bashrc` belum disetel, gunakan `/opt/alt/php84/usr/bin/php` sebagai pengganti `php`).*

```bash
# 1. Masuk ke server Hostinger via SSH
ssh -p 65002 u123456789@153.92.xxx.xxx -i ~/.ssh/hostinger_deploy

# 2. Aktifkan Maintenance Mode untuk mencegah pengguna mengakses status galat
cd ~/litabmas_core
php artisan down --render="errors::503" --secret="pemulihan-darurat-litabmas-2026"

# 3. Pulihkan berkas core dari snapshot litabmas_core_backup
# Perhatikan tanda slash (/) di akhir path untuk rsync yang tepat
rsync -av --delete \
  --exclude='.env' \
  --exclude='storage/' \
  ~/litabmas_core_backup/ ~/litabmas_core/

# 4. Bersihkan seluruh berkas cache teroptimasi
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 5. Bangun kembali cache konfigurasi dan rute yang valid
php artisan optimize

# 6. Nonaktifkan Maintenance Mode
php artisan up

# 7. Uji akses aplikasi
curl -I -s https://litabmas.domain-kampus.ac.id | head -n 5
```

### Skenario B: Rollback Migrasi Basis Data (Database Rollback)
Gunakan prosedur ini apabila perubahan skema tabel pada migrasi terbaru menyebabkan inkonsistensi data atau kegagalan kueri Eloquent.

#### Opsi B.1: Rollback Menggunakan Artisan
Jika berkas migrasi lama menyediakan metode `down()` yang valid:

```bash
cd ~/litabmas_core

# 1. Periksa status migrasi yang telah berjalan
php artisan migrate:status

# 2. Rollback 1 batch migrasi terakhir
php artisan migrate:rollback --step=1 --force

# 3. Bersihkan cache skema/model
php artisan optimize:clear
php artisan optimize
```

#### Opsi B.2: Pemulihan dari Berkas Cadangan SQL (Backup hPanel)
Jika struktur tabel mengalami kerusakan berat atau data terhapus:

1. Buka hPanel -> **Basis Data** -> **phpMyAdmin** pada database `u123456789_litabmas`.
2. Atau gunakan fitur cadangan otomatis hPanel:
   - Navigasi ke menu **File** -> **Cadangan (Backups)**.
   - Pilih jenis cadangan: **Cadangan Basis Data (Database Backups)**.
   - Pilih database `u123456789_litabmas` dan tentukan tanggal snapshot sebelum insiden terjadi.
   - Klik **Unduh** atau **Pulihkan (Restore)**.

Bila melakukan impor manual melalui SSH:

```bash
# Impor dump file SQL darurat
mysql -u u123456789_dbuser -p u123456789_litabmas < ~/backup_sebelum_deploy.sql
```

### Skenario C: Verifikasi Pasca-Pemulihan (Post-Recovery Checklist)
Setelah tindakan rollback selesai dilaksanakan, pastikan melakukan verifikasi terhadap poin-poin kritis berikut:

1. **HTTP Status Code**: Memastikan respon mengembalikan kode status HTTP `200 OK`.
   ```bash
   curl -I https://litabmas.domain-kampus.ac.id
   ```
2. **Pengecekan Log Galat**: Memastikan tidak ada rekaman error fatal baru pada berkas log:
   ```bash
   tail -n 50 ~/litabmas_core/storage/logs/laravel.log
   ```
3. **Integritas Multi-Tenancy**: Memastikan sesi otentikasi login tetap beroperasi normal dan isolasi data per kampus tetap terjaga.
4. **Symlink Storage**: Memastikan berkas dokumen penelitian (`.pdf`) pada `storage/` tetap dapat diunduh tanpa galat 404.

---

## 8. Bagian 7: Troubleshooting Masalah Umum

### 1. Galat 500: "No application encryption key has been specified"
- **Penyebab**: Variabel `APP_KEY` pada `~/litabmas_core/.env` kosong atau tidak terbaca.
- **Solusi**:
  ```bash
  cd ~/litabmas_core
  php artisan key:generate --force
  php artisan config:clear
  php artisan optimize
  ```

### 2. Galat 403 / 500: "The stream or file .../storage/logs/laravel.log could not be opened in append mode: failed to open stream: Permission denied"
- **Penyebab**: Hak akses izin berkas pada direktori runtime `storage` atau `bootstrap/cache` tidak writable oleh proses webserver.
- **Solusi**:
  ```bash
  chmod -R 775 ~/litabmas_core/storage ~/litabmas_core/bootstrap/cache
  ```

### 3. Galat 404 pada Berkas Unduhan PDF Proposal / Dokumen
- **Penyebab**: Tautan simbolik (*symlink*) `public_html/storage` putus atau mengarah ke path yang tidak valid.
- **Solusi**:
  ```bash
  rm -f ~/public_html/storage
  ln -sfn /home/u123456789/litabmas_core/storage/app/public ~/public_html/storage
  ls -la ~/public_html/storage
  ```

### 4. Galat Koneksi SSH: "Permission denied (publickey)" atau "Connection timed out" saat GitHub Actions Berjalan
- **Penyebab**:
  - Format kunci privat pada secret `HOSTINGER_SSH_KEY` tidak lengkap atau kunci publik belum terdaftar di `~/.ssh/authorized_keys`.
  - Fitur pembatasan IP (*IP whitelisting*) pada menu Akses SSH hPanel dalam kondisi aktif. Karena runner GitHub Actions menggunakan kumpulan IP publik dinamis yang selalu berubah setiap kali dieksekusi, koneksi akan dicegat jika IP dibatasi.
- **Solusi**:
  - Pastikan seluruh string kunci privat dari `-----BEGIN ...` hingga `-----END ...` tersalin sempurna ke GitHub Secret.
  - Periksa izin direktori di server: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`.
  - Nonaktifkan pembatasan IP di menu Akses SSH hPanel agar seluruh rentang IP GitHub Actions runner dapat terhubung dengan otentikasi kunci SSH.

### 5. Galat Hostinger CLI: "Allowed memory size of ... bytes exhausted"
- **Penyebab**: Perintah artisan atau composer melebihi batas memori PHP CLI Hostinger.
- **Solusi**:
  Jalankan perintah dengan parameter bypass memori sementara:
  ```bash
  php -d memory_limit=512M artisan optimize
  ```
  *(Catatan: Proses kompilasi aset frontend dan dependensi backend berat telah dipindahkan seutuhnya ke runner GitHub Actions untuk mencegah kendala ini).*

### 6. Galat Composer platform_check: "Your Composer dependencies require a PHP version '>= 8.4.1'. You are running 8.2.x"
- **Penyebab**:
  - Pustaka Symfony 8.1 terpasang saat composer update dijalankan tanpa pembatasan platform, sehingga membutuhkan PHP `>= 8.4.1`.
  - Lingkungan CLI Hostinger secara bawaan tetap menjalankan PHP 8.2 (`8.2.34`).
- **Solusi**:
  - Konfigurasi `composer.json` telah dikunci dengan target platform:
    ```json
    "config": {
        "platform": {
            "php": "8.2.0"
        }
    }
    ```
  - Seluruh dependensi telah diturunkan ke versi yang mendukung PHP 8.2+ (Symfony 7.4), sehingga berkas `vendor/composer/platform_check.php` kini hanya mensyaratkan `PHP >= 8.2.0` dan berjalan mulus di Hostinger.

### 7. Galat cURL: "(22) The requested URL returned error: 500" saat Smoke Test
- **Penyebab**:
  - Web server (LiteSpeed / PHP-FPM) pada domain atau berkas runtime mengalami galat internal (sebelumnya akibat ketidaksesuaian versi PHP pada `platform_check.php` atau `.env` belum terkonfigurasi).
- **Solusi**:
  - Pastikan dependensi telah kompatibel dengan PHP 8.2+ (telah diselesaikan pada poin 6).
  - Pastikan berkas `.env` telah memiliki `APP_KEY` yang valid.
  - Periksa berkas log server di `storage/logs/laravel.log` via SSH jika respon 500 masih berlanjut:
    ```bash
    tail -n 50 ~/litabmas_core/storage/logs/laravel.log
    ```
