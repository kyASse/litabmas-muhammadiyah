<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\University;
use App\Services\ReviewCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ReviewController - Admin Kampus & Super Admin
 *
 * Mengelola rekapitulasi penilaian proposal riset dan penetapan keputusan LPPM.
 *
 * @route /admin/reviews/*
 */
class ReviewController extends Controller
{
    protected ReviewCalculationService $calculationService;

    public function __construct(ReviewCalculationService $calculationService)
    {
        $this->calculationService = $calculationService;
    }

    /**
     * Menampilkan rekapitulasi penilaian proposal riset & penetapan keputusan LPPM.
     *
     * @route GET /admin/reviews/summary
     */
    public function summary(Request $request): Response
    {
        $user = $request->user();
        if (! $user->hasAnyRole([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN]) && ! $user->isAdminKampus() && ! $user->isSuperAdmin()) {
            abort(403, 'Akses ditolak.');
        }

        $proposalQuery = Proposal::query();

        if ($user->isAdminKampus() && ! $user->isSuperAdmin()) {
            $proposalQuery->where('university_id', $user->university_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $proposalQuery->where(function ($q) use ($search) {
                $q->where('judul_penelitian', 'like', "%{$search}%")
                    ->orWhere('judul', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $proposalQuery->where('status_proposal', $request->status);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $proposalQuery->whereBetween('created_at', [
                $request->start_date.' 00:00:00',
                $request->end_date.' 23:59:59',
            ]);
        }

        $proposalSummary = $this->calculationService->calculateProposalSummary($proposalQuery);
        $filterOptions = $this->buildFilterOptions();

        return Inertia::render('Admin/Reviewer/Summary', [
            'proposalSummary' => $proposalSummary,
            'filterOptions' => $filterOptions,
            'filters' => $request->only(['search', 'university_id', 'status', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Membangun opsi filter riset untuk form summary.
     */
    private function buildFilterOptions(): array
    {
        $universities = University::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($u) => [
                'value' => $u->id,
                'label' => $u->name,
            ]);

        $statusOptions = [
            ['value' => 'Draft', 'label' => 'Draft'],
            ['value' => 'Submitted', 'label' => 'Submitted / Menunggu Telaah'],
            ['value' => 'In_Review', 'label' => 'Sedang Direview'],
            ['value' => 'Diterima', 'label' => 'Diterima / Lolos'],
            ['value' => 'Ditolak', 'label' => 'Ditolak'],
        ];

        return [
            'universities' => $universities,
            'status_options' => $statusOptions,
        ];
    }
}
