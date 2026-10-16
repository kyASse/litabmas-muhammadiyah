<?php

namespace App\Http\Controllers;

use App\Http\Requests\Progress\StoreProgressReportRequest;
use App\Http\Requests\Reviewer\EvaluateMonevRequest;
use App\Models\Contract;
use App\Models\ProgressReport;
use App\Models\Proposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProgressController extends Controller
{
    /**
     * Display a listing of progress reports for the authenticated user (Dosen).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = ProgressReport::where('user_id', $user->id)
            ->with(['proposal', 'contract', 'evaluations.reviewer']);

        // Search by title
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by report type
        if ($reportType = $request->input('report_type')) {
            $query->where('report_type', $reportType);
        }

        $progressReports = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Progress/Index', [
            'progressReports' => $progressReports,
            'filters' => $request->only(['search', 'status', 'report_type']),
        ]);
    }

    /**
     * Show the form for creating a new progress report.
     */
    public function create()
    {
        $proposals = Proposal::where('user_id', Auth::id())
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Progress/Create', [
            'proposals' => $proposals,
        ]);
    }

    /**
     * Store a newly created progress report.
     */
    public function store(StoreProgressReportRequest $request)
    {
        $validated = $request->validated();

        $fileLaporanPath = $request->file('file_laporan_kemajuan')->store('progress-reports', 'public');

        $fileLogbookPath = null;
        if ($request->hasFile('file_logbook')) {
            $fileLogbookPath = $request->file('file_logbook')->store('progress-logbooks', 'public');
        }

        ProgressReport::create([
            'id_proposal' => $validated['id_proposal'],
            'id_monev_schedule' => $validated['id_monev_schedule'],
            'persentase_kemajuan' => $validated['persentase_kemajuan'],
            'ringkasan_progres' => $validated['ringkasan_progres'],
            'catatan_kendala' => $validated['catatan_kendala'] ?? null,
            'file_laporan_kemajuan' => $fileLaporanPath,
            'file_logbook' => $fileLogbookPath,
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        return redirect()
            ->route('progress.index')
            ->with('success', 'Laporan kemajuan berhasil disimpan.');
    }

    /**
     * Display the specified progress report.
     */
    public function show(ProgressReport $progressReport)
    {
        abort_if($progressReport->user_id !== Auth::id(), 403);

        $progressReport->load(['proposal', 'contract', 'evaluations.reviewer']);

        return Inertia::render('Progress/Show', [
            'progressReport' => $progressReport,
        ]);
    }

    /**
     * Evaluasi laporan monev oleh reviewer.
     */
    public function evaluateMonev(EvaluateMonevRequest $request, $id)
    {
        $report = ProgressReport::findOrFail($id);
        $report->loadMissing('proposal');
        $user = $request->user();

        // Multi-tenancy check
        if (! $user->isSuperAdmin() && (int) $report->proposal?->university_id !== (int) $user->university_id) {
            abort(403, 'Akses lintas institusi tidak diizinkan.');
        }

        // Conflict of Interest (CoI) Guard
        if ((int) $report->proposal?->id_pengusul === (int) $user->id) {
            abort(403, 'Reviewer memiliki konflik kepentingan langsung dengan usulan penelitian ini.');
        }

        $validated = $request->validated();

        $report->update([
            'skor_monev' => $validated['skor_monev'],
            'status_laporan' => $validated['status_laporan'],
            'catatan_reviewer_monev' => $validated['catatan_reviewer_monev'],
        ]);

        return redirect()->back()->with('success', 'Evaluasi monev berhasil disimpan.');
    }
}
