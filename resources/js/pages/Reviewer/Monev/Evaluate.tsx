import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Download, FileCheck, FileText, Lock, Send, ShieldAlert, Unlock, User } from 'lucide-react';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

interface ProposalUser {
    id: number;
    name: string;
    email?: string;
}

interface ProposalItem {
    id: number;
    judul?: string;
    title?: string;
    nomor_proposal?: string;
    user?: ProposalUser;
}

interface MonevScheduleItem {
    id: number;
    nama_tahap: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
}

interface ProgressReport {
    id: number;
    id_proposal?: number;
    id_monev_schedule?: number;
    persentase_kemajuan: number;
    ringkasan_progres: string;
    catatan_kendala?: string | null;
    file_laporan_kemajuan?: string | null;
    file_logbook?: string | null;
    skor_monev?: number | string | null;
    catatan_reviewer_monev?: string | null;
    status_laporan: string;
    created_at: string;
    proposal?: ProposalItem;
    monevSchedule?: MonevScheduleItem;
    monev_schedule?: MonevScheduleItem;
}

interface Props {
    report: ProgressReport;
}

export default function MonevEvaluate({ report }: Props) {
    const { t, locale } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.monev.evalBreadcrumb, href: '#' },
        { title: t.monev.reviewBreadcrumb.replace('{id}', String(report.id)), href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        skor_monev: report.skor_monev !== null && report.skor_monev !== undefined ? String(report.skor_monev) : '',
        status_laporan: report.status_laporan === 'Approved' || report.status_laporan === 'Revision' ? report.status_laporan : 'Approved',
        catatan_reviewer_monev: report.catatan_reviewer_monev || '',
    });

    const numScore = parseFloat(data.skor_monev);
    const isScoreValid = !isNaN(numScore) && numScore >= 0 && numScore <= 100;
    const isNotesValid = data.catatan_reviewer_monev.trim().length >= 10;
    const canSubmit = isScoreValid && isNotesValid && !processing;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!isScoreValid) {
            toast.error(t.monev.evalScoreRangeError);
            return;
        }

        if (!isNotesValid) {
            toast.error(t.monev.evalNotesMinLengthError);
            return;
        }

        post(route('reviewer.monev.evaluate', report.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t.monev.evalSuccess);
            },
            onError: () => {
                toast.error(t.monev.evalSaveError);
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

    const getScoreDescriptor = (score: number) => {
        if (score >= 85) return t.monev.scoreDescriptorExcellent;
        if (score >= 70) return t.monev.scoreDescriptorGood;
        if (score >= 50) return t.monev.scoreDescriptorFair;
        return t.monev.scoreDescriptorPoor;
    };

    const sched = report.monevSchedule || report.monev_schedule;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.monev.evalTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">{t.monev.evalTitle}</h1>
                        <p className="mt-1 text-xs text-muted-foreground">{t.monev.evalSubtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <StatusBadge
                            status={
                                report.status_laporan === 'Approved'
                                    ? 'Monev_Approved'
                                    : report.status_laporan === 'Revision'
                                      ? 'Revisi'
                                      : 'Submitted'
                            }
                        />
                    </div>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Progress Submission Details */}
                    <div className="flex flex-col gap-6 lg:col-span-7">
                        {/* Proposal & Research Identity Card */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="font-serif text-base font-bold text-foreground">{t.monev.proposalAndMonevIdentity}</CardTitle>
                                <CardDescription className="text-xs">{t.monev.proposalAndMonevIdentityDesc}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 p-5 text-sm">
                                <div>
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        {t.monev.proposalTitle}
                                    </span>
                                    <h2 className="mt-1 font-serif text-base font-bold text-foreground">
                                        {report.proposal?.judul || report.proposal?.title || '-'}
                                    </h2>
                                    {report.proposal?.nomor_proposal && (
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{report.proposal.nomor_proposal}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-2 sm:grid-cols-2">
                                    <div>
                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {t.monev.principalInvestigator}
                                        </span>
                                        <div className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{report.proposal?.user?.name || '-'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {t.monev.monevStageSchedule}
                                        </span>
                                        <p className="mt-1 font-medium text-foreground">{sched?.nama_tahap || '-'}</p>
                                        {sched && (
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {formatDate(sched.tanggal_mulai)} - {formatDate(sched.tanggal_selesai)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Capaian Persentase Riil */}
                                <div className="rounded-lg border border-border bg-slate-50/70 p-4 dark:bg-slate-900/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                {t.monev.actualProgressPercentage}
                                            </span>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{t.monev.actualProgressClaimDesc}</p>
                                        </div>
                                        <TabularFigure
                                            value={report.persentase_kemajuan}
                                            type="percentage"
                                            size="2xl"
                                            weight="bold"
                                            className="text-blue-900 dark:text-blue-400"
                                        />
                                    </div>
                                    {/* Visual Progress Bar */}
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className="h-full bg-blue-900 transition-all duration-300 dark:bg-blue-600"
                                            style={{ width: `${Math.min(100, Math.max(0, report.persentase_kemajuan))}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Substantive Summary & Obstacles */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="font-serif text-base font-bold text-foreground">
                                    {t.monev.summaryLabel} & {t.monev.issuesLabel}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4 p-5 text-sm">
                                <div>
                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t.monev.summaryLabel}</h3>
                                    <div className="mt-2 rounded-lg border border-border bg-slate-50/40 p-4 leading-relaxed whitespace-pre-wrap text-foreground dark:bg-slate-900/20">
                                        {report.ringkasan_progres || '-'}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t.monev.issuesLabel}</h3>
                                    <div className="mt-2 rounded-lg border border-border bg-slate-50/40 p-4 leading-relaxed whitespace-pre-wrap text-foreground dark:bg-slate-900/20">
                                        {report.catatan_kendala ? (
                                            report.catatan_kendala
                                        ) : (
                                            <span className="text-muted-foreground italic">{t.monev.noObstaclesReported}</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Document Verification & Downloads */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="font-serif text-base font-bold text-foreground">{t.monev.supportingDocumentsTitle}</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 p-5">
                                <div className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-slate-50/40 p-3.5 sm:flex-row sm:items-center dark:bg-slate-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{t.monev.reportFileLabel}</p>
                                            <p className="text-xs text-muted-foreground">{t.monev.progressReportDocDesc}</p>
                                        </div>
                                    </div>

                                    {report.file_laporan_kemajuan ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a
                                                href={`/storage/${report.file_laporan_kemajuan}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-400"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                {t.monev.downloadReport}
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">{t.monev.fileNotUploaded}</span>
                                    )}
                                </div>

                                <div className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-slate-50/40 p-3.5 sm:flex-row sm:items-center dark:bg-slate-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <FileCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{t.monev.logbookFileLabel}</p>
                                            <p className="text-xs text-muted-foreground">{t.monev.logbookDocDesc}</p>
                                        </div>
                                    </div>

                                    {report.file_logbook ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a
                                                href={`/storage/${report.file_logbook}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                {t.monev.downloadLogbook}
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">{t.monev.fileNotAttached}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Reviewer Evaluation Form */}
                    <div className="flex flex-col gap-6 lg:col-span-5">
                        <Card className="sticky top-6 border-border shadow-sm">
                            <CardHeader className="border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="font-serif text-lg font-bold text-foreground">{t.monev.reviewerEvaluationSheet}</CardTitle>
                                <CardDescription className="text-xs">{t.monev.reviewerEvaluationSheetDesc}</CardDescription>
                            </CardHeader>

                            <CardContent className="p-5">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    {/* Nilai / Skor Monev */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="skor_monev"
                                                className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                            >
                                                {t.monev.scoreLabel} <span className="text-rose-600">*</span>
                                            </Label>
                                            {isScoreValid && (
                                                <span className="font-mono text-xs font-semibold text-blue-900 dark:text-blue-400">
                                                    [{getScoreDescriptor(numScore)}]
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            id="skor_monev"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder={t.monev.scorePlaceholder}
                                            value={data.skor_monev}
                                            onChange={(e) => setData('skor_monev', e.target.value)}
                                            required
                                            className="font-mono text-base font-bold"
                                        />
                                        <p className="text-xs text-muted-foreground">{t.monev.scoreHelp}</p>
                                        {errors.skor_monev && <p className="text-xs font-medium text-rose-600">{errors.skor_monev}</p>}
                                    </div>

                                    {/* Pilihan Putusan Evaluasi */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                            {t.monev.verdictLabel} <span className="text-rose-600">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setData('status_laporan', 'Approved')}
                                                className={`flex flex-col items-center justify-center rounded-lg border p-3.5 text-center transition-all ${
                                                    data.status_laporan === 'Approved'
                                                        ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900 ring-2 ring-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                        : 'border-border bg-card text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900'
                                                }`}
                                            >
                                                <Unlock className="mb-1 h-5 w-5 text-emerald-700" />
                                                <span className="text-xs font-bold tracking-wider uppercase">{t.monev.statusApproved}</span>
                                                <span className="mt-0.5 text-[10px] text-muted-foreground">{t.monev.unlockTranche2}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setData('status_laporan', 'Revision')}
                                                className={`flex flex-col items-center justify-center rounded-lg border p-3.5 text-center transition-all ${
                                                    data.status_laporan === 'Revision'
                                                        ? 'border-amber-600 bg-amber-50 font-bold text-amber-900 ring-2 ring-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                                                        : 'border-border bg-card text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900'
                                                }`}
                                            >
                                                <ShieldAlert className="mb-1 h-5 w-5 text-amber-700" />
                                                <span className="text-xs font-bold tracking-wider uppercase">{t.monev.statusRevision}</span>
                                                <span className="mt-0.5 text-[10px] text-muted-foreground">{t.monev.documentRevision}</span>
                                            </button>
                                        </div>
                                        {errors.status_laporan && <p className="text-xs font-medium text-rose-600">{errors.status_laporan}</p>}
                                    </div>

                                    {/* Monev Gatekeeper Lock Notice */}
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                        {data.status_laporan === 'Approved' ? (
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                                <div>
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">[GATEKEEPER UNLOCKED]</p>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t.monev.confirmApproveMessage}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                                <div>
                                                    <p className="font-semibold text-amber-800 dark:text-amber-300">[GATEKEEPER LOCKED]</p>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t.monev.confirmRevisionMessage}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Catatan Substantif Reviewer */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="catatan_reviewer_monev"
                                                className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200"
                                            >
                                                {t.monev.reviewerNotesLabel} <span className="text-rose-600">*</span>
                                            </Label>
                                            <span
                                                className={`font-mono text-xs ${data.catatan_reviewer_monev.length >= 10 ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}
                                            >
                                                {data.catatan_reviewer_monev.length} / 10 min {data.catatan_reviewer_monev.length >= 10 && `[VALID]`}
                                            </span>
                                        </div>
                                        <Textarea
                                            id="catatan_reviewer_monev"
                                            rows={5}
                                            placeholder={t.monev.reviewerNotesPlaceholder}
                                            value={data.catatan_reviewer_monev}
                                            onChange={(e) => setData('catatan_reviewer_monev', e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">{t.monev.reviewerNotesMinReminder}</p>
                                        {errors.catatan_reviewer_monev && (
                                            <p className="text-xs font-medium text-rose-600">{errors.catatan_reviewer_monev}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
                                        <Button
                                            type="submit"
                                            disabled={!canSubmit}
                                            className="w-full bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {processing
                                                ? t.monev.btnSubmittingEval
                                                : data.status_laporan === 'Approved'
                                                  ? t.monev.btnApprove
                                                  : t.monev.btnRevision}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
