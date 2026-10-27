/**
 * @route /reviewer/evaluations/{report}
 * @description Halaman detail laporan kemajuan dosen beserta berkas pendukung
 * @features Linimasa progres, riwayat laporan, tombol isi catatan evaluasi
 */

import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Proposal {
    id: number;
    judul: string;
    user: User;
}

interface ProgressReportItem {
    id: number;
    report_date: string;
    progress_percentage: number;
    report_type: string;
}

interface Report {
    id: number;
    proposal_id: number;
    contract_id: number;
    title: string;
    content: string;
    report_type: string;
    report_date: string;
    progress_percentage: number;
    report_period: string;
    attachment_path: string | null;
    status: string;
    submitted_at: string;
    proposal: Proposal;
}

interface Props {
    report: Report;
    allReports: ProgressReportItem[];
}

function ProgressTimeline({ steps, timelineTitle }: { steps: ProgressReportItem[]; timelineTitle: string }) {
    const milestones = [0, 25, 50, 75, 100];
    const currentMax = steps.length > 0 ? Math.max(...steps.map((s) => s.progress_percentage)) : 0;

    return (
        <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{timelineTitle}</h3>
            <div className="flex items-center justify-between">
                {milestones.map((milestone, i) => (
                    <div key={milestone} className="flex flex-1 flex-col items-center">
                        <div
                            className={`h-4 w-4 rounded-full border-2 ${
                                currentMax >= milestone ? 'border-primary bg-primary' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                            }`}
                        />
                        <span className="mt-1 text-xs text-muted-foreground">{milestone}%</span>
                        {i < milestones.length - 1 && (
                            <div className={`mt-2 h-0.5 w-full ${currentMax >= milestones[i + 1] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EvaluationShow({ report, allReports }: Props) {
    const { t, locale } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.reviewerEvaluation.pageTitle, href: route('reviewer.evaluations.index') },
        { title: t.reviewerEvaluation.detailPageTitle, href: '#' },
    ];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.reviewerEvaluation.detailPageTitle} />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">{t.reviewerEvaluation.detailPageTitle}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{report.proposal?.judul ?? '-'}</p>
                    </div>
                    <StatusBadge status={report.status} />
                </div>

                {/* Split Screen */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Kiri: Isi Laporan */}
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
                        <h2 className="text-lg font-bold text-foreground">{t.reviewerEvaluation.reportContentTitle}</h2>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-semibold text-foreground">{t.reviewerEvaluation.lecturerLabel}</span>
                                <span className="ml-2 text-muted-foreground">{report.proposal?.user?.name ?? '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">{t.reviewerEvaluation.reportTypeLabel}</span>
                                <span className="ml-2 text-muted-foreground">{report.report_type}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">{t.reviewerEvaluation.reportDateLabel}</span>
                                <span className="ml-2 text-muted-foreground">{formatDate(report.report_date)}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">{t.reviewerEvaluation.periodLabel}</span>
                                <span className="ml-2 text-muted-foreground">{report.report_period ?? '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">{t.reviewerEvaluation.progressLabel}</span>
                                <span className="ml-2 font-bold text-primary">{report.progress_percentage}%</span>
                            </div>
                        </div>

                        {/* Deskripsi Kegiatan */}
                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-foreground">{t.reviewerEvaluation.activityDescriptionTitle}</h3>
                            <div
                                className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-4 text-muted-foreground dark:bg-slate-900/60"
                                dangerouslySetInnerHTML={{ __html: report.content ?? '-' }}
                            />
                        </div>

                        {/* Lampiran */}
                        {report.attachment_path && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-foreground">{t.reviewerEvaluation.attachmentFileTitle}</h3>

                                <a
                                    href={`/storage/${report.attachment_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                                >
                                    {t.reviewerEvaluation.downloadAttachmentBtn}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Kanan: Timeline + Aksi */}
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
                        <h2 className="text-lg font-bold text-foreground">{t.reviewerEvaluation.progressHistoryTitle}</h2>
                        <ProgressTimeline steps={allReports} timelineTitle={t.reviewerEvaluation.timelineTitle} />

                        {/* Riwayat laporan */}
                        <div className="mt-4 space-y-2">
                            {allReports.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/60">
                                    <span className="text-muted-foreground">{formatDate(r.report_date)}</span>
                                    <span className="font-semibold text-foreground">{r.report_type}</span>
                                    <span className="font-bold text-primary">{r.progress_percentage}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                            <button
                                onClick={() => router.get(route('reviewer.evaluations.note', report.id))}
                                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                {t.reviewerEvaluation.fillEvaluationNotesBtn}
                            </button>
                            <button
                                onClick={() => router.get(route('reviewer.evaluations.index'))}
                                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                {t.reviewerEvaluation.backToListBtn}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
