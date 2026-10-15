# Aturan Proyek Sistem Penelitian Terintegrasi Standalone (RPL-2026)

Dokumen ini merupakan aturan baku rekayasa perangkat lunak yang **WAJIB DIPATUHI SECARA MUTLAK** oleh setiap agen AI dalam setiap sesi pengembangan, pengujian, maupun peninjauan kode.

---

## Bagian 1: Invarian Pengembangan Sistem (Engineering & Architecture Invariants)

### 1. Rujukan Tunggal Arsitektur & Spesifikasi (Single Source of Truth)
- Seluruh keputusan teknis, arsitektur, skema basis data, dan antarmuka **WAJIB** merujuk secara konsisten pada:
  - [PRD Sistem Penelitian Terintegrasi Standalone](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)
  - [Cetak Biru Arsitektur](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/architecture.md) (Arsitektur & Tenancy)
  - [Kamus Data & Skema Basis Data 21 Tabel](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/schema.md) (Skema Bersih & ERD)
  - [Sistem Desain Antarmuka](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/design.md) (Hybrid Scholarly Enterprise & Preview Gate)
  - [Aturan Bisnis & Kasus Batas Kritis](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/rules.md) (Aturan Transaksional & 11 Kasus Batas)
  - [Tahapan Pengembangan & Roadmap Rilis](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/stages.md) (Rencana Sprint 5 Hari Menuju 20 Oktober 2026)
- **Larangan Regresi Modul Legacy**: Dilarang keras memunculkan kembali tabel, controller, model, rute, atau komponen antarmuka warisan OJS (Submission Kelas G) dan JurnalMu yang telah dibersihkan secara total (*purged*).

### 2. Isolasi Multi-Tenancy (Multi-Campus Tenancy Isolation)
- Seluruh mutasi dan kueri data penelitian (skema riset, usulan proposal, berkas dokumen, kontrak, jadwal monev, laporan kemajuan, dan luaran) **WAJIB** mengunci data pada institusi yang bersangkutan melalui kolom `university_id` dan global scope Eloquent `TenantScope`.
- Hanya peran `Super Admin` yang diperbolehkan memiliki hak akses lintas kampus (*global bypass*).
- Pencegahan IDOR (*Insecure Direct Object Reference*): Percobaan akses atau manipulasi data lintas institusi via parameter URL wajib dicegat oleh `TenantScope` dan Laravel Policy dengan respon HTTP 403 (*Forbidden*) atau 404 (*Not Found*).

### 3. Validasi Peran Pengguna & Kompatibilitas Legacy (Role Validation & Compatibility)
- Pengecekan otorisasi peran pada Laravel controller **TIDAK BOLEH** langsung memanggil kueri relasi pivot `$user->roles()->...` secara mentah karena seeder basis data legacy sering kali hanya mengisi kolom `role_id` utama.
- **SELALU** gunakan helper method model User seperti `$user->hasRole($role)` atau `$user->hasAnyRole([$roles])` yang menangani pemeriksaan kolom `role_id` legacy dan relasi pivot secara bersamaan.

### 4. Penyelarasan Otorisasi Rute & Controller (Route & Controller Alignment)
- Hak akses yang dideklarasikan pada rute (`routes/web.php` melalui middleware `role:XXX`) **WAJIB** selaras dengan pengecekan peran di dalam method controller terkait.
- Jika controller memperbolehkan multi-role (misal: Reviewer dan Admin Kampus), pastikan middleware rute juga memperbolehkan peran-peran tersebut secara eksplisit (misal: `role:Reviewer,Admin Kampus`).

### 5. Invarian Gerbang Sistem Desain (Design System Preview Gate Invariant)
- Pembangunan antarmuka modul riset **WAJIB** menggunakan komponen pakai-ulang terstandarisasi yang telah terverifikasi pada rute internal `/design-system-preview` (`StatusBadge`, `PDFUploader`, `TabularFigure`, `MetricCard`, `PageHeader`, `SplitScreenViewer`).
- Dilarang membuat komponen UI ad-hoc atau merombak token palet warna Cool Slate dan tipografi ganda (Serif untuk judul/abstrak/SKTS, Sans untuk antarmuka operasional, Tabular Mono untuk angka mata uang dan nilai).
- Seluruh formulir Inertia `useForm` wajib menerapkan: submit dinonaktifkan saat `processing === true`, proteksi navigasi `isDirty`, validasi inline saat blur, dan *auto-focus* ke field pertama yang mengalami galat.

### 6. Invarian Integritas Transaksional Riset
- **Upload Guard**: Seluruh pengunggahan dokumen riset (proposal, laporan kemajuan, logbook, dokumen luaran) **WAJIB** berupa berkas tunggal berformat `.pdf` dengan ukuran maksimum 10MB (10.485.760 bytes), disertai validasi MIME-type riil `application/pdf` dan inspeksi magic bytes (`%PDF-`).
- **Conflict of Interest (CoI) Guard**: Penugasan reviewer wajib menggagalkan plotting secara otomatis jika reviewer merupakan pengusul utama atau tercatat dalam anggota tim usulan (`id_reviewer != id_pengusul`).
- **Monev Gatekeeper Lock**: Pencairan dana Termin 2 (30%) **DIBLOKIR SECARA ABSOLUT** di level backend (HTTP 422 *Unprocessable Content*) sebelum laporan kemajuan Monev disetujui (`Approved`) oleh reviewer/LPPM.
- **Output Deduplication Guard**: Pelaporan luaran wajib memvalidasi keunikan nomor registrasi kanonikal (DOI, ISBN, nomor registrasi HKI) per institusi untuk mencegah klaim luaran ganda.
- **Read-Only Archive Lock**: Penerbitan Surat Keterangan Tanda Selesai (SKTS) mengunci permanen seluruh data riset menjadi arsip baca-saja (*Read-Only Archive*).

### 7. Larangan Simbol Emoji Mutlak (Strict Zero Emoji Invariant)
- Seluruh teks pada kode sumber, komponen antarmuka React/TypeScript, pesan kesalahan validasi backend, respons notifikasi sistem, data seeder, respons percakapan chat, commit git, dan berkas dokumentasi/laporan **WAJIB BEBAS 100% DARI SIMBOL EMOJI**.
- Seluruh indikator visual wajib menggunakan penanda teks terstruktur standar seperti `[WAJIB]`, `[KRITIS]`, `[PASSED]`, `[SUKSES]`, `[TERKUNCI]`, `[REVISI]`, dsb., yang didampingi mikro-ikon SVG semantik (Lucide React 1.5-2.0px stroke).

---

## Bagian 2: Panduan Peninjauan Kode & Pull Request (Code Review Guidelines)

### 1. Penyelarasan Diff dengan Dokumen Teknis & PRD Standalone (Mandatory Alignment Invariant)
- Pada setiap peninjauan kode atau Pull Request (PR), agen **WAJIB** memvalidasi bahwa seluruh *diff* perubahan kode (berkas yang ditambah, dimodifikasi, atau dihapus) **selaras 100%** dengan cetak biru yang didefinisikan dalam `docs/technical/` (`architecture.md`, `schema.md`, `design.md`, `rules.md`, `stages.md`) dan `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`.
- Jika ditemukan hal-hal berikut dalam diff, agen **WAJIB** memberikan catatan [CRITICAL] / [MUST FIX]:
  - Penambahan atau modifikasi tabel di luar 21 tabel domain bersih pada `schema.md`.
  - Percobaan menghidupkan kembali modul legacy OJS / JurnalMu yang telah di-purge.
  - Inkonsistensi termin pendanaan di luar formula 70% (Termin 1) dan 30% (Termin 2).
  - Melewati mekanisme *Monev Gatekeeper Lock* pada pencairan dana Termin 2.
  - Komponen antarmuka yang mengabaikan sistem desain *Hybrid Scholarly Enterprise* atau menyertakan simbol emoji.
  - Pelanggaran tahapan kerja yang ditetapkan pada `stages.md`.

### 2. Sinkronisasi Cabang (Branch Sync Invariant)
- Sebelum melakukan pemeriksaan kode secara lokal atau menjalankan perintah tes/verifikasi untuk suatu Pull Request (PR), agen **WAJIB** beralih ke branch head milik PR tersebut (`git checkout <headRefName>`) dan melakukan `git pull`. Jangan melakukan pemeriksaan lokal dari branch lain.

### 3. Kesadaran Batasan Kolaborasi (Collaboration Boundary Awareness)
- Selalu validasi riwayat review dan kesepakatan tim terkait pembagian tugas.
- Jika suatu berkas (seperti Model database atau Service pendukung) tidak ditemukan dalam PR tetapi deskripsinya menyebutkan berkas tersebut, periksa apakah berkas tersebut merupakan tanggung jawab anggota tim lain.
- Utamakan solusi penyelesaian lokal (mocking/stubbing/local testing) demi keadilan kontribusi tim tanpa memaksa penggabungan berkas yang bukan menjadi hak milik PR tersebut.

### 4. Format Laporan Review Terstandarisasi & Bebas Emoji
- Laporan review **wajib** ditulis dalam **Bahasa Indonesia** secara profesional dan terstruktur tanpa emoji apa pun.
- **Deteksi Wajib Re-Review**: Sebelum membuat laporan review baru, agen **wajib** memeriksa secara lokal apakah berkas `.agents/reviews/PR-<PR_NUMBER>-review.md` sudah ada di workspace. Jika berkas tersebut sudah ada, agen dilarang keras menggunakan templat review pertama kali dan wajib menggunakan templat Re-Review:

```markdown
# Laporan Pemeriksaan Ulang (Re-Review): PR #<PR_NUMBER> - <PR_TITLE>

## Ringkasan Pemeriksaan (Executive Summary)
<Deskripsi hasil pemeriksaan ulang secara singkat.>

**Status Akhir: <APPROVED (DISETUJUI) | REQUEST_CHANGES | COMMENT>**

---

## Keselarasan terhadap Dokumen Teknis & PRD Standalone
- **Kepatuhan 21 Tabel Bersih (schema.md)**: [SESUAI / TERDAPAT PENYIMPANGAN]
- **Kepatuhan Alur Bisnis & Rules (rules.md)**: [SESUAI / TERDAPAT PENYIMPANGAN]
- **Kepatuhan Desain Hybrid Scholarly Enterprise (design.md)**: [SESUAI / TERDAPAT PENYIMPANGAN]
- **Kesesuaian Tahapan Roadmap (stages.md)**: [SESUAI / TERDAPAT PENYIMPANGAN]

---

## Hasil Evaluasi Rekomendasi Tindakan Sebelumnya

### 1. <Rekomendasi Tindakan 1 dari review sebelumnya>
- **Rekomendasi**: <Penjelasan singkat rekomendasi sebelumnya>
- **Status**: <TERPENUHI / BELUM TERPENUHI / TERPENUHI SEBAGIAN> [Penjelasan detail implementasi perbaikan]

### 2. <Rekomendasi Tindakan 2, dst.>

---

## Analisis File Detail (File-by-File Review)

### Backend
#### 1. [NamaFile.php](file:///c:/path/to/NamaFile.php)
- <Detail review backend>

### Frontend
#### 1. [NamaFile.tsx](file:///c:/path/to/NamaFile.tsx)
- <Detail review frontend>

---

## Masukan Tambahan untuk Pengembangan Selanjutnya (Non-Blocking)
1. <Saran non-blocking untuk peningkatan di masa depan>
```

### 5. Otomatisasi Alur Kerja Approved
- Apabila laporan review/re-review menghasilkan keputusan **APPROVED (DISETUJUI)**, dan pengguna memberikan instruksi posting (misal: "posting", "ya posting"), agen **wajib** mengeksekusi rangkaian tindakan berikut secara sekuensial:
  1. Lakukan posting persetujuan resmi: `gh pr review <PR_NUMBER> --approve --body-file <FILE_PATH>`
  2. Lakukan merge ke branch development: `gh pr merge <PR_NUMBER> --merge --admin`
  3. Berikan komentar penyelesaian pada Issue pelacak terkait (jika ada).
  4. Tutup Issue tersebut sebagai selesai: `gh issue close <ISSUE_NUMBER> --reason "completed"` (jika ada)

### 6. Penyelarasan Bahasa Kolom & Eloquent Accessors
- Jika terdapat mismatch antara nama kolom database/model (Bahasa Inggris) dengan kebutuhan visual frontend modul lain (Bahasa Indonesia), prioritaskan penambahan alias virtual menggunakan Eloquent Accessors (`$appends` dan get-methods) pada model terkait daripada merombak total migrasi basis data yang sudah digunakan oleh modul lain.
