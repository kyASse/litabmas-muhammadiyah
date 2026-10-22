/**
 * Proposal/Edit — Dosen / Peneliti
 *
 * @description
 * Formulir pengubahan proposal penelitian bagi Dosen.
 *
 * @features
 * - Mengubah judul, deskripsi, dan skema penelitian
 * - Opsi unggah berkas proposal PDF baru via PDFUploader (Upload Guard 10MB)
 * - Tombol opsi: "Simpan sebagai Draf" (Draft) dan "Kirim Proposal" (Submit)
 * - Penanganan validasi error realtime via useForm Inertia & useTranslation()
 *
 * @route GET /proposals/{proposal}/edit
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PDFUploader } from '@/components/ui/PDFUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { route } from 'ziggy-js';

interface SchemaOption {
    id: number;
    nama_skema?: string;
    name?: string;
    deskripsi?: string;
    biaya_maksimal?: number;
}

interface ProposalData {
    id: number;
    title?: string;
    judul?: string;
    judul_penelitian?: string;
    description?: string;
    deskripsi?: string;
    abstrak?: string;
    id_skema_pendanaan?: number;
    research_schema_id?: number;
    file_dokumen_proposal?: string | null;
    status_proposal?: string;
}

interface EditProps {
    proposal: ProposalData;
    schemas?: SchemaOption[];
}

export default function Edit({ proposal, schemas = [] }: EditProps) {
    const { t } = useTranslation();

    const initialTitle = proposal?.judul_penelitian ?? proposal?.title ?? proposal?.judul ?? '';
    const initialDesc = proposal?.abstrak ?? proposal?.description ?? proposal?.deskripsi ?? '';
    const initialSchemaId = proposal?.id_skema_pendanaan ?? proposal?.research_schema_id;

    const { data, setData, post, transform, processing, errors } = useForm({
        judul_penelitian: initialTitle,
        title: initialTitle,
        abstrak: initialDesc,
        description: initialDesc,
        id_skema_pendanaan: initialSchemaId ? String(initialSchemaId) : '',
        research_schema_id: initialSchemaId ? String(initialSchemaId) : '',
        file_dokumen_proposal: null as File | null,
        action: proposal?.status_proposal === 'Draft' ? 'draft' : 'submit',
        _method: 'PUT',
    });

    if (!proposal) {
        return <div className="p-6 font-sans text-sm text-slate-600 dark:text-slate-400">{t.proposalEdit.notFound}</div>;
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.proposals, href: route('proposal.index') },
        { title: t.proposalEdit.pageTitle, href: '#' },
    ];

    const handleSubmit = (actionType: 'draft' | 'submit') => {
        if (actionType === 'submit') {
            if (!confirm(t.proposalEdit.confirmSubmit)) {
                return;
            }
        }

        transform((formData) => ({
            ...formData,
            action: actionType,
            judul_penelitian: formData.title,
            abstrak: formData.description,
            id_skema_pendanaan: formData.research_schema_id,
        }));
        post(route('proposal.update', proposal.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.proposalEdit.pageTitle} - ${data.title}`} />

            <div className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header Navigation */}
                <div className="flex items-center space-x-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                    <Link href={route('proposal.index')}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-sans text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                            {t.proposalEdit.pageTitle}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.proposalEdit.pageSubtitle}</p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                    <CardHeader className="border-b border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                        <CardTitle className="font-sans text-lg font-bold text-slate-900 dark:text-slate-100">{t.proposalEdit.cardTitle}</CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">{t.proposalEdit.cardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            {/* Judul Proposal */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                    {t.proposalEdit.titleLabel} <span className="text-rose-600">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => {
                                        setData('title', e.target.value);
                                        setData('judul_penelitian', e.target.value);
                                    }}
                                    className={errors.title || errors.judul_penelitian ? 'border-rose-600' : ''}
                                />
                                {(errors.title || errors.judul_penelitian) && (
                                    <p className="text-xs font-medium text-rose-600">{errors.title || errors.judul_penelitian}</p>
                                )}
                            </div>

                            {/* Skema Penelitian */}
                            {schemas.length > 0 && (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="research_schema_id"
                                        className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                    >
                                        {t.proposalEdit.schemeLabel} <span className="text-rose-600">*</span>
                                    </Label>
                                    <Select
                                        value={data.research_schema_id}
                                        onValueChange={(val) => {
                                            setData('research_schema_id', val);
                                            setData('id_skema_pendanaan', val);
                                        }}
                                    >
                                        <SelectTrigger className={errors.research_schema_id || errors.id_skema_pendanaan ? 'border-rose-600' : ''}>
                                            <SelectValue placeholder={t.proposalEdit.selectSchemePlaceholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schemas.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.nama_skema || s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(errors.research_schema_id || errors.id_skema_pendanaan) && (
                                        <p className="text-xs font-medium text-rose-600">{errors.research_schema_id || errors.id_skema_pendanaan}</p>
                                    )}
                                </div>
                            )}

                            {/* Deskripsi / Abstrak */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                >
                                    {t.proposalEdit.abstractLabel} <span className="text-rose-600">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={5}
                                    value={data.description}
                                    onChange={(e) => {
                                        setData('description', e.target.value);
                                        setData('abstrak', e.target.value);
                                    }}
                                    className={errors.description || errors.abstrak ? 'border-rose-600' : ''}
                                />
                                {(errors.description || errors.abstrak) && (
                                    <p className="text-xs font-medium text-rose-600">{errors.description || errors.abstrak}</p>
                                )}
                            </div>

                            {/* Berkas Dokumen Proposal via PDFUploader (Upload Guard Invariant 6) */}
                            <div className="space-y-2">
                                <PDFUploader
                                    label={t.proposalEdit.fileLabel}
                                    helperText={proposal.file_dokumen_proposal ? t.proposalEdit.fileUploadedNotice : undefined}
                                    value={data.file_dokumen_proposal}
                                    onChange={(file) => setData('file_dokumen_proposal', file)}
                                    maxSizeMB={10}
                                    required={false}
                                />
                                {errors.file_dokumen_proposal && <p className="text-xs font-medium text-rose-600">{errors.file_dokumen_proposal}</p>}
                            </div>

                            {/* Action Buttons: Draf vs Kirim */}
                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800">
                                <Link href={route('proposal.index')}>
                                    <Button type="button" variant="ghost" className="w-full text-slate-700 sm:w-auto dark:text-slate-300">
                                        {t.proposalEdit.cancelBtn}
                                    </Button>
                                </Link>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={processing}
                                    onClick={() => handleSubmit('draft')}
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {t.proposalEdit.saveDraftBtn}
                                </Button>

                                <Button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => handleSubmit('submit')}
                                    className="w-full bg-blue-900 text-white hover:bg-blue-800 sm:w-auto"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {t.proposalEdit.submitBtn}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
