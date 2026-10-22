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
import { ArrowLeft, Send } from 'lucide-react';
import { type FormEvent } from 'react';
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
        persentase_kemajuan: number;
        ringkasan_progres: string;
        catatan_kendala: string;
        file_laporan_kemajuan: File | null;
        file_logbook: File | null;
    }>({
        id_proposal: '',
        id_monev_schedule: '',
        persentase_kemajuan: 50,
        ringkasan_progres: '',
        catatan_kendala: '',
        file_laporan_kemajuan: null,
        file_logbook: null,
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
