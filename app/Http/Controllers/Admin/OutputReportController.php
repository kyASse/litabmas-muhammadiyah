<?php

namespace App\Http\Controllers\Admin;

use App\Exports\OutputsExport;
use App\Http\Controllers\Controller;
use App\Models\ResearchOutput;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OutputReportController extends Controller
{
    /**
     * Render the printable Rekap Luaran report page.
     *
     * Passes to the Inertia view:
     *  - outputs         : flat list of verified outputs (with relations)
     *  - statsByType     : total per output type
     *  - statsByYear     : total per output year
     *  - filters         : active filter values echoed back
     *  - generatedAt     : current UTC timestamp (ISO-8601)
     *
     * Supports optional query-string filters:
     *  - type  : 'Jurnal' | 'Buku' | 'HKI' | 'Produk'
     *  - year  : e.g. '2025'
     *
     * @route GET /admin/output/report
     *
     * @name  admin.output.report
     */
    public function index(Request $request): Response
    {
        $type = $request->input('type');
        $year = $request->input('year');
        $user = Auth::user();

        /* ── 1. Main outputs list ───────────────────────────────────────── */
        $statusCol = Schema::hasColumn('research_outputs', 'status_verifikasi') ? 'status_verifikasi' : 'status';
        $typeCol = Schema::hasColumn('research_outputs', 'tipe_luaran') ? 'tipe_luaran' : 'type';

        $outputsQuery = ResearchOutput::with(['user.university'])
            ->whereIn($statusCol, ['Verified', 'verified'])
            ->when($type, fn ($q) => $q->where($typeCol, $type))
            ->when($year, function ($q) use ($year) {
                if (Schema::hasColumn('research_outputs', 'tanggal_pelaporan')) {
                    $q->whereYear('tanggal_pelaporan', $year);
                } else {
                    $q->whereYear('created_at', $year);
                }
            });

        // Multi-tenancy filters
        if ($user->isAdminKampus()) {
            $outputsQuery->whereHas('user', function ($uq) use ($user) {
                $uq->where('users.university_id', $user->university_id);
            });
        } elseif (! $user->isSuperAdmin()) {
            $outputsQuery->where('user_id', $user->id);
        }

        $outputs = $outputsQuery->orderBy('created_at', 'desc')->get();

        /* ── 2. Stats by type (honours active filters) ──────────────────── */
        $typeLabels = [
            'Journal' => 'Jurnal',
            'Book' => 'Buku',
            'Hki' => 'HKI',
            'Product' => 'Produk',
        ];

        $statsByType = collect($typeLabels)
            ->map(function ($label, $key) use ($outputs, $typeCol) {
                return [
                    'category' => $key,
                    'label' => $label,
                    'total' => $outputs->where($typeCol, $key)->count(),
                ];
            })
            ->values();

        /* ── 3. Stats by year (honours active filters) ──────────────────── */
        $statsByYear = $outputs->groupBy(function ($item) {
            $d = $item->tanggal_pelaporan ?? $item->created_at;

            return $d ? date('Y', strtotime((string) $d)) : date('Y');
        })->map(function ($group, $y) {
            return [
                'year' => (int) $y,
                'total' => $group->count(),
            ];
        })->values();

        /* ── 4. Render ──────────────────────────────────────────────────── */
        return Inertia::render('Admin/Output/Report', [
            'outputs' => $outputs,
            'statsByType' => $statsByType,
            'statsByYear' => $statsByYear,
            'filters' => [
                'type' => $type,
                'year' => $year,
            ],
            'generatedAt' => now()->toISOString(),
        ]);
    }

    /**
     * Stream a styled Excel workbook of verified luaran.
     *
     * Supports the same optional query-string filters as index():
     *  - type         : 'Jurnal' | 'Buku' | 'HKI' | 'Produk'
     *  - year         : e.g. '2025'
     *  - university_id: filter to a single university (Admin Kampus restricted)
     *
     * @route GET /admin/output/export
     *
     * @name  admin.output.export
     */
    public function export(Request $request): BinaryFileResponse
    {
        $type = $request->input('type');
        $year = $request->input('year');
        $universityId = $request->integer('university_id') ?: null;
        $user = Auth::user();

        $userId = null;
        if ($user->isAdminKampus()) {
            $universityId = $user->university_id;
        } elseif (! $user->isSuperAdmin()) {
            $userId = $user->id;
        }

        // Build a descriptive filename: luaran_jurnal_2025.xlsx
        $parts = ['luaran'];
        if ($type) {
            $parts[] = strtolower($type);
        }
        if ($year) {
            $parts[] = $year;
        }
        if ($universityId) {
            $parts[] = 'univ'.$universityId;
        }
        $filename = implode('_', $parts).'.xlsx';

        return Excel::download(
            new OutputsExport($type, $year, $universityId, $userId),
            $filename,
            \Maatwebsite\Excel\Excel::XLSX,
        );
    }
}
