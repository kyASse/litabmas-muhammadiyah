import InputError from '@/components/input-error';
import MultiRoleSelect from '@/components/multi-role-select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversityCombobox } from '@/components/ui/university-combobox';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import React from 'react';

export interface University {
    id: number;
    name: string;
    code: string;
    short_name?: string;
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

export interface CreateProps {
    universities: University[];
    roles: Role[];
}

export default function UsersCreate({ universities, roles }: CreateProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.users, href: '/admin/users' },
        { title: t.adminUsers.addUser, href: '/admin/users/create' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        position: '',
        university_id: '',
        role_ids: [] as number[],
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminUsers.createUserTitle} />

            <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Standardized PageHeader */}
                <PageHeader
                    title={t.adminUsers.createUserTitle}
                    subtitle={t.adminUsers.createUserSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={[
                        { label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' },
                        { label: t.adminUsers.title, href: route('admin.users.index') },
                        { label: t.adminUsers.createUserTitle },
                    ]}
                    actions={
                        <Button asChild variant="outline" size="sm" className="font-sans text-sm">
                            <Link href={route('admin.users.index')}>
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                {t.adminUsers.backToList}
                            </Link>
                        </Button>
                    }
                />

                <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
                        {/* Section 1: Personal Information */}
                        <div className="space-y-4">
                            <div className="mb-3.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminUsers.personalInfo}</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="sm:col-span-2">
                                    <Label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUsers.fullName} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={t.adminUsers.fullNamePlaceholder}
                                        required
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUsers.email} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder={t.adminUsers.emailPlaceholder}
                                        required
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                {/* Phone */}
                                <div>
                                    <Label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUsers.phone}
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder={t.adminUsers.phonePlaceholder}
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.phone} className="mt-1" />
                                </div>

                                {/* Position */}
                                <div className="sm:col-span-2">
                                    <Label htmlFor="position" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUsers.position}
                                    </Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder={t.adminUsers.positionPlaceholder}
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.position} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Account Credentials */}
                        <div className="space-y-4">
                            <div className="mb-3.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminUsers.accountInfo}</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Password */}
                                <div>
                                    <Label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUsers.password} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.adminUsers.passwordMinLength}</p>
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                {/* Password Confirmation */}
                                <div>
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        {t.adminUsers.passwordConfirmation} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                        className="font-sans text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: University Assignment */}
                        <div className="space-y-4">
                            <div className="mb-3.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.adminUsers.universityAffiliation}</h2>
                            </div>

                            <div>
                                <Label htmlFor="university_id" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUsers.universitySelectLabel} <span className="text-rose-500">*</span>
                                </Label>
                                <UniversityCombobox
                                    universities={universities}
                                    value={data.university_id}
                                    onValueChange={(val) => setData('university_id', val)}
                                    placeholder={t.adminUsers.universitySelectPlaceholder}
                                    error={errors.university_id}
                                />
                                <InputError message={errors.university_id} className="mt-1" />
                            </div>
                        </div>

                        {/* Section 4: Role Assignment */}
                        <div className="space-y-4">
                            <div className="border-b border-slate-200 pb-2 dark:border-slate-800">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t.adminUsers.roleAssignment}</h2>
                            </div>

                            <div className="space-y-2">
                                <MultiRoleSelect
                                    roles={roles}
                                    selectedRoleIds={data.role_ids}
                                    onChange={(roleIds) => setData('role_ids', roleIds)}
                                    label={t.adminUsers.roleSelectLabel}
                                    error={errors.role_ids}
                                    required
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminUsers.roleSelectHelp}</p>
                                <InputError message={errors.role_ids} />
                            </div>
                        </div>

                        {/* Section 5: Account Status */}
                        <div className="space-y-4">
                            <div className="border-b border-slate-200 pb-2 dark:border-slate-800">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t.adminUsers.accountStatus}</h2>
                            </div>

                            <div className="flex items-center space-x-2.5">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-600"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer text-sm font-normal text-slate-700 dark:text-slate-300">
                                    {t.adminUsers.isActiveCheckboxLabel}
                                </Label>
                            </div>
                        </div>

                        {/* Submit / Cancel Actions */}
                        <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center dark:border-slate-800">
                            <Button
                                asChild
                                type="button"
                                variant="outline"
                                className="font-sans text-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <Link href={route('admin.users.index')}>{t.adminUsers.cancelButton}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-900 font-sans text-sm text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                            >
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                {processing ? t.adminUsers.creating : t.adminUsers.createUserButton}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
