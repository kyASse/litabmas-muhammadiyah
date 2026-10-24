<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignReviewerRequest;
use App\Http\Requests\Admin\ReassignReviewerRequest;
use App\Models\ActivityLog;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssignController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (! $user->isSuperAdmin() && ! $user->isAdminKampus()) {
            abort(403);
        }

        $proposals = Proposal::whereIn('status_proposal', [
            Proposal::STATUS_ADMINISTRASI_VALID,
            Proposal::STATUS_LOLOS_ADMINISTRASI,
            Proposal::STATUS_SUBMITTED,
            'Submitted',
            'Administrasi_Valid',
            'Lolos_Administrasi',
            'In_Review',
        ])
            ->with([
                'pengusul:id,name',
                'members.user:id,name',
                'reviews:id,id_proposal,id_reviewer,skor_total,status_review',
            ])
            ->select('id', 'judul_penelitian', 'id_pengusul', 'status_proposal')
            ->get();

        $reviewerRole = Role::where('name', Role::REVIEWER)->first();

        $reviewersQuery = User::query();
        if ($reviewerRole) {
            $reviewersQuery->where(function ($q) use ($reviewerRole) {
                $q->where('role_id', $reviewerRole->id)
                    ->orWhereHas('roles', fn ($r) => $r->where('name', Role::REVIEWER));
            });
        }

        $reviewers = $reviewersQuery->select('id', 'name')->get();

        return Inertia::render('Admin/Reviewer/Assign', [
            'proposals' => $proposals,
            'reviewers' => $reviewers,
            'selectedProposalId' => $request->query('proposal_id'),
        ]);
    }

    public function assign(AssignReviewerRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $proposalId = $validated['id_proposal'] ?? $validated['proposal_id'];
        $reviewerId = $validated['id_reviewer'] ?? $validated['reviewer_id'];

        Review::create([
            'id_proposal' => $proposalId,
            'id_reviewer' => $reviewerId,
            'tanggal_mulai_review' => $validated['tanggal_mulai_review'] ?? now()->toDateString(),
            'tanggal_selesai_review' => $validated['tanggal_selesai_review'] ?? now()->addDays(14)->toDateString(),
            'status_review' => 'Assigned',
        ]);

        return redirect()->route('admin.proposals.index')->with(
            'success',
            '[SUKSES] Reviewer berhasil ditugaskan.'
        );
    }

    public function reassign(ReassignReviewerRequest $request, int $id): RedirectResponse
    {
        DB::transaction(function () use ($request, $id) {
            $oldReview = Review::findOrFail($id);

            // Pastikan review lama belum diselesaikan
            if ($oldReview->status_review === 'Completed') {
                abort(422, '[GAGAL] Review yang telah selesai tidak dapat dibatalkan atau dialihkan.');
            }

            // Catat jejak audit pencabutan
            ActivityLog::create([
                'user_id' => auth()->id(),
                'university_id' => auth()->user()?->university_id,
                'activity' => sprintf(
                    'REVOKE_REVIEWER: Mencabut penugasan reviewer ID %d dari proposal ID %d karena batas waktu telaah terlampaui. Alasan: %s',
                    $oldReview->id_reviewer,
                    $oldReview->id_proposal,
                    $request->input('alasan_pencabutan')
                ),
            ]);

            // Perbarui reviewer dengan reviewer baru yang dipilih
            $newReviewerId = $request->input('id_reviewer_baru');
            $newEndDate = $request->input('tanggal_selesai_baru') ?? now()->addDays(14)->toDateString();

            $oldReview->update([
                'id_reviewer' => $newReviewerId,
                'tanggal_mulai_review' => now()->toDateString(),
                'tanggal_selesai_review' => $newEndDate,
                'status_review' => 'Assigned',
                'komponen_penilaian' => null,
                'skor_total' => 0,
            ]);
        });

        return back()->with('success', '[SUKSES] Penugasan reviewer berhasil dialihkan ke penilai baru.');
    }

    public function unassign(int $id): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->isSuperAdmin() && ! $user->isAdminKampus()) {
            abort(403);
        }

        $review = Review::findOrFail($id);

        $review->delete();

        return back()->with(
            'success',
            '[SUKSES] Penunjukan reviewer berhasil dihapus.'
        );
    }
}
