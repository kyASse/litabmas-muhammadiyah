---
name: role-audit-workflow
description: Use when auditing, inspecting, verifying, or redesigning features and views for a specific user role (Admin Kampus/LPPM, Peneliti, Reviewer, Admin Keuangan) in the Standalone Integrated Research System (RPL-2026).
---

# Role Audit Workflow Skill (7-Stage Standard)

Skill ini memandu agen AI untuk mengeksekusi audit menyeluruh pada setiap peran pengguna di Sistem Penelitian Terintegrasi Standalone, menjamin kepatuhan 100% terhadap dokumen teknis (`docs/technical/`), sistem desain *Hybrid Scholarly Enterprise*, serta invarian sistem bebas regresi.

---

## 7 Tahap Alur Audit Per Peran

```
+----------------------------------------------------------------------------------------------------+
| 1. Pemetaan Modul & Eliminasi Warisan Legacy (Scope & Legacy Purge Audit)                         |
| 2. Audit Skema Basis Data & Kueri Eloquent (Backend Query & Tenant Isolation Audit)               |
| 3. Audit Internasionalisasi & Kamus Bahasa (i18n & Zero Hardcoded Static Text Audit)               |
| 4. Audit Sistem Desain & Visual (Design System Preview Gate & Dual Typography Audit)               |
| 5. Audit Ergonomi Formulir & Tata Letak (Form Centering, Spacing, & Protection Audit)              |
| 6. Audit Pengalaman Mobile-First (Mobile Drawer & Viewport Responsiveness)                        |
| 7. Verifikasi Pengujian Otomatis Berlapis (Strict Zero Emoji, TypeScript, Feature Test, & Build)   |
+----------------------------------------------------------------------------------------------------+
```

---

### Tahap 1: Pemetaan Modul & Eliminasi Warisan Legacy (Scope & Legacy Purge)
1. **Inspeksi Rute & Hak Akses**:
   - Buka [routes/web.php](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/routes/web.php) dan petakan seluruh rute ber-middleware peran terkait (misal: `role:Admin Kampus`, `role:Peneliti`).
   - Periksa keselarasan antara middleware rute dan otorisasi di dalam Controller method terkait.
2. **Inspeksi Navigasi Sidebar**:
   - Periksa [app-sidebar.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/app-sidebar.tsx). Pastikan item menu yang ditampilkan saat peran aktif sesuai dengan PRD domain riset.
3. **Pembersihan Modul Warisan (Zero Legacy OJS/JurnalMu)**:
   - Pastikan tidak ada lagi simbol, istilah, atau kolom legacy OJS: `journals`, `journals_count`, `scientific_field`, `Pengelola Jurnal`, `id_journal`, dan ikon `BookOpen`.

---

### Tahap 2: Audit Skema Basis Data & Kueri Eloquent (Backend Query & Tenant Isolation)
1. **Isolasi Multi-Tenancy**:
   - Pastikan kueri Eloquent mengunci data institusi via `university_id` dan `TenantScope` (kecuali peran Super Admin yang memiliki bypass global).
   - Pastikan perlindungan IDOR: manipulasi parameter URL lintas institusi wajib dicegat oleh policy dan scope dengan respon HTTP 403 atau 404.
2. **Pemeriksaan Otorisasi Peran**:
   - Selalu gunakan helper model `$user->hasRole($role)` atau `$user->hasAnyRole([$roles])`. Dilarang memanggil kueri pivot relasi `$user->roles()` secara mentah karena seeder legacy hanya mengisi kolom `role_id` utama.
3. **Integritas Metrik & Relasi**:
   - Periksa method Controller (`index`, `show`). Pastikan data agregasi untuk kartu metrik (`stats`) bersumber dari data riset riil (total usulan, reviewer aktif, pagu pendanaan, status monev).
   - Hilangkan blok kueri duplikat atau kolom yang tidak terdaftar pada skema 21 tabel bersih ([schema.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/schema.md)).

---

### Tahap 3: Audit Internasionalisasi (i18n & Zero Hardcoded Static Text)
1. **Larangan Teks Statis Hardcoded**:
   - Seluruh teks label, placeholder, judul kartu, pesan validasi, tooltip, dan tombol aksi pada view `.tsx` **WAJIB** dikonsumsi melalui `const { t, format, locale } = useTranslation();`.
2. **Paritas Kamus Bahasa 100%**:
   - Setiap teks baru wajib didaftarkan pada [en.ts](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/lang/en.ts) (rujukan utama) dan [id.ts](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/lang/id.ts).
   - Jalankan `npx tsc --noEmit` untuk memastikan kepatuhan tipe `TranslationType = typeof en` tanpa kunci yang hilang.

---

### Tahap 4: Audit Sistem Desain & Visual (Design System Preview Gate & Typography)
1. **Token Palet Warna Cool Slate & Academic Navy**:
   - Kanvas: `bg-slate-50`. Kartu/Tabel: `bg-white`. Header tabel/permukaan sekunder: `bg-slate-100`.
   - Aksi Utama: Academic Navy (`bg-blue-900 hover:bg-blue-800 text-white`).
   - Larangan warna acak: Hapus seluruh kelas `neutral-*`, `zinc-*`, dan hardcoded hex.
2. **Hierarki Tipografi Ganda (Dual-Personality Typography)**:
   - **Heading 1 (Serif: `font-serif text-2xl font-semibold`)**: Hanya untuk konten ilmiah (judul proposal riset pada halaman detail proposal/skema dan sertifikat SKTS resmi).
   - **Heading 2 (Sans: `font-sans text-xl sm:text-2xl font-bold`)**: Untuk seluruh header halaman operasional LPPM, Admin, Reviewer, dan Peneliti (`isEditorialSerif={false}`).
   - **Header Kolom Tabel (`TableHeader`)**: Wajib `border-b border-slate-200 bg-slate-100 font-sans font-semibold tracking-wider text-slate-700 uppercase text-xs`.
   - **Nilai Finansial & Skor**: Menggunakan komponen `<TabularFigure />` atau `font-mono tabular-nums`.
3. **Komponen Inti Standar**:
   - Gunakan `PageHeader`, `MetricCard`, `StatusBadge`, `TabularFigure`, dan `SplitScreenViewer` tanpa membuat komponen UI ad-hoc.
   - Anti-Bubble UI: Gunakan `rounded-lg` untuk kontainer dan `rounded-md` untuk badge/kontrol form (larangan `rounded-full` pada tabel).

---

### Tahap 5: Audit Ergonomi Formulir & Tata Letak (Form Centering & Spacing)
1. **Sentralisasi Form Desktop**:
   - Halaman formulir (Create/Edit/Wizard) wajib memiliki kontainer terpusat `mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8`.
   - Formulir tidak boleh menempel di kiri atau melebar satu layar penuh tanpa batas.
2. **Proporsi Jarak & Spacing**:
   - Jaga margin yang seimbang antara header kartu, label input, kolom isian, dan tombol submit.
3. **Proteksi Form Inertia**:
   - Tombol submit wajib dinonaktifkan saat pengiriman data (`disabled={processing}`).
   - Proteksi navigasi saat form telah diisi (`isDirty`).
   - Tampilkan pesan galat inline dengan `<InputError message={errors.field} />` dan auto-focus ke error pertama.

---

### Tahap 6: Audit Pengalaman Mobile-First (Mobile Drawer & Viewport Responsiveness)
1. **Target Sentuh Interaktif**:
   - Seluruh kontrol interaktif mobile memiliki area sentuh minimum 44x44 piksel.
2. **Navigasi Top Drawer**:
   - Navigasi mobile menggunakan tombol *Hamburger Menu* (`Menu` icon) dengan drawer dari atas (`side="top"`, `max-h-[85vh]`).
   - Drawer wajib menutup otomatis saat navigasi halaman terjadi melalui event Inertia `router.on('navigate')`.
3. **Pencegahan Tabrakan Header**:
   - Elemen breadcrumb pada `AppSidebarHeader` wajib menyertakan kelas `min-w-0 truncate` agar tidak menabrak tombol `LanguageSwitcher`.

---

### Tahap 7: Verifikasi Otomatis Berlapis & Invarian Bebas Emoji
1. **Disiplin Bebas Emoji (Strict Zero Emoji Invariant)**:
   - 0 simbol visual emoji di seluruh kode sumber, seeder, test, kamus bahasa, dan respons teks.
   - Seluruh status visual menggunakan penanda teks terstruktur `[STATUS]` didampingi ikon SVG semantik Lucide React (stroke 1.5 - 2.0px).
2. **Pipeline Verifikasi Otomatis**:
   - Jalankan `npx tsc --noEmit` -> Wajib lolos 0 error.
   - Jalankan pengujian backend via Docker: `docker exec litabmas_app php artisan test tests/Feature/{Role}RoutesTest.php`.
   - Jalankan pengujian frontend Vitest: `npx vitest run resources/js/test-utils/`.
   - Jalankan kompilasi produksi: `npm run build` -> Pastikan seluruh bundel Vite terkompilasi sukses.

---

## Matriks Fokus Audit Per Peran

| Peran | Modul Kritis yang Diaudit | Kasus Batas Utama (*Critical Edge Cases*) |
|---|---|---|
| **Admin Kampus (LPPM)** | Dasbor LPPM, Skema Riset Institusi, Plotting Reviewer, Jadwal Monev, Verifikasi Luaran | Isolasi tenant multi-kampus, aturan *Conflict of Interest (CoI)* penugasan reviewer (`id_reviewer != id_pengusul`). |
| **Peneliti / Dosen** | Dasbor Peneliti, Form Usulan Wizard, Upload Proposal PDF, Laporan Kemajuan Monev, Catatan Harian (Logbook), Pelaporan Luaran | Upload guard (PDF tunggal maks 10MB & magic bytes `%PDF-`), pencegahan edit usulan setelah submitted, deduplikasi nomor luaran (DOI/ISBN). |
| **Reviewer** | Dasbor Penilai, SplitScreen Viewer (PDF vs Rubrik Penilaian), Rubrik Penilaian Berbobot, Rekomendasi Pendanaan, Form Evaluasi Monev | Pencegahan submit penilaian jika ada skor kriteria bernilai kosong, penguncian penilaian setelah batas waktu evaluasi berakhir. |
| **Admin Keuangan** | Dasbor Keuangan, Verifikasi SPJ, Riwayat Pencairan Termin 1 (70%), Pencairan Termin 2 (30%), SKTS | *Monev Gatekeeper Lock* (Pencairan Termin 2 diblokir secara absolut di backend jika Monev belum Approved), validasi formula pendanaan 70%-30%. |
