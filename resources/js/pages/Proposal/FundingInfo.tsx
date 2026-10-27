/**
 * FundingInfo Component
 *
 * @description
 * Component untuk menampilkan rincian dana cair bagi dosen/peneliti.
 * Menampilkan informasi tentang:
 * - Ringkasan dana (total disetujui, cair, sisa)
 * - Daftar kontrak penelitian
 * - Detail termin pencairan per kontrak
 * - Progress bar serapan dana
 *
 * @features
 * - Dashboard ringkasan dana
 * - List kontrak dengan pagination
 * - Detail termin pencairan
 * - Progress bar visual
 * - Status badge untuk setiap termin
 * - Download bukti pencairan
 *
 * @route GET /user/funding
 */
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, Download, FileText } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';

type FundingStatus = 'planned' | 'requested' | 'approved' | 'disbursed' | 'cancelled';

interface Funding {
    id: number;
    funding_number: string;
    description: string | null;
    amount: number;
    percentage: number;
    status: FundingStatus;
    status_label: string;
    status_color: string;
    funding_date: string | null;
    paid_at: string | null;
    reference_number: string | null;
    proof_document_path: string | null;
    notes: string | null;
}

interface Contract {
    id: number;
    contract_number: string;
    title: string | null;
    start_date: string | null;
    contract_value: number;
    status: string;
    status_label: string;
    total_disbursed: number;
    remaining_funding: number;
    disbursement_percentage: number;
    fundings: Funding[];
    created_at: string;
}

interface FundingStats {
    total_approved: number;
    total_disbursed: number;
    total_remaining: number;
    active_contracts: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    contracts: {
        data: Contract[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: PaginationLink[];
    };
    fundingStats: FundingStats;
    filters: {
        search: string;
    };
}

const StatusIcon = ({ status }: { status: FundingStatus }) => {
    switch (status) {
        case 'disbursed':
            return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
        case 'requested':
        case 'approved':
            return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
        case 'cancelled':
            return <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
        default:
            return null;
    }
};

const getStatusColor = (status: FundingStatus) => {
    switch (status) {
        case 'disbursed':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
        case 'requested':
        case 'approved':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
        case 'cancelled':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
};

export default function FundingInfo({ contracts, fundingStats, filters: initialFilters }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const [expandedContracts, setExpandedContracts] = useState<Set<number>>(new Set());

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.navigation.tranchesDisbursement, href: route('user.funding.index') },
    ];

    const toggleContractExpand = (contractId: number) => {
        const newExpanded = new Set(expandedContracts);
        if (newExpanded.has(contractId)) {
            newExpanded.delete(contractId);
        } else {
            newExpanded.add(contractId);
        }
        setExpandedContracts(newExpanded);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.userFunding.pageTitle} />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {flash.success}
                </div>
            )}

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.userFunding.pageTitle}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{t.userFunding.pageSubtitle}</p>
            </div>

            {/* Funding Statistics Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* Total Approved Funding */}
                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.userFunding.totalApproved}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(fundingStats.total_approved)}</div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {t.userFunding.fromActiveContracts.replace('{count}', String(fundingStats.active_contracts))}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Disbursed */}
                <Card className="border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t.userFunding.disbursedFunding}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(fundingStats.total_disbursed)}
                        </div>
                        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                            {t.userFunding.percentOfTotal.replace(
                                '{percent}',
                                String(
                                    fundingStats.total_approved > 0
                                        ? ((fundingStats.total_disbursed / fundingStats.total_approved) * 100).toFixed(1)
                                        : 0,
                                ),
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Remaining Funding */}
                <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">{t.userFunding.remainingFunding}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatCurrency(fundingStats.total_remaining)}</div>
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t.userFunding.waitingDisbursement}</p>
                    </CardContent>
                </Card>

                {/* Active Contracts */}
                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.userFunding.activeContracts}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fundingStats.active_contracts}</div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.userFunding.inProgress}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Contracts List */}
            <div className="space-y-4">
                {contracts.data.length > 0 ? (
                    contracts.data.map((contract) => (
                        <Card key={contract.id} className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            {/* Contract Header */}
                            <div
                                className="flex cursor-pointer items-center justify-between border-b border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                                onClick={() => toggleContractExpand(contract.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{contract.contract_number}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {contract.title} • {contract.start_date ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Summary */}
                                <div className="mr-4 flex items-center gap-6 text-right">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.userFunding.approvedFunding}</p>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(contract.contract_value)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.userFunding.alreadyDisbursed}</p>
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(contract.total_disbursed)}
                                        </p>
                                    </div>
                                    <div className="w-24">
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.userFunding.progress}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Progress value={contract.disbursement_percentage} className="h-2" />
                                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                {contract.disbursement_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mr-4">
                                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>{contract.status_label}</Badge>
                                </div>

                                {/* Expand Icon */}
                                <div>
                                    {expandedContracts.has(contract.id) ? (
                                        <ChevronUp className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content - Fundings */}
                            {expandedContracts.has(contract.id) && (
                                <CardContent className="pt-6">
                                    <div>
                                        <h4 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">{t.userFunding.trancheDetails}</h4>

                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-800">
                                                        <TableHead className="text-xs font-semibold">{t.userFunding.tranche}</TableHead>
                                                        <TableHead className="text-right text-xs font-semibold">{t.userFunding.percentage}</TableHead>
                                                        <TableHead className="text-right text-xs font-semibold">{t.userFunding.amount}</TableHead>
                                                        <TableHead className="text-xs font-semibold">{t.userFunding.status}</TableHead>
                                                        <TableHead className="text-xs font-semibold">{t.userFunding.disbursementDate}</TableHead>
                                                        <TableHead className="text-xs font-semibold">{t.userFunding.referenceNumber}</TableHead>
                                                        <TableHead className="text-center text-xs font-semibold">{t.userFunding.actions}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {contract.fundings.map((funding) => (
                                                        <TableRow
                                                            key={funding.id}
                                                            className="border-slate-100 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                                                        >
                                                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                                {funding.funding_number}
                                                            </TableCell>
                                                            <TableCell className="text-right text-slate-700 dark:text-slate-300">
                                                                {funding.percentage}%
                                                            </TableCell>
                                                            <TableCell className="text-right text-slate-700 dark:text-slate-300">
                                                                {formatCurrency(funding.amount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <StatusIcon status={funding.status} />
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn('text-xs', getStatusColor(funding.status))}
                                                                    >
                                                                        {funding.status_label}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                                {funding.paid_at || '-'}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                                {funding.reference_number || '-'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            {funding.proof_document_path ? (
                                                                                <Button variant="ghost" size="sm" asChild>
                                                                                    <a
                                                                                        href={`/storage/${funding.proof_document_path}`}
                                                                                        download
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                    >
                                                                                        <Download className="h-4 w-4" />
                                                                                    </a>
                                                                                </Button>
                                                                            ) : (
                                                                                <Button variant="ghost" size="sm" disabled>
                                                                                    <Download className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            {funding.proof_document_path
                                                                                ? t.userFunding.downloadProof
                                                                                : t.userFunding.proofUnavailable}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Notes Section */}
                                        {contract.fundings.some((f) => f.notes) && (
                                            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                                <h5 className="font-medium text-slate-900 dark:text-slate-100">{t.userFunding.notes}</h5>
                                                {contract.fundings
                                                    .filter((f) => f.notes)
                                                    .map((funding) => (
                                                        <div
                                                            key={funding.id}
                                                            className="rounded bg-blue-50 p-2 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                                        >
                                                            <p className="font-medium">{funding.funding_number}:</p>
                                                            <p className="text-xs">{funding.notes}</p>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                ) : (
                    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardContent className="pt-6 text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{t.userFunding.emptyTitle}</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.userFunding.emptySubtitle}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
