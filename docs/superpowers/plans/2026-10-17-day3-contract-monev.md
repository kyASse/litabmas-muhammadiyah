# Day 3: Modul 3 (Kontrak & Keuangan 70:30) dan Modul 4 (Monev Pelaksanaan Riset) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun alur penerbitan Kontrak Hibah otomatis untuk usulan berstatus `Lolos_Didanai` dengan nilai riil `dana_disetujui` (budget cut adjustment), pembagian termin 70% (Termin 1) dan 30% (Termin 2), bukti transfer resmi sebelum `Disbursed`, penjadwalan Monev LPPM, pelaporan progres dosen (PDF maks 10MB, logbook, persentase 1%-100%), evaluasi reviewer Monev, serta penegakan absolut **Monev Gatekeeper Lock** (HTTP 422) pada `FundingController@disburse`.

**Architecture:** Menerapkan Pendekatan A (Clean Architecture): Penyelarasan model Eloquent terhadap 21 tabel bersih dengan `BelongsToTenant`, `ContractFundingService` untuk kalkulasi penomoran dan pembagian termin, `FundingDisbursementService` untuk penegakan Monev Gatekeeper Lock HTTP 422, FormRequests terisolasi, pembaruan routes di `routes/web.php`, penyelarasan i18n di `en.ts` dan `id.ts`, serta antarmuka Inertia React berbasis `TabularFigure`, `StatusBadge`, dan `PDFUploader`.

**Tech Stack:** Laravel 12, PHP 8.2+, Inertia.js (React 19 + TypeScript), Tailwind CSS, Lucide React, PHPUnit Feature Tests.

**Spec:** `docs/superpowers/specs/2026-10-17-day3-contract-monev-design.md`

## Global Constraints
- Isolasi multi-tenant wajib melalui `university_id` dan `BelongsToTenant` / `TenantScope`.
- Strict Zero Emoji Invariant: Dilarang keras menggunakan emoji di kode, pesan error, kamus bahasa, respon API, commit git, dan UI. Gunakan penanda teks seperti `[WAJIB]`, `[SUKSES]`, `[BLOKIR]`, `[TERKUNCI MONEV]` dengan mikro-ikon Lucide.
- Quality Gate: Seluruh tes pada `ContractFundingCalculationTest` dan `MonevGatekeeperTest` wajib 100% PASS.
- Validasi berkas upload: Khusus berkas PDF (.pdf) dengan MIME `application/pdf`, magic bytes `%PDF-`, dan batas ukuran maksimal 10MB (10.485.760 bytes).
- i18n & Zero Hardcoded Text: Seluruh teks antarmuka wajib melalui `useTranslation()` dengan entri di `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`.

---

### Task 1: Penyelarasan Model Eloquent Klaster 4 & Klaster 5

**Files:**
- Modify: `app/Models/Contract.php`
- Modify: `app/Models/Funding.php`
- Modify: `app/Models/MonevSchedule.php`
- Modify: `app/Models/ProgressReport.php`
- Modify: `app/Models/Proposal.php`

**Interfaces:**
- Consumes: Skema tabel `contracts`, `fundings`, `monev_schedules`, `progress_reports` dari migrasi database.
- Produces: Relasi Eloquent kanonikal `$proposal->contract`, `$contract->fundings`, `$proposal->progressReports`, `$schedule->progressReports`, dan mutator/accessor kompatibilitas.

- [ ] **Step 1: Selaraskan model `Contract.php`**
  Pastikan `fillable` mencakup: `university_id`, `id_proposal`, `nomor_kontrak`, `judul_kontrak`, `dana_disetujui`, `tanggal_kontrak`, `file_dokumen_kontrak`, `status_kontrak`.
  Gunakan trait `BelongsToTenant`, `HasFactory`, `SoftDeletes`.
  Definisikan relasi `proposal()` (ke `Proposal::class`, foreign key `id_proposal`), `fundings()` (ke `Funding::class`, foreign key `id_contract`), dan `university()`.
  Pertahankan virtual accessor untuk `title`, `contract_number`, `status`.

- [ ] **Step 2: Selaraskan model `Funding.php`**
  Pastikan `fillable` mencakup: `id_contract`, `termin_ke`, `persentase_dana`, `nominal_dana`, `tanggal_pencairan`, `bukti_transfer_path`, `status_pencairan`, `catatan_keuangan`.
  Gunakan trait `HasFactory`, `SoftDeletes`.
  Definisikan relasi `contract()` (ke `Contract::class`, foreign key `id_contract`).
  Tambahkan scope `scopePending`, `scopeDisbursed`, `scopeTermin`.
  Tambahkan alias virtual `$appends` untuk kompatibilitas UI (`contract_id`, `amount`, `percentage`).

- [ ] **Step 3: Selaraskan model `MonevSchedule.php`**
  Pastikan `fillable` mencakup: `university_id`, `nama_tahap`, `tanggal_mulai`, `tanggal_selesai`, `deskripsi`, `is_active`.
  Gunakan trait `BelongsToTenant`, `HasFactory`.
  Definisikan relasi `progressReports()` (ke `ProgressReport::class`, foreign key `id_monev_schedule`).
  Definisikan method pembantu `isOpenForSubmission(): bool` (`$this->is_active && now()->toDateString() >= $this->tanggal_mulai->toDateString() && now()->toDateString() <= $this->tanggal_selesai->toDateString()`).

- [ ] **Step 4: Selaraskan model `ProgressReport.php`**
  Pastikan `fillable` mencakup: `id_proposal`, `id_monev_schedule`, `persentase_kemajuan`, `ringkasan_progres`, `catatan_kendala`, `file_laporan_kemajuan`, `file_logbook`, `skor_monev`, `catatan_reviewer_monev`, `status_laporan`.
  Definisikan relasi `proposal()` (ke `Proposal::class`, foreign key `id_proposal`) dan `monevSchedule()` (ke `MonevSchedule::class`, foreign key `id_monev_schedule`).
  Tambahkan virtual accessors `$appends` untuk `proposal_id`, `status` jika diperlukan antarmuka legacy.

- [ ] **Step 5: Verifikasi relasi di `Proposal.php`**
  Pastikan `contract()` berelasi `hasOne(Contract::class, 'id_proposal')` dan `progressReports()` berelasi `hasMany(ProgressReport::class, 'id_proposal')`.

- [ ] **Step 6: Commit Model Alignment**
  ```bash
  git add app/Models/Contract.php app/Models/Funding.php app/Models/MonevSchedule.php app/Models/ProgressReport.php app/Models/Proposal.php
  git commit -m "refactor(models): align Contract, Funding, MonevSchedule, and ProgressReport with clean 21-table schema"
  ```

---

### Task 2: Pembuatan Test Suite TDD (Failing Tests)

**Files:**
- Create: `tests/Feature/ContractFundingCalculationTest.php`
- Create: `tests/Feature/MonevGatekeeperTest.php`

**Interfaces:**
- Consumes: Model Eloquent dari Task 1.
- Produces: Definisi pengujian otomatis yang mengevaluasi seluruh skenario Modul 3 dan Modul 4.

- [ ] **Step 1: Tulis berkas `tests/Feature/ContractFundingCalculationTest.php`**
  Menyertakan tes:
  1. `test_contract_creation_rejected_if_proposal_not_lolos_didanai()`: proposal berstatus `Draft` atau `Submitted` ditolak saat pembuatan kontrak (HTTP 422).
  2. `test_contract_creation_calculates_exact_70_30_funding_split()`: proposal `Lolos_Didanai` dengan usulan 25jt disetujui 18jt (`dana_disetujui`), kontrak dibuat dengan Termin 1 = 12.600.000 (70%) dan Termin 2 = 5.400.000 (30%), total = 18jt.
  3. `test_contract_generation_creates_unique_contract_number()`: nomor kontrak terformat unik per tahun dan tenant.
  4. `test_contract_enforces_tenant_isolation()`: admin kampus tidak bisa membuat kontrak untuk proposal universitas lain (HTTP 403/404).

- [ ] **Step 2: Tulis berkas `tests/Feature/MonevGatekeeperTest.php`**
  Menyertakan tes:
  1. `test_termin_1_disbursement_succeeds_with_valid_bank_transfer_proof()`: pencairan Termin 1 berhasil dengan berkas bukti transfer dan status berubah menjadi `Disbursed`.
  2. `test_termin_2_disbursement_is_blocked_with_422_when_monev_not_approved()`: pencairan Termin 2 ditolak mentah-mentah (HTTP 422) jika Monev belum `Approved` (tidak ada laporan, atau status `Submitted` / `Revision`).
  3. `test_termin_2_disbursement_succeeds_after_monev_is_approved()`: setelah reviewer menetapkan status laporan monev `Approved`, pencairan Termin 2 berhasil dieksekusi dengan bukti transfer.
  4. `test_progress_report_submission_rejected_outside_active_monev_schedule()`: pengunggahan laporan monev gagal jika jadwal sudah kadaluwarsa atau belum dibuka.
  5. `test_progress_report_submission_validates_pdf_and_percentage()`: penolakan jika berkas bukan PDF atau ukuran > 10MB atau persentase di luar 1-100%.

- [ ] **Step 3: Jalankan tes untuk memverifikasi kegagalan (Red)**
  ```bash
  php artisan test --filter=ContractFundingCalculationTest
  php artisan test --filter=MonevGatekeeperTest
  ```
  Ekspektasi: Gagal karena service, FormRequest, dan controller baru belum diimplementasikan.

- [ ] **Step 4: Commit TDD Tests**
  ```bash
  git add tests/Feature/ContractFundingCalculationTest.php tests/Feature/MonevGatekeeperTest.php
  git commit -m "test: add TDD test suites for ContractFundingCalculation and MonevGatekeeper"
  ```

---

### Task 3: Backend Modul 3 (Kontrak & Pendanaan 70:30)

**Files:**
- Create: `app/Services/ContractFundingService.php`
- Create: `app/Http/Requests/Finance/StoreContractRequest.php`
- Modify: `app/Http/Controllers/ContractController.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Contract`, `Funding`, `Proposal`, `ResearchSchema`.
- Produces: `ContractFundingService::issueContract()`, endpoint `POST /finance/contracts`, `GET /finance/contracts/{contract}`.

- [ ] **Step 1: Implementasikan `ContractFundingService.php`**
  - Method `generateContractNumber(int $universityId): string`: format `KTR/{YYYY}/{CODE}/{SEQUENCE}` secara atomik dengan database lock.
  - Method `issueContract(Proposal $proposal, float $danaDisetujui, string $tanggalKontrak, ?string $nomorKontrak = null): Contract`:
    - Validasi: `$proposal->status_proposal === 'Lolos_Didanai'`. Jika tidak, lempar `ValidationException` atau HTTP 422.
    - Validasi: `$danaDisetujui <= $proposal->researchSchema->anggaran_maksimal`.
    - Di dalam `DB::transaction`:
      - Buat `Contract` dengan `university_id`, `id_proposal`, `nomor_kontrak`, `judul_kontrak` ($proposal->judul_penelitian), `dana_disetujui`, `tanggal_kontrak`, `status_kontrak = 'Draft'`.
      - Hitung Termin 1: `round($danaDisetujui * 0.70, 2)`.
      - Hitung Termin 2: `$danaDisetujui - $termin1Nominal` (menjamin total tepat 100% tanpa selisih pembulatan).
      - Buat 2 rekaman `Funding`:
        - `termin_ke = 1`, `persentase_dana = 70`, `nominal_dana = $termin1Nominal`, `status_pencairan = 'Pending'`.
        - `termin_ke = 2`, `persentase_dana = 30`, `nominal_dana = $termin2Nominal`, `status_pencairan = 'Pending'`.
      - Kembalikan instance `$contract`.

- [ ] **Step 2: Implementasikan `StoreContractRequest.php`**
  - Rules:
    - `id_proposal`: `['required', 'integer', 'exists:proposals,id']`
    - `dana_disetujui`: `['required', 'numeric', 'min:1000000']`
    - `tanggal_kontrak`: `['required', 'date']`
    - `nomor_kontrak`: `['nullable', 'string', 'max:100']`
  - Validasi kustom di `withValidator`: pastikan proposal berstatus `Lolos_Didanai` dan belum memiliki kontrak (`$proposal->contract === null`).

- [ ] **Step 3: Perbarui `ContractController.php`**
  - Selaraskan `index` untuk menampilkan data kontrak dengan `TabularFigure` data props (menggunakan `dana_disetujui`, eager load `proposal.user`, `fundings`).
  - Implementasikan `store(StoreContractRequest $request, ContractFundingService $service)`: panggil `issueContract` dan redirect dengan flash message `[SUKSES] Kontrak diterbitkan dengan perhitungan termin 70:30.`.
  - Selaraskan `show(Contract $contract)` untuk menampilkan detail kontrak dan status kedua termin.

- [ ] **Step 4: Jalankan tes ContractFundingCalculationTest**
  ```bash
  php artisan test --filter=ContractFundingCalculationTest
  ```
  Ekspektasi: Seluruh pengujian kontrak dan perhitungan 70:30 PASS (Hijau).

- [ ] **Step 5: Commit Modul 3 Backend**
  ```bash
  git add app/Services/ContractFundingService.php app/Http/Requests/Finance/StoreContractRequest.php app/Http/Controllers/ContractController.php routes/web.php
  git commit -m "feat(contract): implement automated contract issuance with 70:30 funding split and budget cut adjustment"
  ```

---

### Task 4: Backend Kunci Kritis: Monev Gatekeeper Lock & Pencairan Dana

**Files:**
- Create: `app/Services/FundingDisbursementService.php`
- Create: `app/Http/Requests/Finance/DisburseFundingRequest.php`
- Modify: `app/Http/Controllers/FundingController.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Funding`, `Contract`, `ProgressReport`.
- Produces: `FundingController@disburse` yang memvalidasi berkas bukti transfer dan mengeksekusi pengunci Monev HTTP 422.

- [ ] **Step 1: Implementasikan `DisburseFundingRequest.php`**
  - Rules:
    - `bukti_transfer`: `['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240']` (maks 10MB)
    - `tanggal_pencairan`: `['required', 'date']`
    - `catatan_keuangan`: `['nullable', 'string', 'max:1000']`

- [ ] **Step 2: Implementasikan `FundingDisbursementService.php`**
  - Method `disburse(Funding $funding, $file, string $tanggalPencairan, ?string $catatanKeuangan): Funding`:
    - Evaluasi Termin 2:
      ```php
      if ($funding->termin_ke === 2) {
          $isApproved = $funding->contract->proposal->progressReports()
              ->where('status_laporan', 'Approved')
              ->exists();

          if (! $isApproved) {
              abort(422, '[BLOKIR] Pencairan dana Termin 2 ditolak. Laporan Kemajuan Monev belum disetujui (Approved) oleh Reviewer.');
          }
      }
      ```
    - Simpan berkas bukti transfer ke disk: `$path = $file->store('receipts/fundings', 'public')`.
    - Update `funding`:
      - `status_pencairan = 'Disbursed'`
      - `tanggal_pencairan = $tanggalPencairan`
      - `bukti_transfer_path = $path`
      - `catatan_keuangan = $catatanKeuangan`

- [ ] **Step 3: Perbarui `FundingController.php`**
  - Refactor `disburse(DisburseFundingRequest $request, int $id, FundingDisbursementService $service)`: panggil `service->disburse()`.
  - Kembalikan redirect back dengan pesan sukses: `[SUKSES] Dana termin berhasil dicairkan.`

- [ ] **Step 4: Commit Modul Pencairan & Gatekeeper**
  ```bash
  git add app/Services/FundingDisbursementService.php app/Http/Requests/Finance/DisburseFundingRequest.php app/Http/Controllers/FundingController.php routes/web.php
  git commit -m "feat(funding): enforce Monev Gatekeeper Lock HTTP 422 on Termin 2 disbursement and require official transfer proof"
  ```

---

### Task 5: Backend Modul 4 (Jadwal Monev, Pelaporan Progres Dosen & Evaluasi Reviewer)

**Files:**
- Create: `app/Http/Requests/Admin/StoreMonevScheduleRequest.php`
- Create: `app/Http/Requests/Progress/StoreProgressReportRequest.php`
- Create: `app/Http/Requests/Reviewer/EvaluateMonevRequest.php`
- Modify: `app/Http/Controllers/Admin/MonevScheduleCtrl.php`
- Modify: `app/Http/Controllers/ProgressController.php`
- Create: `app/Http/Controllers/Reviewer/MonevEvaluationController.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `MonevSchedule`, `ProgressReport`, `Proposal`.
- Produces: CRUD Jadwal Monev LPPM, submission laporan kemajuan dosen (PDF maks 10MB + logbook + 1-100%), evaluasi reviewer (`Approved`/`Revision`).

- [ ] **Step 1: Implementasikan `StoreMonevScheduleRequest.php`**
  - Rules: `nama_tahap` (required, string, max:255), `tanggal_mulai` (required, date), `tanggal_selesai` (required, date, after_or_equal:tanggal_mulai), `deskripsi` (nullable, string).

- [ ] **Step 2: Implementasikan `StoreProgressReportRequest.php`**
  - Rules:
    - `id_proposal`: required, exists:proposals,id
    - `id_monev_schedule`: required, exists:monev_schedules,id
    - `persentase_kemajuan`: required, integer, min:1, max:100
    - `ringkasan_progres`: required, string, min:20
    - `catatan_kendala`: nullable, string
    - `file_laporan_kemajuan`: required, file, mimes:pdf, max:10240
    - `file_logbook`: nullable, file, mimes:pdf, max:10240
  - Custom validator:
    - Pastikan jadwal monev aktif dan tanggal saat ini berada dalam rentang `tanggal_mulai` s/d `tanggal_selesai`. Jika tidak, lemparkan error `[TENGGAT_LEWAT] Periode unggah laporan kemajuan untuk tahap ini belum dibuka atau telah berakhir.`.
    - Validasi magic bytes `%PDF-` pada berkas laporan dan logbook.

- [ ] **Step 3: Implementasikan `EvaluateMonevRequest.php`**
  - Rules:
    - `skor_monev`: required, numeric, min:0, max:100
    - `status_laporan`: required, in:Approved,Revision
    - `catatan_reviewer_monev`: required, string, min:10

- [ ] **Step 4: Perbarui Controller Monev & Progress**
  - `Admin/MonevScheduleCtrl.php`: Menggunakan `StoreMonevScheduleRequest`, simpan dengan `university_id = auth()->user()->university_id`.
  - `ProgressController.php`: Refactor method `store(StoreProgressReportRequest $request)`: simpan file PDF ke storage, buat record `ProgressReport` dengan status default `Submitted`.
  - `Reviewer/MonevEvaluationController.php`: Method `evaluate(EvaluateMonevRequest $request, int $reportId)`: update `skor_monev`, `catatan_reviewer_monev`, dan `status_laporan` (`Approved` atau `Revision`).

- [ ] **Step 5: Hubungkan Rute di `routes/web.php`**
  - Daftarkan route reviewer evaluasi monev: `POST /reviewer/monev/{report}/evaluate` dengan middleware `role:Reviewer`.

- [ ] **Step 6: Jalankan Seluruh Tes Quality Gate**
  ```bash
  php artisan test --filter=ContractFundingCalculationTest
  php artisan test --filter=MonevGatekeeperTest
  ```
  Ekspektasi: Seluruh pengujian lolos 100% (Green).

- [ ] **Step 7: Commit Modul 4 Backend**
  ```bash
  git add app/Http/Requests/ app/Http/Controllers/Admin/MonevScheduleCtrl.php app/Http/Controllers/ProgressController.php app/Http/Controllers/Reviewer/MonevEvaluationController.php routes/web.php
  git commit -m "feat(monev): implement LPPM scheduling, lecturer progress report submission, and reviewer evaluation"
  ```

---

### Task 6: Internasionalisasi & Kamus Bahasa (`en.ts` dan `id.ts`)

**Files:**
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`

**Interfaces:**
- Consumes: Desain UI Modul 3 dan 4.
- Produces: Kunci kamus bahasa yang terverifikasi tipe TypeScript (`TranslationType = typeof en`).

- [ ] **Step 1: Tambahkan Kunci Kamus Bahasa di `en.ts`**
  Mencakup:
  - `contracts`: judul halaman, kolom tabel, aksi, status, pesan sukses.
  - `funding`: termin ke-1, termin ke-2, nominal, persentase, upload bukti transfer, status gembok Monev (`[MONEV LOCKED]`, `[DISBURSED]`).
  - `monev`: penjadwalan LPPM, batas tanggal, pelaporan kemajuan dosen, unggah laporan PDF maks 10MB, unggah logbook, slider persentase 1-100%, skor monev, catatan reviewer, tombol setujui/revisi.

- [ ] **Step 2: Tambahkan Terjemahan Sepadan di `id.ts`**
  Menjamin paritas 100% struktur kunci tanpa satupun emoji.

- [ ] **Step 3: Verifikasi Kompilasi Tipe TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit Kamus Bahasa**
  ```bash
  git add resources/js/lang/en.ts resources/js/lang/id.ts
  git commit -m "feat(i18n): add comprehensive translations for Contract, Funding 70:30, and Monev modules"
  ```

---

### Task 7: Frontend Modul 3 (Kontrak & Pendanaan UI)

**Files:**
- Modify: `resources/js/pages/Finance/Contract/Index.tsx`
- Modify: `resources/js/pages/Finance/Funding/Index.tsx`
- Create: `resources/js/pages/Finance/Funding/DisburseModal.tsx`
- Modify: `resources/js/pages/Contract/Show.tsx` (atau `Finance/Contract/Show.tsx`)

**Interfaces:**
- Consumes: Data contracts & fundings dari controller, komponen `TabularFigure`, `StatusBadge`, `PageHeader`.
- Produces: Antarmuka pengelolaan kontrak dan termin pencairan dana berstandar *Hybrid Scholarly Enterprise*.

- [ ] **Step 1: Perbarui `Finance/Contract/Index.tsx`**
  Gunakan `TabularFigure` untuk menampilkan `dana_disetujui` dan pagu skema. Gunakan `StatusBadge` untuk status kontrak (`[DRAFT]`, `[SIGNED]`, `[ACTIVE]`). Form penerbitan kontrak mendukung pengisian nominal realisasi pasca-review (*Budget Cut Adjustment*).

- [ ] **Step 2: Buat `Finance/Funding/DisburseModal.tsx`**
  Modal dialog pencairan dana:
  - Form unggah file bukti transfer bank (PDF/gambar maks 10MB).
  - Input tanggal pencairan dan nomor referensi perbankan.
  - Jika `termin_ke === 2` dan status monev belum `Approved`: tampilkan lencana peringatan `[TERKUNCI MONEV]` dengan pesan bahwa Termin 2 tidak dapat dicairkan sebelum laporan Monev disetujui, dan tombol cairkan dinonaktifkan (`disabled`).

- [ ] **Step 3: Perbarui `Finance/Funding/Index.tsx`**
  Menampilkan tabel termin pencairan dengan kartu alur termin (Termin 1 70% dan Termin 2 30%) menggunakan `TabularFigure` untuk nominal Rupiah dan tombol pemicu `DisburseModal`.

- [ ] **Step 4: Perbarui Tampilan Dosen `Contract/Show.tsx`**
  Menampilkan linier progress pencairan termin:
  - Termin 1 (70%): Status cair / pending dengan nominal `TabularFigure`.
  - Termin 2 (30%): Status `[TERKUNCI MONEV]` hingga status monev disetujui reviewer.

- [ ] **Step 5: Commit Frontend Modul 3**
  ```bash
  git add resources/js/pages/Finance/ resources/js/pages/Contract/
  git commit -m "feat(ui-finance): implement Contract and Funding interfaces with TabularFigure, StatusBadge, and Monev lock indicators"
  ```

---

### Task 8: Frontend Modul 4 (Monev Jadwal, Progres Dosen & Reviewer Monev)

**Files:**
- Modify: `resources/js/pages/Admin/Monev/Schedule.tsx`
- Modify: `resources/js/pages/Progress/Create.tsx`
- Modify: `resources/js/pages/Progress/Index.tsx`
- Create: `resources/js/pages/Reviewer/Monev/Evaluate.tsx`

**Interfaces:**
- Consumes: Data jadwal monev, progress reports, komponen `PDFUploader`, `TabularFigure`, `StatusBadge`.
- Produces: Antarmuka penjadwalan LPPM, formulir pelaporan kemajuan dosen, dan ruang telaah reviewer monev.

- [ ] **Step 1: Perbarui `Admin/Monev/Schedule.tsx`**
  Tabel jadwal monev aktif LPPM dengan tanggal mulai dan tanggal selesai, modal tambah/edit jadwal.

- [ ] **Step 2: Perbarui `Progress/Create.tsx`**
  Formulir pelaporan kemajuan dosen:
  - Pilihan proposal yang didanai dan jadwal monev aktif.
  - Input persentase kemajuan riil (slider & input angka 1% - 100%).
  - Textarea ringkasan progres dan catatan kendala.
  - Komponen `PDFUploader` untuk berkas naskah laporan kemajuan PDF (maks 10MB).
  - Komponen `PDFUploader` untuk berkas logbook kegiatan PDF (maks 10MB).
  - Proteksi formulir: tombol submit dinonaktifkan saat `processing === true`.

- [ ] **Step 3: Implementasikan `Reviewer/Monev/Evaluate.tsx`**
  Ruang evaluasi reviewer monev:
  - Peninjauan ringkasan progres, kendala, unduh/pratinjau laporan PDF dan logbook.
  - Formulir penilaian: input skor monev (0 - 100), catatan naratif reviewer, pilihan putusan (`Approved` atau `Revision`).

- [ ] **Step 4: Commit Frontend Modul 4**
  ```bash
  git add resources/js/pages/Admin/Monev/ resources/js/pages/Progress/ resources/js/pages/Reviewer/
  git commit -m "feat(ui-monev): implement Monev scheduling, lecturer progress submission with PDFUploader, and reviewer evaluation UI"
  ```

---

### Task 9: Verifikasi Kualitas Menyeluruh (Quality Gate Verification)

**Files:**
- Review: Seluruh berkas yang disentuh pada Task 1-8.

**Interfaces:**
- Consumes: Seluruh implementasi backend dan frontend.
- Produces: Bukti verifikasi 100% PASS pada tes PHPUnit, TypeScript, dan aset build frontend.

- [ ] **Step 1: Jalankan PHPUnit Quality Gate**
  ```bash
  php artisan test --filter=ContractFundingCalculationTest
  php artisan test --filter=MonevGatekeeperTest
  ```
  Pastikan 100% assertions PASS.

- [ ] **Step 2: Jalankan seluruh suite tes untuk pencegahan regresi**
  ```bash
  php artisan test --filter=ProposalSubmissionTest
  php artisan test --filter=ReviewAssignmentCoITest
  ```

- [ ] **Step 3: Jalankan verifikasi tipe TypeScript**
  ```bash
  npx tsc --noEmit
  ```
  Pastikan 0 errors.

- [ ] **Step 4: Jalankan build aset frontend**
  ```bash
  npm run build
  ```
  Pastikan bundel berhasil dibangun tanpa error.

- [ ] **Step 5: Verifikasi Strict Zero Emoji Invariant**
  Periksa seluruh commit dan file yang diubah untuk memastikan tidak ada satupun simbol emoji yang disusupkan.

- [ ] **Step 6: Final Commit & Summary**
  ```bash
  git status
  ```
