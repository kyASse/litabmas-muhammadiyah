import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ROLE_NAMES } from '@/constants/roles';
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
                title: 'Universities',
                href: '/admin/universities',
                icon: Building2,
            },
            {
                title: 'Users',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: 'System Logs',
                href: '/admin/logs',
                icon: ClipboardList,
            },
            {
                title: 'Settings',
                href: '/admin/settings',
                icon: Settings,
            },
        ];
    } else if (hasRole(ROLE_NAMES.ADMIN_KAMPUS)) {
        roleNavItems = [
            {
                title: 'Skema Penelitian',
                href: '/admin/schemas',
                icon: BookType,
            },
            {
                title: 'Usulan Proposal',
                href: '/admin/proposals',
                icon: FileText,
            },
            {
                title: 'Jadwal Monev',
                href: '/admin/monev',
                icon: CalendarDays,
            },
            {
                title: 'Verifikasi Luaran',
                href: '/admin/output',
                icon: Award,
            },
            {
                title: 'Kelulusan & SKTS',
                href: '/admin/evaluations',
                icon: GraduationCap,
            },
        ];
    } else if (hasRole(ROLE_NAMES.ADMIN_KEUANGAN)) {
        roleNavItems = [
            {
                title: 'Kontrak Hibah',
                href: '/finance/contracts',
                icon: FileText,
            },
            {
                title: 'Termin & Pencairan',
                href: '/finance/fundings',
                icon: CreditCard,
            },
            {
                title: 'Laporan Keuangan',
                href: '/finance/reports',
                icon: FileSpreadsheet,
            },
        ];
    } else if (hasRole(ROLE_NAMES.REVIEWER)) {
        roleNavItems = [
            {
                title: 'Dashboard Reviewer',
                href: '/reviewer/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Penilaian Proposal',
                href: '/reviewer/proposals',
                icon: UserCheck,
            },
            {
                title: 'Penilaian Monev',
                href: '/reviewer/monev',
                icon: CalendarDays,
            },
        ];
    } else if (hasRole(ROLE_NAMES.PENELITI) || hasRole('Dosen') || hasRole('User')) {
        roleNavItems = [
            {
                title: 'Usulan Penelitian',
                href: '/proposals',
                icon: FileText,
            },
            {
                title: 'Laporan Kemajuan',
                href: '/progress',
                icon: Clock,
            },
            {
                title: 'Luaran Riset',
                href: '/outputs',
                icon: Award,
            },
            {
                title: 'Evaluasi Akhir',
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
                  title: 'Dashboard',
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
