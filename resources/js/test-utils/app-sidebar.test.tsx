import { AppSidebar } from '@/components/app-sidebar';
import { ROLE_NAMES } from '@/constants/roles';
import { TranslationProvider } from '@/hooks/use-translation';
import { en } from '@/lang/en';
import { id } from '@/lang/id';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Current mocked user in usePage
let currentUser: any = null;
let currentUrl: string = '/dashboard';

// Mock @inertiajs/react
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Link: ({ href, children, ...props }: any) => (
            <a href={href} {...props}>
                {children}
            </a>
        ),
        usePage: () => ({
            url: currentUrl,
            props: {
                auth: { user: currentUser },
                sidebarOpen: true,
            },
        }),
    };
});

// Mock ui/collapsible to render children directly in test environment
vi.mock('@/components/ui/collapsible', () => ({
    Collapsible: ({ children }: any) => <div>{children}</div>,
    CollapsibleTrigger: ({ children }: any) => <div>{children}</div>,
    CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock ui/sidebar components to render lightweight semantic tags in happy-dom
vi.mock('@/components/ui/sidebar', () => ({
    Sidebar: ({ children }: any) => <aside data-testid="app-sidebar">{children}</aside>,
    SidebarHeader: ({ children }: any) => <header>{children}</header>,
    SidebarContent: ({ children }: any) => <main>{children}</main>,
    SidebarFooter: ({ children }: any) => <footer>{children}</footer>,
    SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
    SidebarMenuButton: ({ children, asChild }: any) => <div data-testid="sidebar-button">{children}</div>,
    SidebarGroup: ({ children }: any) => <section>{children}</section>,
    SidebarGroupLabel: ({ children }: any) => <h4>{children}</h4>,
    SidebarMenuSub: ({ children }: any) => <ul>{children}</ul>,
    SidebarMenuSubItem: ({ children }: any) => <li>{children}</li>,
    SidebarMenuSubButton: ({ children }: any) => <div>{children}</div>,
    useSidebar: () => ({ state: 'expanded' }),
}));

// Mock nav-user to isolate sidebar testing
vi.mock('@/components/nav-user', () => ({
    NavUser: () => <div data-testid="nav-user">User Profile</div>,
}));

describe('AppSidebar Navigation Across Roles', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = 'en';
        currentUrl = '/dashboard';
        currentUser = null;
    });

    const emojiRegex = /\p{Extended_Pictographic}/u;

    it('renders Super Admin sidebar with all administration features', () => {
        currentUser = {
            id: 1,
            name: 'Super Administrator',
            role: { name: ROLE_NAMES.SUPER_ADMIN },
            roles: [{ name: ROLE_NAMES.SUPER_ADMIN }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        expect(screen.getByText(en.navigation.dashboard)).toBeDefined();
        expect(screen.getByText(en.navigation.universities)).toBeDefined();
        expect(screen.getByText(en.navigation.campusAdmins)).toBeDefined();
        expect(screen.getByText(en.navigation.users)).toBeDefined();
        expect(screen.getByText(en.navigation.systemLogs)).toBeDefined();
        expect(screen.getByText(en.navigation.settings)).toBeDefined();

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders Admin Kampus sidebar with research lifecycle features', () => {
        currentUser = {
            id: 2,
            name: 'LPPM Operator',
            role: { name: ROLE_NAMES.ADMIN_KAMPUS },
            roles: [{ name: ROLE_NAMES.ADMIN_KAMPUS }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        expect(screen.getByText(en.navigation.schemes)).toBeDefined();
        expect(screen.getByText(en.navigation.proposals)).toBeDefined();
        expect(screen.getByText(en.navigation.reviewerAssignment)).toBeDefined();
        expect(screen.getAllByText(en.navigation.monev).length).toBeGreaterThan(0);
        expect(screen.getByText(en.navigation.monevSchedules)).toBeDefined();
        expect(screen.getAllByText(en.navigation.outputs).length).toBeGreaterThan(0);
        expect(screen.getByText(en.navigation.outputReports)).toBeDefined();
        expect(screen.getByText(en.navigation.graduationSkts)).toBeDefined();
        expect(screen.getByText(en.navigation.schedules)).toBeDefined();

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders Admin Keuangan sidebar with contracts and tranches', () => {
        currentUser = {
            id: 3,
            name: 'Finance Officer',
            role: { name: ROLE_NAMES.ADMIN_KEUANGAN },
            roles: [{ name: ROLE_NAMES.ADMIN_KEUANGAN }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        expect(screen.getByText(en.navigation.contracts)).toBeDefined();
        expect(screen.getAllByText(en.navigation.tranchesDisbursement).length).toBeGreaterThan(0);
        expect(screen.getByText(en.navigation.disbursementLogs)).toBeDefined();
        expect(screen.getByText(en.navigation.financialReports)).toBeDefined();

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders Reviewer sidebar with dedicated reviewer routes', () => {
        currentUser = {
            id: 4,
            name: 'Dr. Expert Reviewer',
            role: { name: ROLE_NAMES.REVIEWER },
            roles: [{ name: ROLE_NAMES.REVIEWER }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        expect(screen.getByText(en.navigation.reviewerDashboard)).toBeDefined();
        expect(screen.getByText(en.navigation.reviews)).toBeDefined();
        expect(screen.getByText(en.navigation.monevEvaluation)).toBeDefined();

        // Verify correct route links
        const reviewLink = screen.getByText(en.navigation.reviews).closest('a');
        expect(reviewLink?.getAttribute('href')).toBe('/reviewer/assignments');

        const monevLink = screen.getByText(en.navigation.monevEvaluation).closest('a');
        expect(monevLink?.getAttribute('href')).toBe('/reviewer/evaluations');

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders Peneliti sidebar with complete 6-phase research features including funding info', () => {
        currentUser = {
            id: 5,
            name: 'Dosen Peneliti',
            role: { name: ROLE_NAMES.PENELITI },
            roles: [{ name: ROLE_NAMES.PENELITI }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        expect(screen.getByText(en.navigation.dashboard)).toBeDefined();
        expect(screen.getByText(en.navigation.proposals)).toBeDefined();
        expect(screen.getByText(en.navigation.userFunding)).toBeDefined();
        expect(screen.getByText(en.navigation.progressReports)).toBeDefined();
        expect(screen.getByText(en.navigation.outputs)).toBeDefined();
        expect(screen.getByText(en.navigation.finalEvaluation)).toBeDefined();

        const fundingLink = screen.getByText(en.navigation.userFunding).closest('a');
        expect(fundingLink?.getAttribute('href')).toBe('/funding');

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });

    it('renders Indonesian translation accurately when language is set to id', async () => {
        localStorage.setItem('app_locale', 'id');
        document.documentElement.lang = 'id';

        currentUser = {
            id: 5,
            name: 'Dosen Peneliti',
            role: { name: ROLE_NAMES.PENELITI },
            roles: [{ name: ROLE_NAMES.PENELITI }],
        };

        const { container } = render(
            <TranslationProvider>
                <AppSidebar />
            </TranslationProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText(id.navigation.dashboard)).toBeDefined();
            expect(screen.getByText(id.navigation.proposals)).toBeDefined();
            expect(screen.getByText(id.navigation.userFunding)).toBeDefined();
            expect(screen.getByText(id.navigation.progressReports)).toBeDefined();
            expect(screen.getByText(id.navigation.outputs)).toBeDefined();
            expect(screen.getByText(id.navigation.finalEvaluation)).toBeDefined();
        });

        expect(emojiRegex.test(container.textContent || '')).toBe(false);
    });
});
