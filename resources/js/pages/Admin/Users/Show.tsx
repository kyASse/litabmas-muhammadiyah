import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
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
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckSquare,
    Clock,
    Edit,
    FileText,
    Mail,
    MapPin,
    Phone,
    Power,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useState } from 'react';

export interface UserRole {
    id: number;
    name: string;
    display_name?: string;
}

export interface UniversityInfo {
    id: number;
    name: string;
    short_name?: string;
    code: string;
    city?: string | null;
    province?: string | null;
}

export interface UserDetail {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    position?: string | null;
    avatar_url?: string | null;
    is_active: boolean;
    is_reviewer?: boolean;
    roles?: UserRole[];
    university?: UniversityInfo | null;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
    proposals_count: number;
    reviews_count: number;
}

export interface ShowProps {
    user: UserDetail;
}

export default function UsersShow({ user }: ShowProps) {
    const { t, format } = useTranslation();
    const [showToggleDialog, setShowToggleDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.users, href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const handleToggleActive = () => {
        router.post(
            route('admin.users.toggle-active', user.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setShowToggleDialog(false),
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

    const initials =
        (user.name || '')
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'U';

    const roles = user.roles || [];
    const hasReviewerRole = roles.some((r) => (r.name || '').toLowerCase() === 'reviewer');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - ${t.adminUsers.userDetails}`} />

            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Standardized PageHeader */}
                <PageHeader
                    title={user.name}
                    subtitle={user.position || user.email}
                    isEditorialSerif={false}
                    breadcrumbs={[
                        { label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' },
                        { label: t.adminUsers.title, href: route('admin.users.index') },
                        { label: user.name },
                    ]}
                    badge={<StatusBadge status={user.is_active ? 'Active' : 'Inactive'} />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="font-sans text-sm">
                                <Link href={route('admin.users.index')}>
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    {t.adminUsers.backToList}
                                </Link>
                            </Button>

                            <Button asChild variant="outline" size="sm" className="font-sans text-sm">
                                <Link href={route('admin.users.edit', user.id)}>
                                    <Edit className="mr-1.5 h-4 w-4" />
                                    {t.adminUsers.editUser}
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowToggleDialog(true)}
                                className={`font-sans text-sm ${
                                    user.is_active
                                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                                <Power className="mr-1.5 h-4 w-4" />
                                {user.is_active ? t.adminUsers.deactivate : t.adminUsers.activate}
                            </Button>
                        </div>
                    }
                />

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column (2 cols width on large screens) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Profile & Contact Details Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                            <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                                <Avatar className="h-16 w-16 border border-slate-200">
                                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                                    <AvatarFallback className="bg-slate-100 font-sans text-xl font-semibold text-slate-700">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h2 className="font-serif text-xl font-bold text-slate-900">{user.name}</h2>
                                    <p className="font-sans text-sm text-slate-600">{user.position || t.adminUsers.notSet}</p>
                                    <p className="font-mono text-xs text-slate-400">ID #{user.id}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h3 className="font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    {t.adminUsers.contactInfo}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
                                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                        <div>
                                            <p className="font-sans text-xs text-slate-500">{t.adminUsers.email}</p>
                                            <p className="font-mono text-sm break-all text-slate-900">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
                                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                        <div>
                                            <p className="font-sans text-xs text-slate-500">{t.adminUsers.phone}</p>
                                            <p className="font-mono text-sm text-slate-900">{user.phone || t.adminUsers.notSet}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 sm:col-span-2">
                                        <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                        <div>
                                            <p className="font-sans text-xs text-slate-500">{t.adminUsers.position}</p>
                                            <p className="font-sans text-sm text-slate-900">{user.position || t.adminUsers.notSet}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* University Affiliation */}
                            <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                                <h3 className="font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    {t.adminUsers.universityAffiliation}
                                </h3>

                                {user.university ? (
                                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 shrink-0 text-blue-900" />
                                            <span className="font-sans text-sm font-semibold text-slate-800">{user.university.name}</span>
                                            {user.university.code && (
                                                <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                                                    {user.university.code}
                                                </span>
                                            )}
                                        </div>
                                        {(user.university.city || user.university.province) && (
                                            <div className="flex items-center gap-1.5 pl-6 font-sans text-xs text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{[user.university.city, user.university.province].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="font-sans text-sm text-slate-500 italic">{t.adminUsers.globalTenant}</p>
                                )}
                            </div>
                        </div>

                        {/* Research Activity Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                            <h3 className="mb-4 font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.adminUsers.researchActivity}
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-sans text-xs font-medium text-blue-900">{t.adminUsers.proposalsAuthored}</span>
                                        <FileText className="h-5 w-5 text-blue-800" />
                                    </div>
                                    <div className="mt-3">
                                        <TabularFigure value={user.proposals_count} type="integer" size="2xl" weight="bold" align="left" />
                                    </div>
                                    <p className="mt-1 font-sans text-xs text-slate-500">{t.adminUsers.proposalsCountDesc}</p>
                                </div>

                                <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-sans text-xs font-medium text-purple-900">{t.adminUsers.reviewsAssigned}</span>
                                        <CheckSquare className="h-5 w-5 text-purple-800" />
                                    </div>
                                    <div className="mt-3">
                                        <TabularFigure value={user.reviews_count} type="integer" size="2xl" weight="bold" align="left" />
                                    </div>
                                    <p className="mt-1 font-sans text-xs text-slate-500">{t.adminUsers.reviewsCountDesc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 col width on large screens) */}
                    <div className="space-y-6">
                        {/* System Roles & Permissions Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                            <h3 className="mb-4 font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.adminUsers.systemRoles}
                            </h3>

                            <div className="space-y-3">
                                <p className="font-sans text-xs text-slate-600">{t.adminUsers.assignedRoles}:</p>

                                <div className="flex flex-wrap gap-2">
                                    {roles.length > 0 ? (
                                        roles.map((r) => (
                                            <span
                                                key={r.id}
                                                className={`inline-flex items-center rounded-md border px-2.5 py-1 font-sans text-xs font-medium ${getRoleBadgeClasses(
                                                    r.name,
                                                )}`}
                                            >
                                                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                                {r.display_name || r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-sans text-xs text-slate-600">
                                            <User className="mr-1.5 h-3.5 w-3.5" />
                                            {t.adminUsers.generalUser}
                                        </span>
                                    )}

                                    {user.is_reviewer && !hasReviewerRole && (
                                        <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 font-sans text-xs font-medium text-purple-700">
                                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                            {t.adminUsers.roleReviewer}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Timestamps & Security Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                            <h3 className="mb-4 font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.adminUsers.accountLogs}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="font-sans text-xs text-slate-500">{t.adminUsers.lastLogin}</p>
                                        <p className="font-mono text-xs text-slate-800">{user.last_login_at || t.adminUsers.neverLoggedIn}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="font-sans text-xs text-slate-500">{t.adminUsers.accountCreated}</p>
                                        <p className="font-mono text-xs text-slate-800">{user.created_at}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="font-sans text-xs text-slate-500">{t.adminUsers.lastUpdated}</p>
                                        <p className="font-mono text-xs text-slate-800">{user.updated_at}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
                <AlertDialogContent className="font-sans">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {user.is_active ? t.adminUsers.confirmDeactivateTitle : t.adminUsers.confirmActivateTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {user.is_active
                                ? format(t.adminUsers.confirmDeactivateDesc, {
                                      name: user.name,
                                      email: user.email,
                                  })
                                : format(t.adminUsers.confirmActivateDesc, {
                                      name: user.name,
                                      email: user.email,
                                  })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowToggleDialog(false)}>{t.adminUsers.cancelButton}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleActive}
                            className={user.is_active ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                        >
                            {user.is_active ? t.adminUsers.deactivate : t.adminUsers.activate}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
