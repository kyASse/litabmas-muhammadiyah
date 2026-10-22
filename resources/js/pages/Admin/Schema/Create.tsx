/**
 * SchemaCreate Component
 *
 * @description
 * Form page for creating a new Research Scheme (Skema Penelitian).
 * Admin Kampus / LPPM can add new competitive funding schemes.
 *
 * @route GET  /admin/schema/create
 * @route POST /admin/schema
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import PageHeader from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

export default function SchemaCreate() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/dashboard',
        },
        {
            title: t.adminSchema.pageTitle,
            href: route('admin.schema.index'),
        },
        {
            title: t.adminSchema.createTitle,
            href: route('admin.schema.create'),
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.schema.store'), {
            onSuccess: () => {
                toast.success(t.adminSchema.saveSuccess);
            },
            onError: () => {
                toast.error(t.adminSchema.saveError);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminSchema.createTitle} />

            <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title={t.adminSchema.createTitle}
                    subtitle={t.adminSchema.createSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900" asChild>
                        <Link href={route('admin.schema.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            {t.common.back}
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-900">{t.adminSchema.createTitle}</CardTitle>
                        <CardDescription className="text-xs text-slate-500">{t.adminSchema.createSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nama Skema */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                    {t.adminSchema.tableColName} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t.adminSchema.namePlaceholder}
                                    className={`border-slate-300 bg-white text-sm text-slate-900 ${errors.name ? 'border-rose-500' : ''}`}
                                />
                                {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                                <p className="text-xs text-slate-400">{t.adminSchema.nameUniqueHint}</p>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                    {t.adminSchema.tableColDesc}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={t.adminSchema.descPlaceholder}
                                    rows={4}
                                    className={`border-slate-300 bg-white text-sm text-slate-900 ${errors.description ? 'border-rose-500' : ''}`}
                                />
                                {errors.description && <p className="text-xs text-rose-600">{errors.description}</p>}
                                <p className="text-xs text-slate-400">{t.adminSchema.descMaxHint}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('admin.schema.index')}>{t.common.cancel}</Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-blue-900 text-white hover:bg-blue-800">
                                    {processing ? t.common.loading : t.common.save}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
