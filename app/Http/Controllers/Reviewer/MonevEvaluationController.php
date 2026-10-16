<?php

namespace App\Http\Controllers\Reviewer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reviewer\EvaluateMonevRequest;
use App\Models\ProgressReport;
use Illuminate\Http\RedirectResponse;

class MonevEvaluationController extends Controller
{
    /**
     * Menyimpan hasil evaluasi dan rekomendasi laporan kemajuan riset oleh reviewer.
     *
     * @param EvaluateMonevRequest $request
     * @param int|ProgressReport $report
     * @return RedirectResponse
     */
    public function evaluate(EvaluateMonevRequest $request, int|ProgressReport $report): RedirectResponse
    {
        $progressReport = $report instanceof ProgressReport
            ? $report
            : ProgressReport::findOrFail($report);

        $validated = $request->validated();

        $progressReport->update([
            'skor_monev' => $validated['skor_monev'],
            'status_laporan' => $validated['status_laporan'],
            'catatan_reviewer_monev' => $validated['catatan_reviewer_monev'],
        ]);

        return redirect()->back()->with('success', 'Evaluasi monev berhasil disimpan.');
    }
}
