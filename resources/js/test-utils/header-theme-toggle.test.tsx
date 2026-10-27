import { AppHeader } from '@/components/app-header';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { TranslationProvider } from '@/hooks/use-translation';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Inertia and Sidebar
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: any) => <a href={href}>{children}</a>,
    usePage: () => ({
        url: '/dashboard',
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com',
                    avatar: '',
                },
            },
        },
    }),
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarTrigger: () => <button data-testid="sidebar-trigger">Trigger</button>,
}));

describe('Header ThemeToggle Integration', () => {
    beforeEach(() => {
        document.documentElement.className = '';
        localStorage.clear();
    });

    const emojiRegex = /\p{Extended_Pictographic}/u;

    it('renders ThemeToggle alongside LanguageSwitcher in AppSidebarHeader', () => {
        const { getByRole, container } = render(
            <TranslationProvider>
                <AppSidebarHeader breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]} />
            </TranslationProvider>,
        );

        // Look for theme toggle button
        const toggleBtn = getByRole('button', { name: /switch to|ganti ke|toggle theme/i });
        expect(toggleBtn).toBeInTheDocument();

        // Strict Zero Emoji Invariant
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders ThemeToggle alongside LanguageSwitcher in AppHeader', () => {
        const { getByRole, container } = render(
            <TranslationProvider>
                <AppHeader breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]} />
            </TranslationProvider>,
        );

        // Look for theme toggle button
        const toggleBtn = getByRole('button', { name: /switch to|ganti ke|toggle theme/i });
        expect(toggleBtn).toBeInTheDocument();

        // Strict Zero Emoji Invariant
        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });
});
