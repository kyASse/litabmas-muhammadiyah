<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateSktsRequest;
use App\Http\Requests\TerminateResearchRequest;
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
                'file_laporan_akhir' => $proposal->evaluation?->file_laporan_akhir ?? 'reports/final.pdf',
                'ringkasan_hasil' => $proposal->evaluation?->ringkasan_hasil ?? 'Evaluasi akhir substansi selesai.',
                'skor_akhir_substansi' => $score,
                'rekomendasi_kelulusan' => $recommendation,
            ]
        );

        return redirect()->back()->with('success', '[SUKSES] Penilaian evaluasi akhir berhasil disimpan.');
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
                abort(403, '[BLOKIR] Anda tidak memiliki hak akses untuk menerbitkan SKTS institusi ini.');
            }
        }

        $universityCode = strtoupper($proposal->university?->code ?? 'UM');
        $year = date('Y');
        $sktsNumber = "SKTS/{$universityCode}/{$year}/{$proposal->id}";

        if ($proposal->contract) {
            $proposal->contract->update(['status_kontrak' => 'Closed']);
        }

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'id_evaluator' => $user->id,
                'file_laporan_akhir' => $proposal->evaluation?->file_laporan_akhir ?? 'reports/final.pdf',
                'ringkasan_hasil' => $proposal->evaluation?->ringkasan_hasil ?? 'Penelitian selesai dengan hasil memuaskan.',
                'nomor_skts' => $sktsNumber,
                'status_penelitian' => Evaluation::STATUS_SELESAI,
            ]
        );

        return redirect()->back()->with('success', "[SUKSES] SKTS {$sktsNumber} berhasil diterbitkan.");
    }

    /**
     * Penutupan riset akibat Force Majeure / kondisi kahar.
     */
    public function terminateForceMajeure(TerminateResearchRequest $request, Proposal $proposal)
    {
        $user = Auth::user();

        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);

        if (! $isSuperAdmin) {
            if (! $isAdminKampus || (int) $user->university_id !== (int) $proposal->university_id) {
                abort(403, '[BLOKIR] Anda tidak memiliki hak akses untuk terminasi usulan institusi ini.');
            }
        }

        $reason = $request->input('alasan_terminasi', 'Force Majeure');

        // Handle file upload or berita acara path fallback
        $beritaAcaraPath = $request->input('berita_acara_path');
        if ($request->hasFile('file_berita_acara')) {
            $beritaAcaraPath = $request->file('file_berita_acara')->store('evaluations/berita_acara', 'public');
        } elseif ($request->hasFile('file_laporan_akhir')) {
            $beritaAcaraPath = $request->file('file_laporan_akhir')->store('evaluations/berita_acara', 'public');
        } elseif (! $beritaAcaraPath) {
            $beritaAcaraPath = 'evaluations/force-majeure.pdf';
        }

        if ($proposal->contract) {
            $proposal->contract->fundings()
                ->where('status_pencairan', 'Pending')
                ->update([
                    'status_pencairan' => 'Cancelled',
                    'catatan_keuangan' => 'Dibatalkan akibat terminasi force majeure: ' . $reason,
                ]);

            $proposal->contract->update(['status_kontrak' => 'Closed']);
        }

        Evaluation::updateOrCreate(
            ['id_proposal' => $proposal->id],
            [
                'id_evaluator' => $user->id,
                'file_laporan_akhir' => $beritaAcaraPath,
                'ringkasan_hasil' => $reason,
                'rekomendasi_kelulusan' => Evaluation::REKOMENDASI_TIDAK_LULUS,
                'status_penelitian' => Evaluation::STATUS_GAGAL,
            ]
        );

        return redirect()->back()->with('success', '[SUKSES] Penelitian telah ditutup karena kondisi kahar (Force Majeure).');
    }
}
