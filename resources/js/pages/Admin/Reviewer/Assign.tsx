/**
 * ReviewerAssign Component
 *
 * @description
 * Halaman antarmuka untuk Admin (Super Admin & Admin Kampus) melakukan penunjukan (assignment) reviewer
 * ke proposal penelitian dengan deteksi dini Conflict of Interest (CoI) dan Discrepancy Warning.
 *
 * @filepath /resources/js/pages/Admin/Reviewer/Assign.tsx
 */

import AssignModal from '@/components/AssignModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, ArrowLeft, ClipboardList, FileText, UserCheck, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface ProposalMember {
    id: number;
    user_id: number;
    peran?: string;
    user?: {
        id: number;
        name: string;
    };
}

interface ProposalReview {
    id: number;
    id_reviewer: number;
    skor_total?: number | string | null;
    status_review?: string;
}

interface Proposal {
    id: number;
    title?: string;
    judul_penelitian?: string;
    id_pengusul?: number;
    user_id?: number;
    status_proposal?: string;
    pengusul?: {
        id: number;
        name: string;
    };
    members?: ProposalMember[];
    reviews?: ProposalReview[];
}

interface Reviewer {
    id: number;
    name: string;
}

interface Props {
    proposals: Proposal[];
    reviewers: Reviewer[];
    selectedProposalId?: string | number;
}

export default function AssignReviewer({ proposals = [], reviewers = [], selectedProposalId }: Props) {
    const { t, format } = useTranslation();
    const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialProposalId = selectedProposalId ? String(selectedProposalId) : queryParams?.get('proposal_id') || '';

    const { data, setData, post, processing, errors } = useForm({
        proposal_id: initialProposalId,
        reviewer_id: '',
    });

    const [openModal, setOpenModal] = useState(false);

    const selectedProposal = proposals.find((p) => String(p.id) === String(data.proposal_id));
    const selectedReviewer = reviewers.find((r) => String(r.id) === String(data.reviewer_id));

    // Conflict of Interest (CoI) inspection
    const reviewerIdNum = data.reviewer_id ? Number(data.reviewer_id) : null;
    const isApplicantCoI = Boolean(
        selectedProposal &&
            reviewerIdNum &&
            (selectedProposal.id_pengusul === reviewerIdNum ||
                selectedProposal.user_id === reviewerIdNum ||
                selectedProposal.pengusul?.id === reviewerIdNum),
    );
    const isMemberCoI = Boolean(
        selectedProposal && reviewerIdNum && selectedProposal.members?.some((m) => m.user_id === reviewerIdNum || m.user?.id === reviewerIdNum),
    );
    const hasCoI = isApplicantCoI || isMemberCoI;

    // Disparity calculation for proposals with 2 completed reviews
    let hasDiscrepancy = false;
    let score1 = 0;
    let score2 = 0;
    let disparity = 0;

    if (selectedProposal && selectedProposal.reviews) {
        const completedReviews = selectedProposal.reviews.filter(
            (r) => r.status_review === 'Completed' || (r.skor_total !== null && r.skor_total !== undefined && Number(r.skor_total) > 0),
        );
        if (completedReviews.length >= 2) {
            score1 = Number(completedReviews[0].skor_total);
            score2 = Number(completedReviews[1].skor_total);
            disparity = Math.abs(score1 - score2);
            if (disparity > 30) {
                hasDiscrepancy = true;
            }
        }
    }

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/dashboard',
        },
        {
            title: t.navigation.proposals,
            href: '/admin/proposals',
        },
        {
            title: t.reviewerAssign.pageTitle,
            href: '#',
        },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!data.proposal_id || !data.reviewer_id || hasCoI) return;
        setOpenModal(true);
    };

    const confirmAssign = () => {
        post(route('admin.assign.store'), {
            onSuccess: () => {
                setOpenModal(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.reviewerAssign.pageTitle} - Admin`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="mx-auto w-full max-w-2xl space-y-6">
                    {/* Back Link & Header */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" className="h-auto gap-2 p-0 text-muted-foreground hover:text-foreground" asChild>
                                <Link href="/admin/proposals">
                                    <ArrowLeft className="h-4 w-4" />
                                    {t.reviewerAssign.backToProposals}
                                </Link>
                            </Button>
                            <LanguageSwitcher size="sm" variant="compact" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-900">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">{t.reviewerAssign.pageTitle}</h1>
                                <p className="mt-0.5 font-sans text-sm text-muted-foreground">{t.reviewerAssign.pageSubtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Discrepancy Warning Banner */}
                    {hasDiscrepancy && (
                        <div className="space-y-2.5 rounded-lg border-2 border-amber-300 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <StatusBadge status="Revisi" labelOverride={t.reviewerAssign.discrepancyBadge} />
                                    <span className="text-xs font-bold tracking-wide text-amber-900 uppercase">
                                        {t.reviewerAssign.discrepancyTitle}
                                    </span>
                                </div>
                                <TabularFigure value={disparity} type="score" size="sm" weight="bold" suffix=" pts" className="text-amber-900" />
                            </div>
                            <p className="font-sans text-xs leading-relaxed text-amber-900">
                                {format(t.reviewerAssign.discrepancyDescription, {
                                    score1: score1.toFixed(1),
                                    score2: score2.toFixed(1),
                                    diff: disparity.toFixed(1),
                                })}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                                <span className="inline-flex items-center rounded border border-amber-300 bg-amber-200/80 px-2.5 py-1 text-xs font-medium text-amber-900">
                                    {t.reviewerAssign.assignTieBreakerPrompt}
                                </span>
                                <span className="font-mono text-xs text-amber-800">
                                    {format(t.reviewerAssign.reviewsCompletedCount, { count: '2' })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Conflict of Interest (CoI) Warning Banner */}
                    {hasCoI && (
                        <div className="space-y-2 rounded-lg border-2 border-rose-600 bg-rose-50 p-4 text-rose-900 shadow-sm">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                                <div className="space-y-1">
                                    <h4 className="font-sans text-sm font-bold tracking-wide text-rose-800 uppercase">{t.reviewerAssign.coiTitle}</h4>
                                    <p className="font-sans text-xs leading-relaxed text-rose-700">
                                        {isApplicantCoI ? t.reviewerAssign.coiApplicantNotice : t.reviewerAssign.coiMemberNotice}
                                    </p>
                                    <p className="pt-1 text-xs font-semibold text-rose-800">{t.reviewerAssign.coiSubmitDisabled}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Card */}
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="font-sans text-lg font-semibold">{t.reviewerAssign.formCardTitle}</CardTitle>
                            <CardDescription className="font-sans">{t.reviewerAssign.formCardSubtitle}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* Proposal Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="proposal_id" className="flex items-center gap-2 text-sm font-medium">
                                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                        {t.reviewerAssign.labelSelectProposal} <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.proposal_id} onValueChange={(val) => setData('proposal_id', val)}>
                                        <SelectTrigger id="proposal_id" className={`w-full ${errors.proposal_id ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder={t.reviewerAssign.placeholderSelectProposal} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proposals.length === 0 ? (
                                                <div className="p-3 text-center text-sm text-muted-foreground">{t.reviewerAssign.noProposals}</div>
                                            ) : (
                                                proposals.map((proposal) => {
                                                    const proposalTitle = proposal.title || proposal.judul_penelitian || `Proposal #${proposal.id}`;
                                                    return (
                                                        <SelectItem key={proposal.id} value={String(proposal.id)}>
                                                            <div className="flex w-full items-center justify-between gap-2">
                                                                <span className="max-w-md truncate">{proposalTitle}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.proposal_id && (
                                        <p className="flex items-center gap-1.5 text-xs text-destructive">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {errors.proposal_id}
                                        </p>
                                    )}
                                </div>

                                {/* Reviewer Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="reviewer_id" className="flex items-center gap-2 text-sm font-medium">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        {t.reviewerAssign.labelSelectReviewer} <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.reviewer_id} onValueChange={(val) => setData('reviewer_id', val)}>
                                        <SelectTrigger
                                            id="reviewer_id"
                                            className={`w-full ${errors.reviewer_id || hasCoI ? 'border-destructive' : ''}`}
                                        >
                                            <SelectValue placeholder={t.reviewerAssign.placeholderSelectReviewer} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reviewers.length === 0 ? (
                                                <div className="p-3 text-center text-sm text-muted-foreground">{t.reviewerAssign.noReviewers}</div>
                                            ) : (
                                                reviewers.map((reviewer) => (
                                                    <SelectItem key={reviewer.id} value={String(reviewer.id)}>
                                                        {reviewer.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.reviewer_id && (
                                        <p className="flex items-center gap-1.5 text-xs text-destructive">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {errors.reviewer_id}
                                        </p>
                                    )}
                                </div>

                                {/* Summary Box if selected */}
                                {(selectedProposal || selectedReviewer) && (
                                    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                                        <div className="flex items-center gap-2 font-medium text-primary">
                                            <FileText className="h-4 w-4" />
                                            {t.reviewerAssign.summaryTitle}
                                        </div>
                                        {selectedProposal && (
                                            <p className="font-sans text-muted-foreground">
                                                <span className="font-medium text-foreground">{t.reviewerAssign.summaryProposal}</span>{' '}
                                                <span className="font-serif font-medium">
                                                    {selectedProposal.title || selectedProposal.judul_penelitian}
                                                </span>
                                            </p>
                                        )}
                                        {selectedReviewer && (
                                            <p className="font-sans text-muted-foreground">
                                                <span className="font-medium text-foreground">{t.reviewerAssign.summaryReviewer}</span>{' '}
                                                <span className="font-semibold text-foreground">{selectedReviewer.name}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/proposals">{t.reviewerAssign.btnCancel}</Link>
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={processing || !data.proposal_id || !data.reviewer_id || hasCoI}
                                        className={`gap-2 ${hasCoI ? 'cursor-not-allowed bg-slate-400 opacity-50' : 'bg-blue-900 hover:bg-blue-800'}`}
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        {processing ? t.reviewerAssign.btnSubmitting : t.reviewerAssign.btnSubmit}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AssignModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onConfirm={confirmAssign}
                loading={processing}
                proposalTitle={selectedProposal?.title || selectedProposal?.judul_penelitian}
            />
        </AppLayout>
    );
}
