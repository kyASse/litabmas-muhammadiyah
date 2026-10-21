/**
 * Proposal/Show — Dosen & Super Admin
 *
 * @description
 * Halaman detail proposal penelitian.
 *
 * @features
 * - Informasi lengkap proposal (Judul, Pengusul, Skema, Status, Deskripsi, Tanggal)
 * - Alasan penolakan (jika status Ditolak)
 * - Berkas utama & daftar dokumen pendukung beserta tombol unduh
 *
 * @route GET /proposal/{proposal}
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Download, Edit, FileText, User as UserIcon } from 'lucide-react';
import { route } from 'ziggy-js';

interface DocumentItem {
    id: number;
    file_name: string;
    file_path: string;
    document_type?: string;
    file_size?: number;
    created_at?: string;
}

interface ProposalDetail {
    id: number;
    title: string;
    description: string;
    status_proposal: string;
    rejection_reason?: string | null;
    file_dokumen_proposal?: string | null;
    created_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
    research_schema?: {
        id: number;
        name: string;
        description?: string;
    } | null;
    documents?: DocumentItem[];
}

interface ShowProps {
    proposal: ProposalDetail;
}

export default function Show({ proposal }: ShowProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const isOwner = auth?.user?.id === proposal.user?.id;
    const canEdit = isOwner && (proposal.status_proposal === 'Draft' || proposal.status_proposal === 'Revisi');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.proposalList.pageTitle, href: route('proposal.index') },
        { title: t.proposalDetail.pageTitle, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.proposalDetail.pageTitle} - ${proposal.title}`} />

            <div className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="font-sans text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t.proposalDetail.pageTitle}</h1>
                            <p className="text-sm text-muted-foreground">{t.proposalDetail.pageSubtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {canEdit && (
                            <Link href={route('proposal.edit', proposal.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t.proposalDetail.editBtn}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Status Penolakan Alert jika Ditolak */}
                {proposal.status_proposal === 'Ditolak' && proposal.rejection_reason && (
                    <div className="space-y-1 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        <div className="flex items-center space-x-2 font-semibold">
                            <AlertCircle className="h-5 w-5" />
                            <span>{t.proposalDetail.rejectedAlertTitle}</span>
                        </div>
                        <p className="pl-7 text-sm text-destructive/90">
                            <strong>{t.proposalDetail.rejectionReasonLabel}</strong> {proposal.rejection_reason}
                        </p>
                    </div>
                )}

                {/* Informasi Utama Proposal */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="font-serif text-xl leading-relaxed font-bold text-foreground">{proposal.title}</CardTitle>
                                <CardDescription className="mt-2 space-y-1">
                                    {proposal.user && (
                                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {t.proposalDetail.proposerLabel} <strong>{proposal.user.name}</strong> ({proposal.user.email})
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        {t.proposalDetail.schemeLabel}{' '}
                                        <strong className="text-foreground">{proposal.research_schema?.name || t.proposalDetail.notSpecified}</strong>
                                    </div>
                                </CardDescription>
                            </div>
                            <div>
                                <StatusBadge status={proposal.status_proposal} size="md" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                {t.proposalDetail.summaryTitle}
                            </h3>
                            <p className="rounded-md bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line text-foreground">
                                {proposal.description}
                            </p>
                        </div>

                        {/* File Dokumen Utama */}
                        {proposal.file_dokumen_proposal && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    {t.proposalDetail.mainDocumentTitle}
                                </h3>
                                <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">{t.proposalDetail.mainDocumentLabel}</span>
                                    </div>
                                    <a href={`/storage/${proposal.file_dokumen_proposal}`} target="_blank" rel="noopener noreferrer" download>
                                        <Button size="sm" variant="secondary">
                                            <Download className="mr-2 h-4 w-4" />
                                            {t.proposalDetail.downloadFileBtn}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Dokumen Pendukung */}
                        {proposal.documents && proposal.documents.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                    {t.proposalDetail.supportingDocumentsTitle}
                                </h3>
                                <div className="space-y-2">
                                    {proposal.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{doc.file_name}</p>
                                                    {doc.document_type && <p className="text-xs text-muted-foreground">{doc.document_type}</p>}
                                                </div>
                                            </div>
                                            <a href={route('proposal.documents.download', doc.id)}>
                                                <Button size="sm" variant="ghost">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {t.proposalDetail.downloadBtn}
                                                </Button>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
