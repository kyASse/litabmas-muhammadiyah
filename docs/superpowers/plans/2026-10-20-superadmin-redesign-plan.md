# Implementation Plan: Redesign & Purge Legacy Modul Super Admin (Universities, Campus Admins, Users)

- **Dokumen Referensi**:
  - [PRD Sistem Penelitian Terintegrasi Standalone](../../PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)
  - [Cetak Biru Arsitektur](../../technical/architecture.md)
  - [Kamus Data & Skema 21 Tabel](../../technical/schema.md)
  - [Sistem Desain Antarmuka Hybrid Scholarly Enterprise](../../technical/design.md)
  - [Aturan Bisnis & Kasus Batas Kritis](../../technical/rules.md)
- **Branch Target**: `feat/superadmin-redesign` (bercabang dari `origin/development`)
- **Penegakan Invarian**:
  - Strict Zero Emoji Invariant (100% bebas dari simbol emoji).
  - Strict i18n & Zero Hardcoded Static Text Invariant (seluruh salinan teks antarmuka wajib melalui kamus `en.ts` dan `id.ts` via `useTranslation()`).
  - Purge Total Legacy OJS & JurnalMu: Hapus seluruh keterkaitan `journals`, "Pengelola Jurnal", dan tabel legacy.
  - Design System: Gunakan komponen terverifikasi `@/components/ui` (`PageHeader`, `MetricCard`, `StatusBadge`, `TabularFigure`).

---

## Global Constraints & Arsitektur

1. **Zero Emoji**: Dilarang menyertakan karakter emoji apa pun dalam kode, komentar, JSDoc, pesan validasi, badge status, maupun commit message. Gunakan mikro-ikon SVG Lucide dan label teks terstruktur (misal: `[AKTIF]`, `[NONAKTIF]`, `[PENDING]`).
2. **Kamus Bahasa Ganda**:
   - Sumber utama: `resources/js/lang/en.ts`.
   - Sumber terjemahan: `resources/js/lang/id.ts` dengan penegakan tipe `TranslationType = typeof en`.
3. **Model & Relasi Bersih**:
   - Model `University` dan `User` tidak memiliki relasi `journals()`. Gantikan dengan relasi sah: `proposals()`, `researchSchemas()`, `users()`, `scientificField()`.
4. **Formulir Inertia Standar**:
   - Menggunakan helper `useForm` dari `@inertiajs/react`.
   - Tombol submit wajib memuat `disabled={processing}`.
   - Menampilkan inline error field via `<InputError message={errors.field} />`.

---

## Rincian Tugas (Tasks Breakdown)

### Task 1: Kamus Bahasa i18n untuk Modul Super Admin
- **Berkas**: `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`
- **Deskripsi**:
  - Daftarkan section `adminUniversities`, `adminCampusAdmins`, dan `adminUsers` secara lengkap di `en.ts` dan padanan Bahasa Indonesia di `id.ts`.
  - Cakupan kunci: judul halaman, deskripsi, metrik label, kolom tabel, aksi, label form, placeholder, pesan konfirmasi modal, dan tab navigasi.
- **Verifikasi**: `npx tsc --noEmit` membuktikan kesesuaian tipe data `TranslationType`.

### Task 2: Pembersihan Backend Controllers (University, AdminKampus, User)
- **Berkas**:
  - `app/Http/Controllers/Admin/UniversityController.php`
  - `app/Http/Controllers/Admin/AdminKampusController.php`
  - `app/Http/Controllers/Admin/UserController.php`
- **Deskripsi**:
  - Hapus pemanggilan relasi `journals` pada method `show` dan `index` di ketiga controller.
  - Tambahkan penghitungan metrik riset institusi yang absah: `proposals_count`, `research_schemas_count`, `active_users_count`.
  - Bersihkan duplikasi kueri di `AdminKampusController@index`.
  - Hapus batasan peran obsoleto "Pengelola Jurnal" pada `UserController.php`, sesuaikan dengan peran sah: `Peneliti`, `Reviewer`, `Admin Keuangan`, `Admin Kampus`, `Super Admin`.
- **Verifikasi**: PHP syntax check dan endpoint tidak melempar `BadMethodCallException`.

### Task 3: Redesign Frontend Modul Universities
- **Berkas**:
  - `resources/js/pages/Admin/Universities/Index.tsx`
  - `resources/js/pages/Admin/Universities/Show.tsx`
  - `resources/js/pages/Admin/Universities/Create.tsx`
  - `resources/js/pages/Admin/Universities/Edit.tsx`
- **Deskripsi**:
  - `Index.tsx`: Implementasi `PageHeader`, `MetricCard` (Total PT, PT Aktif, Total Proposal, Total Dosen), Filter Terpadu, Tabel Institusi dengan `StatusBadge`, dan modal konfirmasi suspensi tenant.
  - `Show.tsx`: Informasi lengkap PT, kode PTM, akreditasi, klaster riset, data kontak, daftar admin LPPM terkait, statistik proposal, tanpa tabel jurnal legacy.
  - `Create.tsx` & `Edit.tsx`: Form standar dengan validasi inline dan `useForm`.
- **Verifikasi**: `npx tsc --noEmit` lolos kompilasi tanpa galat.

### Task 4: Redesign Frontend Modul Campus Admins
- **Berkas**:
  - `resources/js/pages/Admin/AdminKampus/Index.tsx`
  - `resources/js/pages/Admin/AdminKampus/Show.tsx`
  - `resources/js/pages/Admin/AdminKampus/Create.tsx`
  - `resources/js/pages/Admin/AdminKampus/Edit.tsx`
- **Deskripsi**:
  - `Index.tsx`: Implementasi navigasi tab (Operator LPPM Aktif, Menunggu Persetujuan/Pending, Ditolak), `MetricCard` (Total LPPM, PT Terlayani, Menunggu Verifikasi), modal aksi persetujuan dan penolakan LPPM dengan catatan alasan.
  - `Show.tsx`: Detail profil Admin Kampus, kampus afiliasi, statistik operasional riset kampus, rekam jejak verifikasi akun.
  - `Create.tsx` & `Edit.tsx`: Form akun Admin Kampus terstandarisasi.
- **Verifikasi**: `npx tsc --noEmit` lolos kompilasi tanpa galat.

### Task 5: Redesign Frontend Modul Users
- **Berkas**:
  - `resources/js/pages/Admin/Users/Index.tsx`
  - `resources/js/pages/Admin/Users/Show.tsx`
  - `resources/js/pages/Admin/Users/Create.tsx`
  - `resources/js/pages/Admin/Users/Edit.tsx`
- **Deskripsi**:
  - `Index.tsx`: Tuntaskan konsistensi tabel pengguna sivitas akademika, filter multi-peran (Peneliti, Reviewer, Admin Keuangan, Admin Kampus), filter universitas, status aktif.
  - `Show.tsx`: Profil pengguna, bidang keilmuan, institusi afiliasi, lencana peran ganda, rekam jejak proposal/review, tanpa komponen jurnal.
  - `Create.tsx` & `Edit.tsx`: Form pembuatan dan pengeditan akun sivitas akademika dengan MultiRoleSelect dan ScientificField selection, bersihkan istilah "Pengelola Jurnal".
- **Verifikasi**: `npx tsc --noEmit` lolos kompilasi tanpa galat.

### Task 6: Pengujian Fitur, Quality Gates, dan Verifikasi Lengkap
- **Berkas**:
  - `tests/Feature/SuperAdminRoutesTest.php`
- **Deskripsi**:
  - Perluas pengujian `SuperAdminRoutesTest.php` untuk memvalidasi akses `index`, `show`, `create`, `edit` pada rute `universities`, `admin-kampus`, dan `users`.
  - Jalankan `npx tsc --noEmit`.
  - Jalankan suite pengujian backend di Docker: `docker exec litabmas_app php artisan test`.
  - Pastikan seluruh 204+ skenario pengujian berstatus PASSED 100%.
- **Verifikasi**: 0 test failures, 0 lint/tsc errors.
