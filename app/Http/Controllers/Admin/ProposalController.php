<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssessmentCriteria;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin\ProposalController — Super Admin
 *
 * Mengelola verifikasi administrasi proposal penelitian untuk peran Super Admin.
 * Super Admin dapat melihat semua proposal, menyetujui (Administrasi_Valid),
 * dan menolak (Ditolak) proposal yang berstatus Submitted.
 *
 * @route GET  /admin/proposals                     → index
 * @route POST /admin/proposals/{proposal}/approve  → approve
 * @route POST /admin/proposals/{proposal}/reject   → reject
 */
class ProposalController extends Controller
{
    /**
     * Tampilkan daftar semua proposal penelitian.
     *
     * @route GET /admin/proposals
     *
     * @features List semua proposal, search by title, filter by status, pagination
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Proposal::class);

        $query = Proposal::query()
            ->with([
                'user:id,name,email,university_id',
                'researchSchema',
                'reviews.reviewer:id,name',
            ]);

        if ($request->user()->isAdminKampus()) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('university_id', $request->user()->university_id);
            });
        }

        if ($request->filled('search')) {
            $query->where('judul_penelitian', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('status_proposal', $request->status);
        }

        if ($request->filled('tahun_anggaran')) {
            $year = $request->input('tahun_anggaran');
            $query->whereHas('researchSchema', fn ($sq) => $sq->where('tahun_anggaran', $year));
        } elseif ($request->filled('year')) {
            $year = $request->input('year');
            $query->whereHas('researchSchema', fn ($sq) => $sq->where('tahun_anggaran', $year));
        }

        $proposals = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($proposal) => [
                'id' => $proposal->id,
                'title' => $proposal->title,
                'description' => $proposal->description,
                'status_proposal' => $proposal->status_proposal,
                'rejection_reason' => $proposal->rejection_reason,
                'file_dokumen_proposal' => $proposal->file_dokumen_proposal,
                'has_reviewer' => $proposal->reviews->isNotEmpty(),
                'reviews' => $proposal->reviews->map(fn ($r) => [
                    'id' => $r->id,
                    'reviewer_id' => $r->reviewer_id,
                    'reviewer_name' => $r->reviewer?->name,
                ])->values(),
                'reviewers' => $proposal->reviews->map(fn ($r) => [
                    'id' => $r->reviewer?->id,
                    'name' => $r->reviewer?->name,
                ])->filter(fn ($r) => ! empty($r['name']))->values(),
                'user' => $proposal->user ? [
                    'id' => $proposal->user->id,
                    'name' => $proposal->user->name,
                    'email' => $proposal->user->email,
                ] : null,
                'research_schema' => $proposal->researchSchema ? [
                    'id' => $proposal->researchSchema->id,
                    'name' => $proposal->researchSchema->name,
                    'tahun_anggaran' => $proposal->researchSchema->tahun_anggaran,
                ] : null,
                'created_at' => $proposal->created_at->format('Y-m-d'),
            ]);

        $statusOptions = collect([
            ['value' => Proposal::STATUS_DRAFT,              'label' => 'Draft'],
            ['value' => Proposal::STATUS_SUBMITTED_KAMPUS,   'label' => 'Menunggu Verifikasi Kampus'],
            ['value' => Proposal::STATUS_APPROVED_KAMPUS,    'label' => 'Disetujui Kampus (Antrean Bappeda)'],
            ['value' => Proposal::STATUS_REJECTED_KAMPUS,    'label' => 'Ditolak Kampus'],
            ['value' => Proposal::STATUS_SUBMITTED,          'label' => 'Submitted'],
            ['value' => Proposal::STATUS_ADMINISTRASI_VALID, 'label' => 'Valid Administrasi'],
            ['value' => Proposal::STATUS_LOLOS_ADMINISTRASI, 'label' => 'Lolos Administrasi'],
            ['value' => Proposal::STATUS_DITOLAK_ADMINISTRASI, 'label' => 'Ditolak Administrasi'],
            ['value' => Proposal::STATUS_DITOLAK,            'label' => 'Ditolak'],
        ]);

        return Inertia::render('Admin/Proposal/Index', [
            'proposals' => $proposals,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'tahun_anggaran' => $request->tahun_anggaran ?? $request->year ?? '',
                'year' => $request->year ?? $request->tahun_anggaran ?? '',
            ],
            'statusOptions' => $statusOptions,
        ]);
    }

    /**
     * Tampilkan detail proposal penelitian (Show/Detail view).
     *
     * @route GET /admin/proposals/{proposal}
     */
    public function show(Proposal $proposal): Response
    {
        $this->authorize('view', $proposal);

        $proposal->load([
            'user:id,name,email,university_id',
            'user.university:id,name',
            'researchSchema',
            'reviews.reviewer:id,name,email',
            'documents',
        ]);

        $reviewerRole = Role::where('name', Role::REVIEWER)->first();

        $reviewersQuery = User::query();
        if ($reviewerRole) {
            $reviewersQuery->where(function ($q) use ($reviewerRole) {
                $q->where('role_id', $reviewerRole->id)
                    ->orWhereHas('roles', fn ($r) => $r->where('name', Role::REVIEWER));
            });
        }
        $availableReviewers = $reviewersQuery->select('id', 'name', 'email')->get();

        return Inertia::render('Admin/Proposal/Show', [
            'proposal' => [
                'id' => $proposal->id,
                'title' => $proposal->title,
                'description' => $proposal->description,
                'status_proposal' => $proposal->status_proposal,
                'rejection_reason' => $proposal->rejection_reason,
                'file_dokumen_proposal' => $proposal->file_dokumen_proposal,
                'biaya_yang_diusulkan' => (float) $proposal->biaya_yang_diusulkan,
                'rekomendasi_anggaran' => $proposal->rekomendasi_anggaran ? (float) $proposal->rekomendasi_anggaran : null,
                'is_administrasi_approved' => $proposal->is_administrasi_approved,
                'is_rab_approved' => $proposal->is_rab_approved,
                'catatan_administrasi' => $proposal->catatan_administrasi,
                'catatan_keuangan' => $proposal->catatan_keuangan,
                'tanggal_verifikasi_administrasi' => $proposal->tanggal_verifikasi_administrasi?->format('Y-m-d H:i'),
                'tanggal_verifikasi_rab' => $proposal->tanggal_verifikasi_rab?->format('Y-m-d H:i'),
                'created_at' => $proposal->created_at->format('Y-m-d H:i'),
                'updated_at' => $proposal->updated_at->format('Y-m-d H:i'),
                'user' => $proposal->user ? [
                    'id' => $proposal->user->id,
                    'name' => $proposal->user->name,
                    'email' => $proposal->user->email,
                    'university' => $proposal->user->university?->name,
                ] : null,
                'research_schema' => $proposal->researchSchema ? [
                    'id' => $proposal->researchSchema->id,
                    'name' => $proposal->researchSchema->name,
                    'description' => $proposal->researchSchema->description,
                    'max_funding' => $proposal->researchSchema->max_funding,
                ] : null,
                'documents' => $proposal->documents ?? [],
                'reviews' => $proposal->reviews->map(fn ($r) => [
                    'id' => $r->id,
                    'proposal_id' => $r->proposal_id,
                    'reviewer_id' => $r->reviewer_id,
                    'reviewed_at' => $r->reviewed_at?->format('Y-m-d H:i'),
                    'score' => $r->score,
                    'feedback' => $r->feedback,
                    'reviewer' => $r->reviewer ? [
                        'id' => $r->reviewer->id,
                        'name' => $r->reviewer->name,
                        'email' => $r->reviewer->email,
                    ] : null,
                ])->values(),
            ],
            'availableReviewers' => $availableReviewers,
            'adminCriteria' => AssessmentCriteria::administrasi()
                ->active()
                ->orderBy('urutan')
                ->get(['id', 'nama_kriteria', 'deskripsi', 'tipe_jawaban', 'urutan']),
        ]);
    }

    /**
     * Setujui proposal (validasi administrasi).
     *
     * @route POST /admin/proposals/{proposal}/approve
     */
    public function approve(Request $request, Proposal $proposal): RedirectResponse
    {
        $user = $request->user();

        // Jika user adalah Admin Kampus, delegasikan ke persetujuan internal kampus (Approved_Kampus)
        if ($user && $user->isAdminKampus() && ! $user->isSuperAdmin()) {
            return $this->campusApprove($request, $proposal);
        }

        $this->authorize('approve', $proposal);

        $proposal->update([
            'status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID,
            'rejection_reason' => null,
        ]);

        return redirect()
            ->route('admin.proposals.index')
            ->with('success', "Proposal \"{$proposal->title}\" berhasil divalidasi.");
    }

    /**
     * Tolak proposal dengan alasan penolakan.
     *
     * @route POST /admin/proposals/{proposal}/reject
     */
    public function reject(Request $request, Proposal $proposal): RedirectResponse
    {
        $user = $request->user();

        // Jika user adalah Admin Kampus, delegasikan ke penolakan internal kampus (Rejected_Kampus)
        if ($user && $user->isAdminKampus() && ! $user->isSuperAdmin()) {
            return $this->campusReject($request, $proposal);
        }

        $this->authorize('reject', $proposal);

        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'rejection_reason.required' => 'Alasan penolakan harus diisi.',
            'rejection_reason.min' => 'Alasan penolakan minimal 10 karakter.',
            'rejection_reason.max' => 'Alasan penolakan maksimal 500 karakter.',
        ]);

        $proposal->update([
            'status_proposal' => Proposal::STATUS_DITOLAK,
            'rejection_reason' => $request->rejection_reason,
        ]);

        return redirect()
            ->route('admin.proposals.index')
            ->with('success', "Proposal \"{$proposal->title}\" telah ditolak.");
    }

    /**
     * Setujui proposal pada tingkat internal kampus.
     *
     * @route POST /admin/proposals/{proposal}/campus-approve
     */
    public function campusApprove(Request $request, Proposal $proposal): RedirectResponse
    {
        return app(\App\Http\Controllers\Admin\AdminKampusController::class)->campusApprove($request, $proposal);
    }

    /**
     * Tolak proposal pada tingkat internal kampus dengan catatan perbaikan.
     *
     * @route POST /admin/proposals/{proposal}/campus-reject
     */
    public function campusReject(Request $request, Proposal $proposal): RedirectResponse
    {
        return app(\App\Http\Controllers\Admin\AdminKampusController::class)->campusReject($request, $proposal);
    }

    /**
     * Verifikasi administrasi dinamis Bappeda menggunakan checklist Ya/Tidak.
     *
     * @route POST /admin/proposals/{proposal}/verify-administration
     */
    public function verifyAdministration(Request $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('verifyAdministration', $proposal);

        $request->validate([
            'checklist' => ['required', 'array'],
            'checklist.*' => ['nullable'],
            'catatan_administrasi' => ['nullable', 'string', 'max:2000'],
        ]);

        $activeCriteria = AssessmentCriteria::administrasi()
            ->active()
            ->get();

        if ($activeCriteria->isNotEmpty()) {
            $allPassed = true;
            foreach ($activeCriteria as $criterion) {
                $val = $request->checklist[$criterion->id] ?? null;
                if (! filter_var($val, FILTER_VALIDATE_BOOLEAN)) {
                    $allPassed = false;
                    break;
                }
            }
        } else {
            // Fallback: evaluate submitted checklist directly
            $allPassed = ! empty($request->checklist) && collect($request->checklist)->every(
                fn ($val) => filter_var($val, FILTER_VALIDATE_BOOLEAN)
            );
        }

        $proposal->update([
            'is_administrasi_approved' => $allPassed,
            'tanggal_verifikasi_administrasi' => now(),
            'catatan_administrasi' => $request->catatan_administrasi,
        ]);

        if (! $allPassed) {
            $proposal->update([
                'status_proposal' => Proposal::STATUS_DITOLAK_ADMINISTRASI,
            ]);
            $statusMessage = "Proposal \"{$proposal->title}\" dinyatakan DITOLAK seleksi administrasi.";
        } else {
            // Cek apakah Admin Keuangan juga telah menyetujui audit RAB (Dual Sign-Off Gatekeeper)
            if ($proposal->isRabApproved()) {
                $proposal->update([
                    'status_proposal' => Proposal::STATUS_LOLOS_ADMINISTRASI,
                ]);
                $statusMessage = "Proposal \"{$proposal->title}\" dinyatakan LOLOS seleksi administrasi & audit RAB (siap penugasan reviewer).";
            } else {
                $statusMessage = "Verifikasi berkas administrasi berhasil. Menunggu audit RAB oleh Admin Keuangan untuk membuka penugasan reviewer.";
            }
        }

        return redirect()
            ->back()
            ->with('success', $statusMessage);
    }
}
