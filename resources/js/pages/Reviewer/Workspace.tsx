/**
 * Reviewer Workspace Component
 *
 * @description
 * Antarmuka Workspace Reviewer berbasis SplitScreenViewer:
 * - 60% Left pane: PDF viewer dokumen proposal penelitian (dengan fallback).
 * - 40% Right pane: Rubrik evaluasi interaktif dengan kalkulasi skor terbobot real-time (Zero CLS),
 *   catatan kualitatif (min 50 karakter), pemilih rekomendasi, dan pernyataan bebas CoI.
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
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Coins, FileText, Save, Scale, Send, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface EvaluationItem {
    kriteria: string;
    bobot: number;
    skor: number;
}

interface ProposalData {
    id: number;
    title?: string;
    judul_penelitian?: string;
    abstract?: string;
    abstrak?: string;
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
}

export default function ReviewerWorkspace({ review, proposal }: WorkspaceProps) {
    const { t, format } = useTranslation();

    // Initial scores from saved review or fallback defaults
    const initialScores = useMemo(() => {
        let s1 = 75;
        let s2 = 75;
        let s3 = 75;
        if (review?.komponen_penilaian && Array.isArray(review.komponen_penilaian)) {
            if (review.komponen_penilaian[0]?.skor !== undefined) s1 = Number(review.komponen_penilaian[0].skor);
            if (review.komponen_penilaian[1]?.skor !== undefined) s2 = Number(review.komponen_penilaian[1].skor);
            if (review.komponen_penilaian[2]?.skor !== undefined) s3 = Number(review.komponen_penilaian[2].skor);
        }
        return { urgency: s1, methodology: s2, feasibility: s3 };
    }, [review]);

    // Evaluation rubric state
    const [scoreUrgency, setScoreUrgency] = useState<number>(initialScores.urgency);
    const [scoreMethodology, setScoreMethodology] = useState<number>(initialScores.methodology);
    const [scoreFeasibility, setScoreFeasibility] = useState<number>(initialScores.feasibility);
    const [notes, setNotes] = useState<string>(review?.catatan_evaluasi || '');
    const [recommendation, setRecommendation] = useState<'Diterima' | 'Revisi' | 'Ditolak' | ''>(review?.keputusan_rekomendasi || '');
    const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(false);
    const [draftSavedAlert, setDraftSavedAlert] = useState<boolean>(false);

    // Live weighted aggregate calculation: (35% + 35% + 30%)
    const aggregateScore = useMemo(() => {
        const total = scoreUrgency * 0.35 + scoreMethodology * 0.35 + scoreFeasibility * 0.3;
        return Math.round(total * 100) / 100;
    }, [scoreUrgency, scoreMethodology, scoreFeasibility]);

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

    // Inertia form submission
    const { post, processing, errors, transform } = useForm();

    const isNotesValid = notes.trim().length >= 50;
    const isFormComplete =
        coiAcknowledged && isNotesValid && recommendation !== '' && scoreUrgency >= 0 && scoreMethodology >= 0 && scoreFeasibility >= 0;

    // Save draft locally
    const handleSaveDraft = () => {
        const draftData = {
            scoreUrgency,
            scoreMethodology,
            scoreFeasibility,
            notes,
            recommendation,
            savedAt: new Date().toISOString(),
        };
        try {
            localStorage.setItem(`review_draft_${review.id}`, JSON.stringify(draftData));
            setDraftSavedAlert(true);
            setTimeout(() => setDraftSavedAlert(false), 4000);
        } catch {
            // Local storage access error handling
        }
    };

    // Load saved draft if available and review is not completed
    useEffect(() => {
        if (review.status_review !== 'Completed') {
            try {
                const cached = localStorage.getItem(`review_draft_${review.id}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.scoreUrgency !== undefined) setScoreUrgency(parsed.scoreUrgency);
                    if (parsed.scoreMethodology !== undefined) setScoreMethodology(parsed.scoreMethodology);
                    if (parsed.scoreFeasibility !== undefined) setScoreFeasibility(parsed.scoreFeasibility);
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
            komponen_penilaian: [
                {
                    kriteria: t.reviewerWorkspace.criteria1Name,
                    bobot: 35,
                    skor: scoreUrgency,
                },
                {
                    kriteria: t.reviewerWorkspace.criteria2Name,
                    bobot: 35,
                    skor: scoreMethodology,
                },
                {
                    kriteria: t.reviewerWorkspace.criteria3Name,
                    bobot: 30,
                    skor: scoreFeasibility,
                },
            ],
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

    // Right pane: Interactive Evaluation Rubric Form Content
    const formContent = (
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
                    <h3 className="font-sans text-sm font-bold tracking-wide text-slate-900 uppercase">{t.reviewerWorkspace.rubricTitle}</h3>
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-slate-500">{t.reviewerWorkspace.rubricSubtitle}</p>
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

            {/* CRITERION 1: Urgency & Innovation (Weight 35%) */}
            <div className="space-y-2.5 rounded-md border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">1. {t.reviewerWorkspace.criteria1Name}</span>
                            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                                {t.reviewerWorkspace.criteria1Weight}
                            </span>
                        </div>
                        <p className="mt-0.5 font-sans text-[11px] leading-snug text-slate-500">{t.reviewerWorkspace.criteria1Desc}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreUrgency}
                            onChange={(e) => setScoreUrgency(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="h-7 w-14 rounded border-slate-300 px-1.5 text-right font-mono text-xs font-bold focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreUrgency}
                    onChange={(e) => setScoreUrgency(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-900"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
            </div>

            {/* CRITERION 2: Methodology & Roadmap (Weight 35%) */}
            <div className="space-y-2.5 rounded-md border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">2. {t.reviewerWorkspace.criteria2Name}</span>
                            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                                {t.reviewerWorkspace.criteria2Weight}
                            </span>
                        </div>
                        <p className="mt-0.5 font-sans text-[11px] leading-snug text-slate-500">{t.reviewerWorkspace.criteria2Desc}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreMethodology}
                            onChange={(e) => setScoreMethodology(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="h-7 w-14 rounded border-slate-300 px-1.5 text-right font-mono text-xs font-bold focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreMethodology}
                    onChange={(e) => setScoreMethodology(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-900"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
            </div>

            {/* CRITERION 3: Feasibility & Outputs (Weight 30%) */}
            <div className="space-y-2.5 rounded-md border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">3. {t.reviewerWorkspace.criteria3Name}</span>
                            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                                {t.reviewerWorkspace.criteria3Weight}
                            </span>
                        </div>
                        <p className="mt-0.5 font-sans text-[11px] leading-snug text-slate-500">{t.reviewerWorkspace.criteria3Desc}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreFeasibility}
                            onChange={(e) => setScoreFeasibility(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="h-7 w-14 rounded border-slate-300 px-1.5 text-right font-mono text-xs font-bold focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreFeasibility}
                    onChange={(e) => setScoreFeasibility(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-900"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
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
                        {isNotesValid && <span className="text-[10px] font-bold text-emerald-700">{t.reviewerWorkspace.notesValid}</span>}
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
