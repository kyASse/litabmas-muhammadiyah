import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    CheckCircle2,
    Clock,
    Download,
    FileCheck,
    FileText,
    HelpCircle,
    Info,
    Layers,
    Lock,
    Printer,
    Send,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PDFUploader } from '@/components/ui/PDFUploader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface UserDetail {
    id: number;
    name: string;
    nidn?: string | null;
    email?: string;
    faculty?: string | null;
    study_program?: string | null;
}

export interface UniversityDetail {
    id: number;
    name: string;
    code: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    website?: string | null;
}

export interface ResearchSchemaDetail {
    id: number;
    nama_skema: string;
}

export interface ContractDetail {
    id: number;
    nomor_kontrak: string;
    status_kontrak: string;
    nilai_kontrak?: number;
}

export interface OutputChildDetail {
    id: number;
    nama_jurnal?: string;
    judul_artikel?: string;
    doi_url?: string | null;
    judul_buku?: string;
    isbn?: string | null;
    judul_ciptaan?: string;
    nomor_pendaftaran?: string | null;
    nomor_sertifikat?: string | null;
    nama_produk?: string;
}

export interface ResearchOutputItem {
    id: number;
    id_proposal: number;
    tipe_luaran: 'Journal' | 'Book' | 'Hki' | 'Product' | string;
    target_status: 'Wajib' | 'Tambahan' | string;
    status_verifikasi: 'Draft' | 'Submitted' | 'Verified' | 'Rejected' | string;
    catatan_verifikasi?: string | null;
    created_at?: string;
    journal_output?: OutputChildDetail | null;
    journalOutput?: OutputChildDetail | null;
    book_output?: OutputChildDetail | null;
    bookOutput?: OutputChildDetail | null;
    hki_output?: OutputChildDetail | null;
    hkiOutput?: OutputChildDetail | null;
    product_output?: OutputChildDetail | null;
    productOutput?: OutputChildDetail | null;
}

export interface EvaluationDetail {
    id?: number;
    id_proposal: number;
    id_evaluator?: number | null;
    file_laporan_akhir: string;
    ringkasan_hasil: string;
    persentase_capaian_luaran: number;
    skor_akhir_substansi?: number | string | null;
    rekomendasi_kelulusan?: 'Lulus_Memuaskan' | 'Lulus_Cukup' | 'Tidak_Lulus' | string | null;
    nomor_skts?: string | null;
    file_skts_path?: string | null;
    status_penelitian?: 'Dalam_Evaluasi' | 'Selesai' | 'Gagal' | string;
    created_at?: string;
    updated_at?: string;
    evaluator?: {
        id: number;
        name: string;
        email?: string;
    } | null;
}

export interface ProposalDetail {
    id: number;
    judul_penelitian?: string;
    judul?: string;
    status_proposal: string;
    university_id?: number;
    tahun_anggaran?: number | string;
    user?: UserDetail | null;
    university?: UniversityDetail | null;
    researchSchema?: ResearchSchemaDetail | null;
    contract?: ContractDetail | null;
    evaluation?: EvaluationDetail | null;
    researchOutputs?: ResearchOutputItem[];
}

interface PageProps {
    proposal: ProposalDetail | null;
    evaluation: EvaluationDetail | null;
    outputs: ResearchOutputItem[];
}

export default function Show({ proposal, evaluation: propEvaluation, outputs = [] }: PageProps) {
    const { t, format, locale } = useTranslation();
    const { auth, flash } = usePage<SharedData>().props;
    const currentUser = auth?.user;

    // Effective evaluation from prop or proposal relation
    const evaluation = propEvaluation || proposal?.evaluation;

    // Authorization check for admin actions
    const isAdmin =
        currentUser?.role?.name === 'Admin Kampus' ||
        currentUser?.role?.name === 'Super Admin' ||
        currentUser?.roles?.some((r) => ['Admin Kampus', 'Super Admin'].includes(r.name));

    // Archive / Lock state
    const isArchived = evaluation?.status_penelitian === 'Selesai';
    const isTerminated = evaluation?.status_penelitian === 'Gagal';
    const isLocked = isArchived || isTerminated;

    // Precondition check on mandatory deliverables
    const wajibOutputs = outputs.filter((o) => o.target_status === 'Wajib');
    const totalWajib = wajibOutputs.length;
    const verifiedWajib = wajibOutputs.filter((o) => o.status_verifikasi === 'Verified').length;
    const canSubmitReport = totalWajib > 0 && verifiedWajib === totalWajib && !isLocked;

    // Final Report Upload Form
    const { data, setData, post, processing, errors, reset } = useForm<{
        file_laporan_akhir: File | null;
        ringkasan_hasil: string;
    }>({
        file_laporan_akhir: null,
        ringkasan_hasil: evaluation?.ringkasan_hasil || '',
    });

    const handleSubmitReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposal || !canSubmitReport || isLocked) return;

        post(route('evaluations.store', proposal.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset('file_laporan_akhir');
            },
        });
    };

    // Admin Evaluation Modal State
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const evalForm = useForm<{
        skor_akhir_substansi: string;
        rekomendasi_kelulusan: string;
    }>({
        skor_akhir_substansi: evaluation?.skor_akhir_substansi ? String(evaluation.skor_akhir_substansi) : '',
        rekomendasi_kelulusan: evaluation?.rekomendasi_kelulusan || 'Lulus_Memuaskan',
    });

    const handleSaveAdminEvaluation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposal) return;

        evalForm.post(route('admin.proposals.evaluate', proposal.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEvalModalOpen(false);
            },
        });
    };

    // Admin Issue SKTS Confirm Dialog State
    const [isSktsConfirmOpen, setIsSktsConfirmOpen] = useState(false);
    const sktsForm = useForm({});

    const handleConfirmGenerateSkts = () => {
        if (!proposal) return;
        sktsForm.post(route('admin.proposals.skts', proposal.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSktsConfirmOpen(false);
            },
        });
    };

    // Admin Terminate Modal State
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
    const termForm = useForm<{
        alasan_terminasi: string;
        file_berita_acara: File | null;
    }>({
        alasan_terminasi: '',
        file_berita_acara: null,
    });

    const handleConfirmTerminate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposal) return;

        termForm.post(route('admin.proposals.terminate', proposal.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsTerminateModalOpen(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: t.evaluation.title, href: '#' },
    ];

    if (!proposal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t.evaluation.title} />
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                        <Info className="h-12 w-12 text-muted-foreground" />
                        <p className="text-base text-muted-foreground">{t.evaluation.noOutputs}</p>
                        <Link href="/dashboard" className="text-sm font-semibold text-primary underline">
                            {t.evaluation.backToDashboard}
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const proposalTitle = proposal.judul_penelitian || proposal.judul || '-';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.evaluation.title} - ${proposalTitle}`} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Sticky Top Archive / Termination Banner ── */}
            {isArchived && (
                <div className="sticky top-0 z-30 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-300 bg-slate-100 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-mono text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">
                                {t.evaluation.archiveBannerTitle}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                {t.evaluation.archiveBannerDesc}
                            </div>
                        </div>
                    </div>
                    {evaluation?.nomor_skts && (
                        <Link
                            href={route('evaluations.certificate', proposal.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <FileText className="h-4 w-4" />
                            {t.evaluation.viewCertificate}
                        </Link>
                    )}
                </div>
            )}

            {isTerminated && (
                <div className="sticky top-0 z-30 mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950/40">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-mono text-sm font-bold tracking-wide text-red-900 dark:text-red-200">
                            {t.evaluation.terminatedBannerTitle}
                        </div>
                        <div className="text-xs text-red-700 dark:text-red-300">
                            {t.evaluation.terminatedBannerDesc}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Flash Feedback Messages ── */}
            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium">{flash.success}</span>
                </div>
            )}

            {flash?.error && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">{flash.error}</span>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="mb-6">
                <PageHeader
                    title={t.evaluation.title}
                    subtitle={t.evaluation.subtitle}
                    badge={
                        <div className="flex items-center gap-2">
                            <StatusBadge status={proposal.status_proposal} size="sm" />
                            {evaluation?.status_penelitian && (
                                <StatusBadge status={evaluation.status_penelitian} size="sm" />
                            )}
                        </div>
                    }
                    actions={
                        evaluation?.nomor_skts ? (
                            <Link
                                href={route('evaluations.certificate', proposal.id)}
                                className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-primary-hover"
                            >
                                <Award className="h-4 w-4" />
                                {t.evaluation.viewCertificate}
                            </Link>
                        ) : undefined
                    }
                />
            </div>

            {/* ── Proposal & Contract Metadata Summary ── */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            {t.evaluation.leadResearcher}
                        </div>
                        <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                            {proposal.user?.name || '-'}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                            NIDN: {proposal.user?.nidn || '-'}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            {t.evaluation.grantSchema}
                        </div>
                        <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                            {proposal.researchSchema?.nama_skema || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                            {proposal.university?.name || '-'}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            {t.evaluation.contractNumber}
                        </div>
                        <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {proposal.contract?.nomor_kontrak || '-'}
                        </div>
                        <div className="mt-0.5">
                            <span className="inline-flex rounded-sm bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {proposal.contract?.status_kontrak || 'Open'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            {t.evaluation.fiscalYear}
                        </div>
                        <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                            {proposal.tahun_anggaran || new Date().getFullYear()}
                        </div>
                    </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        {t.skts.researchTitle}
                    </div>
                    <div className="mt-1 font-serif text-lg font-medium text-slate-900 dark:text-slate-100">
                        {proposalTitle}
                    </div>
                </div>
            </div>

            {/* ── Key Metrics Cards ── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title={t.evaluation.metricOutputsVerified}
                    value={`${verifiedWajib} / ${totalWajib}`}
                    icon={<FileCheck className="h-5 w-5" />}
                    caption={`${totalWajib > 0 ? Math.round((verifiedWajib / totalWajib) * 100) : 100}% ${t.evaluation.targetMandatory}`}
                />

                <MetricCard
                    title={t.evaluation.metricProgress}
                    value={isArchived ? '100%' : `${evaluation?.persentase_capaian_luaran ?? 0}%`}
                    icon={<Layers className="h-5 w-5" />}
                    caption={isArchived ? t.evaluation.metricCompleted : t.evaluation.metricPending}
                />

                <MetricCard
                    title={t.evaluation.metricScore}
                    value={
                        evaluation?.skor_akhir_substansi
                            ? Number(evaluation.skor_akhir_substansi)
                            : '-'
                    }
                    type="score"
                    icon={<Award className="h-5 w-5" />}
                    caption={
                        evaluation?.rekomendasi_kelulusan === 'Lulus_Memuaskan'
                            ? t.evaluation.recMemuaskan
                            : evaluation?.rekomendasi_kelulusan === 'Lulus_Cukup'
                              ? t.evaluation.recCukup
                              : evaluation?.rekomendasi_kelulusan === 'Tidak_Lulus'
                                ? t.evaluation.recTidakLulus
                                : t.evaluation.notEvaluatedYet
                    }
                />

                <MetricCard
                    title={t.evaluation.metricSkts}
                    value={
                        evaluation?.nomor_skts
                            ? evaluation.nomor_skts
                            : isArchived
                              ? t.evaluation.metricCompleted
                              : t.evaluation.metricPending
                    }
                    icon={<ShieldCheck className="h-5 w-5" />}
                    caption={evaluation?.nomor_skts ? t.evaluation.sktsIssuedDesc : t.evaluation.sktsNotIssuedDesc}
                />
            </div>

            {/* ── Precondition Matrix: Mandatory Output Verification ── */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                            {t.evaluation.deliverablesTitle}
                        </h2>
                        <p className="text-xs text-slate-500">{t.evaluation.deliverablesSubtitle}</p>
                    </div>
                </div>

                {/* Precondition banner status */}
                <div
                    className={`mb-5 flex items-center gap-3 rounded-lg border p-4 ${
                        canSubmitReport || isArchived
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                    }`}
                >
                    {canSubmitReport || isArchived ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                    <div className="text-xs font-medium">
                        {canSubmitReport || isArchived
                            ? t.evaluation.preconditionMet
                            : t.evaluation.preconditionNotMet}
                    </div>
                </div>

                {/* Table of Outputs */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">{t.evaluation.deliverableType}</th>
                                <th className="px-4 py-3 font-semibold">{t.evaluation.deliverableTitle}</th>
                                <th className="px-4 py-3 font-semibold">{t.evaluation.deliverableTarget}</th>
                                <th className="px-4 py-3 font-semibold">{t.evaluation.deliverableIdentifier}</th>
                                <th className="px-4 py-3 font-semibold">{t.evaluation.deliverableStatus}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {outputs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                                        {t.evaluation.noOutputs}
                                    </td>
                                </tr>
                            ) : (
                                outputs.map((out) => {
                                    const child =
                                        out.journal_output ||
                                        out.journalOutput ||
                                        out.book_output ||
                                        out.bookOutput ||
                                        out.hki_output ||
                                        out.hkiOutput ||
                                        out.product_output ||
                                        out.productOutput;

                                    const title =
                                        child?.judul_artikel ||
                                        child?.judul_buku ||
                                        child?.judul_ciptaan ||
                                        child?.nama_produk ||
                                        '-';

                                    const identifier =
                                        child?.doi_url ||
                                        child?.isbn ||
                                        child?.nomor_sertifikat ||
                                        child?.nomor_pendaftaran ||
                                        '-';

                                    const isMandatory = out.target_status === 'Wajib';

                                    return (
                                        <tr
                                            key={out.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {out.tipe_luaran}
                                            </td>
                                            <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                                                {title}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isMandatory ? (
                                                    <span className="inline-flex rounded-sm bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                                        {t.evaluation.targetMandatory}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {t.evaluation.targetAdditional}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                                {identifier}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={out.status_verifikasi} size="sm" />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Final Report Submission Form & Current File Card ── */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: Submitted Report Viewer */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                        {t.evaluation.submittedReportTitle}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {evaluation?.file_laporan_akhir
                            ? `${t.evaluation.submittedAt} ${evaluation.updated_at ? new Date(evaluation.updated_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US') : '-'}`
                            : t.evaluation.finalReportSubtitle}
                    </p>

                    <div className="mt-6 flex flex-col gap-4">
                        {evaluation?.file_laporan_akhir ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                {evaluation.file_laporan_akhir.split('/').pop()}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {t.evaluation.finalReportFileLabel}
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={`/storage/${evaluation.file_laporan_akhir}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {t.evaluation.submittedReportDownload}
                                    </a>
                                </div>

                                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {t.evaluation.summaryLabel}
                                    </div>
                                    <p className="mt-1 font-serif text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                                        {evaluation.ringkasan_hasil || '-'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-slate-400 dark:border-slate-800">
                                <FileText className="h-10 w-10 stroke-1" />
                                <p className="mt-2 text-xs">{t.evaluation.notEvaluatedYet}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Upload / Update Final Report Form */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                        {t.evaluation.finalReportTitle}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">{t.evaluation.finalReportSubtitle}</p>

                    {isLocked ? (
                        <div className="mt-6 flex h-48 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
                            <Lock className="h-8 w-8 text-slate-400" />
                            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.evaluation.archiveBannerTitle}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{t.evaluation.readOnlyNotice}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitReport} className="mt-6 space-y-4">
                            <div>
                                <PDFUploader
                                    value={data.file_laporan_akhir}
                                    onChange={(file) => setData('file_laporan_akhir', file)}
                                    label={t.evaluation.finalReportFileLabel}
                                    helperText={t.evaluation.finalReportFileHelp}
                                    disabled={processing || !canSubmitReport}
                                    required={!evaluation?.file_laporan_akhir}
                                />
                                {errors.file_laporan_akhir && (
                                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                                        {errors.file_laporan_akhir}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="ringkasan_hasil" className="text-xs font-semibold">
                                    {t.evaluation.summaryLabel} <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="ringkasan_hasil"
                                    rows={4}
                                    value={data.ringkasan_hasil}
                                    onChange={(e) => setData('ringkasan_hasil', e.target.value)}
                                    placeholder={t.evaluation.summaryPlaceholder}
                                    disabled={processing || !canSubmitReport}
                                    className="mt-1 font-serif text-xs"
                                    required
                                />
                                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{t.evaluation.summaryHelp}</span>
                                    <span className="font-mono">
                                        {data.ringkasan_hasil.length} / 50 min
                                    </span>
                                </div>
                                {errors.ringkasan_hasil && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.ringkasan_hasil}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !canSubmitReport ||
                                        data.ringkasan_hasil.trim().length < 50 ||
                                        (!data.file_laporan_akhir && !evaluation?.file_laporan_akhir)
                                    }
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    {processing ? t.evaluation.submitting : t.evaluation.submitFinalReport}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Official SKTS Section ── */}
            {evaluation?.nomor_skts && (
                <div className="mb-8 rounded-xl border-2 border-brand-primary/20 bg-brand-primary-light/40 p-6 dark:border-brand-primary/40 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md">
                                <Award className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-brand-primary dark:text-blue-400">
                                    {t.skts.certificateTitle}
                                </div>
                                <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                                    {evaluation.nomor_skts}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    {t.evaluation.sktsIssuedDesc}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={route('evaluations.certificate', proposal.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-primary-hover"
                            >
                                <FileText className="h-4 w-4" />
                                {t.evaluation.viewCertificate}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Admin Action Panel (Admin Kampus / Super Admin) ── */}
            {isAdmin && (
                <div className="mb-8 rounded-xl border border-slate-300 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                                {t.evaluation.adminPanelTitle}
                            </h2>
                            <p className="text-xs text-slate-500">{t.evaluation.adminPanelSubtitle}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                            {/* Score Evaluation */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEvalModalOpen(true)}
                                disabled={isLocked}
                                className="flex items-center gap-1.5"
                            >
                                <Award className="h-4 w-4" />
                                {t.evaluation.btnEvaluate}
                            </Button>

                            {/* Issue SKTS */}
                            <Button
                                size="sm"
                                onClick={() => setIsSktsConfirmOpen(true)}
                                disabled={isLocked || !evaluation?.skor_akhir_substansi}
                                className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {t.evaluation.btnGenerateSkts}
                            </Button>

                            {/* Terminate Force Majeure */}
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsTerminateModalOpen(true)}
                                disabled={isLocked}
                                className="flex items-center gap-1.5"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                {t.evaluation.btnTerminate}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Admin Substantive Scoring ── */}
            <Dialog open={isEvalModalOpen} onOpenChange={setIsEvalModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t.evaluation.evaluateModalTitle}</DialogTitle>
                        <DialogDescription>{t.evaluation.evaluateModalDesc}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveAdminEvaluation} className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="skor_akhir_substansi" className="text-xs font-semibold">
                                {t.evaluation.inputScore} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="skor_akhir_substansi"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={evalForm.data.skor_akhir_substansi}
                                onChange={(e) => evalForm.setData('skor_akhir_substansi', e.target.value)}
                                placeholder={t.evaluation.inputScorePlaceholder}
                                className="mt-1 font-mono text-sm"
                                required
                            />
                            {evalForm.errors.skor_akhir_substansi && (
                                <p className="mt-1 text-xs text-red-600">
                                    {evalForm.errors.skor_akhir_substansi}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="rekomendasi_kelulusan" className="text-xs font-semibold">
                                {t.evaluation.selectRecommendation} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={evalForm.data.rekomendasi_kelulusan}
                                onValueChange={(val) => evalForm.setData('rekomendasi_kelulusan', val)}
                            >
                                <SelectTrigger className="mt-1 text-xs">
                                    <SelectValue placeholder={t.evaluation.selectRecommendationPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lulus_Memuaskan">
                                        {t.evaluation.recMemuaskan}
                                    </SelectItem>
                                    <SelectItem value="Lulus_Cukup">
                                        {t.evaluation.recCukup}
                                    </SelectItem>
                                    <SelectItem value="Tidak_Lulus">
                                        {t.evaluation.recTidakLulus}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {evalForm.errors.rekomendasi_kelulusan && (
                                <p className="mt-1 text-xs text-red-600">
                                    {evalForm.errors.rekomendasi_kelulusan}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEvalModalOpen(false)}
                            >
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={evalForm.processing}>
                                {evalForm.processing ? t.evaluation.savingEvaluation : t.evaluation.saveEvaluation}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Confirm Generate SKTS ── */}
            <AlertDialog open={isSktsConfirmOpen} onOpenChange={setIsSktsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.evaluation.generateSktsConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.evaluation.generateSktsConfirmDesc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmGenerateSkts}
                            disabled={sktsForm.processing}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {sktsForm.processing ? t.evaluation.generatingSkts : t.evaluation.confirmGenerateSkts}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Modal: Force Majeure Termination ── */}
            <Dialog open={isTerminateModalOpen} onOpenChange={setIsTerminateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700 dark:text-red-400">
                            {t.evaluation.terminateModalTitle}
                        </DialogTitle>
                        <DialogDescription>{t.evaluation.terminateModalDesc}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleConfirmTerminate} className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="alasan_terminasi" className="text-xs font-semibold">
                                {t.evaluation.terminateReason} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="alasan_terminasi"
                                rows={3}
                                value={termForm.data.alasan_terminasi}
                                onChange={(e) => termForm.setData('alasan_terminasi', e.target.value)}
                                placeholder={t.evaluation.terminateReasonPlaceholder}
                                className="mt-1 text-xs"
                                required
                            />
                            <div className="mt-1 text-[11px] text-slate-500">
                                {termForm.data.alasan_terminasi.length} / 20 min
                            </div>
                            {termForm.errors.alasan_terminasi && (
                                <p className="mt-1 text-xs text-red-600">
                                    {termForm.errors.alasan_terminasi}
                                </p>
                            )}
                        </div>

                        <div>
                            <PDFUploader
                                value={termForm.data.file_berita_acara}
                                onChange={(file) => termForm.setData('file_berita_acara', file)}
                                label={t.evaluation.terminateFileLabel}
                                helperText={t.components.pdfUploader.helperText}
                            />
                            {termForm.errors.file_berita_acara && (
                                <p className="mt-1 text-xs text-red-600">
                                    {termForm.errors.file_berita_acara}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsTerminateModalOpen(false)}
                            >
                                {t.common.cancel}
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={termForm.processing || termForm.data.alasan_terminasi.trim().length < 20}
                            >
                                {termForm.processing ? t.evaluation.terminating : t.evaluation.terminateConfirm}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            </div>
        </AppLayout>
    );
}
