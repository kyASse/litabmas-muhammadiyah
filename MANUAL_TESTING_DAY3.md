# Panduan Pengujian Manual (Manual Testing Guide) - Hari 3
## Modul 3: Kontrak & Pendanaan 70:30 | Modul 4: Monev & Pelaporan Progres | Monev Gatekeeper Lock

> [!NOTE]
> Berkas ini merupakan panduan sementara untuk pengujian manual (*manual testing*) di lingkungan lokal. Berkas ini tidak untuk di-commit atau di-push ke repositori.

---

## 1. Persiapan Lingkungan & Data Awal (Setup)

Pastikan server lokal berjalan:
```bash
# Terminal 1: Laravel Backend
php artisan serve

# Terminal 2: Vite Frontend Dev Server
npm run dev
```

Jika basis data lokal belum memiliki data awal, jalankan migrasi dan seeder:
```bash
php artisan migrate:fresh --seed
```

### Akun Uji Coba Bawaan (Password: `password`)
- **Super Admin**: `superadmin@litabmas.ac.id`
- **Admin Kampus / LPPM (UMY)**: `adminkampus@litabmas.ac.id`
- **Admin Keuangan**: `finance@litabmas.ac.id`
- **Reviewer (UMY)**: `reviewer@litabmas.ac.id`
- **Peneliti / Dosen (UMY)**: `dosen@litabmas.ac.id`

---

## 2. Alur Pengujian Skenario Lengkap (End-to-End Walkthrough)

### Skenario 1: Penerbitan Kontrak Hibah & Pembagian Termin 70:30 (Admin Keuangan)

1. **Login sebagai Admin Keuangan**:
   - Buka peramban ke `http://localhost:8000/login`.
   - Masukkan email: `finance@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Kontrak**:
   - Navigasi ke menu **Keuangan** > **Daftar Kontrak** atau buka URL: `http://localhost:8000/finance/contracts`.
3. **Penerbitan Kontrak Baru**:
   - Klik tombol **Terbitkan Kontrak**.
   - Pilih usulan penelitian yang berstatus `Lolos_Didanai`.
   - Masukkan nominal **Dana Disetujui** (*Budget Cut Adjustment*), misalnya: `Rp 50.000.000`.
   - Pilih **Tanggal Kontrak** (hari ini).
   - Klik **Simpan & Terbitkan Kontrak**.
4. **Verifikasi Hasil Skenario 1**:
   - Kontrak berhasil dibuat dengan status `[DRAFT]` atau `[SIGNED]`.
   - Buka menu **Pencairan Dana** di `http://localhost:8000/finance/funding`.
   - Pastikan terdapat **2 baris termin** otomatis yang terhubung ke kontrak tersebut:
     - **Termin 1 (70%)**: bernilai `Rp 35.000.000`, status `[PENDING]`.
     - **Termin 2 (30%)**: bernilai `Rp 15.000.000`, status `[PENDING]`.
   - Angka Rupiah ditampilkan dengan komponen `TabularFigure` dan status dengan `StatusBadge`.

---

### Skenario 2: Pencairan Termin 1 dengan Bukti Transfer Bank (Admin Keuangan)

1. **Buka Halaman Pencairan Dana**:
   - Masih pada login Admin Keuangan, buka: `http://localhost:8000/finance/funding`.
2. **Buka Modal Pencairan Termin 1**:
   - Temukan baris **Termin 1** (70%).
   - Klik tombol aksi **Cairkan Dana**.
3. **Unggah Bukti Transfer**:
   - Pada modal dialog `DisburseModal`:
     - Unggah file bukti transfer resmi perbankan (format `.pdf`, `.jpg`, atau `.png`, ukuran maksimum 10MB).
     - Pilih **Tanggal Pencairan**.
     - Isi catatan transfer (opsional).
     - Klik **Konfirmasi Pencairan**.
4. **Verifikasi Hasil Skenario 2**:
   - Status Termin 1 berubah menjadi `[DISBURSED]`.
   - Bukti transfer tersimpan dengan aman di direktori storage publik (`receipts/fundings`).

---

### Skenario 3: Verifikasi Kunci Kritis (Monev Gatekeeper Lock) pada Termin 2

1. **Uji Penguncian Visual (Frontend Guard)**:
   - Pada halaman `http://localhost:8000/finance/funding`, temukan baris **Termin 2** (30%).
   - Klik tombol **Cairkan Dana** pada baris Termin 2.
   - Amati isi modal dialog:
     - Tampil banner peringatan terstruktur: `[TERKUNCI MONEV] Laporan kemajuan Monev belum disetujui (Approved) oleh Reviewer.`
     - Tombol **Konfirmasi Pencairan** dinonaktifkan (*disabled*) secara otomatis.
2. **Uji Penguncian Backend (API HTTP 422 Guard)**:
   - Jika tombol dipaksa diaktifkan via devtools atau ditembak via cURL/Postman:
     - Request wajib ditolak dengan HTTP Status Code: `422 Unprocessable Content`.
     - Pesan respon: `[BLOKIR] Pencairan dana Termin 2 ditolak. Laporan Kemajuan Monev belum disetujui (Approved) oleh Reviewer.`

---

### Skenario 4: Penjadwalan Monev oleh LPPM (Admin Kampus)

1. **Logout & Login sebagai Admin Kampus**:
   - Logout dari Admin Keuangan.
   - Login dengan email: `adminkampus@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Jadwal Monev**:
   - Navigasi ke URL: `http://localhost:8000/admin/monev-schedules`.
3. **Buat Jadwal Monev Baru**:
   - Klik tombol **Tambah Jadwal Monev**.
   - Masukkan informasi:
     - **Nama Tahap**: `Monev Tengah Tahun 2026`
     - **Tanggal Mulai**: Pilih hari ini atau tanggal sebelum hari ini.
     - **Tanggal Selesai**: Pilih tanggal 1 bulan ke depan.
     - **Deskripsi**: `Periode monitoring dan evaluasi kemajuan riset 50% - 70%.`
   - Klik **Simpan Jadwal**.
4. **Verifikasi Hasil Skenario 4**:
   - Jadwal monev berhasil muncul pada tabel dengan penanda status `[AKTIF]`.

---

### Skenario 5: Pelaporan Progres oleh Dosen Pengusul (Peneliti)

1. **Logout & Login sebagai Dosen / Peneliti**:
   - Logout dari Admin Kampus.
   - Login dengan email: `dosen@litabmas.ac.id`, password: `password`.
2. **Buka Formulir Pelaporan Kemajuan**:
   - Navigasi ke menu **Laporan Kemajuan** atau buka URL: `http://localhost:8000/progress/create`.
3. **Isi Formulir Pelaporan Progres**:
   - Pilih usulan penelitian yang telah didanai.
   - Pilih jadwal monev aktif yang telah dibuat oleh LPPM pada Skenario 4.
   - Atur persentase capaian riil (gunakan slider atau input angka `TabularFigure`), misalnya: `65%`.
   - Isi **Ringkasan Kemajuan** (minimal 20 karakter).
   - Isi **Catatan Kendala** (opsional).
   - Unggah naskah laporan kemajuan (wajib file `.pdf`, maks 10MB) menggunakan komponen `PDFUploader`.
   - Unggah berkas logbook kegiatan (opsional, file `.pdf`, maks 10MB).
   - Klik **Kirim Laporan Kemajuan**.
4. **Verifikasi Hasil Skenario 5**:
   - Pengguna diarahkan ke daftar laporan kemajuan `http://localhost:8000/progress`.
   - Rekaman laporan kemajuan berstatus `[SUBMITTED]` dengan persentase `65%`.

---

### Skenario 6: Evaluasi & Persetujuan Laporan Monev oleh Reviewer

1. **Logout & Login sebagai Reviewer**:
   - Logout dari Peneliti.
   - Login dengan email: `reviewer@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Telaah Monev**:
   - Buka URL evaluasi telaah monev: `http://localhost:8000/reviewer/monev/{ID_LAPORAN}`.
   *(Catatan: Ganti `{ID_LAPORAN}` dengan ID rekaman yang baru dibuat pada Skenario 5, misal: `/reviewer/monev/1`).*
3. **Lakukan Penilaian Monev**:
   - Telaah data ringkasan progres, kendala, dan pratinjau/unduh berkas laporan kemajuan serta logbook.
   - Masukkan **Skor Monev** (rentang 0 - 100), misalnya: `85`.
   - Masukkan **Catatan Reviewer** (minimal 10 karakter), misalnya: `Kemajuan riset sesuai dengan jadwal luaran dan metodologi telah berjalan baik.`
   - Klik tombol putusan: **[SETUJUI LAPORAN (APPROVED)]**.
4. **Verifikasi Hasil Skenario 6**:
   - Laporan tersimpan dengan status `[APPROVED]`, skor `85`, dan catatan reviewer tercatat.

---

### Skenario 7: Pembukaan Gembok & Pencairan Termin 2 (Admin Keuangan)

1. **Logout & Login kembali sebagai Admin Keuangan**:
   - Login dengan email: `finance@litabmas.ac.id`, password: `password`.
2. **Buka Halaman Pencairan Dana**:
   - Buka URL: `http://localhost:8000/finance/funding`.
3. **Cairkan Termin 2**:
   - Temukan baris **Termin 2** (30%).
   - Klik tombol **Cairkan Dana**.
   - Amati modal dialog `DisburseModal`:
     - Banner peringatan merah `[TERKUNCI MONEV]` sudah **hilang**.
     - Tombol **Konfirmasi Pencairan** kini **aktif**.
   - Unggah berkas bukti transfer bank Termin 2.
   - Pilih tanggal pencairan dan klik **Konfirmasi Pencairan**.
4. **Verifikasi Akhir Skenario 7**:
   - Status Termin 2 berubah menjadi `[DISBURSED]`.
   - Seluruh siklus pendanaan (Termin 1 70% dan Termin 2 30%) tuntas 100%.

---

## 3. Matriks Kasus Uji Ekstrem (Edge Cases Checklist)

| ID | Kasus Uji | Tindakan yang Diharapkan |
| :---: | :--- | :--- |
| **EC-01** | Pengusul mencoba submit laporan di luar jendela jadwal monev. | Ditolak validasi form request dengan pesan `[TENGGAT_LEWAT]`. |
| **EC-02** | Pengusul mengunggah berkas non-PDF (misal: DOCX atau TXT di-rename jadi .pdf). | Ditolak oleh inspeksi *magic bytes* `%PDF-` pada backend. |
| **EC-03** | Reviewer mencoba menilai laporan usulan miliknya sendiri (*Conflict of Interest*). | Akses diblokir oleh backend dengan respon HTTP 403 Forbidden. |
| **EC-04** | Admin Kampus mencoba mencairkan termin dari kampus lain (IDOR lintas institusi). | Dicegat oleh `TenantScope` / Otorisasi dengan respon HTTP 403 / 404. |
| **EC-05** | Pencairan termin tanpa melampirkan berkas bukti transfer. | Ditolak validasi: `bukti_transfer` wajib diunggah. |
| **EC-06** | Pengubahan bahasa EN/ID saat berada di halaman. | Seluruh label, judul, dan status beralih bahasa seketika tanpa *full reload*. |
