import StatusBadge, { BadgeStatusType } from '@/components/ui/StatusBadge';
import TabularFigure from '@/components/ui/TabularFigure';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Download, FileCheck, FileText, Hash, Layers, Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import DisburseModal, { FundingDisburseTarget } from '../Funding/DisburseModal';

interface University {
    id: number;
    name: string;
    short_name?: string;
    code?: string;
}

interface ProposalItem {
    id: number;
    judul_penelitian: string;
    status_proposal: string;
    biaya_yang_diusulkan?: number;
    research_schema?: {
        id: number;
        nama_skema: string;
        biaya_maksimal?: number;
    } | null;
    pengusul?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface FundingItem {
    id: number;
    termin_ke: number;
    persentase_dana: number;
    nominal_dana: number;
    status_pencairan: string;
    status_label?: string;
    tanggal_pencairan?: string | null;
    bukti_transfer_path?: string | null;
    catatan_keuangan?: string | null;
}

interface Contract {
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
    tanggal_kontrak?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    terms?: string | null;
    notes?: string | null;
    file_dokumen_kontrak?: string | null;
    is_monev_approved?: boolean;
    university?: University | null;
    proposal?: ProposalItem | null;
    fundings: FundingItem[];
    creator?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    contract: Contract;
}

function mapStatusToBadge(status: string): { type: BadgeStatusType; label: string } {
    const s = (status || '').toLowerCase();
    if (s === 'draft') return { type: 'Draft', label: '[DRAFT]' };
    if (s === 'active' || s === 'aktif') return { type: 'Contracted', label: '[ACTIVE]' };
    if (s === 'signed' || s === 'ditandatangani') return { type: 'Contracted', label: '[SIGNED]' };
    if (s === 'selesai' || s === 'completed') return { type: 'Completed_SKTS', label: '[SELESAI]' };
    if (s === 'dibatalkan' || s === 'terminated') return { type: 'Terminated', label: '[DIBATALKAN]' };
    return { type: 'Draft', label: `[${(status || 'DRAFT').toUpperCase()}]` };
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">{label}</p>
                <div className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</div>
            </div>
        </div>
    );
}

export default function ContractShow({ contract }: Props) {
    const { t } = useTranslation();
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [selectedFunding, setSelectedFunding] = useState<FundingDisburseTarget | null>(null);
    const [disburseModalOpen, setDisburseModalOpen] = useState(false);

    const contractNumber = contract.nomor_kontrak || contract.contract_number;
    const contractTitle = contract.judul_kontrak || contract.title || contract.proposal?.judul_penelitian;
    const contractValue = contract.dana_disetujui || contract.contract_value || 0;
    const currentStatus = contract.status_kontrak || contract.status || 'draft';
    const isMonevApproved = Boolean(contract.is_monev_approved);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.contracts.pageTitle, href: route('finance.contracts.index') },
        { title: contractNumber, href: route('finance.contracts.show', contract.id) },
    ];

    const badgeInfo = mapStatusToBadge(currentStatus);

    // Filter fundings termin 1 and termin 2
    const termin1 = contract.fundings.find((f) => f.termin_ke === 1) || {
        id: 0,
        termin_ke: 1,
        persentase_dana: 70,
        nominal_dana: Math.round(contractValue * 0.7),
        status_pencairan: 'Planned',
    };

    const termin2 = contract.fundings.find((f) => f.termin_ke === 2) || {
        id: 0,
        termin_ke: 2,
        persentase_dana: 30,
        nominal_dana: Math.round(contractValue * 0.3),
        status_pencairan: 'Planned',
    };

    const isT1Disbursed = termin1.status_pencairan === 'Disbursed' || termin1.status_pencairan === 'disbursed';
    const isT2Disbursed = termin2.status_pencairan === 'Disbursed' || termin2.status_pencairan === 'disbursed';

    const totalDisbursed = (isT1Disbursed ? termin1.nominal_dana : 0) + (isT2Disbursed ? termin2.nominal_dana : 0);
    const progressPercent = contractValue > 0 ? Math.min(100, Math.round((totalDisbursed / contractValue) * 100)) : 0;

    const handleUpdateStatus = (newStatus: string) => {
        setProcessing(true);
        router.post(
            route('finance.contracts.update-status', contract.id),
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t.contracts.updateStatusSuccess.replace('{status}', newStatus.toUpperCase()));
                },
                onError: () => {
                    toast.error(t.contracts.updateStatusError);
                },
                onFinish: () => {
                    setProcessing(false);
                    setPendingStatus(null);
                },
            },
        );
    };

    const openDisburse = (fundingItem: FundingItem) => {
        setSelectedFunding({
            id: fundingItem.id,
            termin_ke: fundingItem.termin_ke,
            persentase_dana: fundingItem.persentase_dana,
            nominal_dana: fundingItem.nominal_dana,
            status_pencairan: fundingItem.status_pencairan,
            is_monev_approved: isMonevApproved,
            contract: {
                id: contract.id,
                nomor_kontrak: contractNumber,
                judul_kontrak: contractTitle || '',
                dana_disetujui: contractValue,
                university: contract.university,
                proposal: contract.proposal,
            },
        });
        setDisburseModalOpen(true);
    };

    const proposedBudget = contract.proposal?.biaya_yang_diusulkan || 0;
    const maxBudget = contract.proposal?.research_schema?.biaya_maksimal || 0;
    const budgetCut = proposedBudget > 0 ? proposedBudget - contractValue : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.contracts.detailTitle} - ${contractNumber}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header Navigasi & Aksi */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 dark:text-slate-300 dark:hover:bg-slate-800">
                        <Link href={route('finance.contracts.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            {t.contracts.backToList}
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        {contract.file_dokumen_kontrak && (
                            <a
                                href={`/storage/${contract.file_dokumen_kontrak}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                {t.contracts.downloadContractPdf}
                            </a>
                        )}
                        <StatusBadge status={badgeInfo.type} size="md" />
                    </div>
                </div>

                {/* Header Judul Kontrak */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                            <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{contractNumber}</span>
                            <span>•</span>
                            <span>
                                {t.contracts.contractDate}: {formatDate(contract.tanggal_kontrak || contract.start_date)}
                            </span>
                        </div>
                        <h1 className="font-serif text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">{contractTitle}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.contracts.institution}: <strong className="text-slate-700 dark:text-slate-200">{contract.university?.name || '-'}</strong>
                            {contract.creator && ` | ${t.contracts.issuedBy}: ${contract.creator.name}`}
                        </p>
                    </div>
                </div>

                {/* Linier Progress Pencairan Termin 70:30 (Monev Gatekeeper Lock) */}
                <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">{t.contracts.fundingFlowTitle}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.contracts.fundingFlowSubtitle}</p>
                        </div>
                        <div className="text-right">
                            <span className="block font-mono text-xs tracking-wider text-slate-500 uppercase dark:text-slate-400">{t.contracts.realizationProgress}</span>
                            <div className="flex items-baseline gap-2">
                                <TabularFigure value={totalDisbursed} type="currency" size="lg" weight="bold" className="text-emerald-700 dark:text-emerald-400" />
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                    {t.contracts.of} <TabularFigure value={contractValue} type="currency" size="sm" className="text-slate-700 dark:text-slate-300" /> (
                                    {progressPercent}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <Progress value={progressPercent} className="h-2.5 bg-slate-100 dark:bg-slate-800" />

                    {/* Dua Kartu Termin Linier */}
                    <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">
                        {/* TERMIN 1 (70%) */}
                        <div
                            className={`rounded-lg border p-5 transition-colors ${
                                isT1Disbursed
                                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-xs font-bold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                            {t.funding.tranche1RatioBadge}
                                        </span>
                                        {isT1Disbursed ? (
                                            <StatusBadge status="Disbursed_T1" size="sm" />
                                        ) : (
                                            <StatusBadge status="Waiting_Disbursement" size="sm" />
                                        )}
                                    </div>
                                    <h3 className="pt-1 font-serif text-base font-bold text-slate-900 dark:text-slate-100">{t.contracts.tranche1CardTitle}</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">{t.contracts.tranche1CardDesc}</p>
                                </div>
                                <TabularFigure
                                    value={termin1.nominal_dana}
                                    type="currency"
                                    size="xl"
                                    weight="bold"
                                    className={isT1Disbursed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}
                                />
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs dark:border-slate-800">
                                <div className="text-slate-500 dark:text-slate-400">
                                    {isT1Disbursed ? (
                                        <span>
                                            {t.contracts.disbursedAtLabel}{' '}
                                            <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDate(termin1.tanggal_pencairan)}</strong>
                                        </span>
                                    ) : (
                                        <span>{t.contracts.statusReadyToDisburse}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isT1Disbursed && termin1.bukti_transfer_path ? (
                                        <a
                                            href={`/storage/${termin1.bukti_transfer_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline dark:text-sky-400"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            {t.contracts.proofOfTransfer}
                                        </a>
                                    ) : !isT1Disbursed && termin1.id > 0 ? (
                                        <Button
                                            size="sm"
                                            onClick={() => openDisburse(termin1)}
                                            className="h-7 gap-1 bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            <FileCheck className="h-3.5 w-3.5" />
                                            {t.contracts.disburseTranche1Btn}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* TERMIN 2 (30%) - MONEV GATEKEEPER LOCK */}
                        <div
                            className={`rounded-lg border p-5 transition-colors ${
                                isT2Disbursed
                                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                    : !isMonevApproved
                                      ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
                                      : 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                            {t.funding.tranche2RatioBadge}
                                        </span>
                                        {isT2Disbursed ? (
                                            <StatusBadge status="Disbursed_T2" size="sm" />
                                        ) : !isMonevApproved ? (
                                            <StatusBadge status="Monev_Locked" size="sm" />
                                        ) : (
                                            <StatusBadge status="Monev_Approved" size="sm" />
                                        )}
                                    </div>
                                    <h3 className="pt-1 font-serif text-base font-bold text-slate-900 dark:text-slate-100">{t.contracts.tranche2CardTitle}</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">{t.contracts.tranche2CardDesc}</p>
                                </div>
                                <TabularFigure
                                    value={termin2.nominal_dana}
                                    type="currency"
                                    size="xl"
                                    weight="bold"
                                    className={isT2Disbursed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}
                                />
                            </div>

                            {/* Warning Banner if Monev Locked */}
                            {!isT2Disbursed && !isMonevApproved && (
                                <div className="mt-3 space-y-1 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                                    <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
                                        <Lock className="h-3.5 w-3.5 shrink-0 text-rose-700 dark:text-rose-400" />
                                        <span>{t.contracts.monevLockBannerTitle}</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">{t.contracts.monevLockBannerDesc}</p>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs dark:border-slate-800">
                                <div className="text-slate-500 dark:text-slate-400">
                                    {isT2Disbursed ? (
                                        <span>
                                            {t.contracts.disbursedAtLabel}{' '}
                                            <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDate(termin2.tanggal_pencairan)}</strong>
                                        </span>
                                    ) : !isMonevApproved ? (
                                        <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400">{t.contracts.monevLockStatusBlocked}</span>
                                    ) : (
                                        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">{t.contracts.monevLockStatusReady}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isT2Disbursed && termin2.bukti_transfer_path ? (
                                        <a
                                            href={`/storage/${termin2.bukti_transfer_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline dark:text-sky-400"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            {t.contracts.proofOfTransfer}
                                        </a>
                                    ) : !isT2Disbursed && termin2.id > 0 ? (
                                        <Button
                                            size="sm"
                                            variant={isMonevApproved ? 'default' : 'secondary'}
                                            onClick={() => openDisburse(termin2)}
                                            className={`h-7 gap-1 text-xs ${
                                                isMonevApproved
                                                    ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                                    : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50'
                                            }`}
                                        >
                                            {isMonevApproved ? (
                                                <>
                                                    <FileCheck className="h-3.5 w-3.5" />
                                                    {t.contracts.disburseTranche2Btn}
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-3.5 w-3.5" />
                                                    {t.statuses.Monev_Locked}
                                                </>
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Usulan Penelitian & Anggaran Realisasi (Budget Cut Adjustment) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif text-base font-bold text-slate-900 dark:text-slate-100">
                                    <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    {t.contracts.proposalGrantInfoTitle}
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">{t.contracts.proposalGrantInfoDesc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DetailRow
                                    icon={FileText}
                                    label={t.contracts.proposalTitle}
                                    value={contract.proposal?.judul_penelitian || contractTitle}
                                />
                                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-2 dark:border-slate-800 sm:grid-cols-2">
                                    <DetailRow
                                        icon={Layers}
                                        label={t.contracts.scheme}
                                        value={contract.proposal?.research_schema?.nama_skema || '-'}
                                    />
                                    <DetailRow icon={User} label={t.contracts.leadResearcher} value={contract.proposal?.pengusul?.name || '-'} />
                                </div>

                                <Separator className="dark:bg-slate-800" />

                                {/* Tabular Anggaran & Budget Cut */}
                                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                                    <p className="font-mono text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {t.contracts.budgetComparisonTitle}
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">{t.contracts.schemeMaxBudget}</span>
                                            <TabularFigure
                                                value={maxBudget}
                                                type="currency"
                                                size="base"
                                                weight="semibold"
                                                className="text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">{t.contracts.proposedBudgetLabel}</span>
                                            <TabularFigure
                                                value={proposedBudget}
                                                type="currency"
                                                size="base"
                                                weight="semibold"
                                                className="text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">{t.contracts.approvedContractBudget}</span>
                                            <TabularFigure
                                                value={contractValue}
                                                type="currency"
                                                size="base"
                                                weight="bold"
                                                className="font-semibold text-emerald-700 dark:text-emerald-400"
                                            />
                                        </div>
                                    </div>
                                    {budgetCut > 0 && (
                                        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs text-amber-800 dark:border-slate-800 dark:text-amber-400">
                                            <span>{t.contracts.budgetCutAdjustment}</span>
                                            <span className="font-mono font-bold">
                                                {t.contracts.cutAmount}{' '}
                                                <TabularFigure value={budgetCut} type="currency" size="sm" className="text-amber-800 dark:text-amber-400" />
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {contract.terms && (
                                    <>
                                        <Separator className="dark:bg-slate-800" />
                                        <div>
                                            <p className="mb-1 font-mono text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                {t.contracts.specialTerms}
                                            </p>
                                            <div className="rounded border bg-slate-50/50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                                {contract.terms}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Status Kontrak & Aksi */}
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">{t.contracts.contractAuthority}</CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">{t.contracts.contractAuthorityDesc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <span className="block font-mono text-xs tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {t.contracts.currentStatus}
                                    </span>
                                    <StatusBadge status={badgeInfo.type} size="md" />
                                </div>

                                {currentStatus === 'draft' && (
                                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <Button
                                            onClick={() => setPendingStatus('active')}
                                            disabled={processing}
                                            className="w-full gap-1.5 bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {t.contracts.activateContractBtn}
                                        </Button>
                                    </div>
                                )}

                                {currentStatus === 'active' && (
                                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <Button
                                            variant="outline"
                                            onClick={() => setPendingStatus('selesai')}
                                            disabled={processing}
                                            className="w-full gap-1.5 text-xs font-medium dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                            {t.contracts.markCompletedBtn}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Audit Trail Card */}
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">{t.contracts.auditTrailTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                <div>
                                    <span className="block font-mono text-[11px] tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {t.contracts.issuedBy}
                                    </span>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{contract.creator?.name || 'Administrator'}</p>
                                    <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{contract.created_at}</p>
                                </div>
                                <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                                    <span className="block font-mono text-[11px] tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {t.contracts.lastUpdate}
                                    </span>
                                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{contract.updated_at}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Pencairan Dana */}
            <DisburseModal funding={selectedFunding} open={disburseModalOpen} onOpenChange={setDisburseModalOpen} onSuccess={() => router.reload()} />

            {/* Dialog Konfirmasi Perubahan Status Kontrak */}
            <AlertDialog
                open={pendingStatus !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingStatus(null);
                }}
            >
                <AlertDialogContent className="dark:border-slate-800 dark:bg-slate-900">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif font-bold text-slate-900 dark:text-slate-100">{t.contracts.confirmStatusTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                            {t.contracts.confirmStatusDesc
                                .replace('{number}', contractNumber)
                                .replace('{status}', pendingStatus?.toUpperCase() || '')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={processing}
                            onClick={() => pendingStatus && handleUpdateStatus(pendingStatus)}
                            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            {processing ? t.contracts.updatingStatus : t.contracts.confirmUpdateBtn}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
