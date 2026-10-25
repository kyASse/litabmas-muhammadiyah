/**
 * Finance/Proposal/Show — Detail Usulan & Audit Kepatuhan Anggaran (SBM)
 *
 * @description
 * Halaman detail usulan penelitian untuk telaah mendalam kepatuhan anggaran (RAB)
 * terhadap Standar Biaya Masukan (SBM) Kota Yogyakarta oleh Admin Keuangan Bappeda.
 * Mengikuti sistem desain Scholarly Enterprise, 100% bebas simbol emoji.
 */

import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import RabVerificationModal from '@/components/RabVerificationModal';
import {
    ArrowLeft,
    Calculator,
    CheckCircle2,
    Clock,
    XCircle,
    Building2,
    User,
    Mail,
    FileText,
    Download,
    Info,
    Calendar,
    ShieldCheck,
    Coins,
    Users,
} from 'lucide-react';

interface ProposalDetail {
    id: number;
    title: string;
    abstract?: string | null;
    status_proposal: string;
    biaya_yang_diusulkan: number;
    rekomendasi_anggaran: number | null;
    is_administrasi_approved: boolean | null;
    is_rab_approved: boolean | null;
    catatan_administrasi: string | null;
    catatan_keuangan: string | null;
    tanggal_pengajuan: string | null;
    tanggal_verifikasi_administrasi: string | null;
    tanggal_verifikasi_rab: string | null;
    pengusul?: {
        id: number;
        name: string;
        email: string;
        nidn?: string | null;
    } | null;
    university?: {
        id: number;
        name: string;
    } | null;
    research_schema?: {
        id: number;
        name: string;
        max_funding?: number;
        tahun_anggaran?: number;
    } | null;
    documents?: Array<{
        id: number;
        file_name: string;
        file_path: string;
    }>;
    members?: Array<{
        id: number;
        peran: string;
        user?: {
            id: number;
            name: string;
            nidn?: string | null;
        } | null;
    }>;
}

interface Props {
    proposal: ProposalDetail;
}

export default function FinanceProposalShow({ proposal }: Props) {
    const { t } = useTranslation();
    const [showAuditModal, setShowAuditModal] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: t.navigation.rabVerification, href: '/finance/proposals' },
        { title: proposal.title, href: `/finance/proposals/${proposal.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.financeProposals.detailTitle} - ${proposal.title}`} />

            <div className="flex flex-col gap-6 p-6">
                {/* Back Link & Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link
                        href="/finance/proposals"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.financeProposals.backToQueue}
                    </Link>

                    <Button
                        onClick={() => setShowAuditModal(true)}
                        className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Calculator className="h-4 w-4" />
                        {t.financeProposals.verifyRabBtn}
                    </Button>
                </div>

                <PageHeader
                    title={proposal.title}
                    subtitle={`${proposal.research_schema?.name || 'Skema Penelitian'} ${
                        proposal.research_schema?.tahun_anggaran ? `(TA ${proposal.research_schema.tahun_anggaran})` : ''
                    }`}
                />

                {/* SBM Notice */}
                <Alert className="border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-xs font-semibold">
                        {t.financeProposals.budgetAuditCard}
                    </AlertTitle>
                    <AlertDescription className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                        {t.financeProposals.budgetComplianceNotice}
                    </AlertDescription>
                </Alert>

                {/* Grid 1: Budget and Sign-off Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Budget Breakdown Card */}
                    <Card className="border border-border shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Coins className="h-4 w-4 text-primary" />
                                {t.financeProposals.budgetAuditCard}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    {t.financeProposals.proposedBudget}
                                </span>
                                <span className="text-lg font-bold font-mono text-foreground">
                                    {formatCurrency(proposal.biaya_yang_diusulkan || 0)}
                                </span>
                            </div>

                            {proposal.research_schema?.max_funding ? (
                                <div className="pt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground block">
                                        {t.financeProposals.schemeMaxBudget}
                                    </span>
                                    <span className="text-sm font-semibold font-mono text-muted-foreground">
                                        {formatCurrency(proposal.research_schema.max_funding)}
                                    </span>
                                </div>
                            ) : null}

                            {proposal.rekomendasi_anggaran ? (
                                <div className="pt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground block">
                                        {t.financeProposals.recommendedBudget}
                                    </span>
                                    <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                                        {formatCurrency(proposal.rekomendasi_anggaran)}
                                    </span>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Dual Sign-Off Gate Status Card */}
                    <Card className="border border-border shadow-xs md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                {t.dualVerificationCard.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {t.dualVerificationCard.subtitle}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Gate 1: Administrasi */}
                            <div className="rounded-lg border border-border p-3.5 bg-muted/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground">
                                        {t.dualVerificationCard.adminGateTitle}
                                    </span>
                                    {proposal.is_administrasi_approved === true ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            {t.dualVerificationCard.statusApproved}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-border text-[11px] font-medium gap-1">
                                            <Clock className="h-3 w-3" />
                                            {t.dualVerificationCard.statusPending}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {proposal.tanggal_verifikasi_administrasi
                                        ? `${t.financeProposals.verifiedAt} ${proposal.tanggal_verifikasi_administrasi}`
                                        : t.financeProposals.unverified}
                                </div>
                                {proposal.catatan_administrasi && (
                                    <div className="text-xs text-foreground/90 bg-background/60 p-2 rounded border border-border/50 text-[11px]">
                                        {proposal.catatan_administrasi}
                                    </div>
                                )}
                            </div>

                            {/* Gate 2: RAB Audit */}
                            <div className="rounded-lg border border-border p-3.5 bg-muted/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground">
                                        {t.dualVerificationCard.rabGateTitle}
                                    </span>
                                    {proposal.is_rab_approved === true ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            {t.dualVerificationCard.statusApproved}
                                        </Badge>
                                    ) : proposal.is_rab_approved === false ? (
                                        <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[11px] font-medium gap-1">
                                            <XCircle className="h-3 w-3 text-destructive" />
                                            {t.dualVerificationCard.statusRejected}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 text-[11px] font-medium gap-1">
                                            <Clock className="h-3 w-3 text-amber-600" />
                                            {t.dualVerificationCard.statusPending}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {proposal.tanggal_verifikasi_rab
                                        ? `${t.financeProposals.verifiedAt} ${proposal.tanggal_verifikasi_rab}`
                                        : t.financeProposals.unverified}
                                </div>
                                {proposal.catatan_keuangan && (
                                    <div className="text-xs text-foreground/90 bg-background/60 p-2 rounded border border-border/50 text-[11px]">
                                        {proposal.catatan_keuangan}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grid 2: Researcher Info & Documents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Researcher Card */}
                    <Card className="border border-border shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                {t.financeProposals.applicantCard}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 text-xs">
                            <div>
                                <span className="text-muted-foreground block">Nama Lengkap</span>
                                <span className="font-medium text-foreground">{proposal.pengusul?.name || '-'}</span>
                            </div>
                            {proposal.pengusul?.nidn && (
                                <div>
                                    <span className="text-muted-foreground block">NIDN / NIP</span>
                                    <span className="font-mono text-foreground">{proposal.pengusul.nidn}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground block">Institusi / Kampus</span>
                                <span className="font-medium text-foreground">{proposal.university?.name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Kontak Email</span>
                                <span className="text-foreground">{proposal.pengusul?.email || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proposal Description & Documents */}
                    <Card className="border border-border shadow-xs md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Dokumen & Berkas Usulan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {proposal.abstract && (
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground block mb-1">
                                        Abstrak Penelitian
                                    </span>
                                    <p className="text-xs text-foreground/90 leading-relaxed font-serif bg-muted/20 p-3 rounded-lg border border-border/50">
                                        {proposal.abstract}
                                    </p>
                                </div>
                            )}

                            <div>
                                <span className="text-xs font-semibold text-muted-foreground block mb-2">
                                    Lampiran Berkas (PDF)
                                </span>
                                {proposal.documents && proposal.documents.length > 0 ? (
                                    <div className="space-y-2">
                                        {proposal.documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                                    <span className="font-medium truncate">{doc.file_name}</span>
                                                </div>
                                                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" asChild>
                                                    <a href={`/storage/${doc.file_path}`} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3" />
                                                        Unduh
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                        Tidak ada dokumen lampiran terpisah yang terunggah.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Audit RAB Modal */}
            <RabVerificationModal
                isOpen={showAuditModal}
                onClose={() => setShowAuditModal(false)}
                proposalId={proposal.id}
                proposalTitle={proposal.title}
                proposedBudget={proposal.biaya_yang_diusulkan}
                schemeMaxBudget={proposal.research_schema?.max_funding}
                initialRekomendasiAnggaran={proposal.rekomendasi_anggaran}
                initialCatatanKeuangan={proposal.catatan_keuangan}
            />
        </AppLayout>
    );
}
