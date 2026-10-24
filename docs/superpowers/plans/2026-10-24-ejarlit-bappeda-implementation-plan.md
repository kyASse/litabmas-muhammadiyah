# Implementation Plan: Transformasi Sistem E-Jarlit Bappeda Kota Yogyakarta

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan transformasi arsitektural dan fungsional sistem riset dari PTMA Muhammadiyah menjadi E-Jarlit Bappeda Kota Yogyakarta ("For Yogyakarta Research"), mencakup rebranding total, restrukturisasi peran & approval kampus mitra, skema per tahun anggaran, seleksi administrasi dinamis Ya/Tidak, seleksi substansi pilihan ganda terbobot, pelaporan bertahap 4 fase dengan berkas presentasi & tagihan, serta penguncian tata kelola keuangan Bappeda.

**Architecture:** Arsitektur multi-tenancy kampus mitra Kota Yogyakarta di bawah Bappeda Kota Yogyakarta sebagai pusat pengelola. Mempertahankan 21 tabel domain bersih dengan migrasi inkremental kolom domain riset. Menggunakan Laravel 12 + Inertia.js + React 19 + TypeScript + Tailwind CSS, dengan penegakan strict zero-emoji, kamus i18n ganda (`en.ts` / `id.ts`), dan sistem desain Hybrid Scholarly Enterprise.

**Tech Stack:** PHP 8.2+, Laravel 12, Inertia.js, React 19, TypeScript, Tailwind CSS, PostgreSQL/MySQL.

**Spec:** [docs/plans/2026-10-23-revisi-rapat-ejarlit-plan.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/plans/2026-10-23-revisi-rapat-ejarlit-plan.md)

---

## Global Constraints

1. **Strict Zero Emoji Invariant**: Kode, komentar, commit message, kamus bahasa, pesan validasi, dan UI wajib bebas 100% dari emoji.
2. **Kamus Bahasa Ganda (i18n)**: Seluruh salinan teks antarmuka wajib terdaftar di `resources/js/lang/en.ts` dan `resources/js/lang/id.ts` serta dikonsumsi via hook `useTranslation()`.
3. **Penyelarasan 21 Tabel Bersih**: Seluruh perubahan skema basis data wajib selaras dengan cetak biru [docs/technical/schema.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/schema.md). Modul legacy jurnal tetap dipurge.
4. **Monev Gatekeeper Lock**: Pencairan Termin 2 (30%) wajib terkunci secara backend sebelum Laporan Antara disetujui reviewer dan tagihan diverifikasi Admin Keuangan.
5. **Conflict of Interest (CoI) Guard**: Penugasan reviewer dilarang keras menunjuk pengusul atau anggota tim riset (`id_reviewer != id_pengusul`).
6. **Upload Guard**: Seluruh pengunggahan dokumen riset wajib berformat PDF maks 10MB dengan inspeksi magic bytes. Berkas presentasi memperbolehkan PDF atau PPT/PPTX.

---

## Rincian Tugas (Tasks Breakdown)

### Task 1: Rebranding & Aset Visual Pemkot Yogyakarta

**Files:**
- Create/Modify: `public/logo.svg`, `public/logo_dark.png`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/logo_pemkot.png`
- Modify: `resources/js/pages/welcome.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/components/app-logo.tsx`
- Modify: `resources/js/components/nav-main.tsx`
- Modify: `resources/js/layouts/auth/auth-simple-layout.tsx`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`
- Test: `npm run build` / `npx tsc --noEmit`

**Interfaces:**
- Consumes: Official logo dari `https://jogjakota.go.id/file/content/image/d22b1-Logo_Kota_Yogyakarta.png`
- Produces: Komponen visual identitas E-Jarlit Kota Yogyakarta dan kamus teks terbarukan tanpa kata "PTMA / Muhammadiyah".

- [ ] **Step 1: Unduh dan simpan aset logo resmi Pemkot Yogyakarta**
  - Unduh logo dari URL resmi Pemkot dan simpan ke `public/logo_pemkot.png`.
  - Perbarui `logo.svg`, `logo_dark.png`, `favicon.svg`, `apple-touch-icon.png` agar memuat representasi lambang Kota Yogyakarta.
- [ ] **Step 2: Perbarui kamus bahasa i18n (`en.ts` dan `id.ts`)**
  - Bersihkan string "PTMA", "Muhammadiyah", "Majelis Diktilitbang".
  - Tambahkan string aplikasi "E-Jarlit", tagline "For Yogyakarta Research", dan informasi footer kontak Bappeda Kota Yogyakarta.
- [ ] **Step 3: Perbarui komponen layout dan halaman publik**
  - Pasang logo baru dan tagline pada `welcome.tsx`, `app-sidebar.tsx`, `app-logo.tsx`, dan `auth-simple-layout.tsx`.
  - Pasang alamat lengkap Bappeda Kota Yogyakarta di footer: Kompleks Balai Kota Yogyakarta, Jl. Kenari No. 56, Muja Muju, Kec. Umbulharjo, Kota Yogyakarta.
- [ ] **Step 4: Verifikasi build dan tampilan**
  - Jalankan `npm run build` dan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan kompilasi.
- [ ] **Step 5: Commit perubahan Task 1**
  - Commit dengan pesan: `feat(branding): implement pemkot yogyakarta logo, ejarlit branding, and bappeda contact info`

---

### Task 2: Penyelarasan Struktur Peran (RBAC) & Verifikasi Kampus Mitra

**Files:**
- Modify: `app/Models/Role.php`
- Modify: `app/Models/User.php`
- Modify: `app/Models/Proposal.php`
- Modify: `app/Policies/UserPolicy.php`
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify: `app/Http/Controllers/ProposalController.php`
- Modify: `app/Http/Controllers/Admin/AdminKampusController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/RoleAndProposalWorkflowTest.php`

**Interfaces:**
- Consumes: `User`, `Role`, `Proposal`
- Produces: State transition proposal: `Draft` -> `Submitted_Kampus` -> `Approved_Kampus` (Submitted_Bappeda) dan hak akses Admin Kampus untuk approval internal.

- [ ] **Step 1: Tulis unit/feature test untuk alur persetujuan Admin Kampus dan penertiban role**
  - Buat tes yang memverifikasi bahwa pengusul berstatus dosen/peneliti mengirim usulan dengan status `Submitted_Kampus`.
  - Verifikasi bahwa Admin Kampus afiliasi dapat menyetujui proposal sehingga berstatus `Approved_Kampus`.
  - Verifikasi bahwa user non-afiliasi tidak dapat menyetujui usulan kampus lain.
- [ ] **Step 2: Perbarui Model Role & Penertiban Konstanta Role**
  - Pastikan konstanta role: `SUPER_ADMIN`, `ADMIN_KAMPUS`, `ADMIN_KEUANGAN`, `REVIEWER`, `PENELITI`.
  - Eliminasi referensi role legacy `User` dan `Pengelola Jurnal`.
- [ ] **Step 3: Implementasi Transisi State Proposal pada Model Proposal**
  - Tambahkan status `Submitted_Kampus`, `Approved_Kampus` pada enum / helper status proposal.
  - Tambahkan method persetujuan kampus pada `ProposalController` atau `AdminKampusController`: `approveByCampus(Proposal $proposal)` dan `rejectByCampus(Proposal $proposal, Request $request)`.
- [ ] **Step 4: Selaraskan Middleware Rute dan Dashboard**
  - Batasi peran Admin Kampus sebatas approval dan monitoring sivitas internal kampusnya.
  - Admin Bappeda (Super Admin) memegang seluruh tata kelola seleksi proposal dan penugasan reviewer.
- [ ] **Step 5: Jalankan tes dan commit**
  - Jalankan `php artisan test --filter=RoleAndProposalWorkflowTest`.
  - Commit dengan pesan: `feat(roles): align rbac roles, scope campus admin to pre-screening approval, and purge legacy role conditions`

---

### Task 3: Skema Riset & Seleksi Administrasi Dinamis Berbasis Tahun

**Files:**
- Create: `database/migrations/2026_10_24_000001_add_tahun_anggaran_to_research_schemas_table.php`
- Create: `database/migrations/2026_10_24_000002_update_assessment_criteria_for_dynamic_admin.php`
- Modify: `app/Models/ResearchSchema.php`
- Modify: `app/Models/AssessmentCriteria.php`
- Modify: `app/Models/Proposal.php`
- Modify: `app/Http/Controllers/SchemaController.php`
- Modify: `app/Http/Controllers/Admin/CriteriaController.php`
- Modify: `app/Http/Controllers/Admin/ProposalController.php`
- Modify: `resources/js/pages/Admin/Criteria/Index.tsx`
- Modify: `resources/js/pages/Admin/Schema/Create.tsx`
- Modify: `resources/js/pages/Admin/Schema/Index.tsx`
- Test: `tests/Feature/SchemaYearAndCriteriaTest.php`

**Interfaces:**
- Consumes: Skema riset dan master kriteria seleksi.
- Produces: Filter tahun anggaran pada skema & proposal; form checklist dinamis seleksi administrasi Ya/Tidak; gerbang kelulusan 100% Ya menuju `Lolos_Administrasi`.

- [ ] **Step 1: Tulis feature test untuk skema tahun dan verifikasi checklist administrasi dinamis**
  - Tes pembuatan skema riset dengan kolom `tahun_anggaran`.
  - Tes pembuatan kriteria seleksi tipe administrasi (checklist dinamis).
  - Tes evaluasi proposal: jika seluruh butir bernilai Ya -> `Lolos_Administrasi`; jika ada minimal 1 Tidak -> `Ditolak_Administrasi`.
- [ ] **Step 2: Buat migrasi basis data**
  - Tambahkan kolom `tahun_anggaran` (`unsignedSmallInteger` / `year`) pada tabel `research_schemas`.
  - Tambahkan kolom `tahap_seleksi` (`enum: Administrasi, Substansi`), `tipe_jawaban` (`enum: Ya_Tidak, Pilihan_Ganda`), dan `pilihan_skor` (`json nullable`) pada tabel `assessment_criteria`.
- [ ] **Step 3: Perbarui Model Eloquent & Controller**
  - Perbarui `$fillable` dan casts pada `ResearchSchema` dan `AssessmentCriteria`.
  - Tambahkan filter tahun pada `SchemaController` dan `ProposalController`.
  - Tambahkan method verifikasi administrasi dinamis pada `Admin/ProposalController` yang mengevaluasi respon Ya/Tidak.
- [ ] **Step 4: Perbarui Antarmuka Admin Kriteria & Skema**
  - Buat input form kriteria yang memungkinkan Admin Bappeda memilih jenis kriteria (Administrasi vs Substansi).
  - Tampilkan tabel checklist administrasi pada review proposal.
- [ ] **Step 5: Jalankan tes dan commit**
  - Jalankan `php artisan test --filter=SchemaYearAndCriteriaTest`.
  - Commit dengan pesan: `feat(schema-criteria): implement research schema fiscal year and dynamic administrative checklist criteria`

---

### Task 4: Seleksi Substansi & Form Scoring Pilihan Ganda (Tanpa Slider)

**Files:**
- Modify: `app/Models/Review.php`
- Modify: `app/Http/Controllers/ReviewController.php`
- Modify: `app/Http/Controllers/Review/ReviewController.php`
- Modify: `resources/js/pages/Reviewer/ReviewForm.tsx` atau `resources/js/pages/Review/Show.tsx`
- Modify: `resources/js/pages/Reviewer/Index.tsx`
- Test: `tests/Feature/SubstantiveReviewScoringTest.php`

**Interfaces:**
- Consumes: `Review`, `AssessmentCriteria`, `Proposal`
- Produces: Scoring rubrik pilihan ganda diskret berbobot + komentar wajib per butir kriteria; tab sub-navigasi reviewer memisahkan hasil administrasi dan formulir substansi.

- [ ] **Step 1: Tulis unit/feature test untuk penilaian substansi**
  - Tes penyimpanan skor pilihan ganda terbobot (skala 1-5 terkonversi ke bobot kriteria).
  - Tes validasi komentar wajib per bagian kriteria.
  - Tes perhitungan skor total akumulasi secara akurat tanpa slider.
- [ ] **Step 2: Perbarui Backend ReviewController**
  - Validasi payload request penilaian: setiap kriteria wajib memiliki `skor_opsi` (skala diskret) dan `komentar` (string minimal 10 karakter).
  - Kalkulasi `skor_total` berdasarkan bobot masing-masing kriteria.
  - Simpan rincian skor dan komentar ke kolom `komponen_penilaian` (JSON).
- [ ] **Step 3: Redesign Frontend Formulir Penilaian Reviewer**
  - Hapus seluruh elemen input `type="range"` (slider).
  - Gunakan pilihan tombol radio / segmented button untuk skala diskret (1: Sangat Kurang, 2: Kurang, 3: Cukup, 4: Baik, 5: Sangat Baik).
  - Tambahkan field textarea komentar di bawah setiap butir kriteria penilaian.
  - Buat sub-navigasi tab: "Hasil Verifikasi Administrasi & RAB" dan "Lembar Evaluasi Substansi".
- [ ] **Step 4: Jalankan tes dan verifikasi frontend**
  - Jalankan `php artisan test --filter=SubstantiveReviewScoringTest`.
  - Verifikasi build `npm run build`.
- [ ] **Step 5: Commit perubahan Task 4**
  - Commit dengan pesan: `feat(review): implement discrete multiple-choice scoring with mandatory commentary and remove slider input`

---

### Task 5: Siklus Pelaporan 4 Tahap, Berkas Presentasi, Tagihan & Verifikasi Keuangan

**Files:**
- Create: `database/migrations/2026_10_24_000003_update_progress_reports_for_multi_stage_and_billing.php`
- Modify: `app/Models/ProgressReport.php`
- Modify: `app/Models/Funding.php`
- Modify: `app/Http/Controllers/ProgressController.php`
- Modify: `app/Http/Controllers/FundingController.php`
- Modify: `app/Http/Controllers/FinanceReportController.php`
- Modify: `resources/js/pages/Progress/Create.tsx`
- Modify: `resources/js/pages/Progress/Index.tsx`
- Modify: `resources/js/pages/Finance/Index.tsx`
- Test: `tests/Feature/MultiStageProgressAndBillingTest.php`

**Interfaces:**
- Consumes: `ProgressReport`, `Funding`, `Contract`
- Produces: 4 tahap laporan (Pendahuluan, Bulanan, Antara, Akhir), upload presentasi & tagihan, audit RAB & persetujuan pencairan dana oleh Admin Keuangan Bappeda.

- [ ] **Step 1: Tulis unit/feature test untuk siklus pelaporan 4 tahap dan tagihan keuangan**
  - Tes pengunggahan laporan dengan tipe: `Pendahuluan`, `Bulanan`, `Antara`, `Akhir`.
  - Tes pengunggahan berkas presentasi (PDF/PPT) dan berkas tagihan (PDF).
  - Tes verifikasi Monev Gatekeeper: pencairan Termin 2 (30%) diblokir jika Laporan Antara belum disetujui reviewer atau berkas tagihan belum disahkan Admin Keuangan.
- [ ] **Step 2: Migrasi Basis Data untuk Tabel progress_reports**
  - Tambahkan kolom `tipe_laporan` (`enum: Pendahuluan, Bulanan, Antara, Akhir`).
  - Tambahkan kolom `file_presentasi` (`string nullable`).
  - Tambahkan kolom `file_tagihan` (`string nullable`).
  - Tambahkan kolom `nominal_tagihan` (`decimal(15,2) nullable`).
- [ ] **Step 3: Perbarui Backend ProgressController & FundingController**
  - Implementasikan validasi upload berkas laporan, presentasi, dan tagihan.
  - Validasi ketat gatekeeper pencairan dana Termin 2 di `FundingController`.
  - Berikan hak akses persetujuan tagihan secara eksklusif kepada role `Admin Keuangan`.
- [ ] **Step 4: Perbarui Antarmuka Pengunggahan Laporan & Dashboard Keuangan**
  - Pada halaman Peneliti: form pengunggahan laporan bertahap yang dinamis sesuai tipe laporan yang dipilih.
  - Pada halaman Admin Keuangan: antarmuka audit RAB proposal, verifikasi berkas tagihan, dan pemantauan realisasi anggaran SPJ.
- [ ] **Step 5: Jalankan tes dan commit**
  - Jalankan `php artisan test --filter=MultiStageProgressAndBillingTest`.
  - Commit dengan pesan: `feat(progress-finance): add 4-stage reports, presentation upload, billing invoicing, and finance gatekeeper`

---

### Task 6: Pembersihan Data (Clean Reset Seeder) & Audit Integritas Menyeluruh

**Files:**
- Create: `database/seeders/EJarlitBappedaSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: Full PHPUnit test suite & TypeScript build

**Interfaces:**
- Consumes: Seluruh modul sistem terintegrasi.
- Produces: Basis data bersih E-Jarlit Bappeda 2026, seluruh unit test lulus 100%, build frontend bebas galat dan bebas emoji.

- [ ] **Step 1: Buat seeder master data bersih E-Jarlit Bappeda 2026**
  - Akun Super Admin Bappeda Kota Yogyakarta (`admin.bappeda@jogjakota.go.id`).
  - Akun Admin Keuangan Bappeda (`keuangan.bappeda@jogjakota.go.id`).
  - Akun Reviewer Ahli Bappeda (`reviewer.ejarlit@jogjakota.go.id`).
  - Daftar Perguruan Tinggi Mitra di Kota Yogyakarta (UGM, UNY, UAD, UMY, UIN Sunan Kalijaga, UST, ISI Yogyakarta) beserta akun Admin Kampus dan Peneliti contoh.
  - Skema Penelitian Bappeda Kota Yogyakarta Tahun Anggaran 2026.
  - Kriteria Checklist Administrasi Dinamis dan Rubrik Penilaian Substansi Pilihan Ganda.
- [ ] **Step 2: Jalankan migrasi fresh dan seed bersih**
  - Jalankan `php artisan migrate:fresh --seed --seeder=EJarlitBappedaSeeder`.
- [ ] **Step 3: Jalankan seluruh pengujian backend & frontend**
  - Jalankan `php artisan test`.
  - Jalankan `npm run build` dan pastikan zero compilation errors.
- [ ] **Step 4: Audit bebas emoji & kelengkapan kamus i18n**
  - Lakukan audit teks menyeluruh untuk memastikan 100% bebas dari emoji.
- [ ] **Step 5: Commit perubahan Task 6**
  - Commit dengan pesan: `chore(clean-seed): finalize clean ejarlit bappeda seeder and complete comprehensive system audit`
