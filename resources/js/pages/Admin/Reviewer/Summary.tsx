/**
 * ReviewSummary – Research Proposal Review Recapitulation & Decision
 *
 * @description
 * Analytical review summary for institutional LPPM administrators and Super Admin.
 * Aggregates multi-reviewer rubric scores, pass recommendations, and facilitates final
 * funding approval/rejection decisions.
 *
 * @filepath resources/js/pages/Admin/Reviewer/Summary.tsx
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { MetricCard } from '@/components/ui/MetricCard';
import PageHeader from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Award, CheckCircle2, FileText, Layers, Search, UserCheck, X, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ReviewerDetail {
    id: number;
    reviewer_name: string;
    status: string;
    score: number | null;
    recommendation: string | null;
    notes: string | null;
}

interface ProposalSummaryItem {
    id: number;
    judul: string;
    status_proposal: string;
    rejection_reason?: string | null;
    author_name: string;
    university_name: string;
    schema_name: string;
    total_reviews: number;
    completed_reviews: number;
    avg_score: number | null;
    recommendations: Record<string, number>;
    reviewers: ReviewerDetail[];
}

interface ProposalSummaryData {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    avg_score: number | null;
    proposals: ProposalSummaryItem[];
}

interface FilterOption {
    value: number | string;
    label: string;
}

interface FilterOptions {
    pembinaan?: FilterOption[];
    universities?: FilterOption[];
    status_options?: { value: string; label: string }[];
    periods?: { value: string; label: string }[];
}

interface Filters {
    university_id?: string;
    status?: string;
    search?: string;
}

interface Props {
    proposalSummary?: ProposalSummaryData;
    filterOptions?: FilterOptions;
    filters?: Filters;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewSummary({ proposalSummary, filterOptions = {}, filters = {} }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.adminReviewsSummary.pageTitle, href: '/admin/reviews/summary' },
    ];

    // Filters
    const [search, setSearch] = useState(filters.search ?? '');
    const [universityId, setUniversityId] = useState(filters.university_id ?? '');

    // Decision Modal
    const [selectedProposal, setSelectedProposal] = useState<ProposalSummaryItem | null>(null);
    const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
    const [decisionValue, setDecisionValue] = useState<'approved' | 'rejected'>('approved');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('admin.reviews.summary'), { search, university_id: universityId }, { preserveState: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        setUniversityId('');
        router.get(route('admin.reviews.summary'));
    };

    const openDecisionModal = (proposal: ProposalSummaryItem) => {
        setSelectedProposal(proposal);
        setDecisionValue(proposal.status_proposal.toLowerCase() === 'ditolak' ? 'rejected' : 'approved');
        setRejectionReason(proposal.rejection_reason ?? '');
        setIsDecisionModalOpen(true);
    };

    const handleDecisionSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedProposal) return;

        setIsSubmitting(true);
        router.post(
            route('admin.decision.decide'),
            {
                type: 'proposal',
                id: selectedProposal.id,
                decision: decisionValue,
                reason: decisionValue === 'rejected' ? rejectionReason : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDecisionModalOpen(false);
                    setSelectedProposal(null);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Prop statistics fallback
    const propTotal = proposalSummary?.total ?? 0;
    const propApproved = proposalSummary?.approved ?? 0;
    const propRejected = proposalSummary?.rejected ?? 0;
    const propAvgScore = proposalSummary?.avg_score ?? 0;
    const proposalsList = proposalSummary?.proposals ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminReviewsSummary.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Page Header */}
                <PageHeader
                    title={t.adminReviewsSummary.pageTitle}
                    subtitle={t.adminReviewsSummary.pageSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                {/* Summary Stat Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.adminReviewsSummary.statTotalProposals}
                        value={propTotal}
                        type="integer"
                        icon={Layers}
                        iconBgClass="bg-blue-50"
                        iconColorClass="text-blue-900"
                    />

                    <MetricCard
                        title={t.adminReviewsSummary.statApproved}
                        value={propApproved}
                        type="integer"
                        icon={CheckCircle2}
                        iconBgClass="bg-emerald-50"
                        iconColorClass="text-emerald-700"
                    />

                    <MetricCard
                        title={t.adminReviewsSummary.statRejected}
                        value={propRejected}
                        type="integer"
                        icon={XCircle}
                        iconBgClass="bg-rose-50"
                        iconColorClass="text-rose-700"
                    />

                    <MetricCard
                        title={t.adminReviewsSummary.statAvgScore}
                        value={Number(propAvgScore).toFixed(2)}
                        type="score"
                        icon={Award}
                        iconBgClass="bg-amber-50"
                        iconColorClass="text-amber-700"
                    />
                </div>

                {/* Filter Bar */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2">
                                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                <Input
                                    id="search-proposal"
                                    type="text"
                                    placeholder={t.adminReviewsSummary.searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-auto border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
                                />
                            </div>

                            {filterOptions.universities && filterOptions.universities.length > 0 && (
                                <Select value={universityId} onValueChange={(val) => setUniversityId(val)}>
                                    <SelectTrigger className="w-[200px] border-slate-300 bg-white text-sm">
                                        <SelectValue placeholder={t.navigation.universities} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{t.adminReviewsSummary.allStatuses}</SelectItem>
                                        {filterOptions.universities.map((u) => (
                                            <SelectItem key={u.value} value={String(u.value)}>
                                                {u.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Button type="submit" className="bg-blue-900 text-white hover:bg-blue-800">
                                {t.common.filter}
                            </Button>

                            {(search || universityId) && (
                                <Button type="button" variant="ghost" onClick={handleResetFilters} className="text-slate-500 hover:text-slate-800">
                                    <X className="mr-1.5 h-3.5 w-3.5" /> {t.common.reset}
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Proposal Analytical Summary Table */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-base font-bold text-slate-900">{t.adminReviewsSummary.pageTitle}</CardTitle>
                        <CardDescription className="text-xs text-slate-500">{t.adminReviewsSummary.pageSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                                    <TableHead className="w-[30%] text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColTitle}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColSchema}
                                    </TableHead>
                                    <TableHead className="text-center text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColReviewers}
                                    </TableHead>
                                    <TableHead className="text-center text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColAvgScore}
                                    </TableHead>
                                    <TableHead className="text-center text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColDecision}
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.tableColActions}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposalsList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                                            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                            <p className="text-sm font-medium">{t.adminReviewsSummary.emptyTitle}</p>
                                            <p className="mt-1 text-xs text-slate-400">{t.adminReviewsSummary.emptySubtitle}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    proposalsList.map((item) => (
                                        <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                            <TableCell>
                                                <p className="line-clamp-2 font-medium text-slate-900">{item.judul}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.author_name} • {item.university_name}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-slate-300 bg-slate-50 font-normal text-slate-700">
                                                    {item.schema_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {item.completed_reviews} / {item.total_reviews}
                                                    </span>
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {item.reviewers?.map((r) => (
                                                            <Badge
                                                                key={r.id}
                                                                variant="secondary"
                                                                className="px-1.5 py-0 text-[10px] font-normal"
                                                                title={r.notes ?? 'Reviewer'}
                                                            >
                                                                {r.reviewer_name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.avg_score !== null ? (
                                                    <span className="font-mono font-bold text-slate-900">
                                                        {Number(item.avg_score).toFixed(2)} / 100
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusBadge status={item.status_proposal} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openDecisionModal(item)}
                                                    className="gap-1.5 border-blue-900 text-blue-900 hover:bg-blue-50"
                                                >
                                                    <UserCheck className="h-3.5 w-3.5" />
                                                    {t.adminReviewsSummary.decideBtn}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Decision Modal Dialog */}
            <Dialog open={isDecisionModalOpen} onOpenChange={setIsDecisionModalOpen}>
                <DialogContent className="max-w-md rounded-xl border-slate-200 bg-white p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">{t.adminReviewsSummary.decisionModalTitle}</DialogTitle>
                        <DialogDescription className="line-clamp-2 text-xs text-slate-500">{selectedProposal?.judul}</DialogDescription>
                    </DialogHeader>

                    {selectedProposal && (
                        <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
                            {/* Summary of Reviewers */}
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t.adminProposals.tableColAuthor}:</span>
                                    <span className="font-medium text-slate-900">{selectedProposal.author_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t.adminReviewsSummary.tableColAvgScore}:</span>
                                    <span className="font-mono font-bold text-emerald-700">
                                        {selectedProposal.avg_score !== null ? Number(selectedProposal.avg_score).toFixed(2) : '-'} / 100
                                    </span>
                                </div>
                            </div>

                            {/* Decision Select */}
                            <div className="space-y-1.5">
                                <Label htmlFor="decision-select" className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                    {t.adminReviewsSummary.tableColDecision} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={decisionValue} onValueChange={(val: 'approved' | 'rejected') => setDecisionValue(val)}>
                                    <SelectTrigger id="decision-select" className="border-slate-300 bg-white text-sm">
                                        <SelectValue placeholder={t.adminReviewsSummary.decideBtn} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approved">{t.adminReviewsSummary.decisionOptionApprove}</SelectItem>
                                        <SelectItem value="rejected">{t.adminReviewsSummary.decisionOptionReject}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Rejection Reason (Required if rejected) */}
                            {decisionValue === 'rejected' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="rejection-reason" className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminReviewsSummary.decisionNotesLabel} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="rejection-reason"
                                        rows={3}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder={t.adminReviewsSummary.decisionNotesPlaceholder}
                                        required
                                        minLength={10}
                                        className="resize-none border-slate-300 bg-white text-sm text-slate-900"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                <Button type="button" variant="outline" onClick={() => setIsDecisionModalOpen(false)}>
                                    {t.common.cancel}
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-900 text-white hover:bg-blue-800">
                                    {isSubmitting ? t.common.loading : t.adminReviewsSummary.confirmDecisionBtn}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
