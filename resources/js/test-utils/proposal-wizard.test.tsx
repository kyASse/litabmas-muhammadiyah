import { TranslationProvider } from '@/hooks/use-translation';
import { en } from '@/lang/en';
import { id } from '@/lang/id';
import Wizard from '@/pages/Proposal/Wizard';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ziggy-js route
vi.mock('ziggy-js', () => ({
    route: (name?: string) => `http://localhost/${name || ''}`,
}));

// Mock @inertiajs/react
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ title }: { title: string }) => <title data-testid="page-head-title">{title}</title>,
        Link: ({ href, children, ...props }: any) => (
            <a href={href} {...props}>
                {children}
            </a>
        ),
        usePage: () => ({
            url: '/proposals/create',
            props: {
                auth: {
                    user: {
                        id: 1,
                        name: 'Dr. Ahmad Dahlan',
                        email: 'dahlan@kampus.ac.id',
                        nidn: '0012345678',
                        university_id: 1,
                    },
                },
            },
        }),
        useForm: (initial: any) => {
            const [formData, setFormData] = React.useState(initial);
            return {
                data: formData,
                setData: (keyOrFn: any, val?: any) => {
                    if (typeof keyOrFn === 'function') {
                        setFormData(keyOrFn);
                    } else if (typeof keyOrFn === 'string') {
                        setFormData((prev: any) => ({ ...prev, [keyOrFn]: val }));
                    } else {
                        setFormData(keyOrFn);
                    }
                },
                post: vi.fn(),
                transform: vi.fn(),
                processing: false,
                errors: {},
                isDirty: false,
            };
        },
    };
});

describe('Proposal Submission Linear 4-Step Wizard', () => {
    const mockSchemas = [
        {
            id: 1,
            nama_skema: 'Penelitian Terapan Kompetitif',
            deskripsi: 'Skema riset terapan institusi',
            biaya_maksimal: 50000000,
            tanggal_selesai: '2026-11-30',
        },
        {
            id: 2,
            nama_skema: 'Penelitian Dasar Keilmuan',
            deskripsi: 'Skema riset dasar saintifik',
            biaya_maksimal: 25000000,
            tanggal_selesai: '2026-12-31',
        },
    ];

    const mockLecturers = [
        {
            id: 2,
            name: 'Dr. Siti Walidah',
            email: 'walidah@kampus.ac.id',
            nidn: '0087654321',
            study_program: 'Informatika',
        },
        {
            id: 3,
            name: 'Prof. K.H. Mas Mansur',
            email: 'mansur@kampus.ac.id',
            nidn: '0098765432',
            study_program: 'Teknik Mesin',
        },
    ];

    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = 'en';
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('renders Step 1 with English text by default', () => {
        render(
            <TranslationProvider>
                <Wizard schemas={mockSchemas} lecturers={mockLecturers} />
            </TranslationProvider>,
        );

        // Page title and subtitle in English
        expect(screen.getByText(en.proposalWizard.pageTitle)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.pageSubtitle)).toBeDefined();

        // 4 step titles in stepper
        expect(screen.getByText(en.proposalWizard.steps.step1.title)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.steps.step2.title)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.steps.step3.title)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.steps.step4.title)).toBeDefined();

        // Step 1 title and fields
        expect(screen.getByText(en.proposalWizard.step1.title)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.step1.schemaLabel)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.step1.researchTitleLabel)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.step1.abstractLabel)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.step1.backgroundLabel)).toBeDefined();

        // Navigation buttons
        expect(screen.getByText(en.proposalWizard.nav.nextStep)).toBeDefined();
        expect(screen.getByText(en.proposalWizard.nav.saveDraft)).toBeDefined();
    });

    it('switches the entire wizard reactively to Indonesian when ID language is selected', () => {
        render(
            <TranslationProvider>
                <Wizard schemas={mockSchemas} lecturers={mockLecturers} />
            </TranslationProvider>,
        );

        // Click ID button on language switcher
        const idButtons = screen.getAllByRole('button', { name: /^ID$/i });
        expect(idButtons.length).toBeGreaterThan(0);
        fireEvent.click(idButtons[0]);

        // Should now display Indonesian
        expect(screen.getByText(id.proposalWizard.pageTitle)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.pageSubtitle)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.steps.step1.title)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.step1.title)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.step1.schemaLabel)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.step1.researchTitleLabel)).toBeDefined();
        expect(screen.getByText(id.proposalWizard.nav.nextStep)).toBeDefined();
    });

    it('strictly adheres to the Zero Emoji Invariant in rendered output', () => {
        const { container } = render(
            <TranslationProvider>
                <Wizard schemas={mockSchemas} lecturers={mockLecturers} />
            </TranslationProvider>,
        );

        const emojiRegex = /\p{Extended_Pictographic}/u;
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('displays character count for proposal title and abstract validation hint', () => {
        render(
            <TranslationProvider>
                <Wizard schemas={mockSchemas} lecturers={mockLecturers} />
            </TranslationProvider>,
        );

        // Initial character count for title should be 0 / 255
        expect(screen.getByText(/0 \/ 255/)).toBeDefined();

        // Initial abstract character count should show minimum 100 warning/counter
        expect(screen.getByText(/0 characters \(minimum 100\)/i)).toBeDefined();
    });

    it('renders all 4 stepper step headers with correct numbers', () => {
        render(
            <TranslationProvider>
                <Wizard schemas={mockSchemas} lecturers={mockLecturers} />
            </TranslationProvider>,
        );

        // Check step numbers 1, 2, 3, 4
        expect(screen.getByText('1')).toBeDefined();
        expect(screen.getByText('2')).toBeDefined();
        expect(screen.getByText('3')).toBeDefined();
        expect(screen.getByText('4')).toBeDefined();
    });
});
