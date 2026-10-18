import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { TranslationProvider } from '@/hooks/use-translation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('LanguageSwitcher Component', () => {
    it('renders without any emoji symbols in segmented variant', () => {
        const { container } = render(
            <TranslationProvider>
                <LanguageSwitcher variant="segmented" />
            </TranslationProvider>,
        );

        const emojiRegex = /\p{Extended_Pictographic}/u;
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
        expect(screen.getByText('EN')).toBeDefined();
        expect(screen.getByText('ID')).toBeDefined();
    });

    it('renders compact variant with uppercase badge and toggles locale', async () => {
        const user = userEvent.setup();
        render(
            <TranslationProvider>
                <LanguageSwitcher variant="compact" />
            </TranslationProvider>,
        );

        const btn = screen.getByRole('button');
        expect(btn.textContent).toContain('[en]');

        await user.click(btn);
        expect(btn.textContent).toContain('[id]');
    });
});
