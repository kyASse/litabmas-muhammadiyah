<?php

namespace App\Http\Controllers;

use App\Http\Requests\Progress\StoreProgressReportRequest;
use App\Http\Requests\Reviewer\EvaluateMonevRequest;
use App\Models\Contract;
use App\Models\MonevSchedule;
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

        $query = ProgressReport::whereHas('proposal', function ($q) use ($user) {
            $q->where('id_pengusul', $user->id)
                ->orWhere('user_id', $user->id);
        })->with(['proposal', 'monevSchedule']);

        // Search by title or summary
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('ringkasan_progres', 'like', "%{$search}%")
                    ->orWhereHas('proposal', function ($pq) use ($search) {
                        $pq->where('judul_penelitian', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        $progressReports = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Progress/Index', [
            'progressReports' => $progressReports,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new progress report.
     */
    public function create()
    {
        $userId = Auth::id();
        $proposals = Proposal::where(function ($q) use ($userId) {
            $q->where('id_pengusul', $userId)->orWhere('user_id', $userId);
        })
            ->where('status_proposal', Proposal::STATUS_LOLOS_DIDANAI)
            ->orderBy('judul_penelitian')
            ->get(['id', 'judul_penelitian']);

        $schedules = MonevSchedule::where('is_active', true)
            ->orderBy('tanggal_mulai', 'desc')
            ->get(['id', 'nama_tahap', 'tanggal_mulai', 'tanggal_selesai', 'deskripsi', 'is_active']);

        return Inertia::render('Progress/Create', [
            'proposals' => $proposals,
            'schedules' => $schedules,
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
        $progressReport->loadMissing('proposal');
        abort_if((int) $progressReport->user_id !== (int) Auth::id(), 403);

        $progressReport->loadMissing(['proposal.contract', 'monevSchedule']);

        $reportData = array_merge($progressReport->toArray(), [
            'id' => $progressReport->id,
            'title' => $progressReport->proposal?->judul_penelitian ?? 'Laporan Kemajuan',
            'content' => $progressReport->ringkasan_progres,
            'report_type' => 'laporan_kemajuan',
            'report_date' => $progressReport->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'progress_percentage' => (int) $progressReport->persentase_kemajuan,
            'report_period' => $progressReport->monevSchedule?->nama_tahap ?? 'Monev Kemajuan',
            'attachment_path' => $progressReport->file_laporan_kemajuan,
            'status' => strtolower($progressReport->status_laporan ?? 'submitted'),
            'submitted_at' => $progressReport->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'created_at' => $progressReport->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'proposal' => [
                'id' => $progressReport->proposal?->id,
                'title' => $progressReport->proposal?->judul_penelitian,
            ],
            'contract' => $progressReport->proposal?->contract ? [
                'id' => $progressReport->proposal->contract->id,
                'contract_number' => $progressReport->proposal->contract->nomor_kontrak,
                'title' => $progressReport->proposal->contract->judul_kontrak,
            ] : null,
            'evaluations' => $progressReport->evaluations,
        ]);

        return Inertia::render('Progress/Show', [
            'progressReport' => $reportData,
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
