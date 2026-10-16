<?php

namespace App\Services;

use App\Models\Review;

class ReviewAggregationService
{
    /**
     * Menghitung nilai akhir proposal dan mendeteksi disparitas skor ekstrem antar-reviewer.
     * Sesuai Kasus Batas 7: Selisih > 30 poin memicu flag DISCREPANCY_DETECTED dan penunjukan Reviewer ke-3.
     *
     * @param int $proposalId
     * @return array{
     *     status: string,
     *     requires_third_reviewer: bool,
     *     disparity?: float,
     *     message?: string,
     *     current_average?: float,
     *     final_score?: float
     * }
     */
    public function calculateFinalScore(int $proposalId): array
    {
        $reviews = Review::where('id_proposal', $proposalId)
            ->where(function ($query) {
                $query->where('status_review', 'Completed')
                    ->orWhere('status_review', 'completed');
            })
            ->get();

        if ($reviews->count() === 2) {
            $score1 = (float) $reviews[0]->skor_total;
            $score2 = (float) $reviews[1]->skor_total;
            $disparity = abs($score1 - $score2);

            if ($disparity > 30.0) {
                return [
                    'status' => 'DISCREPANCY_DETECTED',
                    'disparity' => round($disparity, 2),
                    'requires_third_reviewer' => true,
                    'message' => '[PERINGATAN] Terdeteksi disparitas skor ekstrem (> 30 poin). Diperlukan penunjukan Reviewer ke-3.',
                    'current_average' => round(($score1 + $score2) / 2, 2),
                ];
            }
        }

        $finalScore = $reviews->avg('skor_total') ?? 0.0;

        return [
            'status' => 'NORMAL',
            'requires_third_reviewer' => false,
            'final_score' => round((float) $finalScore, 2),
        ];
    }
}
