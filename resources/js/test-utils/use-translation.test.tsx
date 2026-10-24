import { TranslationProvider, useTranslation } from '@/hooks/use-translation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

function TestConsumer() {
    const { locale, setLocale, toggleLocale, t, format } = useTranslation();

    return (
        <div>
            <span data-testid="current-locale">{locale}</span>
            <span data-testid="app-name">{t.common.appName}</span>
            <span data-testid="save-btn">{t.common.save}</span>
            <span data-testid="formatted-str">{format('Batas: {max} MB, Aktual: {actual} MB', { max: 10, actual: 5 })}</span>
            <button data-testid="toggle-btn" onClick={toggleLocale}>
                Toggle
            </button>
            <button data-testid="set-id-btn" onClick={() => setLocale('id')}>
                Set ID
            </button>
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
            </TranslationProvider>,
        );

        expect(screen.getByTestId('current-locale').textContent).toBe('en');
        expect(screen.getByTestId('app-name').textContent).toBe('E-Jarlit Kota Yogyakarta');
        expect(screen.getByTestId('save-btn').textContent).toBe('Save');
    });

    it('switches between en and id reactively when toggled', async () => {
        const user = userEvent.setup();
        render(
            <TranslationProvider>
                <TestConsumer />
            </TranslationProvider>,
        );

        const toggleBtn = screen.getByTestId('toggle-btn');
        await user.click(toggleBtn);

        expect(screen.getByTestId('current-locale').textContent).toBe('id');
        expect(screen.getByTestId('app-name').textContent).toBe('E-Jarlit Kota Yogyakarta');
        expect(screen.getByTestId('save-btn').textContent).toBe('Simpan');

        await user.click(toggleBtn);
        expect(screen.getByTestId('current-locale').textContent).toBe('en');
    });

    it('interpolates format parameters accurately', () => {
        render(
            <TranslationProvider>
                <TestConsumer />
            </TranslationProvider>,
        );

        expect(screen.getByTestId('formatted-str').textContent).toBe('Batas: 10 MB, Aktual: 5 MB');
    });
});
