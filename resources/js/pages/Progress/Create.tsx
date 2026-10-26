import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PDFUploader } from '@/components/ui/PDFUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Send, UploadCloud, X } from 'lucide-react';
import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Proposal {
    id: number;
    judul_penelitian?: string;
    judul?: string;
    title?: string;
    nomor_proposal?: string;
}

interface MonevSchedule {
    id: number;
    nama_tahap: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    deskripsi?: string | null;
    is_active: boolean;
}

interface Props {
    proposals: Proposal[];
    schedules: MonevSchedule[];
}

interface GenericUploaderProps {
    label: string;
    helperText?: string;
    accept: string;
    acceptedExtensionsText: string;
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    maxSizeMB?: number;
}

function GenericUploader({ label, helperText, accept, acceptedExtensionsText, value, onChange, error, maxSizeMB = 10 }: GenericUploaderProps) {
    const { t, format } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const validateAndSet = (file: File) => {
        setLocalError(null);
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            const actualMB = (file.size / (1024 * 1024)).toFixed(2);
            setLocalError(
                format(t.components.genericUploader.sizeExceeded, {
                    actual: actualMB,
                    max: maxSizeMB,
                }),
            );
            return;
        }
        onChange(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSet(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSet(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200">{label}</Label>
            {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

            <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

            {!value ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                        isDragging
                            ? 'border-blue-600 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
                            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-900/30'
                    }`}
                >
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                    <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">{t.components.genericUploader.dragDropText}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {acceptedExtensionsText} ({t.components.genericUploader.maxLimit} {maxSizeMB} MB)
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                            <p className="line-clamp-1 text-xs font-medium text-slate-900 dark:text-slate-100">{value.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{(value.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                            if (inputRef.current) inputRef.current.value = '';
                        }}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {(error || localError) && (
                <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error || localError}
                </p>
            )}
        </div>
    );
}

export default function ProgressCreate({ proposals = [], schedules = [] }: Props) {
    const { t, locale } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.monev.progressListTitle, href: route('progress.index') },
        { title: t.monev.createProgressTitle, href: route('progress.create') },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        id_proposal: string;
        id_monev_schedule: string;
        tipe_laporan: 'Pendahuluan' | 'Bulanan' | 'Antara' | 'Akhir';
        persentase_kemajuan: number;
        ringkasan_progres: string;
        catatan_kendala: string;
        file_laporan_kemajuan: File | null;
        file_logbook: File | null;
        file_presentasi: File | null;
        file_tagihan: File | null;
        nominal_tagihan: string;
    }>({
        id_proposal: '',
        id_monev_schedule: '',
        tipe_laporan: 'Antara',
        persentase_kemajuan: 50,
        ringkasan_progres: '',
        catatan_kendala: '',
        file_laporan_kemajuan: null,
        file_logbook: null,
        file_presentasi: null,
        file_tagihan: null,
        nominal_tagihan: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (data.ringkasan_progres.trim().length < 20) {
            toast.error(t.monev.summaryMinCharsError);
            return;
        }

        if (!data.file_laporan_kemajuan) {
            toast.error(t.monev.reportFileRequiredError);
            return;
        }

        post(route('progress.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t.monev.submissionSuccess);
            },
            onError: () => {
                toast.error(t.monev.submissionFailedError);
            },
        });
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isFormValid =
        Boolean(data.id_proposal) &&
        Boolean(data.id_monev_schedule) &&
        Boolean(data.tipe_laporan) &&
        data.persentase_kemajuan >= 1 &&
        data.persentase_kemajuan <= 100 &&
        data.ringkasan_progres.trim().length >= 20 &&
        data.file_laporan_kemajuan !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.monev.createProgressTitle} />

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8">
                {/* Header Navigation */}
                <div className="flex items-center gap-4 border-b border-border pb-5">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('progress.index')} className="flex items-center gap-1.5 text-xs font-semibold">
                            <ArrowLeft className="h-4 w-4" />
                            {t.common.back}
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t.monev.createProgressTitle}</h1>
                        <p className="text-xs text-muted-foreground">{t.monev.createProgressSubtitle}</p>
                    </div>
                </div>

                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                        <CardTitle className="font-sans text-lg font-bold">{t.monev.createProgressTitle}</CardTitle>
                        <CardDescription className="text-xs">{t.monev.activeWindowNotice}</CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Pilihan Proposal Riset */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="id_proposal"
                                    className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                >
                                    {t.monev.selectProposal} <span className="text-rose-600">*</span>
                                </Label>
                                <Select value={data.id_proposal} onValueChange={(val) => setData('id_proposal', val)}>
                                    <SelectTrigger id="id_proposal" className="w-full">
                                        <SelectValue placeholder={t.monev.selectProposalPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {proposals.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">{t.monev.noEligibleProposals}</div>
                                        ) : (
                                            proposals.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    <span className="font-medium">
                                                        {p.judul_penelitian || p.judul || p.title || `Proposal #${p.id}`}
                                                    </span>
                                                    {p.nomor_proposal && (
                                                        <span className="ml-2 font-mono text-xs text-muted-foreground">({p.nomor_proposal})</span>
                                                    )}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.id_proposal && <p className="text-xs font-medium text-rose-600">{errors.id_proposal}</p>}
                            </div>

                            {/* Pilihan Jadwal Monev Aktif */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="id_monev_schedule"
                                    className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                >
                                    {t.monev.selectSchedule} <span className="text-rose-600">*</span>
                                </Label>
                                <Select value={data.id_monev_schedule} onValueChange={(val) => setData('id_monev_schedule', val)}>
                                    <SelectTrigger id="id_monev_schedule" className="w-full">
                                        <SelectValue placeholder={t.monev.selectSchedulePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schedules.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">{t.monev.emptySchedules}</div>
                                        ) : (
                                            schedules.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    <span className="font-medium">{s.nama_tahap}</span>
                                                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                                                        ({formatDate(s.tanggal_mulai)} - {formatDate(s.tanggal_selesai)})
                                                    </span>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.id_monev_schedule && <p className="text-xs font-medium text-rose-600">{errors.id_monev_schedule}</p>}
                            </div>

                            {/* Pilihan Tahapan Laporan 4 Tahap */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="tipe_laporan"
                                    className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                >
                                    {t.monev.reportStageLabel} <span className="text-rose-600">*</span>
                                </Label>
                                <Select
                                    value={data.tipe_laporan}
                                    onValueChange={(val: 'Pendahuluan' | 'Bulanan' | 'Antara' | 'Akhir') => setData('tipe_laporan', val)}
                                >
                                    <SelectTrigger id="tipe_laporan" className="w-full">
                                        <SelectValue placeholder={t.monev.selectReportStage} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendahuluan">
                                            <span className="font-medium">{t.monev.stagePendahuluan}</span>
                                        </SelectItem>
                                        <SelectItem value="Bulanan">
                                            <span className="font-medium">{t.monev.stageBulanan}</span>
                                        </SelectItem>
                                        <SelectItem value="Antara">
                                            <span className="font-medium">{t.monev.stageAntara}</span>
                                        </SelectItem>
                                        <SelectItem value="Akhir">
                                            <span className="font-medium">{t.monev.stageAkhir}</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.tipe_laporan && <p className="text-xs font-medium text-rose-600">{errors.tipe_laporan}</p>}
                            </div>

                            {/* Slider & Input Persentase Kemajuan Riil */}
                            <div className="space-y-3 rounded-lg border border-border bg-slate-50/40 p-4 dark:bg-slate-900/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label
                                            htmlFor="persentase_kemajuan"
                                            className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                        >
                                            {t.monev.progressPercentage} <span className="text-rose-600">*</span>
                                        </Label>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{t.monev.progressPercentageHelp}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TabularFigure
                                            value={data.persentase_kemajuan}
                                            type="percentage"
                                            size="xl"
                                            weight="bold"
                                            className="text-blue-900 dark:text-blue-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        id="persentase_slider"
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={data.persentase_kemajuan}
                                        onChange={(e) => setData('persentase_kemajuan', parseInt(e.target.value) || 1)}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-900 dark:bg-slate-700"
                                    />
                                    <Input
                                        type="number"
                                        id="persentase_kemajuan"
                                        min={1}
                                        max={100}
                                        value={data.persentase_kemajuan}
                                        onChange={(e) => {
                                            const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                            setData('persentase_kemajuan', val);
                                        }}
                                        className="w-24 text-center font-mono font-bold"
                                    />
                                </div>
                                {errors.persentase_kemajuan && <p className="text-xs font-medium text-rose-600">{errors.persentase_kemajuan}</p>}
                            </div>

                            {/* Ringkasan Progres */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="ringkasan_progres"
                                        className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                    >
                                        {t.monev.summaryLabel} <span className="text-rose-600">*</span>
                                    </Label>
                                    <span
                                        className={`font-mono text-xs ${data.ringkasan_progres.length >= 20 ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}
                                    >
                                        {data.ringkasan_progres.length} / 20 {t.monev.charsMin}
                                    </span>
                                </div>
                                <Textarea
                                    id="ringkasan_progres"
                                    rows={4}
                                    placeholder={t.monev.summaryPlaceholder}
                                    value={data.ringkasan_progres}
                                    onChange={(e) => setData('ringkasan_progres', e.target.value)}
                                    required
                                />
                                {errors.ringkasan_progres && <p className="text-xs font-medium text-rose-600">{errors.ringkasan_progres}</p>}
                            </div>

                            {/* Catatan Kendala */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="catatan_kendala"
                                    className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                >
                                    {t.monev.issuesLabel}
                                </Label>
                                <Textarea
                                    id="catatan_kendala"
                                    rows={3}
                                    placeholder={t.monev.issuesPlaceholder}
                                    value={data.catatan_kendala}
                                    onChange={(e) => setData('catatan_kendala', e.target.value)}
                                />
                                {errors.catatan_kendala && <p className="text-xs font-medium text-rose-600">{errors.catatan_kendala}</p>}
                            </div>

                            {/* PDF Uploader: Naskah Laporan Kemajuan */}
                            <div className="space-y-1.5">
                                <PDFUploader
                                    label={t.monev.reportFileLabel}
                                    helperText={t.monev.reportFileHelp}
                                    value={data.file_laporan_kemajuan}
                                    onChange={(file) => setData('file_laporan_kemajuan', file)}
                                    maxSizeMB={10}
                                    required
                                />
                                {errors.file_laporan_kemajuan && <p className="text-xs font-medium text-rose-600">{errors.file_laporan_kemajuan}</p>}
                            </div>

                            {/* PDF Uploader: Berkas Logbook */}
                            <div className="space-y-1.5">
                                <PDFUploader
                                    label={t.monev.logbookFileLabel}
                                    helperText={t.monev.logbookFileHelp}
                                    value={data.file_logbook}
                                    onChange={(file) => setData('file_logbook', file)}
                                    maxSizeMB={10}
                                    required={false}
                                />
                                {errors.file_logbook && <p className="text-xs font-medium text-rose-600">{errors.file_logbook}</p>}
                            </div>

                            {/* Bagian Berkas Presentasi & Tagihan Termin */}
                            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {t.monev.supportingDocumentsTitle}
                                </h4>

                                {/* Berkas Presentasi */}
                                <GenericUploader
                                    label={t.monev.presentationFileLabel}
                                    helperText={t.monev.presentationFileHelp}
                                    accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                    acceptedExtensionsText="PDF, PPT, PPTX"
                                    value={data.file_presentasi}
                                    onChange={(file) => setData('file_presentasi', file)}
                                    error={errors.file_presentasi}
                                    maxSizeMB={10}
                                />

                                {/* Berkas Tagihan Termin / Kuitansi */}
                                <GenericUploader
                                    label={t.monev.billingFileLabel}
                                    helperText={t.monev.billingFileHelp}
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                    acceptedExtensionsText="PDF, JPG, PNG"
                                    value={data.file_tagihan}
                                    onChange={(file) => setData('file_tagihan', file)}
                                    error={errors.file_tagihan}
                                    maxSizeMB={10}
                                />

                                {/* Nominal Tagihan */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="nominal_tagihan"
                                        className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                    >
                                        {t.monev.billingAmountLabel}
                                    </Label>
                                    <Input
                                        type="number"
                                        id="nominal_tagihan"
                                        min={0}
                                        placeholder={t.monev.billingAmountPlaceholder}
                                        value={data.nominal_tagihan}
                                        onChange={(e) => setData('nominal_tagihan', e.target.value)}
                                        className="font-mono"
                                    />
                                    {errors.nominal_tagihan && <p className="text-xs font-medium text-rose-600">{errors.nominal_tagihan}</p>}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('progress.index')}>{t.common.cancel}</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !isFormValid}
                                    className="flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    {processing ? t.monev.btnSubmittingReport : t.monev.btnSubmitReport}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
