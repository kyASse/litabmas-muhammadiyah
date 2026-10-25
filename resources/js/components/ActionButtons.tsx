/**
 * ActionButtons — Detail / Approve (Setujui) / Reject (Tolak) / Assign Reviewer
 *
 * @description
 * Komponen tombol aksi terstandarisasi shadcn/ui untuk peninjauan dan tata kelola
 * proposal penelitian. Membedakan wewenang Admin Kampus (campus-approve -> Approved_Kampus)
 * dan Super Admin Bappeda (approve / verify-administration -> Lolos_Administrasi).
 */

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, Eye, MoreHorizontal, ShieldCheck, UserCheck, UserX, XCircle } from 'lucide-react';
import { route } from 'ziggy-js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActionButtonsProps {
    /** ID unik proposal */
    proposalId: number;
    /** Judul proposal (dipakai di dialog konfirmasi) */
    proposalTitle: string;
    /** Status proposal saat ini */
    status: string;
    /** Callback yang dipicu saat tombol "Tolak" diklik */
    onReject: () => void;
    /** Callback yang dipicu saat tombol "Tunjuk/Ubah Reviewer" diklik (opsional) */
    onAssign?: () => void;
    /** Apakah proposal sudah memiliki reviewer */
    hasReviewer?: boolean;
    /** Callback yang dipicu saat tombol "Hapus Reviewer" diklik (opsional) */
    onUnassign?: () => void;
    /** Nonaktifkan tombol saat sedang memproses (opsional) */
    disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActionButtons({
    proposalId,
    proposalTitle,
    status,
    onReject,
    onAssign,
    hasReviewer = false,
    onUnassign,
    disabled = false,
}: ActionButtonsProps) {
    const { t, format } = useTranslation();
    const { auth } = usePage<SharedData>().props;

    const isSuperAdmin = auth?.user?.role?.name === 'Super Admin' || auth?.user?.roles?.some((r) => r.name === 'Super Admin');
    const isAdminKampus = auth?.user?.role?.name === 'Admin Kampus' || auth?.user?.roles?.some((r) => r.name === 'Admin Kampus');

    // Aksi Persetujuan Internal Kampus (Admin Kampus) -> Mengubah status menjadi Approved_Kampus
    const handleCampusApprove = () => {
        const confirmMsg = format(t.adminProposals.confirmCampusApprove, { title: proposalTitle });
        if (!confirm(confirmMsg)) return;
        router.post(route('admin.proposals.campus-approve', { proposal: proposalId }));
    };

    // Aksi Validasi Administrasi Pusat (Super Admin Bappeda) -> Arahkan ke halaman detail untuk pemeriksaan berkas & checklist
    const handleAdminApprove = () => {
        router.visit(route('admin.proposals.show', { proposal: proposalId, verify: 1 }));
    };

    const getDetailHref = () => {
        try {
            return route('admin.proposals.show', { proposal: proposalId });
        } catch {
            return `/admin/proposals/${proposalId}`;
        }
    };

    // Evaluasi status dan peran pengguna
    // Hanya Admin Kampus yang berhak memproses usulan berstatus Submitted_Kampus / Submitted
    const isSubmittedKampus = isAdminKampus && (status === 'Submitted_Kampus' || status === 'Submitted');
    // Super Admin hanya memvalidasi administrasi usulan yang telah disetujui kampus (Approved_Kampus / Submitted_Bappeda)
    const isSubmittedBappeda = isSuperAdmin && (status === 'Approved_Kampus' || status === 'Submitted_Bappeda');
    // Super Admin menugaskan reviewer hanya setelah usulan Lolos Administrasi
    const isReviewable = isSuperAdmin && (status === 'Administrasi_Valid' || status === 'Lolos_Administrasi');

    const hasExtraActions = isSubmittedKampus || isSubmittedBappeda || isReviewable;

    return (
        <div className="flex items-center justify-end gap-1.5">
            {/* Tombol Cepat: Lihat Detail Proposal */}
            <Link href={getDetailHref()}>
                <Button
                    id={`btn-detail-${proposalId}`}
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                    title={t.adminProposals.viewDetailsBtn}
                >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t.adminProposals.viewDetailsBtn}</span>
                </Button>
            </Link>

            {/* Dropdown Menu untuk Aksi Tambahan Administratif */}
            {hasExtraActions && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            id={`btn-menu-${proposalId}`}
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            title={t.adminProposals.moreActions}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t.adminProposals.moreActions}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 shadow-lg">
                        {/* 1. Alur Admin Kampus: Persetujuan Tingkat Kampus */}
                        {isSubmittedKampus && (
                            <>
                                <DropdownMenuItem
                                    id={`btn-campus-approve-${proposalId}`}
                                    disabled={disabled}
                                    onClick={handleCampusApprove}
                                    className="cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:focus:bg-emerald-950/50"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    {t.adminProposals.campusApproveBtn}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    id={`btn-campus-reject-${proposalId}`}
                                    disabled={disabled}
                                    onClick={onReject}
                                    className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/50"
                                >
                                    <XCircle className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    {t.adminProposals.campusRejectBtn}
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* 2. Alur Super Admin Bappeda: Validasi Administrasi Pusat */}
                        {!isSubmittedKampus && isSubmittedBappeda && (
                            <>
                                <DropdownMenuItem
                                    id={`btn-approve-${proposalId}`}
                                    disabled={disabled}
                                    onClick={handleAdminApprove}
                                    className="cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-400 dark:focus:bg-emerald-950/50"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    {t.adminProposals.approveBtn}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    id={`btn-reject-${proposalId}`}
                                    disabled={disabled}
                                    onClick={onReject}
                                    className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/50"
                                >
                                    <XCircle className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    {t.adminProposals.rejectBtn}
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* 3. Alur Super Admin Bappeda: Plotting Reviewer untuk Proposal yang Lolos Administrasi */}
                        {isReviewable && (
                            <>
                                <DropdownMenuItem
                                    id={`btn-assign-${proposalId}`}
                                    disabled={disabled}
                                    onClick={onAssign ? onAssign : () => router.get('/admin/reviewer/assign?proposal_id=' + proposalId)}
                                    className="cursor-pointer text-blue-700 focus:bg-blue-50 focus:text-blue-800 dark:text-blue-400 dark:focus:bg-blue-950/50"
                                >
                                    <UserCheck className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    {hasReviewer ? t.adminProposals.reassignReviewerBtn : t.adminProposals.assignReviewerBtn}
                                </DropdownMenuItem>
                                {hasReviewer && onUnassign && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            id={`btn-unassign-${proposalId}`}
                                            disabled={disabled}
                                            onClick={onUnassign}
                                            className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/50"
                                        >
                                            <UserX className="mr-2 h-4 w-4 text-rose-500 dark:text-rose-400" />
                                            {t.adminProposals.unassignBtn}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
