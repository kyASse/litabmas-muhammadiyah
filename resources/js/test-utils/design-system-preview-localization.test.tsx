import { TranslationProvider } from '@/hooks/use-translation';
import { en } from '@/lang/en';
import { id } from '@/lang/id';
import DesignSystemPreview from '@/pages/DesignSystemPreview';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @inertiajs/react Head and Link components
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
    };
});

describe('DesignSystemPreview Localization', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = 'en';
        vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response('')));
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('renders with English by default and embeds LanguageSwitcher', () => {
        render(
            <TranslationProvider>
                <DesignSystemPreview />
            </TranslationProvider>,
        );

        // Language switcher buttons should exist
        const enButtons = screen.getAllByRole('button', { name: /EN/i });
        expect(enButtons.length).toBeGreaterThan(0);
        const idButtons = screen.getAllByRole('button', { name: /ID/i });
        expect(idButtons.length).toBeGreaterThan(0);

        // Header and tags should display English
        expect(screen.getByText(en.designSystem.catalogSpecTag)).toBeDefined();
        expect(screen.getByText(en.designSystem.previewGate)).toBeDefined();
        expect(screen.getByText(en.designSystem.wcagTag)).toBeDefined();
        expect(screen.getByText(en.designSystem.zeroEmojiTag)).toBeDefined();
        expect(screen.getByText(en.designSystem.cleanTablesTag)).toBeDefined();

        // Section 1-7 titles in English
        expect(screen.getByText(en.designSystem.section1Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section2Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section3Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section4Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section5Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section6Title)).toBeDefined();
        expect(screen.getByText(en.designSystem.section7Title)).toBeDefined();

        // Dark Mode Token Palette in English
        expect(screen.getByText(en.designSystem.darkThemeCatalogTitle)).toBeDefined();
        expect(screen.getByText(en.designSystem.darkThemeCatalogSubtitle)).toBeDefined();

        // SplitScreen rubric criteria in English
        expect(screen.getByText(en.components.splitScreen.criteriaUrgency)).toBeDefined();
        expect(screen.getByText(en.components.splitScreen.criteriaMethodology)).toBeDefined();
        expect(screen.getByText(en.components.splitScreen.criteriaFeasibility)).toBeDefined();
        expect(screen.getByText(en.components.splitScreen.coiAgreement)).toBeDefined();
        expect(screen.getByText(en.components.splitScreen.saveDraftButton)).toBeDefined();
    });

    it('renders ThemeToggle in the header for dark mode switching', () => {
        render(
            <TranslationProvider>
                <DesignSystemPreview />
            </TranslationProvider>,
        );

        // ThemeToggle buttons should exist in header
        const themeButtons = screen.getAllByRole('button', { name: /switch to dark theme/i });
        expect(themeButtons.length).toBeGreaterThan(0);
    });

    it('reactively switches the entire preview catalog to Indonesian when ID is clicked', () => {
        render(
            <TranslationProvider>
                <DesignSystemPreview />
            </TranslationProvider>,
        );

        // Click ID button in the desktop header LanguageSwitcher
        const idButtons = screen.getAllByRole('button', { name: /ID/i });
        fireEvent.click(idButtons[0]);

        // Header and tags should now display Indonesian
        expect(screen.getByText(id.designSystem.catalogSpecTag)).toBeDefined();
        expect(screen.getByText(id.designSystem.previewGate)).toBeDefined();
        expect(screen.getByText(id.designSystem.cleanTablesTag)).toBeDefined();

        // Section 1-7 titles in Indonesian
        expect(screen.getByText(id.designSystem.section1Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section2Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section3Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section4Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section5Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section6Title)).toBeDefined();
        expect(screen.getByText(id.designSystem.section7Title)).toBeDefined();

        // Dark Mode Token Palette in Indonesian
        expect(screen.getByText(id.designSystem.darkThemeCatalogTitle)).toBeDefined();
        expect(screen.getByText(id.designSystem.darkThemeCatalogSubtitle)).toBeDefined();

        // SplitScreen rubric criteria in Indonesian
        expect(screen.getByText(id.components.splitScreen.criteriaUrgency)).toBeDefined();
        expect(screen.getByText(id.components.splitScreen.criteriaMethodology)).toBeDefined();
        expect(screen.getByText(id.components.splitScreen.criteriaFeasibility)).toBeDefined();
        expect(screen.getByText(id.components.splitScreen.coiAgreement)).toBeDefined();
        expect(screen.getByText(id.components.splitScreen.saveDraftButton)).toBeDefined();
    });

    it('contains zero emoji characters in rendered preview content', () => {
        const { container } = render(
            <TranslationProvider>
                <DesignSystemPreview />
            </TranslationProvider>,
        );

        const emojiRegex = /\p{Extended_Pictographic}/u;
        expect(emojiRegex.test(container.textContent || '')).toBe(false);

        // Switch to ID and verify again
        const idButtons = screen.getAllByRole('button', { name: /ID/i });
        fireEvent.click(idButtons[0]);
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });
});
