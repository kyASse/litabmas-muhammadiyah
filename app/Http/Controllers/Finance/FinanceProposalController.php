<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceProposalController extends Controller
{
    /**
     * Tampilkan antrean usulan penelitian untuk audit kelayakan RAB oleh Admin Keuangan.
     *
     * @route GET /finance/proposals
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Proposal::class);

        $query = Proposal::with(['pengusul', 'researchSchema', 'university'])
            ->whereIn('status_proposal', [
                Proposal::STATUS_APPROVED_KAMPUS,
                Proposal::STATUS_LOLOS_ADMINISTRASI,
                Proposal::STATUS_ADMINISTRASI_VALID,
                Proposal::STATUS_DITOLAK_ADMINISTRASI,
            ]);

        // Filter Tahun Anggaran Skema
        if ($request->filled('year')) {
            $year = (int) $request->year;
            $query->whereHas('researchSchema', function ($q) use ($year) {
                $q->where('tahun_anggaran', $year);
            });
        }

        // Filter Status Audit RAB
        if ($request->filled('rab_status')) {
            if ($request->rab_status === 'approved') {
                $query->where('is_rab_approved', true);
            } elseif ($request->rab_status === 'rejected') {
                $query->where('is_rab_approved', false);
            } elseif ($request->rab_status === 'pending') {
                $query->whereNull('is_rab_approved');
            }
        }

        // Pencarian Judul atau Pengusul
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('judul_penelitian', 'like', "%{$search}%")
                    ->orWhereHas('pengusul', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $proposals = $query->latest('tanggal_pengajuan')
            ->paginate(15)
            ->withQueryString();

        $availableYears = ResearchSchema::select('tahun_anggaran')
            ->whereNotNull('tahun_anggaran')
            ->distinct()
            ->orderByDesc('tahun_anggaran')
            ->pluck('tahun_anggaran');

        return Inertia::render('Finance/Proposal/Index', [
            'proposals' => $proposals,
            'filters' => $request->only(['search', 'year', 'rab_status']),
            'availableYears' => $availableYears,
        ]);
    }

    /**
     * Tampilkan detail usulan penelitian dan berkas lampiran untuk audit RAB.
     *
     * @route GET /finance/proposals/{proposal}
     */
    public function show(Proposal $proposal): Response
    {
        $this->authorize('view', $proposal);

        $proposal->load([
            'pengusul',
            'researchSchema',
            'university',
            'documents',
            'members.user',
        ]);

        return Inertia::render('Finance/Proposal/Show', [
            'proposal' => [
                'id' => $proposal->id,
                'title' => $proposal->title,
                'abstract' => $proposal->abstract,
                'status_proposal' => $proposal->status_proposal,
                'biaya_yang_diusulkan' => (float) $proposal->biaya_yang_diusulkan,
                'rekomendasi_anggaran' => $proposal->rekomendasi_anggaran ? (float) $proposal->rekomendasi_anggaran : null,
                'is_administrasi_approved' => $proposal->is_administrasi_approved,
                'is_rab_approved' => $proposal->is_rab_approved,
                'catatan_administrasi' => $proposal->catatan_administrasi,
                'catatan_keuangan' => $proposal->catatan_keuangan,
                'tanggal_pengajuan' => $proposal->tanggal_pengajuan,
                'tanggal_verifikasi_administrasi' => $proposal->tanggal_verifikasi_administrasi?->format('Y-m-d H:i'),
                'tanggal_verifikasi_rab' => $proposal->tanggal_verifikasi_rab?->format('Y-m-d H:i'),
                'pengusul' => $proposal->pengusul ? [
                    'id' => $proposal->pengusul->id,
                    'name' => $proposal->pengusul->name,
                    'email' => $proposal->pengusul->email,
                    'nidn' => $proposal->pengusul->nidn,
                ] : null,
                'university' => $proposal->university ? [
                    'id' => $proposal->university->id,
                    'name' => $proposal->university->name,
                ] : null,
                'research_schema' => $proposal->researchSchema ? [
                    'id' => $proposal->researchSchema->id,
                    'name' => $proposal->researchSchema->name,
                    'max_funding' => (float) $proposal->researchSchema->max_funding,
                    'tahun_anggaran' => $proposal->researchSchema->tahun_anggaran,
                ] : null,
                'documents' => $proposal->documents ?? [],
                'members' => $proposal->members ?? [],
            ],
        ]);
    }

    /**
     * Audit kelayakan RAB proposal oleh Admin Keuangan Bappeda (Dual Sign-Off Gatekeeper).
     *
     * @route POST /finance/proposals/{proposal}/verify-rab
     */
    public function verifyRab(Request $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('verifyRab', $proposal);

        $request->validate([
            'status_rab' => ['required', 'in:Approved,Rejected'],
            'rekomendasi_anggaran' => ['nullable', 'numeric', 'min:0'],
            'catatan_keuangan' => [
                $request->status_rab === 'Rejected' ? 'required' : 'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $isApproved = $request->status_rab === 'Approved';

        if ($isApproved) {
            $proposal->update([
                'is_rab_approved' => true,
                'rekomendasi_anggaran' => $request->rekomendasi_anggaran ?? $proposal->biaya_yang_diusulkan,
                'catatan_keuangan' => $request->catatan_keuangan,
                'tanggal_verifikasi_rab' => now(),
            ]);

            // Cek apakah Super Admin juga telah menyetujui berkas administrasi
            if ($proposal->isAdministrasiApproved()) {
                $proposal->update([
                    'status_proposal' => Proposal::STATUS_LOLOS_ADMINISTRASI,
                ]);
                $statusMessage = "Proposal \"{$proposal->title}\" dinyatakan LOLOS seleksi administrasi & audit RAB (siap penugasan reviewer).";
            } else {
                $statusMessage = 'Audit kelayakan RAB berhasil disetujui. Menunggu verifikasi berkas administrasi oleh Super Admin Bappeda.';
            }
        } else {
            $proposal->update([
                'is_rab_approved' => false,
                'status_proposal' => Proposal::STATUS_DITOLAK_ADMINISTRASI,
                'catatan_keuangan' => $request->catatan_keuangan,
                'tanggal_verifikasi_rab' => now(),
            ]);

            $statusMessage = "Proposal \"{$proposal->title}\" dinyatakan DITOLAK pada audit kelayakan RAB.";
        }

        return redirect()
            ->back()
            ->with('success', $statusMessage);
    }
}
