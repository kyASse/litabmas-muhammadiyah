<?php

namespace App\Policies;

use App\Models\ProgressReport;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;

class ProgressReportPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([Role::PENELITI, Role::REVIEWER, Role::ADMIN_KAMPUS, Role::SUPER_ADMIN]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProgressReport $progressReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Researcher owns the report
        if ((int) $progressReport->user_id === (int) $user->id) {
            return true;
        }

        // Assigned reviewer
        $isAssignedReviewer = Review::where('id_reviewer', $user->id)
            ->where('id_proposal', $progressReport->id_proposal)
            ->exists();

        if ($isAssignedReviewer) {
            return true;
        }

        // Admin Kampus in the same university
        if ($user->hasRole(Role::ADMIN_KAMPUS) && $user->university_id) {
            return (int) $user->university_id === (int) $progressReport->proposal?->university_id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([Role::PENELITI, Role::SUPER_ADMIN]);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProgressReport $progressReport): bool
    {
        if ($progressReport->proposal?->evaluation?->status_penelitian === 'Selesai') {
            return false;
        }

        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Only the researcher who owns the proposal can update
        return (int) $progressReport->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can evaluate the model.
     */
    public function evaluate(User $user, ProgressReport $progressReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Conflict of Interest: owner cannot evaluate own report
        if ((int) $progressReport->user_id === (int) $user->id) {
            return false;
        }

        // Must be in the same university
        if ($user->university_id && (int) $user->university_id !== (int) $progressReport->proposal?->university_id) {
            return false;
        }

        return $user->hasRole(Role::REVIEWER);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProgressReport $progressReport): bool
    {
        if ($progressReport->proposal?->evaluation?->status_penelitian === 'Selesai') {
            return false;
        }

        return $user->isSuperAdmin();
    }
}
