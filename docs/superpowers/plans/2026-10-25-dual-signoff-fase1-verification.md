# Dual Sign-Off Gatekeeper Fase 1 (Verifikasi Administrasi & Audit RAB) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan gerbang persetujuan ganda (*Dual Sign-Off Gatekeeper*) pada Fase 1 Seleksi E-Jarlit Bappeda, di mana usulan berstatus `Approved_Kampus` wajib disetujui oleh **Super Admin** (Verifikasi Berkas Administrasi) DAN **Admin Keuangan** (Audit Kepatuhan RAB terhadap Standar Biaya Masukan) sebelum bertransisi menjadi `Lolos_Administrasi` untuk membuka penugasan Reviewer Ahli.

**Architecture:** Menambahkan kolom penanda persetujuan independen (`is_administrasi_approved`, `is_rab_approved`, `catatan_keuangan`, timestamp) pada tabel `proposals` melalui migrasi inkremental. Menambahkan endpoint audit RAB bagi `Admin Keuangan` (`POST /finance/proposals/{proposal}/verify-rab`), antarmuka verifikasi RAB bagi Admin Keuangan, dan sinkronisasi status transisi otomatis: hanya jika kedua pihak menyetujui, status usulan berubah menjadi `Lolos_Administrasi`. Jika salah satu menolak, status berubah menjadi `Ditolak_Administrasi`.

**Tech Stack:** Laravel 11, Eloquent ORM, MySQL 8, Inertia.js, React 18, TypeScript, Tailwind CSS v4, shadcn/ui.

**Spec:** [docs/plans/2026-10-23-revisi-rapat-ejarlit-plan.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/plans/2026-10-23-revisi-rapat-ejarlit-plan.md) (Bagian D: Restrukturisasi Dua Fase Seleksi, baris 106-122).

## Global Constraints

- **Strict Zero Emoji Invariant**: Seluruh kode sumber, komponen antarmuka, pesan notifikasi, commit git, dan laporan review wajib bebas 100% dari simbol emoji.
- **21 Clean Tables Invariant**: Tidak boleh membuat tabel baru di luar 21 tabel domain bersih; perubahan dilakukan via penambahan kolom inkremental pada tabel `proposals`.
- **Zero Hardcoded Static Text**: Seluruh salinan teks antarmuka (*copy*) wajib didaftarkan pada kamus bahasa `resources/js/lang/en.ts` dan `resources/js/lang/id.ts` dengan key parity 100%.
- **Hybrid Scholarly Enterprise**: Menggunakan palet Cool Slate, Tabular Mono untuk angka mata uang dan nilai, serta komponen shadcn/ui terstandarisasi.

---

### Task 1: Migrasi Basis Data & Model Eloquent Proposal Dual Sign-Off

**Files:**
- Create: `database/migrations/2026_10_25_000002_add_dual_signoff_columns_to_proposals_table.php`
- Modify: `app/Models/Proposal.php`
- Test: `tests/Feature/DualSignoffProposalVerificationTest.php`

**Interfaces:**
- Consumes: Tabel `proposals` yang ada.
- Produces: Kolom `is_administrasi_approved` (boolean nullable), `is_rab_approved` (boolean nullable), `catatan_keuangan` (text nullable), `rekomendasi_anggaran` (decimal nullable), `tanggal_verifikasi_administrasi` (timestamp nullable), `tanggal_verifikasi_rab` (timestamp nullable).
- Helper methods pada model Proposal:
  * `isAdministrasiApproved(): bool`
  * `isRabApproved(): bool`
  * `isDualApproved(): bool`
  * `evaluateDualSignoffStatus(): string`

- [x] **Step 1: Tulis tes gagal untuk evaluasi status dual sign-off proposal**
- [x] **Step 2: Buat migrasi inkremental kolom dual sign-off pada tabel proposals**
- [x] **Step 3: Jalankan migrasi basis data pada runtime MySQL dan environment pengujian**
- [x] **Step 4: Tambahkan atribut fillable, casts, dan helper methods pada App\Models\Proposal**
- [x] **Step 5: Jalankan pengujian unit/feature hingga lolos**
- [x] **Step 6: Commit perubahan dengan pesan: `feat(database): add dual sign-off columns and evaluation helpers to proposals table`**

---

### Task 2: Backend Controller & Policy Penyelarasan Verifikasi Administrasi & RAB

**Files:**
- Modify: `app/Http/Controllers/Admin/ProposalController.php:284-330`
- Create: `app/Http/Controllers/Finance/FinanceProposalController.php`
- Modify: `app/Policies/ProposalPolicy.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/DualSignoffProposalVerificationTest.php`

**Interfaces:**
- Consumes: `App\Models\Proposal`, `App\Models\AssessmentCriteria`.
- Produces:
  * `POST /admin/proposals/{proposal}/verify-administration`: Super Admin memvalidasi checklist administrasi. Menandai `is_administrasi_approved = true/false`. Jika `is_rab_approved === true`, status menjadi `Lolos_Administrasi`. Jika belum, status tetap `Approved_Kampus` dengan flag sukses administrasi.
  * `GET /finance/proposals`: Daftar usulan `Approved_Kampus` untuk antrean audit RAB Admin Keuangan.
  * `POST /finance/proposals/{proposal}/verify-rab`: Admin Keuangan memvalidasi RAB. Menandai `is_rab_approved = true/false`, `catatan_keuangan`, dan `rekomendasi_anggaran`. Jika `is_administrasi_approved === true`, status menjadi `Lolos_Administrasi`.
  * Kebijakan otorisasi: Role `Admin Keuangan` berhak melakukan audit RAB usulan; Super Admin memiliki hak bypass.

- [x] **Step 1: Tulis tes fitur untuk verifikasi administrasi dan audit RAB bertingkat**
- [x] **Step 2: Perbarui method verifyAdministration pada ProposalController agar memeriksa kelengkapan persetujuan ganda**
- [x] **Step 3: Buat FinanceProposalController dengan method index, show, dan verifyRab**
- [x] **Step 4: Daftarkan rute finance/proposals pada routes/web.php di bawah middleware role Admin Keuangan**
- [x] **Step 5: Perbarui ProposalPolicy untuk mengizinkan otorisasi verifyRab bagi Admin Keuangan**
- [x] **Step 6: Jalankan pengujian otomatis hingga seluruh asersi lolos**
- [x] **Step 7: Commit perubahan dengan pesan: `feat(finance): implement dual sign-off verification controllers and routes for rab audit`**

---

### Task 3: Komponen Antarmuka Audit RAB & Navigasi Admin Keuangan

**Files:**
- Create: `resources/js/components/RabVerificationModal.tsx`
- Create: `resources/js/pages/Finance/Proposal/Index.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`

**Interfaces:**
- Consumes: Props proposal list, endpoint `finance.proposals.verify-rab`.
- Produces: Halaman antrean audit RAB Admin Keuangan (`/finance/proposals`), modal interaktif telaah RAB sesuai standar SBM Kota Yogyakarta, dan pendaftaran menu sidebar.

- [x] **Step 1: Daftarkan kunci kamus bahasa internasionalisasi pada en.ts dan id.ts**
- [x] **Step 2: Buat komponen RabVerificationModal berbasis shadcn/ui dan UI/UX Pro Max**
- [x] **Step 3: Buat halaman antarmuka Finance/Proposal/Index.tsx untuk antrean audit RAB usulan**
- [x] **Step 4: Tambahkan item menu "Verifikasi RAB Usulan" pada sidebar Admin Keuangan di app-sidebar.tsx**
- [x] **Step 5: Verifikasi kompilasi TypeScript (npx tsc --noEmit)**
- [x] **Step 6: Commit perubahan dengan pesan: `feat(ui-finance): build rab verification modal and proposals audit queue for finance admin`**

---

### Task 4: Kartu Status Progress Dual Sign-Off pada Detail Proposal Super Admin

**Files:**
- Modify: `resources/js/pages/Admin/Proposal/Show.tsx`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`

**Interfaces:**
- Consumes: Atribut proposal (`is_administrasi_approved`, `is_rab_approved`, `catatan_administrasi`, `catatan_keuangan`).
- Produces: Komponen kartu ringkasan progres verifikasi Fase 1 bertingkat (Status Checklist Administrasi + Status Audit RAB Keuangan) di halaman detail proposal.

- [x] **Step 1: Tambahkan kunci status progres dual sign-off pada kamus bahasa en.ts dan id.ts**
- [x] **Step 2: Tampilkan DualVerificationProgressCard pada Show.tsx yang memperlihatkan status verifikasi dari kedua pihak**
- [x] **Step 3: Pastikan tombol "Tunjuk Reviewer" hanya aktif jika isDualApproved bernilai true**
- [x] **Step 4: Jalankan kompilasi TypeScript dan build Vite**
- [x] **Step 5: Commit perubahan dengan pesan: `feat(ui-admin): display dual sign-off progress card on proposal show view`**

---

### Task 5: Pengujian Menyeluruh (End-to-End Suite) & Verifikasi Kualitas

**Files:**
- Test: `tests/Feature/DualSignoffProposalVerificationTest.php`
- Test: `tests/Feature/RoleAndProposalWorkflowTest.php`

- [x] **Step 1: Jalankan seluruh pengujian unit dan fitur proposal**
- [x] **Step 2: Jalankan pengujian tipe data TypeScript (npx tsc --noEmit)**
- [x] **Step 3: Jalankan kompilasi produksi Vite (npm run build)**
- [x] **Step 4: Uji skenario alur kerja nyata di basis data MySQL**
- [x] **Step 5: Push branch feat/ejarlit-bappeda-revision ke remote repository**
