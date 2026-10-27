import { PDFUploader } from '@/components/ui/PDFUploader';
import { SplitScreenViewer } from '@/components/ui/SplitScreenViewer';
import { TranslationProvider } from '@/hooks/use-translation';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Interactive Components Dark Mode', () => {
    it('renders PDFUploader with dark dropzone styling', () => {
        const { container } = render(
            <TranslationProvider>
                <PDFUploader value={null} onChange={() => {}} />
            </TranslationProvider>,
        );
        const dropzone = container.querySelector('.border-dashed');
        expect(dropzone?.className).toContain('dark:border-slate-700');
        expect(dropzone?.className).toContain('dark:bg-slate-900/50');
    });

    it('renders SplitScreenViewer with dark toolbar and panel classes', () => {
        const { container } = render(
            <TranslationProvider>
                <SplitScreenViewer pdfUrl="about:blank" documentTitle="Usulan Riset" formContent={<div>Form</div>} />
            </TranslationProvider>,
        );
        const outer = container.firstChild as HTMLElement;
        expect(outer.className).toContain('dark:bg-slate-950');
        const toolbar = outer.querySelector('.h-12');
        expect(toolbar?.className).toContain('dark:bg-slate-900');
        expect(toolbar?.className).toContain('dark:border-slate-800');
    });
});
