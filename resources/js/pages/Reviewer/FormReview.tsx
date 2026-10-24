/**
 * Form Penilaian Proposal (Reviewer)
 *
 * @description
 * Form rubrik interaktif untuk reviewer mengisi penilaian proposal penelitian:
 * - Sub-navigasi Tab 1: Hasil Verifikasi Administrasi (checklist Ya/Tidak Fase 1, read-only)
 * - Sub-navigasi Tab 2: Lembar Evaluasi Substansi (rubrik skor diskret 1-5 tanpa slider,
 *   komentar wajib per butir kriteria, kalkulasi total skor terbobot real-time).
 *
 * @route POST /reviewer/assessment → reviewer.assessment.store
 * @route PUT  /reviewer/assessment/{id} → reviewer.assessment.update
 */

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ClipboardCheck, FileCheck, FileText, Info, Save, Scale, Star } from 'lucide-react';
import { type FormEventHandler, useCallback, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProposalData = {
    id: number;
    title: string;
    abstract: string;
    status_proposal?: string;
    catatan_administrasi?: string | null;
};

type KomponenPenilaian = {
    kriteria: string;
    bobot: number;
    skor: number;
    komentar?: string;
    komentar_indikator?: string;
    catatan_kriteria?: string;
};

type ExistingReview = {
    id: number;
    komponen_penilaian: KomponenPenilaian[];
    score: number;
    comments: string;
    recommendation: 'accepted' | 'revision' | 'rejected';
};

type Props = {
    proposal: ProposalData;
    existingReview?: ExistingReview;
};

/* ------------------------------------------------------------------ */
/*  Default Rubric Criteria                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_KRITERIA: Omit<KomponenPenilaian, 'skor'>[] = [
    { kriteria: 'Rekam Jejak dan Kompetensi Tim Peneliti', bobot: 20 },
    { kriteria: 'Urgensi, Kebaruan, dan Tinjauan Pustaka', bobot: 30 },
    { kriteria: 'Kejelasan Metodologi dan Kelayakan Pelaksanaan', bobot: 25 },
    { kriteria: 'Potensi Dampak dan Kelayakan Target Luaran', bobot: 25 },
];

const SKOR_LABELS: Record<number, string> = {
    1: 'Sangat Kurang',
    2: 'Kurang',
    3: 'Cukup',
    4: 'Baik',
    5: 'Sangat Baik',
};

/* ------------------------------------------------------------------ */
/*  Helper: Build initial komponen_penilaian                           */
/* ------------------------------------------------------------------ */

function buildInitialKomponen(existing?: KomponenPenilaian[]): KomponenPenilaian[] {
    if (existing && existing.length > 0) {
        return existing.map((it) => ({
            ...it,
            skor: it.skor > 5 ? Math.round((it.skor / 100) * 5) : it.skor,
            komentar: it.komentar || it.komentar_indikator || it.catatan_kriteria || '',
        }));
    }
    return DEFAULT_KRITERIA.map((k) => ({ ...k, skor: 0, komentar: '' }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reviewer', href: route('reviewer.assignments.index') },
    { title: 'Form Penilaian', href: '#' },
];

export default function FormReview({ proposal, existingReview }: Props) {
    const [activeTab, setActiveTab] = useState<'admin' | 'substansi'>('substansi');

    const { data, setData, post, put, processing, errors } = useForm<{
        proposal_id: number;
        komponen_penilaian: KomponenPenilaian[];
        score: number;
        comments: string;
        recommendation: 'accepted' | 'revision' | 'rejected' | '';
    }>({
        proposal_id: proposal.id,
        komponen_penilaian: buildInitialKomponen(existingReview?.komponen_penilaian),
        score: existingReview?.score ?? 0,
        comments: existingReview?.comments ?? '',
        recommendation: existingReview?.recommendation ?? '',
    });

    /* ---------- Aggregate score calculation (real-time) ---------- */

    const aggregateScore = useMemo(() => {
        const komponen = data.komponen_penilaian;
        const totalBobot = komponen.reduce((sum, k) => sum + k.bobot, 0);
        if (totalBobot === 0) return 0;

        const weightedSum = komponen.reduce((sum, k) => {
            if (k.skor === 0) return sum;
            // Scale 1-5 discrete to weight percentage
            return sum + ((k.skor / 5) * 100 * k.bobot) / totalBobot;
        }, 0);

        return Math.round(weightedSum * 100) / 100;
    }, [data.komponen_penilaian]);

    const allCriteriaFilled = useMemo(() => {
        return data.komponen_penilaian.every((k) => k.skor >= 1 && k.skor <= 5);
    }, [data.komponen_penilaian]);

    const allCriteriaCommented = useMemo(() => {
        return data.komponen_penilaian.every((k) => (k.komentar || '').trim().length > 0);
    }, [data.komponen_penilaian]);

    /* ---------- Handlers ---------- */

    const handleSkorChange = useCallback(
        (index: number, skor: number) => {
            const updated = [...data.komponen_penilaian];
            updated[index] = { ...updated[index], skor };
            setData('komponen_penilaian', updated);

            const totalBobot = updated.reduce((sum, k) => sum + k.bobot, 0);
            const weightedSum = updated.reduce((sum, k) => {
                if (k.skor === 0) return sum;
                return sum + ((k.skor / 5) * 100 * k.bobot) / totalBobot;
            }, 0);
            setData('score', Math.round(weightedSum * 100) / 100);
        },
        [data.komponen_penilaian, setData],
    );

    const handleCommentChange = useCallback(
        (index: number, komentar: string) => {
            const updated = [...data.komponen_penilaian];
            updated[index] = {
                ...updated[index],
                komentar,
                komentar_indikator: komentar,
                catatan_kriteria: komentar,
            };
            setData('komponen_penilaian', updated);
        },
        [data.komponen_penilaian, setData],
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Ensure score is synced with aggregate before submit
        setData('score', aggregateScore);

        if (existingReview) {
            put(route('reviewer.assessment.update', existingReview.id));
        } else {
            post(route('reviewer.assessment.store'));
        }
    };

    /* ---------- Score color helper ---------- */

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    /* ---------- Render ---------- */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Penilaian Proposal" />

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold">Form Penilaian Proposal</h1>
                    <p className="text-muted-foreground">
                        {existingReview ? 'Perbarui penilaian proposal di bawah ini.' : 'Isi rubrik penilaian proposal secara lengkap.'}
                    </p>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('admin')}
                        className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                            activeTab === 'admin'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FileCheck className="h-4 w-4" />
                        <span>Hasil Verifikasi Administrasi</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('substansi')}
                        className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                            activeTab === 'substansi'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Scale className="h-4 w-4" />
                        <span>Lembar Evaluasi Substansi</span>
                    </button>
                </div>

                {/* TAB 1: HASIL VERIFIKASI ADMINISTRASI (READ-ONLY) */}
                {activeTab === 'admin' && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                                <p className="font-semibold text-foreground">Hasil Verifikasi Administrasi Fase 1 (Read-Only)</p>
                                <p>Bagian ini bersifat baca-saja sesuai hasil verifikasi administrasi yang dilakukan oleh Bappeda.</p>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Status Seleksi Administrasi</CardTitle>
                                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                                        {proposal.status_proposal || 'Lolos_Administrasi'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Catatan Verifikasi Bappeda</Label>
                                    <p className="rounded border border-border bg-muted/20 p-3 text-sm">
                                        {proposal.catatan_administrasi ||
                                            'Seluruh berkas persyaratan telah diverifikasi lengkap dan memenuhi standar pedoman.'}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Checklist Persyaratan Administrasi</Label>
                                    <div className="divide-y divide-border rounded border border-border text-sm">
                                        <div className="flex items-center justify-between p-3">
                                            <span>1. Surat Pengantar LPPM & Format Proposal</span>
                                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                <CheckCircle2 className="h-4 w-4" /> Lolos (Ya)
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3">
                                            <span>2. Rincian Anggaran Biaya (RAB) sesuai Pagu</span>
                                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                <CheckCircle2 className="h-4 w-4" /> Lolos (Ya)
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3">
                                            <span>3. Surat Pernyataan Bebas Plagiarisme</span>
                                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                <CheckCircle2 className="h-4 w-4" /> Lolos (Ya)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 2: LEMBAR EVALUASI SUBSTANSI */}
                {activeTab === 'substansi' && (
                    <>
                        {/* Proposal Detail Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle>Detail Proposal</CardTitle>
                                        <CardDescription>Informasi proposal yang akan dinilai</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium">Judul:</span>
                                        <p className="text-sm text-muted-foreground">{proposal.title}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium">Abstrak:</span>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{proposal.abstract}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assessment Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Rubric Scoring Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <ClipboardCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle>Rubrik Penilaian Pilihan Ganda (Bebas Slider)</CardTitle>
                                            <CardDescription>
                                                Pilih skor diskret 1–5 dan tuliskan justifikasi kualitatif untuk setiap butir kriteria
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-5">
                                        {data.komponen_penilaian.map((komponen, index) => {
                                            const weighted =
                                                komponen.skor > 0 ? ((komponen.skor / 5) * komponen.bobot).toFixed(2) : '0.00';
                                            const hasComment = (komponen.komentar || '').trim().length > 0;

                                            return (
                                                <div key={komponen.kriteria} className="space-y-3 rounded-lg border p-4">
                                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                                        <Label className="text-base font-semibold">{komponen.kriteria}</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Bobot: {komponen.bobot}%
                                                            </Badge>
                                                            <span className="font-mono text-xs font-bold text-primary">
                                                                Nilai: {weighted}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Score Buttons (Pilihan Ganda Diskret 1-5) */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Pilihan Skor (1 - 5) <span className="text-destructive">*</span>
                                                        </Label>
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {[1, 2, 3, 4, 5].map((skor) => (
                                                                <button
                                                                    key={skor}
                                                                    type="button"
                                                                    onClick={() => handleSkorChange(index, skor)}
                                                                    className={`flex flex-col items-center justify-center rounded-md border p-2 text-center transition-all ${
                                                                        komponen.skor === skor
                                                                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                                            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                                                    }`}
                                                                >
                                                                    <span className="font-mono text-sm font-bold">{skor}</span>
                                                                    <span className="text-[10px] leading-tight font-medium">
                                                                        {SKOR_LABELS[skor]}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Mandatory Commentary per Item */}
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold">
                                                                Catatan / Justifikasi Kualitatif <span className="text-destructive">*</span>
                                                            </Label>
                                                            {hasComment && (
                                                                <span className="text-[10px] font-bold text-emerald-600">[VALID]</span>
                                                            )}
                                                        </div>
                                                        <Textarea
                                                            rows={2}
                                                            value={komponen.komentar || ''}
                                                            onChange={(e) => handleCommentChange(index, e.target.value)}
                                                            placeholder="Berikan alasan kualitatif untuk penilaian butir ini..."
                                                            className={!hasComment ? 'border-amber-400 bg-amber-50/20' : ''}
                                                        />
                                                        {!hasComment && (
                                                            <p className="text-[10px] text-amber-600">
                                                                Komentar kualitatif per butir kriteria wajib diisi.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {errors[`komponen_penilaian.${index}.skor` as keyof typeof errors] && (
                                                        <InputError
                                                            message={errors[`komponen_penilaian.${index}.skor` as keyof typeof errors]}
                                                            className="mt-1"
                                                        />
                                                    )}
                                                    {errors[`komponen_penilaian.${index}.komentar` as keyof typeof errors] && (
                                                        <InputError
                                                            message={errors[`komponen_penilaian.${index}.komentar` as keyof typeof errors]}
                                                            className="mt-1"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {errors.komponen_penilaian && <InputError message={errors.komponen_penilaian} />}
                                    </div>

                                    {/* Aggregate Score Display */}
                                    <div className="mt-6 rounded-lg border-2 border-dashed p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Total Skor Terakumulasi</p>
                                                <p className="text-xs text-muted-foreground">Dihitung otomatis dari rubrik terbobot di atas</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-3xl font-bold tabular-nums ${getScoreColor(aggregateScore)}`}>
                                                    {aggregateScore.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">dari 100</p>
                                            </div>
                                        </div>
                                        {(!allCriteriaFilled || !allCriteriaCommented) && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Seluruh kriteria wajib memiliki skor (1-5) dan komentar kualitatif untuk menyimpan penilaian.
                                            </p>
                                        )}
                                    </div>
                                    {errors.score && <InputError message={errors.score} className="mt-2" />}
                                </CardContent>
                            </Card>

                            {/* Recommendation & Comments Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rekomendasi & Komentar Umum</CardTitle>
                                    <CardDescription>Tentukan rekomendasi dan berikan catatan umum untuk proposal ini</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Recommendation Select */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recommendation">Rekomendasi</Label>
                                        <Select
                                            value={data.recommendation}
                                            onValueChange={(value) => setData('recommendation', value as 'accepted' | 'revision' | 'rejected')}
                                        >
                                            <SelectTrigger id="recommendation">
                                                <SelectValue placeholder="Pilih Rekomendasi..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="accepted">Diterima</SelectItem>
                                                <SelectItem value="revision">Revisi</SelectItem>
                                                <SelectItem value="rejected">Ditolak</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.recommendation} />
                                    </div>

                                    {/* Comments Textarea */}
                                    <div className="space-y-2">
                                        <Label htmlFor="comments">
                                            Komentar / Catatan Reviewer
                                            {(data.recommendation === 'revision' || data.recommendation === 'rejected') && (
                                                <span className="ml-1 text-red-500">*</span>
                                            )}
                                        </Label>
                                        <Textarea
                                            id="comments"
                                            rows={5}
                                            value={data.comments}
                                            onChange={(e) => setData('comments', e.target.value)}
                                            placeholder={
                                                data.recommendation === 'revision' || data.recommendation === 'rejected'
                                                    ? 'Wajib diisi untuk rekomendasi Revisi/Ditolak...'
                                                    : 'Tambahkan catatan atau komentar (opsional)...'
                                            }
                                        />
                                        <InputError message={errors.comments} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={processing || !allCriteriaFilled || !allCriteriaCommented || !data.recommendation}
                                    size="lg"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Menyimpan...' : existingReview ? 'Perbarui Penilaian' : 'Simpan Penilaian'}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
