# Hostinger Shared Hosting CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun pipeline CI/CD GitHub Actions terotomasi dan aman untuk menguji, mem-build aset, dan men-deploy aplikasi Laravel 12 + React ke Hostinger Shared Hosting via SSH/RSync dengan pemisahan direktori core dan public_html.

**Architecture:** CI/CD pipeline menggunakan GitHub Actions dengan runner-side build (Node 22 + PHP 8.4) untuk menghasilkan vendor dan bundle Vite teroptimasi tanpa membebani resource shared hosting. Berkas dideploy menggunakan rsync over SSH (port 65002) ke struktur terisolasi (~/litabmas_core dan ~/public_html), dilanjutkan dengan automasi artisan (migrate, optimize, storage symlink) via remote SSH script.

**Tech Stack:** GitHub Actions, Ubuntu Runner, PHP 8.4, Composer v2, Node.js 22, Vite, SSH/RSync, Vitest, Pest PHP.

**Spec:** Desain Pendekatan 1 (Runner-Build dengan RSync over SSH Terpisah) yang disetujui pada diskusi arsitektur.

## Global Constraints

- Larangan simbol emoji mutlak pada seluruh berkas kode, workflow, skrip, dan dokumentasi (Strict Zero Emoji Invariant).
- Zero plaintext credentials: semua kredensial rahasia wajib bersumber dari GitHub Secrets.
- Multi-tenancy isolation dan integritas Laravel 12 tetap terjaga.
- Seluruh file public sensitif (.env, vendor, storage, .git) tidak boleh terpapar langsung di public_html.

---

### Task 1: Script Pembuat Paket Berkas Public untuk Hostinger

**Files:**
- Create: `scripts/hostinger-prepare-public.js`
- Test: `tests/Unit/Scripts/HostingerPreparePublicTest.test.js`

**Interfaces:**
- Consumes: `indexPhpContent` (string), `coreDirName` (string)
- Produces: `generateHostingerIndexPhp(content: string, coreDirName: string): string`

- [ ] **Step 1: Write the failing test**

Buat berkas pengujian Vitest `tests/Unit/Scripts/HostingerPreparePublicTest.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { generateHostingerIndexPhp } from '../../../scripts/hostinger-prepare-public.js';

describe('Hostinger Prepare Public Script', () => {
    it('mengubah path bootstrap dan maintenance pada index.php mengarah ke direktori core terisolasi', () => {
        const originalContent = `<?php

use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
`;

        const coreDir = 'litabmas_core';
        const modified = generateHostingerIndexPhp(originalContent, coreDir);

        expect(modified).toContain("__DIR__.'/../litabmas_core/storage/framework/maintenance.php'");
        expect(modified).toContain("__DIR__.'/../litabmas_core/vendor/autoload.php'");
        expect(modified).toContain("__DIR__.'/../litabmas_core/bootstrap/app.php'");
    });

    it('mendukung custom folder name untuk core direktori', () => {
        const originalContent = "require __DIR__.'/../vendor/autoload.php';";
        const modified = generateHostingerIndexPhp(originalContent, 'custom_app_dir');
        expect(modified).toBe("require __DIR__.'/../custom_app_dir/vendor/autoload.php';");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Jalankan perintah: `npx vitest run tests/Unit/Scripts/HostingerPreparePublicTest.test.js`
Ekspektasi: Gagal karena modul `scripts/hostinger-prepare-public.js` belum ada.

- [ ] **Step 3: Implement minimal code**

Buat berkas `scripts/hostinger-prepare-public.js`:

```javascript
import fs from 'node:fs';
import path from 'node:path';

export function generateHostingerIndexPhp(content, coreDirName = 'litabmas_core') {
    const cleanCoreDir = coreDirName.replace(/^[\/\\]+|[\/\\]+$/g, '');
    return content
        .replace(/__DIR__\s*\.\s*'\/\.\.\/storage\//g, `__DIR__.'/../${cleanCoreDir}/storage/`)
        .replace(/__DIR__\s*\.\s*'\/\.\.\/vendor\//g, `__DIR__.'/../${cleanCoreDir}/vendor/`)
        .replace(/__DIR__\s*\.\s*'\/\.\.\/bootstrap\//g, `__DIR__.'/../${cleanCoreDir}/bootstrap/`);
}

function runCli() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || 'public_dist';
    const coreDir = args[1] || 'litabmas_core';

    const indexPhpPath = path.resolve(targetDir, 'index.php');
    if (!fs.existsSync(indexPhpPath)) {
        return;
    }

    const content = fs.readFileSync(indexPhpPath, 'utf8');
    const updated = generateHostingerIndexPhp(content, coreDir);
    fs.writeFileSync(indexPhpPath, updated, 'utf8');
}

if (process.argv[1] && process.argv[1].endsWith('hostinger-prepare-public.js')) {
    runCli();
}
```

- [ ] **Step 4: Run test to verify it passes**

Jalankan perintah: `npx vitest run tests/Unit/Scripts/HostingerPreparePublicTest.test.js`
Ekspektasi: Lulus 100% (PASS).

- [ ] **Step 5: Commit**

```bash
git add scripts/hostinger-prepare-public.js tests/Unit/Scripts/HostingerPreparePublicTest.test.js
git commit -m "feat(ci-cd): add hostinger public preparation script and unit tests"
```

---

### Task 2: Panduan Operasional Hostinger Setup & Rollback

**Files:**
- Create: `docs/deployment/HOSTINGER_SETUP.md`

**Interfaces:**
- Consumes: Spesifikasi port SSH, directory layout, dan environment secrets
- Produces: Dokumentasi komprehensif setup hPanel, GitHub Secrets, database, dan rollback darurat

- [ ] **Step 1: Write documentation file**

Tulis berkas `docs/deployment/HOSTINGER_SETUP.md` yang mencakup:
1. Prasyarat Hostinger (Aktivasi SSH di hPanel, Port 65002, IP Whitelist bila ada).
2. Konfigurasi GitHub Secrets yang dibutuhkan (`HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_REMOTE_CORE_PATH`, `HOSTINGER_REMOTE_PUBLIC_PATH`, `APP_URL`).
3. Setup basis data MySQL di hPanel dan file `.env` di server `~/litabmas_core/.env`.
4. Mekanisme deployment otomatis (push ke `development` / `main`) dan manual via `workflow_dispatch`.
5. Prosedur darurat rollback (reverting core backup, database rollback).

- [ ] **Step 2: Verify documentation integrity and zero emoji**

Periksa isi berkas untuk memastikan tidak ada simbol emoji dan format markdown valid.

- [ ] **Step 3: Commit**

```bash
git add docs/deployment/HOSTINGER_SETUP.md
git commit -m "docs(deployment): add comprehensive Hostinger setup and disaster recovery guide"
```

---

### Task 3: Pembuatan GitHub Actions Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Trigger push ke `development` dan `main`, trigger manual `workflow_dispatch`
- Produces: Workflow pipeline terintegrasi: Quality Gate -> Build Artifacts -> Deploy via RSync -> Execute Post-Deploy Commands

- [ ] **Step 1: Write deploy.yml workflow**

Buat berkas `.github/workflows/deploy.yml` dengan konfigurasi:
1. Event trigger: `push` on `development`, `push` on `main`, dan `workflow_dispatch` dengan input environment (`staging` / `production`) serta flag `dry_run`.
2. Job `quality-gate`:
   - Setup PHP 8.4 & Node 22.
   - Run Laravel Pint (`./vendor/bin/pint --test`).
   - Run TypeScript typecheck (`npm run types`).
   - Run Pest tests (`./vendor/bin/pest`).
3. Job `build-and-deploy`:
   - Runs on: `ubuntu-latest`.
   - Depends on: `quality-gate`.
   - Setup Node 22 & Build frontend (`npm ci && npm run build`).
   - Setup PHP 8.4 & Build production backend (`composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction`).
   - Prepare public payload using `scripts/hostinger-prepare-public.js`.
   - Setup SSH agent menggunakan `webfactory/ssh-agent@v0.9.0` dengan secret `HOSTINGER_SSH_KEY`.
   - RSync core ke `${HOSTINGER_REMOTE_CORE_PATH}` dengan exclude list lengkap.
   - RSync public ke `${HOSTINGER_REMOTE_PUBLIC_PATH}`.
   - Execute remote SSH commands via `appleboy/ssh-action` (maintenance mode, migrate force, storage link, optimize cache, maintenance up, smoke check).

- [ ] **Step 2: Validate YAML syntax and lint**

Jalankan verifikasi sintaks YAML atau uji parse script untuk memastikan tidak ada kesalahan indentasi atau variabel hilang.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): add automated CI/CD pipeline for Hostinger shared hosting"
```

---

### Task 4: Verifikasi Menyeluruh & Testing Pipeline

**Files:**
- Test: Seluruh unit test scripts dan pest tests lokal.

- [ ] **Step 1: Run local test suite**

Jalankan `npm test` dan `npm run types` untuk memastikan seluruh script dan tiping valid.

- [ ] **Step 2: Verify git status and clean working tree**

Pastikan seluruh berkas terdaftar dan branch development siap di-push ke remote repository.
