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

        $pendingEvaluations = ProgressReport::with(['proposal.user', 'proposal.contract'])
            ->where('status_laporan', ProgressReport::STATUS_SUBMITTED)
            ->whereIn('id_proposal', $assignedProposalIds)
            ->whereNull('skor_monev')
            ->latest()
            ->get()
            ->map(function ($report) {
                return [
                    'id_report' => $report->id,
                    'id_contract' => $report->proposal?->contract?->id ?? 0,
                    'judul_penelitian' => $report->proposal?->judul_penelitian ?? '-',
                    'nama_dosen' => $report->proposal?->user?->name ?? '-',
                    'last_reported_at' => $report->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
                    'last_percentage' => (int) $report->persentase_kemajuan,
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
            ->where('id_proposal', $report->id_proposal)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        $report->loadMissing(['proposal.user', 'proposal.contract', 'monevSchedule']);

        $allReports = ProgressReport::where('id_proposal', $report->id_proposal)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'report_date' => $r->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
                'progress_percentage' => (int) $r->persentase_kemajuan,
                'report_type' => 'laporan_kemajuan',
            ]);

        $formattedReport = [
            'id' => $report->id,
            'proposal_id' => $report->id_proposal,
            'contract_id' => $report->proposal?->contract?->id ?? 0,
            'title' => $report->proposal?->judul_penelitian ?? 'Laporan Kemajuan',
            'content' => $report->ringkasan_progres,
            'report_type' => 'laporan_kemajuan',
            'report_date' => $report->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'progress_percentage' => (int) $report->persentase_kemajuan,
            'report_period' => $report->monevSchedule?->nama_tahap ?? 'Monev Kemajuan',
            'attachment_path' => $report->file_laporan_kemajuan,
            'status' => strtolower($report->status_laporan ?? 'submitted'),
            'submitted_at' => $report->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'proposal' => [
                'id' => $report->proposal?->id,
                'judul' => $report->proposal?->judul_penelitian,
                'user' => [
                    'id' => $report->proposal?->user?->id,
                    'name' => $report->proposal?->user?->name,
                    'email' => $report->proposal?->user?->email,
                ],
            ],
        ];

        return Inertia::render('Reviewer/Evaluation/Show', [
            'report' => $formattedReport,
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
