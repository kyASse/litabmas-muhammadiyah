/**
 * Finance/Proposal/Index — Antrean Audit RAB Usulan Penelitian
 *
 * @description
 * Halaman antrean verifikasi kepatuhan anggaran (RAB) terhadap Standar Biaya Masukan (SBM)
 * Kota Yogyakarta oleh Admin Keuangan Bappeda (Dual Sign-Off Gatekeeper Fase 1).
 * Dibangun menggunakan shadcn/ui dan UI/UX Pro Max, 100% bebas dari simbol emoji.
 */

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import RabVerificationModal from '@/components/RabVerificationModal';
import {
    Calculator,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    FilterX,
    Building2,
    User,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    FileText,
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

interface ProposalItem {
    id: number;
    judul_penelitian: string;
    status_proposal: string;
    biaya_yang_diusulkan: number;
    rekomendasi_anggaran: number | null;
    is_administrasi_approved: boolean | null;
    is_rab_approved: boolean | null;
    catatan_keuangan: string | null;
    catatan_administrasi: string | null;
    tanggal_pengajuan: string | null;
    pengusul?: {
        id: number;
        name: string;
        email: string;
    } | null;
    research_schema?: {
        id: number;
        name: string;
        tahun_anggaran?: number;
        max_funding?: number;
    } | null;
    university?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    proposals: Paginated<ProposalItem>;
    filters: {
        search?: string;
        year?: string | number;
        rab_status?: string;
    };
    availableYears: number[];
}

export default function FinanceProposalIndex({
    proposals,
    filters,
    availableYears,
}: Props) {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState<string>(filters.year ? String(filters.year) : 'all');
    const [selectedRabStatus, setSelectedRabStatus] = useState<string>(filters.rab_status || 'all');
    const [auditModalProposal, setAuditModalProposal] = useState<ProposalItem | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: t.navigation.rabVerification, href: '/finance/proposals' },
    ];

    const applyFilter = (key: string, value: string) => {
        const query: Record<string, string> = {
            search: searchTerm,
            year: selectedYear === 'all' ? '' : selectedYear,
            rab_status: selectedRabStatus === 'all' ? '' : selectedRabStatus,
        };

        if (key === 'search') query.search = value;
        if (key === 'year') query.year = value === 'all' ? '' : value;
        if (key === 'rab_status') query.rab_status = value === 'all' ? '' : value;

        router.get('/finance/proposals', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('search', searchTerm);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedYear('all');
        setSelectedRabStatus('all');
        router.get('/finance/proposals', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Calculate Summary Stats from current page or totals
    const statApprovedCount = proposals.data.filter((p) => p.is_rab_approved === true).length;
    const statPendingCount = proposals.data.filter((p) => p.is_rab_approved === null).length;
    const statRejectedCount = proposals.data.filter((p) => p.is_rab_approved === false).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.financeProposals.pageTitle} />

            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={t.financeProposals.pageTitle}
                    subtitle={t.financeProposals.pageSubtitle}
                />

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border border-border shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-muted-foreground block font-medium">
                                    {t.financeProposals.statTotal}
                                </span>
                                <span className="text-2xl font-bold font-mono text-foreground mt-0.5 block">
                                    {proposals.total}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                <Calculator className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-emerald-800 dark:text-emerald-300 block font-medium">
                                    {t.financeProposals.statApproved}
                                </span>
                                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                                    {statApprovedCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-amber-500/20 bg-amber-500/5 shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-amber-800 dark:text-amber-300 block font-medium">
                                    {t.financeProposals.statPending}
                                </span>
                                <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5 block">
                                    {statPendingCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-destructive/20 bg-destructive/5 shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-destructive block font-medium">
                                    {t.financeProposals.statRejected}
                                </span>
                                <span className="text-2xl font-bold font-mono text-destructive mt-0.5 block">
                                    {statRejectedCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive">
                                <XCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t.financeProposals.searchPlaceholder}
                                className="pl-9 text-xs"
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="text-xs shrink-0">
                            {t.common.search || 'Cari'}
                        </Button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Fiscal Year Filter */}
                        <div className="w-[140px]">
                            <Select
                                value={selectedYear}
                                onValueChange={(val) => {
                                    setSelectedYear(val);
                                    applyFilter('year', val);
                                }}
                            >
                                <SelectTrigger className="text-xs h-9">
                                    <SelectValue placeholder={t.financeProposals.filterYear} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.financeProposals.allYears}</SelectItem>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* RAB Status Filter */}
                        <div className="w-[170px]">
                            <Select
                                value={selectedRabStatus}
                                onValueChange={(val) => {
                                    setSelectedRabStatus(val);
                                    applyFilter('rab_status', val);
                                }}
                            >
                                <SelectTrigger className="text-xs h-9">
                                    <SelectValue placeholder={t.financeProposals.filterStatus} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.financeProposals.allStatuses}</SelectItem>
                                    <SelectItem value="pending">{t.financeProposals.statusPending}</SelectItem>
                                    <SelectItem value="approved">{t.financeProposals.statusApproved}</SelectItem>
                                    <SelectItem value="rejected">{t.financeProposals.statusRejected}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(searchTerm || selectedYear !== 'all' || selectedRabStatus !== 'all') && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="text-xs text-muted-foreground hover:text-foreground h-9"
                            >
                                <FilterX className="h-3.5 w-3.5 mr-1" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Proposals Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="text-xs font-semibold">{t.financeProposals.colTitle}</TableHead>
                                <TableHead className="text-xs font-semibold">{t.financeProposals.colResearcher}</TableHead>
                                <TableHead className="text-xs font-semibold text-right">{t.financeProposals.colBudget}</TableHead>
                                <TableHead className="text-xs font-semibold text-center">{t.financeProposals.colAdminStatus}</TableHead>
                                <TableHead className="text-xs font-semibold text-center">{t.financeProposals.colRabStatus}</TableHead>
                                <TableHead className="text-xs font-semibold text-right">{t.financeProposals.colActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proposals.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="h-10 w-10 text-muted-foreground/40" />
                                            <div className="text-sm font-semibold text-foreground">
                                                {t.financeProposals.emptyTitle}
                                            </div>
                                            <div className="text-xs text-muted-foreground max-w-sm">
                                                {t.financeProposals.emptySubtitle}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                proposals.data.map((proposal) => (
                                    <TableRow key={proposal.id} className="hover:bg-muted/30">
                                        {/* Title & Scheme */}
                                        <TableCell className="max-w-xs">
                                            <div className="font-medium text-xs text-foreground line-clamp-2">
                                                {proposal.judul_penelitian}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                                <span className="truncate">
                                                    {proposal.research_schema?.name || 'Skema Penelitian'}
                                                </span>
                                                {proposal.research_schema?.tahun_anggaran && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                        TA {proposal.research_schema.tahun_anggaran}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Researcher & Campus */}
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span>{proposal.pengusul?.name || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span>{proposal.university?.name || '-'}</span>
                                            </div>
                                        </TableCell>

                                        {/* Budget Info */}
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="font-mono text-xs font-semibold text-foreground">
                                                {formatCurrency(proposal.biaya_yang_diusulkan || 0)}
                                            </div>
                                            {proposal.rekomendasi_anggaran && (
                                                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                    Rek: {formatCurrency(proposal.rekomendasi_anggaran)}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Admin Verification Gate */}
                                        <TableCell className="text-center whitespace-nowrap">
                                            {proposal.is_administrasi_approved === true ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                    {t.financeProposals.adminApproved}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground border-border text-[11px] font-medium gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {t.financeProposals.adminPending}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* RAB Verification Gate */}
                                        <TableCell className="text-center whitespace-nowrap">
                                            {proposal.is_rab_approved === true ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                    {t.financeProposals.statusApproved}
                                                </Badge>
                                            ) : proposal.is_rab_approved === false ? (
                                                <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[11px] font-medium gap-1">
                                                    <XCircle className="h-3 w-3 text-destructive" />
                                                    {t.financeProposals.statusRejected}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 text-[11px] font-medium gap-1">
                                                    <Clock className="h-3 w-3 text-amber-600" />
                                                    {t.financeProposals.statusPending}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => setAuditModalProposal(proposal)}
                                                    className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                                >
                                                    <Calculator className="h-3.5 w-3.5" />
                                                    {t.financeProposals.verifyRabBtn}
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                    className="h-8 text-xs gap-1"
                                                >
                                                    <Link href={`/finance/proposals/${proposal.id}`}>
                                                        {t.financeProposals.viewDetailBtn}
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {proposals.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                            <div className="text-xs text-muted-foreground">
                                Halaman {proposals.current_page} dari {proposals.last_page} ({proposals.total} usulan)
                            </div>
                            <div className="flex items-center gap-1">
                                {proposals.links.map((link, idx) => {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                asChild={!!link.url}
                                                disabled={!link.url}
                                                className="h-8 w-8 p-0"
                                            >
                                                {link.url ? (
                                                    <Link href={link.url} preserveScroll>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Link>
                                                ) : (
                                                    <ChevronLeft className="h-4 w-4" />
                                                )}
                                            </Button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                asChild={!!link.url}
                                                disabled={!link.url}
                                                className="h-8 w-8 p-0"
                                            >
                                                {link.url ? (
                                                    <Link href={link.url} preserveScroll>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Link>
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild={!!link.url}
                                            disabled={!link.url}
                                            className="h-8 w-8 p-0 text-xs font-mono"
                                        >
                                            {link.url ? (
                                                <Link href={link.url} preserveScroll>
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <span>{link.label}</span>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Audit RAB Modal */}
            {auditModalProposal && (
                <RabVerificationModal
                    isOpen={!!auditModalProposal}
                    onClose={() => setAuditModalProposal(null)}
                    proposalId={auditModalProposal.id}
                    proposalTitle={auditModalProposal.judul_penelitian}
                    proposedBudget={auditModalProposal.biaya_yang_diusulkan}
                    schemeMaxBudget={auditModalProposal.research_schema?.max_funding}
                    initialRekomendasiAnggaran={auditModalProposal.rekomendasi_anggaran}
                    initialCatatanKeuangan={auditModalProposal.catatan_keuangan}
                />
            )}
        </AppLayout>
    );
}
