<?php

namespace App\Http\Controllers;

use App\Models\ProgressReport;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EvaluationController extends Controller
{
    /**
     * Menampilkan laporan akhir peneliti untuk diunduh / dilihat (Peneliti).
     */
    public function show(Request $request)
    {
        return Inertia::render('Evaluation/Show');
    }

    /**
     * Menampilkan daftar laporan kemajuan yang perlu dievaluasi oleh reviewer yang sedang login.
     */
    public function index()
    {
        $reviewerId = Auth::id();

        // Ambil proposal_id yang ditugaskan ke reviewer ini
        $assignedProposalIds = Review::where('id_reviewer', $reviewerId)
            ->pluck('id_proposal');

        $pendingEvaluations = ProgressReport::with(['proposal.user'])
            ->where('status', 'submitted')
            ->whereIn('proposal_id', $assignedProposalIds)
            ->whereDoesntHave('evaluations', function ($q) use ($reviewerId) {
                $q->where('reviewer_id', $reviewerId);
            })
            ->latest()
            ->get()
            ->map(function ($report) {
                return [
                    'id_report' => $report->id,
                    'id_contract' => $report->contract_id,
                    'judul_penelitian' => $report->proposal->judul ?? '-',
                    'nama_dosen' => $report->proposal->user->name ?? '-',
                    'last_reported_at' => $report->report_date,
                    'last_percentage' => $report->progress_percentage,
                ];
            });

        return Inertia::render('Reviewer/Evaluation/Index', [
            'pendingEvaluations' => $pendingEvaluations,
        ]);
    }

    /**
     * Menampilkan detail laporan kemajuan dosen.
     */
    public function showProgress(ProgressReport $report)
    {
        $reviewerId = Auth::id();

        // Otorisasi: pastikan reviewer ditugaskan ke proposal ini
        $isAssigned = Review::where('id_reviewer', $reviewerId)
            ->where('id_proposal', $report->proposal_id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        $report->load(['proposal.user', 'contract', 'evaluations.reviewer']);

        $allReports = ProgressReport::where('proposal_id', $report->proposal_id)
            ->orderBy('report_date')
            ->get(['id', 'report_date', 'progress_percentage', 'report_type']);

        return Inertia::render('Reviewer/Evaluation/Show', [
            'report' => $report,
            'allReports' => $allReports,
        ]);
    }

    /**
     * Evaluasi akhir proposal/laporan oleh Reviewer.
     */
    public function evaluateFinal(Request $request, $id)
    {
        return redirect()->back()->with('success', 'Evaluasi akhir berhasil disimpan.');
    }

    /**
     * Penerbitan sertifikat SKTS oleh Admin LPPM / Kampus.
     */
    public function generateSkts(Request $request, $id)
    {
        return redirect()->back()->with('success', 'SKTS berhasil diterbitkan.');
    }
}
