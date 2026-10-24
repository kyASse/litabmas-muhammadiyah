/**
 * Reviewer Workspace Component
 *
 * @description
 * Antarmuka Workspace Reviewer berbasis SplitScreenViewer:
 * - 60% Left pane: PDF viewer dokumen proposal penelitian (dengan fallback).
 * - 40% Right pane: Sub-navigasi tab:
 *   - Tab 1: Hasil Verifikasi Administrasi (checklist Ya/Tidak Fase 1 Bappeda, read-only).
 *   - Tab 2: Lembar Evaluasi Substansi (pilihan ganda diskret 1-5 tanpa slider, komentar wajib per butir kriteria,
 *     kalkulasi skor terbobot real-time Zero CLS, rekomendasi, catatan kualitatif, dan CoI guard).
 *
 * @filepath /resources/js/pages/Reviewer/Workspace.tsx
 */

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { SplitScreenViewer } from '@/components/ui/SplitScreenViewer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Coins,
    FileCheck,
    FileText,
    Info,
    Save,
    Scale,
    Send,
    User,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface EvaluationItem {
    kriteria: string;
    bobot: number;
    skor: number;
    deskripsi?: string;
    komentar?: string;
    komentar_indikator?: string;
    catatan_kriteria?: string;
}

interface AssessmentCriterion {
    id: number;
    nama_kriteria: string;
    bobot: number;
    deskripsi?: string | null;
    urutan?: number;
    tahap_seleksi?: string;
    tipe_jawaban?: string;
}

interface ProposalData {
    id: number;
    title?: string;
    judul_penelitian?: string;
    abstract?: string;
    abstrak?: string;
    status_proposal?: string;
    catatan_administrasi?: string | null;
    proposal_doc_url?: string | null;
    proposal_doc_path?: string | null;
    file_dokumen_proposal?: string | null;
    pengusul?: {
        id: number;
        name: string;
    } | null;
    skema_pendanaan?: {
        id: number;
        nama_skema?: string;
        pagu_maksimal?: number;
    } | null;
    skemaPendanaan?: {
        id: number;
        nama_skema?: string;
        pagu_maksimal?: number;
    } | null;
}

interface ReviewData {
    id: number;
    id_proposal: number;
    skor_total?: number | string | null;
    catatan_evaluasi?: string | null;
    keputusan_rekomendasi?: 'Diterima' | 'Revisi' | 'Ditolak' | null;
    status_review?: string;
    komponen_penilaian?: EvaluationItem[] | null;
}

interface WorkspaceProps {
    review: ReviewData;
    proposal: ProposalData;
    substantiveCriteria?: AssessmentCriterion[];
    administrativeCriteria?: AssessmentCriterion[];
}

const DEFAULT_SUBSTANTIVE_CRITERIA: Array<{ kriteria: string; bobot: number; deskripsi: string }> = [
    {
        kriteria: 'Rekam Jejak dan Kompetensi Tim Peneliti',
        bobot: 20,
        deskripsi: 'Kesesuaian keahlian pengusul, riwayat publikasi terdahulu, dan kompetensi tim riset.',
    },
    {
        kriteria: 'Urgensi, Kebaruan, dan Tinjauan Pustaka',
        bobot: 30,
        deskripsi: 'Kebaruan ide (novelty), ketajaman rumusan masalah, dan kemutakhiran tinjauan pustaka.',
    },
    {
        kriteria: 'Kejelasan Metodologi dan Kelayakan Pelaksanaan',
        bobot: 25,
        deskripsi: 'Kesesuaian rancangan metode, ketepatan jadwal tahapan, dan kewajaran alokasi anggaran.',
    },
    {
        kriteria: 'Potensi Dampak dan Kelayakan Target Luaran',
        bobot: 25,
        deskripsi: 'Kelayakan pencapaian luaran wajib/tambahan (jurnal terindeks/HKI/buku) dan manfaat hasil riset.',
    },
];

export default function ReviewerWorkspace({ review, proposal, substantiveCriteria, administrativeCriteria }: WorkspaceProps) {
    const { t, format } = useTranslation();

    // Sub-navigation tab state: 'admin' vs 'substansi'
    const [activeTab, setActiveTab] = useState<'admin' | 'substansi'>('substansi');

    // Build initial criteria items from prop, saved review, or default fallback
    const initialCriteriaList = useMemo<EvaluationItem[]>(() => {
        if (review?.komponen_penilaian && Array.isArray(review.komponen_penilaian) && review.komponen_penilaian.length > 0) {
            return review.komponen_penilaian.map((item) => ({
                kriteria: item.kriteria,
                bobot: Number(item.bobot) || 0,
                skor: item.skor > 5 ? Math.round((item.skor / 100) * 5) : Number(item.skor) || 0,
                deskripsi: item.deskripsi || '',
                komentar: item.komentar || item.komentar_indikator || item.catatan_kriteria || '',
            }));
        }

        if (substantiveCriteria && substantiveCriteria.length > 0) {
            return substantiveCriteria.map((c) => ({
                kriteria: c.nama_kriteria,
                bobot: Number(c.bobot) || 0,
                skor: 0,
                deskripsi: c.deskripsi || '',
                komentar: '',
            }));
        }

        return DEFAULT_SUBSTANTIVE_CRITERIA.map((c) => ({
            kriteria: c.kriteria,
            bobot: c.bobot,
            skor: 0,
            deskripsi: c.deskripsi,
            komentar: '',
        }));
    }, [review, substantiveCriteria]);

    // Active criteria scoring state
    const [criteriaItems, setCriteriaItems] = useState<EvaluationItem[]>(initialCriteriaList);
    const [notes, setNotes] = useState<string>(review?.catatan_evaluasi || '');
    const [recommendation, setRecommendation] = useState<'Diterima' | 'Revisi' | 'Ditolak' | ''>(review?.keputusan_rekomendasi || '');
    const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(false);
    const [draftSavedAlert, setDraftSavedAlert] = useState<boolean>(false);

    // Live weighted aggregate score calculation: sum((pilihan / 5) * bobot)
    const aggregateScore = useMemo(() => {
        let totalWeight = 0;
        let weightedPoints = 0;

        criteriaItems.forEach((item) => {
            const bobot = Number(item.bobot) || 0;
            const skor = Number(item.skor) || 0;
            if (bobot > 0 && skor > 0) {
                weightedPoints += (skor / 5) * bobot;
                totalWeight += bobot;
            } else if (bobot > 0) {
                totalWeight += bobot;
            }
        });

        if (totalWeight <= 0) return 0;
        return Math.round((weightedPoints / totalWeight) * 100 * 100) / 100;
    }, [criteriaItems]);

    // Score descriptor classification
    const scoreDescriptor = useMemo(() => {
        if (aggregateScore >= 85) {
            return {
                text: t.reviewerWorkspace.descriptorExcellent,
                badgeClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            };
        }
        if (aggregateScore >= 70) {
            return {
                text: t.reviewerWorkspace.descriptorGood,
                badgeClasses: 'bg-teal-50 text-teal-800 border-teal-200',
            };
        }
        if (aggregateScore >= 50) {
            return {
                text: t.reviewerWorkspace.descriptorFair,
                badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200',
            };
        }
        return {
            text: t.reviewerWorkspace.descriptorPoor,
            badgeClasses: 'bg-rose-50 text-rose-800 border-rose-200',
        };
    }, [aggregateScore, t]);

    // Update single criterion score
    const handleScoreSelect = (index: number, scoreValue: number) => {
        setCriteriaItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], skor: scoreValue };
            return next;
        });
    };

    // Update single criterion comment
    const handleCommentChange = (index: number, commentValue: string) => {
        setCriteriaItems((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                komentar: commentValue,
                komentar_indikator: commentValue,
                catatan_kriteria: commentValue,
            };
            return next;
        });
    };

    // Check if every criterion has a valid discrete score (1-5) and a non-empty comment
    const allCriteriaScored = useMemo(() => {
        return criteriaItems.length > 0 && criteriaItems.every((it) => it.skor >= 1 && it.skor <= 5);
    }, [criteriaItems]);

    const allCriteriaCommented = useMemo(() => {
        return criteriaItems.length > 0 && criteriaItems.every((it) => (it.komentar || '').trim().length > 0);
    }, [criteriaItems]);

    const isNotesValid = notes.trim().length >= 50;
    const isFormComplete =
        coiAcknowledged && isNotesValid && recommendation !== '' && allCriteriaScored && allCriteriaCommented;

    // Inertia form submission
    const { post, processing, errors, transform } = useForm();

    // Save draft locally in localStorage
    const handleSaveDraft = () => {
        const draftData = {
            criteriaItems,
            notes,
            recommendation,
            savedAt: new Date().toISOString(),
        };
        try {
            localStorage.setItem(`review_draft_${review.id}`, JSON.stringify(draftData));
            setDraftSavedAlert(true);
            setTimeout(() => setDraftSavedAlert(false), 4000);
        } catch {
            // Local storage access error fallback
        }
    };

    // Load saved draft if available and review is not completed
    useEffect(() => {
        if (review.status_review !== 'Completed') {
            try {
                const cached = localStorage.getItem(`review_draft_${review.id}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.criteriaItems && Array.isArray(parsed.criteriaItems)) {
                        setCriteriaItems(parsed.criteriaItems);
                    }
                    if (parsed.notes) setNotes(parsed.notes);
                    if (parsed.recommendation) setRecommendation(parsed.recommendation);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, [review.id, review.status_review]);

    // Final review submission handler
    const handleSubmitFinal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormComplete || processing) return;

        const payload = {
            komponen_penilaian: criteriaItems.map((item) => ({
                kriteria: item.kriteria,
                bobot: item.bobot,
                skor: item.skor,
                komentar: item.komentar,
                komentar_indikator: item.komentar,
                catatan_kriteria: item.komentar,
            })),
            catatan_evaluasi: notes,
            keputusan_rekomendasi: recommendation,
            skor_total: aggregateScore,
        };

        transform(() => payload);
        post(route('reviewer.assignments.submit-review', review.id), {
            onSuccess: () => {
                localStorage.removeItem(`review_draft_${review.id}`);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/reviewer/dashboard',
        },
        {
            title: t.navigation.reviews,
            href: '/reviewer/assignments',
        },
        {
            title: t.reviewerWorkspace.pageTitle,
            href: '#',
        },
    ];

    const proposalTitle = proposal?.title || proposal?.judul_penelitian || `Proposal #${review.id_proposal}`;
    const researcherName = proposal?.pengusul?.name || '-';
    const schemeName = proposal?.skemaPendanaan?.nama_skema || proposal?.skema_pendanaan?.nama_skema || '-';
    const budgetCap = proposal?.skemaPendanaan?.pagu_maksimal || proposal?.skema_pendanaan?.pagu_maksimal;

    // Determine PDF document URL with sample proposal fallback
    const pdfUrl = proposal?.proposal_doc_url || proposal?.proposal_doc_path || proposal?.file_dokumen_proposal || '/sample-proposal.pdf';

    // Header actions displayed inside the top utility bar of SplitScreenViewer
    const headerActions = (
        <div className="mr-2 flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 font-sans text-xs text-slate-700 hover:bg-slate-100 hover:text-blue-900" asChild>
                <Link href="/reviewer/assignments">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>{t.reviewerWorkspace.backToAssignments}</span>
                </Link>
            </Button>
            <StatusBadge status={review.status_review === 'Completed' ? 'Completed_SKTS' : 'In_Review'} size="sm" />
            <LanguageSwitcher size="sm" variant="compact" />
        </div>
    );

    // Right pane content: Sub-Navigation + Tab Contents
    const formContent = (
        <div className="space-y-6">
            {/* Sub-Navigation Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('admin')}
                        className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 font-sans text-xs font-semibold transition-all ${
                            activeTab === 'admin'
                                ? 'border-blue-900 text-blue-900'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        <FileCheck className="h-4 w-4" />
                        <span>{t.reviewerWorkspace.tabAdministration}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('substansi')}
                        className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 font-sans text-xs font-semibold transition-all ${
                            activeTab === 'substansi'
                                ? 'border-blue-900 text-blue-900'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        <Scale className="h-4 w-4" />
                        <span>{t.reviewerWorkspace.tabSubstantive}</span>
                    </button>
                </nav>
            </div>

            {/* TAB 1: HASIL VERIFIKASI ADMINISTRASI (READ-ONLY) */}
            {activeTab === 'admin' && (
                <div className="space-y-5">
                    {/* Notice Banner */}
                    <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3 font-sans text-xs text-slate-700">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-900" />
                        <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900">{t.reviewerWorkspace.adminVerificationTitle}</p>
                            <p className="text-slate-600">{t.reviewerWorkspace.adminReadOnlyNotice}</p>
                        </div>
                    </div>

                    {/* Status & Catatan Administrasi Bappeda */}
                    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="font-sans text-xs font-bold text-slate-800 uppercase">
                                {t.reviewerWorkspace.adminStatusLabel}
                            </span>
                            <StatusBadge status={proposal?.status_proposal || 'Lolos_Administrasi'} size="sm" />
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="font-sans text-[11px] font-semibold text-slate-600 uppercase">
                                {t.reviewerWorkspace.adminNotesLabel}
                            </label>
                            <div className="rounded border border-slate-200 bg-slate-50 p-3 font-sans text-xs text-slate-800 leading-relaxed">
                                {proposal?.catatan_administrasi || 'Seluruh berkas persyaratan telah diverifikasi lengkap dan memenuhi standar Bappeda.'}
                            </div>
                        </div>
                    </div>

                    {/* Administrative Checklist Table (Read-Only) */}
                    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                            <h4 className="font-sans text-xs font-bold text-slate-900 uppercase">
                                {t.reviewerWorkspace.adminChecklistTitle}
                            </h4>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {administrativeCriteria && administrativeCriteria.length > 0 ? (
                                administrativeCriteria.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                                        <div className="space-y-0.5 pr-2">
                                            <p className="font-sans font-medium text-slate-900">
                                                {idx + 1}. {item.nama_kriteria}
                                            </p>
                                            {item.deskripsi && (
                                                <p className="font-sans text-[11px] text-slate-500">{item.deskripsi}</p>
                                            )}
                                        </div>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>{t.reviewerWorkspace.adminChecklistVerified}</span>
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-2 py-2">
                                    <div className="flex items-center justify-between py-1 text-xs">
                                        <span className="font-sans font-medium text-slate-900">1. Surat Pengantar LPPM & Validasi Format Proposal</span>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>{t.reviewerWorkspace.adminChecklistVerified}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 text-xs">
                                        <span className="font-sans font-medium text-slate-900">2. Rincian Anggaran Biaya (RAB) sesuai Pagu Skema</span>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>{t.reviewerWorkspace.adminChecklistVerified}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 text-xs">
                                        <span className="font-sans font-medium text-slate-900">3. Surat Pernyataan Bebas Plagiarisme dan Kesanggupan Riset</span>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>{t.reviewerWorkspace.adminChecklistVerified}</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: LEMBAR EVALUASI SUBSTANSI (DISCRETE 1-5 + KOMENTAR WAJIB) */}
            {activeTab === 'substansi' && (
                <form onSubmit={handleSubmitFinal} className="space-y-6">
                    {/* Server-Side Validation Errors Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="space-y-1.5 rounded-md border-2 border-rose-500 bg-rose-50 p-3.5 text-rose-900 shadow-xs">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                                <h4 className="font-sans text-xs font-bold tracking-wider text-rose-800 uppercase">
                                    {t.reviewerWorkspace.validationErrorTitle}
                                </h4>
                            </div>
                            <ul className="list-inside list-disc space-y-1 pl-1 font-sans text-xs text-rose-700">
                                {Object.entries(errors).map(([field, message]) => (
                                    <li key={field}>{String(message)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Header / Instructions */}
                    <div className="border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-blue-900" />
                            <h3 className="font-sans text-sm font-bold tracking-wide text-slate-900 uppercase">
                                {t.reviewerWorkspace.discreteScaleTitle}
                            </h3>
                        </div>
                        <p className="mt-1 font-sans text-xs leading-relaxed text-slate-500">
                            {t.reviewerWorkspace.discreteScaleDesc}
                        </p>
                    </div>

                    {/* Proposal Quick Meta Card */}
                    <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3 font-sans text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-700 uppercase">
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>{t.reviewerWorkspace.proposalDetails}</span>
                        </div>
                        <p className="truncate font-serif text-xs font-medium text-slate-900">{proposalTitle}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                <strong className="text-slate-700">{t.reviewerWorkspace.researcher}:</strong> {researcherName}
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-slate-400" />
                                <strong className="text-slate-700">{t.reviewerWorkspace.scheme}:</strong> {schemeName}
                            </span>
                            {budgetCap && (
                                <span className="flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-slate-400" />
                                    <strong className="text-slate-700">{t.reviewerWorkspace.budgetCap}:</strong>
                                    <TabularFigure value={budgetCap} type="currency" size="sm" weight="semibold" />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* DYNAMIC SUBSTANTIVE RUBRIC CRITERIA (DISCRETE 1-5 & MANDATORY COMMENT) */}
                    <div className="space-y-5">
                        {criteriaItems.map((item, idx) => {
                            const weightedPoints = item.skor > 0 ? ((item.skor / 5) * item.bobot).toFixed(2) : '0.00';
                            const isItemCommentValid = (item.komentar || '').trim().length > 0;

                            return (
                                <div key={idx} className="space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-xs">
                                    {/* Criterion Header */}
                                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-sans text-xs font-bold text-slate-800">
                                                    {idx + 1}. {item.kriteria}
                                                </span>
                                                <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                                                    {item.bobot}%
                                                </span>
                                            </div>
                                            {item.deskripsi && (
                                                <p className="mt-1 font-sans text-[11px] leading-relaxed text-slate-500">
                                                    {item.deskripsi}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-mono text-xs font-bold text-blue-900">
                                                {weightedPoints} / {item.bobot}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Discrete 1-5 Choice Buttons (Bebas Slider) */}
                                    <div className="space-y-1.5">
                                        <label className="font-sans text-[11px] font-semibold text-slate-700 uppercase">
                                            Skala Nilai (1 - 5) <span className="text-rose-600">*</span>
                                        </label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[
                                                { val: 1, label: t.reviewerWorkspace.scoreScale1 },
                                                { val: 2, label: t.reviewerWorkspace.scoreScale2 },
                                                { val: 3, label: t.reviewerWorkspace.scoreScale3 },
                                                { val: 4, label: t.reviewerWorkspace.scoreScale4 },
                                                { val: 5, label: t.reviewerWorkspace.scoreScale5 },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    type="button"
                                                    onClick={() => handleScoreSelect(idx, opt.val)}
                                                    className={`flex flex-col items-center justify-center rounded border p-2 text-center transition-all ${
                                                        item.skor === opt.val
                                                            ? 'border-blue-900 bg-blue-900 text-white shadow-xs'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="font-mono text-sm font-bold">{opt.val}</span>
                                                    <span className="mt-0.5 text-[10px] leading-tight font-medium">
                                                        {opt.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mandatory Qualitative Commentary per Criteria */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <label className="font-sans text-[11px] font-semibold text-slate-700 uppercase">
                                                {t.reviewerWorkspace.criterionCommentLabel} <span className="text-rose-600">*</span>
                                            </label>
                                            {isItemCommentValid && (
                                                <span className="font-sans text-[10px] font-bold text-emerald-700">
                                                    {t.reviewerWorkspace.notesValid}
                                                </span>
                                            )}
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={item.komentar || ''}
                                            onChange={(e) => handleCommentChange(idx, e.target.value)}
                                            placeholder={t.reviewerWorkspace.criterionCommentPlaceholder}
                                            className={`w-full rounded-md border p-2 font-sans text-xs leading-relaxed transition-colors focus:ring-1 ${
                                                !isItemCommentValid
                                                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-amber-500'
                                                    : 'border-slate-300 bg-white focus:border-blue-900 focus:ring-blue-900'
                                            }`}
                                        />
                                        {!isItemCommentValid && (
                                            <p className="font-sans text-[10px] text-amber-700">
                                                {t.reviewerWorkspace.criterionCommentRequired}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Real-Time Aggregate Score Calculator (Zero CLS) */}
                    <div className="space-y-2 rounded-lg border border-slate-300 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-sans text-xs font-bold tracking-wide text-slate-900 uppercase">
                                        {t.reviewerWorkspace.totalScoreLabel}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">{t.reviewerWorkspace.totalScoreScale}</span>
                                </div>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center rounded border px-2 py-0.5 font-sans text-[11px] font-semibold ${scoreDescriptor.badgeClasses}`}
                                    >
                                        {scoreDescriptor.text}
                                    </span>
                                </div>
                            </div>
                            <TabularFigure
                                value={aggregateScore}
                                type="score"
                                size="2xl"
                                weight="bold"
                                className={aggregateScore >= 70 ? 'text-emerald-700' : 'text-rose-700'}
                            />
                        </div>
                    </div>

                    {/* Final Recommendation Selector (Pills) */}
                    <div className="space-y-2">
                        <label className="block font-sans text-xs font-bold tracking-wider text-slate-800 uppercase">
                            {t.reviewerWorkspace.recommendationLabel} <span className="text-rose-600">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setRecommendation('Diterima')}
                                className={`rounded border px-2.5 py-2 text-center font-sans text-xs font-semibold transition-all ${
                                    recommendation === 'Diterima'
                                        ? 'border-emerald-700 bg-emerald-600 text-white shadow-xs'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {t.reviewerWorkspace.recAccepted}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecommendation('Revisi')}
                                className={`rounded border px-2.5 py-2 text-center font-sans text-xs font-semibold transition-all ${
                                    recommendation === 'Revisi'
                                        ? 'border-amber-600 bg-amber-500 text-white shadow-xs'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {t.reviewerWorkspace.recRevision}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecommendation('Ditolak')}
                                className={`rounded border px-2.5 py-2 text-center font-sans text-xs font-semibold transition-all ${
                                    recommendation === 'Ditolak'
                                        ? 'border-rose-700 bg-rose-600 text-white shadow-xs'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {t.reviewerWorkspace.recRejected}
                            </button>
                        </div>
                    </div>

                    {/* Qualitative Notes Textarea with Character Counter */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="font-sans text-xs font-bold tracking-wider text-slate-800 uppercase">
                                {t.reviewerWorkspace.notesLabel} <span className="text-rose-600">*</span>
                            </label>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className={isNotesValid ? 'font-semibold text-emerald-700' : 'font-medium text-amber-700'}>
                                    {format(t.reviewerWorkspace.notesMinCount, { count: String(notes.trim().length) })}
                                </span>
                                {isNotesValid && (
                                    <span className="text-[10px] font-bold text-emerald-700">
                                        {t.reviewerWorkspace.notesValid}
                                    </span>
                                )}
                            </div>
                        </div>
                        <textarea
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t.reviewerWorkspace.notesPlaceholder}
                            className={`w-full rounded-md border p-2.5 font-sans text-xs leading-relaxed transition-colors focus:ring-1 ${
                                !isNotesValid && notes.length > 0
                                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-amber-500'
                                    : 'border-slate-300 bg-white focus:border-blue-900 focus:ring-blue-900'
                            }`}
                        />
                        {!isNotesValid && (
                            <p className="flex items-center gap-1 font-sans text-[11px] text-amber-700">
                                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                                <span>{t.reviewerWorkspace.notesReminder}</span>
                            </p>
                        )}
                    </div>

                    {/* Conflict of Interest (CoI) Notice Checkbox */}
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                                type="checkbox"
                                checked={coiAcknowledged}
                                onChange={(e) => setCoiAcknowledged(e.target.checked)}
                                className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                            />
                            <span className="font-sans text-xs leading-snug text-slate-800">{t.reviewerWorkspace.coiNotice}</span>
                        </label>
                        {!coiAcknowledged && <p className="mt-1 pl-6 font-sans text-[11px] text-slate-500">{t.reviewerWorkspace.coiRequiredHint}</p>}
                    </div>

                    {/* Draft Saved Notification Notice */}
                    {draftSavedAlert && (
                        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-2.5 font-sans text-xs text-blue-900">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-700" />
                            <span className="font-semibold">{t.reviewerWorkspace.draftSavedIndicator}</span>
                            <span>{t.reviewerWorkspace.draftSavedMessage}</span>
                        </div>
                    )}

                    {/* Form Action Buttons */}
                    <div className="flex items-center space-x-2.5 border-t border-slate-200 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            className="h-9 flex-1 gap-1.5 border-slate-300 font-sans text-xs font-semibold text-slate-700 hover:text-slate-900"
                        >
                            <Save className="h-3.5 w-3.5" />
                            <span>{t.reviewerWorkspace.btnSaveDraft}</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={!isFormComplete || processing}
                            className={`h-9 flex-1 gap-1.5 font-sans text-xs font-semibold transition-all ${
                                isFormComplete && !processing
                                    ? 'bg-blue-900 text-white shadow-xs hover:bg-blue-800'
                                    : 'cursor-not-allowed border-slate-200 bg-slate-300 text-slate-500'
                            }`}
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{processing ? t.reviewerWorkspace.btnSubmitting : t.reviewerWorkspace.btnSubmitFinal}</span>
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.reviewerWorkspace.pageTitle} - ${proposalTitle}`} />

            <div className="w-full">
                <SplitScreenViewer pdfUrl={pdfUrl} documentTitle={proposalTitle} headerActions={headerActions} formContent={formContent} />
            </div>
        </AppLayout>
    );
}
