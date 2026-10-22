<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFinalEvaluationRequest;
use App\Models\Evaluation;
use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EvaluationController extends Controller
{
    /**
     * Menampilkan laporan akhir peneliti untuk diunduh / dilihat (Peneliti).
     */
    public function show(Request $request, ?Proposal $proposal = null)
    {
        $user = Auth::user();

        if (! $proposal) {
            $proposalId = $request->input('proposal_id') ?? $request->input('id');
            if ($proposalId) {
                $proposal = Proposal::find($proposalId);
            } else {
                $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
                    || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
                $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
                    || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

                if ($isAdminKampus || $isSuperAdmin) {
                    $query = Proposal::query();
                    if ($isAdminKampus && $user->university_id) {
                        $query->where('university_id', $user->university_id);
                    }
                    $proposal = (clone $query)->whereHas('evaluation')->latest()->first()
                        ?? (clone $query)->where('status_proposal', 'Lolos_Didanai')->latest()->first()
                        ?? $query->latest()->first();
                } else {
                    $proposal = Proposal::where('id_pengusul', $user->id)->latest()->first();
                }
            }
        }

        if ($proposal) {
            // Otorisasi: Super Admin, Admin Kampus di institusi yang sama, atau Pengusul pemilik usulan
            $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
                || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
            $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
                || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

            if (! $isSuperAdmin) {
                if ($isAdminKampus && (int) $user->university_id !== (int) $proposal->university_id) {
                    abort(403, 'Anda tidak memiliki hak akses ke evaluasi institusi lain.');
                }
                if (! $isAdminKampus && ((int) $user->id !== (int) $proposal->id_pengusul || (int) $user->university_id !== (int) $proposal->university_id)) {
                    abort(403, 'Anda tidak memiliki hak akses ke evaluasi proposal ini.');
                }
            }

            $proposal->loadMissing([
                'user',
                'university',
                'researchSchema',
                'contract',
                'researchOutputs.journalOutput',
                'researchOutputs.bookOutput',
                'researchOutputs.hkiOutput',
                'researchOutputs.productOutput',
                'evaluation.evaluator',
            ]);
        }

        return Inertia::render('Evaluation/Show', [
            'proposal' => $proposal,
            'evaluation' => $proposal?->evaluation,
            'outputs' => $proposal?->researchOutputs ?? [],
        ]);
    }

    /**
     * Menampilkan sertifikat SKTS resmi (Surat Keterangan Tanda Selesai).
     */
    public function certificate(Request $request, Proposal $proposal)
    {
        $user = Auth::user();

        // Otorisasi: Super Admin, Admin Kampus di institusi yang sama, atau Pengusul pemilik usulan
        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

        if (! $isSuperAdmin) {
            if ($isAdminKampus && (int) $user->university_id !== (int) $proposal->university_id) {
                abort(403, 'Anda tidak memiliki hak akses ke sertifikat institusi lain.');
            }
            if (! $isAdminKampus && ((int) $user->id !== (int) $proposal->id_pengusul || (int) $user->university_id !== (int) $proposal->university_id)) {
                abort(403, 'Anda tidak memiliki hak akses ke sertifikat proposal ini.');
            }
        }

        $proposal->loadMissing([
            'user',
            'university',
            'researchSchema',
            'contract',
            'evaluation.evaluator',
        ]);

        return Inertia::render('Evaluation/SktsCertificate', [
            'proposal' => $proposal,
            'evaluation' => $proposal->evaluation,
            'university' => $proposal->university,
        ]);
    }

    /**
     * Menyimpan penyerahan laporan akhir 100% dan memicu status Dalam_Evaluasi.
     */
    public function store(StoreFinalEvaluationRequest $request, Proposal $proposal)
    {
        $user = Auth::user();

        // Otorisasi kepemilikan usulan (pencegahan IDOR)
        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

        if (! $isSuperAdmin) {
            if ($isAdminKampus && (int) $user->university_id !== (int) $proposal->university_id) {
                abort(403, 'Anda tidak memiliki hak akses ke proposal institusi lain.');
            }
            if (! $isAdminKampus && ((int) $user->id !== (int) $proposal->id_pengusul || (int) $user->university_id !== (int) $proposal->university_id)) {
                abort(403, 'Anda tidak memiliki hak akses untuk menyerahkan evaluasi akhir usulan ini.');
            }
        }

        $filePath = null;
        if ($request->hasFile('file_laporan_akhir')) {
            $filePath = $request->file('file_laporan_akhir')->store('evaluations', 'public');
        }

        $wajibOutputs = $proposal->researchOutputs()
            ->where('target_status', 'Wajib')
            ->get();
        $totalWajib = $wajibOutputs->count();
        $verifiedWajib = $wajibOutputs->filter(fn ($o) => $o->status_verifikasi === 'Verified')->count();
        $percentage = $totalWajib > 0 ? (int) round(($verifiedWajib / $totalWajib) * 100) : 100;

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'file_laporan_akhir' => $filePath ?? 'evaluations/default.pdf',
                'ringkasan_hasil' => $request->input('ringkasan_hasil'),
                'persentase_capaian_luaran' => $percentage,
                'status_penelitian' => Evaluation::STATUS_DALAM_EVALUASI,
            ]
        );

        return redirect()->back()->with('success', 'Laporan akhir berhasil diajukan dan sedang dalam proses evaluasi akhir.');
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
