# Design Document: Hari 4 - Modul 5 (Luaran Riset) & Modul 6 (Evaluasi Akhir, Penerbitan SKTS, & Read-Only Archive)

- **Tanggal**: 19 Oktober 2026
- **Status**: Approved (Berdasarkan Persetujuan Pendekatan A)
- **Cabang Target**: `feat/day4-outputs-skts-archive` (bercabang dari `origin/development`)
- **Rujukan Arsitektur**:
  - `docs/technical/stages.md` (Hari 4: Modul 5 & Modul 6)
  - `docs/technical/schema.md` (Klaster 6: Tabel 16-20 & Klaster 7: Tabel 21)
  - `docs/technical/rules.md` (Fase 5-6, Kasus Batas 10 & 11, Dual-Layer Authorization)
  - `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`

---

## 1. Pendahuluan & Sasaran Sistem

Tahap Hari 4 menuntaskan siklus hilir penelitian akademik terintegrasi:
1. **Modul 5: Pelaporan & Verifikasi Luaran Ilmiah**:
   - Mendukung 4 klaster luaran: Artikel Jurnal (`journal_outputs`), Buku Ber-ISBN (`book_outputs`), HKI (`hki_outputs`), dan Produk Teknologi (`product_outputs`).
   - Penegakan syarat minimal 1 luaran berkategori `Wajib` per proposal yang didanai.
   - *Output Deduplication Guard*: Pencegahan klaim ganda berbasis nomor DOI, ISBN, dan nomor pendaftaran/sertifikat HKI pada level institusi (`university_id`).
   - Panel Verifikasi LPPM untuk validasi bukti fisik naskah/sertifikat.
2. **Modul 6: Evaluasi Akhir Penelitian, SKTS, & Read-Only Archive**:
   - Pengunggahan Laporan Akhir 100% dengan prasyarat kumulatif: seluruh luaran bertarget `Wajib` harus telah berstatus `Verified`.
   - Penilaian substansi akhir oleh komite/evaluator LPPM dengan rekomendasi kelulusan (`Lulus_Memuaskan`, `Lulus_Cukup`, `Tidak_Lulus`).
   - Penerbitan Surat Keterangan Tanda Selesai (SKTS) berpenomoran unik institusi (`SKTS/{KODE_KAMPUS}/{TAHUN}/{ID_PROPOSAL}`) dengan tampilan editorial (`font-serif`, kop surat resmi, QR verification).
   - **Kunci Kritis - Read-Only Archive Lock**: Mutasi status menjadi `Selesai` secara permanen memblokir (HTTP 403) seluruh operasi edit dan hapus pada data usulan (`proposals`), dokumen lampiran (`proposal_documents`), kontrak (`contracts`), pencairan dana (`fundings`), laporan kemajuan (`progress_reports`), dan luaran riset (`research_outputs`).
   - Alur khusus *Force Majeure* / Penelitian Gagal: Penutupan riset dengan status `Gagal`, pembatalan sisa dana Termin 2 (`Cancelled`), dan berita acara rekonsiliasi pengembalian dana.
3. **Invarian Kunci**:
   - *Strict Zero Emoji Invariant*: 100% bebas dari emoji pada seluruh kode, UI, respons validasi, dan sertifikat SKTS.
   - *i18n Bilingual Parity*: Seluruh salinan teks didaftarkan ke `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`.
   - *Quality Gate*: Seluruh skenario pengujian `OutputDeduplicationTest`, `FinalEvaluationPreconditionTest`, dan `ReadOnlyArchiveLockTest` lulus 100%.

---

## 2. Arsitektur & Skema Basis Data

Struktur basis data mengikuti cetak biru 21 tabel bersih ([schema.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/schema.md)):

### 2.1 Klaster 6: Luaran Penelitian (Class-Table Inheritance)
- **Tabel Induk `research_outputs`**:
  - `id`: BIGINT UNSIGNED PK
  - `id_proposal`: BIGINT UNSIGNED FK ke `proposals.id` (CASCADE)
  - `tipe_luaran`: ENUM ('Journal', 'Book', 'Hki', 'Product')
  - `target_status`: ENUM ('Wajib', 'Tambahan')
  - `status_verifikasi`: ENUM ('Draft', 'Submitted', 'Verified', 'Rejected')
  - `catatan_verifikasi`: TEXT nullable
  - `tanggal_pelaporan`: DATE nullable
  - `deleted_at`: SoftDeletes
- **Tabel Anak 1: `journal_outputs`** (1:1 ke `research_outputs`):
  - `id_research_output`: BIGINT UNSIGNED FK UNIQUE
  - `nama_jurnal`, `judul_artikel`, `issn` (nullable)
  - `indeksasi`: ENUM ('Scopus', 'Sinta_1' s.d. 'Sinta_4', 'Internasional', 'Nasional')
  - `status_publikasi`: ENUM ('Submitted', 'Accepted', 'Published')
  - `doi_url` (nullable), `file_artikel_path` (nullable)
- **Tabel Anak 2: `book_outputs`** (1:1 ke `research_outputs`):
  - `id_research_output`: BIGINT UNSIGNED FK UNIQUE
  - `judul_buku`, `isbn`, `penerbit`, `tahun_terbit`, `jumlah_halaman` (nullable), `file_cover_path` (nullable)
- **Tabel Anak 3: `hki_outputs`** (1:1 ke `research_outputs`):
  - `id_research_output`: BIGINT UNSIGNED FK UNIQUE
  - `judul_ciptaan`
  - `jenis_hki`: ENUM ('Hak_Cipta', 'Paten', 'Desain_Industri')
  - `nomor_pendaftaran` (nullable), `nomor_sertifikat` (nullable), `file_sertifikat_path` (nullable)
- **Tabel Anak 4: `product_outputs`** (1:1 ke `research_outputs`):
  - `id_research_output`: BIGINT UNSIGNED FK UNIQUE
  - `nama_produk`, `deskripsi_produk`, `tingkat_kesiapan_teknologi` (1-9), `dokumentasi_produk_path` (nullable)

### 2.2 Klaster 7: Evaluasi Akhir & SKTS
- **Tabel `evaluations`** (1:1 ke `proposals`):
  - `id`: BIGINT UNSIGNED PK
  - `id_proposal`: BIGINT UNSIGNED FK UNIQUE
  - `id_evaluator`: BIGINT UNSIGNED FK nullable ke `users.id` (SET NULL)
  - `file_laporan_akhir`: VARCHAR(255)
  - `ringkasan_hasil`: LONGTEXT
  - `persentase_capaian_luaran`: UNSIGNED INT default 0
  - `skor_akhir_substansi`: DECIMAL(5,2) default 0.00
  - `rekomendasi_kelulusan`: ENUM ('Lulus_Memuaskan', 'Lulus_Cukup', 'Tidak_Lulus') nullable
  - `nomor_skts`: VARCHAR(100) UNIQUE nullable
  - `file_skts_path`: VARCHAR(255) nullable
  - `status_penelitian`: ENUM ('Dalam_Evaluasi', 'Selesai', 'Gagal') default 'Dalam_Evaluasi'

---

## 3. Komponen Backend & Alur Bisnis

### 3.1 Penyelarasan Model Eloquent
1. `ResearchOutput.php`:
   - Hubungkan relasi: `belongsTo(Proposal::class, 'id_proposal')`, `hasOne(JournalOutput::class, 'id_research_output')`, `hasOne(BookOutput::class, 'id_research_output')`, `hasOne(HkiOutput::class, 'id_research_output')`, `hasOne(ProductOutput::class, 'id_research_output')`.
   - Gunakan trait `EnforcesReadOnlyArchive`.
2. `JournalOutput.php`, `BookOutput.php`, `HkiOutput.php`, `ProductOutput.php`:
   - `belongsTo(ResearchOutput::class, 'id_research_output')`.
   - Kolom fillable disesuaikan dengan migrasi bersih.
3. `Evaluation.php`:
   - Hubungkan relasi: `belongsTo(Proposal::class, 'id_proposal')`, `belongsTo(User::class, 'id_evaluator')`.
   - Cast skor_akhir_substansi ke float/decimal, persentase_capaian_luaran ke integer.

### 3.2 FormRequest & Validasi Defensif
1. **`StoreResearchOutputRequest.php`**:
   - Validasi `id_proposal`, `tipe_luaran` (Journal, Book, Hki, Product), `target_status` (Wajib, Tambahan).
   - Validasi berkas bukti PDF (maksimal 10MB, mime application/pdf, magic bytes `%PDF-`).
   - Validasi spesifik klaster:
     - Journal: `nama_jurnal`, `judul_artikel`, `indeksasi`, `status_publikasi`, `doi_url`.
     - Book: `judul_buku`, `isbn`, `penerbit`, `tahun_terbit`.
     - HKI: `judul_ciptaan`, `jenis_hki`, `nomor_pendaftaran`, `nomor_sertifikat`.
     - Product: `nama_produk`, `deskripsi_produk`, `tingkat_kesiapan_teknologi`.
   - **Output Deduplication Guard (Kasus Batas 10)**:
     - Normalisasi nilai kanonikal:
       - DOI: huruf kecil, trim spasi.
       - ISBN: hapus tanda strip `-` dan spasi.
       - Nomor HKI: huruf kapital, trim spasi.
     - Pengecekan duplikasi pada level institusi:
       ```php
       $universityId = $proposal->university_id;
       // DOI duplicate check
       JournalOutput::where('doi_url', $cleanDoi)
           ->whereHas('researchOutput.proposal', fn($q) => $q->where('university_id', $universityId))
           ->exists();
       ```
     - Jika duplikasi terdeteksi, melempar pesan validasi: `[DUPLIKASI] Identifikasi luaran ini telah terdaftar pada usulan penelitian lain di universitas ini.`
2. **`VerifyOutputRequest.php`**:
   - `status_verifikasi`: `Verified` atau `Rejected`.
   - `catatan_verifikasi`: Wajib jika `Rejected`.
3. **`StoreFinalEvaluationRequest.php`**:
   - `file_laporan_akhir`: Wajib PDF, max 10MB, magic bytes.
   - `ringkasan_hasil`: Wajib text minimal 100 karakter.
   - **Prasyarat Kumulatif (Precondition Guard)**:
     - Minimal terdapat 1 luaran bertarget `Wajib`.
     - Seluruh luaran bertarget `Wajib` pada proposal HARUS berstatus `Verified`.
     - Jika belum terpenuhi, tolak dengan HTTP 422: `[BLOKIR] Pengajuan evaluasi akhir diblokir. Seluruh luaran wajib harus telah berstatus Terverifikasi (Verified) oleh LPPM.`
4. **`GenerateSktsRequest.php`**:
   - `rekomendasi_kelulusan`: in: `Lulus_Memuaskan`, `Lulus_Cukup`.
   - `skor_akhir_substansi`: numeric 0 - 100.
   - Nomor SKTS di-generate sistem: `SKTS/{KODE_KAMPUS}/{TAHUN}/{ID_PROPOSAL}`.
5. **`TerminateResearchRequest.php` (Force Majeure - Kasus Batas 11)**:
   - `alasan_terminasi`: string minimal 20 karakter.
   - `berita_acara_path`: file PDF dokumen penutupan/SPTJM.
   - Membatalkan termin pendanaan berstatus `Pending` menjadi `Cancelled`.
   - Memperbarui status proposal/kontrak menjadi tertutup/gagal dan status evaluasi menjadi `Gagal`.

### 3.3 Penegakan Read-Only Archive Lock (Kasus Batas Kritis)
- **Trait `EnforcesReadOnlyArchive.php`**:
  - Diterapkan pada `Proposal`, `Contract`, `Funding`, `ProgressReport`, `ResearchOutput`.
  - Mencegat event Eloquent `updating` dan `deleting`.
  - Memeriksa apakah proposal terkait telah memiliki rekaman evaluasi dengan `status_penelitian === 'Selesai'`.
  - Jika ya, eksekusi dihentikan dengan melempar `abort(403, '[TERKUNCI] Data usulan telah berstatus Selesai dan terkunci permanen sebagai Arsip Baca-Saja.');`.
- **Policy Guard**:
  - `ProposalPolicy`, `ContractPolicy`, `ResearchOutputPolicy`, `ProgressReportPolicy` memeriksa kondisi yang sama dan mengembalikan `Response::deny('[TERKUNCI] Riset telah selesai dan diarsipkan baca-saja.')`.

### 3.4 Controller & Rute
1. `OutputController.php`:
   - `index`: Daftar luaran untuk proposal tertentu atau milik dosen login.
   - `store`: Menyimpan luaran induk dan detail anak sesuai klaster yang dipilih.
   - `update`: Memperbarui draf luaran (dicegat jika terkunci arsip).
   - `destroy`: Menghapus draf luaran (dicegat jika terkunci arsip).
2. `Admin/OutputVerifyController.php`:
   - `index`: Antarmuka matriks verifikasi luaran untuk Admin Kampus/LPPM.
   - `verify`: Mengubah status menjadi `Verified` atau `Rejected` disertai catatan.
3. `EvaluationController.php`:
   - `show`: Menampilkan status evaluasi akhir, daftar luaran, form unggah laporan akhir.
   - `store`: Penyerahan laporan akhir 100% oleh dosen pengusul.
4. `Admin/SktsController.php`:
   - `evaluate`: Penilaian akhir oleh evaluator/LPPM.
   - `generateSkts`: Pengesahan kelulusan dan penerbitan nomor SKTS institusi.
   - `terminateForceMajeure`: Penutupan riset akibat kondisi kahar / gagal.

---

## 4. Komponen Frontend (UI/UX & Desain Hybrid Scholarly Enterprise)

### 4.1 Halaman & Komponen React/Inertia
1. **`resources/js/Pages/Output/Index.tsx`**:
   - Matriks rekapitulasi luaran: Indikator Luaran Wajib vs Tambahan.
   - Status badge standar: `[DRAFT]`, `[SUBMITTED]`, `[VERIFIED]`, `[REJECTED]`.
   - Tombol "Tambah Luaran" membuka `CreateModal.tsx`.
2. **`resources/js/Pages/Output/CreateModal.tsx`**:
   - Pemilih tipe luaran (Tab / Segmented: Jurnal, Buku, HKI, Produk).
   - Input formulir dinamis sesuai klaster dengan validasi inline.
   - Komponen `PDFUploader` standar (max 10MB).
3. **`resources/js/Pages/Admin/Output/Verify.tsx`**:
   - Tabel verifikasi matriks luaran seluruh proposal.
   - Pratinjau berkas digital split-screen viewer / modal.
   - Aksi Verifikasi: dialog konfirmasi `Verified` atau form alasan `Rejected`.
4. **`resources/js/Pages/Evaluation/Show.tsx`**:
   - Status evaluasi akhir riset dosen.
   - Banner permanen `[ARSIP BACA-SAJA]` jika status penelitian telah `Selesai`.
   - Tautan langsung melihat / mencetak sertifikat SKTS resmi.
5. **`resources/js/Pages/Evaluation/SktsCertificate.tsx`**:
   - Format sertifikat digital resmi:
     - Tipografi ganda: Judul dan isi formal menggunakan font serif (*Merriweather* / serif fallback), nomor SKTS monospace tabular.
     - Kop surat resmi tenant universitas.
     - QR Code integritas dokumen (URL verifikasi tanda tangan digital).
     - Rincian kelulusan: Judul penelitian, Ketua pengusul, NIDN, Skema, Nilai Akhir, Predikat Kelulusan.

### 4.2 Internasionalisasi (i18n) & Zero Emoji
- Seluruh teks didaftarkan pada `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`.
- Penyematan `<LanguageSwitcher />` pada layout.
- 0% emoji: visual menggunakan teks terstruktur (`[WAJIB]`, `[ARSIP BACA-SAJA]`, `[TERVERIFIKASI]`) dan ikon Lucide React.

---

## 5. Rencana Pengujian Mutu (Quality Gate)

Dibuat 3 rangkaian pengujian PHPUnit Feature Test:
1. **`tests/Feature/OutputDeduplicationTest.php`**:
   - Menguji bahwa pendaftaran artikel jurnal dengan DOI yang sama pada dua proposal berbeda dalam universitas yang sama ditolak (HTTP 422 / validation error).
   - Menguji bahwa pendaftaran buku dengan ISBN yang sama pada dua proposal berbeda ditolak.
   - Menguji bahwa nomor sertifikat HKI yang sama ditolak.
2. **`tests/Feature/FinalEvaluationPreconditionTest.php`**:
   - Menguji bahwa penyerahan laporan akhir diblokir jika proposal tidak memiliki luaran Wajib sama sekali.
   - Menguji bahwa evaluasi akhir diblokir jika luaran Wajib masih berstatus `Submitted` atau `Rejected`.
   - Menguji bahwa penyerahan laporan akhir berhasil ketika seluruh luaran Wajib telah berstatus `Verified`.
3. **`tests/Feature/ReadOnlyArchiveLockTest.php`**:
   - Menguji bahwa setelah SKTS diterbitkan (`status_penelitian = 'Selesai'`), percobaan `PUT/PATCH` ke proposal menghasilkan HTTP 403.
   - Menguji bahwa percobaan edit kontrak atau penambahan luaran baru setelah SKTS menghasilkan HTTP 403.
   - Menguji bahwa percobaan hapus proposal atau berkas dokumen setelah SKTS menghasilkan HTTP 403.
