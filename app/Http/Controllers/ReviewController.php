<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Models\Proposal;
use App\Models\Review;

class ReviewController extends Controller
{
    /**
     * Simpan nilai review baru
     */
    public function storeAssessment(StoreReviewRequest $request)
    {
        $validated = $request->validated();
        $proposal = Proposal::withoutGlobalScopes()->findOrFail($validated['proposal_id']);

        // Conflict of Interest (CoI) Guard: id_reviewer != id_pengusul
        if ((int) $proposal->id_pengusul === (int) auth()->id()) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $calculatedScore = Review::calculateScoreFromComponents($validated['komponen_penilaian']);

        $review = Review::firstOrNew([
            'id_proposal' => $proposal->id,
            'id_reviewer' => auth()->id(),
        ]);

        $review->komponen_penilaian = $validated['komponen_penilaian'];
        $review->skor_total = $calculatedScore;
        $review->score = $calculatedScore;
        $review->catatan_evaluasi = $validated['comments'] ?? $review->catatan_evaluasi;
        $review->keputusan_rekomendasi = $validated['recommendation'];
        $review->status_review = Review::STATUS_COMPLETED;
        $review->tanggal_selesai_review = now()->toDateString();
        $review->save();

        return redirect()->back()->with('success', 'Penilaian proposal berhasil disimpan.');
    }

    /**
     * Update nilai review yang sudah ada
     */
    public function updateAssessment(StoreReviewRequest $request, $id)
    {
        $validated = $request->validated();

        // Update assessment (Review)
        $review = Review::with('proposal')->findOrFail($id);

        // Memastikan hanya reviewer yang bersangkutan yang bisa update
        if ((int) $review->id_reviewer !== (int) auth()->id()) {
            abort(403, 'Anda tidak diizinkan mengubah penilaian ini.');
        }

        // Conflict of Interest (CoI) Guard: id_reviewer != id_pengusul
        if ((int) $review->proposal?->id_pengusul === (int) auth()->id()) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $calculatedScore = Review::calculateScoreFromComponents($validated['komponen_penilaian']);

        $review->komponen_penilaian = $validated['komponen_penilaian'];
        $review->skor_total = $calculatedScore;
        $review->score = $calculatedScore;
        $review->catatan_evaluasi = $validated['comments'] ?? $review->catatan_evaluasi;
        $review->keputusan_rekomendasi = $validated['recommendation'];
        $review->status_review = Review::STATUS_COMPLETED;
        $review->tanggal_selesai_review = now()->toDateString();
        $review->save();

        return redirect()->back()->with('success', 'Penilaian proposal berhasil diperbarui.');
    }

    /**
     * Menampilkan detail proposal untuk direview.
     */
    public function show($id)
    {
        return app(ReviewerController::class)->show(request(), (int) $id);
    }
}
