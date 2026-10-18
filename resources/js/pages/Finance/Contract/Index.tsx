import React, { useState, FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/ui/PageHeader';
import TabularFigure from '@/components/ui/TabularFigure';
import StatusBadge, { BadgeStatusType } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { BreadcrumbItem } from '@/types';
import {
    FileText,
    Search,
    FilterX,
    PlusCircle,
    Building2,
    User,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    UploadCloud,
    AlertTriangle,
    Layers,
    DollarSign,
    CheckCircle2,
} from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface University {
    id: number;
    name: string;
    short_name?: string | null;
    code: string;
}

interface ProposalItem {
    id: number;
    judul_penelitian: string;
    status_proposal: string;
    biaya_yang_diusulkan?: number;
    research_schema?: {
        id: number;
        nama_skema: string;
        biaya_maksimal: number;
    } | null;
    pengusul?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface ContractItem {
    id: number;
    nomor_kontrak: string;
    contract_number: string;
    judul_kontrak: string;
    title: string;
    status: string;
    status_kontrak: string;
    status_label: string;
    status_color: string;
    dana_disetujui: number;
    contract_value: number;
    party_1: string | null;
    party_2: string | null;
    funding_total: number;
    disbursed_total: number;
    funding_progress: number;
    fundings_count: number;
    tanggal_kontrak?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    signed_at?: string | null;
    created_at: string;
    university: University;
    proposal?: ProposalItem | null;
}

interface EligibleProposal {
    id: number;
    judul_penelitian: string;
    pengusul_nama?: string | null;
    skema_nama?: string | null;
    biaya_diusulkan: number;
    pagu_maksimal: number;
}

interface FilterOption {
    value: string;
    label: string;
}

interface Props {
    contracts: Paginated<ContractItem>;
    filters: {
        search?: string;
        status?: string;
        university_id?: number | string;
    };
    summary: {
        total_contracts: number;
        contract_value: number;
        disbursed_value: number;
        outstanding_value: number;
    };
    universities: University[];
    eligibleProposals?: EligibleProposal[];
    statusOptions: FilterOption[];
}

function mapStatusToBadge(status: string): { type: BadgeStatusType; label: string } {
    const s = status.toLowerCase();
    if (s === 'draft') return { type: 'Draft', label: '[DRAFT]' };
    if (s === 'active' || s === 'aktif') return { type: 'Contracted', label: '[ACTIVE]' };
    if (s === 'signed' || s === 'ditandatangani') return { type: 'Contracted', label: '[SIGNED]' };
    if (s === 'selesai' || s === 'completed') return { type: 'Completed_SKTS', label: '[SELESAI]' };
    if (s === 'dibatalkan' || s === 'terminated') return { type: 'Terminated', label: '[DIBATALKAN]' };
    return { type: 'Draft', label: `[${status.toUpperCase()}]` };
}

export default function ContractIndex({
    contracts,
    filters,
    summary,
    universities,
    eligibleProposals = [],
    statusOptions,
}: Props) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [universityId, setUniversityId] = useState(filters.university_id?.toString() || '');
    const [issueModalOpen, setIssueModalOpen] = useState(false);

    // Form Penerbitan Kontrak dengan Budget Cut Adjustment
    const {
        data: issueData,
        setData: setIssueData,
        post: postIssue,
        processing: issueProcessing,
        errors: issueErrors,
        reset: resetIssue,
    } = useForm({
        id_proposal: '',
        dana_disetujui: '',
        tanggal_kontrak: new Date().toISOString().split('T')[0],
        nomor_kontrak: '',
    });

    const selectedProposal = eligibleProposals.find((p) => p.id.toString() === issueData.id_proposal);

    const handleProposalChange = (proposalId: string) => {
        setIssueData((prev) => {
            const found = eligibleProposals.find((p) => p.id.toString() === proposalId);
            return {
                ...prev,
                id_proposal: proposalId,
                dana_disetujui: found ? found.biaya_diusulkan.toString() : '',
            };
        });
    };

    const handleIssueSubmit = (e: FormEvent) => {
        e.preventDefault();
        postIssue(route('finance.contracts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIssueModalOpen(false);
                resetIssue();
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/dashboard',
        },
        {
            title: t.contracts.pageTitle,
            href: '/contracts',
        },
    ];

    const hasActiveFilters = Boolean(search || status || universityId);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            route('finance.contracts.index'),
            {
                search,
                status,
                university_id: universityId,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setUniversityId('');
        router.get(route('finance.contracts.index'));
    };

    const cleanPaginationLabel = (label: string) => {
        return label.replace('&laquo;', '').replace('&raquo;', '').trim();
    };

    // Kalkulasi pemotongan anggaran (Budget Cut)
    const proposedNum = selectedProposal?.biaya_diusulkan || 0;
    const approvedNum = parseFloat(issueData.dana_disetujui) || 0;
    const paguNum = selectedProposal?.pagu_maksimal || 0;
    const isPaguExceeded = paguNum > 0 && approvedNum > paguNum;
    const budgetCutAmount = proposedNum - approvedNum;
    const budgetCutPercent = proposedNum > 0 ? ((budgetCutAmount / proposedNum) * 100).toFixed(1) : '0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.contracts.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PageHeader
                        title={t.contracts.pageTitle}
                        subtitle={t.contracts.pageSubtitle}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIssueModalOpen(true)}
                            className="bg-slate-900 text-white hover:bg-slate-800 gap-2 font-medium"
                        >
                            <PlusCircle className="h-4 w-4" />
                            {t.contracts.issueContractBtn}
                        </Button>
                    </div>
                </div>

                {/* Ringkasan Finansial Kontrak */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            {t.contracts.totalContracts}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-2xl font-bold text-slate-900">
                                {summary.total_contracts}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                {t.contracts.contractsMatchingFilter.replace('{total}', String(contracts.total))}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            {t.contracts.approvedContractValue}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={summary.contract_value}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-slate-900 font-semibold"
                            />
                            <span className="text-xs text-slate-500 font-mono">
                                {t.contracts.accumulatedValue}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            {t.contracts.realizedFunding}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={summary.disbursed_value}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-emerald-700 font-semibold"
                            />
                            <span className="text-xs text-emerald-600 font-mono">
                                {t.contracts.disbursedToResearchers}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            {t.contracts.outstandingFunding}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={summary.outstanding_value}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-amber-700 font-semibold"
                            />
                            <span className="text-xs text-amber-600 font-mono">
                                {t.contracts.unrealized}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <form onSubmit={submitFilters} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_240px_auto]">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.contracts.searchPlaceholder}
                                className="pl-9 text-sm font-sans"
                            />
                        </div>

                        <Select value={status || 'all'} onValueChange={(val) => setStatus(val === 'all' ? '' : val)}>
                            <SelectTrigger className="text-sm font-sans">
                                <SelectValue placeholder={t.contracts.filterStatus} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.contracts.allStatuses}</SelectItem>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={universityId || 'all'} onValueChange={(val) => setUniversityId(val === 'all' ? '' : val)}>
                            <SelectTrigger className="text-sm font-sans">
                                <SelectValue placeholder={t.contracts.allUniversities} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.contracts.allUniversities}</SelectItem>
                                {universities.map((u) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.short_name || u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Button type="submit" variant="default" className="gap-2 bg-slate-900 hover:bg-slate-800">
                                <Search className="h-4 w-4" />
                                {t.common.filter}
                            </Button>
                            {hasActiveFilters && (
                                <Button type="button" variant="outline" size="icon" onClick={clearFilters} aria-label="Reset filter">
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Tabel Kontrak */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80">
                                <TableHead className="w-12 text-center">{t.contracts.tableColNo}</TableHead>
                                <TableHead>{t.contracts.tableColNumber} & {t.contracts.tableColProposal}</TableHead>
                                <TableHead>{t.contracts.institution} & {t.contracts.leadResearcher}</TableHead>
                                <TableHead className="text-right">{t.contracts.paguOrProposed}</TableHead>
                                <TableHead className="text-right">{t.contracts.tableColApprovedBudget}</TableHead>
                                <TableHead className="min-w-44">{t.contracts.disbursementRealization}</TableHead>
                                <TableHead>{t.contracts.tableColStatus}</TableHead>
                                <TableHead className="text-center">{t.contracts.tableColActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-medium">{t.contracts.emptyList}</p>
                                        <p className="text-xs text-slate-400 mt-1">{t.contracts.emptySubtitle}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contracts.data.map((contract, index) => {
                                    const badgeInfo = mapStatusToBadge(contract.status_kontrak || contract.status);
                                    const maxBudget = contract.proposal?.research_schema?.biaya_maksimal || 0;
                                    const proposedBudget = contract.proposal?.biaya_yang_diusulkan || 0;

                                    return (
                                        <TableRow key={contract.id} className="hover:bg-slate-50/60">
                                            <TableCell className="text-center font-mono text-xs text-slate-500">
                                                {(contracts.current_page - 1) * contracts.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="min-w-64 max-w-sm">
                                                <div className="space-y-1">
                                                    <Link
                                                        href={route('finance.contracts.show', contract.id)}
                                                        className="font-mono text-xs font-semibold text-sky-800 hover:underline block"
                                                    >
                                                        {contract.nomor_kontrak || contract.contract_number}
                                                    </Link>
                                                    <p className="font-medium text-xs text-slate-900 line-clamp-2">
                                                        {contract.judul_kontrak || contract.title}
                                                    </p>
                                                    {contract.proposal?.research_schema && (
                                                        <span className="inline-block text-[11px] font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            {contract.proposal.research_schema.nama_skema}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-44">
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-medium text-slate-800 flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{contract.proposal?.pengusul?.name || contract.party_2 || '-'}</span>
                                                    </p>
                                                    <p className="text-slate-500 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{contract.university.short_name || contract.university.name}</span>
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="space-y-1">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.contracts.paguLabel}</span>
                                                        <TabularFigure
                                                            value={maxBudget}
                                                            type="currency"
                                                            size="sm"
                                                            className="text-slate-600 font-medium"
                                                        />
                                                    </div>
                                                    {proposedBudget > 0 && (
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.contracts.proposedLabel}</span>
                                                            <TabularFigure
                                                                value={proposedBudget}
                                                                type="currency"
                                                                size="sm"
                                                                className="text-slate-500 text-xs"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TabularFigure
                                                    value={contract.dana_disetujui || contract.contract_value}
                                                    type="currency"
                                                    size="sm"
                                                    weight="bold"
                                                    className="text-slate-900"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <TabularFigure
                                                            value={contract.disbursed_total}
                                                            type="currency"
                                                            size="sm"
                                                            className="text-slate-600"
                                                        />
                                                        <span className="font-mono text-xs font-semibold text-slate-700">
                                                            {contract.funding_progress}%
                                                        </span>
                                                    </div>
                                                    <Progress value={contract.funding_progress} className="h-1.5" />
                                                    <p className="text-[11px] text-slate-500 font-mono">
                                                        {t.contracts.tranchesDisbursementCount.replace('{count}', String(contract.fundings_count))}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={badgeInfo.type}
                                                    size="sm"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link
                                                    href={route('finance.contracts.show', contract.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <span>{t.contracts.viewDetailBtn}</span>
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {contracts.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-mono text-slate-500">
                            {t.contracts.pageOf.replace('{current}', String(contracts.current_page)).replace('{last}', String(contracts.last_page)).replace('{total}', String(contracts.total))}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {contracts.links.map((link, index) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button
                                            key={index}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className="text-xs h-8"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                            Prev
                                        </Button>
                                    );
                                }

                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <Button
                                            key={index}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className="text-xs h-8"
                                        >
                                            Next
                                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={index}
                                        type="button"
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url)}
                                        className="text-xs h-8 px-3"
                                    >
                                        {cleanPaginationLabel(link.label)}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Penerbitan Kontrak dengan Budget Cut Adjustment */}
            <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
                <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif font-bold text-slate-900 tracking-tight">
                            {t.contracts.createTitle}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600">
                            {t.contracts.createSubtitle}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleIssueSubmit} className="space-y-4 pt-2">
                        {/* Pilih Proposal Lolos Didanai */}
                        <div className="grid gap-2">
                            <Label htmlFor="id_proposal" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                                {t.contracts.selectProposalPrompt} <span className="text-rose-500">*</span>
                            </Label>
                            {eligibleProposals.length === 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                    {t.contracts.noFundedProposalsNotice}
                                </div>
                            ) : (
                                <Select value={issueData.id_proposal} onValueChange={handleProposalChange}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={t.contracts.selectFundedProposalPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleProposals.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                <span className="font-medium">{p.judul_penelitian}</span>
                                                <span className="text-xs text-slate-500 block">
                                                    {p.pengusul_nama} | {p.skema_nama}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {issueErrors.id_proposal && (
                                <p className="text-xs text-rose-600 font-medium">{issueErrors.id_proposal}</p>
                            )}
                        </div>

                        {/* Rincian Pagu & Usulan Pasca Pemilihan Proposal */}
                        {selectedProposal && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-500 uppercase tracking-wider block">{t.contracts.scheme}</span>
                                        <span className="font-semibold text-slate-800">{selectedProposal.skema_nama || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 uppercase tracking-wider block">{t.contracts.leadResearcher}</span>
                                        <span className="font-semibold text-slate-800">{selectedProposal.pengusul_nama || '-'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block">
                                            {t.contracts.proposedBudget}
                                        </span>
                                        <TabularFigure
                                            value={selectedProposal.biaya_diusulkan}
                                            type="currency"
                                            size="base"
                                            weight="bold"
                                            className="text-slate-800"
                                        />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block">
                                            {t.contracts.schemeCeilingLimit}
                                        </span>
                                        <TabularFigure
                                            value={selectedProposal.pagu_maksimal}
                                            type="currency"
                                            size="base"
                                            weight="bold"
                                            className="text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Nominal Dana Disetujui (Budget Cut Adjustment) */}
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dana_disetujui" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                                    {t.contracts.approvedBudget} ({t.contracts.budgetCut}) <span className="text-rose-500">*</span>
                                </Label>
                                {selectedProposal && (
                                    <div className="flex gap-1.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setIssueData('dana_disetujui', selectedProposal.biaya_diusulkan.toString())}
                                            className="text-sky-700 hover:underline font-mono text-[11px]"
                                        >
                                            {t.contracts.matchProposedBtn}
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setIssueData('dana_disetujui', selectedProposal.pagu_maksimal.toString())}
                                            className="text-sky-700 hover:underline font-mono text-[11px]"
                                        >
                                            {t.contracts.useCeilingBtn}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Input
                                id="dana_disetujui"
                                type="number"
                                min={1000000}
                                step={50000}
                                value={issueData.dana_disetujui}
                                onChange={(e) => setIssueData('dana_disetujui', e.target.value)}
                                placeholder={t.contracts.enterApprovedBudgetPlaceholder}
                                className="font-mono text-sm bg-white"
                                required
                            />
                            {issueErrors.dana_disetujui && (
                                <p className="text-xs text-rose-600 font-medium">{issueErrors.dana_disetujui}</p>
                            )}

                            {/* Peringatan Pagu Skema Melebihi */}
                            {isPaguExceeded && (
                                <div className="rounded border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>{t.contracts.contractValueMismatchNotice}</span>
                                </div>
                            )}

                            {/* Info Pemotongan Anggaran (Budget Cut Calculation) */}
                            {selectedProposal && approvedNum > 0 && !isPaguExceeded && (
                                <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">{t.contracts.budgetCut}:</span>
                                        <span className={`font-mono font-bold ${budgetCutAmount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                                            {budgetCutAmount > 0
                                                ? t.contracts.budgetCutInfo.replace('{amount}', budgetCutAmount.toLocaleString('id-ID')).replace('{percent}', budgetCutPercent)
                                                : budgetCutAmount === 0
                                                ? t.contracts.matchingProposedNoCut
                                                : t.contracts.budgetIncreaseInfo.replace('{amount}', Math.abs(budgetCutAmount).toLocaleString('id-ID'))}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                                        <div>
                                            <span>{t.funding.tranche1RatioBadge}: </span>
                                            <span className="font-semibold text-slate-700">
                                                Rp {Math.round(approvedNum * 0.7).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span>{t.funding.tranche2RatioBadge}: </span>
                                            <span className="font-semibold text-slate-700">
                                                Rp {Math.round(approvedNum * 0.3).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tanggal Kontrak */}
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal_kontrak" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                                {t.contracts.contractDate} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="tanggal_kontrak"
                                type="date"
                                value={issueData.tanggal_kontrak}
                                onChange={(e) => setIssueData('tanggal_kontrak', e.target.value)}
                                className="font-mono text-sm bg-white"
                                required
                            />
                            {issueErrors.tanggal_kontrak && (
                                <p className="text-xs text-rose-600 font-medium">{issueErrors.tanggal_kontrak}</p>
                            )}
                        </div>

                        {/* Nomor Kontrak (Opsional / Otomatis) */}
                        <div className="grid gap-2">
                            <Label htmlFor="nomor_kontrak" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                                {t.contracts.contractNumber} ({t.contracts.optional})
                            </Label>
                            <Input
                                id="nomor_kontrak"
                                type="text"
                                value={issueData.nomor_kontrak}
                                onChange={(e) => setIssueData('nomor_kontrak', e.target.value)}
                                placeholder={t.contracts.contractNumberAutoHelp}
                                className="font-mono text-sm bg-white"
                            />
                            {issueErrors.nomor_kontrak && (
                                <p className="text-xs text-rose-600 font-medium">{issueErrors.nomor_kontrak}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIssueModalOpen(false)}
                                disabled={issueProcessing}
                            >
                                {t.common.cancel}
                            </Button>
                            <Button
                                type="submit"
                                disabled={issueProcessing || isPaguExceeded || !issueData.id_proposal || !issueData.dana_disetujui}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                            >
                                {issueProcessing ? t.contracts.issuingContract : t.contracts.issueContractBtn}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
