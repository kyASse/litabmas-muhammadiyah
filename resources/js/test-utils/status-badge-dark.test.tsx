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

    it('renders all 14 research lifecycle statuses with appropriate dark classes', () => {
        const lifecycleStatuses = [
            { status: 'Submitted', bg: 'dark:bg-sky-950/40', text: 'dark:text-sky-300', border: 'dark:border-sky-800/60' },
            { status: 'In_Review', bg: 'dark:bg-amber-950/40', text: 'dark:text-amber-300', border: 'dark:border-amber-800/60' },
            { status: 'Revisi', bg: 'dark:bg-amber-950/40', text: 'dark:text-amber-300', border: 'dark:border-amber-800/60' },
            { status: 'Contracted', bg: 'dark:bg-blue-950/40', text: 'dark:text-blue-300', border: 'dark:border-blue-800/60' },
            { status: 'Disbursed_T1', bg: 'dark:bg-teal-950/40', text: 'dark:text-teal-300', border: 'dark:border-teal-800/60' },
            { status: 'Disbursed_T2', bg: 'dark:bg-emerald-950/40', text: 'dark:text-emerald-300', border: 'dark:border-emerald-800/60' },
            { status: 'Monev_Approved', bg: 'dark:bg-emerald-950/40', text: 'dark:text-emerald-300', border: 'dark:border-emerald-800/60' },
            { status: 'Monev_Locked', bg: 'dark:bg-purple-950/40', text: 'dark:text-purple-300', border: 'dark:border-purple-800/60' },
            { status: 'Output_Verified', bg: 'dark:bg-indigo-950/40', text: 'dark:text-indigo-300', border: 'dark:border-indigo-800/60' },
            { status: 'Completed_SKTS', bg: 'dark:bg-emerald-950/50', text: 'dark:text-emerald-300', border: 'dark:border-emerald-700/70' },
            { status: 'Terminated', bg: 'dark:bg-rose-950/40', text: 'dark:text-rose-300', border: 'dark:border-rose-800/60' },
        ];

        lifecycleStatuses.forEach(({ status, bg, text, border }) => {
            const { container } = render(
                <TranslationProvider>
                    <StatusBadge status={status} />
                </TranslationProvider>
            );
            const badge = container.firstChild as HTMLElement;
            expect(badge.className).toContain(bg);
            expect(badge.className).toContain(text);
            expect(badge.className).toContain(border);
        });
    });
});
