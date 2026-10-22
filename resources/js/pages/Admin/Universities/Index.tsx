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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    FileText,
    Plus,
    Power,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface University {
    id: number;
    code: string;
    ptm_code?: string | null;
    name: string;
    short_name?: string | null;
    city?: string | null;
    province?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logo_url?: string | null;
    accreditation_status?: string | null;
    cluster?: string | null;
    profile_description?: string | null;
    is_active: boolean;
    users_count: number;
    proposals_count: number;
    research_schemas_count: number;
    full_address?: string | null;
    created_at: string;
}

interface Stats {
    total_universities: number;
    active_tenants: number;
    total_proposals: number;
    total_researchers: number;
}

interface Props {
    universities: {
        data: University[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
        is_active?: string;
        accreditation_status?: string;
        cluster?: string;
    };
    stats: Stats;
    can: {
        create: boolean;
    };
}

export default function UniversitiesIndex({ universities, filters, stats, can }: Props) {
    const { t } = useTranslation();
    const { flash } = usePage<SharedData>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [isActiveFilter, setIsActiveFilter] = useState(filters.is_active || 'all');
    const [accreditationFilter, setAccreditationFilter] = useState(filters.accreditation_status || 'all');
    const [clusterFilter, setClusterFilter] = useState(filters.cluster || 'all');

    const [toggleDialog, setToggleDialog] = useState<{ open: boolean; university?: University }>({
        open: false,
    });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; university?: University }>({
        open: false,
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.universities.index'),
            {
                search: search || undefined,
                is_active: isActiveFilter === 'all' ? undefined : isActiveFilter,
                accreditation_status: accreditationFilter === 'all' ? undefined : accreditationFilter,
                cluster: clusterFilter === 'all' ? undefined : clusterFilter,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setIsActiveFilter('all');
        setAccreditationFilter('all');
        setClusterFilter('all');
        router.get(route('admin.universities.index'));
    };

    const handleToggleStatus = () => {
        if (!toggleDialog.university) return;
        router.post(
            route('admin.universities.toggle-active', toggleDialog.university.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setToggleDialog({ open: false });
                },
            },
        );
    };

    const handleDelete = () => {
        if (!deleteDialog.university) return;
        router.delete(route('admin.universities.destroy', deleteDialog.university.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialog({ open: false });
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation?.dashboard || 'Dashboard',
            href: '/dashboard',
        },
        {
            title: t.adminUniversities.title,
            href: route('admin.universities.index'),
        },
    ];

    const hasActiveFilters = Boolean(
        search ||
            (isActiveFilter && isActiveFilter !== 'all') ||
            (accreditationFilter && accreditationFilter !== 'all') ||
            (clusterFilter && clusterFilter !== 'all'),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminUniversities.title} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                <PageHeader
                    title={t.adminUniversities.title}
                    subtitle={t.adminUniversities.description}
                    breadcrumbs={[{ label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' }, { label: t.adminUniversities.title }]}
                    actions={
                        can.create ? (
                            <Link href={route('admin.universities.create')}>
                                <Button className="gap-2 bg-blue-900 text-white hover:bg-blue-800">
                                    <Plus className="h-4 w-4" />
                                    {t.adminUniversities.addUniversity}
                                </Button>
                            </Link>
                        ) : undefined
                    }
                />

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminUniversities.totalUniversities}
                        value={stats.total_universities}
                        type="integer"
                        icon={Building2}
                        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                        iconColorClass="text-blue-900 dark:text-blue-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.activeTenants}
                        value={stats.active_tenants}
                        type="integer"
                        icon={CheckCircle2}
                        iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
                        iconColorClass="text-emerald-700 dark:text-emerald-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.totalProposals}
                        value={stats.total_proposals}
                        type="integer"
                        icon={FileText}
                        iconBgClass="bg-indigo-50 dark:bg-indigo-950/40"
                        iconColorClass="text-indigo-700 dark:text-indigo-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.totalResearchers}
                        value={stats.total_researchers}
                        type="integer"
                        icon={Users}
                        iconBgClass="bg-purple-50 dark:bg-purple-950/40"
                        iconColorClass="text-purple-700 dark:text-purple-400"
                    />
                </div>

                {/* Filter Bar */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-neutral-900">
                    <form onSubmit={handleFilterSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder={t.adminUniversities.searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
                            <Select value={isActiveFilter} onValueChange={(val) => setIsActiveFilter(val)}>
                                <SelectTrigger className="w-full lg:w-36">
                                    <SelectValue placeholder={t.adminUniversities.allStatus} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminUniversities.allStatus}</SelectItem>
                                    <SelectItem value="1">{t.adminUniversities.active}</SelectItem>
                                    <SelectItem value="0">{t.adminUniversities.inactive}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={accreditationFilter} onValueChange={(val) => setAccreditationFilter(val)}>
                                <SelectTrigger className="w-full lg:w-44">
                                    <SelectValue placeholder={t.adminUniversities.allAccreditation} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminUniversities.allAccreditation}</SelectItem>
                                    <SelectItem value="Unggul">Unggul</SelectItem>
                                    <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                                    <SelectItem value="Baik">Baik</SelectItem>
                                    <SelectItem value="Cukup">Cukup</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={clusterFilter} onValueChange={(val) => setClusterFilter(val)}>
                                <SelectTrigger className="w-full lg:w-40">
                                    <SelectValue placeholder={t.adminUniversities.allCluster} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminUniversities.allCluster}</SelectItem>
                                    <SelectItem value="Mandiri">Mandiri</SelectItem>
                                    <SelectItem value="Utama">Utama</SelectItem>
                                    <SelectItem value="Madya">Madya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button type="submit" variant="default" className="gap-1.5 bg-blue-900 text-white hover:bg-blue-800">
                                {t.adminUniversities.apply}
                            </Button>
                            {hasActiveFilters && (
                                <Button type="button" variant="outline" onClick={handleReset} className="gap-1.5 text-slate-600">
                                    <X className="h-4 w-4" />
                                    {t.adminUniversities.reset}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Mobile View: Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {universities.data.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
                            {t.adminUniversities.noUniversities}
                        </div>
                    ) : (
                        universities.data.map((uni) => (
                            <Card key={uni.id} className="overflow-hidden border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">{uni.name}</CardTitle>
                                            {uni.short_name && <p className="text-xs text-slate-500">{uni.short_name}</p>}
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {uni.code}
                                                </Badge>
                                                {uni.ptm_code && (
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        PTM: {uni.ptm_code}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <StatusBadge status={uni.is_active ? 'Active' : 'Inactive'} size="sm" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-2.5 pt-3 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {uni.accreditation_status && (
                                            <Badge variant="outline" className="text-xs">
                                                {uni.accreditation_status}
                                            </Badge>
                                        )}
                                        {uni.cluster && (
                                            <Badge variant="secondary" className="text-xs">
                                                {uni.cluster}
                                            </Badge>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-xs text-slate-500">{t.adminUniversities.colCity}: </span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {uni.city && uni.province ? `${uni.city}, ${uni.province}` : '-'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                                        <div>
                                            <span className="text-xs text-slate-500">{t.adminUniversities.colResearchers}</span>
                                            <div className="mt-0.5">
                                                <TabularFigure value={uni.users_count} type="integer" align="center" size="lg" weight="bold" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500">{t.adminUniversities.colProposals}</span>
                                            <div className="mt-0.5">
                                                <TabularFigure value={uni.proposals_count} type="integer" align="center" size="lg" weight="bold" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/30 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                    <Link href={route('admin.universities.show', uni.id)}>
                                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                            <Eye className="h-3.5 w-3.5" />
                                            {t.adminUniversities.viewDetail}
                                        </Button>
                                    </Link>
                                    {can.create && (
                                        <>
                                            <Link href={route('admin.universities.edit', uni.id)}>
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                    <Edit className="h-3.5 w-3.5" />
                                                    {t.adminUniversities.editUniversity}
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setToggleDialog({ open: true, university: uni })}
                                                className="gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                                            >
                                                <Power className="h-3.5 w-3.5" />
                                                {t.adminUniversities.toggleStatus}
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs md:block dark:border-slate-800 dark:bg-slate-900">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                                <TableHead className="w-20 font-semibold">{t.adminUniversities.colCode}</TableHead>
                                <TableHead className="w-24 font-semibold">{t.adminUniversities.colPtmCode}</TableHead>
                                <TableHead className="font-semibold">{t.adminUniversities.colName}</TableHead>
                                <TableHead className="w-28 font-semibold">{t.adminUniversities.colAccreditation}</TableHead>
                                <TableHead className="w-24 font-semibold">{t.adminUniversities.colCluster}</TableHead>
                                <TableHead className="w-36 font-semibold">{t.adminUniversities.colCity}</TableHead>
                                <TableHead className="w-24 text-center font-semibold">{t.adminUniversities.colResearchers}</TableHead>
                                <TableHead className="w-24 text-center font-semibold">{t.adminUniversities.colProposals}</TableHead>
                                <TableHead className="w-24 text-center font-semibold">{t.adminUniversities.colStatus}</TableHead>
                                <TableHead className="w-28 text-right font-semibold">{t.adminUniversities.colActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {universities.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-12 text-center text-slate-500">
                                        {t.adminUniversities.noUniversities}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                universities.data.map((uni) => (
                                    <TableRow
                                        key={uni.id}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                                    >
                                        <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                                            {uni.code}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{uni.ptm_code || '-'}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">{uni.name}</div>
                                                {uni.short_name && <div className="text-xs text-slate-500">{uni.short_name}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {uni.accreditation_status ? (
                                                <Badge variant="outline" className="text-xs font-medium">
                                                    {uni.accreditation_status}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {uni.cluster ? (
                                                <Badge variant="secondary" className="text-xs font-medium">
                                                    {uni.cluster}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                                            {uni.city && uni.province ? `${uni.city}, ${uni.province}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <TabularFigure value={uni.users_count} type="integer" align="center" size="sm" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <TabularFigure value={uni.proposals_count} type="integer" align="center" size="sm" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={uni.is_active ? 'Active' : 'Inactive'} size="sm" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={route('admin.universities.show', uni.id)}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-blue-900"
                                                        title={t.adminUniversities.viewDetail}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {can.create && (
                                                    <>
                                                        <Link href={route('admin.universities.edit', uni.id)}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-blue-900"
                                                                title={t.adminUniversities.editUniversity}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 ${
                                                                uni.is_active
                                                                    ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                                                                    : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                            }`}
                                                            onClick={() => setToggleDialog({ open: true, university: uni })}
                                                            title={t.adminUniversities.toggleStatus}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                            onClick={() => setDeleteDialog({ open: true, university: uni })}
                                                            title={t.adminUniversities.deleteUniversity}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {universities.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row dark:border-slate-800">
                            <div className="text-xs text-slate-500">
                                Showing {(universities.current_page - 1) * universities.per_page + 1} to{' '}
                                {Math.min(universities.current_page * universities.per_page, universities.total)} of {universities.total} entries
                            </div>
                            <div className="flex items-center gap-1">
                                {universities.links.map((link, index) => {
                                    if (link.url === null) return null;
                                    const isFirst = index === 0;
                                    const isLast = index === universities.links.length - 1;

                                    return (
                                        <Link key={index} href={link.url} preserveState preserveScroll>
                                            <Button
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                className={`h-8 px-3 text-xs ${
                                                    link.active ? 'bg-blue-900 text-white hover:bg-blue-800' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {isFirst ? (
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                ) : isLast ? (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                )}
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={toggleDialog.open} onOpenChange={(open) => setToggleDialog({ ...toggleDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <AlertDialogTitle>{t.adminUniversities.confirmToggleTitle}</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="space-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                <strong>{toggleDialog.university?.name}</strong>
                            </p>
                            <p>{t.adminUniversities.confirmToggleDesc}</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.adminUniversities.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleStatus} className="bg-blue-900 text-white hover:bg-blue-800">
                            {toggleDialog.university?.is_active ? t.adminUniversities.deactivate : t.adminUniversities.activate}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/40">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <AlertDialogTitle>{t.adminUniversities.deleteConfirmTitle}</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="space-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                <strong>{deleteDialog.university?.name}</strong>
                            </p>
                            <p>{t.adminUniversities.deleteConfirmDesc}</p>
                            {deleteDialog.university && deleteDialog.university.proposals_count > 0 && (
                                <p className="font-medium text-rose-600">{t.adminUniversities.deleteCannotDeleteWithProposals}</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.adminUniversities.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={Boolean(deleteDialog.university && deleteDialog.university.proposals_count > 0)}
                            className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                            {t.adminUniversities.deleteUniversity}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
