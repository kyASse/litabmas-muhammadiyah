# Frontend i18n Localization Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a zero-dependency, type-safe frontend internationalization (i18n) subsystem with English as the default and Indonesian as the optional language, replacing all hardcoded UI strings across core reusable components, the design system preview catalog, layouts, and public/auth pages with structured `.ts` dictionaries.

**Architecture:** A centralized dictionary architecture in `resources/js/lang/` where `en.ts` serves as the authoritative source of truth and TypeScript type generator (`TranslationType`), and `id.ts` strictly implements that type for 100% compile-time parity. A `useTranslation` hook and `TranslationProvider` React context manage active locale state, persisted across sessions via `localStorage` and `document.cookie` (mirroring `use-appearance`), accompanied by a standard `LanguageSwitcher` component adhering to the Hybrid Scholarly Enterprise design system.

**Tech Stack:** React 19, TypeScript 5.7, Inertia.js 2.3, Vite 7.3, Tailwind CSS 4, Lucide React, Vitest.

**Spec:** [docs/superpowers/specs/2026-10-16-frontend-i18n-localization-design.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/superpowers/specs/2026-10-16-frontend-i18n-localization-design.md)

## Global Constraints

- Strict Zero Emoji Invariant: 100% zero emoji symbols across all `.ts`, `.tsx`, tests, commit messages, and dictionaries. Use `[EN]`, `[ID]`, uppercase status badges, and Lucide React micro-icons (1.5-2.0px stroke).
- Default Language: English (`en`) is the default language on first load; Indonesian (`id`) is selectable via `LanguageSwitcher`.
- Zero-Dependency Type Safety: No external i18n library (e.g. `i18next`). Pure TypeScript object trees with `typeof en` compile-time type checking.
- Design System Consistency: Adhere to Cool Slate tokens and dual typography (Newsreader Serif / Plus Jakarta Sans / JetBrains Mono).
- Quality Gate: `npm run build` must compile with 0 TypeScript/Vite errors; Vitest tests must pass; `QualityGateDay1Test` in Docker must pass.

---

### Task 1: Dictionaries Foundation (`resources/js/lang/en.ts`, `id.ts`, `index.ts`)

**Files:**
- Create: `resources/js/lang/en.ts`
- Create: `resources/js/lang/id.ts`
- Create: `resources/js/lang/index.ts`
- Test: `resources/js/test-utils/i18n-dictionary.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type SupportedLocale = 'en' | 'id';
  export const en: { ... };
  export type TranslationType = typeof en;
  export const id: TranslationType;
  export const dictionaries: Record<SupportedLocale, TranslationType>;
  ```

- [ ] **Step 1: Write the failing dictionary test**

Create `resources/js/test-utils/i18n-dictionary.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { en, id, dictionaries, SupportedLocale } from '@/lang';

describe('i18n Dictionary Integrity', () => {
  it('contains en as default and id as optional', () => {
    expect(dictionaries.en).toBeDefined();
    expect(dictionaries.id).toBeDefined();
  });

  it('guarantees complete key parity between en and id', () => {
    const getKeys = (obj: Record<string, any>, prefix = ''): string[] => {
      return Object.keys(obj).flatMap((key) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof obj[key] === 'object' && obj[key] !== null
          ? getKeys(obj[key], path)
          : [path];
      });
    };

    const enKeys = getKeys(en).sort();
    const idKeys = getKeys(id).sort();

    expect(enKeys).toEqual(idKeys);
  });

  it('strictly adheres to the Zero Emoji Invariant', () => {
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    const allStrings = (obj: any): string[] => {
      return Object.values(obj).flatMap((val) =>
        typeof val === 'string' ? [val] : allStrings(val)
      );
    };

    const enTexts = allStrings(en);
    const idTexts = allStrings(id);

    for (const text of [...enTexts, ...idTexts]) {
      expect(emojiRegex.test(text)).toBe(false);
    }
  });

  it('defines all 14 research workflow statuses in English and Indonesian', () => {
    const requiredStatuses = [
      'Draft', 'Submitted', 'In_Review', 'Lolos_Didanai', 'Ditolak', 'Revisi',
      'Contracted', 'Disbursed_T1', 'Disbursed_T2', 'Monev_Approved', 'Monev_Locked',
      'Output_Verified', 'Completed_SKTS', 'Terminated'
    ];

    for (const status of requiredStatuses) {
      expect((en.statuses as any)[status]).toBeDefined();
      expect((id.statuses as any)[status]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/i18n-dictionary.test.ts`
Expected: FAIL with "Cannot find module '@/lang'"

- [ ] **Step 3: Implement `en.ts`, `id.ts`, and `index.ts`**

Create `resources/js/lang/en.ts` with comprehensive English dictionaries:
```typescript
export const en = {
  common: {
    appName: 'SIM-Penelitian Multi-Campus',
    specTag: 'STANDALONE SPEC 2026',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    submit: 'Submit',
    search: 'Search...',
    loading: 'Loading...',
    all: 'All',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    filter: 'Filter',
    reset: 'Reset',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
  },
  navigation: {
    dashboard: 'Dashboard',
    proposals: 'Proposals',
    reviews: 'Reviews',
    contracts: 'Contracts',
    monev: 'Monitoring & Evaluation',
    outputs: 'Research Outputs',
    settings: 'Settings',
    logout: 'Sign Out',
    home: 'Home',
    schemes: 'Research Schemes',
    documentation: 'Documentation',
    login: 'Sign In',
    register: 'Register',
  },
  statuses: {
    Draft: '[DRAFT]',
    Submitted: '[SUBMITTED]',
    In_Review: '[UNDER REVIEW]',
    Lolos_Didanai: '[FUNDED]',
    Ditolak: '[REJECTED]',
    Revisi: '[REVISION REQUIRED]',
    Contracted: '[CONTRACTED]',
    Disbursed_T1: '[DISBURSED T1 (70%)]',
    Disbursed_T2: '[DISBURSED T2 (30%)]',
    Monev_Approved: '[MONEV APPROVED]',
    Monev_Locked: '[MONEV LOCKED]',
    Output_Verified: '[OUTPUT VERIFIED]',
    Completed_SKTS: '[COMPLETED (SKTS)]',
    Terminated: '[TERMINATED]',
  },
  statusDescriptions: {
    Draft: 'Freely editable by the lead researcher',
    Submitted: 'Locked from editing, awaiting reviewer assignment',
    In_Review: 'Active review in progress (CoI-free guarantee)',
    Lolos_Didanai: 'Funding approved by institutional plenary review',
    Ditolak: 'Did not meet competitive passing grade',
    Revisi: 'Requires document revision within allocated deadline',
    Contracted: 'Official research contract signed and active',
    Disbursed_T1: 'First tranche (70%) disbursed after contract signing',
    Disbursed_T2: 'Second tranche (30%) disbursed after Monev approval',
    Monev_Approved: 'Progress report verified and approved by reviewers',
    Monev_Locked: 'Monev submission window closed',
    Output_Verified: 'Canonical registration (DOI/ISBN/IPR) validated',
    Completed_SKTS: 'SKTS issued, permanently locked into Read-Only Archive',
    Terminated: 'Research officially terminated due to force majeure',
  },
  components: {
    pdfUploader: {
      defaultLabel: 'Upload Proposal Document (PDF)',
      helperText: 'Document must be a single PDF file, maximum size 10 MB.',
      dragDropText: 'Drag and drop PDF document here, or',
      browseText: 'browse from computer',
      limitPrefix: 'Limit:',
      fileSaved: 'Saved Document',
      invalidFormat: 'Invalid file format. Only PDF files (.pdf) are allowed.',
      sizeExceeded: 'File size ({actual} MB) exceeds maximum limit of {max} MB.',
      removeFile: 'Remove file',
    },
    splitScreen: {
      reviewTitle: 'Document Review:',
      openNewTab: 'Open Document in New Tab',
      downloadPdf: 'Download PDF File',
      expandPdf: 'Expand PDF View',
      collapsePdf: 'Restore Split View',
      rubricTitle: 'Research Evaluation Rubric',
      rubricSubtitle: 'Score each criterion below based on the document on the left.',
      criteriaUrgency: '1. Research Urgency & Innovation (Weight 35%)',
      criteriaMethodology: '2. Research Methodology & Roadmap (Weight 35%)',
      criteriaFeasibility: '3. Budget Feasibility & Output Targets (Weight 30%)',
      coiAgreement: 'I certify no Conflict of Interest (CoI) with the researchers.',
      reviewerNotesLabel: 'Substantive Reviewer Notes',
      recommendationLabel: 'Final Recommendation',
      aggregateScoreLabel: 'Aggregate Rubric Score:',
      saveDraftButton: 'Save Draft Evaluation',
      finalSubmitButton: 'Submit Final Evaluation',
      scoreRangePoor: '0 (Poor)',
      scoreRangeFair: '50 (Fair)',
      scoreRangeExcellent: '100 (Excellent)',
    },
    tabularFigure: {
      currencyPrefix: 'IDR ',
    },
  },
  designSystem: {
    title: 'Design System Catalog: Hybrid Scholarly Enterprise',
    subtitle: 'Standardized UI component preview gate for multi-campus research system.',
    catalogSpecTag: 'STANDALONE SPEC 2026',
    previewGate: 'Design System Preview Gate',
    wcagTag: '[WCAG AAA]',
    zeroEmojiTag: '[ZERO EMOJI]',
    cleanTablesTag: '[21 CLEAN TABLES]',
    section1Title: '1. Color Palette Tokens (Cool Slate & Scholarly Palette)',
    section1Subtitle: 'Calibrated WCAG AAA contrast ratio tokens built for scholarly data density.',
    section2Title: '2. Dual-Personality Typography Scale',
    section2Subtitle: 'Newsreader Editorial Serif for scholarly literature; Plus Jakarta Sans for operational UI.',
    section3Title: '3. StatusBadge Component (14 Research Lifecycle Statuses)',
    section3Subtitle: 'Standardized research proposal, contract, monev, and output lifecycle badges.',
    section4Title: '4. PDFUploader Component (Single PDF 10 MB Guard)',
    section4Subtitle: 'Client-side drag-and-drop uploader with strict PDF MIME type and size checks.',
    section5Title: '5. TabularFigure Component (Anti-CLS Monospaced Numerics)',
    section5Subtitle: 'Monospaced numbers preventing Cumulative Layout Shift during data changes.',
    section6Title: '6. MetricCard Component (Bento Grid Overview)',
    section6Subtitle: 'Modular bento cards with financial and research performance metrics.',
    section7Title: '7. SplitScreenViewer Component (Reviewer Workspace)',
    section7Subtitle: '60% PDF document reader on the left and 40% interactive evaluation rubric on the right.',
    filterAll: 'All Phases',
    filterProposal: 'Proposal Phase',
    filterContract: 'Contract Phase',
    filterMonev: 'Monev Phase',
    filterCompletion: 'Completion Phase',
    metricPaguTitle: 'Competitive Research Pagu',
    metricPaguCaption: 'Total competitive grant budget allocation for 2026',
    metricPaguBadge: 'OFFICIAL PAGU',
    metricProposalsTitle: 'Total Submitted Proposals',
    metricProposalsCaption: 'Received during Wave 1 call for proposals',
    metricProposalsBadge: '+18% VS 2025',
    metricReviewersTitle: 'Active Assigned Reviewers',
    metricReviewersCaption: '100% free from Conflict of Interest (CoI)',
    metricReviewersBadge: 'MONEV READY',
    metricDisbursedTitle: 'Disbursed Tranche 1 Funds',
    metricDisbursedCaption: '70% allocation released upon contract signature',
    metricDisbursedBadge: '70% DISBURSED',
  },
  welcome: {
    heroTitle: 'Integrated Multi-Campus Research System',
    heroSubtitle: 'Next-generation scholarly research governance, competitive peer review, and grant monitoring platform.',
    searchPlaceholder: 'Search research schemes, topics, or faculty...',
    exploreSchemes: 'Explore Active Schemes',
    activeSchemesCount: 'Active Research Schemes',
    participatingUniversities: 'Participating Universities',
    grantsAwarded: 'Competitive Grants Awarded',
    loginCta: 'Sign In to Portal',
  },
  auth: {
    loginTitle: 'Sign In to Your Account',
    loginSubtitle: 'Enter your institutional email and password to access the portal',
    emailLabel: 'Institutional Email',
    emailPlaceholder: 'user@university.ac.id',
    passwordLabel: 'Password',
    rememberMe: 'Remember Me',
    signInButton: 'Sign In',
    forgotPassword: 'Forgot your password?',
    registerPrompt: 'Need an institutional account?',
    registerLink: 'Contact LPPM administrator',
  },
};

export type TranslationType = typeof en;
```

Create `resources/js/lang/id.ts` with complete Indonesian translations matching `TranslationType`:
```typescript
import { TranslationType } from './en';

export const id: TranslationType = {
  common: {
    appName: 'SIM-Penelitian Multi-Kampus',
    specTag: 'SPESIFIKASI STANDALONE 2026',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Sunting',
    delete: 'Hapus',
    back: 'Kembali',
    submit: 'Kirim',
    search: 'Cari...',
    loading: 'Memuat...',
    all: 'Semua',
    close: 'Tutup',
    actions: 'Aksi',
    status: 'Status',
    filter: 'Saring',
    reset: 'Atur Ulang',
    confirm: 'Konfirmasi',
    yes: 'Ya',
    no: 'Tidak',
  },
  navigation: {
    dashboard: 'Dasbor',
    proposals: 'Usulan Riset',
    reviews: 'Telaah Reviewer',
    contracts: 'Kontrak Penelitian',
    monev: 'Monitoring & Evaluasi',
    outputs: 'Target Luaran',
    settings: 'Pengaturan',
    logout: 'Keluar',
    home: 'Beranda',
    schemes: 'Skema Penelitian',
    documentation: 'Dokumentasi',
    login: 'Masuk',
    register: 'Daftar',
  },
  statuses: {
    Draft: '[DRAFT]',
    Submitted: '[DIAJUKAN]',
    In_Review: '[SEDANG DIREVIEW]',
    Lolos_Didanai: '[LOLOS DIDANAI]',
    Ditolak: '[DITOLAK]',
    Revisi: '[PERLU REVISI]',
    Contracted: '[TERKONTRAK]',
    Disbursed_T1: '[CAIR TERMIN 1 (70%)]',
    Disbursed_T2: '[CAIR TERMIN 2 (30%)]',
    Monev_Approved: '[MONEV DISETUJUI]',
    Monev_Locked: '[TERKUNCI MONEV]',
    Output_Verified: '[LUARAN TERVERIFIKASI]',
    Completed_SKTS: '[SELESAI (SKTS)]',
    Terminated: '[FORCE MAJEURE / DIBATALKAN]',
  },
  statusDescriptions: {
    Draft: 'Dapat diedit bebas oleh ketua pengusul',
    Submitted: 'Terkunci dari penyuntingan, menunggu plotting reviewer',
    In_Review: 'Proses telaah penilaian aktif (Bebas CoI)',
    Lolos_Didanai: 'Persetujuan pendanaan ditetapkan pada pleno reviewer',
    Ditolak: 'Tidak memenuhi passing grade kompetitif',
    Revisi: 'Memerlukan perbaikan dokumen proposal dalam batas waktu',
    Contracted: 'Perjanjian kontrak riset resmi ditandatangani',
    Disbursed_T1: 'Pencairan termin 1 (70%) setelah kontrak ditandatangani',
    Disbursed_T2: 'Pencairan termin 2 (30%) setelah laporan monev disetujui',
    Monev_Approved: 'Laporan kemajuan diverifikasi dan disetujui reviewer',
    Monev_Locked: 'Batas akhir unggah monev telah berakhir',
    Output_Verified: 'Verifikasi nomor registrasi kanonikal (DOI/ISBN/HKI) unik lolos',
    Completed_SKTS: 'SKTS diterbitkan, terkunci permanen dalam Arsip Baca-Saja',
    Terminated: 'Penelitian dihentikan secara resmi karena force majeure',
  },
  components: {
    pdfUploader: {
      defaultLabel: 'Unggah Dokumen Proposal (PDF)',
      helperText: 'Format dokumen wajib PDF tunggal, ukuran berkas maksimal 10 MB.',
      dragDropText: 'Seret dan lepas dokumen PDF di sini, atau',
      browseText: 'pilih dari komputer',
      limitPrefix: 'Batas:',
      fileSaved: 'Berkas Tersimpan',
      invalidFormat: 'Format berkas tidak valid. Hanya berkas PDF (.pdf) yang diperbolehkan.',
      sizeExceeded: 'Ukuran berkas ({actual} MB) melebihi batas maksimal {max} MB.',
      removeFile: 'Hapus berkas',
    },
    splitScreen: {
      reviewTitle: 'Telaah Berkas:',
      openNewTab: 'Buka Dokumen di Tab Baru',
      downloadPdf: 'Unduh Berkas PDF',
      expandPdf: 'Perluas Tampilan PDF',
      collapsePdf: 'Kembalikan Tampilan Terbagi',
      rubricTitle: 'Rubrik Penilaian Usulan Riset',
      rubricSubtitle: 'Isikan skor per kriteria berikut berdasarkan substansi dokumen di sebelah kiri.',
      criteriaUrgency: '1. Urgensi & Kebaruan Riset (Bobot 35%)',
      criteriaMethodology: '2. Metode & Peta Jalan Riset (Bobot 35%)',
      criteriaFeasibility: '3. Kelayakan Anggaran & Target Luaran (Bobot 30%)',
      coiAgreement: 'Saya menyatakan tidak memiliki Benturan Kepentingan (CoI) dengan tim peneliti.',
      reviewerNotesLabel: 'Catatan Telaah Substantif Reviewer',
      recommendationLabel: 'Rekomendasi Keputusan Akhir',
      aggregateScoreLabel: 'Nilai Komposit Rubrik:',
      saveDraftButton: 'Simpan Draf Penilaian',
      finalSubmitButton: 'Kirim Penilaian Akhir',
      scoreRangePoor: '0 (Kurang)',
      scoreRangeFair: '50 (Cukup)',
      scoreRangeExcellent: '100 (Sangat Baik)',
    },
    tabularFigure: {
      currencyPrefix: 'Rp ',
    },
  },
  designSystem: {
    title: 'Katalog Sistem Desain: Hybrid Scholarly Enterprise',
    subtitle: 'Gerbang pratinjau komponen antarmuka standar untuk sistem penelitian multi-kampus.',
    catalogSpecTag: 'SPESIFIKASI STANDALONE 2026',
    previewGate: 'Gerbang Pratinjau Sistem Desain',
    wcagTag: '[WCAG AAA]',
    zeroEmojiTag: '[ZERO EMOJI]',
    cleanTablesTag: '[21 TABEL BERSIH]',
    section1Title: '1. Palet Warna (Cool Slate & Academic Emerald)',
    section1Subtitle: 'Token rasio kontras WCAG AAA terkalibrasi untuk kepadatan data penelitian.',
    section2Title: '2. Skala Tipografi Ganda (Dual-Personality Typography)',
    section2Subtitle: 'Newsreader Serif untuk karya ilmiah; Plus Jakarta Sans untuk antarmuka operasional.',
    section3Title: '3. Komponen StatusBadge (14 Status Alur Riset)',
    section3Subtitle: 'Standardisasi lencana status siklus hidup usulan, kontrak, monev, dan luaran.',
    section4Title: '4. Komponen PDFUploader (Pengaman Berkas PDF 10 MB)',
    section4Subtitle: 'Pengunggah drag-and-drop dengan validasi ketat MIME type dan ukuran berkas.',
    section5Title: '5. Komponen TabularFigure (Angka Monospaced Anti-CLS)',
    section5Subtitle: 'Format angka monospaced yang mencegah Cumulative Layout Shift saat data berganti.',
    section6Title: '6. Komponen MetricCard (Ikhtisar Bento Grid)',
    section6Subtitle: 'Kartu modular bento grid untuk metrik kinerja pendanaan dan riset.',
    section7Title: '7. Komponen SplitScreenViewer (Ruang Kerja Penilai)',
    section7Subtitle: 'Rasio layar 60% pembaca PDF di sisi kiri dan 40% rubrik penilaian interaktif di sisi kanan.',
    filterAll: 'Semua Fase',
    filterProposal: 'Fase Pengusulan',
    filterContract: 'Fase Kontrak',
    filterMonev: 'Fase Monev',
    filterCompletion: 'Fase Penyelesaian',
    metricPaguTitle: 'Pagu Dana Kompetitif',
    metricPaguCaption: 'Total alokasi dana kompetitif riset tahun 2026',
    metricPaguBadge: 'PAGU RESMI',
    metricProposalsTitle: 'Total Usulan Proposal',
    metricProposalsCaption: 'Masuk pada periode pengusulan gelombang 1',
    metricProposalsBadge: '+18% DARI 2025',
    metricReviewersTitle: 'Reviewer Aktif Terplotting',
    metricReviewersCaption: '100% bebas dari benturan kepentingan (CoI)',
    metricReviewersBadge: 'SIAP MONEV',
    metricDisbursedTitle: 'Dana Disetujui Termin 1',
    metricDisbursedCaption: 'Penyaluran 70% pagu dana setelah penandatanganan kontrak',
    metricDisbursedBadge: '70% CAIR',
  },
  welcome: {
    heroTitle: 'Sistem Terintegrasi Penelitian Multi-Kampus',
    heroSubtitle: 'Platform tata kelola riset ilmiah generasi baru, penilaian sejawat kompetitif, dan monitoring hibah penelitian.',
    searchPlaceholder: 'Cari skema penelitian, topik, atau nama dosen...',
    exploreSchemes: 'Jelajahi Skema Aktif',
    activeSchemesCount: 'Skema Penelitian Aktif',
    participatingUniversities: 'Perguruan Tinggi Mitra',
    grantsAwarded: 'Hibah Kompetitif Tersalurkan',
    loginCta: 'Masuk ke Portal',
  },
  auth: {
    loginTitle: 'Masuk ke Akun Anda',
    loginSubtitle: 'Masukkan email institusi dan kata sandi untuk mengakses portal',
    emailLabel: 'Email Institusi',
    emailPlaceholder: 'nama@universitas.ac.id',
    passwordLabel: 'Kata Sandi',
    rememberMe: 'Ingat Saya',
    signInButton: 'Masuk',
    forgotPassword: 'Lupa kata sandi Anda?',
    registerPrompt: 'Memerlukan akun institusi?',
    registerLink: 'Hubungi administrator LPPM',
  },
};
```

Create `resources/js/lang/index.ts`:
```typescript
import { en, TranslationType } from './en';
import { id } from './id';

export type SupportedLocale = 'en' | 'id';

export const dictionaries: Record<SupportedLocale, TranslationType> = {
  en,
  id,
};

export { en, id };
export type { TranslationType };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/i18n-dictionary.test.ts`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add resources/js/lang/ resources/js/test-utils/i18n-dictionary.test.ts
git commit -m "feat(i18n): create type-safe English and Indonesian dictionaries"
```

---

### Task 2: Translation Context, Hook, & Root Integration (`resources/js/hooks/use-translation.tsx`, `resources/js/app.tsx`)

**Files:**
- Create: `resources/js/hooks/use-translation.tsx`
- Modify: `resources/js/app.tsx`
- Test: `resources/js/test-utils/use-translation.test.tsx`

**Interfaces:**
- Consumes: `SupportedLocale`, `TranslationType`, `dictionaries` from `@/lang`
- Produces:
  ```typescript
  export const TranslationProvider: React.FC<{ children: React.ReactNode }>;
  export function useTranslation(): {
    locale: SupportedLocale;
    setLocale: (newLocale: SupportedLocale) => void;
    toggleLocale: () => void;
    t: TranslationType;
    format: (template: string, replacements: Record<string, string | number>) => string;
  };
  ```

- [ ] **Step 1: Write the failing hook test**

Create `resources/js/test-utils/use-translation.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranslationProvider, useTranslation } from '@/hooks/use-translation';

function TestConsumer() {
  const { locale, setLocale, toggleLocale, t, format } = useTranslation();

  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="app-name">{t.common.appName}</span>
      <span data-testid="formatted-str">
        {format('Batas: {max} MB, Aktual: {actual} MB', { max: 10, actual: 5 })}
      </span>
      <button data-testid="toggle-btn" onClick={toggleLocale}>Toggle</button>
      <button data-testid="set-id-btn" onClick={() => setLocale('id')}>Set ID</button>
    </div>
  );
}

describe('useTranslation Hook & Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'app_locale=; path=/; max-age=0';
  });

  it('provides English as default locale and strings', () => {
    render(
      <TranslationProvider>
        <TestConsumer />
      </TranslationProvider>
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('app-name').textContent).toContain('Multi-Campus');
  });

  it('switches between en and id reactively when toggled', async () => {
    const user = userEvent.setup();
    render(
      <TranslationProvider>
        <TestConsumer />
      </TranslationProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    await user.click(toggleBtn);

    expect(screen.getByTestId('current-locale').textContent).toBe('id');
    expect(screen.getByTestId('app-name').textContent).toContain('Multi-Kampus');

    await user.click(toggleBtn);
    expect(screen.getByTestId('current-locale').textContent).toBe('en');
  });

  it('interpolates format parameters accurately', () => {
    render(
      <TranslationProvider>
        <TestConsumer />
      </TranslationProvider>
    );

    expect(screen.getByTestId('formatted-str').textContent).toBe('Batas: 10 MB, Aktual: 5 MB');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/use-translation.test.tsx`
Expected: FAIL with "Cannot find module '@/hooks/use-translation'"

- [ ] **Step 3: Implement `resources/js/hooks/use-translation.tsx`**

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries, SupportedLocale, TranslationType } from '@/lang';

export interface TranslationContextType {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  toggleLocale: () => void;
  t: TranslationType;
  format: (template: string, replacements: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  // Synchronize locale to state, localStorage, cookie, and html lang
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_locale', newLocale);
      setCookie('app_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'id' : 'en');
  }, [locale, setLocale]);

  // Load initial locale from localStorage, fallback to 'en'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('app_locale') as SupportedLocale | null;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
        setLocale(savedLocale);
      } else {
        setLocale('en');
      }
    }
  }, [setLocale]);

  const format = useCallback((template: string, replacements: Record<string, string | number>): string => {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }, []);

  const t = dictionaries[locale] || dictionaries.en;

  return (
    <TranslationContext.Provider value={{ locale, setLocale, toggleLocale, t, format }}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (!context) {
    // Graceful fallback if invoked outside TranslationProvider (e.g. isolated test or preview)
    const defaultLocale: SupportedLocale = 'en';
    return {
      locale: defaultLocale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: dictionaries[defaultLocale],
      format: (template, replacements) => {
        let res = template;
        for (const [k, v] of Object.entries(replacements)) {
          res = res.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
        return res;
      },
    };
  }
  return context;
}
```

- [ ] **Step 4: Wrap `TranslationProvider` in `resources/js/app.tsx`**

Modify `resources/js/app.tsx`:
```tsx
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { TranslationProvider } from './hooks/use-translation';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <TranslationProvider>
                <App {...props} />
            </TranslationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npx vitest run resources/js/test-utils/use-translation.test.tsx`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add resources/js/hooks/use-translation.tsx resources/js/app.tsx resources/js/test-utils/use-translation.test.tsx
git commit -m "feat(i18n): implement useTranslation hook, context provider, and root app wrapper"
```

---

### Task 3: `LanguageSwitcher` Component & UI Barrel Export

**Files:**
- Create: `resources/js/components/ui/LanguageSwitcher.tsx`
- Modify: `resources/js/components/ui/index.ts`
- Test: `resources/js/test-utils/language-switcher.test.tsx`

**Interfaces:**
- Consumes: `useTranslation` from `@/hooks/use-translation`
- Produces:
  ```typescript
  export interface LanguageSwitcherProps {
    variant?: 'segmented' | 'compact';
    className?: string;
  }
  export const LanguageSwitcher: React.FC<LanguageSwitcherProps>;
  ```

- [ ] **Step 1: Write the failing component test**

Create `resources/js/test-utils/language-switcher.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranslationProvider } from '@/hooks/use-translation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

describe('LanguageSwitcher Component', () => {
  it('renders without any emoji symbols in segmented variant', () => {
    const { container } = render(
      <TranslationProvider>
        <LanguageSwitcher variant="segmented" />
      </TranslationProvider>
    );

    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
    expect(screen.getByText('EN')).toBeDefined();
    expect(screen.getByText('ID')).toBeDefined();
  });

  it('renders compact variant with uppercase badge and toggles locale', async () => {
    const user = userEvent.setup();
    render(
      <TranslationProvider>
        <LanguageSwitcher variant="compact" />
      </TranslationProvider>
    );

    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('[en]');

    await user.click(btn);
    expect(btn.textContent).toContain('[id]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/language-switcher.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/LanguageSwitcher'"

- [ ] **Step 3: Implement `resources/js/components/ui/LanguageSwitcher.tsx`**

```tsx
import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface LanguageSwitcherProps {
  variant?: 'segmented' | 'compact';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { locale, setLocale, toggleLocale } = useTranslation();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition-colors shadow-2xs ${className}`}
        title="Switch Language (EN / ID)"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
        <span className="uppercase font-bold">[{locale}]</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-md border border-slate-200 bg-slate-100 text-xs font-mono ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-0.5 rounded transition-all text-xs ${
          locale === 'en'
            ? 'bg-white text-blue-900 font-bold shadow-2xs'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('id')}
        className={`px-2 py-0.5 rounded transition-all text-xs ${
          locale === 'id'
            ? 'bg-white text-blue-900 font-bold shadow-2xs'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        ID
      </button>
    </div>
  );
};

export default LanguageSwitcher;
```

Export `LanguageSwitcher` in `resources/js/components/ui/index.ts`:
```typescript
export * from './StatusBadge';
export * from './PDFUploader';
export * from './TabularFigure';
export * from './MetricCard';
export * from './PageHeader';
export * from './SplitScreenViewer';
export * from './LanguageSwitcher';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/language-switcher.test.tsx`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/ui/LanguageSwitcher.tsx resources/js/components/ui/index.ts resources/js/test-utils/language-switcher.test.tsx
git commit -m "feat(i18n): implement zero-emoji LanguageSwitcher component"
```

---

### Task 4: Localize Core Reusable UI Components

**Files:**
- Modify: `resources/js/components/ui/StatusBadge.tsx`
- Modify: `resources/js/components/ui/PDFUploader.tsx`
- Modify: `resources/js/components/ui/SplitScreenViewer.tsx`
- Modify: `resources/js/components/ui/TabularFigure.tsx`
- Test: `resources/js/test-utils/localized-components.test.tsx`

**Interfaces:**
- Consumes: `useTranslation` from `@/hooks/use-translation`
- Produces: Components reactively displaying localized copy based on active `locale` without breaking existing props.

- [ ] **Step 1: Write the failing localized components test**

Create `resources/js/test-utils/localized-components.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranslationProvider, useTranslation } from '@/hooks/use-translation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';

function LocalizedHarness() {
  const { toggleLocale } = useTranslation();
  return (
    <div>
      <StatusBadge status="In_Review" />
      <StatusBadge status="Disbursed_T1" />
      <TabularFigure value={315000000} type="currency" />
      <button onClick={toggleLocale} data-testid="switch-btn">Switch</button>
    </div>
  );
}

describe('Localized Core Components', () => {
  it('renders English status badges and currency by default', () => {
    render(
      <TranslationProvider>
        <LocalizedHarness />
      </TranslationProvider>
    );

    expect(screen.getByText('[UNDER REVIEW]')).toBeDefined();
    expect(screen.getByText('[DISBURSED T1 (70%)]')).toBeDefined();
    expect(screen.getByText(/IDR/)).toBeDefined();
  });

  it('renders Indonesian status badges and currency when locale is toggled to id', async () => {
    const user = userEvent.setup();
    render(
      <TranslationProvider>
        <LocalizedHarness />
      </TranslationProvider>
    );

    await user.click(screen.getByTestId('switch-btn'));

    expect(screen.getByText('[SEDANG DIREVIEW]')).toBeDefined();
    expect(screen.getByText('[CAIR TERMIN 1 (70%)]')).toBeDefined();
    expect(screen.getByText(/Rp/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/localized-components.test.tsx`
Expected: FAIL (StatusBadge renders Indonesian hardcoded text by default)

- [ ] **Step 3: Update `StatusBadge.tsx` to use `t.statuses[status]`**

In `resources/js/components/ui/StatusBadge.tsx`:
Read translation dictionary via `const { t } = useTranslation();`.
Replace the hardcoded labels with `t.statuses[status] || statusConfig[status].defaultLabel`.

- [ ] **Step 4: Update `PDFUploader.tsx` to use `t.components.pdfUploader.*`**

In `resources/js/components/ui/PDFUploader.tsx`:
Read `{ t, format } = useTranslation();`.
Set default values and drag-drop text using `t.components.pdfUploader.*` and parameter replacement via `format()`.

- [ ] **Step 5: Update `SplitScreenViewer.tsx` to use `t.components.splitScreen.*`**

In `resources/js/components/ui/SplitScreenViewer.tsx`:
Read `{ t } = useTranslation();`.
Replace `'Telaah Berkas:'` with `t.components.splitScreen.reviewTitle`.
Replace title attributes and tooltips with `t.components.splitScreen.*`.

- [ ] **Step 6: Update `TabularFigure.tsx` to support localized currency format**

In `resources/js/components/ui/TabularFigure.tsx`:
Read `{ locale } = useTranslation();`.
If `type === 'currency'`:
- Mode `en`: prefix `IDR `, format with comma (e.g. `315,000,000`).
- Mode `id`: prefix `Rp `, format with period (e.g. `315.000.000`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run resources/js/test-utils/localized-components.test.tsx`
Expected: PASS (2 passed)

- [ ] **Step 8: Commit**

```bash
git add resources/js/components/ui/ resources/js/test-utils/localized-components.test.tsx
git commit -m "feat(i18n): localize StatusBadge, PDFUploader, SplitScreenViewer, and TabularFigure"
```

---

### Task 5: Localize DesignSystemPreview Catalog & Integrate LanguageSwitcher

**Files:**
- Modify: `resources/js/pages/DesignSystemPreview.tsx`

**Interfaces:**
- Consumes: `useTranslation` and `LanguageSwitcher` from `@/components/ui`
- Produces: Fully localized interactive design catalog switching between EN and ID reactively.

- [ ] **Step 1: Integrate `LanguageSwitcher` into top header bar**

In `resources/js/pages/DesignSystemPreview.tsx`:
- Import `useTranslation` and `LanguageSwitcher`.
- Place `<LanguageSwitcher variant="segmented" />` in the top sticky navigation header next to `[ZERO EMOJI]` badge.

- [ ] **Step 2: Replace hardcoded strings with `t.designSystem.*` and `t.statuses.*`**

- Replace top banner titles, tags, and subtitle.
- Replace navigation sidebar pills (`1. Color Palette`, `2. Dual Typography`, etc.).
- Replace Section 1-7 titles, subtitles, and descriptions.
- Replace MetricCard labels, captions, and badges with `t.designSystem.metric*`.
- Replace SplitScreenViewer interactive rubric form labels:
  - Criteria titles with `t.components.splitScreen.criteria*`.
  - CoI checkbox label with `t.components.splitScreen.coiAgreement`.
  - Reviewer notes label with `t.components.splitScreen.reviewerNotesLabel`.
  - Recommendation label with `t.components.splitScreen.recommendationLabel`.
  - Rubric score slider guides (`0 (Poor)`, `50 (Fair)`, `100 (Excellent)`).

- [ ] **Step 3: Verify TypeScript build**

Run: `npm run build`
Expected: Successful build with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/DesignSystemPreview.tsx
git commit -m "feat(i18n): localize DesignSystemPreview catalog and embed LanguageSwitcher"
```

---

### Task 6: Localize Layouts, Welcome, and Authentication Pages

**Files:**
- Modify: `resources/js/layouts/public-layout.tsx`
- Modify: `resources/js/layouts/app-layout.tsx`
- Modify: `resources/js/pages/welcome.tsx`
- Modify: `resources/js/pages/auth/login.tsx`

**Interfaces:**
- Consumes: `useTranslation` and `LanguageSwitcher`
- Produces: Fully localized landing, layout navigation, and sign-in pages.

- [ ] **Step 1: Localize `public-layout.tsx` and `app-layout.tsx`**

- Import `useTranslation` and `LanguageSwitcher`.
- In `public-layout.tsx`:
  - Replace navigation links (Beranda, Skema Penelitian, dsb.) with `t.navigation.*`.
  - Insert `<LanguageSwitcher variant="compact" />` into navbar.
- In `app-layout.tsx`:
  - Replace navigation labels with `t.navigation.*`.
  - Insert `<LanguageSwitcher variant="compact" />` into the app header.

- [ ] **Step 2: Localize `welcome.tsx`**

- Import `useTranslation`.
- Replace hero heading, subheadings, search placeholder with `t.welcome.*`.
- Replace statistical counter cards with `t.welcome.*`.

- [ ] **Step 3: Localize `auth/login.tsx`**

- Import `useTranslation` and `LanguageSwitcher`.
- Place `<LanguageSwitcher variant="segmented" />` in the login card header.
- Replace form labels (Email, Password, Remember Me, Sign In) with `t.auth.*`.

- [ ] **Step 4: Verify TypeScript build**

Run: `npm run build`
Expected: Successful build with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add resources/js/layouts/ resources/js/pages/welcome.tsx resources/js/pages/auth/login.tsx
git commit -m "feat(i18n): localize public layout, app layout, welcome landing, and login page"
```

---

### Task 7: Comprehensive Verification & Quality Gate

**Files:**
- Test all components and integration points.

- [ ] **Step 1: Run all frontend unit tests**

Run: `npm test`
Expected: All Vitest unit tests pass.

- [ ] **Step 2: Run Strict Zero Emoji audit**

Run PowerShell audit:
```powershell
Select-String -Path resources/js/**/*.ts, resources/js/**/*.tsx -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```
Expected: 0 matches found.

- [ ] **Step 3: Run frontend production build**

Run: `npm run build`
Expected: Vite build completes cleanly with 0 errors.

- [ ] **Step 4: Run backend Quality Gate in Docker**

Run: `docker exec litabmas_app php artisan test tests/Feature/QualityGateDay1Test.php`
Expected: All 5 tests pass (109 assertions).

- [ ] **Step 5: Verify preview route via curl**

Run: `curl.exe -i -s http://localhost:8000/design-system-preview`
Expected: HTTP 200 OK.
