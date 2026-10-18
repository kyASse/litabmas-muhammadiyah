# Spesifikasi Desain Arsitektur: Sistem Internasionalisasi (i18n) & Lokalisasi Statis Frontend

**Tanggal**: 16 Oktober 2026  
**Status**: Draf Disetujui (Approved Design)  
**Rujukan Proyek**: [AGENTS.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/.agents/AGENTS.md), [PRD Sistem Penelitian Terintegrasi Standalone](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md), [Sistem Desain Antarmuka](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/design.md)

---

## 1. Latar Belakang & Tujuan (Context & Objectives)

Sistem Informasi Penelitian dan Pengabdian Masyarakat (SIM-Litabmas) Multi-Kampus memerlukan standardisasi teks antarmuka guna mendukung tata kelola riset modern dan potensi kolaborasi internasional:
1. **Bahasa Inggris sebagai Bawaan (*English as Default*)**: Seluruh teks antarmuka, status alur riset, label komponen, dan navigasi secara bawaan disajikan dalam Bahasa Inggris.
2. **Bahasa Indonesia sebagai Pilihan Opsional (*Indonesian as Optional*)**: Pengguna dapat beralih ke Bahasa Indonesia kapan saja melalui tombol pengalih bahasa yang mudah diakses.
3. **Pemberantasan Teks Hardcoded (*Elimination of Hardcoded Strings*)**: Seluruh teks statis dipindahkan dari berkas komponen/halaman ke berkas kamus TypeScript berformat `.ts` di direktori `resources/js/lang/`.
4. **Keandalan Tipe & Autocomplete (*Zero-Dependency Type Safety*)**: Menggunakan fitur bawaan TypeScript (`typeof en`) tanpa pustaka eksternal pihak ketiga yang berat, menjamin seluruh kunci terjemahan tervalidasi secara komprehensif saat kompilasi (`npm run build`).
5. **Invarian Kritis Bebas Emoji (*Strict Zero Emoji Invariant*)**: Seluruh teks kamus, label status, tombol, dan komponen antarmuka wajib bebas 100% dari simbol emoji, menggunakan indikator teks terstandarisasi (misal: `[EN]`, `[ID]`, `[UNDER REVIEW]`, `[DRAFT]`) didampingi mikro-ikon semantik Lucide React (1.5-2px stroke).

---

## 2. Arsitektur Kamus & Struktur Berkas (Dictionary Architecture)

### 2.1 Struktur Direktori
Direktori lokalisasi baru dibuat pada `resources/js/lang/`:
- `resources/js/lang/en.ts`: Kamus utama (*source of truth*) dalam Bahasa Inggris.
- `resources/js/lang/id.ts`: Kamus terjemahan Bahasa Indonesia dengan tipe turunan `TranslationType`.
- `resources/js/lang/index.ts`: Barrel export kamus, tipe, dan utilitas pendukung.

### 2.2 Hirarki Kamus Semantik
Setiap berkas kamus mengelompokkan teks ke dalam domain terstruktur:
1. `common`: Teks umum sistem (nama aplikasi, tombol `save`, `cancel`, `edit`, `delete`, pencarian, status pemuatan, dsb.).
2. `navigation`: Teks menu navigasi sidebar dan header (dashboard, usulan proposal, telaah, kontrak, monev, luaran, pengaturan, sign out).
3. `statuses`: Label 14 status alur riset standar:
   - Mode EN: `[DRAFT]`, `[SUBMITTED]`, `[UNDER REVIEW]`, `[FUNDED]`, `[REJECTED]`, `[REVISION REQUIRED]`, `[CONTRACTED]`, `[DISBURSED T1]`, `[DISBURSED T2]`, `[MONEV APPROVED]`, `[MONEV LOCKED]`, `[OUTPUT VERIFIED]`, `[COMPLETED (SKTS)]`, `[TERMINATED]`.
   - Mode ID: `[DRAFT]`, `[DIAJUKAN]`, `[SEDANG DIREVIEW]`, `[LOLOS DIDANAI]`, `[DITOLAK]`, `[PERLU REVISI]`, `[TERKONTRAK]`, `[CAIR TERMIN 1]`, `[CAIR TERMIN 2]`, `[MONEV DISETUJUI]`, `[TERKUNCI MONEV]`, `[LUARAN TERVERIFIKASI]`, `[SELESAI (SKTS)]`, `[FORCE MAJEURE / DIBATALKAN]`.
4. `statusDescriptions`: Deskripsi bantuan untuk masing-masing dari 14 status alur riset.
5. `components`: Teks spesifik untuk 6 komponen UI standar:
   - `pdfUploader`: Label default, petunjuk format PDF 10MB, teks seret-lepas berkas, validasi format, dan pesan batas ukuran berkas.
   - `splitScreen`: Label telaah dokumen, tooltip buka tab baru, unduh PDF, ekspansi layar, dan judul rubrik telaah.
   - `tabularFigure`: Konfigurasi awalan mata uang (`IDR ` vs `Rp `) dan pemisah ribuan.
   - `metricCard`: Label umum dan keterangan ringkas.
   - `pageHeader`: Label navigasi remah roti (*breadcrumbs*) dan aksi umum.
6. `designSystem`: Seluruh teks untuk halaman katalog pratinjau `/design-system-preview` (judul bab, penjelasan token palet Cool Slate, tipografi ganda, kriteria rubrik usulan riset, dsb.).
7. `welcome`: Teks landing page beranda (hero title, subjudul, pencarian skema penelitian, fitur unggulan, statistik kampus, dsb.).
8. `auth`: Teks formulir masuk dan registrasi akun (email institusi, kata sandi, ingat saya, tombol sign in, dsb.).

### 2.3 Mekanisme Keamanan Tipe (Type Enforcement)
```typescript
// resources/js/lang/en.ts
export const en = {
  // ... seluruh definisi kunci
};
export type TranslationType = typeof en;

// resources/js/lang/id.ts
import { TranslationType } from './en';
export const id: TranslationType = {
  // Wajib menduplikasi struktur persis sesuai en.ts
};
```
Jika terdapat kunci pada `en.ts` yang belum diterjemahkan pada `id.ts`, TypeScript compiler (`tsc --noEmit`) akan memunculkan galat saat tahap *build*.

---

## 3. State Management & Translation Hook

### 3.1 Hook & Context Provider (`resources/js/hooks/use-translation.tsx`)
Menyediakan React Context untuk mengelola bahasa aktif dan menyediakan kamus teks secara reaktif:
- Tipe bahasa yang didukung: `export type SupportedLocale = 'en' | 'id';`
- Antarmuka Context:
  ```typescript
  interface TranslationContextType {
    locale: SupportedLocale;
    setLocale: (newLocale: SupportedLocale) => void;
    toggleLocale: () => void;
    t: TranslationType;
    format: (template: string, replacements: Record<string, string | number>) => string;
  }
  ```
- Nilai bawaan (*Default Value*): `'en'` (Bahasa Inggris).

### 3.2 Persistensi Ganda (Storage & Cookie Synchronization)
- `localStorage.getItem('app_locale')`: Membaca preferensi bahasa pengguna pada penyimpanan lokal klien.
- `document.cookie`: Menulis `app_locale={locale}; path=/; max-age=31536000; SameSite=Lax` agar backend Laravel dapat membaca preferensi bahasa pada permintaan HTTP berikutnya jika diperlukan.
- Penanda Atribut HTML: `document.documentElement.lang = locale;` diperbarui secara otomatis.

### 3.3 Helper Interpolasi Dinamis
Fungsi `format(template, params)` menggantikan variabel templat `{varName}` dengan nilai numerik atau string secara aman tanpa evaluasi ekspresi berbahaya.

### 3.4 Pemasangan Root Provider (`resources/js/app.tsx`)
`TranslationProvider` dipasang melingkupi komponen `<App {...props} />` di dalam fungsi `setup` Inertia pada `resources/js/app.tsx`, memastikan seluruh halaman dan komponen di seluruh aplikasi memiliki akses langsung ke `useTranslation()`.

---

## 4. Komponen Antarmuka `LanguageSwitcher`

### 4.1 Spesifikasi Komponen (`resources/js/components/ui/LanguageSwitcher.tsx`)
- Mengikuti palet Cool Slate dan desain *Hybrid Scholarly Enterprise*.
- Dua varian tampilan:
  1. `segmented` (Bawaan): Tombol pill bersebelahan `EN | ID` dengan indikator aktif berlatar belakang putih berbayang halus (*subtle shadow*).
  2. `compact`: Tombol tunggal dengan ikon Lucide `Globe` dan teks badge `[EN]` atau `[ID]`.
- Bebas 100% dari emoji bendera (*Strict Zero Emoji Invariant*).
- Diekspor melalui barrel `resources/js/components/ui/index.ts`.

### 4.2 Titik Integrasi Antarmuka
1. **Design System Preview Gate ([resources/js/pages/DesignSystemPreview.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/DesignSystemPreview.tsx))**:
   Dipasang pada sticky banner atas berdampingan dengan badge spesifikasi, memungkinkan pengujian pergantian bahasa secara seketika pada 6 komponen UI standar.
2. **Layout Publik ([resources/js/layouts/public-layout.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/layouts/public-layout.tsx))**:
   Dipasang pada bilah navigasi publik di sebelah kanan.
3. **Layout Aplikasi Internal ([resources/js/layouts/app-layout.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/layouts/app-layout.tsx))**:
   Dipasang pada header atas di sebelah tombol toggle dark mode dan menu profil.
4. **Halaman Publik & Autentikasi**:
   Dipasang pada [welcome.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/welcome.tsx) dan [login.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/auth/login.tsx).

---

## 5. Rencana Migrasi Komponen & Halaman

### 5.1 Enam Komponen Antarmuka Standar
1. **`StatusBadge.tsx`**: Mengganti objek label hardcoded dengan pemanggilan `t.statuses[status]` reaktif.
2. **`PDFUploader.tsx`**: Mengganti teks defaultProps dan pesan error ukuran/ekstensi dengan `t.components.pdfUploader.*`.
3. **`SplitScreenViewer.tsx`**: Mengganti label toolbar, judul evaluasi, dan aksi tombol dengan `t.components.splitScreen.*`.
4. **`TabularFigure.tsx`**: Menyesuaikan format mata uang (`IDR ` dengan pemisah ribuan koma `,` pada mode EN; `Rp ` dengan pemisah titik `.` pada mode ID).
5. **`MetricCard.tsx` & `PageHeader.tsx`**: Memastikan props menerima string hasil terjemahan dari halaman pemanggil.

### 5.2 Halaman Katalog `DesignSystemPreview.tsx`
- Menghubungkan seluruh teks judul bab 1 sampai 7, deskripsi, navigasi samping, kriteria rubrik usulan riset, dan kartu metrik ke kamus `t.designSystem.*`.
- Memberikan demonstrasi reaktif penuh: saat tombol bahasa `EN` / `ID` diklik, seluruh teks pada halaman berganti tanpa *hard reload*.

### 5.3 Halaman Publik & Autentikasi
- `welcome.tsx`: Seluruh teks statis (hero, skema unggulan, footer) dipindahkan ke `t.welcome.*`.
- `auth/login.tsx` (dan register/forgot-password terkait): Label formulir dan tombol aksi dipindahkan ke `t.auth.*`.
- `layouts/public-layout.tsx` & `layouts/app-layout.tsx`: Navigasi menu utama dipindahkan ke `t.navigation.*`.

---

## 6. Strategi Pengujian & Quality Gate

1. **Unit Test Frontend (`tests/Unit/TranslationTest.test.tsx`)**:
   - Memvalidasi *default locale* adalah `'en'`.
   - Memvalidasi fungsi `toggleLocale()` dan `setLocale('id')` memperbarui kamus secara reaktif.
   - Memvalidasi persistensi ke `localStorage` dan `document.cookie`.
   - Memvalidasi fungsi `format()` menggantikan parameter dinamis secara akurat.
2. **TypeScript Compilation & Build Verification**:
   - Menjalankan `npm run build` dan memastikan 0 error tipe TypeScript serta 0 peringatan kritis bundel Vite.
3. **Pemeriksaan Strict Zero Emoji**:
   - Audit regex Unicode `[\uD83C-\uDBFF\uDC00-\uDFFF]` menghasilkan 0 kecocokan di seluruh basis kode `.ts`, `.tsx`, dan kamus terjemahan.
4. **Backend Quality Gate**:
   - Menjalankan `docker exec litabmas_app php artisan test tests/Feature/QualityGateDay1Test.php` untuk memastikan tidak ada efek samping pada endpoint Laravel maupun isolasi multi-kampus.
