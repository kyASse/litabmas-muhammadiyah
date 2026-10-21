import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';
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
}

interface Props {
    university: University;
}

export default function UniversitiesEdit({ university }: Props) {
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm({
        code: university.code || '',
        ptm_code: university.ptm_code || '',
        name: university.name || '',
        short_name: university.short_name || '',
        address: university.address || '',
        city: university.city || '',
        province: university.province || '',
        postal_code: university.postal_code || '',
        phone: university.phone || '',
        email: university.email || '',
        website: university.website || '',
        logo_url: university.logo_url || '',
        accreditation_status: university.accreditation_status || '',
        cluster: university.cluster || '',
        profile_description: university.profile_description || '',
        is_active: Boolean(university.is_active),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.universities.update', university.id), {
            onSuccess: () => {
                toast.success(t.adminUniversities.updateSuccess);
            },
            onError: () => {
                toast.error(t.adminUniversities.formError);
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
        {
            title: t.adminUniversities.editTitle,
            href: route('admin.universities.edit', university.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.adminUniversities.editTitle}: ${university.name}`} />

            <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title={t.adminUniversities.editTitle}
                    subtitle={t.adminUniversities.editSubtitle}
                    breadcrumbs={[
                        { label: t.navigation?.dashboard || 'Dashboard', href: '/dashboard' },
                        { label: t.adminUniversities.title, href: route('admin.universities.index') },
                        { label: university.name, href: route('admin.universities.show', university.id) },
                        { label: t.adminUniversities.editTitle },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.universities.show', university.id)}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <ArrowLeft className="h-4 w-4" />
                                    {t.adminUniversities.viewDetail}
                                </Button>
                            </Link>
                            <Link href={route('admin.universities.index')}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    {t.adminUniversities.backToList}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    {/* Basic Information */}
                    <Card className="gap-0 border-slate-200 py-0 shadow-xs dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {t.adminUniversities.basicInfo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 p-6 pt-4 md:grid-cols-2">
                            {/* University Code */}
                            <div>
                                <Label htmlFor="code" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldCode} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder={t.adminUniversities.fieldCodePlaceholder}
                                    required
                                    className="font-mono text-xs uppercase"
                                />
                                <InputError message={errors.code} className="mt-1" />
                            </div>

                            {/* PTM Code */}
                            <div>
                                <Label htmlFor="ptm_code" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldPtmCode}
                                </Label>
                                <Input
                                    id="ptm_code"
                                    value={data.ptm_code}
                                    onChange={(e) => setData('ptm_code', e.target.value)}
                                    placeholder={t.adminUniversities.fieldPtmCodePlaceholder}
                                    maxLength={10}
                                    className="font-mono text-xs"
                                />
                                <p className="mt-1 text-xs text-slate-500">{t.adminUniversities.fieldPtmCodeHelp}</p>
                                <InputError message={errors.ptm_code} className="mt-1" />
                            </div>

                            {/* Institution Name */}
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldName} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t.adminUniversities.fieldNamePlaceholder}
                                    required
                                    className="text-xs"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            {/* Short Name */}
                            <div>
                                <Label htmlFor="short_name" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldShortName}
                                </Label>
                                <Input
                                    id="short_name"
                                    value={data.short_name}
                                    onChange={(e) => setData('short_name', e.target.value)}
                                    placeholder={t.adminUniversities.fieldShortNamePlaceholder}
                                    className="text-xs"
                                />
                                <InputError message={errors.short_name} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card className="gap-0 border-slate-200 py-0 shadow-xs dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {t.adminUniversities.addressInfo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 p-6 pt-4 md:grid-cols-3">
                            <div className="md:col-span-3">
                                <Label htmlFor="address" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldAddress}
                                </Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder={t.adminUniversities.fieldAddressPlaceholder}
                                    rows={2}
                                    className="text-xs"
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="city" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldCity}
                                </Label>
                                <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} className="text-xs" />
                                <InputError message={errors.city} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="province" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldProvince}
                                </Label>
                                <Input
                                    id="province"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                    className="text-xs"
                                />
                                <InputError message={errors.province} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="postal_code" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldPostalCode}
                                </Label>
                                <Input
                                    id="postal_code"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    className="font-mono text-xs"
                                />
                                <InputError message={errors.postal_code} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card className="gap-0 border-slate-200 py-0 shadow-xs dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {t.adminUniversities.contactInfo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 p-6 pt-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldPhone}
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder={t.adminUniversities.fieldPhonePlaceholder}
                                    className="text-xs"
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldEmail}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t.adminUniversities.fieldEmailPlaceholder}
                                    className="text-xs"
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="website" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldWebsite}
                                </Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder={t.adminUniversities.fieldWebsitePlaceholder}
                                    className="text-xs"
                                />
                                <InputError message={errors.website} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="logo_url" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldLogoUrl}
                                </Label>
                                <Input
                                    id="logo_url"
                                    type="url"
                                    value={data.logo_url}
                                    onChange={(e) => setData('logo_url', e.target.value)}
                                    placeholder={t.adminUniversities.fieldLogoUrlPlaceholder}
                                    className="text-xs"
                                />
                                <InputError message={errors.logo_url} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Profile */}
                    <Card className="gap-0 border-slate-200 py-0 shadow-xs dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {t.adminUniversities.academicProfile}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 p-6 pt-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="accreditation_status" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldAccreditation}
                                </Label>
                                <Select
                                    value={data.accreditation_status || 'none'}
                                    onValueChange={(val) => setData('accreditation_status', val === 'none' ? '' : val)}
                                >
                                    <SelectTrigger id="accreditation_status" className="w-full">
                                        <SelectValue placeholder={t.adminUniversities.selectAccreditation} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t.adminUniversities.selectAccreditation}</SelectItem>
                                        <SelectItem value="Unggul">Unggul</SelectItem>
                                        <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                                        <SelectItem value="Baik">Baik</SelectItem>
                                        <SelectItem value="Cukup">Cukup</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.accreditation_status} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="cluster" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.adminUniversities.fieldCluster}
                                </Label>
                                <Select value={data.cluster || 'none'} onValueChange={(val) => setData('cluster', val === 'none' ? '' : val)}>
                                    <SelectTrigger id="cluster" className="w-full">
                                        <SelectValue placeholder={t.adminUniversities.selectCluster} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t.adminUniversities.selectCluster}</SelectItem>
                                        <SelectItem value="Mandiri">Mandiri</SelectItem>
                                        <SelectItem value="Utama">Utama</SelectItem>
                                        <SelectItem value="Madya">Madya</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.cluster} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <Label htmlFor="profile_description" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.adminUniversities.fieldDescription}
                                    </Label>
                                    <span className="text-xs text-slate-400">{data.profile_description.length}/250</span>
                                </div>
                                <Textarea
                                    id="profile_description"
                                    value={data.profile_description}
                                    onChange={(e) => setData('profile_description', e.target.value)}
                                    maxLength={250}
                                    placeholder={t.adminUniversities.fieldDescriptionPlaceholder}
                                    rows={3}
                                    className="text-xs"
                                />
                                <InputError message={errors.profile_description} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tenant Status */}
                    <Card className="gap-0 border-slate-200 py-0 shadow-xs dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {t.adminUniversities.tenantStatus}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-4">
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                                    className="mt-0.5"
                                />
                                <div className="grid gap-1">
                                    <Label htmlFor="is_active" className="cursor-pointer text-xs font-medium">
                                        {t.adminUniversities.activeTenantLabel}
                                    </Label>
                                    <p className="text-xs text-slate-500">{t.adminUniversities.activeTenantHelp}</p>
                                </div>
                            </div>
                            <InputError message={errors.is_active} className="mt-1" />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <Link href={route('admin.universities.index')}>
                            <Button type="button" variant="outline" size="sm" className="text-xs">
                                {t.adminUniversities.cancel}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="gap-1.5 bg-blue-900 text-xs text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? t.adminUniversities.saving : t.adminUniversities.saveChanges}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
