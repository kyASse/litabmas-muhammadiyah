/**
 * Admin/Proposal/Index — Institutional Research Proposal Governance
 *
 * @description
 * Proposal monitoring, administrative validation, reviewer assignment,
 * and lifecycle management for Super Admin / Admin Kampus.
 *
 * @filepath resources/js/pages/Admin/Proposal/Index.tsx
 */

import ActionButtons from '@/components/ActionButtons';
import AssignModal from '@/components/AssignModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = auth?.user?.role?.name === 'Super Admin' || auth?.user?.roles?.some((r) => r.name === 'Super Admin');
    const isCampusReject = !isSuperAdmin || proposal.status_proposal === 'Submitted_Kampus' || proposal.status_proposal === 'Submitted';

    const { data, setData, post, processing, errors, reset } = useForm({
        rejection_reason: '',
        catatan_penolakan: '',
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetRoute = isCampusReject
            ? route('admin.proposals.campus-reject', { proposal: proposal.id })
            : route('admin.proposals.reject', { proposal: proposal.id });

        post(targetRoute, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {isCampusReject ? t.adminProposals.campusRejectModalTitle : t.adminProposals.rejectModalTitle}
                        </h2>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {isCampusReject ? t.adminProposals.campusRejectModalSubtitle : proposal.title}
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="rejection_reason" className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                            {t.adminProposals.rejectReasonLabel} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="rejection_reason"
                            ref={textareaRef}
                            rows={4}
                            value={data.rejection_reason}
                            onChange={(e) => {
                                setData('rejection_reason', e.target.value);
                                setData('catatan_penolakan', e.target.value);
                            }}
                            placeholder={t.adminProposals.rejectReasonPlaceholder}
                            className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden dark:bg-neutral-950 dark:text-slate-100 ${
                                errors.rejection_reason || errors.catatan_penolakan ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-800'
                            }`}
                        />
                        {(errors.rejection_reason || errors.catatan_penolakan) && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="h-3 w-3" />
                                {errors.rejection_reason || errors.catatan_penolakan}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">{format(t.adminProposals.charCount, { count: data.rejection_reason.length })}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing || data.rejection_reason.length < 5}>
                            {processing ? t.common.loading : (isCampusReject ? t.adminProposals.campusRejectBtn : t.adminProposals.confirmRejectBtn)}
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
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
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
                {/* Header: Bersih tanpa duplikasi breadcrumb dan language switcher */}
                <PageHeader
                    title={t.adminProposals.pageTitle}
                    subtitle={t.adminProposals.pageSubtitle}
                />

                {/* Filters */}
                <Card className="border-sidebar-border/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-sidebar-border dark:bg-neutral-950/70">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Search input */}
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search-proposals"
                                    type="text"
                                    placeholder={t.adminProposals.searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 border-sidebar-border bg-white pl-9 text-sm dark:bg-neutral-900"
                                />
                            </div>

                            {/* Status filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    router.get(route('admin.proposals.index'), { search, status: val }, { preserveState: true });
                                }}
                            >
                                <SelectTrigger id="filter-status" className="h-10 w-full sm:w-[200px] border-sidebar-border bg-white text-sm dark:bg-neutral-900">
                                    <SelectValue placeholder={t.adminProposals.allStatuses} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.adminProposals.allStatuses}</SelectItem>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Buttons */}
                            <Button type="submit" id="btn-search-proposals" className="h-10 bg-blue-900 text-white hover:bg-blue-800 px-5 font-semibold">
                                {t.common.filter}
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                    className="h-10 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    {t.common.reset}
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table Container */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/60 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-950">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="border-b border-sidebar-border/60 bg-neutral-50/50 hover:bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <TableHead className="w-[28%] min-w-[220px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColTitle}
                                    </TableHead>
                                    <TableHead className="w-[18%] min-w-[160px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColAuthor}
                                    </TableHead>
                                    <TableHead className="w-[18%] min-w-[160px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColSchema}
                                    </TableHead>
                                    <TableHead className="w-[12%] min-w-[120px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColStatus}
                                    </TableHead>
                                    <TableHead className="w-[12%] min-w-[130px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColReviewers}
                                    </TableHead>
                                    <TableHead className="w-[8%] min-w-[85px] text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColDate}
                                    </TableHead>
                                    <TableHead className="w-[110px] min-w-[110px] text-right text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.adminProposals.tableColActions}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposals.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <FileText className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                                            <p className="text-sm font-medium">{t.adminProposals.emptyTitle}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{t.adminProposals.emptySubtitle}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    proposals.data.map((proposal) => (
                                        <TableRow key={proposal.id} className="border-b border-sidebar-border/40 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                            {/* Judul Proposal */}
                                            <TableCell className="align-middle py-3.5">
                                                <Link
                                                    href={route('admin.proposals.show', { proposal: proposal.id })}
                                                    className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-900 dark:text-slate-100 dark:hover:text-blue-400"
                                                    title={proposal.title}
                                                >
                                                    {proposal.title}
                                                </Link>
                                            </TableCell>

                                            {/* Pengusul Utama */}
                                            <TableCell className="align-middle py-3.5">
                                                {proposal.user ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{proposal.user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[190px]" title={proposal.user.email}>
                                                            {proposal.user.email}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>

                                            {/* Skema Penelitian */}
                                            <TableCell className="align-middle py-3.5">
                                                <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                                    {proposal.research_schema?.name ?? <span className="text-muted-foreground">-</span>}
                                                </span>
                                            </TableCell>

                                            {/* Status Proposal */}
                                            <TableCell className="align-middle py-3.5">
                                                <StatusBadge status={proposal.status_proposal} />
                                            </TableCell>

                                            {/* Reviewer Ditugaskan */}
                                            <TableCell className="align-middle py-3.5">
                                                {proposal.status_proposal === 'Administrasi_Valid' ? (
                                                    proposal.has_reviewer && proposal.reviewers && proposal.reviewers.length > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit gap-1 border-emerald-300 bg-emerald-50 text-xs font-normal text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                            title={proposal.reviewers.map((r) => r.name).join(', ')}
                                                        >
                                                            <UserCheck className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                            <span className="max-w-[120px] truncate">
                                                                {proposal.reviewers.map((r) => r.name).join(', ')}
                                                            </span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit gap-1 border-amber-300 bg-amber-50 text-xs font-normal text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                                        >
                                                            <UserX className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                                                            {t.adminProposals.badgeWaitingReview}
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>

                                            {/* Tanggal Pengajuan */}
                                            <TableCell className="align-middle py-3.5 text-xs text-muted-foreground tabular-nums">
                                                {new Date(proposal.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </TableCell>

                                            {/* Aksi */}
                                            <TableCell className="align-middle py-3.5 text-right">
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
                    </div>

                    {/* Pagination */}
                    {proposals.last_page > 1 && (
                        <div className="border-t border-sidebar-border/60 px-6 py-4 dark:border-sidebar-border">
                            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                                <p className="text-center text-sm text-muted-foreground md:text-left">
                                    Menampilkan {(proposals.current_page - 1) * proposals.per_page + 1} – {Math.min(proposals.current_page * proposals.per_page, proposals.total)} dari {proposals.total} proposal
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {proposals.links.map((link, idx) => {
                                        if (link.url === null) return null;
                                        const isFirst = idx === 0;
                                        const isLast = idx === proposals.links.length - 1;

                                        return (
                                            <Link key={idx} href={link.url} preserveState preserveScroll>
                                                <Button
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={
                                                        link.active
                                                            ? 'bg-blue-900 hover:bg-blue-800 text-white'
                                                            : 'text-muted-foreground'
                                                    }
                                                >
                                                    {isFirst ? (
                                                        <ChevronLeft className="h-4 w-4" />
                                                    ) : isLast ? (
                                                        <ChevronRight className="h-4 w-4" />
                                                    ) : (
                                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    )}
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
