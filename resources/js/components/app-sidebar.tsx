import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ROLE_NAMES } from '@/constants/roles';
import { useTranslation } from '@/hooks/use-translation';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

import {
    Award,
    BookType,
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    CreditCard,
    FileSpreadsheet,
    FileText,
    GraduationCap,
    LayoutGrid,
    Settings,
    UserCheck,
    Users,
} from 'lucide-react';

import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const { user } = auth;
    const { t } = useTranslation();

    const hasRole = (role: string) => {
        if (!user) return false;
        if (user.role?.name === role) return true;
        if (user.roles?.some((r) => r.name === role)) return true;
        return false;
    };

    // Role-specific items
    let roleNavItems: NavItem[] = [];

    if (hasRole(ROLE_NAMES.SUPER_ADMIN)) {
        roleNavItems = [
            {
                title: t.navigation.universities,
                href: '/admin/universities',
                icon: Building2,
            },
            {
                title: t.navigation.users,
                href: '/admin/users',
                icon: Users,
            },
            {
                title: t.navigation.systemLogs,
                href: '/admin/logs',
                icon: ClipboardList,
            },
            {
                title: t.navigation.settings,
                href: '/admin/settings',
                icon: Settings,
            },
        ];
    } else if (hasRole(ROLE_NAMES.ADMIN_KAMPUS)) {
        roleNavItems = [
            {
                title: t.navigation.schemes,
                href: '/admin/schemas',
                icon: BookType,
            },
            {
                title: t.navigation.proposals,
                href: '/admin/proposals',
                icon: FileText,
            },
            {
                title: t.navigation.monev,
                href: '/admin/monev',
                icon: CalendarDays,
            },
            {
                title: t.navigation.outputs,
                href: '/admin/output',
                icon: Award,
            },
            {
                title: t.navigation.graduationSkts,
                href: '/admin/evaluations',
                icon: GraduationCap,
            },
        ];
    } else if (hasRole(ROLE_NAMES.ADMIN_KEUANGAN)) {
        roleNavItems = [
            {
                title: t.navigation.contracts,
                href: '/finance/contracts',
                icon: FileText,
            },
            {
                title: t.navigation.tranchesDisbursement,
                href: '/finance/fundings',
                icon: CreditCard,
            },
            {
                title: t.navigation.financialReports,
                href: '/finance/reports',
                icon: FileSpreadsheet,
            },
        ];
    } else if (hasRole(ROLE_NAMES.REVIEWER)) {
        roleNavItems = [
            {
                title: t.navigation.reviewerDashboard,
                href: '/reviewer/dashboard',
                icon: LayoutGrid,
            },
            {
                title: t.navigation.reviews,
                href: '/reviewer/proposals',
                icon: UserCheck,
            },
            {
                title: t.navigation.monevEvaluation,
                href: '/reviewer/monev',
                icon: CalendarDays,
            },
        ];
    } else if (hasRole(ROLE_NAMES.PENELITI) || hasRole('Dosen') || hasRole('User')) {
        roleNavItems = [
            {
                title: t.navigation.proposals,
                href: '/proposals',
                icon: FileText,
            },
            {
                title: t.navigation.progressReports,
                href: '/progress',
                icon: Clock,
            },
            {
                title: t.navigation.outputs,
                href: '/outputs',
                icon: Award,
            },
            {
                title: t.navigation.finalEvaluation,
                href: '/evaluations/my-final-report',
                icon: GraduationCap,
            },
        ];
    }

    // Reviewer has their own dedicated "Dashboard Reviewer" item
    const isReviewerOnly =
        !hasRole(ROLE_NAMES.SUPER_ADMIN) && !hasRole(ROLE_NAMES.ADMIN_KAMPUS) && !hasRole(ROLE_NAMES.ADMIN_KEUANGAN) && hasRole(ROLE_NAMES.REVIEWER);

    const baseNavItems: NavItem[] = isReviewerOnly
        ? []
        : [
              {
                  title: t.navigation.dashboard,
                  href: '/dashboard',
                  icon: LayoutGrid,
              },
          ];

    const mainNavItems = [...baseNavItems, ...roleNavItems];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
