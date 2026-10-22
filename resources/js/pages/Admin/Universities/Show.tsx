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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Edit,
    FileSpreadsheet,
    FileText,
    Globe,
    Mail,
    MapPin,
    Phone,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface University {
    id: number;
    code: string;
    ptm_code?: string | null;
    name: string;
    short_name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logo_url?: string | null;
    accreditation_status?: string | null;
    cluster?: string | null;
    profile_description?: string | null;
    is_active: boolean;
    full_address?: string | null;
    created_at: string;
    updated_at: string;
    users_count: number;
    admin_kampus_count: number;
    research_schemas_count: number;
    proposals_count: number;
}

interface AdminKampus {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ResearchSchema {
    id: number;
    nama_skema: string;
    anggaran_maksimal?: number;
    biaya_maksimal?: number;
    is_active?: boolean;
}

interface Props {
    university: University;
    admin_kampus?: AdminKampus[];
    research_schemas?: ResearchSchema[];
    can: {
        update: boolean;
        delete: boolean;
    };
}

export default function UniversitiesShow({ university, admin_kampus = [], research_schemas = [], can }: Props) {
    const { t } = useTranslation();
    const [deleteDialog, setDeleteDialog] = useState(false);

    const handleDelete = () => {
        router.delete(route('admin.universities.destroy', university.id), {
            onSuccess: () => {
                toast.success(t.adminUniversities.deleteSuccess);
            },
            onError: () => {
                toast.error(t.adminUniversities.deleteCannotDeleteWithProposals);
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
        {
            title: university.short_name || university.code,
            href: route('admin.universities.show', university.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${university.name} - ${t.adminUniversities.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                <PageHeader
                    title={university.name}
                    isEditorialSerif={false}
                    subtitle={university.short_name ? `${university.short_name} (${university.code})` : university.code}
                    breadcrumbs={[
                        { label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' },
                        { label: t.adminUniversities.title, href: route('admin.universities.index') },
                        { label: university.name },
                    ]}
                    badge={<StatusBadge status={university.is_active ? 'Active' : 'Inactive'} />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.universities.index')}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <ArrowLeft className="h-4 w-4" />
                                    {t.adminUniversities.backToList}
                                </Button>
                            </Link>
                            {can.update && (
                                <Link href={route('admin.universities.edit', university.id)}>
                                    <Button size="sm" className="gap-1.5 bg-blue-900 text-xs text-white hover:bg-blue-800">
                                        <Edit className="h-4 w-4" />
                                        {t.adminUniversities.editUniversity}
                                    </Button>
                                </Link>
                            )}
                            {can.delete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteDialog(true)}
                                    className="gap-1.5 border-rose-200 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t.adminUniversities.deleteUniversity}
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Top Quick Metrics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminUniversities.colProposals}
                        value={university.proposals_count}
                        type="integer"
                        icon={FileText}
                        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                        iconColorClass="text-blue-900 dark:text-blue-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.adminKampusList}
                        value={university.admin_kampus_count}
                        type="integer"
                        icon={UserCheck}
                        iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
                        iconColorClass="text-emerald-700 dark:text-emerald-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.schemasCount}
                        value={university.research_schemas_count}
                        type="integer"
                        icon={FileSpreadsheet}
                        iconBgClass="bg-indigo-50 dark:bg-indigo-950/40"
                        iconColorClass="text-indigo-700 dark:text-indigo-400"
                    />
                    <MetricCard
                        title={t.adminUniversities.registeredUsers}
                        value={university.users_count}
                        type="integer"
                        icon={Users}
                        iconBgClass="bg-purple-50 dark:bg-purple-950/40"
                        iconColorClass="text-purple-700 dark:text-purple-400"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column (2 Cols) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Institutional Overview & Profile */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {t.adminUniversities.profile}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4 text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                                        {t.adminUniversities.colCode}: {university.code}
                                    </Badge>
                                    {university.ptm_code && (
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {t.adminUniversities.colPtmCode}: {university.ptm_code}
                                        </Badge>
                                    )}
                                    {university.accreditation_status && (
                                        <Badge
                                            variant="outline"
                                            className="border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400"
                                        >
                                            {t.adminUniversities.colAccreditation}: {university.accreditation_status}
                                        </Badge>
                                    )}
                                    {university.cluster && (
                                        <Badge variant="secondary" className="text-xs font-medium">
                                            {t.adminUniversities.colCluster}: {university.cluster}
                                        </Badge>
                                    )}
                                </div>

                                {university.profile_description ? (
                                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">{university.profile_description}</p>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">{t.adminUniversities.fieldDescriptionPlaceholder}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Address & Contact Information */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {t.adminUniversities.addressContact}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{t.adminUniversities.addressInfo}</p>
                                        <p className="mt-0.5 text-xs text-slate-800 dark:text-slate-200">
                                            {university.full_address || university.address || '-'}
                                        </p>
                                        {(university.city || university.province) && (
                                            <p className="text-xs text-slate-500">
                                                {[university.city, university.province, university.postal_code].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{t.adminUniversities.fieldPhone}</p>
                                        {university.phone ? (
                                            <a
                                                href={`tel:${university.phone}`}
                                                className="mt-0.5 text-xs text-blue-900 hover:underline dark:text-blue-400"
                                            >
                                                {university.phone}
                                            </a>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-slate-400">-</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{t.adminUniversities.fieldEmail}</p>
                                        {university.email ? (
                                            <a
                                                href={`mailto:${university.email}`}
                                                className="mt-0.5 text-xs text-blue-900 hover:underline dark:text-blue-400"
                                            >
                                                {university.email}
                                            </a>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-slate-400">-</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{t.adminUniversities.fieldWebsite}</p>
                                        {university.website ? (
                                            <a
                                                href={university.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-0.5 text-xs text-blue-900 hover:underline dark:text-blue-400"
                                            >
                                                {university.website}
                                            </a>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-slate-400">-</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* LPPM Administrators List */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {t.adminUniversities.adminKampusList}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {admin_kampus.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {admin_kampus.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-slate-500">{t.adminUniversities.noAdminKampus}</p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {admin_kampus.map((admin) => (
                                            <div key={admin.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
                                                        {admin.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{admin.name}</p>
                                                        <p className="text-xs text-slate-500">{admin.email}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {admin.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Configured Research Schemes */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {t.adminUniversities.researchSchemas}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {research_schemas.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {research_schemas.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-slate-500">{t.adminUniversities.noResearchSchemas}</p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {research_schemas.map((schema) => (
                                            <div key={schema.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{schema.nama_skema}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {t.adminUniversities.maxBudget}:{' '}
                                                        <TabularFigure
                                                            value={schema.biaya_maksimal || schema.anggaran_maksimal || 0}
                                                            type="currency"
                                                            size="sm"
                                                            className="inline font-mono font-medium text-slate-700 dark:text-slate-300"
                                                        />
                                                    </p>
                                                </div>
                                                <div>
                                                    {schema.is_active !== false ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                        >
                                                            {t.adminUniversities.active}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {t.adminUniversities.inactive}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (1 Col): Tenant Summary & Metadata */}
                    <div className="space-y-6">
                        {/* Tenant Summary Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {t.adminUniversities.tenantSummary}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4 text-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.statusLabel}</span>
                                    {university.is_active ? (
                                        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            {t.adminUniversities.active}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                            {t.adminUniversities.inactive}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.colCode}</span>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{university.code}</span>
                                </div>

                                {university.ptm_code && (
                                    <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                        <span className="text-slate-500">{t.adminUniversities.colPtmCode}</span>
                                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{university.ptm_code}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.colAccreditation}</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{university.accreditation_status || '-'}</span>
                                </div>

                                <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.colCluster}</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{university.cluster || '-'}</span>
                                </div>

                                <div className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.registeredUsers}</span>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{university.users_count}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-slate-500">{t.adminUniversities.colProposals}</span>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{university.proposals_count}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Metadata Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {t.adminUniversities.systemMetadata}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4 text-xs">
                                <div>
                                    <span className="text-slate-500">{t.adminUniversities.registeredAt}</span>
                                    <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {university.created_at}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <span className="text-slate-500">{t.adminUniversities.updatedAt}</span>
                                    <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {university.updated_at}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
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
                                <strong>{university.name}</strong>
                            </p>
                            <p>{t.adminUniversities.deleteConfirmDesc}</p>
                            {university.proposals_count > 0 && (
                                <p className="font-medium text-rose-600">{t.adminUniversities.deleteCannotDeleteWithProposals}</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.adminUniversities.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={university.proposals_count > 0}
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
