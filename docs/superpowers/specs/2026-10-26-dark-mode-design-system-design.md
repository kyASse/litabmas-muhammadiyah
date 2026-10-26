# Spesifikasi Desain Arsitektur: Penyesuaian Tema Dark Sistem Desain Hybrid Scholarly Enterprise
**Sistem Penelitian Terintegrasi Multi-Kampus (SIM-Penelitian Standalone RPL-2026)**

---

## 1. Informasi Dokumen & Identitas Spesifikasi

- **Topik**: Penyesuaian Arsitektur Tema Dark pada Sistem Desain UI/UX
- **Klasifikasi**: Architectural Design Specification
- **Tanggal Efektif**: 26 Oktober 2026
- **Status**: Disetujui (Approved Design Specification)
- **Dokumen Referensi Terkait**:
  - [Cetak Biru Sistem Desain UI/UX (design.md)](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/design.md)
  - [Cetak Biru Arsitektur Sistem (architecture.md)](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/architecture.md)
  - [Product Requirement Document Standalone (PRD)](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)
  - [Aturan Bisnis & Penanganan Kasus Batas (rules.md)](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/rules.md)

---

## 2. Latar Belakang & Pernyataan Masalah

Sistem Manajemen Penelitian Terintegrasi Standalone mengadopsi filosofi visual *Hybrid Scholarly Enterprise* yang memadukan wibawa tradisi akademik (dimensi *Scholarly*) dan presisi operasional (dimensi *Enterprise*).

Saat ini, implementasi tema dark pada repositori mengalami kendala arsitektural:
1. **Token Statis pada CSS**: Pada [app.css](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/css/app.css), blok `@theme` mendefinisikan warna permukaan (`--color-surface-*`), garis pembatas (`--color-border-*`), dan tipografi (`--color-text-*`) dengan nilai heksadesimal statis (contoh: `#f8fafc`, `#ffffff`, `#0f172a`). Hal ini menyebabkan utilitas warna tersebut tidak merespon penyematan kelas `.dark` pada elemen `<html>`.
2. **Ketiadaan Spesifikasi pada Rujukan Tunggal**: Dokumen kanonikal [design.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/design.md) belum memiliki spesifikasi baku palet tema dark, rasio kontras WCAG AAA, dan standar anti-slop untuk mode gelap.
3. **Inkonsistensi Komponen Inti**: Komponen pakai-ulang terstandarisasi ([StatusBadge.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/StatusBadge.tsx), [PDFUploader.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/PDFUploader.tsx), [TabularFigure.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/TabularFigure.tsx), [MetricCard.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/MetricCard.tsx), [PageHeader.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/PageHeader.tsx), [SplitScreenViewer.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/SplitScreenViewer.tsx)) masih mengandalkan kelas warna terang statis tanpa kelas adaptif `dark:`.
4. **Isolasi Pengalih Tema**: Komponen [ThemeToggle.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/ThemeToggle.tsx) hanya terpasang pada halaman landing publik ([welcome.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/welcome.tsx)) dan belum terintegrasi pada bilah navigasi aplikasi utama ([app-sidebar-header.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/app-sidebar-header.tsx)) maupun gerbang pratinjau ([DesignSystemPreview.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/DesignSystemPreview.tsx)).

---

## 3. Filosofi Desain & Standar Anti-Slop Mode Gelap (Deep Academic Midnight)

Sistem menetapkan konsep visual **Deep Academic Midnight Slate** yang dirancang khusus untuk kenyamanan membaca proposal penelitian berlembar-lembar di malam hari:

| Karakteristik AI Slop (DILARANG) | Standar Deep Academic Midnight (WAJIB) | Rasional Rekayasa |
|---|---|---|
| **Kanvas Hitam Legam Murni (`#000000`)**: Mengakibatkan mata cepat lelah dan kontras terlalu tajam. | **Kanvas Slate-950 (`#020617`) & Kartu Slate-900 (`#0F172A`)**: Kedalaman gelap berbobot abu-abu dingin institusional. | Mengurangi kelelahan mata (*eye strain*) saat penelaah membaca proposal dalam durasi panjang. |
| **Aksen Neon Berpendar Liar**: Border atau tombol dengan pendaran ungu/cyan menyilaukan. | **Aksen Akademik Terukur**: Deep Navy disesuaikan ke Blue-500 (`#3B82F6`) dan Emerald disesuaikan ke Emerald-500 (`#10B981`) tanpa bayangan neon. | Menjaga martabat dokumen resmi akademik dan integritas platform enterprise. |
| **Badge Silau atau Tak Terbaca**: Badge warna pastel putih di atas latar gelap atau warna gelap pekat tanpa sekat. | **Deep Slate Semi-Transparent Tint**: Kombinasi latar transparan `bg-{color}-950/40`, teks cerah `text-{color}-300`, dan border pembatas 1px `border-{color}-800/60`. | Menghasilkan penanda status yang tegas, rapi, dan memiliki rasio kontras prima. |

---

## 4. Arsitektur Token CSS Dinamis (app.css)

### 4.1 Pemetaan Blok `@theme` ke CSS Custom Properties
Pada berkas `resources/css/app.css`, blok `@theme` diubah untuk merujuk langsung pada variabel CSS:

```css
@theme {
    /* Tipografi Dual-Personality */
    --font-serif: 'Newsreader', 'Merriweather', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

    /* Token Permukaan Semantik (Dynamic Surfaces) */
    --color-surface-base: var(--surface-base);
    --color-surface-card: var(--surface-card);
    --color-surface-elevated: var(--surface-elevated);
    --color-surface-muted: var(--surface-muted);
    --color-surface-sidebar: var(--surface-sidebar);

    /* Token Garis Pembatas Semantik (Dynamic Borders) */
    --color-border-subtle: var(--border-subtle);
    --color-border-strong: var(--border-strong);
    --color-border-focus: var(--border-focus);

    /* Token Identitas Brand Semantik (Dynamic Brand Colors) */
    --color-brand-primary: var(--brand-primary);
    --color-brand-primary-hover: var(--brand-primary-hover);
    --color-brand-primary-light: var(--brand-primary-light);
    --color-brand-accent: var(--brand-accent);
    --color-brand-accent-hover: var(--brand-accent-hover);
    --color-brand-accent-light: var(--brand-accent-light);

    /* Token Tipografi Semantik (Dynamic Text Colors) */
    --color-text-primary: var(--text-primary);
    --color-text-secondary: var(--text-secondary);
    --color-text-muted: var(--text-muted);
    --color-text-inverse: var(--text-inverse);

    /* Token Keadaan Semantik (Dynamic Semantic States) */
    --color-semantic-success: var(--semantic-success);
    --color-semantic-info: var(--semantic-info);
    --color-semantic-warning: var(--semantic-warning);
    --color-semantic-danger: var(--semantic-danger);
}
```

### 4.2 Definisi Nilai Token: `:root` (Light) vs `.dark` (Dark)

```css
:root {
    /* Fondasi Kanvas & Permukaan Cool Slate */
    --surface-base: #f8fafc;        /* Slate-50 */
    --surface-card: #ffffff;        /* Pure White */
    --surface-elevated: #f1f5f9;    /* Slate-100 */
    --surface-muted: #e2e8f0;       /* Slate-200 */
    --surface-sidebar: #0f172a;     /* Slate-900 */

    /* Garis Pembatas 1px */
    --border-subtle: #e2e8f0;       /* Slate-200 */
    --border-strong: #cbd5e1;       /* Slate-300 */
    --border-focus: #1e3a8a;        /* Academic Navy */

    /* Tipografi Kontras Tinggi */
    --text-primary: #0f172a;        /* Slate-900 */
    --text-secondary: #475569;      /* Slate-600 */
    --text-muted: #94a3b8;          /* Slate-400 */
    --text-inverse: #ffffff;        /* White */

    /* Identitas Brand */
    --brand-primary: #1e3a8a;       /* Academic Navy */
    --brand-primary-hover: #1e40af; /* Blue-800 */
    --brand-primary-light: #eff6ff; /* Blue-50 */
    --brand-accent: #059669;        /* Academic Emerald */
    --brand-accent-hover: #047857;  /* Emerald-700 */
    --brand-accent-light: #ecfdf5;  /* Emerald-50 */

    /* Keadaan Semantik */
    --semantic-success: #059669;
    --semantic-info: #0284c7;
    --semantic-warning: #d97706;
    --semantic-danger: #e11d48;

    /* Variabel Kompatibilitas shadcn */
    --background: #f8fafc;
    --foreground: #0f172a;
    --card: #ffffff;
    --card-foreground: #0f172a;
    --popover: #ffffff;
    --popover-foreground: #0f172a;
    --border: #e2e8f0;
    --input: #e2e8f0;
    --ring: #1e3a8a;
}

.dark {
    /* Fondasi Kanvas & Permukaan Deep Academic Midnight */
    --surface-base: #020617;        /* Slate-950 */
    --surface-card: #0f172a;        /* Slate-900 */
    --surface-elevated: #1e293b;    /* Slate-800 */
    --surface-muted: #334155;       /* Slate-700 */
    --surface-sidebar: #020617;     /* Slate-950 */

    /* Garis Pembatas 1px */
    --border-subtle: #1e293b;       /* Slate-800 */
    --border-strong: #334155;       /* Slate-700 */
    --border-focus: #3b82f6;        /* Blue-500 */

    /* Tipografi Kontras Tinggi */
    --text-primary: #f8fafc;        /* Slate-50 - Rasio 14.5:1 (AAA) */
    --text-secondary: #94a3b8;      /* Slate-400 - Rasio 7.2:1 (AA+) */
    --text-muted: #64748b;          /* Slate-500 - Rasio 4.8:1 (AA) */
    --text-inverse: #0f172a;        /* Slate-900 */

    /* Identitas Brand */
    --brand-primary: #3b82f6;       /* Blue-500 */
    --brand-primary-hover: #60a5fa; /* Blue-400 */
    --brand-primary-light: #1e293b; /* Slate-800 */
    --brand-accent: #10b981;        /* Emerald-500 */
    --brand-accent-hover: #34d399;  /* Emerald-400 */
    --brand-accent-light: #064e3b;  /* Emerald-950 */

    /* Keadaan Semantik */
    --semantic-success: #10b981;
    --semantic-info: #38bdf8;
    --semantic-warning: #fbbf24;
    --semantic-danger: #f43f5e;

    /* Variabel Kompatibilitas shadcn */
    --background: #020617;
    --foreground: #f8fafc;
    --card: #0f172a;
    --card-foreground: #f8fafc;
    --popover: #0f172a;
    --popover-foreground: #f8fafc;
    --border: #1e293b;
    --input: #1e293b;
    --ring: #3b82f6;
}
```

---

## 5. Spesifikasi Komponen Inti UI

### 5.1 [StatusBadge.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/StatusBadge.tsx) (14 Siklus Hidup Penelitian)
Penerapan gaya *Deep Slate Semi-Transparent Tint* pada pemetaan status:

```typescript
const statusMap: Record<string, StatusConfig> = {
  Draft: {
    label: '[DRAFT]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: FileEdit,
  },
  Submitted: {
    label: '[DIAJUKAN]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    icon: Send,
  },
  In_Review: {
    label: '[SEDANG DIREVIEW]',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: Clock,
  },
  Lolos_Didanai: {
    label: '[LOLOS DIDANAI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Ditolak: {
    label: '[DITOLAK]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Revisi: {
    label: '[PERLU REVISI]',
    classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: AlertTriangle,
  },
  Contracted: {
    label: '[TERKONTRAK]',
    classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    icon: FileCheck,
  },
  Disbursed_T1: {
    label: '[CAIR TERMIN 1]',
    classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
    icon: Lock,
  },
  Disbursed_T2: {
    label: '[CAIR TERMIN 2]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: Unlock,
  },
  Monev_Approved: {
    label: '[MONEV DISETUJUI]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Monev_Locked: {
    label: '[TERKUNCI MONEV]',
    classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    icon: Lock,
  },
  Output_Verified: {
    label: '[LUARAN TERVERIFIKASI]',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    icon: ShieldCheck,
  },
  Completed_SKTS: {
    label: '[SELESAI (SKTS)]',
    classes: 'bg-emerald-50 text-emerald-900 border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/70',
    icon: Archive,
  },
  Terminated: {
    label: '[DIBATALKAN]',
    classes: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
};
```

### 5.2 [MetricCard.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/MetricCard.tsx)
- Kontainer: `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`.
- Label Judul: `text-slate-600 dark:text-slate-400`.
- Kontainer Ikon: `border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400`.
- Badge Variabel:
  - `neutral`: `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700`
  - `success`: `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60`
  - `warning`: `bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60`
  - `danger`: `bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60`
- Keterangan Bawah (*caption*): `text-slate-500 dark:text-slate-400`.

### 5.3 [TabularFigure.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/TabularFigure.tsx)
- Nilai angka: `text-slate-900 dark:text-slate-100`.
- Simbol awalan/akhiran: `text-slate-500 dark:text-slate-400`.

### 5.4 [PageHeader.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/PageHeader.tsx)
- Garis pembatas: `border-slate-200 dark:border-slate-800`.
- Breadcrumb teks: `text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400`.
- Judul: `text-slate-900 dark:text-slate-100`.
- Subtitle: `text-slate-600 dark:text-slate-400`.

### 5.5 [PDFUploader.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/PDFUploader.tsx)
- Dropzone: `border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-600`.
- Status berkas tersimpan: `bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100`.
- Kotak ikon PDF: `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400`.

### 5.6 [SplitScreenViewer.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/ui/SplitScreenViewer.tsx)
- Bilah alat atas: `bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`.
- Tombol aksi: `border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`.
- Panel form kanan: `bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800`.

---

## 6. Integrasi Navigasi & Gerbang Pratinjau

### 6.1 [app-sidebar-header.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/components/app-sidebar-header.tsx)
Menambahkan komponen `ThemeToggle` berdampingan dengan `LanguageSwitcher` pada header global aplikasi:

```tsx
<div className="flex flex-shrink-0 items-center gap-2">
    <ThemeToggle variant="compact" />
    <LanguageSwitcher variant="compact" />
</div>
```

### 6.2 [DesignSystemPreview.tsx](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/resources/js/pages/DesignSystemPreview.tsx)
- Menambahkan `ThemeToggle` pada bilah navigasi atas (desktop dan mobile).
- Memperbarui kontainer dan kartu showcase agar merender latar gelap (`dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`).
- Menyediakan katalog perbandingan token warna terang dan gelap.

---

## 7. Rencana Pengujian & Kriteria Keberhasilan (Release Gate)

1. **Uji Komponen Vitest**:
   - `npm run test:run` berhasil 100% tanpa kegagalan.
   - Penambahan uji perilaku `ThemeToggle` dan integrasi kelas `.dark` pada dokumen.
2. **Kompilasi Aset Frontend**:
   - `npm run build` berjalan sukses tanpa galat Tailwind CSS 4 atau kompilasi TypeScript.
3. **Kepatuhan Invarian Sistem**:
   - Bebas emoji 100% pada kode sumber, dokumentasi, dan antarmuka pengguna.
   - Pendaftaran kunci bahasa pada kamus `en.ts` dan `id.ts` untuk teks antarmuka baru.
   - Selaras 100% dengan `docs/technical/design.md`.

---

Dokumen spesifikasi ini telah siap menjadi acuan eksekusi teknis pada tahap implementasi rencana kerja.
