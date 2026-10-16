# Desain Teknis Hari 3: Modul 3 (Kontrak & Keuangan 70:30) dan Modul 4 (Monev Pelaksanaan Riset)

## 1. Ikhtisar Arsitektur & Sasaran
Dokumen spesifikasi ini menjabarkan desain teknis untuk implementasi Hari 3 Sistem Penelitian Terintegrasi Standalone (RPL-2026). Modul yang dikerjakan mencakup:
1. **Modul 3: Kontrak & Pendanaan (Klaster 4)**:
   - Penerbitan kontrak hibah penelitian otomatis untuk proposal yang telah ditetapkan berstatus `Lolos_Didanai`.
   - Penerapan penyesuaian pagu anggaran riil (*Budget Cut Adjustment*) yang dicatat pada `contracts.dana_disetujui`.
   - Pembuatan otomatis 2 tahapan termin pendanaan pada tabel `fundings` dengan rasio 70% (Termin 1) dan 30% (Termin 2).
   - Validasi unggah berkas bukti transfer bank resmi dan referensi perbankan sebelum status pencairan bermutasi menjadi `Disbursed`.
2. **Modul 4: Monitoring dan Evaluasi / Monev (Klaster 5)**:
   - Penjadwalan periode monev aktif oleh Admin Kampus / LPPM (`monev_schedules`).
   - Formulir pelaporan kemajuan penelitian oleh dosen peneliti (`progress_reports`) dengan pembatasan jadwal aktif, unggah naskah laporan PDF (maks 10MB), unggah logbook PDF (maks 10MB), dan input persentase capaian riil 1%-100%.
   - Ruang telaah dan evaluasi kemajuan oleh Reviewer Monev dengan pengisian skor (0-100), catatan naratif, dan rekomendasi status `Approved` atau `Revision`.
3. **Monev Gatekeeper Lock (Kunci Kritis Transaksional)**:
   - Penegakan pengunci absolut pada `FundingController@disburse` di level backend yang menggagalkan eksekusi pencairan Termin 2 dengan respon HTTP 422 (*Unprocessable Content*) apabila laporan kemajuan Monev belum berstatus `Approved`.

---

## 2. Rujukan Dokumen & Standar Baku
- **PRD**: Dokumen PRD Sistem Penelitian Terintegrasi Standalone (Bab 4 & Bab 7).
- **Skema Basis Data**: `docs/technical/schema.md` (Klaster 4: Tabel 12 & 13; Klaster 5: Tabel 14 & 15).
- **Aturan Bisnis & Kasus Batas**: `docs/technical/rules.md` (Fase 3 & 4; Kasus Batas 8 & 9).
- **Tahapan Pengembangan**: `docs/technical/stages.md` (Spesifikasi Hari 3).
- **Invarian Baku**:
  - Isolasi Multi-Tenant mutlak (`university_id` dan `TenantScope` / `BelongsToTenant`).
  - Strict Zero Emoji Invariant di seluruh baris kode, pengujian, pesan kesalahan, dan antarmuka.
  - Komponen antarmuka terstandarisasi (`TabularFigure`, `StatusBadge`, `PDFUploader`).
  - Internasionalisasi 100% via `resources/js/lang/en.ts`, `resources/js/lang/id.ts`, dan `useTranslation()`.

---

## 3. Desain Model & Penyelarasan Kamus Data 21 Tabel Bersih

### 3.1 Model `App\Models\Contract`
Penyelarasan penuh terhadap tabel `contracts`:
- **Trait**: `BelongsToTenant`, `HasFactory`, `SoftDeletes`.
- **Kolom Utama**:
  - `id`: BIGINT UNSIGNED (Primary Key)
  - `university_id`: BIGINT UNSIGNED (Foreign Key ke `universities.id`)
  - `id_proposal`: BIGINT UNSIGNED (Foreign Key ke `proposals.id`, UNIQUE 1:1)
  - `nomor_kontrak`: VARCHAR(100) (UNIQUE)
  - `judul_kontrak`: VARCHAR(255)
  - `dana_disetujui`: DECIMAL(15,2)
  - `tanggal_kontrak`: DATE
  - `file_dokumen_kontrak`: VARCHAR(255) (Nullable)
  - `status_kontrak`: ENUM('Draft', 'Signed', 'Active', 'Closed') default 'Draft'
- **Relasi**:
  - `university()`: `BelongsTo`
  - `proposal()`: `BelongsTo` (`id_proposal`)
  - `fundings()`: `HasMany` (`Funding::class`, `id_contract`)
- **Virtual Accessors**: Mempertahankan backward compatibility untuk antarmuka yang membaca `title`, `contract_number`, `status`.

### 3.2 Model `App\Models\Funding`
Penyelarasan penuh terhadap tabel `fundings`:
- **Trait**: `HasFactory`, `SoftDeletes`.
- **Kolom Utama**:
  - `id`: BIGINT UNSIGNED (Primary Key)
  - `id_contract`: BIGINT UNSIGNED (Foreign Key ke `contracts.id`)
  - `termin_ke`: INT UNSIGNED (1 atau 2)
  - `persentase_dana`: INT UNSIGNED (70 atau 30)
  - `nominal_dana`: DECIMAL(15,2)
  - `tanggal_pencairan`: DATE (Nullable)
  - `bukti_transfer_path`: VARCHAR(255) (Nullable)
  - `status_pencairan`: ENUM('Pending', 'Disbursed', 'Verified') default 'Pending'
  - `catatan_keuangan`: TEXT (Nullable)
- **Relasi**:
  - `contract()`: `BelongsTo` (`id_contract`)
- **Scope**:
  - `scopePending($query)`: status 'Pending'
  - `scopeDisbursed($query)`: status 'Disbursed'
  - `scopeTermin($query, int $termin)`: filter `termin_ke`

### 3.3 Model `App\Models\MonevSchedule`
Penyelarasan penuh terhadap tabel `monev_schedules`:
- **Trait**: `BelongsToTenant`, `HasFactory`.
- **Kolom Utama**:
  - `id`: BIGINT UNSIGNED (Primary Key)
  - `university_id`: BIGINT UNSIGNED (Foreign Key ke `universities.id`)
  - `nama_tahap`: VARCHAR(255)
  - `tanggal_mulai`: DATE
  - `tanggal_selesai`: DATE
  - `deskripsi`: TEXT (Nullable)
  - `is_active`: BOOLEAN default true
- **Relasi**:
  - `university()`: `BelongsTo`
  - `progressReports()`: `HasMany` (`ProgressReport::class`, `id_monev_schedule`)
- **Scope**:
  - `scopeActive($query)`: `where('is_active', true)`
  - `scopeOpenForSubmission($query)`: aktif dan `today() >= tanggal_mulai` dan `today() <= tanggal_selesai`

### 3.4 Model `App\Models\ProgressReport`
Penyelarasan penuh terhadap tabel `progress_reports`:
- **Trait**: `HasFactory`.
- **Kolom Utama**:
  - `id`: BIGINT UNSIGNED (Primary Key)
  - `id_proposal`: BIGINT UNSIGNED (Foreign Key ke `proposals.id`)
  - `id_monev_schedule`: BIGINT UNSIGNED (Foreign Key ke `monev_schedules.id`)
  - `persentase_kemajuan`: INT UNSIGNED (1 - 100)
  - `ringkasan_progres`: TEXT
  - `catatan_kendala`: TEXT (Nullable)
  - `file_laporan_kemajuan`: VARCHAR(255) (Berkas PDF maks 10MB)
  - `file_logbook`: VARCHAR(255) (Berkas PDF maks 10MB, Nullable)
  - `skor_monev`: DECIMAL(5,2) (Nullable, skala 0.00 - 100.00)
  - `catatan_reviewer_monev`: TEXT (Nullable)
  - `status_laporan`: ENUM('Submitted', 'Approved', 'Revision') default 'Submitted'
- **Relasi**:
  - `proposal()`: `BelongsTo` (`id_proposal`)
  - `monevSchedule()`: `BelongsTo` (`id_monev_schedule`)

---

## 4. Desain Lapisan Layanan (Service Layer) & Controller

### 4.1 `App\Services\ContractFundingService`
Mengisolasi seluruh kalkulasi finansial kontrak dan termin:
1. `issueContract(Proposal $proposal, array $data): Contract`
   - Validasi: proposal wajib berstatus `Lolos_Didanai`.
   - Generate nomor kontrak otomatis: format `KTR/{YYYY}/{TENANT_CODE}/{SEQUENCE}`.
   - Set `dana_disetujui` sesuai pagu yang disetujui LPPM (`<= research_schemas.anggaran_maksimal`).
   - Buat rekaman `Contract` berstatus `Draft` atau `Signed`.
   - Buat 2 rekaman `Funding`:
     - Termin 1: `termin_ke = 1`, `persentase_dana = 70`, `nominal_dana = round($dana_disetujui * 0.70, 2)`.
     - Termin 2: `termin_ke = 2`, `persentase_dana = 30`, `nominal_dana = round($dana_disetujui * 0.30, 2)`.
   - Memastikan penjumlahan `nominal_dana` tepat menyamai `dana_disetujui` (penyesuaian pembulatan jika ada selisih 1 sen dialokasikan ke Termin 1).

### 4.2 `App\Services\FundingDisbursementService`
Mengisolasi eksekusi pencairan termin dan penegakan Monev Gatekeeper:
1. `canDisburseTermin(Funding $funding): array`
   - Mengembalikan status kelayakan dan alasan jika diblokir.
   - Jika `termin_ke === 2`: memeriksa relasi `$funding->contract->proposal->progressReports()->where('status_laporan', 'Approved')->exists()`.
2. `disburse(Funding $funding, UploadedFile $buktiTransfer, string $tanggalPencairan, ?string $catatanKeuangan): Funding`
   - Eksekusi pengecekan `canDisburseTermin`. Jika tidak lolos, lemparkan `HttpException(422, '[BLOKIR] Pencairan dana Termin 2 ditolak. Laporan Kemajuan Monev belum disetujui (Approved) oleh Reviewer.')`.
   - Simpan berkas bukti transfer ke direktori terproteksi `receipts/funding/`.
   - Mutasi status funding menjadi `Disbursed`.

### 4.3 Form Requests
1. `App\Http\Requests\Finance\StoreContractRequest`:
   - Validasi `id_proposal`: required, exists:proposals,id. Memastikan `status_proposal == 'Lolos_Didanai'` dan belum memiliki kontrak aktif.
   - Validasi `dana_disetujui`: required, numeric, min:1000000.
   - Validasi `nomor_kontrak`: nullable (dapat di-generate otomatis), string, max:100.
   - Validasi `tanggal_kontrak`: required, date.
2. `App\Http\Requests\Finance\DisburseFundingRequest`:
   - Validasi `bukti_transfer`: required, file, mimes:pdf,jpg,jpeg,png, max:10240 (10MB).
   - Validasi `tanggal_pencairan`: required, date.
   - Validasi `catatan_keuangan`: nullable, string, max:1000.
3. `App\Http\Requests\Admin\StoreMonevScheduleRequest`:
   - Validasi `nama_tahap`: required, string, max:255.
   - Validasi `tanggal_mulai`: required, date.
   - Validasi `tanggal_selesai`: required, date, after_or_equal:tanggal_mulai.
   - Validasi `deskripsi`: nullable, string.
4. `App\Http\Requests\Progress\StoreProgressReportRequest`:
   - Validasi `id_proposal`: required, exists:proposals,id (milik user login).
   - Validasi `id_monev_schedule`: required, exists:monev_schedules,id (jadwal wajib aktif dan tanggal hari ini dalam rentang jadwal).
   - Validasi `persentase_kemajuan`: required, integer, min:1, max:100.
   - Validasi `ringkasan_progres`: required, string, min:20.
   - Validasi `catatan_kendala`: nullable, string.
   - Validasi `file_laporan_kemajuan`: required, file, mimes:pdf, max:10240 (10MB), magic bytes `%PDF-`.
   - Validasi `file_logbook`: nullable, file, mimes:pdf, max:10240 (10MB).
5. `App\Http\Requests\Reviewer\EvaluateMonevRequest`:
   - Validasi `skor_monev`: required, numeric, min:0, max:100.
   - Validasi `status_laporan`: required, in:Approved,Revision.
   - Validasi `catatan_reviewer_monev`: required, string, min:10.

---

## 5. Rute Web (`routes/web.php`)

### 5.1 Finance (Admin Keuangan & Super Admin)
- `GET /finance/contracts`: `ContractController@index` (Daftar kontrak riset).
- `POST /finance/contracts`: `ContractController@store` (Penerbitan kontrak hibah otomatis).
- `GET /finance/contracts/{contract}`: `ContractController@show` (Detail kontrak & visualisasi termin).
- `GET /finance/fundings`: `FundingController@index` (Daftar termin pencairan).
- `POST /finance/fundings/{funding}/disburse`: `FundingController@disburse` (Eksekusi pencairan dengan Monev Gatekeeper Lock).

### 5.2 Admin LPPM (Admin Kampus & Super Admin)
- `GET /admin/monev-schedules`: `Admin/MonevScheduleController@index` (Manajemen jadwal monev).
- `POST /admin/monev-schedules`: `Admin/MonevScheduleController@store` (Tambah jadwal monev).
- `PUT /admin/monev-schedules/{schedule}`: `Admin/MonevScheduleController@update`.
- `DELETE /admin/monev-schedules/{schedule}`: `Admin/MonevScheduleController@destroy`.

### 5.3 Peneliti / Dosen
- `GET /progress`: `ProgressController@index` (Riwayat laporan kemajuan).
- `GET /progress/create`: `ProgressController@create` (Formulir pelaporan kemajuan).
- `POST /progress`: `ProgressController@store` (Unggah laporan kemajuan + logbook).
- `GET /progress/{progressReport}`: `ProgressController@show`.
- `GET /contracts/{contract}`: `User/ContractShowController@show` (Tampilan progres termin dan status monev dosen).

### 5.4 Reviewer
- `GET /reviewer/monev`: `Reviewer/MonevController@index` (Daftar penugasan telaah monev).
- `GET /reviewer/monev/{report}`: `Reviewer/MonevController@show` (Telaah berkas laporan kemajuan & logbook).
- `POST /reviewer/monev/{report}/evaluate`: `Reviewer/MonevController@evaluate` (Kirim skor dan rekomendasi persetujuan).

---

## 6. Desain Antarmuka Pengguna (UI/UX)

1. **Komponen Pengarah**:
   - `TabularFigure`: Seluruh angka nominal dana disetujui, pagu anggaran, nominal termin 1 (70%), nominal termin 2 (30%), dan skor monev wajib menggunakan `TabularFigure` dengan gaya tabular numerik.
   - `StatusBadge`: Digunakan untuk termin (`[PENDING]`, `[DISBURSED]`, `[VERIFIED]`) dan status laporan monev (`[SUBMITTED]`, `[APPROVED]`, `[REVISI]`, `[TERKUNCI MONEV]`).
   - `PDFUploader`: Digunakan pada pelaporan kemajuan dosen untuk unggah laporan kemajuan PDF dan berkas logbook kegiatan PDF (maksimal 10MB).
2. **Visualisasi Monev Gatekeeper pada Tampilan**:
   - Pada halaman detail kontrak dan modal pencairan dana: Kartu Termin 2 (30%) secara visual menampilkan ikon gembok `[TERKUNCI MONEV]` jika status laporan kemajuan proposal belum `Approved`.
   - Tombol "Cairkan Termin 2" dinonaktifkan pada antarmuka dengan tooltip informatif bahwa laporan kemajuan Monev wajib disetujui oleh reviewer terlebih dahulu.
3. **Internasionalisasi (i18n)**:
   - Seluruh teks label, placeholder, pesan kesalahan, dan keterangan status didaftarkan pada `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`.
   - Menggunakan hook `useTranslation()` di seluruh komponen. Bebas total dari simbol emoji.

---

## 7. Strategi Pengujian Kualitas (Quality Gate)

### 7.1 `tests/Feature/ContractFundingCalculationTest.php`
- `test_contract_creation_rejected_if_proposal_not_lolos_didanai()`: Memastikan pengajuan pembuatan kontrak pada proposal yang belum `Lolos_Didanai` menghasilkan HTTP 422.
- `test_contract_creation_calculates_exact_70_30_funding_split()`: Memvalidasi pembuatan kontrak dengan nilai `dana_disetujui` (budget cut) memicu pembuatan 2 record termin:
  - Termin 1 = persis 70% dari `dana_disetujui`.
  - Termin 2 = persis 30% dari `dana_disetujui`.
  - Akumulasi nominal Termin 1 + Termin 2 = 100% `dana_disetujui`.
- `test_contract_and_fundings_enforce_tenant_isolation()`: Memastikan data kontrak dan pendanaan terkunci pada tenant perguruan tinggi terkait.

### 7.2 `tests/Feature/MonevGatekeeperTest.php`
- `test_termin_1_disbursement_succeeds_with_valid_bank_transfer_proof()`: Termin 1 berhasil dicairkan ketika bukti transfer diunggah.
- `test_termin_2_disbursement_is_blocked_with_422_when_monev_not_approved()`: Percobaan pencairan Termin 2 ditolak mutlak (HTTP 422 Unprocessable Content) jika laporan kemajuan belum ada, masih `Submitted`, atau `Revision`.
- `test_termin_2_disbursement_succeeds_after_monev_is_approved()`: Pencairan Termin 2 berhasil dieksekusi setelah reviewer menetapkan status `Approved`.
- `test_progress_report_submission_rejected_outside_active_monev_schedule()`: Dosen ditolak mengunggah laporan jika tanggal di luar rentang jadwal monev aktif.
- `test_progress_report_submission_requires_pdf_under_10mb()`: Memvalidasi penolakan berkas non-PDF atau melebihi 10MB.
