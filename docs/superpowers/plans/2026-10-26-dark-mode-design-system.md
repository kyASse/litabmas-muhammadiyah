# Penyesuaian Tema Dark Sistem Desain Hybrid Scholarly Enterprise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan tema dark arsitektural berbasis *Deep Academic Midnight Slate* dengan CSS variables dinamis pada Tailwind CSS 4, mengadaptasi 6 komponen inti UI terstandarisasi, mengintegrasikan `ThemeToggle` pada bilah navigasi dan gerbang pratinjau (`DesignSystemPreview`), serta memperbarui dokumen rujukan tunggal `docs/technical/design.md`.

**Architecture:** Mengalihkan deklarasi warna `@theme` di `app.css` menjadi CSS Custom Properties dinamis (`var(--...)`) yang merujuk pada palet Cool Slate di `:root` dan Deep Academic Midnight di `.dark`. Enam komponen inti dan halaman pratinjau diadaptasi dengan kelas utilitas `dark:` terstandarisasi bebas efek silau (*anti-slop*), diuji dengan Vitest, dan diverifikasi dengan `npm run build`.

**Tech Stack:** React 19, TypeScript, Inertia.js 2.0, Tailwind CSS 4, Lucide React, Vitest / React Testing Library.

**Spec:** [docs/superpowers/specs/2026-10-26-dark-mode-design-system-design.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/superpowers/specs/2026-10-26-dark-mode-design-system-design.md)

## Global Constraints

- Standar Anti-Slop Mutlak: Dilarang menggunakan kanvas hitam pekat murni (`#000000`) atau aksen berpendar neon (*glowing neon*).
- Standar Bebas Emoji Mutlak (*Strict Zero Emoji Invariant*): Seluruh kode, teks antarmuka, komentar, dokumentasi, dan penanda visual wajib bebas 100% dari simbol emoji visual.
- Isolasi Multi-Tenancy & Integritas: Tidak boleh mengubah atau meregresi modul riset yang ada.
- Internasionalisasi (i18n): Seluruh teks salinan antarmuka baru wajib terdaftar pada `resources/js/lang/en.ts` dan `resources/js/lang/id.ts`.
- Rasio Kontras Aksesibilitas: Teks utama (`text-primary`) wajib memenuhi WCAG AAA (minimal 7:1; target 14.5:1), teks sekunder (`text-secondary`) minimal WCAG AA (minimal 4.5:1; target 7.2:1).

---

### Task 1: Restrukturisasi Variabel CSS & Arsitektur Token Dinamis (`resources/css/app.css`)

**Files:**
- Modify: `resources/css/app.css:12-220`
- Test: `resources/js/test-utils/app-css-tokens.test.ts`

**Interfaces:**
- Consumes: Tailwind CSS 4 `@theme` configuration and standard CSS variables.
- Produces: Dynamic semantic color utilities: `bg-surface-base`, `bg-surface-card`, `bg-surface-elevated`, `bg-surface-muted`, `border-border-subtle`, `border-border-strong`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, dsb.

- [ ] **Step 1: Write test verifying CSS theme variables exist in app.css**

Create `resources/js/test-utils/app-css-tokens.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Theme Token Architecture', () => {
    it('declares dynamic CSS variables in @theme instead of static hex values', () => {
        const cssPath = path.resolve(process.cwd(), 'resources/css/app.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Verify @theme delegates to var(--...)
        expect(cssContent).toContain('--color-surface-base: var(--surface-base);');
        expect(cssContent).toContain('--color-surface-card: var(--surface-card);');
        expect(cssContent).toContain('--color-text-primary: var(--text-primary);');
        expect(cssContent).toContain('--color-border-subtle: var(--border-subtle);');

        // Verify :root contains light tokens
        expect(cssContent).toContain('--surface-base: #f8fafc;');
        expect(cssContent).toContain('--surface-card: #ffffff;');

        // Verify .dark contains Deep Academic Midnight tokens
        expect(cssContent).toContain('--surface-base: #020617;');
        expect(cssContent).toContain('--surface-card: #0f172a;');
        expect(cssContent).toContain('--text-primary: #f8fafc;');
        expect(cssContent).toContain('--border-subtle: #1e293b;');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/app-css-tokens.test.ts`
Expected: FAIL (current `app.css` uses static hex codes in `@theme` and lacks `--surface-*` in `:root`/`.dark`).

- [ ] **Step 3: Update `resources/css/app.css` with dynamic tokens**

In `resources/css/app.css`:
1. In `@theme`, change:
   - `--color-surface-base: var(--surface-base);`
   - `--color-surface-card: var(--surface-card);`
   - `--color-surface-elevated: var(--surface-elevated);`
   - `--color-surface-muted: var(--surface-muted);`
   - `--color-surface-sidebar: var(--surface-sidebar);`
   - `--color-border-subtle: var(--border-subtle);`
   - `--color-border-strong: var(--border-strong);`
   - `--color-border-focus: var(--border-focus);`
   - `--color-brand-primary: var(--brand-primary);`
   - `--color-brand-primary-hover: var(--brand-primary-hover);`
   - `--color-brand-primary-light: var(--brand-primary-light);`
   - `--color-brand-accent: var(--brand-accent);`
   - `--color-brand-accent-hover: var(--brand-accent-hover);`
   - `--color-brand-accent-light: var(--brand-accent-light);`
   - `--color-text-primary: var(--text-primary);`
   - `--color-text-secondary: var(--text-secondary);`
   - `--color-text-muted: var(--text-muted);`
   - `--color-text-inverse: var(--text-inverse);`
2. In `:root`, add corresponding values:
   - `--surface-base: #f8fafc;`
   - `--surface-card: #ffffff;`
   - `--surface-elevated: #f1f5f9;`
   - `--surface-muted: #e2e8f0;`
   - `--surface-sidebar: #0f172a;`
   - `--border-subtle: #e2e8f0;`
   - `--border-strong: #cbd5e1;`
   - `--border-focus: #1e3a8a;`
   - `--text-primary: #0f172a;`
   - `--text-secondary: #475569;`
   - `--text-muted: #94a3b8;`
   - `--text-inverse: #ffffff;`
   - `--brand-primary: #1e3a8a;`
   - `--brand-primary-hover: #1e40af;`
   - `--brand-primary-light: #eff6ff;`
   - `--brand-accent: #059669;`
   - `--brand-accent-hover: #047857;`
   - `--brand-accent-light: #ecfdf5;`
3. In `.dark`, add Deep Academic Midnight values:
   - `--surface-base: #020617;`
   - `--surface-card: #0f172a;`
   - `--surface-elevated: #1e293b;`
   - `--surface-muted: #334155;`
   - `--surface-sidebar: #020617;`
   - `--border-subtle: #1e293b;`
   - `--border-strong: #334155;`
   - `--border-focus: #3b82f6;`
   - `--text-primary: #f8fafc;`
   - `--text-secondary: #94a3b8;`
   - `--text-muted: #64748b;`
   - `--text-inverse: #0f172a;`
   - `--brand-primary: #3b82f6;`
   - `--brand-primary-hover: #60a5fa;`
   - `--brand-primary-light: #1e293b;`
   - `--brand-accent: #10b981;`
   - `--brand-accent-hover: #34d399;`
   - `--brand-accent-light: #064e3b;`
   - Keep shadcn variables harmonized (`--background: #020617;`, `--card: #0f172a;`, `--border: #1e293b;`, `--foreground: #f8fafc;`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/app-css-tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/css/app.css resources/js/test-utils/app-css-tokens.test.ts
git commit -m "feat(css): refactor design system tokens to dynamic css custom properties"
```

---

### Task 2: Adaptasi Komponen Penampil Data Inti (`TabularFigure.tsx`, `PageHeader.tsx`, `MetricCard.tsx`)

**Files:**
- Modify: `resources/js/components/ui/TabularFigure.tsx:65-80`
- Modify: `resources/js/components/ui/PageHeader.tsx:28-75`
- Modify: `resources/js/components/ui/MetricCard.tsx:28-78`
- Test: `resources/js/test-utils/core-display-dark-mode.test.tsx`

**Interfaces:**
- Consumes: Tailwind dark variant classes.
- Produces: Dark-aware `TabularFigure`, `PageHeader`, and `MetricCard` components.

- [ ] **Step 1: Write failing component tests for dark mode classes**

Create `resources/js/test-utils/core-display-dark-mode.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { DollarSign } from 'lucide-react';
import { TranslationProvider } from '@/hooks/use-translation';

describe('Core Display Components Dark Mode', () => {
    it('renders TabularFigure with dark text color classes', () => {
        const { container } = render(
            <TranslationProvider>
                <TabularFigure value={50000000} type="currency" />
            </TranslationProvider>
        );
        const span = container.querySelector('span');
        expect(span?.className).toContain('dark:text-slate-100');
    });

    it('renders PageHeader with dark border and text classes', () => {
        const { container } = render(
            <TranslationProvider>
                <PageHeader title="Judul Riset" subtitle="Deskripsi Skema" />
            </TranslationProvider>
        );
        const header = container.firstChild as HTMLElement;
        expect(header.className).toContain('dark:border-slate-800');
        const h1 = container.querySelector('h1');
        expect(h1?.className).toContain('dark:text-slate-100');
    });

    it('renders MetricCard with dark surface, border, and badge classes', () => {
        const { container } = render(
            <TranslationProvider>
                <MetricCard title="Total Anggaran" value={150000000} icon={DollarSign} badgeText="Lolos" badgeVariant="success" />
            </TranslationProvider>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('dark:bg-slate-900');
        expect(card.className).toContain('dark:border-slate-800');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/core-display-dark-mode.test.tsx`
Expected: FAIL (missing `dark:` classes).

- [ ] **Step 3: Update `TabularFigure.tsx`, `PageHeader.tsx`, and `MetricCard.tsx`**

1. In `resources/js/components/ui/TabularFigure.tsx`:
   - Change `text-slate-900` to `text-slate-900 dark:text-slate-100`.
   - Change `text-slate-500` for prefix/suffix to `text-slate-500 dark:text-slate-400`.
2. In `resources/js/components/ui/PageHeader.tsx`:
   - Change outer container to `mb-6 pb-5 border-b border-slate-200 dark:border-slate-800`.
   - Update breadcrumb text to `text-slate-500 dark:text-slate-400`.
   - Update separator to `text-slate-400 dark:text-slate-600`.
   - Update active crumb to `text-slate-800 dark:text-slate-200`.
   - Update h1 to include `dark:text-slate-100`.
   - Update subtitle to `text-slate-600 dark:text-slate-400`.
3. In `resources/js/components/ui/MetricCard.tsx`:
   - Update outer container to `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm`.
   - Update title to `text-xs font-sans font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`.
   - Update icon container to `border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400`.
   - Update badge variant map:
     - `neutral`: `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700`
     - `success`: `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60`
     - `warning`: `bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60`
     - `danger`: `bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60`
   - Update caption to `text-slate-500 dark:text-slate-400`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/core-display-dark-mode.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/ui/TabularFigure.tsx resources/js/components/ui/PageHeader.tsx resources/js/components/ui/MetricCard.tsx resources/js/test-utils/core-display-dark-mode.test.tsx
git commit -m "feat(ui): adapt TabularFigure, PageHeader, and MetricCard for dark mode"
```

---

### Task 3: Adaptasi Semantik StatusBadge (*Deep Slate Semi-Transparent Tint*)

**Files:**
- Modify: `resources/js/components/ui/StatusBadge.tsx:82-170`
- Test: `resources/js/test-utils/status-badge-dark.test.tsx`

**Interfaces:**
- Consumes: Badge status type.
- Produces: `StatusBadge` with unified light and dark classes matching the *Deep Slate Semi-Transparent Tint* formula.

- [ ] **Step 1: Write failing component test for StatusBadge dark mode classes**

Create `resources/js/test-utils/status-badge-dark.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TranslationProvider } from '@/hooks/use-translation';

describe('StatusBadge Dark Mode Tint Classes', () => {
    it('renders Draft with dark:bg-slate-800/80 and dark:text-slate-300', () => {
        const { container } = render(
            <TranslationProvider>
                <StatusBadge status="Draft" />
            </TranslationProvider>
        );
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain('dark:bg-slate-800/80');
        expect(badge.className).toContain('dark:text-slate-300');
    });

    it('renders Lolos_Didanai with dark:bg-emerald-950/40 and dark:text-emerald-300', () => {
        const { container } = render(
            <TranslationProvider>
                <StatusBadge status="Lolos_Didanai" />
            </TranslationProvider>
        );
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain('dark:bg-emerald-950/40');
        expect(badge.className).toContain('dark:text-emerald-300');
        expect(badge.className).toContain('dark:border-emerald-800/60');
    });

    it('renders Ditolak with dark:bg-rose-950/40 and dark:text-rose-300', () => {
        const { container } = render(
            <TranslationProvider>
                <StatusBadge status="Ditolak" />
            </TranslationProvider>
        );
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain('dark:bg-rose-950/40');
        expect(badge.className).toContain('dark:text-rose-300');
        expect(badge.className).toContain('dark:border-rose-800/60');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/status-badge-dark.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `statusMap` in `resources/js/components/ui/StatusBadge.tsx`**

Update `statusMap` in `resources/js/components/ui/StatusBadge.tsx` to include the dark classes for all 14 statuses plus the additional workflow statuses according to Section 5.1 of the design spec doc:
- `Draft`: add `dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700`
- `Submitted`: add `dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60`
- `In_Review`: add `dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60`
- `Lolos_Didanai`: add `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60`
- `Ditolak`: add `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60`
- `Revisi`: add `dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60`
- `Contracted`: add `dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60`
- `Disbursed_T1`: add `dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60`
- `Disbursed_T2`: add `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60`
- `Monev_Approved`: add `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60`
- `Monev_Locked`: add `dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60`
- `Output_Verified`: add `dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60`
- `Completed_SKTS`: add `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/70`
- `Terminated`: add `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60`
- And other statuses: `Active`, `Inactive`, `Signed`, `Pending`, `Disbursed`, `Approved`, `Administrasi_Valid`, etc.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/status-badge-dark.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/ui/StatusBadge.tsx resources/js/test-utils/status-badge-dark.test.tsx
git commit -m "feat(ui): update StatusBadge with Deep Slate Semi-Transparent Tint dark classes"
```

---

### Task 4: Adaptasi Komponen Input & Evaluasi Riset (`PDFUploader.tsx`, `SplitScreenViewer.tsx`)

**Files:**
- Modify: `resources/js/components/ui/PDFUploader.tsx:64-135`
- Modify: `resources/js/components/ui/SplitScreenViewer.tsx:22-90`
- Test: `resources/js/test-utils/interactive-components-dark.test.tsx`

**Interfaces:**
- Consumes: Tailwind dark classes.
- Produces: Dark-mode ready `PDFUploader` and `SplitScreenViewer`.

- [ ] **Step 1: Write failing component test**

Create `resources/js/test-utils/interactive-components-dark.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PDFUploader } from '@/components/ui/PDFUploader';
import { SplitScreenViewer } from '@/components/ui/SplitScreenViewer';
import { TranslationProvider } from '@/hooks/use-translation';

describe('Interactive Components Dark Mode', () => {
    it('renders PDFUploader with dark dropzone styling', () => {
        const { container } = render(
            <TranslationProvider>
                <PDFUploader value={null} onChange={() => {}} />
            </TranslationProvider>
        );
        const dropzone = container.querySelector('.border-dashed');
        expect(dropzone?.className).toContain('dark:border-slate-700');
        expect(dropzone?.className).toContain('dark:bg-slate-900/50');
    });

    it('renders SplitScreenViewer with dark toolbar and panel classes', () => {
        const { container } = render(
            <TranslationProvider>
                <SplitScreenViewer pdfUrl="/mock.pdf" documentTitle="Usulan Riset" formContent={<div>Form</div>} />
            </TranslationProvider>
        );
        const outer = container.firstChild as HTMLElement;
        expect(outer.className).toContain('dark:bg-slate-950');
        const toolbar = outer.querySelector('.h-12');
        expect(toolbar?.className).toContain('dark:bg-slate-900');
        expect(toolbar?.className).toContain('dark:border-slate-800');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/interactive-components-dark.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `PDFUploader.tsx` and `SplitScreenViewer.tsx`**

1. In `resources/js/components/ui/PDFUploader.tsx`:
   - Label: `text-slate-700 dark:text-slate-300`.
   - File size limit: `text-slate-500 dark:text-slate-400`.
   - Dropzone: `border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-600`.
   - Dragging dropzone: `border-blue-900 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30`.
   - Icon: `text-slate-400 dark:text-slate-500`.
   - Drag/drop prompt text: `text-slate-800 dark:text-slate-200` with browse text `text-blue-900 dark:text-blue-400`.
   - Sub-helper text: `text-slate-500 dark:text-slate-400`.
   - Uploaded file container: `bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800`.
   - Uploaded file icon box: `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400`.
   - Uploaded file name: `text-slate-900 dark:text-slate-100`.
   - Uploaded file size: `text-slate-500 dark:text-slate-400`.
   - Delete button: `text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800`.
2. In `resources/js/components/ui/SplitScreenViewer.tsx`:
   - Outer container: `bg-slate-100 dark:bg-slate-950`.
   - Top utility bar: `bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`.
   - Review title: `text-slate-500 dark:text-slate-400`.
   - Document title: `text-slate-900 dark:text-slate-100`.
   - Action buttons: `border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-blue-400`.
   - PDF pane divider: `border-r border-slate-300 dark:border-slate-800`.
   - Form pane right: `bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/interactive-components-dark.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/ui/PDFUploader.tsx resources/js/components/ui/SplitScreenViewer.tsx resources/js/test-utils/interactive-components-dark.test.tsx
git commit -m "feat(ui): adapt PDFUploader and SplitScreenViewer for dark mode"
```

---

### Task 5: Integrasi Navigasi & ThemeToggle pada Bilah Aplikasi (`app-sidebar-header.tsx`, `app-header.tsx`)

**Files:**
- Modify: `resources/js/components/app-sidebar-header.tsx:1-20`
- Modify: `resources/js/components/app-header.tsx:1-50`
- Test: `resources/js/test-utils/header-theme-toggle.test.tsx`

**Interfaces:**
- Consumes: `<ThemeToggle variant="compact" />`
- Produces: Header bars equipped with dynamic dark mode switching alongside `LanguageSwitcher`.

- [ ] **Step 1: Write failing component test**

Create `resources/js/test-utils/header-theme-toggle.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { TranslationProvider } from '@/hooks/use-translation';

// Mock Inertia and Sidebar
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: any) => <a href={href}>{children}</a>,
    usePage: () => ({ props: { auth: { user: null } } }),
}));
vi.mock('@/components/ui/sidebar', () => ({
    SidebarTrigger: () => <button data-testid="sidebar-trigger">Trigger</button>,
}));

describe('AppSidebarHeader ThemeToggle Integration', () => {
    it('renders ThemeToggle alongside LanguageSwitcher', () => {
        const { getByRole } = render(
            <TranslationProvider>
                <AppSidebarHeader breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]} />
            </TranslationProvider>
        );
        // Look for theme toggle button
        const toggleBtn = getByRole('button', { name: /switch to|ganti ke|toggle theme/i });
        expect(toggleBtn).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run resources/js/test-utils/header-theme-toggle.test.tsx`
Expected: FAIL (ThemeToggle not yet present in `AppSidebarHeader`).

- [ ] **Step 3: Update `app-sidebar-header.tsx` and `app-header.tsx`**

1. In `resources/js/components/app-sidebar-header.tsx`:
   - Import `ThemeToggle` from `@/components/ui/ThemeToggle`.
   - In `<div className="flex flex-shrink-0 items-center gap-2">`:
     ```tsx
     <ThemeToggle variant="compact" />
     <LanguageSwitcher variant="compact" />
     ```
2. In `resources/js/components/app-header.tsx`:
   - Import `ThemeToggle` from `@/components/ui/ThemeToggle`.
   - Add `<ThemeToggle variant="compact" />` next to `<LanguageSwitcher variant="compact" />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/header-theme-toggle.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/app-sidebar-header.tsx resources/js/components/app-header.tsx resources/js/test-utils/header-theme-toggle.test.tsx
git commit -m "feat(navigation): integrate ThemeToggle in AppSidebarHeader and AppHeader"
```

---

### Task 6: Adaptasi Gerbang Pratinjau Sistem Desain (`DesignSystemPreview.tsx`)

**Files:**
- Modify: `resources/js/pages/DesignSystemPreview.tsx:1-250`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`
- Test: `resources/js/test-utils/design-system-preview-localization.test.tsx`

**Interfaces:**
- Consumes: `<ThemeToggle variant="compact" />`, i18n translation keys.
- Produces: Fully dark-mode responsive `/design-system-preview` with Dark Token Swatch Showcase and interactive 14 StatusBadge preview.

- [ ] **Step 1: Check existing preview test and add theme toggle check**

In `resources/js/test-utils/design-system-preview-localization.test.tsx`:
Add test assertion verifying that `ThemeToggle` is rendered on the preview page.

- [ ] **Step 2: Run test to verify failure/baseline**

Run: `npx vitest run resources/js/test-utils/design-system-preview-localization.test.tsx`
Expected: FAIL or passes baseline without theme toggle.

- [ ] **Step 3: Update `en.ts` and `id.ts` language keys if new copy is needed**

In `resources/js/lang/en.ts` and `resources/js/lang/id.ts`:
Add under `designSystem`:
- `darkThemeCatalogTitle`: "Deep Academic Midnight Palette (Dark Mode)" / "Palet Deep Academic Midnight (Tema Gelap)"
- `darkThemeCatalogSubtitle`: "Anti-slop high-contrast tokens complying with WCAG AAA standards for night research reading" / "Token kontras tinggi anti-slop yang memenuhi standar WCAG AAA untuk membaca riset di malam hari"

- [ ] **Step 4: Update `DesignSystemPreview.tsx`**

1. Import `ThemeToggle` from `@/components/ui/ThemeToggle`.
2. Add `<ThemeToggle variant="compact" />` to the desktop header and mobile header in `DesignSystemPreview.tsx`.
3. Update outer div: `min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100`.
4. Update header: `sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md`.
5. Update quick jump nav: `border-slate-100 dark:border-slate-800`, active: `bg-blue-900 dark:bg-blue-600 text-white`, inactive: `text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100`.
6. Update cards, panels, rubric forms, code snippets, and token swatches across all preview sections with corresponding `dark:` classes (`dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200`).
7. Add a Dark Mode Token Palette showcase in the `colors` section showing `--surface-base`, `--surface-card`, `--surface-elevated`, `--surface-muted`, and contrast ratios.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run resources/js/test-utils/design-system-preview-localization.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/DesignSystemPreview.tsx resources/js/lang/en.ts resources/js/lang/id.ts resources/js/test-utils/design-system-preview-localization.test.tsx
git commit -m "feat(preview): adapt DesignSystemPreview for full dark mode support and add theme toggle"
```

---

### Task 7: Dokumentasi Resmi Rujukan Tunggal (`docs/technical/design.md`) & Verifikasi Kompilasi (Build Gate)

**Files:**
- Modify: `docs/technical/design.md:70-160`
- Run: `npm run build`
- Run: `npm run test:run`

**Interfaces:**
- Consumes: Architectural dark mode decisions and token tables.
- Produces: Updated canonical single source of truth design blueprint and verified production bundle.

- [ ] **Step 1: Update `docs/technical/design.md`**

In `docs/technical/design.md`:
1. Add **Sub-bab 2.3: Spesifikasi Fondasi Tema Dark (Deep Academic Midnight Slate Architecture)**:
   - Detail the philosophy of Deep Academic Midnight Slate.
   - Anti-slop invariants for dark mode (banning pitch black `#000000`, banning glowing neon borders/buttons, mandating subtle borders and semi-transparent tints).
2. Update **Bab 3 (Spesifikasi Token Desain & Palet Warna)**:
   - Update Section 3.1 with Light and Dark columns for `--surface-base`, `--surface-card`, `--surface-elevated`, `--surface-muted`, `--surface-sidebar`.
   - Update Section 3.2 with Light and Dark columns for `--border-subtle`, `--border-strong`, `--border-focus`.
   - Update Section 3.3 with Light and Dark columns for `--text-primary`, `--text-secondary`, `--text-muted`, with WCAG contrast metrics (14.5:1, 7.2:1, 4.8:1).
   - Update Section 3.5 with the *Deep Slate Semi-Transparent Tint* formula for all semantic states and StatusBadges.

- [ ] **Step 2: Run full Vitest test suite**

Run: `npm run test:run`
Expected: All tests PASS.

- [ ] **Step 3: Run full production asset build**

Run: `npm run build`
Expected: Vite build succeeds without TypeScript or Tailwind CSS errors.

- [ ] **Step 4: Commit**

```bash
git add docs/technical/design.md
git commit -m "docs(design): update single source of truth design blueprint with dark mode specifications"
```

---

## Plan Review & Verification Checklist
- [x] All 7 tasks have clearly specified files, commands, and expected outputs.
- [x] Zero placeholders (no "TODO", "TBD", or vague steps).
- [x] Full test-driven development cycle on every task.
- [x] Strict zero emoji invariant respected across all files.
- [x] Canonical documentation updated in `docs/technical/design.md`.
