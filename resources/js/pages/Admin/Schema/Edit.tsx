/**
 * SchemaEdit Component
 *
 * @description
 * Form page for editing an existing Research Schema (Skema Penelitian).
 * Super Admin / LPPM can update the schema name and description.
 *
 * @route GET /admin/schema/{schema}/edit
 * @route PUT /admin/schema/{schema}
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

interface Schema {
    id: number;
    name: string;
    description?: string;
}

interface Props {
    schema: Schema;
}

export default function SchemaEdit({ schema }: Props) {
    const { t } = useTranslation();
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
            title: schema.name,
            href: route('admin.schema.edit', schema.id),
        },
        {
            title: 'Edit',
            href: route('admin.schema.edit', schema.id),
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: schema.name,
        description: schema.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.schema.update', schema.id), {
            onSuccess: () => {
                toast.success('Skema Penelitian berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui skema. Periksa kembali form.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.adminSchema.editTitle} - ${schema.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                <PageHeader
                    title={t.adminSchema.editTitle}
                    subtitle={schema.name}
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
                        <CardTitle className="font-serif text-lg font-semibold">{t.adminSchema.editTitle}</CardTitle>
                        <CardDescription>{t.adminSchema.editSubtitle}</CardDescription>
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
                                <p className="text-xs text-muted-foreground">Nama skema harus unik dan belum digunakan oleh skema lain.</p>
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
