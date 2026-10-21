import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Building2, Calendar, Clock, Edit, FileText, Mail, MapPin, Phone, Power, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface AdminKampusDetail {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    position: string | null;
    avatar_url: string | null;
    is_active: boolean;
    university: {
        id: number;
        name: string;
        short_name?: string;
        code?: string;
        city?: string;
        province?: string;
    } | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    managed_proposals_count: number;
    managed_reviewers_count: number;
    managed_users_count: number;
}

interface Props {
    adminKampus: AdminKampusDetail;
}

export default function AdminKampusShow({ adminKampus }: Props) {
    const { t } = useTranslation();
    const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation?.dashboard || 'Dashboard',
            href: '/dashboard',
        },
        {
            title: t.adminCampusAdmins.title,
            href: '/admin/admin-kampus',
        },
        {
            title: adminKampus.name,
            href: `/admin/admin-kampus/${adminKampus.id}`,
        },
    ];

    const handleToggleActive = () => {
        setProcessing(true);
        router.post(
            route('admin.admin-kampus.toggle-active', adminKampus.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setToggleDialogOpen(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${adminKampus.name} - ${t.adminCampusAdmins.showTitle}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Page Header */}
                <PageHeader
                    title={adminKampus.name}
                    subtitle={adminKampus.position || t.adminCampusAdmins.showTitle}
                    badge={<StatusBadge status={adminKampus.is_active ? 'Active' : 'Inactive'} />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.admin-kampus.index')}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                                    <ArrowLeft className="h-4 w-4" />
                                    {t.adminCampusAdmins.backToList}
                                </Button>
                            </Link>
                            <Link href={route('admin.admin-kampus.edit', adminKampus.id)}>
                                <Button size="sm" className="flex items-center gap-1.5 bg-blue-900 text-xs text-white hover:bg-blue-800">
                                    <Edit className="h-4 w-4" />
                                    {t.common.edit}
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setToggleDialogOpen(true)}
                                className={`flex items-center gap-1.5 text-xs ${
                                    adminKampus.is_active
                                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                                <Power className="h-4 w-4" />
                                {adminKampus.is_active ? t.adminCampusAdmins.deactivateAccount : t.adminCampusAdmins.activateAccount}
                            </Button>
                        </div>
                    }
                />

                {/* Managed Research Metrics Cards */}
                <div>
                    <h2 className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.adminCampusAdmins.managedMetricsTitle}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard
                            title={t.adminCampusAdmins.managedProposals}
                            value={adminKampus.managed_proposals_count}
                            type="integer"
                            icon={FileText}
                            iconBgClass="bg-blue-50"
                            iconColorClass="text-blue-900"
                        />
                        <MetricCard
                            title={t.adminCampusAdmins.managedReviewers}
                            value={adminKampus.managed_reviewers_count}
                            type="integer"
                            icon={ShieldCheck}
                            iconBgClass="bg-emerald-50"
                            iconColorClass="text-emerald-700"
                        />
                        <MetricCard
                            title={t.adminCampusAdmins.managedUsers}
                            value={adminKampus.managed_users_count}
                            type="integer"
                            icon={Users}
                            iconBgClass="bg-indigo-50"
                            iconColorClass="text-indigo-700"
                        />
                    </div>
                </div>

                {/* Main Information Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Administrator Profile Card */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                            <Avatar className="h-16 w-16 border-2 border-slate-200">
                                <AvatarImage src={adminKampus.avatar_url || ''} alt={adminKampus.name} />
                                <AvatarFallback className="bg-blue-50 text-lg font-bold text-blue-900">
                                    {adminKampus.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">{adminKampus.name}</h3>
                                <p className="font-mono text-xs text-slate-500">{adminKampus.email}</p>
                                <div className="mt-2">
                                    <StatusBadge status={adminKampus.is_active ? 'Active' : 'Ditolak'} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.emailLabel}
                                </span>
                                <span className="font-mono text-slate-900">{adminKampus.email}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.phoneLabel}
                                </span>
                                <span className="font-mono text-slate-900">{adminKampus.phone || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.positionLabel}
                                </span>
                                <span className="font-medium text-slate-900">{adminKampus.position || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.lastLogin}
                                </span>
                                <span className="font-mono text-slate-700">{adminKampus.last_login_at || t.adminCampusAdmins.neverLoggedIn}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.createdAt}
                                </span>
                                <span className="font-mono text-slate-700">{adminKampus.created_at}</span>
                            </div>

                            <div className="flex items-center justify-between py-2 text-xs">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {t.adminCampusAdmins.updatedAt}
                                </span>
                                <span className="font-mono text-slate-700">{adminKampus.updated_at}</span>
                            </div>
                        </div>
                    </div>

                    {/* University Affiliation Card */}
                    <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                        <div>
                            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-blue-900">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">{t.adminCampusAdmins.universityAffiliation}</h3>
                                    <p className="text-xs text-slate-500">{adminKampus.university ? adminKampus.university.name : '-'}</p>
                                </div>
                            </div>

                            {adminKampus.university ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                        <span className="text-slate-500">{t.adminCampusAdmins.colUniversity}</span>
                                        <span className="text-right font-semibold text-slate-900">{adminKampus.university.name}</span>
                                    </div>

                                    {adminKampus.university.code && (
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                            <span className="text-slate-500">{t.adminCampusAdmins.code}</span>
                                            <span className="font-mono font-medium text-slate-800">{adminKampus.university.code}</span>
                                        </div>
                                    )}

                                    {(adminKampus.university.city || adminKampus.university.province) && (
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                {t.adminCampusAdmins.cityProvince}
                                            </span>
                                            <span className="text-right font-medium text-slate-800">
                                                {[adminKampus.university.city, adminKampus.university.province].filter(Boolean).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-slate-400">-</div>
                            )}
                        </div>

                        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                            <div className="mb-1 flex items-center gap-2 font-medium text-slate-900">
                                <ShieldCheck className="h-4 w-4 text-blue-900" />
                                <span>{t.adminCampusAdmins.tabActive}</span>
                            </div>
                            <p className="leading-relaxed">{t.adminCampusAdmins.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Toggle Active */}
            <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Power className="h-5 w-5 text-blue-900" />
                            {t.adminCampusAdmins.confirmToggleTitle}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600">{t.adminCampusAdmins.confirmToggleDesc}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div className="font-semibold text-slate-900">{adminKampus.name}</div>
                        <div className="font-mono text-slate-600">{adminKampus.email}</div>
                        <div className="pt-1">
                            <StatusBadge status={adminKampus.is_active ? 'Active' : 'Ditolak'} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setToggleDialogOpen(false)} disabled={processing} className="text-xs">
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={handleToggleActive}
                            disabled={processing}
                            className="bg-blue-900 text-xs font-medium text-white hover:bg-blue-800"
                        >
                            {processing ? t.common.loading : t.adminCampusAdmins.toggleStatus}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
