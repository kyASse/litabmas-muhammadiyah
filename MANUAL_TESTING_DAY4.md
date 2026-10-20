# Panduan Pengujian Manual (Manual Testing Guide) - Hari 4
## Modul 5: Luaran Riset (4 Klaster) & Deduplikasi | Modul 6: Evaluasi Akhir, SKTS Editorial, & Read-Only Archive Lock

> [!NOTE]
> Berkas ini merupakan panduan sementara untuk pengujian manual (*manual testing*) di lingkungan lokal. Berkas ini bebas dari simbol emoji sesuai invarian baku sistem (*Strict Zero Emoji Invariant*).

---

## 1. Persiapan Lingkungan & Data Awal (Setup)

Pastikan server lokal berjalan:
```bash
# Terminal 1: Laravel Backend
php artisan serve

# Terminal 2: Vite Frontend Dev Server
npm run dev
```

Jika basis data lokal perlu di-reset dengan data awal bersih:
```bash
php artisan migrate:fresh --seed
```

### Akun Uji Coba Bawaan (Password: `password`)
- **Super Admin**: `superadmin@litabmas.ac.id` (Hak akses lintas kampus)
- **Admin Kampus / LPPM (UMY)**: `adminkampus@litabmas.ac.id`
- **Dosen / Peneliti (UMY)**: `dosen@litabmas.ac.id`
- **Reviewer (UMY)**: `reviewer@litabmas.ac.id`
- **Admin Keuangan (UMY)**: `finance@litabmas.ac.id`

---

## 2. Alur Pengujian Skenario Lengkap (End-to-End Walkthrough)

### Skenario 1: Pelaporan 4 Klaster Luaran Riset oleh Dosen (Peneliti)

1. **Login sebagai Peneliti**:
   - Buka peramban ke `http://localhost:8000/login`.
   - Masukkan email: `dosen@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Luaran Riset**:
   - Navigasi ke menu **Luaran Riset** atau buka URL: `http://localhost:8000/outputs`.
   - Amati 4 kartu ringkasan metriks (`MetricCard`): Total Luaran, Luaran Wajib Terverifikasi, Luaran Tambahan, dan Persentase Pemenuhan.
3. **Tambah Luaran Jurnal Ilmiah (Target: Wajib)**:
   - Klik tombol **Tambah Luaran**.
   - Pada modal formulir interaktif `CreateModal`:
     - Pilih usulan riset yang telah didanai (berstatus `Lolos_Didanai`).
     - Pilih target status: **[WAJIB]**.
     - Pilih tab klaster: **Jurnal / Publikasi**.
     - Isi Nama Jurnal: `Jurnal Teknologi Terapan Muhammadiyah`.
     - Isi Judul Artikel: `Implementasi Kecerdasan Buatan pada Tata Kelola Riset`.
     - Pilih Indeksasi: `Sinta_2`.
     - Pilih Status Publikasi: `Published`.
     - Isi URL DOI: `https://doi.org/10.1234/jttm.2026.001`.
     - Unggah naskah artikel (wajib berkas `.pdf`, maks 10MB).
     - Klik **Simpan Luaran**.
4. **Tambah Luaran Klaster Lain (Opsional/Tambahan)**:
   - Klik **Tambah Luaran** kembali:
     - Pilih tab **Buku**: Isi judul buku, ISBN (misal `978-602-1234-56-7`), penerbit, tahun, dan unggah scan cover PDF.
     - Pilih target status: **[TAMBAHAN]**.
     - Klik **Simpan Luaran**.
5. **Verifikasi Hasil Skenario 1**:
   - Luaran jurnal tercatat pada tabel dengan lencana `[WAJIB]` dan status verifikasi awal `[SUBMITTED]`.
   - Luaran buku tercatat dengan lencana `[TAMBAHAN]` dan status `[SUBMITTED]`.
   - Tombol unduh berkas PDF berfungsi dan menampilkan dokumen yang diunggah.

---

### Skenario 2: Uji Kunci Kritis Output Deduplication Guard (Pencegahan Klaim Ganda)

1. **Uji Duplikasi DOI pada Proposal Berbeda di Universitas yang Sama**:
   - Masih pada login dosen atau dosen lain di universitas yang sama:
   - Buka formulir `Tambah Luaran` untuk proposal riset lain milik kampus yang sama.
   - Pilih tab **Jurnal** dan masukkan nomor DOI yang sama persis: `https://doi.org/10.1234/jttm.2026.001` (atau variasi huruf besar/kecil `HTTPS://DOI.ORG/10.1234/JTTM.2026.001`).
   - Unggah berkas PDF dan klik **Simpan Luaran**.
2. **Verifikasi Hasil Skenario 2 (DOI)**:
   - Sistem **MENOLAK** pengiriman form dengan pesan validasi terstruktur:
     `[DUPLIKASI] Identifikasi nomor DOI ini telah terdaftar pada luaran penelitian lain di universitas Anda.`
3. **Uji Duplikasi ISBN Buku**:
   - Coba daftarkan buku dengan nomor ISBN yang sama namun format strip berbeda (misal `9786021234567` tanpa tanda hubung).
   - Sistem otomatis melakukan normalisasi kanonikal dan **MENOLAK** dengan pesan duplikasi ISBN.

---

### Skenario 3: Verifikasi Matriks Luaran Riset oleh LPPM (Admin Kampus)

1. **Logout & Login sebagai Admin Kampus**:
   - Logout dari akun dosen.
   - Login dengan email: `adminkampus@litabmas.ac.id`, password: `password`.
2. **Buka Meja Kerja Verifikasi Luaran**:
   - Navigasi ke URL: `http://localhost:8000/admin/outputs` (atau `http://localhost:8000/admin/outputs/verify` / `http://localhost:8000/admin/output-verify`).
3. **Telaah Berkas & Verifikasi Substansi**:
   - Temukan baris luaran artikel jurnal dari Skenario 1.
   - Klik tombol **Pratinjau Dokumen** (ikon mata):
     - Modal viewer in-browser terbuka menampilkan berkas PDF bukti fisik secara instan.
   - Klik tombol **Verifikasi** (ikon checklist):
     - Pilih keputusan: **[SETUJUI LUARAN (VERIFIED)]**.
     - Masukkan catatan verifikasi: `Bukti naskah dan tautan DOI telah diverifikasi valid pada pangkalan data jurnal.`
     - Klik **Simpan Keputusan**.
4. **Verifikasi Hasil Skenario 3**:
   - Status luaran berubah menjadi `[VERIFIED]`.
   - Jika tombol tolak (`Rejected`) dipilih, sistem mewajibkan pengisian `catatan_verifikasi` untuk alasan penolakan.

---

### Skenario 4: Uji Kunci Kritis Precondition Guard Laporan Akhir 100%

1. **Logout & Login kembali sebagai Dosen / Peneliti**:
   - Login dengan email: `dosen@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Evaluasi Akhir**:
   - Buka URL: `http://localhost:8000/proposals/{ID_PROPOSAL}/final-evaluation` (atau `http://localhost:8000/evaluations/show?proposal_id={ID_PROPOSAL}`).
3. **Uji Blokade Precondition Guard (Jika Luaran Wajib Belum Lengkap/Belum Verified)**:
   - Amati matriks indikator prasyarat kelayakan (*Precondition Matrix*):
     - Terdapat indikator pemenuhan target luaran wajib.
     - Jika ada usulan yang belum memiliki luaran `Wajib` atau luaran `Wajib` masih berstatus `Submitted`/`Rejected`:
       - Formulir pengajuan laporan akhir dinonaktifkan dengan peringatan:
         `[BLOKIR] Pengajuan evaluasi akhir diblokir. Seluruh luaran wajib harus telah berstatus Terverifikasi (Verified) oleh LPPM.`
4. **Pengajuan Laporan Akhir 100% (Ketika Seluruh Luaran Wajib Telah Verified)**:
   - Pada usulan yang luaran wajibnya telah `Verified` di Skenario 3:
     - Formulir pelaporan aktif.
     - Unggah berkas naskah Laporan Akhir format PDF (maks 10MB) via `PDFUploader`.
     - Isi **Ringkasan Hasil Penelitian** (minimal 50 karakter).
     - Klik **Kirim Laporan Akhir 100%**.
5. **Verifikasi Hasil Skenario 4**:
   - Laporan akhir berhasil diserahkan dengan status penelitian: `[DALAM EVALUASI]`.

---

### Skenario 5: Penilaian Kelulusan & Penerbitan SKTS Editorial (Admin Kampus)

1. **Logout & Login sebagai Admin Kampus / LPPM**:
   - Login dengan email: `adminkampus@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Evaluasi Usulan**:
   - Buka URL: `http://localhost:8000/evaluations/show?proposal_id={ID_PROPOSAL}`.
   - Sebagai admin, pada bagian bawah tampil panel aksi **Penilaian Akhir & Penerbitan SKTS**.
3. **Input Nilai & Keputusan Kelulusan**:
   - Masukkan **Skor Akhir Substansi**: `88.50`.
   - Pilih **Rekomendasi Kelulusan**: `[LULUS MEMUASKAN]`.
   - Klik **Simpan Evaluasi**.
4. **Penerbitan SKTS Resmi**:
   - Klik tombol **[TERBITKAN SKTS RESMI]**.
   - Sistem men-generate nomor SKTS institusi secara otomatis:
     Format: `SKTS/{KODE_KAMPUS}/{TAHUN}/{ID_PROPOSAL}`, contoh: `SKTS/UMY/2026/1`.
   - Status penelitian berubah menjadi: `[SELESAI]`.
5. **Pemeriksaan Dokumen Digital SKTS**:
   - Klik tombol **Lihat Sertifikat SKTS** atau buka URL:
     `http://localhost:8000/proposals/{ID_PROPOSAL}/skts-certificate`.
   - **Verifikasi Tampilan Editorial Formal**:
     - Tipografi ganda: Judul dan preambul formal menggunakan `font-serif` (*Merriweather/Georgia*).
     - Nomor SKTS, NIDN, dan nilai berformat `font-mono tabular`.
     - Tampil kop surat resmi institusi tenant dan Majelis Diktilitbang PP Muhammadiyah.
     - Tampil lencana `[LULUS MEMUASKAN]` dan nilai akhir `88.50`.
     - Tampil kode QR SVG verifikasi integritas digital dan stempel elektronik `[TERAUTENTIKASI ELEKTRONIK]`.
     - Klik tombol **Cetak / Unduh PDF**: dialog cetak peramban terbuka dengan layout A4 portrait tanpa elemen navigasi website (`@media print`).

---

### Skenario 6: Verifikasi Kunci Kritis Read-Only Archive Lock (HTTP 403)

Setelah SKTS terbit pada Skenario 5, seluruh data penelitian masuk ke status **Arsip Baca-Saja Permanen**.

1. **Uji Penguncian Visual pada Frontend**:
   - Login sebagai Dosen atau Admin, buka halaman `http://localhost:8000/evaluations/show?proposal_id={ID_PROPOSAL}`.
   - Tampil *sticky top banner* berwarna abu-abu/slate gelap:
     `[ARSIP BACA-SAJA] Penelitian ini telah selesai dan diarsipkan secara permanen. Seluruh data transaksi terkunci dari perubahan.`
   - Formulir unggah naskah dan tombol submit dinonaktifkan secara absolut.
   - Buka halaman `http://localhost:8000/outputs`: tombol hapus luaran berstatus nonaktif dengan ikon gembok.
2. **Uji Penguncian Backend (API HTTP 403 Forbidden Guard)**:
   - Uji coba modifikasi data proposal via terminal cURL atau Postman:
     ```bash
     # Contoh percobaan update proposal yang sudah SKTS
     curl -X PUT http://localhost:8000/proposals/{ID_PROPOSAL} -d "judul_penelitian=Ubah Judul" ...
     ```
   - **Hasil**: Sistem melempar respons `403 Forbidden` dengan pesan:
     `[TERKUNCI] Data usulan telah berstatus Selesai dan terkunci permanen sebagai Arsip Baca-Saja.`
   - Uji coba hapus luaran riset (`DELETE /outputs/{ID_OUTPUT}`):
     - **Hasil**: Terblokir mutlak dengan HTTP 403 Forbidden.
   - Uji coba modifikasi kontrak atau dokumen proposal:
     - **Hasil**: Terblokir mutlak dengan HTTP 403 Forbidden via trait `EnforcesReadOnlyArchive`.

---

### Skenario 7: Uji Alur Penelitian Gagal / Force Majeure (Kasus Batas 11)

1. **Setup Kasus Kahar pada Usulan Aktif**:
   - Siapkan usulan riset yang sedang berjalan dan memiliki kontrak dengan Termin 2 yang berstatus `[PENDING]`.
2. **Eksekusi Terminasi Darurat oleh Admin Kampus / LPPM**:
   - Kirim permintaan terminasi darurat (atau gunakan modal aksi Force Majeure):
     - Masukkan alasan: `Bencana alam banjir merusak total fasilitas laboratorium lapangan sehingga riset tidak dapat dilanjutkan.`
     - Unggah berkas Berita Acara / Surat Keterangan Force Majeure format PDF.
3. **Verifikasi Hasil Skenario 7**:
   - Status penelitian pada tabel `evaluations` tercatat: `[GAGAL]` dengan rekomendasi `[TIDAK LULUS]`.
   - Status kontrak riset berubah menjadi `[CLOSED]`.
   - Dana Termin 2 yang sebelumnya `Pending` secara otomatis berubah menjadi: `[CANCELLED]` dengan keterangan alasan terminasi.
   - Dana yang belum terserap terkunci dari pencairan kas institusi.

---

## 3. Matriks Kasus Uji Ekstrem (Edge Cases Checklist)

| ID | Skenario Kasus Uji | Tindakan / Respon Sistem yang Diharapkan | Status |
| :---: | :--- | :--- | :---: |
| **EC-01** | Peneliti mendaftarkan DOI yang sama pada usulan berbeda di universitas yang sama. | Ditolak oleh *Output Deduplication Guard* dengan pesan `[DUPLIKASI]`. | PASSED |
| **EC-02** | Peneliti dari Universitas B mendaftarkan DOI yang sama dengan Universitas A. | Diizinkan (*allowed*), karena isolasi keunikan berbasis per institusi (`university_id`). | PASSED |
| **EC-03** | Peneliti mengunggah berkas non-PDF (misal file .exe diubah ekstensi jadi .pdf). | Ditolak oleh inspeksi *magic bytes* `%PDF-` pada backend. | PASSED |
| **EC-04** | Peneliti mencoba mengajukan evaluasi akhir padahal belum ada luaran Wajib. | Ditolak oleh *Precondition Guard* dengan respons HTTP 422 `[BLOKIR]`. | PASSED |
| **EC-05** | Peneliti mencoba mengajukan evaluasi akhir saat luaran Wajib masih berstatus Submitted/Rejected. | Ditolak oleh *Precondition Guard* dengan respons HTTP 422 `[BLOKIR]`. | PASSED |
| **EC-06** | Peneliti mencoba melihat luaran proposal milik dosen lain via manipulasi URL `?proposal_id=`. | Dicegat oleh proteksi IDOR dengan respons HTTP 403 Forbidden. | PASSED |
| **EC-07** | Admin Kampus Universitas A mencoba memverifikasi luaran milik Universitas B. | Dicegat oleh `TenantScope` dan otorisasi tenant dengan respons HTTP 403 Forbidden. | PASSED |
| **EC-08** | Mutasi edit/hapus proposal, kontrak, dokumen, atau luaran setelah terbit SKTS. | Dicegat oleh *Read-Only Archive Lock* dengan respons HTTP 403 `[TERKUNCI]`. | PASSED |
| **EC-09** | Riset dinyatakan Force Majeure / Gagal di tengah periode. | Sisa dana Termin 2 dibatalkan otomatis (`Cancelled`), status evaluasi menjadi `Gagal`. | PASSED |
| **EC-10** | Pengalihan bahasa dinamis EN / ID saat melihat sertifikat SKTS atau antarmuka arsip. | Seluruh teks antarmuka beralih seketika (*zero reload*) dengan paritas 100%. | PASSED |
| **EC-11** | Pemindaian visual teks dan sertifikat SKTS terhadap keberadaan simbol emoji. | Bebas 100% dari emoji (*Strict Zero Emoji Invariant*). | PASSED |
