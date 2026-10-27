import InputError from '@/components/input-error';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UniversityCombobox } from '@/components/ui/university-combobox';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Info, KeyRound, ShieldCheck, User } from 'lucide-react';
import React from 'react';

interface University {
    id: number;
    name: string;
    code: string;
    short_name?: string;
}

interface AdminKampusEditData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    position: string | null;
    university_id: number;
    is_active: boolean;
}

interface Props {
    adminKampus: AdminKampusEditData;
    universities: University[];
}

export default function AdminKampusEdit({ adminKampus, universities }: Props) {
    const { t } = useTranslation();

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
        {
            title: t.common.edit,
            href: `/admin/admin-kampus/${adminKampus.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: adminKampus.name || '',
        email: adminKampus.email || '',
        password: '',
        password_confirmation: '',
        phone: adminKampus.phone || '',
        position: adminKampus.position || '',
        university_id: adminKampus.university_id ? adminKampus.university_id.toString() : '',
        is_active: adminKampus.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.admin-kampus.update', adminKampus.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.adminCampusAdmins.editTitle} - ${adminKampus.name}`} />

            <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Page Header */}
                <PageHeader
                    title={t.adminCampusAdmins.editTitle}
                    subtitle={t.adminCampusAdmins.editDescription}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.admin-kampus.show', adminKampus.id)}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                                    <ArrowLeft className="h-4 w-4" />
                                    {t.adminCampusAdmins.viewDetails}
                                </Button>
                            </Link>
                            <Link href={route('admin.admin-kampus.index')}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                                    {t.adminCampusAdmins.backToList}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    {/* Section 1: Personal Information */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                            <User className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminCampusAdmins.personalInfo}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.nameLabel} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t.adminCampusAdmins.namePlaceholder}
                                    className="text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.emailLabel} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t.adminCampusAdmins.emailPlaceholder}
                                    className="text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    required
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.phoneLabel}
                                </Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder={t.adminCampusAdmins.phonePlaceholder}
                                    className="font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="position" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.positionLabel}
                                </Label>
                                <Input
                                    id="position"
                                    type="text"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    placeholder={t.adminCampusAdmins.positionPlaceholder}
                                    className="text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.position} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Account Credentials */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                            <KeyRound className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminCampusAdmins.accountCredentials}</h2>
                        </div>

                        <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                            <Info className="h-4 w-4 flex-shrink-0 text-blue-900 dark:text-blue-400" />
                            <span>{t.adminCampusAdmins.passwordOptionalHint}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.passwordLabel}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={t.adminCampusAdmins.passwordPlaceholder}
                                    className="font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="password_confirmation" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminCampusAdmins.confirmPasswordLabel}
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder={t.adminCampusAdmins.confirmPasswordPlaceholder}
                                    className="font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: University Assignment */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                            <Building2 className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminCampusAdmins.universityAffiliation}</h2>
                        </div>

                        <div>
                            <Label htmlFor="university_id" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {t.adminCampusAdmins.universityLabel} <span className="text-rose-500">*</span>
                            </Label>
                            <UniversityCombobox
                                universities={universities}
                                value={data.university_id}
                                onValueChange={(val) => setData('university_id', val)}
                                placeholder={t.adminCampusAdmins.selectUniversity}
                                error={errors.university_id}
                            />
                            <InputError message={errors.university_id} className="mt-1" />
                        </div>
                    </div>

                    {/* Section 4: Account Status */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                            <ShieldCheck className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminCampusAdmins.activeStatus}</h2>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.adminCampusAdmins.activeStatus}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminCampusAdmins.activeDescription}</p>
                            </div>
                            <Switch checked={data.is_active} onCheckedChange={(val) => setData('is_active', val)} />
                        </div>
                        <InputError message={errors.is_active} />
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href={route('admin.admin-kampus.show', adminKampus.id)}>
                            <Button type="button" variant="outline" disabled={processing} className="text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                {t.common.cancel}
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-blue-900 px-6 text-xs font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">
                            {processing ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
