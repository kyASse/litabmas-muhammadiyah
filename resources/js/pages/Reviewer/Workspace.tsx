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

import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Scale,
    User,
    BookOpen,
    Send,
    Save,
    Check,
    Coins,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { SplitScreenViewer } from '@/components/ui/SplitScreenViewer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type BreadcrumbItem } from '@/types';

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
    const [recommendation, setRecommendation] = useState<'Diterima' | 'Revisi' | 'Ditolak' | ''>(
        review?.keputusan_rekomendasi || ''
    );
    const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(false);
    const [draftSavedAlert, setDraftSavedAlert] = useState<boolean>(false);

    // Live weighted aggregate calculation: (35% + 35% + 30%)
    const aggregateScore = useMemo(() => {
        const total = (scoreUrgency * 0.35) + (scoreMethodology * 0.35) + (scoreFeasibility * 0.30);
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
        coiAcknowledged &&
        isNotesValid &&
        recommendation !== '' &&
        scoreUrgency >= 0 &&
        scoreMethodology >= 0 &&
        scoreFeasibility >= 0;

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
        <div className="flex items-center space-x-2 mr-2">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs font-sans text-slate-700 hover:text-blue-900 hover:bg-slate-100"
                asChild
            >
                <Link href="/reviewer/assignments">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t.reviewerWorkspace.backToAssignments}</span>
                </Link>
            </Button>
            <StatusBadge
                status={review.status_review === 'Completed' ? 'Completed_SKTS' : 'In_Review'}
                size="sm"
            />
            <LanguageSwitcher size="sm" variant="compact" />
        </div>
    );

    // Right pane: Interactive Evaluation Rubric Form Content
    const formContent = (
        <form onSubmit={handleSubmitFinal} className="space-y-6">
            {/* Server-Side Validation Errors Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="rounded-md border-2 border-rose-500 bg-rose-50 p-3.5 text-rose-900 shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 font-sans">
                            {t.reviewerWorkspace.validationErrorTitle}
                        </h4>
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-700 pl-1 space-y-1 font-sans">
                        {Object.entries(errors).map(([field, message]) => (
                            <li key={field}>{String(message)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Header / Instructions */}
            <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-900" />
                    <h3 className="font-sans text-sm font-bold text-slate-900 uppercase tracking-wide">
                        {t.reviewerWorkspace.rubricTitle}
                    </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                    {t.reviewerWorkspace.rubricSubtitle}
                </p>
            </div>

            {/* Proposal Quick Meta Card */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.reviewerWorkspace.proposalDetails}</span>
                </div>
                <p className="text-slate-900 font-serif font-medium text-xs truncate">
                    {proposalTitle}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11px] pt-1">
                    <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-700">{t.reviewerWorkspace.researcher}:</strong> {researcherName}
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-700">{t.reviewerWorkspace.scheme}:</strong> {schemeName}
                    </span>
                    {budgetCap && (
                        <span className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-slate-400" />
                            <strong className="text-slate-700">{t.reviewerWorkspace.budgetCap}:</strong>
                            <TabularFigure value={budgetCap} type="currency" size="sm" weight="semibold" />
                        </span>
                    )}
                </div>
            </div>

            {/* CRITERION 1: Urgency & Innovation (Weight 35%) */}
            <div className="space-y-2.5 p-3.5 bg-white rounded-md border border-slate-200 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">
                                1. {t.reviewerWorkspace.criteria1Name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {t.reviewerWorkspace.criteria1Weight}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug font-sans">
                            {t.reviewerWorkspace.criteria1Desc}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreUrgency}
                            onChange={(e) => setScoreUrgency(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-14 h-7 text-xs font-mono font-bold text-right rounded border-slate-300 px-1.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreUrgency}
                    onChange={(e) => setScoreUrgency(Number(e.target.value))}
                    className="w-full accent-blue-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
            </div>

            {/* CRITERION 2: Methodology & Roadmap (Weight 35%) */}
            <div className="space-y-2.5 p-3.5 bg-white rounded-md border border-slate-200 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">
                                2. {t.reviewerWorkspace.criteria2Name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {t.reviewerWorkspace.criteria2Weight}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug font-sans">
                            {t.reviewerWorkspace.criteria2Desc}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreMethodology}
                            onChange={(e) => setScoreMethodology(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-14 h-7 text-xs font-mono font-bold text-right rounded border-slate-300 px-1.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreMethodology}
                    onChange={(e) => setScoreMethodology(Number(e.target.value))}
                    className="w-full accent-blue-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
            </div>

            {/* CRITERION 3: Feasibility & Outputs (Weight 30%) */}
            <div className="space-y-2.5 p-3.5 bg-white rounded-md border border-slate-200 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800">
                                3. {t.reviewerWorkspace.criteria3Name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {t.reviewerWorkspace.criteria3Weight}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug font-sans">
                            {t.reviewerWorkspace.criteria3Desc}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreFeasibility}
                            onChange={(e) => setScoreFeasibility(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-14 h-7 text-xs font-mono font-bold text-right rounded border-slate-300 px-1.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreFeasibility}
                    onChange={(e) => setScoreFeasibility(Number(e.target.value))}
                    className="w-full accent-blue-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{t.components.splitScreen.scoreRangePoor}</span>
                    <span>{t.components.splitScreen.scoreRangeFair}</span>
                    <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                </div>
            </div>

            {/* Real-Time Aggregate Score Calculator (Zero CLS) */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                                {t.reviewerWorkspace.totalScoreLabel}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                                {t.reviewerWorkspace.totalScoreScale}
                            </span>
                        </div>
                        <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold border ${scoreDescriptor.badgeClasses}`}>
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
                <label className="block text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
                    {t.reviewerWorkspace.recommendationLabel} <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setRecommendation('Diterima')}
                        className={`py-2 px-2.5 rounded text-xs font-sans font-semibold border transition-all text-center ${
                            recommendation === 'Diterima'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {t.reviewerWorkspace.recAccepted}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecommendation('Revisi')}
                        className={`py-2 px-2.5 rounded text-xs font-sans font-semibold border transition-all text-center ${
                            recommendation === 'Revisi'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {t.reviewerWorkspace.recRevision}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecommendation('Ditolak')}
                        className={`py-2 px-2.5 rounded text-xs font-sans font-semibold border transition-all text-center ${
                            recommendation === 'Ditolak'
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {t.reviewerWorkspace.recRejected}
                    </button>
                </div>
            </div>

            {/* Qualitative Notes Textarea with Character Counter */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
                        {t.reviewerWorkspace.notesLabel} <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className={isNotesValid ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-medium'}>
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
                    className={`w-full text-xs font-sans rounded-md border p-2.5 leading-relaxed focus:ring-1 transition-colors ${
                        !isNotesValid && notes.length > 0
                            ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500 bg-amber-50/20'
                            : 'border-slate-300 focus:border-blue-900 focus:ring-blue-900 bg-white'
                    }`}
                />
                {!isNotesValid && (
                    <p className="text-[11px] text-amber-700 font-sans flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{t.reviewerWorkspace.notesReminder}</span>
                    </p>
                )}
            </div>

            {/* Conflict of Interest (CoI) Notice Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={coiAcknowledged}
                        onChange={(e) => setCoiAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span className="text-xs font-sans text-slate-800 leading-snug">
                        {t.reviewerWorkspace.coiNotice}
                    </span>
                </label>
                {!coiAcknowledged && (
                    <p className="text-[11px] text-slate-500 mt-1 pl-6 font-sans">
                        {t.reviewerWorkspace.coiRequiredHint}
                    </p>
                )}
            </div>

            {/* Draft Saved Notification Notice */}
            {draftSavedAlert && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-xs font-sans flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="font-semibold">{t.reviewerWorkspace.draftSavedIndicator}</span>
                    <span>{t.reviewerWorkspace.draftSavedMessage}</span>
                </div>
            )}

            {/* Form Action Buttons */}
            <div className="pt-2 flex items-center space-x-2.5 border-t border-slate-200">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="flex-1 h-9 gap-1.5 text-xs font-sans font-semibold text-slate-700 hover:text-slate-900 border-slate-300"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.reviewerWorkspace.btnSaveDraft}</span>
                </Button>

                <Button
                    type="submit"
                    disabled={!isFormComplete || processing}
                    className={`flex-1 h-9 gap-1.5 text-xs font-sans font-semibold transition-all ${
                        isFormComplete && !processing
                            ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-200'
                    }`}
                >
                    <Send className="w-3.5 h-3.5" />
                    <span>{processing ? t.reviewerWorkspace.btnSubmitting : t.reviewerWorkspace.btnSubmitFinal}</span>
                </Button>
            </div>
        </form>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.reviewerWorkspace.pageTitle} - ${proposalTitle}`} />

            <div className="w-full">
                <SplitScreenViewer
                    pdfUrl={pdfUrl}
                    documentTitle={proposalTitle}
                    headerActions={headerActions}
                    formContent={formContent}
                />
            </div>
        </AppLayout>
    );
}
