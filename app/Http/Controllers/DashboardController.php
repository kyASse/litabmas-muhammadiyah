<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\StatsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly StatsService $statsService
    ) {}

    /**
     * Show the dashboard page with statistics or redirect to specialized role dashboard.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user()->load(['role', 'university']);

        // Redirect Admin Kampus to dedicated LPPM research dashboard
        if ($user->hasRole(Role::ADMIN_KAMPUS)) {
            return redirect()->route('admin.dashboard');
        }

        // Redirect Reviewer to reviewer tasks
        if ($user->hasRole(Role::REVIEWER)) {
            return redirect()->route('reviewer.dashboard');
        }

        // Redirect Admin Keuangan to finance contracts
        if ($user->hasRole(Role::ADMIN_KEUANGAN)) {
            return redirect()->route('finance.contracts.index');
        }

        // Calculate proposal (riset) aggregate stats from the `proposals` table
        $proposalStats = $this->getProposalStat($user);

        $userCol = Schema::hasColumn('proposals', 'id_pengusul') ? 'id_pengusul' : 'user_id';
        $hasDeletedAt = Schema::hasColumn('proposals', 'deleted_at');

        if ($user->hasRole(Role::SUPER_ADMIN)) {
            $query = DB::table('proposals');
            if ($hasDeletedAt) {
                $query->whereNull('deleted_at');
            }
            $proposalCounts = $query->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status_proposal IN ('Submitted', 'submitted') THEN 1 ELSE 0 END) as masuk,
                SUM(CASE WHEN status_proposal IN ('Administrasi_Valid', 'administrasi_valid', 'approved') THEN 1 ELSE 0 END) as lolos,
                SUM(CASE WHEN status_proposal IN ('Ditolak', 'ditolak', 'rejected') THEN 1 ELSE 0 END) as gagal,
                SUM(CASE WHEN status_proposal IN ('Draft', 'draft') THEN 1 ELSE 0 END) as draft
            ")->first();
        } else {
            $query = DB::table('proposals')->where($userCol, (int) $user->id);
            if ($hasDeletedAt) {
                $query->whereNull('deleted_at');
            }
            $proposalCounts = $query->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status_proposal IN ('Submitted', 'submitted') THEN 1 ELSE 0 END) as masuk,
                SUM(CASE WHEN status_proposal IN ('Administrasi_Valid', 'administrasi_valid', 'approved') THEN 1 ELSE 0 END) as lolos,
                SUM(CASE WHEN status_proposal IN ('Ditolak', 'ditolak', 'rejected') THEN 1 ELSE 0 END) as gagal,
                SUM(CASE WHEN status_proposal IN ('Draft', 'draft') THEN 1 ELSE 0 END) as draft
            ")->first();
        }

        $stats = [
            'total_proposals' => (int) ($proposalCounts->total ?? 0),
            'proposal_masuk' => (int) ($proposalCounts->masuk ?? 0),
            'proposal_lolos' => (int) ($proposalCounts->lolos ?? 0),
            'proposal_gagal' => (int) ($proposalCounts->gagal ?? 0),
            'proposal_draft' => (int) ($proposalCounts->draft ?? 0),
            'total_pendanaan' => (float) ($proposalStats['total_pendanaan'] ?? 0.0),
        ];

        return Inertia::render('Dashboard/User', [
            'stats' => $stats,
            'proposal_stats' => $proposalStats,
        ]);
    }

    /**
     * Aggregate proposal riset stats from the `proposals` table (Modul 1 PRD).
     */
    public function getProposalStat(User $user): array
    {
        if ($user->hasRole(Role::SUPER_ADMIN)) {
            return $this->statsService->getProposalSummaryAll();
        }

        if ($user->hasRole(Role::ADMIN_KAMPUS)) {
            return $this->statsService->getProposalSummaryForUniversity(
                (int) $user->university_id
            );
        }

        // Default: Peneliti/Dosen - personal proposal stats only
        return $this->statsService->getProposalSummaryForUser((int) $user->id);
    }
}
