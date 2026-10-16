/**
 * SchemaCreate Component
 *
 * @description
 * Form page for creating a new Research Schema (Skema Penelitian).
 * Super Admin / LPPM can add new schemas with a name and optional description.
 *
 * @route GET  /admin/schema/create
 * @route POST /admin/schema
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/ui/PageHeader';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/hooks/use-translation';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Skema Penelitian',
        href: route('admin.schema.index'),
    },
    {
        title: 'Tambah Skema',
        href: route('admin.schema.create'),
    },
];

export default function SchemaCreate() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.schema.store'), {
            onSuccess: () => {
                toast.success('Skema Penelitian berhasil ditambahkan.');
            },
            onError: () => {
                toast.error('Gagal menambahkan skema. Periksa kembali form.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminSchema.createTitle} />

            <div className="mx-auto max-w-2xl space-y-6">
                <PageHeader
                    title={t.adminSchema.createTitle}
                    subtitle={t.adminSchema.createSubtitle}
                    isEditorialSerif={true}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="gap-2" asChild>
                        <Link href={route('admin.schema.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            {t.common.back}
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-serif text-lg font-semibold">{t.adminSchema.createTitle}</CardTitle>
                        <CardDescription>{t.adminSchema.createSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nama Skema */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    {t.adminSchema.tableColName} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Penelitian Dasar, Penelitian Terapan, PDUPT..."
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                <p className="text-xs text-muted-foreground">Nama skema harus unik dan belum digunakan.</p>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <Label htmlFor="description">{t.adminSchema.tableColDesc}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi singkat mengenai skema penelitian ini..."
                                    rows={4}
                                    className={errors.description ? 'border-destructive' : ''}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                <p className="text-xs text-muted-foreground">Opsional. Maksimal 1000 karakter.</p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t pt-6">
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
