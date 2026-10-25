/**
 * Finance/Proposal/Show — Detail Usulan & Audit Kepatuhan Anggaran (SBM)
 *
 * @description
 * Halaman detail usulan penelitian untuk telaah mendalam kepatuhan anggaran (RAB)
 * terhadap Standar Biaya Masukan (SBM) Kota Yogyakarta oleh Admin Keuangan Bappeda.
 * Mengikuti sistem desain Scholarly Enterprise, 100% bebas simbol emoji.
 */

import RabVerificationModal from '@/components/RabVerificationModal';
import PageHeader from '@/components/ui/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calculator, CheckCircle2, Clock, Coins, Download, FileText, Info, ShieldCheck, User, XCircle } from 'lucide-react';
import { useState } from 'react';

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
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <Link
                        href="/finance/proposals"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.financeProposals.backToQueue}
                    </Link>

                    <Button
                        onClick={() => setShowAuditModal(true)}
                        className="gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
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
                    <AlertTitle className="text-xs font-semibold">{t.financeProposals.budgetAuditCard}</AlertTitle>
                    <AlertDescription className="mt-0.5 text-xs text-blue-800/90 dark:text-blue-300/90">
                        {t.financeProposals.budgetComplianceNotice}
                    </AlertDescription>
                </Alert>

                {/* Grid 1: Budget and Sign-off Status Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Budget Breakdown Card */}
                    <Card className="border border-border shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Coins className="h-4 w-4 text-primary" />
                                {t.financeProposals.budgetAuditCard}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <span className="block text-xs text-muted-foreground">{t.financeProposals.proposedBudget}</span>
                                <span className="font-mono text-lg font-bold text-foreground">
                                    {formatCurrency(proposal.biaya_yang_diusulkan || 0)}
                                </span>
                            </div>

                            {proposal.research_schema?.max_funding ? (
                                <div className="border-t border-border pt-2">
                                    <span className="block text-xs text-muted-foreground">{t.financeProposals.schemeMaxBudget}</span>
                                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                                        {formatCurrency(proposal.research_schema.max_funding)}
                                    </span>
                                </div>
                            ) : null}

                            {proposal.rekomendasi_anggaran ? (
                                <div className="border-t border-border pt-2">
                                    <span className="block text-xs text-muted-foreground">{t.financeProposals.recommendedBudget}</span>
                                    <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                                        {formatCurrency(proposal.rekomendasi_anggaran)}
                                    </span>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Dual Sign-Off Gate Status Card */}
                    <Card className="border border-border shadow-xs md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                {t.dualVerificationCard.title}
                            </CardTitle>
                            <CardDescription className="text-xs">{t.dualVerificationCard.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Gate 1: Administrasi */}
                            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground">{t.dualVerificationCard.adminGateTitle}</span>
                                    {proposal.is_administrasi_approved === true ? (
                                        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            {t.dualVerificationCard.statusApproved}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="gap-1 border-border text-[11px] font-medium text-muted-foreground">
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
                                    <div className="rounded border border-border/50 bg-background/60 p-2 text-xs text-[11px] text-foreground/90">
                                        {proposal.catatan_administrasi}
                                    </div>
                                )}
                            </div>

                            {/* Gate 2: RAB Audit */}
                            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground">{t.dualVerificationCard.rabGateTitle}</span>
                                    {proposal.is_rab_approved === true ? (
                                        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            {t.dualVerificationCard.statusApproved}
                                        </Badge>
                                    ) : proposal.is_rab_approved === false ? (
                                        <Badge className="gap-1 border-destructive/30 bg-destructive/10 text-[11px] font-medium text-destructive">
                                            <XCircle className="h-3 w-3 text-destructive" />
                                            {t.dualVerificationCard.statusRejected}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-800 dark:text-amber-300"
                                        >
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
                                    <div className="rounded border border-border/50 bg-background/60 p-2 text-xs text-[11px] text-foreground/90">
                                        {proposal.catatan_keuangan}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grid 2: Researcher Info & Documents */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Researcher Card */}
                    <Card className="border border-border shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="h-4 w-4 text-primary" />
                                {t.financeProposals.applicantCard}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 text-xs">
                            <div>
                                <span className="block text-muted-foreground">Nama Lengkap</span>
                                <span className="font-medium text-foreground">{proposal.pengusul?.name || '-'}</span>
                            </div>
                            {proposal.pengusul?.nidn && (
                                <div>
                                    <span className="block text-muted-foreground">NIDN / NIP</span>
                                    <span className="font-mono text-foreground">{proposal.pengusul.nidn}</span>
                                </div>
                            )}
                            <div>
                                <span className="block text-muted-foreground">Institusi / Kampus</span>
                                <span className="font-medium text-foreground">{proposal.university?.name || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-muted-foreground">Kontak Email</span>
                                <span className="text-foreground">{proposal.pengusul?.email || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proposal Description & Documents */}
                    <Card className="border border-border shadow-xs md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="h-4 w-4 text-primary" />
                                Dokumen & Berkas Usulan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {proposal.abstract && (
                                <div>
                                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Abstrak Penelitian</span>
                                    <p className="rounded-lg border border-border/50 bg-muted/20 p-3 font-serif text-xs leading-relaxed text-foreground/90">
                                        {proposal.abstract}
                                    </p>
                                </div>
                            )}

                            <div>
                                <span className="mb-2 block text-xs font-semibold text-muted-foreground">Lampiran Berkas (PDF)</span>
                                {proposal.documents && proposal.documents.length > 0 ? (
                                    <div className="space-y-2">
                                        {proposal.documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-2.5 text-xs"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                                                    <span className="truncate font-medium">{doc.file_name}</span>
                                                </div>
                                                <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" asChild>
                                                    <a href={`/storage/${doc.file_path}`} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3" />
                                                        Unduh
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Tidak ada dokumen lampiran terpisah yang terunggah.</p>
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
