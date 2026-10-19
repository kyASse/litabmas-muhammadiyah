<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateSktsRequest;
use App\Models\Evaluation;
use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SktsController extends Controller
{
    /**
     * Menyimpan hasil penilaian evaluasi akhir oleh LPPM / Penilai.
     */
    public function evaluate(GenerateSktsRequest $request, Proposal $proposal)
    {
        $user = Auth::user();

        $score = $request->input('skor_akhir_substansi') ?? $request->input('skor');
        $recommendation = $request->input('rekomendasi_kelulusan');

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'id_evaluator' => $user->id,
                'skor_akhir_substansi' => $score,
                'rekomendasi_kelulusan' => $recommendation,
            ]
        );

        return redirect()->back()->with('success', 'Penilaian evaluasi akhir berhasil disimpan.');
    }

    /**
     * Menerbitkan nomor resmi SKTS unik institusi dan menyelesaikan siklus riset.
     */
    public function generateSkts(Request $request, Proposal $proposal)
    {
        $user = Auth::user();

        // Otorisasi multi-tenancy ketat (pencegahan IDOR)
        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

        if (! $isSuperAdmin) {
            if (! $isAdminKampus || (int) $user->university_id !== (int) $proposal->university_id) {
                abort(403, 'Anda tidak memiliki hak akses untuk menerbitkan SKTS institusi ini.');
            }
        }

        $universityCode = strtoupper($proposal->university?->code ?? 'UM');
        $year = date('Y');
        $sktsNumber = "SKTS/{$universityCode}/{$year}/{$proposal->id}";

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'id_evaluator' => $user->id,
                'nomor_skts' => $sktsNumber,
                'status_penelitian' => Evaluation::STATUS_SELESAI,
            ]
        );

        if ($proposal->contract) {
            $proposal->contract->update(['status_kontrak' => 'Closed']);
        }

        return redirect()->back()->with('success', "SKTS {$sktsNumber} berhasil diterbitkan.");
    }

    /**
     * Penutupan riset akibat Force Majeure / kondisi kahar.
     */
    public function terminateForceMajeure(Request $request, Proposal $proposal)
    {
        $user = Auth::user();

        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

        if (! $isSuperAdmin) {
            if (! $isAdminKampus || (int) $user->university_id !== (int) $proposal->university_id) {
                abort(403, 'Anda tidak memiliki hak akses untuk terminasi usulan institusi ini.');
            }
        }

        $reason = $request->input('alasan_terminasi', 'Force Majeure');

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'id_evaluator' => $user->id,
                'ringkasan_hasil' => $reason,
                'rekomendasi_kelulusan' => Evaluation::REKOMENDASI_TIDAK_LULUS,
                'status_penelitian' => Evaluation::STATUS_GAGAL,
            ]
        );

        if ($proposal->contract) {
            $proposal->contract->fundings()
                ->where('status_pencairan', 'Pending')
                ->update(['status_pencairan' => 'Cancelled']);
        }

        return redirect()->back()->with('success', 'Penelitian telah ditutup karena kondisi kahar (Force Majeure).');
    }
}
