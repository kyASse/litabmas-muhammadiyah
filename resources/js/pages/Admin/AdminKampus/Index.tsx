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
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Edit, Eye, Plus, Power, RotateCcw, Search, UserCheck, Users, UserX } from 'lucide-react';
import React, { useState } from 'react';

interface University {
    id: number;
    name: string;
    code: string;
    short_name?: string;
}

interface AdminKampusItem {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    university: {
        id: number;
        name: string;
        short_name?: string;
        code?: string;
    } | null;
    last_login_at: string | null;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    adminKampus: PaginatedData<AdminKampusItem>;
    universities: University[];
    stats: {
        total_admins: number;
        active_admins: number;
        inactive_admins: number;
        universities_served: number;
    };
    filters: {
        search?: string;
        university_id?: string;
        is_active?: string;
    };
}

export default function AdminKampusIndex({ adminKampus, universities, stats, filters }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.adminCampusAdmins.title, href: '/admin/admin-kampus' },
    ];

    const [search, setSearch] = useState(filters.search || '');
    const [universityId, setUniversityId] = useState(filters.university_id || 'all');
    const [isActive, setIsActive] = useState(filters.is_active !== undefined ? String(filters.is_active) : 'all');
    const [toggleUser, setToggleUser] = useState<AdminKampusItem | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search, university_id: universityId, is_active: isActive });
    };

    const handleUniversityChange = (val: string) => {
        setUniversityId(val);
        applyFilters({ search, university_id: val, is_active: isActive });
    };

    const handleStatusChange = (val: string) => {
        setIsActive(val);
        applyFilters({ search, university_id: universityId, is_active: val });
    };

    const handleResetFilters = () => {
        setSearch('');
        setUniversityId('all');
        setIsActive('all');
        router.get('/admin/admin-kampus', {}, { preserveState: true });
    };

    const applyFilters = (newFilters: { search?: string; university_id?: string; is_active?: string }) => {
        const query: Record<string, string> = {};
        if (newFilters.search?.trim()) query.search = newFilters.search.trim();
        if (newFilters.university_id && newFilters.university_id !== 'all') query.university_id = newFilters.university_id;
        if (newFilters.is_active && newFilters.is_active !== 'all') query.is_active = newFilters.is_active;

        router.get('/admin/admin-kampus', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleConfirm = () => {
        if (!toggleUser) return;
        router.post(
            `/admin/admin-kampus/${toggleUser.id}/toggle-active`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setToggleUser(null),
            },
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminCampusAdmins.title} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <PageHeader
                    title={t.adminCampusAdmins.title}
                    subtitle={t.adminCampusAdmins.description}
                    actions={
                        <Link href="/admin/admin-kampus/create">
                            <Button className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                                <Plus className="h-4 w-4" />
                                <span>{t.adminCampusAdmins.addAdmin}</span>
                            </Button>
                        </Link>
                    }
                />

                {/* Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminCampusAdmins.totalAdmins}
                        value={stats.total_admins}
                        type="integer"
                        icon={Users}
                        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                        iconColorClass="text-blue-900 dark:text-blue-400"
                    />
                    <MetricCard
                        title={t.adminCampusAdmins.activeAdmins}
                        value={stats.active_admins}
                        type="integer"
                        icon={UserCheck}
                        iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
                        iconColorClass="text-emerald-700 dark:text-emerald-400"
                    />
                    <MetricCard
                        title={t.adminCampusAdmins.inactiveAdmins}
                        value={stats.inactive_admins}
                        type="integer"
                        icon={UserX}
                        iconBgClass="bg-amber-50 dark:bg-amber-950/40"
                        iconColorClass="text-amber-700 dark:text-amber-400"
                    />
                    <MetricCard
                        title={t.adminCampusAdmins.universitiesServed}
                        value={stats.universities_served}
                        type="integer"
                        icon={Building2}
                        iconBgClass="bg-purple-50 dark:bg-purple-950/40"
                        iconColorClass="text-purple-700 dark:text-purple-400"
                    />
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="relative md:col-span-5">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.adminCampusAdmins.searchPlaceholder}
                                className="pl-9 text-sm"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <Select value={universityId} onValueChange={handleUniversityChange}>
                                <SelectTrigger className="w-full text-sm">
                                    <SelectValue placeholder={t.adminCampusAdmins.filterUniversity} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminCampusAdmins.filterUniversity}</SelectItem>
                                    {universities.map((univ) => (
                                        <SelectItem key={univ.id} value={String(univ.id)}>
                                            {univ.code ? `[${univ.code}] ` : ''}
                                            {univ.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <Select value={isActive} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full text-sm">
                                    <SelectValue placeholder={t.adminCampusAdmins.filterAll} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminCampusAdmins.filterAll}</SelectItem>
                                    <SelectItem value="1">{t.adminCampusAdmins.filterActive}</SelectItem>
                                    <SelectItem value="0">{t.adminCampusAdmins.filterInactive}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 md:col-span-2">
                            <Button type="submit" className="flex-1 bg-blue-900 font-sans text-sm text-white hover:bg-blue-800">
                                <Search className="mr-1.5 h-3.5 w-3.5" />
                                {t.common.search}
                            </Button>
                            {(search || (universityId && universityId !== 'all') || (isActive && isActive !== 'all')) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleResetFilters}
                                    title={t.adminCampusAdmins.clearFilters}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-900/50">
                                    <TableHead className="w-[300px] text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.colAdmin}
                                    </TableHead>
                                    <TableHead className="w-[280px] text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.colUniversity}
                                    </TableHead>
                                    <TableHead className="w-[160px] text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.colContact}
                                    </TableHead>
                                    <TableHead className="w-[120px] text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.colStatus}
                                    </TableHead>
                                    <TableHead className="w-[180px] text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.lastLogin}
                                    </TableHead>
                                    <TableHead className="w-[120px] text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        {t.adminCampusAdmins.actions}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminKampus.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-sm text-slate-500">
                                            {t.adminCampusAdmins.noActiveAdmins}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    adminKampus.data.map((admin) => (
                                        <TableRow
                                            key={admin.id}
                                            className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/30"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                                                        <AvatarImage src={admin.avatar_url || undefined} alt={admin.name} />
                                                        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {getInitials(admin.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/admin-kampus/${admin.id}`}
                                                            className="font-medium text-slate-900 hover:text-blue-900 dark:text-slate-100 dark:hover:text-blue-400"
                                                        >
                                                            {admin.name}
                                                        </Link>
                                                        <div className="truncate font-mono text-xs text-slate-500">{admin.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {admin.university ? (
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                {admin.university.code}
                                                            </span>
                                                            <span className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                                                                {admin.university.short_name || admin.university.name}
                                                            </span>
                                                        </div>
                                                        <div className="truncate text-[11px] text-slate-500">{admin.university.name}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                    {admin.phone ? (
                                                        <span className="font-mono">{admin.phone}</span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={admin.is_active ? 'Active' : 'Inactive'} size="sm" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                    {admin.last_login_at ? (
                                                        <span className="font-mono text-[11px]">{admin.last_login_at}</span>
                                                    ) : (
                                                        <span className="text-slate-400">{t.adminCampusAdmins.neverLoggedIn}</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {t.adminCampusAdmins.createdAt}: {admin.created_at.slice(0, 10)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/admin/admin-kampus/${admin.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                                            title={t.adminCampusAdmins.viewDetails}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/admin-kampus/${admin.id}/edit`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                                            title={t.adminCampusAdmins.editTitle}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setToggleUser(admin)}
                                                        className={`h-8 w-8 ${
                                                            admin.is_active
                                                                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                                                        }`}
                                                        title={
                                                            admin.is_active
                                                                ? t.adminCampusAdmins.deactivateAccount
                                                                : t.adminCampusAdmins.activateAccount
                                                        }
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {adminKampus.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                            <div className="text-xs text-slate-500">
                                Showing {(adminKampus.current_page - 1) * adminKampus.per_page + 1} to{' '}
                                {Math.min(adminKampus.current_page * adminKampus.per_page, adminKampus.total)} of {adminKampus.total} entries
                            </div>
                            <div className="flex items-center gap-1">
                                {adminKampus.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        className="h-8 px-3 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={!!toggleUser} onOpenChange={(open) => !open && setToggleUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.adminCampusAdmins.confirmToggleTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.adminCampusAdmins.confirmToggleDesc}
                            {toggleUser && (
                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{toggleUser.name}</div>
                                    <div className="font-mono text-slate-500">{toggleUser.email}</div>
                                    {toggleUser.university && (
                                        <div className="mt-1 text-slate-600 dark:text-slate-400">{toggleUser.university.name}</div>
                                    )}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleConfirm}
                            className={
                                toggleUser?.is_active
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600'
                            }
                        >
                            {toggleUser?.is_active ? t.adminCampusAdmins.deactivateAccount : t.adminCampusAdmins.activateAccount}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
