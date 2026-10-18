# Technical Documentation (Architecture, Schema, Design, Rules) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create comprehensive, professional, emoji-free technical documentation files (`architecture.md`, `schema.md`, `design.md`, `rules.md`, and `README.md`) in `docs/technical/` based on `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md` and the approved design spec.

**Architecture:** Modular documentation structure in `docs/technical/` with a centralized navigation hub (`README.md`), complete 21 clean tables data dictionary, Mermaid ERD, Hybrid Scholarly Enterprise UI/UX system specification with design system preview requirements, and 11 edge cases defensive governance.

**Tech Stack:** Markdown, Mermaid.js diagrams, GitHub-Flavored Markdown, Laravel 12 / React 19 / Inertia.js 2.0 / Tailwind CSS 4 architecture references.

**Spec:** `docs/superpowers/specs/2026-10-15-technical-docs-architecture-schema-design-rules.md`

## Global Constraints
- Target directory: All documentation files must be created in `docs/technical/`.
- Strict Emoji Prohibition: Zero emojis in prose, headings, badges, code snippets, or diagrams across all documents.
- Language: Written in formal, professional Bahasa Indonesia.
- Database Alignment: All 21 clean tables and column definitions must align 100% with Bab 6.2 PRD and active database migrations.
- Design System: Must strictly define "Hybrid Scholarly Enterprise" (Cool Slate palette & elevation + Scholarly dual typography with Serif for research titles/abstracts and Sans for UI/forms, plus the mandatory design system preview gate).
- Edge Cases: Must document all 11 critical edge case scenarios from Bab 9 PRD.

---

### Task 1: Directory Scaffolding & Navigation Hub (`docs/technical/README.md`)

**Files:**
- Create: `docs/technical/README.md`
- Modify: `docs/INDEX.md`

**Interfaces:**
- Consumes: `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`
- Produces: `docs/technical/README.md` as the entry point and table of contents for all technical docs.

- [ ] **Step 1: Create `docs/technical/README.md`**
Write `docs/technical/README.md` with:
- System metadata (Versi 2.0.0-STANDALONE, status disetujui).
- Ikhtisar sistem mandiri multi-institusi (*Multi-Institution SIM-Penelitian*).
- Matriks tabel navigasi cepat ke 4 dokumen inti (`architecture.md`, `schema.md`, `design.md`, `rules.md`).
- Tautan kembali ke PRD utama (`docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`).
- Panduan pemeliharaan dokumentasi bagi tim pengembang (bebas emoji).

- [ ] **Step 2: Update `docs/INDEX.md`**
Tambahkan entri untuk `docs/technical/` pada `docs/INDEX.md` di bawah bagian navigasi dokumentasi agar memudahkan penelusuran dari root docs.

- [ ] **Step 3: Verifikasi keberadaan berkas**
Jalankan verifikasi:
```powershell
Test-Path docs/technical/README.md
```
Expected: `True`

- [ ] **Step 4: Commit**
```bash
git add docs/technical/README.md docs/INDEX.md
git commit -m "docs(technical): setup technical docs hub and update docs index"
```

---

### Task 2: Implementasi Cetak Biru Arsitektur (`docs/technical/architecture.md`)

**Files:**
- Create: `docs/technical/architecture.md`

**Interfaces:**
- Consumes: PRD Bab 1, 2, 3, 4, 7, dan Bab 8.
- Produces: Panduan arsitektur sistem, tenancy isolation, stack teknologi, RBAC, dan diagram alur siklus hidup penelitian.

- [ ] **Step 1: Tulis isi lengkap `docs/technical/architecture.md`**
Memuat 6 bab komprehensif tanpa placeholder:
1. Informasi Sistem & Dekopling Mandiri (Visi standalone, dekopling dari OJS dan JurnalMu, fokus 6 fase riset LPPM).
2. Spesifikasi Stack Teknologi & Infrastruktur (Laravel 12 PHP 8.4 via Docker / PHP 8.2+ native, React 19, TypeScript, Inertia.js 2.0, Tailwind CSS 4, MySQL 8.0, Vite 6, streaming file storage `/storage/{path}`).
3. Model Multi-Institusi / Multi-Tenancy Architecture (*Shared Database, Separate Tenancy* berbasis `universities`, kolom `university_id` pada seluruh entitas riset, Eloquent `TenantScope` otomatis, pengecualian Super Admin).
4. Arsitektur Otorisasi & Hierarki Peran (5 Peran: Super Admin, Admin Kampus, Admin Keuangan, Reviewer, Peneliti; kompatibilitas `role_id` dan pivot `role_user`; Dual-Layer Authorization Guard: Route middleware + Controller Policy).
5. Diagram Alur Siklus Hidup Penelitian (Diagram Mermaid Flowchart memetakan interaksi 6 fase riset: Pengajuan Proposal -> Review Rubrik -> Kontrak & Termin 1 -> Monev & Termin 2 -> Verifikasi Luaran -> SKTS & Penguncian).
6. Mekanisme Audit Trail & Observabilitas (`activity_logs` logging terpusat, notifikasi transaksional `notifications`).

- [ ] **Step 2: Verifikasi sintaks Mermaid dan larangan emoji**
Periksa bahwa blok Mermaid valid dan tidak ada karakter emoji:
```powershell
Get-Content docs/technical/architecture.md | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```
Expected: Tidak ada output (bebas emoji).

- [ ] **Step 3: Commit**
```bash
git add docs/technical/architecture.md
git commit -m "docs(technical): add comprehensive system architecture blueprint"
```

---

### Task 3: Implementasi Kamus Data & Skema Basis Data (`docs/technical/schema.md`)

**Files:**
- Create: `docs/technical/schema.md`

**Interfaces:**
- Consumes: PRD Bab 6.1 (ERD) dan Bab 6.2 (21 Tabel Bersih), serta berkas migrasi aktif di `database/migrations/`.
- Produces: Rujukan mutlak kamus data, diagram relasi entitas komprehensif, batasan kunci asing, dan strategi pengindeksan.

- [ ] **Step 1: Tulis isi lengkap `docs/technical/schema.md`**
Memuat 5 bab komprehensif tanpa placeholder:
1. Ikhtisar Basis Data Bersih 21 Tabel (Status pembersihan total dari tabel legacy OJS/JurnalMu, konvensi penamaan, tipe data standar `BIGINT UNSIGNED`, `DECIMAL(15,2)`, `DATE`, `JSON`).
2. Diagram Relasi Entitas Komprehensif (Diagram Mermaid ERD yang menghubungkan seluruh 21 tabel: relasi tenancy `universities`, relasi multi-peran `users` dan `roles`, relasi 6 fase penelitian dari `research_schemas` hingga `evaluations`, serta relasi 1:1 tabel anak luaran `journal_outputs`, `book_outputs`, `hki_outputs`, `product_outputs`).
3. Kamus Data Rinci 21 Tabel (Tabel spesifikasi kolom: Nama Kolom, Tipe Data, Nullable, Default, Constraint & Deskripsi) dikelompokkan dalam 7 klaster:
   - Klaster 1: `universities`, `roles`, `users`, `role_user`, `activity_logs`, `notifications`.
   - Klaster 2: `research_schemas`, `proposals`, `proposal_documents`.
   - Klaster 3: `assessment_criteria`, `reviews`.
   - Klaster 4: `contracts`, `fundings`.
   - Klaster 5: `monev_schedules`, `progress_reports`.
   - Klaster 6: `research_outputs`, `journal_outputs`, `book_outputs`, `hki_outputs`, `product_outputs`.
   - Klaster 7: `evaluations`.
4. Strategi Kunci Asing, Batasan Integritas, & Indeks (Aturan `CASCADE`, `RESTRICT`, `SET NULL`; batasan keunikan nomor kontrak, kode universitas, email, dan nomor SKTS; komposit indeks performa tenant `(university_id, status_proposal)` dan `(id_proposal, status_laporan)`).
5. Pemetaan Model Eloquent & Accessors (21 kelas model di `app/Models/`, casts JSON/tanggal, format rupiah).

- [ ] **Step 2: Verifikasi kecocokan 21 tabel dan larangan emoji**
Verifikasi bahwa seluruh 21 tabel tercantum dan bebas emoji:
```powershell
Get-Content docs/technical/schema.md | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```
Expected: Tidak ada output (bebas emoji).

- [ ] **Step 3: Commit**
```bash
git add docs/technical/schema.md
git commit -m "docs(technical): add clean 21-table database schema and ERD specification"
```

---

### Task 4: Implementasi Sistem Desain UI/UX Hibrida (`docs/technical/design.md`)

**Files:**
- Create: `docs/technical/design.md`

**Interfaces:**
- Consumes: Intelijensi desain `ui-ux-pro-max`, filosofi anti-slop `design-taste-frontend`, dan keputusan sistem desain "Hybrid Scholarly Enterprise".
- Produces: Pedoman UI/UX, spesifikasi token desain, arsitektur tata letak, pratinjau komponen pakai-ulang, dan cetak biru halaman per modul.

- [ ] **Step 1: Tulis isi lengkap `docs/technical/design.md`**
Memuat bab-bab komprehensif tanpa placeholder:
1. Filosofi Desain "Hybrid Scholarly Enterprise" & Anti-Slop Standard (Menghindari template generik AI, mengedepankan identitas wibawa akademik, presisi data, dan pembuktian karya riset).
2. Spesifikasi Token Desain & Palet Warna (Cool Slate: Slate 50 canvas, Pure White card, Deep Academic Navy `#1E3A8A` primary, Emerald Green `#059669` accent, Slate 200 border, Slate 900 text; kontras WCAG AAA 12:1; sudut `rounded-lg`; bayangan mikro `shadow-xs`/`shadow-sm`).
3. Disiplin Tipografi Hibrida (Dual-Personality: `font-serif` Newsreader/Merriweather untuk Judul Riset, Skema, Abstrak, dan SKTS; `font-sans` Plus Jakarta Sans/Inter untuk antarmuka formulir, tombol, tabel, dan sidebar; `font-mono tabular-nums` untuk angka uang dan skor).
4. Disiplin Aset Visual & Larangan Emoji Mutlak (Ikon vektor SVG Lucide React 1.5-2.0px stroke, lencana teks terstruktur `[STATUS]` + mikro-ikon).
5. **Persyaratan Wajib: Pratinjau Sistem Desain & Komponen Pakai-Ulang (Design System Preview Gate)** (Spesifikasi bahwa sebelum membangun halaman modul, pengembang wajib membangun pratinjau komponen atom/molekul: `StatusBadge`, `PDFUploader`, `TabularFigure`, `MetricCard`, `PageHeader`, `SplitScreenViewer`).
6. Cetak Biru Komposisi Halaman Modul (Bento-grid Dasbor Peneliti, Linear Wizard Usulan Riset Modul 1, Workspace Split-Screen Reviewer Modul 2, Timeline Finansial & Indikator Kunci Monev Modul 3, Matriks Verifikasi Luaran & Banner SKTS Modul 5 & 6).
7. Pola Formulir & Interaktivitas Inertia `useForm` (Submit terkunci otomatis saat `processing`, dirty state confirmation dialog, inline validation on blur, auto-focus first error field).
8. Spesifikasi State Visual & Feedback (Tabel pemetaan warna dan ikon status badge, empty states deskriptif dengan CTA, skeleton loader bertema).

- [ ] **Step 2: Verifikasi larangan emoji dan kepatuhan panduan**
Pastikan berkas bebas emoji:
```powershell
Get-Content docs/technical/design.md | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```
Expected: Tidak ada output.

- [ ] **Step 3: Commit**
```bash
git add docs/technical/design.md
git commit -m "docs(technical): add Hybrid Scholarly Enterprise design system specification"
```

---

### Task 5: Implementasi Aturan Bisnis, Kasus Batas, & Keamanan (`docs/technical/rules.md`)

**Files:**
- Create: `docs/technical/rules.md`

**Interfaces:**
- Consumes: PRD Bab 5 (Aturan Bisnis 6 Modul), Bab 9 (11 Kasus Batas), Bab 10 (Kriteria Penerimaan & QA).
- Produces: Acuan mutlak tata kelola hibah riset, penanganan defensif kasus batas, invarian keamanan, dan standar mutu koding.

- [ ] **Step 1: Tulis isi lengkap `docs/technical/rules.md`**
Memuat 4 bab komprehensif tanpa placeholder:
1. Aturan Bisnis Inti 6 Fase Siklus Hidup Riset:
   - Fase 1: Isolasi skema per tenant, keunikan judul proposal per tahun anggaran, penguncian data usulan berstatus `Submitted`, pembatalan otomatis saat melewati deadline skema.
   - Fase 2: Penugasan 1-2 reviewer, *Conflict of Interest (CoI) Guard* (`id_reviewer != id_pengusul`), akumulasi rubrik standar 0-100, opsi putusan rekomendasi.
   - Fase 3: Prasyarat kontrak hibah `Lolos_Didanai`, pembagian termin dana tepat 100% (70% vs 30%), *Monev Gatekeeper Lock* (blokir Termin 2 sebelum Monev Approved), bukti transfer bank wajib sebelum `Disbursed`.
   - Fase 4: Jadwal Monev aktif, format berkas PDF maks 10MB, persentase capaian riil 1%-100%.
   - Fase 5: Minimal 1 luaran `Wajib`, verifikasi berkas oleh LPPM sebelum status `Verified`, pencegahan klaim luaran ganda berbasis keunikan nomor registrasi (DOI/ISBN/HKI).
   - Fase 6: Prasyarat evaluasi akhir (laporan akhir 100% dan seluruh luaran wajib terverifikasi), status kelulusan (`Lulus_Memuaskan`, `Lulus_Cukup`, `Tidak_Lulus`), *SKTS Read-Only Archive Lock* (penguncian permanen proposal & kontrak).
2. Penanganan Defensif 11 Kasus Batas Kritis (Bab 9 PRD):
   - Kasus 1: Manipulasi Akses Lintas Kampus (IDOR via URL).
   - Kasus 2: Konflik Kepentingan Reviewer.
   - Kasus 3: Universitas Dinonaktifkan (Tenant Suspension).
   - Kasus 4: Batas Waktu Skema Berakhir Saat Mengisi Form (Deadline Race Condition).
   - Kasus 5: Kirim Ganda Akibat Jaringan Lemah (Double Submission / Idempotency).
   - Kasus 6: Reviewer Mangkir / Terlambat (Ghosting Reviewer).
   - Kasus 7: Perbedaan Skor Ekstrem Antar Dua Reviewer (selisih > 30 poin, tie-breaker).
   - Kasus 8: Penyesuaian Anggaran Pasca-Review (Budget Cut).
   - Kasus 9: Permintaan Pencairan Termin 2 Tanpa Kelulusan Monev.
   - Kasus 10: Klaim Luaran Ganda (Duplicate Output Claim).
   - Kasus 11: Penelitian Gagal / Force Majeure.
3. Invarian Keamanan & Validasi Sistem (Dual-Layer Authorization Guard: Route middleware + Controller Policy, ekstensi berkas wajib `.pdf` maks 10MB, sanitasi path traversal, proteksi CSRF).
4. Standar Koding & Jaminan Kualitas (FormRequest terpisah di `app/Http/Requests/`, strict typing & Eloquent accessors, PHPUnit Feature Tests mencakup skenario positif dan negatif, pemformatan Pint & Prettier, larangan emoji mutlak).

- [ ] **Step 2: Verifikasi larangan emoji dan 11 kasus batas**
Pastikan berkas bebas emoji dan memuat 11 kasus batas:
```powershell
Get-Content docs/technical/rules.md | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```
Expected: Tidak ada output.

- [ ] **Step 3: Commit**
```bash
git add docs/technical/rules.md
git commit -m "docs(technical): add business rules, edge cases handling, and security invariants"
```

---

### Task 6: Verifikasi Akhir Integritas Tautan & Dokumen

**Files:**
- Verify: `docs/technical/README.md`, `architecture.md`, `schema.md`, `design.md`, `rules.md`
- Verify: `docs/INDEX.md`

**Interfaces:**
- Consumes: Seluruh berkas dokumentasi yang telah dibuat pada Task 1 hingga Task 5.
- Produces: Jaminan kualitas dokumentasi, konsistensi tautan rujukan silang (*cross-reference links*), dan repositori dalam status bersih.

- [ ] **Step 1: Verifikasi keberadaan dan integritas seluruh berkas teknis**
Jalankan verifikasi di PowerShell:
```powershell
$files = @(
    "docs/technical/README.md",
    "docs/technical/architecture.md",
    "docs/technical/schema.md",
    "docs/technical/design.md",
    "docs/technical/rules.md"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "[OK] $file exists"
    } else {
        Write-Error "[MISSING] $file does not exist"
    }
}
```
Expected: Seluruh 5 berkas berstatus `[OK]`.

- [ ] **Step 2: Pindai seluruh direktori `docs/technical/` terhadap emoji**
Jalankan pemindaian emoji di PowerShell:
```powershell
Get-ChildItem -Path docs/technical/*.md | ForEach-Object {
    $matches = Select-String -Path $_.FullName -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
    if ($matches) {
        Write-Warning "Emoji found in $($_.Name): $($matches.Line)"
    } else {
        Write-Host "[PASSED] $($_.Name) is clean (no emoji)"
    }
}
```
Expected: Seluruh berkas berstatus `[PASSED] is clean (no emoji)`.

- [ ] **Step 3: Verifikasi status git dan komit final jika ada penyesuaian**
```bash
git status
```
Expected: Working tree clean.
