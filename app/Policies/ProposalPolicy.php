<?php

namespace App\Policies;

use App\Models\Proposal;
use App\Models\User;

/**
 * ProposalPolicy
 *
 * Menentukan otorisasi aksi-aksi terhadap model Proposal.
 *
 * Aturan:
 * - Super Admin    : dapat melihat semua, approve, dan reject proposal
 * - Admin Kampus   : dapat melihat rekap review dan memperpanjang due date
 * - User (Dosen)   : dapat melihat proposal miliknya sendiri
 */
class ProposalPolicy
{
    /**
     * Tentukan apakah user dapat melihat daftar semua proposal (Admin view).
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdminKampus();
    }

    /**
     * Tentukan apakah user boleh mengubah proposal.
     * Hanya pemilik proposal pada institusi yang sama ketika status masih Draft atau Revisi.
     */
    public function update(User $user, Proposal $proposal): bool
    {
        if ($proposal->evaluation && $proposal->evaluation->status_penelitian === 'Selesai') {
            return false;
        }

        return $proposal->university_id === $user->university_id
            && (int) ($proposal->id_pengusul ?? $proposal->user_id) === (int) $user->id
            && in_array($proposal->status_proposal, [Proposal::STATUS_DRAFT, Proposal::STATUS_REJECTED_KAMPUS, 'Revisi'], true);
    }

    /**
     * Tentukan apakah user boleh menghapus proposal.
     * Hanya pemilik proposal pada institusi yang sama ketika status masih Draft atau Revisi.
     */
    public function delete(User $user, Proposal $proposal): bool
    {
        if ($proposal->evaluation && $proposal->evaluation->status_penelitian === 'Selesai') {
            return false;
        }

        return $proposal->university_id === $user->university_id
            && (int) ($proposal->id_pengusul ?? $proposal->user_id) === (int) $user->id
            && in_array($proposal->status_proposal, [Proposal::STATUS_DRAFT, Proposal::STATUS_REJECTED_KAMPUS, 'Revisi'], true);
    }

    /**
     * Tentukan apakah user dapat melihat proposal tertentu.
     */
    public function view(User $user, Proposal $proposal): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminKampus()) {
            return $proposal->user && $proposal->user->university_id === $user->university_id;
        }

        return $user->id === $proposal->user_id;
    }

    /**
     * Tentukan apakah user dapat meng-approve (validasi administrasi) proposal.
     * Super Admin dan Admin Kampus (pada universitas yang sama), untuk proposal berstatus Submitted.
     */
    public function approve(User $user, Proposal $proposal): bool
    {
        if (! ($user->isSuperAdmin() || $user->isAdminKampus())) {
            return false;
        }

        if ($user->isAdminKampus() && $proposal->user && $proposal->user->university_id !== $user->university_id) {
            return false;
        }

        $status = strtolower($proposal->status_proposal ?? '');

        return in_array($status, ['submitted', 'submitted_kampus', 'approved_kampus', 'submitted_bappeda']);
    }

    /**
     * Tentukan apakah user dapat menolak proposal.
     * Super Admin dan Admin Kampus (pada universitas yang sama), untuk proposal berstatus Submitted.
     */
    public function reject(User $user, Proposal $proposal): bool
    {
        if (! ($user->isSuperAdmin() || $user->isAdminKampus())) {
            return false;
        }

        if ($user->isAdminKampus() && $proposal->user && $proposal->user->university_id !== $user->university_id) {
            return false;
        }

        $status = strtolower($proposal->status_proposal ?? '');

        return in_array($status, ['submitted', 'submitted_kampus', 'approved_kampus', 'submitted_bappeda']);
    }

    /**
     * Tentukan apakah user dapat menyetujui proposal pada tingkat internal kampus.
     * Super Admin bypass, Admin Kampus dari university_id yang sama.
     */
    public function campusApprove(User $user, Proposal $proposal): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! $user->isAdminKampus()) {
            return false;
        }

        return (int) $user->university_id === (int) $proposal->university_id;
    }

    /**
     * Tentukan apakah user dapat menolak proposal pada tingkat internal kampus.
     * Super Admin bypass, Admin Kampus dari university_id yang sama.
     */
    public function campusReject(User $user, Proposal $proposal): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! $user->isAdminKampus()) {
            return false;
        }

        return (int) $user->university_id === (int) $proposal->university_id;
    }

    /**
     * Tentukan apakah user dapat memverifikasi administrasi dinamis Bappeda.
     * Hanya Super Admin (Admin Bappeda).
     */
    public function verifyAdministration(User $user, Proposal $proposal): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Tentukan apakah user dapat mengunggah dokumen proposal.
     * Hanya pemilik proposal yang dapat mengunggah.
     */
    public function upload(User $user, Proposal $proposal): bool
    {
        return $user->id === $proposal->user_id;
    }

    /**
     * Tentukan apakah user dapat melihat rekap review multi-reviewer.
     *
     * Digunakan oleh ReviewSummaryController::index().
     * Hanya SuperAdmin dan AdminKampus.
     */
    public function viewSummary(User $user, Proposal $proposal): bool
    {
        return $user->isSuperAdmin()
            || $user->isAdminKampus();
    }

    /**
     * Tentukan apakah user dapat memperpanjang due date reviewer assignment.
     *
     * Digunakan oleh ReviewAssignmentController::extendDue().
     * Hanya SuperAdmin dan AdminKampus.
     */
    public function extendDueDate(User $user, Proposal $proposal): bool
    {
        return $user->isSuperAdmin()
            || $user->isAdminKampus();
    }
}
