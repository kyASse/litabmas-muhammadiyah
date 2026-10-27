import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { TranslationProvider } from '@/hooks/use-translation';
import { render } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { describe, expect, it } from 'vitest';

describe('Core Display Components Dark Mode', () => {
    it('renders TabularFigure with dark text color classes', () => {
        const { container } = render(
            <TranslationProvider>
                <TabularFigure value={50000000} type="currency" />
            </TranslationProvider>,
        );
        const span = container.querySelector('span');
        expect(span?.className).toContain('dark:text-slate-100');
    });

    it('renders PageHeader with dark border and text classes', () => {
        const { container } = render(
            <TranslationProvider>
                <PageHeader title="Judul Riset" subtitle="Deskripsi Skema" />
            </TranslationProvider>,
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
            </TranslationProvider>,
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('dark:bg-slate-900');
        expect(card.className).toContain('dark:border-slate-800');
    });
});
