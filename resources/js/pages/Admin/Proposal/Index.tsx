/**
 * Admin/Proposal/Index — Institutional Research Proposal Governance
 *
 * @description
 * Proposal monitoring, administrative validation, reviewer assignment,
 * and lifecycle management for LPPM / Admin Kampus.
 *
 * @filepath resources/js/pages/Admin/Proposal/Index.tsx
 */

import ActionButtons from '@/components/ActionButtons';
import AssignModal from '@/components/AssignModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import PageHeader from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, FileText, Search, UserCheck, UserX, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface ProposalUser {
    id: number;
    name: string;
    email: string;
}

interface ResearchSchema {
    id: number;
    name: string;
}

interface ProposalReviewer {
    id: number;
    name: string;
}

interface Proposal {
    id: number;
    title: string;
    description: string;
    status_proposal: string;
    rejection_reason: string | null;
    file_dokumen_proposal: string | null;
    user: ProposalUser | null;
    research_schema: ResearchSchema | null;
    has_reviewer?: boolean;
    reviewers?: ProposalReviewer[];
    reviews?: { id: number; reviewer_id: number; reviewer_name?: string }[];
    created_at: string;
}

interface FilterOption {
    value: string;
    label: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ProposalsPaginated {
    data: Proposal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    proposals: ProposalsPaginated;
    filters: {
        search?: string;
        status?: string;
    };
    statusOptions: FilterOption[];
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
    const { t, format } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({ rejection_reason: '' });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.proposals.reject', { proposal: proposal.id }), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{t.adminProposals.rejectModalTitle}</h2>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{proposal.title}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="rejection_reason" className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase">
                            {t.adminProposals.rejectReasonLabel} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="rejection_reason"
                            ref={textareaRef}
                            rows={4}
                            value={data.rejection_reason}
                            onChange={(e) => setData('rejection_reason', e.target.value)}
                            placeholder={t.adminProposals.rejectReasonPlaceholder}
                            className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden ${
                                errors.rejection_reason ? 'border-rose-500' : 'border-slate-300'
                            }`}
                        />
                        {errors.rejection_reason && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                                <AlertTriangle className="h-3 w-3" />
                                {errors.rejection_reason}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">{format(t.adminProposals.charCount, { count: data.rejection_reason.length })}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing || data.rejection_reason.length < 10}>
                            {processing ? t.common.loading : t.adminProposals.confirmRejectBtn}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProposalIndex({ proposals, filters, statusOptions }: Props) {
    const { t } = useTranslation();
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [rejectTarget, setRejectTarget] = useState<Proposal | null>(null);
    const [assignTarget, setAssignTarget] = useState<Proposal | null>(null);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.adminProposals.pageTitle, href: '/admin/proposals' },
    ];

    useEffect(() => {
        if (flash?.success) setFlashMessage({ type: 'success', text: flash.success });
        else if (flash?.error) setFlashMessage({ type: 'error', text: flash.error });
        else setFlashMessage(null);
        const timer = setTimeout(() => setFlashMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [flash]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.proposals.index'), { search, status: statusFilter }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        router.get(route('admin.proposals.index'));
    };

    const handleConfirmAssign = () => {
        if (!assignTarget) return;
        const targetId = assignTarget.id;
        setAssignTarget(null);
        router.get('/admin/reviewer/assign', { proposal_id: targetId });
    };

    const handleUnassign = (proposal: Proposal) => {
        if (!proposal.reviews || proposal.reviews.length === 0) return;
        const reviewId = proposal.reviews[0].id;
        if (confirm(t.adminProposals.confirmUnassign)) {
            router.delete(route('admin.assign.unassign', { id: reviewId }), {
                preserveScroll: true,
            });
        }
    };

    const hasActiveFilters = !!(search || statusFilter);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminProposals.pageTitle} />

            {/* Flash Message */}
            {flashMessage && (
                <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
                        flashMessage.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                >
                    {flashMessage.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    {flashMessage.text}
                </div>
            )}

            {/* Reject Modal */}
            {rejectTarget && <RejectModal proposal={rejectTarget} onClose={() => setRejectTarget(null)} />}

            {/* Assign Modal */}
            <AssignModal
                open={!!assignTarget}
                onClose={() => setAssignTarget(null)}
                onConfirm={handleConfirmAssign}
                proposalTitle={assignTarget?.title}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <PageHeader
                    title={t.adminProposals.pageTitle}
                    subtitle={t.adminProposals.pageSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                {/* Filters */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
                            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2">
                                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                <Input
                                    id="search-proposals"
                                    type="text"
                                    placeholder={t.adminProposals.searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-auto border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="filter-status" className="w-[200px] border-slate-300 bg-white text-sm">
                                    <SelectValue placeholder={t.adminProposals.allStatuses} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t.adminProposals.allStatuses}</SelectItem>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="submit" id="btn-search-proposals" className="bg-blue-900 text-white hover:bg-blue-800">
                                {t.common.filter}
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                    className="shrink-0 text-slate-500 hover:text-slate-800"
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    {t.common.reset}
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                                    <TableHead className="w-[30%] text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColTitle}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColAuthor}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminSchema.pageTitle}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColStatus}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColReviewers}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColDate}
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColActions}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposals.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                                            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                            <p className="text-sm font-medium">{t.adminProposals.emptyTitle}</p>
                                            <p className="mt-1 text-xs text-slate-400">{t.adminProposals.emptySubtitle}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    proposals.data.map((proposal) => (
                                        <TableRow key={proposal.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                            <TableCell>
                                                <p className="line-clamp-2 font-medium text-slate-900">{proposal.title}</p>
                                            </TableCell>
                                            <TableCell>
                                                {proposal.user ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{proposal.user.name}</p>
                                                        <p className="text-xs text-slate-500">{proposal.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700">
                                                    {proposal.research_schema?.name ?? <span className="text-slate-400">-</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={proposal.status_proposal} />
                                            </TableCell>
                                            <TableCell>
                                                {proposal.status_proposal === 'Administrasi_Valid' ? (
                                                    proposal.has_reviewer && proposal.reviewers && proposal.reviewers.length > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit gap-1 border-emerald-300 bg-emerald-50 font-normal text-emerald-800"
                                                            title={proposal.reviewers.map((r) => r.name).join(', ')}
                                                        >
                                                            <UserCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                                                            <span className="max-w-[130px] truncate">
                                                                {proposal.reviewers.map((r) => r.name).join(', ')}
                                                            </span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit gap-1 border-amber-300 bg-amber-50 font-normal text-amber-800"
                                                        >
                                                            <UserX className="h-3 w-3 shrink-0 text-amber-600" />
                                                            {t.adminProposals.badgeWaitingReview}
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {new Date(proposal.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ActionButtons
                                                    proposalId={proposal.id}
                                                    proposalTitle={proposal.title}
                                                    status={proposal.status_proposal}
                                                    hasReviewer={!!proposal.has_reviewer}
                                                    onReject={() => setRejectTarget(proposal)}
                                                    onAssign={() => setAssignTarget(proposal)}
                                                    onUnassign={() => handleUnassign(proposal)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {proposals.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            {(proposals.current_page - 1) * proposals.per_page + 1}-
                            {Math.min(proposals.current_page * proposals.per_page, proposals.total)} of {proposals.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {proposals.links.map((link, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === proposals.links.length - 1;
                                return (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors ${
                                            link.active
                                                ? 'bg-blue-900 text-white'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
        </AppLayout>
    );
}
