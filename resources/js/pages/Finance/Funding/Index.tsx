import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/ui/PageHeader';
import TabularFigure from '@/components/ui/TabularFigure';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { BreadcrumbItem } from '@/types';
import DisburseModal, { FundingDisburseTarget } from './DisburseModal';
import {
    CircleDollarSign,
    Lock,
    Unlock,
    FileCheck,
    Download,
    Building2,
    User,
    FileText,
    ArrowRight,
    Printer,
    ChevronLeft,
    ChevronRight,
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
                <PageHeader
                    title={t.funding.pageTitle}
                    subtitle={t.funding.pageSubtitle}
                />

                {/* Kartu Alur Skema Pendanaan 70:30 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-teal-100 text-teal-800">
                                    <FileCheck className="w-3.5 h-3.5" />
                                    {t.funding.tranche1RatioBadge}
                                </div>
                                <h3 className="font-serif font-bold text-slate-900 text-lg pt-1">
                                    {t.funding.tranche1Title}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {t.funding.tranche1Subtitle}
                                </p>
                            </div>
                            <span className="font-mono text-2xl font-bold text-teal-700">70%</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-teal-200/60 flex items-center justify-between text-xs text-teal-900 font-medium">
                            <span>Syarat: Kontrak Penelitian Ditandatangani</span>
                            <span className="text-teal-700 font-mono">[SIAP CAIR SETELAH KONTRAK]</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100 text-amber-800">
                                    <Lock className="w-3.5 h-3.5" />
                                    {t.funding.tranche2RatioBadge}
                                </div>
                                <h3 className="font-serif font-bold text-slate-900 text-lg pt-1">
                                    {t.funding.tranche2Title}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {t.funding.tranche2Subtitle}
                                </p>
                            </div>
                            <span className="font-mono text-2xl font-bold text-amber-700">30%</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                Gembok Monev LPPM (HTTP 422 Lock)
                            </span>
                            <span className="text-amber-800 font-mono">[MONEV APPROVED REQUIRED]</span>
                        </div>
                    </div>
                </div>

                {/* Ringkasan Finansial Halaman Ini */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            Total Alokasi Termin
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={totalNominal}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-slate-900"
                            />
                            <span className="text-xs text-slate-500 font-mono">
                                {fundings.total} record
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            Dana Terealisasi (Cair)
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={disbursedNominal}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-emerald-700 font-semibold"
                            />
                            <span className="text-xs text-emerald-600 font-mono">
                                {fundings.data.filter((f) => f.status_pencairan === 'Disbursed' || f.status_pencairan === 'disbursed').length} termin cair
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                            Outstanding (Tertahan / Belum Cair)
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <TabularFigure
                                value={Math.max(totalNominal - disbursedNominal, 0)}
                                type="currency"
                                size="xl"
                                weight="bold"
                                className="text-amber-700 font-semibold"
                            />
                            <span className="text-xs text-amber-600 font-mono">
                                Menunggu syarat / monev
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabel Termin Pendanaan */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80">
                                <TableHead className="w-12 text-center">{t.funding.tableColNo}</TableHead>
                                <TableHead>{t.contracts.contractNumber} & {t.contracts.proposalTitle}</TableHead>
                                <TableHead>PTMA & Pengusul</TableHead>
                                <TableHead className="text-center">{t.funding.tableColTranche}</TableHead>
                                <TableHead className="text-right">{t.funding.tableColPercentage}</TableHead>
                                <TableHead className="text-right">{t.funding.tableColAmount}</TableHead>
                                <TableHead>{t.funding.tableColStatus}</TableHead>
                                <TableHead className="text-center">{t.funding.tableColActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fundings.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-medium">{t.funding.emptyList}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                fundings.data.map((funding, index) => {
                                    const isDisbursed = funding.status_pencairan === 'Disbursed' || funding.status_pencairan === 'disbursed';
                                    const isTermin2 = funding.termin_ke === 2;
                                    const isMonevLocked = isTermin2 && !funding.is_monev_approved && !isDisbursed;

                                    return (
                                        <TableRow key={funding.id} className="hover:bg-slate-50/60">
                                            <TableCell className="text-center font-mono text-xs text-slate-500">
                                                {(fundings.current_page - 1) * fundings.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="min-w-64 max-w-sm">
                                                <div className="space-y-1">
                                                    <Link
                                                        href={funding.contract ? route('finance.contracts.show', funding.contract.id) : '#'}
                                                        className="font-mono text-xs font-semibold text-sky-800 hover:underline block"
                                                    >
                                                        {funding.contract?.nomor_kontrak || '-'}
                                                    </Link>
                                                    <p className="font-medium text-xs text-slate-900 line-clamp-2">
                                                        {funding.contract?.judul_kontrak || funding.contract?.proposal?.judul_penelitian || '-'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-44">
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-medium text-slate-800 flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{funding.contract?.proposal?.pengusul?.name || '-'}</span>
                                                    </p>
                                                    <p className="text-slate-500 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{funding.contract?.university?.short_name || funding.contract?.university?.name || '-'}</span>
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
                                                    Termin {funding.termin_ke}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TabularFigure
                                                    value={funding.persentase_dana}
                                                    type="percentage"
                                                    size="sm"
                                                    weight="semibold"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TabularFigure
                                                    value={funding.nominal_dana}
                                                    type="currency"
                                                    size="sm"
                                                    weight="bold"
                                                    className={isDisbursed ? 'text-emerald-700' : 'text-slate-900'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {isDisbursed ? (
                                                    <StatusBadge
                                                        status={funding.termin_ke === 1 ? 'Disbursed_T1' : 'Disbursed_T2'}
                                                        labelOverride={funding.termin_ke === 1 ? '[CAIR TERMIN 1]' : '[CAIR TERMIN 2]'}
                                                        size="sm"
                                                    />
                                                ) : isMonevLocked ? (
                                                    <StatusBadge
                                                        status="Monev_Locked"
                                                        labelOverride="[TERKUNCI MONEV]"
                                                        size="sm"
                                                    />
                                                ) : (
                                                    <StatusBadge
                                                        status="Draft"
                                                        labelOverride="[MENUNGGU PENCAIRAN]"
                                                        size="sm"
                                                    />
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
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                                    title={t.funding.btnViewProof}
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>Bukti</span>
                                                                </a>
                                                            )}
                                                            <a
                                                                href={route('finance.funding.print-kwitansi', funding.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                                title="Cetak Kwitansi PDF"
                                                            >
                                                                <Printer className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Kwitansi</span>
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant={isMonevLocked ? 'secondary' : 'default'}
                                                            onClick={() => openDisburse(funding)}
                                                            className={`text-xs gap-1.5 ${
                                                                isMonevLocked
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            {isMonevLocked ? (
                                                                <>
                                                                    <Lock className="w-3.5 h-3.5" />
                                                                    <span>[TERKUNCI MONEV]</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FileCheck className="w-3.5 h-3.5" />
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
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-mono text-slate-500">
                            Halaman {fundings.current_page} dari {fundings.last_page} (Total {fundings.total} termin)
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

            <DisburseModal
                funding={selectedFunding}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </AppLayout>
    );
}
