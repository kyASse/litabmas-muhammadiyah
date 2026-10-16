import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranslationProvider } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import Welcome from '@/pages/welcome';
import Login from '@/pages/auth/login';
import { en } from '@/lang/en';
import { id } from '@/lang/id';

// Mock global route helper
const mockRoute = (name?: string) => name ? `/${name}` : { has: () => true, current: () => '' };
(global as any).route = mockRoute;
(window as any).route = mockRoute;

// Mock @inertiajs/react
vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>();
  return {
    ...actual,
    Head: ({ title }: { title: string }) => <title data-testid="page-head-title">{title}</title>,
    Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
    usePage: () => ({
      props: {
        auth: { user: null },
        overallStats: {
          totalUniversities: 12,
          totalSchemas: 5,
          totalProposals: 40,
          totalOutputs: 25,
        },
        activeSchemas: [
          {
            id: 1,
            nama_skema: 'Penelitian Fundamental PTMA',
            deskripsi: 'Hibah kompetitif multi-kampus',
            biaya_maksimal: 50000000,
            university: { id: 1, name: 'UMJ', code: 'UMJ' },
          },
        ],
      },
    }),
    useForm: () => ({
      data: { email: '', password: '', remember: false },
      setData: vi.fn(),
      post: vi.fn(),
      processing: false,
      errors: {},
    }),
  };
});

// Mock Sidebar component trigger and context
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Trigger</button>,
}));

vi.mock('@/components/breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

describe('Layout and Auth Localization', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders PublicLayout with compact LanguageSwitcher and English navigation', () => {
    const { container } = render(
      <TranslationProvider>
        <PublicLayout>
          <div>Test Content</div>
        </PublicLayout>
      </TranslationProvider>
    );

    // Switcher should display [en]
    expect(screen.getByText('[en]')).toBeDefined();

    // Navigation buttons in English
    expect(screen.getByText(en.navigation.login)).toBeDefined();
    expect(screen.getByText(en.navigation.register)).toBeDefined();
    expect(screen.getByText(en.navigation.home)).toBeDefined();

    // Strict Zero Emoji Invariant
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
  });

  it('renders AppSidebarHeader with compact LanguageSwitcher', () => {
    const { container } = render(
      <TranslationProvider>
        <AppSidebarHeader />
      </TranslationProvider>
    );

    expect(screen.getByText('[en]')).toBeDefined();
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
  });

  it('renders Welcome page in English by default and toggles to Indonesian', () => {
    const { container } = render(
      <TranslationProvider>
        <Welcome />
      </TranslationProvider>
    );

    // Default English check
    expect(screen.getByText(en.welcome.heroTitle)).toBeDefined();
    expect(screen.getByText(en.welcome.platformBadge)).toBeDefined();
    expect(screen.getByText(en.welcome.participatingUniversities)).toBeDefined();
    expect(screen.getByText(en.welcome.activeSchemesCount)).toBeDefined();
    expect(screen.getByText(en.welcome.schemesTitle)).toBeDefined();
    expect(screen.getByText(en.welcome.pillarsTitle)).toBeDefined();

    // Toggle language
    const compactSwitcher = screen.getAllByText('[en]')[0];
    fireEvent.click(compactSwitcher);

    // Now Indonesian
    expect(screen.getByText(id.welcome.heroTitle)).toBeDefined();
    expect(screen.getByText(id.welcome.platformBadge)).toBeDefined();
    expect(screen.getByText(id.welcome.participatingUniversities)).toBeDefined();
    expect(screen.getByText(id.welcome.activeSchemesCount)).toBeDefined();
    expect(screen.getByText(id.welcome.schemesTitle)).toBeDefined();
    expect(screen.getByText(id.welcome.pillarsTitle)).toBeDefined();

    // Zero Emoji check
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
  });

  it('renders Login page with segmented LanguageSwitcher and localized form fields', () => {
    const { container } = render(
      <TranslationProvider>
        <Login />
      </TranslationProvider>
    );

    // Segmented switcher buttons
    expect(screen.getByText('EN')).toBeDefined();
    expect(screen.getByText('ID')).toBeDefined();

    // English labels
    expect(screen.getByText(en.auth.loginTitle)).toBeDefined();
    expect(screen.getByText(en.auth.emailLabel)).toBeDefined();
    expect(screen.getByText(en.auth.passwordLabel)).toBeDefined();
    expect(screen.getByText(en.auth.rememberMe)).toBeDefined();
    expect(screen.getByText(en.auth.signInButton)).toBeDefined();

    // Switch to Indonesian
    const idButton = screen.getByText('ID');
    fireEvent.click(idButton);

    // Indonesian labels
    expect(screen.getByText(id.auth.loginTitle)).toBeDefined();
    expect(screen.getByText(id.auth.emailLabel)).toBeDefined();
    expect(screen.getByText(id.auth.passwordLabel)).toBeDefined();
    expect(screen.getByText(id.auth.rememberMe)).toBeDefined();
    expect(screen.getByText(id.auth.signInButton)).toBeDefined();

    // Zero Emoji check
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
  });
});
