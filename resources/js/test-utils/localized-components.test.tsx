import { PDFUploader } from '@/components/ui/PDFUploader';
import { SplitScreenViewer } from '@/components/ui/SplitScreenViewer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { TranslationProvider, useTranslation } from '@/hooks/use-translation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

function LocalizedHarness() {
    const { toggleLocale } = useTranslation();
    return (
        <div>
            <StatusBadge status="In_Review" />
            <StatusBadge status="Disbursed_T1" />
            <TabularFigure value={315000000} type="currency" />
            <button onClick={toggleLocale} data-testid="switch-btn">
                Switch
            </button>
        </div>
    );
}

function AllComponentsHarness() {
    const { toggleLocale } = useTranslation();
    return (
        <div>
            <PDFUploader value={null} onChange={() => {}} />
            <SplitScreenViewer pdfUrl="about:blank" documentTitle="Proposal Riset 2026" formContent={<div>Form Content</div>} />
            <button onClick={toggleLocale} data-testid="switch-btn">
                Switch
            </button>
        </div>
    );
}

describe('Localized Core Components', () => {
    beforeEach(() => {
        localStorage.clear();
        document.cookie = 'app_locale=; path=/; max-age=0';
    });

    it('renders English status badges and currency by default', () => {
        render(
            <TranslationProvider>
                <LocalizedHarness />
            </TranslationProvider>,
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
            </TranslationProvider>,
        );

        await user.click(screen.getByTestId('switch-btn'));

        expect(screen.getByText('[SEDANG DIREVIEW]')).toBeDefined();
        expect(screen.getByText('[CAIR TERMIN 1 (70%)]')).toBeDefined();
        expect(screen.getByText(/Rp/)).toBeDefined();
    });

    it('localizes PDFUploader and SplitScreenViewer across locales', async () => {
        const user = userEvent.setup();
        render(
            <TranslationProvider>
                <AllComponentsHarness />
            </TranslationProvider>,
        );

        // English defaults
        expect(screen.getByText(/Upload Proposal Document/i)).toBeDefined();
        expect(screen.getByText(/Drag and drop PDF document here/i)).toBeDefined();
        expect(screen.getByText(/Document Review:/i)).toBeDefined();
        expect(screen.getByTitle('Open Document in New Tab')).toBeDefined();

        // Toggle to Indonesian
        await user.click(screen.getByTestId('switch-btn'));

        expect(screen.getByText(/Unggah Dokumen Proposal/i)).toBeDefined();
        expect(screen.getByText(/Seret dan lepas dokumen PDF di sini/i)).toBeDefined();
        expect(screen.getByText(/Telaah Berkas:/i)).toBeDefined();
        expect(screen.getByTitle('Buka Dokumen di Tab Baru')).toBeDefined();
    });
});
