<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Proposal;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Tampilkan formulir review penilaian substansi proposal.
     */
    public function show(Proposal $proposal): Response
    {
        // Conflict of Interest (CoI) Guard: id_reviewer != id_pengusul
        if ((int) $proposal->id_pengusul === (int) auth()->id()) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $review = Review::where('id_proposal', $proposal->id)
            ->where('id_reviewer', auth()->id())
            ->first();

        return Inertia::render('Review/Show', [
            'proposal' => $proposal->load(['pengusul', 'skemaPendanaan']),
            'review' => $review,
        ]);
    }

    /**
     * Kirim atau perbarui penilaian substansi reviewer.
     */
    public function submitReview(StoreReviewRequest $request, Proposal $proposal): RedirectResponse
    {
        // Conflict of Interest (CoI) Guard: id_reviewer != id_pengusul
        if ((int) $proposal->id_pengusul === (int) auth()->id()) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $validated = $request->validated();
        $komponen = $validated['komponen_penilaian'] ?? [];
        $calculatedScore = Review::calculateScoreFromComponents($komponen);

        Review::updateOrCreate(
            [
                'id_proposal' => $proposal->id,
                'id_reviewer' => auth()->id(),
            ],
            [
                'komponen_penilaian' => $komponen,
                'skor_total' => $calculatedScore,
                'catatan_evaluasi' => $validated['comments'] ?? null,
                'keputusan_rekomendasi' => $validated['recommendation'],
                'status_review' => Review::STATUS_COMPLETED,
                'tanggal_selesai_review' => now()->toDateString(),
            ]
        );

        return redirect()->back()->with('success', 'Penilaian substansi berhasil dikirim.');
    }
}
