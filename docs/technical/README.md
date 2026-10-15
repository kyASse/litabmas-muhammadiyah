# Dokumentasi Teknis Sistem Penelitian Terintegrasi Standalone

## 1. Informasi Dokumen & Metadata Sistem

- **Nama Sistem**: Sistem Penelitian Terintegrasi Multi-Kampus (*Multi-Institution Research Management System* / SIM-Penelitian)
- **Versi Sistem**: 2.0.0-STANDALONE
- **Status Dokumen**: Disetujui (Approved Baseline)
- **Tanggal Efektif**: 15 Oktober 2026
- **Target Repositori**: `litabmas-muhammadiyah` (Repositori Mandiri Hasil Dekopling)
- **Dokumen Referensi Utama**: [Product Requirement Document (PRD) Standalone](../PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)

---

## 2. Ikhtisar Sistem Mandiri Multi-Institusi

Sistem Penelitian Terintegrasi Standalone merupakan platform aplikasi web mandiri untuk tata kelola siklus riset dan pengabdian masyarakat (LPPM) pada institusi perguruan tinggi. Sistem ini dibangun melalui pemisahan total (*clean purge*) dari modul warisan JurnalMu (akreditasi dan pembinaan jurnal Dikti) serta modul Submission System OJS (Kelas G).

Platform ini mengadopsi model multi-institusi (*multi-tenancy*) berbasis entitas universitas (*Shared Database, Separate Tenancy*), memungkinkan berbagai perguruan tinggi mengelola program riset institusional secara aman, terisolasi, dan terpusat dalam satu infrastruktur komputasi.

### Cakupan 6 Fase Inti Siklus Hidup Penelitian

1. **Fase 1: Pengelolaan Skema & Pengajuan Proposal**
   Konfigurasi pagu anggaran, periode penerimaan usulan, pengunggahan proposal penelitian (format PDF, batas maksimal 10MB), serta penyusunan profil anggota tim dosen pengusul.
2. **Fase 2: Penugasan Reviewer & Penilaian Kriteria Substansi**
   Penetapan penilai ahli (*blind review* atau penugasan ganda), evaluasi matriks rubrik berbasis skor bobot (skala 1-100), pencegahan konflik kepentingan reviewer, serta penentuan status kelolosan (*Lolos_Didanai*, *Revisi*, *Ditolak*).
3. **Fase 3: Penerbitan Kontrak & Pencairan Dana Bertahap**
   Penerbitan surat perjanjian kerja/kontrak formal dengan nomor registrasi unik institusional, komitmen pembagian dana bertahap (Termin 1 sebesar 70% dan Termin 2 sebesar 30%), pengunggahan bukti transfer bank, serta mekanisme penguncian (*Monev Gatekeeper Lock*).
4. **Fase 4: Monitoring dan Evaluasi (Monev) Pelaksanaan Riset**
   Penjadwalan seminar/visitasi monev, pengunggahan berkas laporan kemajuan dan catatan aktivitas logbook penelitian, serta verifikasi kelayakan pelaksanaan riset.
5. **Fase 5: Pelaporan & Validasi Luaran Ilmiah**
   Pencatatan luaran penelitian wajib dan luaran tambahan (publikasi artikel jurnal ilmiah bereputasi, buku ber-ISBN, sertifikat HKI/paten, dan produk teknologi terapan) yang diverifikasi langsung oleh tim LPPM dengan validasi pencegahan klaim ganda.
6. **Fase 6: Evaluasi Akhir Penelitian & Penerbitan SKTS**
   Penilaian laporan akhir 100%, evaluasi status kelulusan penelitian (*Lulus_Memuaskan*, *Lulus_Cukup*, *Tidak_Lulus*), penerbitan Surat Keterangan Tanda Selesai (SKTS) berpenomoran unik institusi, serta penguncian permanen berkas riset (*Read-Only Archive Lock*).

---

## 3. Matriks Navigasi Dokumentasi Teknis

Dokumentasi teknis diorganisasi ke dalam 4 berkas spesifikasi modular di bawah direktori `docs/technical/`:

| Dokumen | Berkas Sumber | Fokus & Cakupan Utama | Sasaran Pengembang |
|---------|---------------|----------------------|-------------------|
| **Cetak Biru Arsitektur** | [architecture.md](./architecture.md) | Arsitektur sistem monolit modern Laravel 12 + React 19 + Inertia 2.0, isolasi tenant (`university_id` & `TenantScope`), otorisasi 5 peran pengguna (RBAC), diagram aliran data 6 fase, infrastruktur Docker, dan mekanisme audit trail. | Backend Lead, DevOps, System Architect |
| **Kamus Data & Skema Basis Data** | [schema.md](./schema.md) | Kamus data 21 tabel aplikasi bersih, Diagram Relasi Entitas (ERD Mermaid), integritas kunci asing (`CASCADE`, `RESTRICT`, `SET NULL`), batasan keunikan, komposit indeks performa, dan pemetaan Model Eloquent. | Backend Developer, Database Administrator |
| **Sistem Desain Antarmuka & UX** | [design.md](./design.md) | Sistem desain *Hybrid Scholarly Enterprise*, palet warna Cool Slate, tipografi ganda (Serif untuk judul/abstrak dan Sans untuk form/UI), token elevation, cetak biru antarmuka 6 fase, serta standar wajib *Design System Component Preview Gate*. | Frontend Developer, UI/UX Designer |
| **Aturan Bisnis & Penanganan Kasus Batas** | [rules.md](./rules.md) | Validasi transaksional 6 fase riset, penanganan defensif 11 kasus batas kritis (*edge cases*), invarian keamanan sistem (Dual-Layer Guard, verifikasi PDF, CSRF), dan standar kualitas koding (FormRequest, PHPUnit). | Fullstack Developer, QA Test Engineer |

Selain keempat dokumen di atas, kebutuhan fungsional dan landasan perombakan sistem merujuk pada:
- **Spesifikasi Kebutuhan Produk Lengkap**: [PRD Sistem Penelitian Terintegrasi Standalone](../PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)

---

## 4. Ringkasan Eksekutif Setiap Berkas Dokumentasi

### 4.1 Cetak Biru Arsitektur (`architecture.md`)
Menguraikan struktur teknis sistem berbasis monolit modern:
- **Teknologi Utama**: Laravel 12 (PHP 8.4 Docker / PHP 8.2+ native), React 19, TypeScript, Inertia.js 2.0, Vite 6+, dan Tailwind CSS 4.
- **Isolasi Multi-Tenancy**: Menggunakan pola *Shared Database, Separate Tenancy* yang mengunci data pada `university_id` via global scope Eloquent `TenantScope`. Akun Super Admin mendapatkan pengecualian untuk manajemen master data antar-institusi.
- **RBAC & Otorisasi**: Mendukung 5 peran (Super Admin, Admin Kampus, Admin Keuangan, Reviewer, dan Peneliti) dengan dual-layer guard: proteksi middleware rute (`role:XXX`) dan otorisasi internal controller policy.
- **Alur Siklus Hidup**: Diagram Mermaid komprehensif yang memetakan keterkaitan transaksional antar-fase dari pengusulan proposal hingga penerbitan SKTS.

### 4.2 Kamus Data & Skema Basis Data (`schema.md`)
Menjadi referensi tunggal struktur basis data setelah pembersihan tabel lama:
- **21 Tabel Bersih**: Dikelompokkan ke dalam 7 klaster (Inti & Tenancy, Skema & Proposal, Review & Penilaian, Kontrak & Keuangan, Monev & Progres, Luaran Riset, serta Evaluasi Akhir & SKTS).
- **Integritas Relasi**: Penegakan aturan kunci asing eksplisit (`RESTRICT` untuk skema aktif, `CASCADE` untuk dokumen dan luaran anak, `SET NULL` untuk jejak audit pengguna terhapus).
- **Optimasi Indeks**: Penerapan komposit indeks performa tinggi pada kueri tenant frekuensi tinggi seperti `(university_id, status_proposal)` dan `(id_proposal, status_laporan)`.

### 4.3 Sistem Desain Antarmuka & UX (`design.md`)
Menetapkan standar visual institusional berbasis *Hybrid Scholarly Enterprise*:
- **Nuansa & Estetika**: Mengombinasikan ketegasan korporat (*Cool Slate palette*) dengan keanggunan akademis (*Scholarly dual typography*).
- **Tipografi Ganda**: Font Serif (*Merriweather / Source Serif*) untuk judul penelitian, sitasi, dan abstrak; Font Sans (*Inter*) untuk elemen fungsional, navigasi, metrik data, dan formulir input.
- **Design System Component Preview Gate**: Kewajiban implementasi halaman katalog pratinjau komponen visual terisolasi sebelum pembangunan halaman fitur individual.

### 4.4 Aturan Bisnis & Penanganan Kasus Batas (`rules.md`)
Menjelaskan aturan logika bisnis defensif untuk menjamin integritas data:
- **Aturan Transaksional 6 Fase**: Batasan tahapan riset yang tidak dapat dilewati secara sepihak, konsistensi termin pembayaran, dan prasyarat kelulusan evaluasi akhir.
- **11 Kasus Batas Kritis**: Penanganan pencegahan IDOR lintas kampus, eliminasi konflik kepentingan reviewer, proteksi kampus nonaktif, batas waktu tenggat skema, pencegahan kirim ganda (*double submission*), mitigasi reviewer mangkir, rekonsiliasi diskrepansi skor ekstrem antar-penilai, penyesuaian pemotongan anggaran (*budget cut*), blokade pencairan termin sebelum monev lulus, pencegahan klaim luaran ganda, dan prosedur riset gagal (*force majeure*).
- **Invarian Keamanan**: Ekstensi file wajib `.pdf` (maks. 10MB), verifikasi CSRF penuh, dan logging jejak audit lengkap.

---

## 5. Panduan Pemeliharaan Dokumentasi Bagi Tim Pengembang

Untuk menjaga konsistensi dan akurasi dokumentasi teknis sepanjang siklus pengembangan, seluruh anggota tim diwajibkan mematuhi panduan berikut:

1. **Bahasa Penulisan Resmi**: Seluruh dokumentasi teknis wajib ditulis dalam Bahasa Indonesia baku, jelas, profesional, dan mengikuti kaidah teknis yang berlaku.
2. **Larangan Penggunaan Emoji (Strict Emoji Prohibition)**: Dilarang keras menyertakan simbol visual emoji pada dokumen teks, judul, tabel, maupun diagram Mermaid. Gunakan label teks terstandarisasi seperti `[PENTING]`, `[PERHATIAN]`, `[CATATAN]`, atau `[KRITIS]`.
3. **Prinsip Sinkronisasi Bersamaan (Simultaneous Synchronization)**:
   - Setiap modifikasi skema basis data pada direktori `database/migrations/` wajib disertai pembaruan kamus data pada [schema.md](./schema.md).
   - Setiap perubahan alur bisnis atau penambahan aturan validasi pada FormRequest / Controller wajib disinkronkan ke dalam [rules.md](./rules.md).
   - Setiap perubahan antarmuka atau token gaya wajib diselaraskan dengan [design.md](./design.md).
4. **Validasi Tautan Relatif (Hyperlink Integrity)**: Pastikan seluruh tautan rujukan antar-berkas menggunakan format jalur relatif markdown yang valid dan dapat diakses langsung oleh pembaca.
5. **Diagram Standar Mermaid**: Diagram relasi basis data dan alur data wajib menggunakan blok kode Markdown dengan bahasa `mermaid` yang valid dan dapat dirender secara otomatis pada repositori Git.
