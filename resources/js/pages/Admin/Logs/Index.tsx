import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, Clock, Globe, Laptop, RotateCcw, Search, Shield, UserCheck } from 'lucide-react';
import React, { useState } from 'react';

export interface ActivityLogItem {
    id: number;
    user_id: number | null;
    university_id: number | null;
    activity: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Stats {
    total_logs: number;
    today_logs: number;
    unique_users: number;
    unique_ips: number;
}

interface Props {
    logs: {
        data: ActivityLogItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
    stats?: Stats;
    filters?: {
        search?: string;
    };
}

export default function LogsIndex({ logs, stats, filters }: Props) {
    const { t, format, locale } = useTranslation();
    const [search, setSearch] = useState(filters?.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.systemLogs, href: '/admin/logs' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.logs.index'), { search }, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        router.get(route('admin.logs.index'), {}, { preserveState: true, replace: true });
    };

    const computedStats: Stats = stats || {
        total_logs: logs.total,
        today_logs: 0,
        unique_users: 0,
        unique_ips: 0,
    };

    const formatTimestamp = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(date);
        } catch {
            return dateString;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.adminLogs.title} - ${t.common.appName}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Standardized PageHeader */}
                <PageHeader
                    title={t.adminLogs.title}
                    subtitle={t.adminLogs.subtitle}
                    badge={
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Shield className="mr-1 h-3 w-3 text-slate-500" />
                            {t.adminLogs.globalActivityBadge}
                        </span>
                    }
                />

                {/* Top 4 Bento Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminLogs.totalLogs}
                        value={computedStats.total_logs}
                        type="integer"
                        icon={Activity}
                        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                        iconColorClass="text-blue-900 dark:text-blue-400"
                    />
                    <MetricCard
                        title={t.adminLogs.todayLogs}
                        value={computedStats.today_logs}
                        type="integer"
                        icon={Clock}
                        iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
                        iconColorClass="text-emerald-700 dark:text-emerald-400"
                    />
                    <MetricCard
                        title={t.adminLogs.uniqueUsers}
                        value={computedStats.unique_users}
                        type="integer"
                        icon={UserCheck}
                        iconBgClass="bg-indigo-50 dark:bg-indigo-950/40"
                        iconColorClass="text-indigo-700 dark:text-indigo-400"
                    />
                    <MetricCard
                        title={t.adminLogs.uniqueIps}
                        value={computedStats.unique_ips}
                        type="integer"
                        icon={Globe}
                        iconBgClass="bg-purple-50 dark:bg-purple-950/40"
                        iconColorClass="text-purple-700 dark:text-purple-400"
                    />
                </div>

                {/* Filter and Search Bar Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.adminLogs.searchPlaceholder}
                                className="pl-9 font-sans text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="submit" size="sm" className="bg-blue-900 px-4 font-sans text-sm text-white hover:bg-blue-800">
                                <Search className="mr-1.5 h-3.5 w-3.5" />
                                {t.adminLogs.filterSearch}
                            </Button>
                            {search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    title={t.adminLogs.resetFilters}
                                    className="font-sans text-sm"
                                >
                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                    {t.adminLogs.resetFilters}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Logs Table Card */}
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                            <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminLogs.tableCardTitle}</h2>
                        </div>
                        <span className="font-mono text-xs text-slate-500">
                            {format(t.adminLogs.showingCount, {
                                count: logs.data.length,
                                total: logs.total,
                            })}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                                    <TableHead className="w-52 py-3.5 pl-6 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminLogs.colTimestamp}
                                    </TableHead>
                                    <TableHead className="w-64 py-3.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminLogs.colUser}
                                    </TableHead>
                                    <TableHead className="py-3.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminLogs.colActivity}
                                    </TableHead>
                                    <TableHead className="w-40 py-3.5 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminLogs.colIp}
                                    </TableHead>
                                    <TableHead className="w-56 py-3.5 pr-6 font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminLogs.colDevice}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center font-sans text-sm text-slate-500">
                                            {t.adminLogs.emptyLogs}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                                        >
                                            {/* Timestamp */}
                                            <TableCell className="py-3 pl-6 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>{formatTimestamp(log.created_at)}</span>
                                                </div>
                                            </TableCell>

                                            {/* User / Actor */}
                                            <TableCell className="py-3">
                                                {log.user ? (
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate font-sans text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                            {log.user.name}
                                                        </span>
                                                        <span className="truncate font-mono text-[11px] text-slate-500">{log.user.email}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="border-slate-200 font-sans text-xs text-slate-500">
                                                        {t.adminLogs.guestUser}
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            {/* Activity Description */}
                                            <TableCell className="py-3">
                                                <span className="font-sans text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {log.activity}
                                                </span>
                                            </TableCell>

                                            {/* IP Address */}
                                            <TableCell className="py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>{log.ip_address || '-'}</span>
                                                </div>
                                            </TableCell>

                                            {/* Client Device / User Agent */}
                                            <TableCell className="py-3 pr-6 font-mono text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5" title={log.user_agent || '-'}>
                                                    <Laptop className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span className="max-w-[200px] truncate">{log.user_agent || '-'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row dark:border-slate-800">
                            <span className="font-sans text-xs text-slate-500">
                                {format(t.adminLogs.showingCount, {
                                    count: logs.data.length,
                                    total: logs.total,
                                })}
                            </span>
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className={`h-8 min-w-[32px] px-2 font-sans text-xs ${
                                            link.active
                                                ? 'border-blue-900 bg-blue-900 text-white hover:bg-blue-800'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
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
        </AppLayout>
    );
}
