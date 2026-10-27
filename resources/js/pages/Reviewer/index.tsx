/**
 * Reviewer/index — Dashboard Tugas Penilaian Reviewer
 *
 * @description
 * Halaman daftar tugas penilaian proposal penelitian untuk peran Reviewer.
 * Menampilkan ringkasan statistik tugas, filter pencarian & status, tabel penugasan,
 * serta modal form evaluasi penilaian berstandar UI/UX Pro Max.
 *
 * @features
 * - Header halaman & Breadcrumbs navigasi terintegrasi AppLayout
 * - Stat Cards ringkasan: Total Tugas, Menunggu/Dalam Proses, Selesai
 * - Fitur Filter & Pencarian berdasarkan status
 * - Tabel penugasan dengan indikator Badge status semantik
 * - Modal Form Penilaian lengkap dengan input skor, rekomendasi, umpan balik, dan aksi simpan
 * - Kompatibel dengan tema terang dan gelap (Light/Dark Mode)
 *
 * @route GET /reviewer/assignments
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock, FileText, Layers, Search, X, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MasterCriterion {
    id: number;
    code?: string;
    question?: string;
    nama_kriteria?: string;
    criterion?: string;
    description?: string;
    deskripsi?: string;
    weight?: number;
    bobot?: number;
    answer_type?: string;
    requires_attachment?: boolean;
}

interface AssessmentCriteria {
    id?: number;
    criterion: string;
    score: number;
    notes?: string | null;
    answer_type?: string;
    weight?: number;
}

interface Proposal {
    id: number;
    title?: string;
    judul?: string;
    description?: string;
    deskripsi?: string;
    file_dokumen_proposal?: string | null;
    proposal_doc_path?: string | null;
}

interface Review {
    id: number;
    proposal_id?: number;
    proposal?: Proposal | null;
    status: string;
    assessment_criteria?: AssessmentCriteria[];
    scores?: AssessmentCriteria[];
    komponen_penilaian?: any[];
    created_at: string;
    score?: number | null;
    total_score?: number | null;
    notes?: string | null;
    feedback?: string | null;
    recommendation?: string | null;
}

interface TasksPagination {
    data: Review[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    tasks?: TasksPagination;
    assignments?: TasksPagination;
    progressReports?: TasksPagination;
    selectedReview?: Review | null;
    filters?: {
        status?: string;
        search?: string;
    };
    masterCriteria?: MasterCriterion[];
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Tugas Reviewer', href: '/reviewer/assignments' },
];

// ─── Badge Helpers ────────────────────────────────────────────────────────────

function ReviewStatusBadge({ status }: { status: string }) {
    const normStatus = (status ?? '').toLowerCase();
    if (normStatus === 'completed' || normStatus === 'selesai') {
        return (
            <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 font-normal text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Selesai
            </Badge>
        );
    }
    if (normStatus === 'in_progress' || normStatus === 'dalam proses') {
        return (
            <Badge variant="outline" className="gap-1 border-blue-500/40 bg-blue-500/10 font-normal text-blue-700 dark:text-blue-400">
                <Clock className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                Dalam Proses
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
            Belum Dinilai
        </Badge>
    );
}

function AnswerTypeBadge({ answerType }: { answerType?: string }) {
    const norm = (answerType ?? '').toLowerCase();
    if (norm === 'yes_no' || norm === 'ya_tidak') {
        return (
            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-xs font-normal text-blue-700 dark:text-blue-400">
                Ya / Tidak
            </Badge>
        );
    }
    if (norm === 'scale_1_5' || norm === 'skala_1_5') {
        return (
            <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-xs font-normal text-purple-700 dark:text-purple-400">
                Skala 1-5
            </Badge>
        );
    }
    if (norm === 'text' || norm === 'teks') {
        return (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-xs font-normal text-amber-700 dark:text-amber-400">
                Teks
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="border-slate-500/40 bg-slate-500/10 text-xs font-normal text-slate-700 dark:text-slate-400">
            {answerType || 'Skala 0-100'}
        </Badge>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewerIndex({ tasks, assignments, progressReports, selectedReview, filters, masterCriteria = [] }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const taskData = tasks ?? assignments ?? progressReports;

    const [activeReview, setActiveReview] = useState<Review | null>(selectedReview ?? null);
    const [isDialogOpen, setIsDialogOpen] = useState(Boolean(selectedReview));
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');

    // Form states
    const [scoreInput, setScoreInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');
    const [recommendationInput, setRecommendationInput] = useState('');
    const [statusInput, setStatusInput] = useState('completed');
    const [criteriaInputs, setCriteriaInputs] = useState<AssessmentCriteria[]>([]);
    const [modalTab, setModalTab] = useState<'admin' | 'substansi'>('substansi');
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getProposalTitle = (proposal?: Proposal | null) => proposal?.title ?? proposal?.judul ?? 'Proposal Tanpa Judul';
    const getProposalDescription = (proposal?: Proposal | null) => proposal?.description ?? proposal?.deskripsi ?? 'Belum ada deskripsi proposal.';
    const getProposalDoc = (proposal?: Proposal | null) => proposal?.file_dokumen_proposal ?? proposal?.proposal_doc_path ?? null;

    const calculateWeightedScore = (items: AssessmentCriteria[]) => {
        if (!items || items.length === 0) return 0;
        let totalWeight = 0;
        let weightedPoints = 0;

        items.forEach((item) => {
            const w = item.weight ?? 100 / items.length;
            const rawScore = Number(item.score) || 0;
            // Discrete 1-5 scale: (rawScore / 5) * weight
            const ratio = rawScore <= 5 ? rawScore / 5 : rawScore / 100;
            weightedPoints += ratio * w;
            totalWeight += w;
        });

        if (totalWeight <= 0) return 0;
        return Math.round((weightedPoints / totalWeight) * 100 * 100) / 100;
    };

    const initializeCriteria = (task: Review): AssessmentCriteria[] => {
        const scores = task.scores || task.assessment_criteria;
        if (scores && scores.length > 0) {
            return scores.map((item) => ({
                id: item.id,
                criterion: item.criterion || (item as any).kriteria || (item as any).nama_kriteria || 'Kriteria Penilaian',
                score: Number(item.score ?? 0) > 5 ? Math.round((Number(item.score) / 100) * 5) : Number(item.score ?? 0),
                notes: item.notes ?? (item as any).komentar ?? '',
                answer_type: item.answer_type ?? 'scale_1_5',
                weight: item.weight ?? (item as any).bobot ?? 25,
            }));
        }
        if (task.komponen_penilaian && Array.isArray(task.komponen_penilaian) && task.komponen_penilaian.length > 0) {
            return task.komponen_penilaian.map((item: any, idx: number) => ({
                id: idx + 1,
                criterion: item.kriteria || item.criterion || item.nama_kriteria || 'Kriteria Penilaian',
                score:
                    Number(item.skor ?? item.score ?? 0) > 5
                        ? Math.round((Number(item.skor ?? item.score) / 100) * 5)
                        : Number(item.skor ?? item.score ?? 0),
                notes: item.komentar ?? item.komentar_indikator ?? item.notes ?? '',
                answer_type: 'scale_1_5',
                weight: Number(item.bobot ?? item.weight ?? 25),
            }));
        }
        if (masterCriteria && masterCriteria.length > 0) {
            return masterCriteria.map((item) => {
                const label = item.question || item.criterion || item.nama_kriteria || '';
                const codePrefix = item.code ? `${item.code} - ` : '';
                const criterion = label
                    ? item.code && !label.startsWith(item.code)
                        ? `${codePrefix}${label}`
                        : label
                    : (item.code ?? 'Kriteria Penilaian');

                return {
                    criterion,
                    score: 0,
                    notes: '',
                    answer_type: item.answer_type ?? 'scale_1_5',
                    weight: item.weight ?? item.bobot ?? 25,
                };
            });
        }
        return [
            { criterion: 'Rekam Jejak dan Kompetensi Tim Peneliti', score: 0, notes: '', answer_type: 'scale_1_5', weight: 20 },
            { criterion: 'Urgensi, Kebaruan, dan Tinjauan Pustaka', score: 0, notes: '', answer_type: 'scale_1_5', weight: 30 },
            { criterion: 'Kejelasan Metodologi dan Kelayakan Pelaksanaan', score: 0, notes: '', answer_type: 'scale_1_5', weight: 25 },
            { criterion: 'Potensi Dampak dan Kelayakan Target Luaran', score: 0, notes: '', answer_type: 'scale_1_5', weight: 25 },
        ];
    };

    useEffect(() => {
        if (flash?.success) setFlashMessage({ type: 'success', text: flash.success });
        else if (flash?.error) setFlashMessage({ type: 'error', text: flash.error });
        else setFlashMessage(null);
        const timer = setTimeout(() => setFlashMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [flash]);

    useEffect(() => {
        if (selectedReview) {
            setActiveReview(selectedReview);
            setIsDialogOpen(true);
            const initialCriteria = initializeCriteria(selectedReview);
            setCriteriaInputs(initialCriteria);

            const scoreVal = selectedReview.total_score ?? selectedReview.score;
            if (scoreVal !== null && scoreVal !== undefined) {
                setScoreInput(scoreVal.toString());
            } else {
                const avg = calculateWeightedScore(initialCriteria);
                setScoreInput(avg.toString());
            }

            setFeedbackInput(selectedReview.notes ?? selectedReview.feedback ?? '');
            setRecommendationInput(selectedReview.recommendation ?? '');
            setStatusInput(selectedReview.status ?? 'completed');
        }
    }, [selectedReview]);

    const openReviewDetails = (review: Review) => {
        setActiveReview(review);
        setIsDialogOpen(true);
        const initialCriteria = initializeCriteria(review);
        setCriteriaInputs(initialCriteria);

        const scoreVal = review.total_score ?? review.score;
        if (scoreVal !== null && scoreVal !== undefined) {
            setScoreInput(scoreVal.toString());
        } else {
            const avg = calculateWeightedScore(initialCriteria);
            setScoreInput(avg.toString());
        }

        setFeedbackInput(review.notes ?? review.feedback ?? '');
        setRecommendationInput(review.recommendation ?? '');
        setStatusInput(review.status ?? 'completed');
    };

    const closeReviewDetails = () => {
        setIsDialogOpen(false);
        setActiveReview(null);
    };

    const handleCriterionScoreChange = (index: number, valueStr: string) => {
        const numScore = Math.max(1, Math.min(5, Number(valueStr) || 0));
        setCriteriaInputs((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], score: numScore };
            const avg = calculateWeightedScore(next);
            setScoreInput(avg.toString());
            return next;
        });
    };

    const handleCriterionNoteChange = (index: number, value: string) => {
        setCriteriaInputs((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], notes: value };
            return next;
        });
    };

    const handleFilterChange = (val: string) => {
        setStatusFilter(val);
        router.get(route('reviewer.assignments.index'), { status: val, search: searchQuery }, { preserveState: true });
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('reviewer.assignments.index'), { status: statusFilter, search: searchQuery }, { preserveState: true });
    };

    const handleResetFilters = () => {
        setStatusFilter('');
        setSearchQuery('');
        router.get(route('reviewer.assignments.index'));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeReview) return;

        const komponen = criteriaInputs.map((item) => ({
            kriteria: item.criterion,
            bobot: item.weight ?? 25,
            skor: Number(item.score) || 0,
            komentar: item.notes || '',
            komentar_indikator: item.notes || '',
            catatan_kriteria: item.notes || '',
        }));

        router.post(
            route('reviewer.assignments.submit-review', activeReview.id),
            {
                total_score: scoreInput,
                score: scoreInput,
                skor_total: scoreInput,
                feedback: feedbackInput,
                notes: feedbackInput,
                catatan_evaluasi: feedbackInput,
                recommendation: recommendationInput,
                keputusan_rekomendasi: recommendationInput,
                status: statusInput,
                komponen_penilaian: komponen,
                assessment_criteria: criteriaInputs.map((item) => ({
                    criterion: item.criterion,
                    score: Number(item.score) || 0,
                    notes: item.notes || null,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setActiveReview(null);
                },
            },
        );
    };

    // Calculate Summary Counters
    const totalCount = taskData?.total ?? taskData?.data?.length ?? 0;
    const completedCount =
        taskData?.data?.filter((r) => (r.status ?? '').toLowerCase() === 'completed' || (r.status ?? '').toLowerCase() === 'selesai').length ?? 0;
    const pendingCount = Math.max(0, totalCount - completedCount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tugas Penilaian — Reviewer" />

            {/* Flash Message Toast */}
            {flashMessage && (
                <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl ${
                        flashMessage.type === 'success'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}
                >
                    {flashMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {flashMessage.text}
                </div>
            )}

            <div className="flex flex-col gap-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tugas Penilaian Proposal</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola evaluasi dan berikan nilai ulasan untuk proposal penelitian yang ditugaskan kepada Anda.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{totalCount} Penugasan</span>
                    </div>
                </div>

                {/* Summary Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border-border bg-card shadow-sm">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Total Penugasan</p>
                                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-sm">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Perlu Evaluasi</p>
                                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-sm">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Selesai Dinilai</p>
                                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Controls */}
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <Input
                                    id="search-tasks"
                                    type="text"
                                    placeholder="Cari judul proposal..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={handleFilterChange}>
                                <SelectTrigger id="filter-status" className="w-[180px] border-border bg-background text-sm">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Status</SelectItem>
                                    <SelectItem value="pending">Belum Dinilai</SelectItem>
                                    <SelectItem value="in_progress">Dalam Proses</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" id="btn-search-tasks">
                                Cari
                            </Button>

                            {(statusFilter || searchQuery) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleResetFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Assignments Table Card */}
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[38%] text-muted-foreground">Judul Proposal</TableHead>
                                    <TableHead className="text-muted-foreground">Status Review</TableHead>
                                    <TableHead className="text-muted-foreground">Rubrik Kriteria</TableHead>
                                    <TableHead className="text-muted-foreground">Skor Evaluasi</TableHead>
                                    <TableHead className="text-muted-foreground">Tanggal Penugasan</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!taskData || taskData.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                            <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                            <p className="text-sm font-medium">Belum ada tugas review yang ditugaskan.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    taskData.data.map((task) => {
                                        const scoreVal = task.total_score ?? task.score;
                                        return (
                                            <TableRow key={task.id} className="border-border">
                                                <TableCell>
                                                    <p className="line-clamp-2 font-medium text-foreground">{getProposalTitle(task.proposal)}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <ReviewStatusBadge status={task.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                                        {task.assessment_criteria?.length ?? 0} Indikator
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {scoreVal !== null && scoreVal !== undefined ? (
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{scoreVal} / 100</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(task.created_at).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/reviewer/assignments/${task.id}/review`}>
                                                            <Button
                                                                size="sm"
                                                                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                                                            >
                                                                <ClipboardCheck className="h-3.5 w-3.5" />
                                                                Buka Workspace
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openReviewDetails(task)}
                                                            className="border-primary/30 text-primary hover:bg-primary/10"
                                                        >
                                                            {scoreVal !== null ? 'Modal Ringkas' : 'Modal Cepat'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {taskData && taskData.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Menampilkan {(taskData.current_page - 1) * taskData.per_page + 1}–
                            {Math.min(taskData.current_page * taskData.per_page, taskData.total)} dari {taskData.total} tugas
                        </p>
                        <div className="flex items-center gap-1">
                            {taskData.links.map((link, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === taskData.links.length - 1;
                                return (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors ${
                                            link.active
                                                ? 'bg-primary font-medium text-primary-foreground'
                                                : 'border border-border bg-background text-foreground hover:bg-muted'
                                        } disabled:pointer-events-none disabled:opacity-40`}
                                    >
                                        {isFirst ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : isLast ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Evaluation Form Modal Dialog */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) closeReviewDetails();
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-xl border-border bg-card p-6 shadow-xl">
                    <DialogHeader className="border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground">{getProposalTitle(activeReview?.proposal)}</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Formulir Evaluasi & Penilaian Proposal Penelitian
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {activeReview && (
                        <div className="space-y-6 pt-2">
                            {/* Sub-Navigation Tabs */}
                            <div className="flex border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => setModalTab('admin')}
                                    className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
                                        modalTab === 'admin'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span>Hasil Verifikasi Administrasi</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalTab('substansi')}
                                    className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
                                        modalTab === 'substansi'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Award className="h-4 w-4" />
                                    <span>Lembar Evaluasi Substansi</span>
                                </button>
                            </div>

                            {/* TAB 1: HASIL VERIFIKASI ADMINISTRASI (READ-ONLY) */}
                            {modalTab === 'admin' && (
                                <div className="space-y-4">
                                    <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                                        <p className="font-semibold text-foreground">Hasil Verifikasi Administrasi Fase 1 (Read-Only)</p>
                                        <p className="mt-0.5">Daftar kelengkapan berkas yang telah diverifikasi oleh verifikator Bappeda.</p>
                                    </div>

                                    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                                        <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
                                            <span className="font-semibold text-foreground">Status Seleksi Administrasi:</span>
                                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                Lolos Seleksi Administrasi
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <span className="font-medium text-muted-foreground">Catatan Administrasi Bappeda:</span>
                                            <p className="rounded border border-border bg-muted/20 p-2 text-foreground">
                                                Seluruh berkas persyaratan telah diverifikasi lengkap dan memenuhi standar pedoman riset.
                                            </p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <span className="text-xs font-semibold text-foreground">Daftar Checklist Persyaratan:</span>
                                            <div className="divide-y divide-border rounded border border-border text-xs">
                                                <div className="flex items-center justify-between p-2.5">
                                                    <span>1. Surat Pengantar LPPM & Validasi Format Proposal</span>
                                                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Lolos (Ya)
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5">
                                                    <span>2. Rincian Anggaran Biaya (RAB) sesuai Pagu Skema</span>
                                                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Lolos (Ya)
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5">
                                                    <span>3. Surat Pernyataan Bebas Plagiarisme dan Kesanggupan</span>
                                                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Lolos (Ya)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: LEMBAR EVALUASI SUBSTANSI */}
                            {modalTab === 'substansi' && (
                                <>
                                    {/* Proposal Overview & Document Box */}
                                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                                        <div>
                                            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Deskripsi Proposal
                                            </h4>
                                            <p className="mt-1 text-sm leading-relaxed text-foreground">
                                                {getProposalDescription(activeReview.proposal)}
                                            </p>
                                        </div>

                                        {getProposalDoc(activeReview.proposal) && (
                                            <div className="flex items-center justify-between rounded-md border border-border bg-background p-2.5">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    <span className="max-w-[320px] truncate text-xs font-medium">
                                                        {getProposalDoc(activeReview.proposal)}
                                                    </span>
                                                </div>
                                                <a
                                                    href={`/storage/${getProposalDoc(activeReview.proposal)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                                                        Lihat Dokumen
                                                    </Button>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Evaluation Form */}
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Dynamic Rubric Criteria Section */}
                                        <div className="space-y-3 pt-1">
                                            <div className="flex items-center justify-between border-b border-border pb-2">
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-primary" />
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        Rincian Penilaian Rubrik Kriteria Pilihan Ganda
                                                    </h3>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {criteriaInputs.length} Indikator • Skor Terbobot Total:{' '}
                                                    <strong className="text-primary">{scoreInput || 0} / 100</strong>
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {criteriaInputs.map((item, idx) => {
                                                    const rawCriterion = item.criterion || '';
                                                    const parts = rawCriterion.includes(' - ') ? rawCriterion.split(' - ') : [];
                                                    const code = parts.length > 1 ? parts[0] : null;
                                                    const titleText = parts.length > 1 ? parts.slice(1).join(' - ') : rawCriterion;
                                                    const itemWeight = item.weight ?? 25;
                                                    const currentScore = Number(item.score) || 0;
                                                    const weightedScore = currentScore > 0 ? ((currentScore / 5) * itemWeight).toFixed(2) : '0.00';
                                                    const hasComment = (item.notes || '').trim().length > 0;

                                                    return (
                                                        <Card key={idx} className="border-border bg-card/60 shadow-none">
                                                            <CardContent className="space-y-3 p-3.5">
                                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {code && (
                                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                                {code}
                                                                            </Badge>
                                                                        )}
                                                                        <span className="text-sm font-medium text-foreground">{titleText}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                            Bobot: {itemWeight}%
                                                                        </Badge>
                                                                        <span className="font-mono text-xs font-bold text-primary">
                                                                            Nilai: {weightedScore}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Discrete 1-5 Choice Buttons (Tanpa Slider) */}
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs font-semibold text-foreground">
                                                                        Skala Penilaian (1 - 5) <span className="text-destructive">*</span>
                                                                    </Label>
                                                                    <div className="grid grid-cols-5 gap-1.5">
                                                                        {[
                                                                            { val: 1, label: 'Sangat Kurang' },
                                                                            { val: 2, label: 'Kurang' },
                                                                            { val: 3, label: 'Cukup' },
                                                                            { val: 4, label: 'Baik' },
                                                                            { val: 5, label: 'Sangat Baik' },
                                                                        ].map((opt) => (
                                                                            <Button
                                                                                key={opt.val}
                                                                                type="button"
                                                                                size="sm"
                                                                                variant={currentScore === opt.val ? 'default' : 'outline'}
                                                                                className="flex h-12 flex-col items-center justify-center p-1 text-center"
                                                                                onClick={() => handleCriterionScoreChange(idx, opt.val.toString())}
                                                                            >
                                                                                <span className="font-mono text-sm font-bold">{opt.val}</span>
                                                                                <span className="text-[10px] leading-tight text-muted-foreground group-hover:text-foreground">
                                                                                    {opt.label}
                                                                                </span>
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Mandatory Commentary per Criteria Item */}
                                                                <div className="space-y-1 pt-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            htmlFor={`notes-${idx}`}
                                                                            className="text-xs font-semibold text-foreground"
                                                                        >
                                                                            Komentar Kualitatif Butir Kriteria{' '}
                                                                            <span className="text-destructive">*</span>
                                                                        </Label>
                                                                        {hasComment && (
                                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">[VALID]</span>
                                                                        )}
                                                                    </div>
                                                                    <Input
                                                                        id={`notes-${idx}`}
                                                                        type="text"
                                                                        placeholder="Berikan catatan kualitatif untuk kriteria ini (wajib diisi)..."
                                                                        value={item.notes ?? ''}
                                                                        onChange={(e) => handleCriterionNoteChange(idx, e.target.value)}
                                                                        className={`h-9 border-border bg-background text-sm ${
                                                                            !hasComment ? 'border-amber-400 bg-amber-50/20 dark:border-amber-800/60 dark:bg-amber-950/20' : ''
                                                                        }`}
                                                                    />
                                                                    {!hasComment && (
                                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                                                            Komentar per butir kriteria wajib diisi.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 border-t border-border pt-2 md:grid-cols-2">
                                            {/* Score Input */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="score" className="text-sm font-medium text-foreground">
                                                    Skor Evaluasi Terakumulasi (0 - 100) <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="score"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={scoreInput}
                                                    readOnly
                                                    className="border-border bg-muted font-mono text-base font-bold"
                                                />
                                            </div>

                                            {/* Recommendation Input */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="recommendation" className="text-sm font-medium text-foreground">
                                                    Rekomendasi <span className="text-destructive">*</span>
                                                </Label>
                                                <Select value={recommendationInput} onValueChange={(val) => setRecommendationInput(val)}>
                                                    <SelectTrigger id="recommendation" className="border-border bg-background">
                                                        <SelectValue placeholder="Pilih Rekomendasi" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Diterima">Diterima / Didanai</SelectItem>
                                                        <SelectItem value="Revisi">Perlu Revisi</SelectItem>
                                                        <SelectItem value="Ditolak">Ditolak</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* General Qualitative Evaluation Notes */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="feedback" className="text-sm font-medium text-foreground">
                                                Catatan Evaluasi Umum (Minimal 50 Karakter) <span className="text-destructive">*</span>
                                            </Label>
                                            <Textarea
                                                id="feedback"
                                                rows={3}
                                                placeholder="Tuliskan catatan evaluasi substantif dan pertimbangan rekomendasi..."
                                                value={feedbackInput}
                                                onChange={(e) => setFeedbackInput(e.target.value)}
                                                className="border-border bg-background text-sm"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                                            <Button type="button" variant="outline" onClick={closeReviewDetails}>
                                                Batal
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    !criteriaInputs.every((it) => Number(it.score) >= 1 && (it.notes || '').trim().length > 0) ||
                                                    feedbackInput.trim().length < 50 ||
                                                    !recommendationInput
                                                }
                                            >
                                                Simpan Penilaian
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
