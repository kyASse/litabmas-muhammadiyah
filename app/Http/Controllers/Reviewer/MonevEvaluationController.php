<?php

namespace App\Http\Controllers\Reviewer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reviewer\EvaluateMonevRequest;
use App\Models\ProgressReport;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonevEvaluationController extends Controller
{
    /**
     * Menyimpan hasil evaluasi dan rekomendasi laporan kemajuan riset oleh reviewer.
     */
    public function evaluate(EvaluateMonevRequest $request, int|ProgressReport $report): RedirectResponse
    {
        $progressReport = $report instanceof ProgressReport
            ? $report
            : ProgressReport::findOrFail($report);

        $progressReport->loadMissing('proposal');
        $user = $request->user();

        // Multi-tenancy check
        if (! $user->isSuperAdmin() && (int) $progressReport->proposal?->university_id !== (int) $user->university_id) {
            abort(403, 'Akses lintas institusi tidak diizinkan.');
        }

        // Conflict of Interest (CoI) Guard
        if ((int) $progressReport->proposal?->id_pengusul === (int) $user->id) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $validated = $request->validated();

        $progressReport->update([
            'skor_monev' => $validated['skor_monev'],
            'status_laporan' => $validated['status_laporan'],
            'catatan_reviewer_monev' => $validated['catatan_reviewer_monev'],
        ]);

        return redirect()->back()->with('success', 'Evaluasi monev berhasil disimpan.');
    }

    /**
     * Menampilkan halaman formulir evaluasi monev bagi reviewer.
     */
    public function show(int|ProgressReport $report): Response
    {
        $progressReport = $report instanceof ProgressReport
            ? $report
            : ProgressReport::findOrFail($report);

        $progressReport->loadMissing(['proposal.user', 'monevSchedule']);
        $user = auth()->user();

        // Multi-tenancy check
        if (! $user->isSuperAdmin() && (int) $progressReport->proposal?->university_id !== (int) $user->university_id) {
            abort(403, 'Akses lintas institusi tidak diizinkan.');
        }

        // Conflict of Interest (CoI) Guard
        if ((int) $progressReport->proposal?->id_pengusul === (int) $user->id) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        return Inertia::render('Reviewer/Monev/Evaluate', [
            'report' => $progressReport,
        ]);
    }
}
