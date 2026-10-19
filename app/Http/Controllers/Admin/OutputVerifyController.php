<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyOutputRequest;
use App\Models\ResearchOutput;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OutputVerifyController extends Controller
{
    /**
     * Display a listing of research outputs requiring verification.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);

        $query = ResearchOutput::with([
            'proposal.pengusul',
            'proposal.university',
            'journalOutput',
            'bookOutput',
            'hkiOutput',
            'productOutput',
        ])->latest();

        // Multi-tenancy isolation: filter by university_id unless Super Admin
        if (! $isSuperAdmin) {
            $query->whereHas('proposal', function ($q) use ($user) {
                $q->where('university_id', $user->university_id);
            });
        }

        $status = $request->input('status_verifikasi', $request->input('status'));
        if ($status && $status !== 'all') {
            $query->where('status_verifikasi', $status);
        }

        $tipe = $request->input('tipe_luaran', $request->input('kategori'));
        if ($tipe) {
            $query->where('tipe_luaran', $tipe);
        }

        $outputs = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Output/Index', [
            'outputs' => $outputs,
            'filters' => [
                'status_verifikasi' => $request->input('status_verifikasi', ''),
                'tipe_luaran' => $request->input('tipe_luaran', ''),
            ],
            'kategoriOptions' => ResearchOutput::KATEGORI,
            'statusOptions' => ResearchOutput::STATUS,
        ]);
    }

    /**
     * Verify or reject a research output.
     */
    public function verify(VerifyOutputRequest $request, ResearchOutput $output)
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);

        if (! $isSuperAdmin) {
            $outputUniversityId = $output->proposal?->university_id;
            abort_if(
                (int) $user->university_id !== (int) $outputUniversityId,
                403,
                '[BLOKIR] Anda tidak memiliki izin untuk memverifikasi luaran institusi lain.'
            );
        }

        $status = $request->input('status_verifikasi');
        $catatan = $request->input('catatan_verifikasi');

        $output->update([
            'status_verifikasi' => $status,
            'catatan_verifikasi' => $status === 'Rejected' ? $catatan : null,
        ]);

        $message = $status === 'Verified'
            ? '[SUKSES] Luaran penelitian berhasil diverifikasi.'
            : '[SUKSES] Luaran penelitian ditolak dengan catatan evaluasi.';

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'data' => $output,
            ]);
        }

        return back()->with('success', $message);
    }
}
