import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import TabularFigure from '@/components/ui/TabularFigure';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, ChevronLeft, ChevronRight, Download, FileCheck, FileText, Lock, Printer, User } from 'lucide-react';
import { useState } from 'react';
import DisburseModal, { FundingDisburseTarget } from './DisburseModal';

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

interface FundingItem extends FundingDisburseTarget {
    status_color?: string;
    tanggal_pencairan?: string | null;
    bukti_transfer_path?: string | null;
    catatan_keuangan?: string | null;
    reference_number?: string | null;
}

interface Props {
    fundings: Paginated<FundingItem>;
}

export default function FundingIndex({ fundings }: Props) {
    const { t } = useTranslation();
    const [selectedFunding, setSelectedFunding] = useState<FundingItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/dashboard',
        },
        {
            title: t.navigation.contracts,
            href: '/contracts',
        },
        {
            title: t.funding.pageTitle,
            href: '/fundings',
        },
    ];

    const openDisburse = (funding: FundingItem) => {
        setSelectedFunding(funding);
        setModalOpen(true);
    };

    const cleanPaginationLabel = (label: string) => {
        return label.replace('&laquo;', '').replace('&raquo;', '').trim();
    };

    const totalNominal = fundings.data.reduce((acc, curr) => acc + (curr.nominal_dana || 0), 0);
    const disbursedNominal = fundings.data
        .filter((f) => f.status_pencairan === 'Disbursed' || f.status_pencairan === 'disbursed')
        .reduce((acc, curr) => acc + (curr.nominal_dana || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.funding.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <PageHeader title={t.funding.pageTitle} subtitle={t.funding.pageSubtitle} />

                {/* Kartu Alur Skema Pendanaan 70:30 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-5 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 rounded bg-teal-100 px-2 py-0.5 font-mono text-xs font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                    <FileCheck className="h-3.5 w-3.5" />
                                    {t.funding.tranche1RatioBadge}
                                </div>
                                <h3 className="pt-1 font-serif text-lg font-bold text-slate-900 dark:text-slate-100">{t.funding.tranche1Title}</h3>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.funding.tranche1Subtitle}</p>
                            </div>
                            <span className="font-mono text-2xl font-bold text-teal-700 dark:text-teal-400">70%</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-teal-200/60 pt-3 text-xs font-medium text-teal-900 dark:border-teal-900/50 dark:text-teal-300">
                            <span>{t.funding.tranche1Requirement}</span>
                            <span className="font-mono text-teal-700 dark:text-teal-400">{t.funding.tranche1ReadyNotice}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 rounded bg-amber-100 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                    <Lock className="h-3.5 w-3.5" />
                                    {t.funding.tranche2RatioBadge}
                                </div>
                                <h3 className="pt-1 font-serif text-lg font-bold text-slate-900 dark:text-slate-100">{t.funding.tranche2Title}</h3>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.funding.tranche2Subtitle}</p>
                            </div>
                            <span className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">30%</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-amber-200/60 pt-3 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:text-amber-300">
                            <span className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                                {t.funding.tranche2Requirement}
                            </span>
                            <span className="font-mono text-amber-800 dark:text-amber-300">{t.funding.tranche2ApprovedNotice}</span>
                        </div>
                    </div>
                </div>

                {/* Ringkasan Finansial Halaman Ini */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="block text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            {t.funding.totalTrancheAllocation}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={totalNominal}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-slate-900 dark:text-slate-100"
                            />
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                {t.funding.records.replace('{count}', String(fundings.total))}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="block text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            {t.funding.disbursedFundingLabel}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={disbursedNominal}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="font-semibold text-emerald-700 dark:text-emerald-400"
                            />
                            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                {t.funding.disbursedTranchesCount.replace(
                                    '{count}',
                                    String(
                                        fundings.data.filter((f) => f.status_pencairan === 'Disbursed' || f.status_pencairan === 'disbursed').length,
                                    ),
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="block text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            {t.funding.outstandingPendingLabel}
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={Math.max(totalNominal - disbursedNominal, 0)}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="font-semibold text-amber-700 dark:text-amber-400"
                            />
                            <span className="font-mono text-xs text-amber-600 dark:text-amber-400">{t.funding.waitingRequirementNotice}</span>
                        </div>
                    </div>
                </div>

                {/* Tabel Termin Pendanaan */}
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-slate-950/60">
                                <TableHead className="w-12 text-center">{t.funding.tableColNo}</TableHead>
                                <TableHead>
                                    {t.contracts.contractNumber} & {t.contracts.proposalTitle}
                                </TableHead>
                                <TableHead>{t.funding.universityAndResearcher}</TableHead>
                                <TableHead className="text-center">{t.funding.tableColTranche}</TableHead>
                                <TableHead className="text-right">{t.funding.tableColPercentage}</TableHead>
                                <TableHead className="text-right">{t.funding.tableColAmount}</TableHead>
                                <TableHead className="text-center">{t.funding.tableColBillingDoc}</TableHead>
                                <TableHead>{t.funding.tableColStatus}</TableHead>
                                <TableHead className="text-center">{t.funding.tableColActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fundings.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                        <FileText className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium">{t.funding.emptyList}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                fundings.data.map((funding, index) => {
                                    const isDisbursed = funding.status_pencairan === 'Disbursed' || funding.status_pencairan === 'disbursed';
                                    const isTermin2 = funding.termin_ke === 2;
                                    const isMonevLocked = isTermin2 && !funding.is_monev_approved && !isDisbursed;

                                    return (
                                        <TableRow key={funding.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                                            <TableCell className="text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                                                {(fundings.current_page - 1) * fundings.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="max-w-sm min-w-64">
                                                <div className="space-y-1">
                                                    <Link
                                                        href={funding.contract ? route('finance.contracts.show', funding.contract.id) : '#'}
                                                        className="block font-mono text-xs font-semibold text-sky-800 hover:underline dark:text-sky-400"
                                                    >
                                                        {funding.contract?.nomor_kontrak || '-'}
                                                    </Link>
                                                    <p className="line-clamp-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                                                        {funding.contract?.judul_kontrak || funding.contract?.proposal?.judul_penelitian || '-'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-44">
                                                <div className="space-y-1 text-xs">
                                                    <p className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">{funding.contract?.proposal?.pengusul?.name || '-'}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">
                                                            {funding.contract?.university?.short_name || funding.contract?.university?.name || '-'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                    {t.funding.trancheLabel.replace('{number}', String(funding.termin_ke))}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TabularFigure value={funding.persentase_dana} type="percentage" size="sm" weight="semibold" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TabularFigure
                                                    value={funding.nominal_dana}
                                                    type="currency"
                                                    size="sm"
                                                    weight="bold"
                                                    className={
                                                        isDisbursed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {funding.file_tagihan ? (
                                                    <div className="flex flex-col items-center gap-1 text-xs">
                                                        <a
                                                            href={`/storage/${funding.file_tagihan}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/50"
                                                            title={t.funding.viewBillingDoc}
                                                        >
                                                            <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                                            <span>{t.funding.viewBillingDoc}</span>
                                                        </a>
                                                        {funding.nominal_tagihan && (
                                                            <div className="font-mono text-[11px] font-semibold text-teal-900 dark:text-teal-300">
                                                                <TabularFigure value={funding.nominal_tagihan} type="currency" size="sm" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isDisbursed ? (
                                                    <StatusBadge status={funding.termin_ke === 1 ? 'Disbursed_T1' : 'Disbursed_T2'} size="sm" />
                                                ) : isMonevLocked ? (
                                                    <StatusBadge status="Monev_Locked" size="sm" />
                                                ) : (
                                                    <StatusBadge status="Waiting_Disbursement" size="sm" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {isDisbursed ? (
                                                        <>
                                                            {funding.bukti_transfer_path && (
                                                                <a
                                                                    href={`/storage/${funding.bukti_transfer_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                                                    title={t.funding.btnViewProof}
                                                                >
                                                                    <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                                    <span>{t.funding.proof}</span>
                                                                </a>
                                                            )}
                                                            <a
                                                                href={route('finance.funding.print-kwitansi', funding.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                                                title={t.funding.printReceiptPdf}
                                                            >
                                                                <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                                <span>{t.funding.printReceipt}</span>
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant={isMonevLocked ? 'secondary' : 'default'}
                                                            onClick={() => openDisburse(funding)}
                                                            className={`gap-1.5 text-xs ${
                                                                isMonevLocked
                                                                    ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50'
                                                                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {isMonevLocked ? (
                                                                <>
                                                                    <Lock className="h-3.5 w-3.5" />
                                                                    <span>{t.statuses.Monev_Locked}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FileCheck className="h-3.5 w-3.5" />
                                                                    <span>{t.funding.btnDisburse}</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {fundings.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {t.funding.pageOfTranches
                                .replace('{current}', String(fundings.current_page))
                                .replace('{last}', String(fundings.last_page))
                                .replace('{total}', String(fundings.total))}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {fundings.links.map((link, index) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button
                                            key={index}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className="h-8 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
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
                                            className="h-8 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Next
                                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
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
                                        className={`h-8 px-3 text-xs ${link.active ? 'dark:bg-slate-100 dark:text-slate-900' : 'dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        {cleanPaginationLabel(link.label)}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <DisburseModal funding={selectedFunding} open={modalOpen} onOpenChange={setModalOpen} />
        </AppLayout>
    );
}
