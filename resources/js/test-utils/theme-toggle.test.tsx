import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { TranslationProvider } from '@/hooks/use-translation';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ThemeToggle Component', () => {
    beforeEach(() => {
        document.documentElement.className = '';
        localStorage.clear();
    });

    afterEach(() => {
        document.documentElement.className = '';
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('strictly satisfies the Zero Emoji Invariant', () => {
        const { container } = render(
            <TranslationProvider>
                <ThemeToggle variant="compact" />
            </TranslationProvider>,
        );

        const emojiRegex = /\p{Extended_Pictographic}/u;
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
        expect(emojiRegex.test(container.innerHTML)).toBe(false);
    });

    it('renders with compact variant and displays Light mode label initially', () => {
        render(
            <TranslationProvider>
                <ThemeToggle variant="compact" />
            </TranslationProvider>,
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDefined();
        expect(btn.getAttribute('title')).toContain('Switch to dark theme');
        expect(btn.textContent).toContain('Light');
    });

    it('toggles to dark mode on click and updates aria attributes', () => {
        render(
            <TranslationProvider>
                <ThemeToggle variant="compact" />
            </TranslationProvider>,
        );

        const btn = screen.getByRole('button');
        fireEvent.click(btn);

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(btn.getAttribute('title')).toContain('Switch to light theme');
        expect(btn.textContent).toContain('Dark');

        // Toggle back to light mode
        fireEvent.click(btn);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(btn.getAttribute('title')).toContain('Switch to dark theme');
        expect(btn.textContent).toContain('Light');
    });

    it('renders icon-only variant cleanly without label text', () => {
        const { container } = render(
            <TranslationProvider>
                <ThemeToggle variant="icon" />
            </TranslationProvider>,
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDefined();
        expect(btn.textContent).toBe('');
        const emojiRegex = /\p{Extended_Pictographic}/u;
        expect(emojiRegex.test(container.innerHTML)).toBe(false);
    });
});
