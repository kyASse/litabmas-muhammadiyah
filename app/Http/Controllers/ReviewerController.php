<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewScoreRequest;
use App\Models\EvaluationIndicator;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReviewerController extends Controller
{
    /**
     * Display a listing of the reviewer tasks.
     */
    public function index(Request $request): Response
    {
        return $this->assignments($request);
    }

    /**
     * Display reviewer's assignments based on Review records.
     */
    public function assignments(Request $request): Response
    {
        $reviews = $this->reviewerReviewsQuery($request)
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $masterCriteria = EvaluationIndicator::active()->ordered()->get();

        return Inertia::render('Reviewer/index', [
            'tasks' => $reviews,
            'filters' => [
                'status' => $request->status,
            ],
            'masterCriteria' => $masterCriteria,
        ]);
    }

    /**
     * Show a review detail using Review model.
     */
    public function show(Request $request, int $reviewId): Response
    {
        $review = $this->findOwnReview($request, $reviewId);
        $review->load(['proposal', 'assessmentCriteria']);

        $masterCriteria = EvaluationIndicator::active()->ordered()->get();

        return Inertia::render('Reviewer/index', [
            'tasks' => $this->reviewerReviewsQuery($request)
                ->latest('created_at')
                ->paginate(15)
                ->withQueryString(),
            'selectedReview' => $review,
            'masterCriteria' => $masterCriteria,
        ]);
    }

    /**
     * Show review submission form using Review model.
     */
    public function reviewForm(Request $request, int $reviewId): Response
    {
        $review = $this->findOwnReview($request, $reviewId);
        $review->load(['proposal', 'assessmentCriteria']);

        $masterCriteria = EvaluationIndicator::active()->ordered()->get();

        return Inertia::render('Reviewer/index', [
            'tasks' => $this->reviewerReviewsQuery($request)
                ->latest('created_at')
                ->paginate(15)
                ->withQueryString(),
            'selectedReview' => $review,
            'masterCriteria' => $masterCriteria,
        ]);
    }

    /**
     * Submit or update a review record using weighted rubric evaluation.
     */
    public function submitReview(StoreReviewScoreRequest $request, $assignment): RedirectResponse
    {
        $reviewId = (int) $assignment;
        $review = $this->findOwnReview($request, $reviewId);

        $validated = $request->validated();
        $komponenPenilaian = $validated['komponen_penilaian'] ?? [];

        $totalWeight = 0;
        $weightedScore = 0;
        $simpleSum = 0;

        foreach ($komponenPenilaian as $item) {
            if (! is_array($item)) {
                continue;
            }
            $bobot = (float) ($item['bobot'] ?? $item['weight'] ?? 0);
            $skor = (float) ($item['skor'] ?? $item['score'] ?? $item['nilai'] ?? 0);

            if ($bobot > 0) {
                $weightedScore += ($skor * $bobot);
                $totalWeight += $bobot;
            }
            $simpleSum += $skor;
        }

        if ($totalWeight > 0) {
            $calculatedScore = round($weightedScore / $totalWeight, 2);
        } elseif (count($komponenPenilaian) > 0) {
            $calculatedScore = round($simpleSum / count($komponenPenilaian), 2);
        } else {
            $calculatedScore = (float) ($request->input('skor_total') ?? $request->input('score') ?? 0);
        }

        $review->update([
            'komponen_penilaian' => $komponenPenilaian,
            'skor_total' => $calculatedScore,
            'catatan_evaluasi' => $validated['catatan_evaluasi'],
            'keputusan_rekomendasi' => $validated['keputusan_rekomendasi'],
            'status_review' => 'Completed',
            'tanggal_selesai_review' => now()->toDateString(),
        ]);

        return redirect()
            ->route('reviewer.assignments.index')
            ->with('success', '[SUKSES] Penilaian review berhasil disimpan.');
    }

    /**
     * Download attachment from review record.
     */
    public function downloadAttachment(Request $request, int $reviewId, int $attachmentId): StreamedResponse
    {
        $review = $this->findOwnReview($request, $reviewId);

        $attachment = $review->proposal?->attachments()?->findOrFail($attachmentId);

        if (! $attachment || ! $attachment->fileExists()) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download(
            $attachment->file_path,
            $attachment->file_name
        );
    }

    private function reviewerReviewsQuery(Request $request)
    {
        $query = Review::query()
            ->where(function ($q) use ($request) {
                $q->where('id_reviewer', $request->user()->id)
                    ->orWhere('reviewer_id', $request->user()->id);
            })
            ->with(['proposal', 'assessmentCriteria']);

        if ($request->filled('status')) {
            $query->where(function ($q) use ($request) {
                $q->where('status_review', $request->status)
                    ->orWhere('status', $request->status);
            });
        }

        return $query;
    }

    private function findOwnReview(Request $request, int|string $reviewId): Review
    {
        return Review::where(function ($q) use ($request) {
            $q->where('id_reviewer', $request->user()->id)
                ->orWhere('reviewer_id', $request->user()->id);
        })->findOrFail((int) $reviewId);
    }
}
