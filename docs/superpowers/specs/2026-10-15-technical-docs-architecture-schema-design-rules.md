# Desain Teknis Arsitektur & Spesifikasi Dokumentasi: Architecture, Schema, Design, dan Rules

- **Dokumen Referensi Utama**: `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`
- **Tanggal Efektif**: 15 Oktober 2026
- **Status Dokumen**: Disetujui (Approved Baseline)
- **Target Direktori Dokumentasi**: `docs/technical/`
- **Cabang Git Target**: `refactor/standalone-research-purge`

---

## 1. Latar Belakang & Ruang Lingkup

Setelah pemisahan total (*clean purge*) dari modul OJS (Kelas G) dan modul warisan JurnalMu pada repositori `litabmas-muhammadiyah`, platform ditransformasikan menjadi aplikasi web mandiri (*standalone*) multi-institusi untuk tata kelola siklus riset perguruan tinggi (*Multi-Institution SIM-Penelitian*).

Untuk memastikan pengembangan sistem berjalan dengan arsitektur yang kokoh, konsisten, dan mudah dipahami oleh seluruh pengembang (frontend, backend, database engineer, dan QA), dirancang 4 berkas dokumentasi teknis spesifik di bawah direktori `docs/technical/`:
1. `docs/technical/architecture.md`: Cetak biru arsitektur sistem, tenancy, stack teknologi, RBAC, dan alur siklus hidup penelitian.
2. `docs/technical/schema.md`: Kamus data lengkap 21 tabel bersih, diagram ERD Mermaid, relasi kunci asing, dan strategi pengindeksan.
3. `docs/technical/design.md`: Sistem desain antarmuka dan pengalaman pengguna (*Hybrid Scholarly Enterprise*), token desain, tipografi ganda, cetak biru tata letak per modul, dan persyaratan pratinjau komponen.
4. `docs/technical/rules.md`: Aturan bisnis 6 fase riset, penanganan defensif 11 kasus batas (*edge cases*), invarian keamanan, serta standar kualitas koding.
5. `docs/technical/README.md`: Berkas indeks dan penghubung antar-dokumen teknis (*navigation hub*).

---

## 2. Rincian Cetak Biru Berkas Dokumentasi

### 2.1 Cetak Biru `docs/technical/architecture.md`

#### Struktur & Bagian Dokumen:
1. **Informasi Sistem & Dekopling Mandiri**:
   - Metadata sistem: Versi 2.0.0-STANDALONE.
   - Dekopling 100% dari modul Submission OJS dan JurnalMu Dikti.
   - Fokus tata kelola pada 6 fase riset LPPM perguruan tinggi.
2. **Stack Teknologi & Lingkungan Eksekusi**:
   - Backend: Laravel 12 (PHP 8.4 via Docker / PHP 8.2+ kompatibel), Eloquent ORM.
   - Frontend: React 19, TypeScript, Inertia.js 2.0 (arsitektur monolitik modern berbasis page props).
   - Styling: Tailwind CSS 4, pustaka komponen shadcn/ui, Lucide React Icons (standar tanpa emoji).
   - Bundler: Vite 6+.
   - Database: MySQL 8.0+ / MariaDB 10.4+ InnoDB dengan UTF8MB4.
   - Kontainerisasi: `docker-compose.yml` (layanan Nginx, PHP 8.4-FPM, MySQL 8.0).
   - File Storage: Streaming controller via rute `/storage/{path}` untuk keamanan dan portabilitas berkas riset lintas sistem operasi (Windows host dev & Linux Docker/prod).
3. **Model Isolasi Multi-Institusi (Multi-Tenancy Architecture)**:
   - Pola Tenancy: *Shared Database, Separate Tenancy* berbasis entitas `universities`.
   - Tenant Foreign Key: Kolom `university_id` pada seluruh entitas utama (`users`, `research_schemas`, `proposals`, `contracts`, `monev_schedules`, `activity_logs`).
   - Tenant Scoping: Laravel Eloquent Global Scope (`TenantScope`) yang secara otomatis menyaring seluruh kueri database berdasarkan `auth()->user()->university_id` untuk semua peran non-Super Admin.
   - Pengecualian Super Admin: Bebas dari tenant scope untuk keperluan manajemen master data global.
4. **Hierarki Peran & Otorisasi Pengguna (RBAC)**:
   - 5 Peran Operasional: Super Admin, Admin Kampus (LPPM), Admin Keuangan (Finance), Reviewer (Penilai Ahli), dan Peneliti (Dosen).
   - Model Pengguna Hibrida: Kompatibilitas ganda kolom `role_id` (legacy) dan relasi tabel pivot `role_user` via helper method `$user->hasRole()` dan `$user->hasAnyRole()`.
   - Dual-Layer Authorization Guard:
     - Lapisan 1: Rute Middleware Laravel (`role:XXX`) pada `routes/web.php`.
     - Lapisan 2: Policy & Gate pada setiap aksi controller method.
5. **Diagram Alur Siklus Hidup Penelitian (Lifecycle Data Flow)**:
   - Diagram Mermaid Flowchart yang menghubungkan alur transaksional 6 modul riset secara end-to-end.
6. **Audit Trail & Observabilitas**:
   - Pencatatan otomatis ke tabel `activity_logs` (`user_id`, `university_id`, aksi, `ip_address`, `user_agent`).
   - Sistem notifikasi transaksional terpusat pada tabel `notifications`.

---

### 2.2 Cetak Biru `docs/technical/schema.md`

#### Struktur & Bagian Dokumen:
1. **Ikhtisar Basis Data Bersih (Clean 21 Tables Overview)**:
   - Eliminasi tuntas dari tabel warisan OJS & JurnalMu.
   - Konsolidasi menjadi **21 tabel aplikasi inti** ditambah 4 tabel bawaan Laravel (`sessions`, `cache`, `password_reset_tokens`, `jobs`).
   - Konvensi tipe data: `BIGINT UNSIGNED` untuk primary & foreign key, `DECIMAL(15,2)` untuk nominal keuangan, `DATE` untuk batas waktu, dan `JSON` untuk rubrik fleksibel.
2. **Diagram Relasi Entitas (ERD Mermaid Komprehensif)**:
   - Visualisasi grafis hubungan antar 21 tabel:
     - `universities` memayungi `users`, `research_schemas`, `proposals`, `contracts`, `monev_schedules`, dan `activity_logs`.
     - `users` berelasi dengan `roles` melalui `role_user`, serta menjadi pengusul `proposals`, penilai `reviews`, dan evaluator `evaluations`.
     - `proposals` memiliki relasi one-to-many ke `proposal_documents`, `reviews`, `progress_reports`, dan `research_outputs`; serta one-to-one ke `contracts` dan `evaluations`.
     - `contracts` one-to-many ke `fundings`.
     - `monev_schedules` one-to-many ke `progress_reports`.
     - `research_outputs` (tabel induk) one-to-one ke tabel anak: `journal_outputs`, `book_outputs`, `hki_outputs`, dan `product_outputs`.
3. **Kamus Data Rinci 21 Tabel (Data Dictionary)**:
   - Tabel spesifikasi kolom lengkap (Nama Kolom, Tipe Data, Nullable, Default, Constraint & Deskripsi) yang dikelompokkan ke dalam 7 klaster:
     - Klaster 1 (Inti & Tenancy): `universities`, `roles`, `users`, `role_user`, `activity_logs`, `notifications`.
     - Klaster 2 (Modul 1 - Skema & Proposal): `research_schemas`, `proposals`, `proposal_documents`.
     - Klaster 3 (Modul 2 - Review & Penilaian): `assessment_criteria`, `reviews`.
     - Klaster 4 (Modul 3 - Kontrak & Keuangan): `contracts`, `fundings`.
     - Klaster 5 (Modul 4 - Monev & Logbook): `monev_schedules`, `progress_reports`.
     - Klaster 6 (Modul 5 - Luaran Riset): `research_outputs`, `journal_outputs`, `book_outputs`, `hki_outputs`, `product_outputs`.
     - Klaster 7 (Modul 6 - Evaluasi Akhir & SKTS): `evaluations`.
4. **Strategi Kunci Asing & Integritas Relasi (Foreign Key Constraints)**:
   - Aksi `CASCADE`: Untuk entitas anak eksklusif (proposal -> dokumen, reviews, laporan progres, luaran).
   - Aksi `RESTRICT`: Untuk entitas referensi utama yang tidak boleh dihapus jika memiliki transaksi aktif (skema penelitian yang sudah ada usulan, jadwal monev yang sudah ada laporan progres).
   - Aksi `SET NULL`: Untuk pencatatan audit log saat akun pengguna dihapus.
5. **Strategi Pengindeksan & Batasan Keunikan (Indexing & Constraints)**:
   - Indeks unik: `universities.code`, `roles.name`, `users.email`, `contracts.nomor_kontrak`, `evaluations.nomor_skts`.
   - Relasi 1:1 unik: `contracts.id_proposal`, `evaluations.id_proposal`, dan `id_research_output` pada masing-masing tabel anak luaran.
   - Komposit indeks performa: `(university_id, status_proposal)` pada tabel `proposals`, `(id_proposal, status_laporan)` pada `progress_reports`.
6. **Pemetaan Model Eloquent**:
   - Pemetaan 21 model pada `app/Models/` beserta casts dan accessors untuk format rupiah dan tanggal Indonesia.

---

### 2.3 Cetak Biru `docs/technical/design.md`

#### Struktur & Bagian Dokumen:
1. **Sistem Desain Terpilih: "Hybrid Scholarly Enterprise"**:
   - Mengintegrasikan kaidah intelijensi desain **/ui-ux-pro-max** dan filosofi anti-slop **/design-taste-frontend**.
   - Menghadirkan keseimbangan antara rasa percaya institusi akademik, kedalaman literasi ilmiah, dan kemudahan eksekusi teknis menggunakan Tailwind CSS 4 + shadcn/ui.
2. **Spesifikasi Token Desain & Palet Warna**:
   - Basis Palet Cool Slate:
     - `surface-base`: `#F8FAFC` (Slate 50) untuk kanvas utama.
     - `surface-card`: `#FFFFFF` (Pure White) untuk kartu data dan formulir.
     - `surface-elevated`: `#F1F5F9` (Slate 100) untuk header tabel dan popover.
     - `border-subtle`: `#E2E8F0` (Slate 200) untuk garis pemisah 1px yang tegas.
     - `brand-primary`: `#1E3A8A` (Deep Academic Navy) untuk tombol utama, link aktif, dan aksen institusi.
     - `brand-accent`: `#059669` (Emerald 600) untuk status lolos didanai, dana cair, dan berkas terverifikasi.
     - `text-primary`: `#0F172A` (Slate 900) dengan kontras 12:1 (WCAG AAA).
     - `text-secondary`: `#475569` (Slate 600) untuk teks penjelasan dan label.
   - Kartu & Elevasi:
     - Sudut kontainer: `rounded-lg` (8px).
     - Elevasi bayangan: Bayangan mikro halus (`shadow-xs` dan `shadow-sm`), menghindari bayangan tebal.
3. **Disiplin Tipografi Hibrida (Dual Personality)**:
   - `font-serif` (Newsreader / Merriweather): Khusus untuk Judul Skema, Judul Usulan Riset Dosen pada halaman detail, Abstrak, Kutipan Luaran Jurnal/Buku, dan Sertifikat SKTS resmi.
   - `font-sans` (Plus Jakarta Sans / Inter): Untuk seluruh navigasi sidebar, tombol aksi, input formulir, teks bantuan, dan badge status.
   - `font-mono tabular-nums`: Untuk angka anggaran dana (Rupiah), skor rubrik (0-100), nomor kontrak, dan tanggal agar tabel tidak mengalami pergeseran tata letak (*zero CLS*).
4. **Disiplin Aset Visual & Larangan Emoji Mutlak**:
   - Larangan keras terhadap penggunaan emoji apa pun pada seluruh komponen UI.
   - Seluruh status menggunakan lencana teks terstruktur + ikon vektor SVG Lucide React (`stroke-width`: 1.5px - 2.0px).
5. **Persyaratan Wajib: Pratinjau Sistem Desain & Komponen Pakai-Ulang (Preview Gate)**:
   - Sebelum mengimplementasikan layar antarmuka modul riset secara menyeluruh, pengembang **WAJIB** membuat halaman/katalog pratinjau sistem desain (*design system preview & reusable components*) yang memvalidasi komponen atom/molekul:
     - `StatusBadge`: Pemetaan lencana status lengkap (Draft, Submitted, Valid, Funded, Disbursed, Verified, dll.).
     - `PDFUploader`: Komponen unggah drag-and-drop dengan verifikasi batas 10MB dan ekstensi `.pdf`.
     - `TabularFigure`: Format angka rupiah dan skor dengan font monospaced tanpa pergeseran layout.
     - `MetricCard`: Kartu metrik bento dengan indikator tren dan ikon Lucide.
     - `PageHeader`: Header halaman yang menyertakan breadcrumbs dan judul hibrida (Serif/Sans).
     - `SplitScreenViewer`: Komponen tata letak layar terbagi untuk ruang kerja reviewer.
6. **Cetak Biru Komposisi Halaman Modul (Anti-Generic Blueprints)**:
   - Dasbor Peneliti: Tata letak bento-grid berorientasi aksi (progres stepper, countdown skema aktif, ringkasan luaran).
   - Wizard Usulan Riset (Modul 1): Formulir multi-langkah linier dengan penyimpanan draf otomatis (*auto-save*).
   - Workspace Reviewer (Modul 2): Antarmuka *split-screen* (Viewer PDF 60% di kiri, formulir rubrik kriteria interaktif 40% di kanan).
   - Visualisasi Keuangan (Modul 3): Alur linier termin (70% vs 30%) dengan indikator pengunci Monev (*Monev Gatekeeper Lock*).
   - Verifikasi Luaran & SKTS (Modul 5 & 6): Kartu verifikasi luaran terklasifikasi dan sertifikasi penutupan berkas berstatus arsip baca-saja (*Read-Only Archive*).
7. **Pola Formulir & Interaktivitas Inertia `useForm`**:
   - Tombol submit dinonaktifkan otomatis saat `processing` untuk mencegah submit ganda.
   - Peringatan perubahan belum tersimpan (*dirty state confirm*) saat meninggalkan form.
   - Validasi inline saat *blur* dengan auto-focus pada field pertama yang error.

---

### 2.4 Cetak Biru `docs/technical/rules.md`

#### Struktur & Bagian Dokumen:
1. **Aturan Bisnis 6 Fase Siklus Hidup Penelitian**:
   - Fase 1: Batasan tenant skema, keunikan judul proposal per tahun anggaran, penguncian edit proposal berstatus `Submitted`, penolakan otomatis jika melewati batas waktu skema.
   - Fase 2: Penunjukan 1-2 reviewer per usulan, *Conflict of Interest (CoI) Guard* (`id_reviewer != id_pengusul`), rentang skor rubrik standar (0-100), opsi putusan: `Diterima`, `Ditolak`, `Revisi`.
   - Fase 3: Kontrak hanya untuk usulan `Lolos_Didanai`, konsistensi pembagian dana 100% (Termin 1: 70%, Termin 2: 30%), *Monev Gatekeeper Lock* (pencairan Termin 2 diblokir sebelum Monev disetujui), bukti transfer bank wajib dilampirkan sebelum status `Disbursed`.
   - Fase 4: Pengunggahan progres hanya selama rentang jadwal Monev aktif, berkas format PDF (maks. 10MB), persentase kemajuan riil 1%-100%.
   - Fase 5: Kewajiban pemenuhan minimal 1 luaran `Wajib`, verifikasi administratif/substansi oleh LPPM sebelum status menjadi `Verified`, pencegahan klaim luaran ganda berbasis keunikan DOI/ISBN/HKI.
   - Fase 6: Prasyarat evaluasi akhir (laporan 100% & seluruh luaran wajib terverifikasi), status kelulusan (`Lulus_Memuaskan`, `Lulus_Cukup`, `Tidak_Lulus`), penguncian permanen proposal & kontrak pasca-penerbitan SKTS (*Read-Only Archive Lock*).
2. **Penanganan Defensif 11 Kasus Batas Kritis (Edge Cases Handling)**:
   - Kasus 1: Manipulasi Akses Lintas Kampus (IDOR via URL) -> Dicegat `TenantScope` Eloquent & Policy (403/404).
   - Kasus 2: Konflik Kepentingan Reviewer -> Penggagalan plotting otomatis pada controller.
   - Kasus 3: Universitas Dinonaktifkan -> Pencegahan login civitas oleh middleware otentikasi.
   - Kasus 4: Batas Waktu Skema Berakhir Saat Mengisi Form -> Validasi backend `StoreProposalRequest` memeriksa `now() <= schema.tanggal_selesai`.
   - Kasus 5: Kirim Ganda Akibat Koneksi Lemah -> Tombol disabled di frontend + DB unique constraint.
   - Kasus 6: Reviewer Mangkir / Terlambat -> Lencana *Overdue* + fungsi cabut dan alihkan penugasan (*re-assign*).
   - Kasus 7: Perbedaan Skor Ekstrem Antar Dua Reviewer (selisih > 30 poin) -> Notifikasi *Discrepancy Warning* untuk penunjukan Reviewer ke-3 (*tie-breaker*).
   - Kasus 8: Penyesuaian Anggaran Pasca-Review (Budget Cut) -> Penyimpanan nilai riil pada `dana_disetujui`, persentase termin dihitung dari nilai keputusan tersebut.
   - Kasus 9: Permintaan Pencairan Termin 2 Tanpa Kelulusan Monev -> Backend melempar error 422 *Unprocessable Content*.
   - Kasus 10: Klaim Luaran Ganda -> Validasi keunikan DOI, ISBN, dan nomor permohonan HKI per institusi.
   - Kasus 11: Penelitian Gagal / Force Majeure -> Evaluasi akhir berstatus `Gagal`, pembatalan sisa dana termin, dan penerbitan surat penutupan khusus dengan audit pengembalian dana.
3. **Invarian Keamanan & Validasi Sistem (Security Invariants)**:
   - Dual-Layer Authorization Guard: Route middleware (`role:XXX`) + Controller Policy.
   - Ekstensi berkas wajib `.pdf` dengan ukuran maksimum 10MB untuk seluruh berkas riset.
   - Proteksi CSRF penuh pada seluruh transmisi Inertia.
4. **Standar Koding & Pengujian (Quality & Coding Gates)**:
   - FormRequest terpisah di `app/Http/Requests/` untuk seluruh aksi mutasi data.
   - Strict typing dan penggunaan Eloquent Accessors untuk kompatibilitas frontend.
   - Pengujian otomatis PHPUnit Feature Tests (skenario positif dan negatif per peran).
   - Larangan emoji mutlak pada seluruh output sistem.

---

### 2.5 Cetak Biru `docs/technical/README.md`

#### Struktur Dokumen:
- Berkas gerbang (*entry point*) ringkas yang menyajikan tabel navigasi silang ke keempat dokumen teknis di atas (`architecture.md`, `schema.md`, `design.md`, `rules.md`), status kepatuhan terhadap PRD utama (`docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`), dan panduan kontribusi bagi tim pengembang.

---

## 3. Rencana Eksekusi Penulisan Berkas

Penulisan berkas fisik akan dilakukan secara berurutan sesuai alur kerja berikut:
1. **Langkah 1**: Membuat direktori `docs/technical/` jika belum tersedia.
2. **Langkah 2**: Menulis `docs/technical/architecture.md`.
3. **Langkah 3**: Menulis `docs/technical/schema.md`.
4. **Langkah 4**: Menulis `docs/technical/design.md`.
5. **Langkah 5**: Menulis `docs/technical/rules.md`.
6. **Langkah 6**: Menulis `docs/technical/README.md` dan memperbarui `docs/INDEX.md` agar mencantumkan subdirektori teknis baru ini.
7. **Langkah 7**: Melakukan verifikasi linting markdown, integritas tautan rujukan (*relative links*), dan komitmen git.

---

## 4. Kriteria Keberhasilan & Verifikasi Penerimaan

Dokumen teknis dinyatakan selesai dan valid jika memenuhi kriteria berikut:
1. Seluruh berkas tersimpan rapi pada direktori `docs/technical/` dan dapat diakses dengan tautan markdown aktif.
2. Tidak ada simbol visual emoji apa pun pada kelima berkas dokumentasi tersebut.
3. Seluruh 21 tabel dan relasi pada `schema.md` selaras 100% dengan migrasi database aktif di `database/migrations/`.
4. Sistem desain "Hybrid Scholarly Enterprise" pada `design.md` memuat panduan token warna, tipografi ganda, dan instruksi wajib pembuatan pratinjau komponen sebelum pembuatan antarmuka modul.
5. Seluruh 11 penanganan kasus batas pada `rules.md` mencerminkan spesifikasi Bab 9 PRD.
