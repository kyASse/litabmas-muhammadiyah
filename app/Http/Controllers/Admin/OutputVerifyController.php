<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyOutputRequest;
use App\Models\ResearchOutput;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OutputVerifyController extends Controller
{
    /**
     * Display a listing of research outputs requiring verification.
     */
    public function index(Request $request)
    {
        $query = ResearchOutput::with([
            'proposal.pengusul',
            'proposal.university',
            'journalOutput',
            'bookOutput',
            'hkiOutput',
            'productOutput',
        ])->latest();

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
