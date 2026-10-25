/**
 * Review/Show — Substantive Evaluation Sheet Page
 *
 * @description
 * Halaman evaluasi substansi proposal penelitian oleh reviewer:
 * - Sub-navigasi Tab 1: Hasil Verifikasi Administrasi (Fase 1 checklist Ya/Tidak, read-only)
 * - Sub-navigasi Tab 2: Lembar Evaluasi Substansi (pilihan ganda diskret 1-5 tanpa slider,
 *   komentar wajib per butir kriteria, kalkulasi skor terbobot real-time, CoI guard)
 *
 * @filepath /resources/js/pages/Review/Show.tsx
 */

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, FileCheck, Info, Scale, Send } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface EvaluationItem {
    kriteria: string;
    bobot: number;
    skor: number;
    deskripsi?: string;
    komentar?: string;
    komentar_indikator?: string;
    catatan_kriteria?: string;
}

interface ProposalData {
    id: number;
    title?: string;
    judul_penelitian?: string;
    abstract?: string;
    abstrak?: string;
    status_proposal?: string;
    catatan_administrasi?: string | null;
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

interface Props {
    proposal: ProposalData;
    review?: ReviewData | null;
}

const DEFAULT_CRITERIA: EvaluationItem[] = [
    {
        kriteria: 'Rekam Jejak dan Kompetensi Tim Peneliti',
        bobot: 20,
        skor: 0,
        deskripsi: 'Kesesuaian keahlian pengusul, riwayat publikasi terdahulu, dan kompetensi tim riset.',
        komentar: '',
    },
    {
        kriteria: 'Urgensi, Kebaruan, dan Tinjauan Pustaka',
        bobot: 30,
        skor: 0,
        deskripsi: 'Kebaruan ide (novelty), ketajaman rumusan masalah, dan kemutakhiran tinjauan pustaka.',
        komentar: '',
    },
    {
        kriteria: 'Kejelasan Metodologi dan Kelayakan Pelaksanaan',
        bobot: 25,
        skor: 0,
        deskripsi: 'Kesesuaian rancangan metode, ketepatan jadwal tahapan, dan kewajaran alokasi anggaran.',
        komentar: '',
    },
    {
        kriteria: 'Potensi Dampak dan Kelayakan Target Luaran',
        bobot: 25,
        skor: 0,
        deskripsi: 'Kelayakan pencapaian luaran wajib/tambahan (jurnal terindeks/HKI/buku) dan manfaat hasil riset.',
        komentar: '',
    },
];

export default function ShowReview({ proposal, review }: Props) {
    const { t, format } = useTranslation();
    const [activeTab, setActiveTab] = useState<'admin' | 'substansi'>('substansi');

    const initialCriteria = useMemo<EvaluationItem[]>(() => {
        if (review?.komponen_penilaian && Array.isArray(review.komponen_penilaian) && review.komponen_penilaian.length > 0) {
            return review.komponen_penilaian.map((item) => ({
                kriteria: item.kriteria,
                bobot: Number(item.bobot) || 0,
                skor: item.skor > 5 ? Math.round((item.skor / 100) * 5) : Number(item.skor) || 0,
                deskripsi: item.deskripsi || '',
                komentar: item.komentar || item.komentar_indikator || item.catatan_kriteria || '',
            }));
        }
        return DEFAULT_CRITERIA;
    }, [review]);

    const [criteriaItems, setCriteriaItems] = useState<EvaluationItem[]>(initialCriteria);
    const [notes, setNotes] = useState<string>(review?.catatan_evaluasi || '');
    const [recommendation, setRecommendation] = useState<'Diterima' | 'Revisi' | 'Ditolak' | ''>(review?.keputusan_rekomendasi || '');
    const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(false);

    // Live weighted aggregate calculation: sum((pilihan / 5) * bobot)
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

    const handleScoreSelect = (index: number, scoreVal: number) => {
        setCriteriaItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], skor: scoreVal };
            return next;
        });
    };

    const handleCommentChange = (index: number, commentVal: string) => {
        setCriteriaItems((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                komentar: commentVal,
                komentar_indikator: commentVal,
                catatan_kriteria: commentVal,
            };
            return next;
        });
    };

    const allScored = useMemo(() => {
        return criteriaItems.length > 0 && criteriaItems.every((it) => it.skor >= 1 && it.skor <= 5);
    }, [criteriaItems]);

    const allCommented = useMemo(() => {
        return criteriaItems.length > 0 && criteriaItems.every((it) => (it.komentar || '').trim().length > 0);
    }, [criteriaItems]);

    const isNotesValid = notes.trim().length >= 50;
    const isFormComplete = coiAcknowledged && isNotesValid && recommendation !== '' && allScored && allCommented;

    const { post, processing, errors, transform } = useForm();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormComplete || processing) return;

        const payload = {
            proposal_id: proposal.id,
            komponen_penilaian: criteriaItems.map((it) => ({
                kriteria: it.kriteria,
                bobot: it.bobot,
                skor: it.skor,
                komentar: it.komentar,
                komentar_indikator: it.komentar,
                catatan_kriteria: it.komentar,
            })),
            comments: notes,
            recommendation,
            score: aggregateScore,
        };

        transform(() => payload);
        post(route('reviewer.assessment.store'));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/reviewer/dashboard' },
        { title: t.navigation.reviews, href: '/reviewer/assignments' },
        { title: t.reviewerWorkspace.pageTitle, href: '#' },
    ];

    const proposalTitle = proposal.title || proposal.judul_penelitian || `Proposal #${proposal.id}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.reviewerWorkspace.pageTitle} - ${proposalTitle}`} />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                                <Link href="/reviewer/assignments">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>{t.reviewerWorkspace.backToAssignments}</span>
                                </Link>
                            </Button>
                            <StatusBadge status={proposal.status_proposal || 'Lolos_Administrasi'} size="sm" />
                        </div>
                        <h1 className="font-serif text-xl font-bold text-slate-900">{proposalTitle}</h1>
                        <p className="font-sans text-xs text-slate-500">
                            {t.reviewerWorkspace.researcher}: <strong>{proposal.pengusul?.name || '-'}</strong> • {t.reviewerWorkspace.scheme}:{' '}
                            <strong>{proposal.skemaPendanaan?.nama_skema || '-'}</strong>
                        </p>
                    </div>
                    <LanguageSwitcher size="sm" variant="compact" />
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('admin')}
                            className={`inline-flex items-center gap-2 border-b-2 pb-3 font-sans text-xs font-semibold transition-all ${
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
                            className={`inline-flex items-center gap-2 border-b-2 pb-3 font-sans text-xs font-semibold transition-all ${
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
                    <div className="space-y-4">
                        <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3 font-sans text-xs text-slate-700">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-900" />
                            <div className="space-y-0.5">
                                <p className="font-semibold text-slate-900">{t.reviewerWorkspace.adminVerificationTitle}</p>
                                <p className="text-slate-600">{t.reviewerWorkspace.adminReadOnlyNotice}</p>
                            </div>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase">{t.reviewerWorkspace.adminChecklistTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-600 uppercase">
                                        {t.reviewerWorkspace.adminNotesLabel}
                                    </label>
                                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800">
                                        {proposal.catatan_administrasi ||
                                            'Seluruh berkas persyaratan telah diverifikasi lengkap dan memenuhi standar Bappeda.'}
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 rounded border border-slate-200 text-xs">
                                    <div className="flex items-center justify-between p-3">
                                        <span className="font-medium text-slate-900">1. Surat Pengantar LPPM & Validasi Format Proposal</span>
                                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t.reviewerWorkspace.adminChecklistVerified}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3">
                                        <span className="font-medium text-slate-900">2. Rincian Anggaran Biaya (RAB) sesuai Pagu Skema</span>
                                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t.reviewerWorkspace.adminChecklistVerified}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3">
                                        <span className="font-medium text-slate-900">
                                            3. Surat Pernyataan Bebas Plagiarisme dan Kesanggupan Riset
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t.reviewerWorkspace.adminChecklistVerified}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 2: LEMBAR EVALUASI SUBSTANSI */}
                {activeTab === 'substansi' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Validation Errors */}
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
                                <ul className="list-inside list-disc space-y-1">
                                    {Object.entries(errors).map(([k, v]) => (
                                        <li key={k}>{String(v)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Criteria Cards */}
                        <div className="space-y-4">
                            {criteriaItems.map((item, idx) => {
                                const weighted = item.skor > 0 ? ((item.skor / 5) * item.bobot).toFixed(2) : '0.00';
                                const hasComment = (item.komentar || '').trim().length > 0;

                                return (
                                    <Card key={idx} className="border-slate-200 shadow-xs">
                                        <CardContent className="space-y-3.5 p-4">
                                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                                <div>
                                                    <span className="font-sans text-xs font-bold text-slate-900">
                                                        {idx + 1}. {item.kriteria}
                                                    </span>
                                                    {item.deskripsi && (
                                                        <p className="mt-0.5 font-sans text-[11px] text-slate-500">{item.deskripsi}</p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <span className="font-mono text-xs font-bold text-blue-900">
                                                        {weighted} / {item.bobot}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Discrete 1-5 Buttons */}
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-slate-700 uppercase">
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
                                                            <span className="mt-0.5 text-[10px] leading-tight font-medium">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Mandatory Commentary per Item */}
                                            <div className="space-y-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-semibold text-slate-700 uppercase">
                                                        {t.reviewerWorkspace.criterionCommentLabel} <span className="text-rose-600">*</span>
                                                    </label>
                                                    {hasComment && (
                                                        <span className="text-[10px] font-bold text-emerald-700">
                                                            {t.reviewerWorkspace.notesValid}
                                                        </span>
                                                    )}
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={item.komentar || ''}
                                                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                                                    placeholder={t.reviewerWorkspace.criterionCommentPlaceholder}
                                                    className={`w-full rounded-md border p-2 font-sans text-xs leading-relaxed transition-colors ${
                                                        !hasComment
                                                            ? 'border-amber-400 bg-amber-50/20'
                                                            : 'border-slate-300 bg-white focus:border-blue-900'
                                                    }`}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Aggregate Score Card */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 p-4">
                            <div>
                                <span className="text-xs font-bold text-slate-900 uppercase">{t.reviewerWorkspace.totalScoreLabel}</span>
                                <span className="ml-2 font-mono text-[11px] text-slate-500">{t.reviewerWorkspace.totalScoreScale}</span>
                            </div>
                            <TabularFigure
                                value={aggregateScore}
                                type="score"
                                size="2xl"
                                weight="bold"
                                className={aggregateScore >= 70 ? 'text-emerald-700' : 'text-rose-700'}
                            />
                        </div>

                        {/* Recommendation */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-800 uppercase">
                                {t.reviewerWorkspace.recommendationLabel} <span className="text-rose-600">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Diterima', 'Revisi', 'Ditolak'] as const).map((rec) => (
                                    <button
                                        key={rec}
                                        type="button"
                                        onClick={() => setRecommendation(rec)}
                                        className={`rounded border px-3 py-2 text-center text-xs font-semibold transition-all ${
                                            recommendation === rec
                                                ? 'border-blue-900 bg-blue-900 text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {rec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Overall Notes */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 uppercase">
                                    {t.reviewerWorkspace.notesLabel} <span className="text-rose-600">*</span>
                                </label>
                                <span className="font-mono text-xs text-slate-500">{notes.length} / 50 min</span>
                            </div>
                            <textarea
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t.reviewerWorkspace.notesPlaceholder}
                                className="w-full rounded-md border border-slate-300 p-2.5 text-xs leading-relaxed"
                            />
                        </div>

                        {/* CoI Checkbox */}
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                            <label className="flex cursor-pointer items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={coiAcknowledged}
                                    onChange={(e) => setCoiAcknowledged(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-blue-900"
                                />
                                <span className="text-xs text-slate-800">{t.reviewerWorkspace.coiNotice}</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!isFormComplete || processing} className="gap-1.5">
                                <Send className="h-4 w-4" />
                                <span>{processing ? t.reviewerWorkspace.btnSubmitting : t.reviewerWorkspace.btnSubmitFinal}</span>
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
