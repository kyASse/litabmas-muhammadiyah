import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_NAMES } from '@/constants/roles';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Edit, Eye, GraduationCap, Power, RotateCcw, Search, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';

export interface UserRole {
    id: number;
    name: string;
    display_name?: string;
    role_name?: string;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    is_active: boolean;
    is_reviewer?: boolean;
    roles?: UserRole[];
    university?: {
        id: number;
        name: string;
        short_name?: string;
        code?: string;
    } | null;
    last_login_at?: string | null;
    created_at?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedUsers {
    data: UserItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    links: PaginationLink[];
}

export interface IndexProps {
    users: PaginatedUsers | UserItem[];
    universities?: Array<{ id: number; name: string; code?: string; short_name?: string }>;
    stats?: {
        total_users: number;
        active_users: number;
        reviewers_count: number;
        researchers_count: number;
    };
    filters?: {
        search?: string;
        university_id?: string;
        is_active?: string;
        role?: string;
        is_reviewer?: string;
    };
}

export default function UsersIndex({
    users,
    universities = [],
    stats = {
        total_users: 0,
        active_users: 0,
        reviewers_count: 0,
        researchers_count: 0,
    },
    filters = {},
}: IndexProps) {
    const { t, format } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth?.user;

    const hasRole = (roleName: string) => {
        if (!currentUser) return false;
        if (currentUser.role?.name === roleName) return true;
        if (currentUser.roles?.some((r) => r.name === roleName)) return true;
        return false;
    };

    const isAdminKampus = hasRole(ROLE_NAMES.ADMIN_KAMPUS) && !hasRole(ROLE_NAMES.SUPER_ADMIN);

    const userList: UserItem[] = Array.isArray(users) ? users : users?.data || [];
    const isPaginated = !Array.isArray(users) && Boolean(users?.links);
    const paginatedMeta = !Array.isArray(users) ? users : null;

    const [search, setSearch] = useState(filters.search || '');
    const [universityId, setUniversityId] = useState(filters.university_id || 'all');
    const [role, setRole] = useState(filters.role || 'all');
    const [isActive, setIsActive] = useState(filters.is_active || 'all');
    const [toggleUser, setToggleUser] = useState<UserItem | null>(null);

    React.useEffect(() => {
        setIsActive(filters.is_active || 'all');
    }, [filters.is_active]);

    const pendingCount = Math.max(0, (stats?.total_users ?? 0) - (stats?.active_users ?? 0));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.users, href: '/admin/users' },
    ];

    const applyFilters = (overrides: Record<string, string> = {}) => {
        const nextSearch = overrides.search !== undefined ? overrides.search : search;
        const nextUniv = overrides.university_id !== undefined ? overrides.university_id : universityId;
        const nextRole = overrides.role !== undefined ? overrides.role : role;
        const nextActive = overrides.is_active !== undefined ? overrides.is_active : isActive;

        router.get(
            route('admin.users.index'),
            {
                search: nextSearch || undefined,
                university_id: nextUniv === 'all' ? undefined : nextUniv,
                role: nextRole === 'all' ? undefined : nextRole,
                is_active: nextActive === 'all' ? undefined : nextActive,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleResetFilters = () => {
        setSearch('');
        setUniversityId('all');
        setRole('all');
        setIsActive('all');
        router.get(route('admin.users.index'), {}, { preserveState: true, replace: true });
    };

    const handleToggleActiveConfirm = () => {
        if (!toggleUser) return;
        router.post(
            route('admin.users.toggle-active', toggleUser.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setToggleUser(null),
            },
        );
    };

    const getRoleBadgeClasses = (roleName: string): string => {
        const normalized = roleName.toLowerCase().trim();
        if (normalized.includes('super admin')) {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        if (normalized.includes('admin kampus')) {
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        }
        if (normalized.includes('admin keuangan')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (normalized.includes('reviewer')) {
            return 'bg-purple-50 text-purple-700 border-purple-200';
        }
        if (normalized.includes('peneliti')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-300';
    };

    const renderRoles = (user: UserItem) => {
        const roles = user.roles || [];
        const hasReviewerRole = roles.some((r) => (r.name || '').toLowerCase() === 'reviewer');

        return (
            <div className="flex flex-wrap gap-1.5">
                {roles.length > 0 ? (
                    roles.map((r) => {
                        const displayName = r.display_name || r.name || r.role_name || '';
                        return (
                            <span
                                key={r.id}
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 font-sans text-xs font-medium ${getRoleBadgeClasses(
                                    r.name,
                                )}`}
                            >
                                {displayName}
                            </span>
                        );
                    })
                ) : (
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans text-xs text-slate-600">
                        {t.adminUsers.generalUser}
                    </span>
                )}

                {user.is_reviewer && !hasReviewerRole && (
                    <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 font-sans text-xs font-medium text-purple-700">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {t.adminUsers.roleReviewer}
                    </span>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminUsers.title} />

            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Standardized PageHeader */}
                <PageHeader
                    title={t.adminUsers.title}
                    subtitle={t.adminUsers.description}
                    isEditorialSerif={false}
                    breadcrumbs={[{ label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' }, { label: t.adminUsers.title }]}
                    actions={
                        <Link href={route('admin.users.create')}>
                            <Button className="flex items-center gap-2 bg-blue-900 font-sans text-sm text-white hover:bg-blue-800">
                                <UserPlus className="h-4 w-4" />
                                {t.adminUsers.addUser}
                            </Button>
                        </Link>
                    }
                />

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminUsers.totalUsers}
                        value={stats?.total_users ?? 0}
                        icon={Users}
                        iconBgClass="bg-blue-50"
                        iconColorClass="text-blue-900"
                    />
                    <MetricCard
                        title={t.adminUsers.activeUsers}
                        value={stats?.active_users ?? 0}
                        icon={UserCheck}
                        iconBgClass="bg-emerald-50"
                        iconColorClass="text-emerald-700"
                        badgeText={stats?.total_users ? `${Math.round(((stats.active_users ?? 0) / stats.total_users) * 100)}%` : undefined}
                        badgeVariant="success"
                    />
                    <MetricCard
                        title={t.adminUsers.reviewersCount}
                        value={stats?.reviewers_count ?? 0}
                        icon={ShieldCheck}
                        iconBgClass="bg-purple-50"
                        iconColorClass="text-purple-700"
                    />
                    <MetricCard
                        title={t.adminUsers.researchersCount}
                        value={stats?.researchers_count ?? 0}
                        icon={GraduationCap}
                        iconBgClass="bg-amber-50"
                        iconColorClass="text-amber-700"
                    />
                </div>

                {/* Filter Bar */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.adminUsers.searchPlaceholder}
                                className="pl-9 font-sans text-sm"
                            />
                        </div>

                        {/* University Filter / Institution Badge */}
                        {isAdminKampus ? (
                            <div
                                className="flex h-9 w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 lg:w-auto"
                                title={currentUser?.university?.name || universities[0]?.name || ''}
                            >
                                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="max-w-[280px] truncate font-sans text-xs font-medium text-slate-700">
                                    {format(t.adminUsers.ownInstitutionOnly, {
                                        name: currentUser?.university?.short_name || currentUser?.university?.name || universities[0]?.name || '-',
                                    })}
                                </span>
                            </div>
                        ) : (
                            <div className="w-full lg:w-60">
                                <Select
                                    value={universityId}
                                    onValueChange={(val) => {
                                        setUniversityId(val);
                                        applyFilters({ university_id: val });
                                    }}
                                >
                                    <SelectTrigger className="w-full font-sans text-sm">
                                        <SelectValue placeholder={t.adminUsers.filterUniversity} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t.adminUsers.filterUniversity}</SelectItem>
                                        {universities.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.code ? `[${u.code}] ${u.name}` : u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Role Filter */}
                        <div className="w-full lg:w-48">
                            <Select
                                value={role}
                                onValueChange={(val) => {
                                    setRole(val);
                                    applyFilters({ role: val });
                                }}
                            >
                                <SelectTrigger className="w-full font-sans text-sm">
                                    <SelectValue placeholder={t.adminUsers.filterRole} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminUsers.roleAll}</SelectItem>
                                    <SelectItem value="Peneliti">{t.adminUsers.rolePeneliti}</SelectItem>
                                    <SelectItem value="Reviewer">{t.adminUsers.roleReviewer}</SelectItem>
                                    <SelectItem value="Admin Keuangan">{t.adminUsers.roleAdminKeuangan}</SelectItem>
                                    <SelectItem value="Admin Kampus">{t.adminUsers.roleAdminKampus}</SelectItem>
                                    <SelectItem value="Super Admin">{t.adminUsers.roleSuperAdmin}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full lg:w-40">
                            <Select
                                value={isActive}
                                onValueChange={(val) => {
                                    setIsActive(val);
                                    applyFilters({ is_active: val });
                                }}
                            >
                                <SelectTrigger className="w-full font-sans text-sm">
                                    <SelectValue placeholder={t.adminUsers.filterStatus} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminUsers.filterStatus}</SelectItem>
                                    <SelectItem value="1">{t.adminUsers.statusActive}</SelectItem>
                                    <SelectItem value="0">{t.adminUsers.statusInactive}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button type="submit" variant="default" className="bg-blue-900 font-sans text-sm text-white hover:bg-blue-800">
                                {t.adminUsers.applyFilter}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleResetFilters} title={t.common.reset} className="font-sans text-sm">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick-switch Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => {
                            setIsActive('all');
                            applyFilters({ is_active: 'all' });
                        }}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-sans text-sm font-medium transition-colors ${
                            isActive === 'all' || !isActive
                                ? 'border-blue-900 font-semibold text-blue-900'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        <span>{t.adminUsers.tabAll}</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs ${
                                isActive === 'all' || !isActive ? 'bg-blue-100 font-semibold text-blue-900' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {stats?.total_users ?? 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsActive('0');
                            applyFilters({ is_active: '0' });
                        }}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-sans text-sm font-medium transition-colors ${
                            isActive === '0'
                                ? 'border-amber-600 font-semibold text-amber-900'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        <span>{t.adminUsers.tabPending}</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${
                                isActive === '0'
                                    ? 'bg-amber-100 text-amber-900'
                                    : pendingCount > 0
                                      ? 'border border-amber-300 bg-amber-50 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {pendingCount}
                        </span>
                    </button>
                </div>

                {/* Users Table Card */}
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-900" />
                            <h2 className="font-sans text-base font-bold text-slate-900">{t.adminUsers.userList}</h2>
                        </div>
                        <span className="font-mono text-xs text-slate-500">
                            {format(t.adminUsers.showingUsers, {
                                count: userList.length,
                                total: paginatedMeta?.total ?? userList.length,
                            })}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 bg-slate-100 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <TableHead className="py-3.5 pl-6 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminUsers.colName}
                                    </TableHead>
                                    <TableHead className="py-3.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminUsers.colUniversity}
                                    </TableHead>
                                    <TableHead className="py-3.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminUsers.colRoles}
                                    </TableHead>
                                    <TableHead className="py-3.5 text-center font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminUsers.colStatus}
                                    </TableHead>
                                    <TableHead className="py-3.5 pr-6 text-right font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminUsers.colActions}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center font-sans text-sm text-slate-500">
                                            {t.adminUsers.noUsers}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    userList.map((user) => {
                                        const initials =
                                            (user.name || '')
                                                .split(' ')
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join('')
                                                .toUpperCase() || 'U';

                                        return (
                                            <TableRow
                                                key={user.id}
                                                className={`transition-colors ${
                                                    !user.is_active ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/50'
                                                }`}
                                            >
                                                {/* User & Email */}
                                                <TableCell className="py-3 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-200">
                                                            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                                                            <AvatarFallback className="bg-slate-100 font-sans text-xs font-medium text-slate-700">
                                                                {initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <Link
                                                                href={route('admin.users.show', user.id)}
                                                                className="font-sans text-sm font-medium text-slate-900 transition-colors hover:text-blue-900"
                                                            >
                                                                {user.name}
                                                            </Link>
                                                            <span className="font-mono text-xs text-slate-500">{user.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Institution */}
                                                <TableCell className="py-3">
                                                    {user.university ? (
                                                        <div className="flex items-center gap-1.5 font-sans text-xs text-slate-700">
                                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            <span className="max-w-[220px] truncate" title={user.university.name}>
                                                                {user.university.short_name || user.university.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-sans text-xs text-slate-400 italic">{t.adminUsers.globalTenant}</span>
                                                    )}
                                                </TableCell>

                                                {/* Multi-Roles */}
                                                <TableCell className="py-3">{renderRoles(user)}</TableCell>

                                                {/* Status Badge */}
                                                <TableCell className="py-3 text-center">
                                                    <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} size="sm" />
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                                                            title={t.adminUsers.viewDetails}
                                                        >
                                                            <Link href={route('admin.users.show', user.id)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-slate-600 hover:text-blue-900"
                                                            title={t.adminUsers.editUser}
                                                        >
                                                            <Link href={route('admin.users.edit', user.id)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        {!user.is_active ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setToggleUser(user)}
                                                                className="h-8 border-emerald-300 bg-emerald-50 px-2.5 font-sans text-xs font-medium text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
                                                                title={t.adminUsers.activateAction}
                                                            >
                                                                <UserCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                                                                {t.adminUsers.activateAction}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setToggleUser(user)}
                                                                className="h-8 px-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                                                                title={t.adminUsers.deactivate}
                                                            >
                                                                <Power className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {isPaginated && paginatedMeta?.links && paginatedMeta.links.length > 3 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
                            <p className="font-mono text-xs text-slate-500">
                                {format(t.adminUsers.showingUsers, {
                                    count: userList.length,
                                    total: paginatedMeta.total,
                                })}
                            </p>
                            <div className="flex items-center gap-1">
                                {paginatedMeta.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        asChild
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className={`h-8 px-3 font-mono text-xs ${
                                            link.active ? 'bg-blue-900 text-white hover:bg-blue-800' : ''
                                        } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        <Link href={link.url || '#'} preserveScroll preserveState>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Active Confirmation Dialog */}
            {toggleUser && (
                <AlertDialog open={Boolean(toggleUser)} onOpenChange={(open) => !open && setToggleUser(null)}>
                    <AlertDialogContent className="font-sans">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {toggleUser.is_active ? t.adminUsers.confirmDeactivateTitle : t.adminUsers.confirmActivateTitle}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {toggleUser.is_active
                                    ? format(t.adminUsers.confirmDeactivateDesc, {
                                          name: toggleUser.name,
                                          email: toggleUser.email,
                                      })
                                    : format(t.adminUsers.confirmActivateDesc, {
                                          name: toggleUser.name,
                                          email: toggleUser.email,
                                      })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setToggleUser(null)}>{t.adminUsers.cancelButton}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleToggleActiveConfirm}
                                className={
                                    toggleUser.is_active
                                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }
                            >
                                {toggleUser.is_active ? t.adminUsers.deactivate : t.adminUsers.activate}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </AppLayout>
    );
}
