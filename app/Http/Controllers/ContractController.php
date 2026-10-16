<?php

namespace App\Http\Controllers;

use App\Http\Requests\Finance\StoreContractRequest;
use App\Models\Contract;
use App\Models\Funding;
use App\Models\Proposal;
use App\Models\University;
use App\Services\ContractFundingService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ContractController
 *
 * Mengelola siklus dokumen kontrak penelitian dan termin pendanaan 70:30.
 * Merujuk pada Cetak Biru Arsitektur dan 21 Tabel Bersih (Klaster 4: Modul 3).
 */
class ContractController extends Controller
{
    /**
     * Tampilkan daftar manajemen kontrak penelitian.
     */
    public function index(Request $request): Response
    {
        $baseQuery = Contract::query()
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $query->search($request->string('search')->toString());
            })
            ->when($request->filled('status'), function (Builder $query) use ($request) {
                $query->byStatus($request->string('status')->toString());
            })
            ->when($request->filled('university_id'), function (Builder $query) use ($request) {
                $query->where('university_id', $request->integer('university_id'));
            });

        $contractValue = (float) (clone $baseQuery)->sum('dana_disetujui');
        $totalContracts = (clone $baseQuery)->count();
        $disbursedValue = (float) Funding::query()
            ->whereIn('id_contract', (clone $baseQuery)->select('contracts.id'))
            ->where('status_pencairan', Funding::STATUS_DISBURSED)
            ->sum('nominal_dana');

        $contracts = $baseQuery
            ->with([
                'university:id,name,short_name,code',
                'proposal.user:id,name,email',
                'proposal.researchSchema:id,nama_skema,biaya_maksimal',
                'fundings',
            ])
            ->withCount('fundings')
            ->withSum('fundings as funding_total', 'nominal_dana')
            ->withSum([
                'fundings as disbursed_total' => function (Builder $query) {
                    $query->where('status_pencairan', Funding::STATUS_DISBURSED);
                },
            ], 'nominal_dana')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Contract $contract) {
                $contractValue = (float) $contract->dana_disetujui;
                $disbursedTotal = (float) ($contract->disbursed_total ?? 0);

                return [
                    'id' => $contract->id,
                    'nomor_kontrak' => $contract->nomor_kontrak,
                    'contract_number' => $contract->nomor_kontrak,
                    'judul_kontrak' => $contract->judul_kontrak,
                    'title' => $contract->judul_kontrak,
                    'status' => $contract->status,
                    'status_kontrak' => $contract->status_kontrak,
                    'status_label' => $contract->status_label,
                    'status_color' => $contract->status_color,
                    'dana_disetujui' => $contractValue,
                    'contract_value' => $contractValue,
                    'party_1' => $contract->party_1,
                    'party_2' => $contract->party_2,
                    'funding_total' => (float) ($contract->funding_total ?? 0),
                    'disbursed_total' => $disbursedTotal,
                    'funding_progress' => $contractValue > 0
                        ? min(100, round(($disbursedTotal / $contractValue) * 100, 2))
                        : 0,
                    'fundings_count' => $contract->fundings_count,
                    'tanggal_kontrak' => $contract->tanggal_kontrak?->format('Y-m-d'),
                    'start_date' => $contract->tanggal_kontrak?->format('Y-m-d'),
                    'end_date' => $contract->end_date?->format('Y-m-d'),
                    'signed_at' => $contract->signed_at?->format('Y-m-d'),
                    'created_at' => $contract->created_at->format('Y-m-d'),
                    'university' => $contract->university ? [
                        'id' => $contract->university->id,
                        'name' => $contract->university->name,
                        'short_name' => $contract->university->short_name,
                        'code' => $contract->university->code,
                    ] : null,
                    'proposal' => $contract->proposal ? [
                        'id' => $contract->proposal->id,
                        'judul_penelitian' => $contract->proposal->judul_penelitian,
                        'status_proposal' => $contract->proposal->status_proposal,
                        'biaya_yang_diusulkan' => (float) ($contract->proposal->biaya_yang_diusulkan ?? 0),
                        'research_schema' => $contract->proposal->researchSchema ? [
                            'id' => $contract->proposal->researchSchema->id,
                            'nama_skema' => $contract->proposal->researchSchema->nama_skema,
                            'biaya_maksimal' => (float) ($contract->proposal->researchSchema->biaya_maksimal ?? 0),
                        ] : null,
                        'pengusul' => $contract->proposal->user ? [
                            'id' => $contract->proposal->user->id,
                            'name' => $contract->proposal->user->name,
                            'email' => $contract->proposal->user->email,
                        ] : null,
                    ] : null,
                    'fundings' => $contract->fundings,
                    'pembinaan' => null,
                ];
            });

        $eligibleProposals = Proposal::query()
            ->where('status_proposal', Proposal::STATUS_LOLOS_DIDANAI)
            ->whereDoesntHave('contract')
            ->with(['user:id,name,email', 'researchSchema:id,nama_skema,biaya_maksimal'])
            ->get(['id', 'judul_penelitian', 'id_pengusul', 'id_skema_pendanaan', 'biaya_yang_diusulkan'])
            ->map(fn (Proposal $p) => [
                'id' => $p->id,
                'judul_penelitian' => $p->judul_penelitian,
                'pengusul_nama' => $p->user?->name,
                'skema_nama' => $p->researchSchema?->nama_skema,
                'biaya_diusulkan' => (float) ($p->biaya_yang_diusulkan ?? 0),
                'pagu_maksimal' => (float) ($p->researchSchema?->biaya_maksimal ?? 0),
            ]);

        return Inertia::render('Finance/Contract/Index', [
            'contracts' => $contracts,
            'filters' => $request->only(['search', 'status', 'university_id']),
            'summary' => [
                'total_contracts' => $totalContracts,
                'contract_value' => $contractValue,
                'disbursed_value' => $disbursedValue,
                'outstanding_value' => max($contractValue - $disbursedValue, 0),
            ],
            'universities' => University::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'eligibleProposals' => $eligibleProposals,
            'pembinaanPrograms' => [],
            'statusOptions' => collect(Contract::getStatusOptions())
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values(),
        ]);
    }

    /**
     * Terbitkan kontrak penelitian baru dan bentuk tahapan termin 70:30.
     */
    public function store(StoreContractRequest $request, ContractFundingService $service): RedirectResponse
    {
        $proposal = Proposal::findOrFail($request->integer('id_proposal'));

        $service->issueContract(
            proposal: $proposal,
            danaDisetujui: (float) $request->input('dana_disetujui'),
            tanggalKontrak: (string) $request->input('tanggal_kontrak'),
            nomorKontrak: $request->filled('nomor_kontrak') ? $request->input('nomor_kontrak') : null,
        );

        return redirect()->back()->with('success', '[SUKSES] Kontrak diterbitkan dengan perhitungan termin 70:30.');
    }

    /**
     * Tampilkan detail kontrak penelitian dan rincian termin pendanaan.
     */
    public function show(Contract $contract): Response
    {
        $this->authorizeContractAccess($contract);

        $contract->load([
            'university',
            'proposal.user',
            'proposal.researchSchema',
            'proposal.progressReports',
            'fundings',
            'creator',
            'updater',
        ]);

        $isMonevApproved = (bool) ($contract->proposal?->progressReports?->contains(fn ($report) => $report->status_laporan === 'Approved'));

        return Inertia::render('Finance/Contract/Show', [
            'contract' => [
                'id' => $contract->id,
                'nomor_kontrak' => $contract->nomor_kontrak,
                'contract_number' => $contract->nomor_kontrak,
                'judul_kontrak' => $contract->judul_kontrak,
                'title' => $contract->judul_kontrak,
                'status' => $contract->status,
                'status_kontrak' => $contract->status_kontrak,
                'status_label' => $contract->getStatusLabelAttribute(),
                'status_color' => $contract->getStatusColorAttribute(),
                'dana_disetujui' => (float) $contract->dana_disetujui,
                'contract_value' => (float) $contract->dana_disetujui,
                'tanggal_kontrak' => $contract->tanggal_kontrak?->format('Y-m-d'),
                'start_date' => $contract->tanggal_kontrak?->format('Y-m-d'),
                'end_date' => $contract->end_date?->format('Y-m-d'),
                'terms' => $contract->terms,
                'notes' => $contract->notes,
                'file_dokumen_kontrak' => $contract->file_dokumen_kontrak,
                'is_monev_approved' => $isMonevApproved,
                'university' => $contract->university ? [
                    'id' => $contract->university->id,
                    'name' => $contract->university->name,
                    'code' => $contract->university->code,
                ] : null,
                'proposal' => $contract->proposal ? [
                    'id' => $contract->proposal->id,
                    'judul_penelitian' => $contract->proposal->judul_penelitian,
                    'status_proposal' => $contract->proposal->status_proposal,
                    'biaya_yang_diusulkan' => (float) ($contract->proposal->biaya_yang_diusulkan ?? 0),
                    'research_schema' => $contract->proposal->researchSchema ? [
                        'id' => $contract->proposal->researchSchema->id,
                        'nama_skema' => $contract->proposal->researchSchema->nama_skema,
                        'biaya_maksimal' => (float) ($contract->proposal->researchSchema->biaya_maksimal ?? 0),
                    ] : null,
                    'pengusul' => $contract->proposal->user ? [
                        'id' => $contract->proposal->user->id,
                        'name' => $contract->proposal->user->name,
                        'email' => $contract->proposal->user->email,
                    ] : null,
                ] : null,
                'fundings' => $contract->fundings->map(fn ($f) => [
                    'id' => $f->id,
                    'termin_ke' => $f->termin_ke,
                    'persentase_dana' => $f->persentase_dana,
                    'nominal_dana' => (float) $f->nominal_dana,
                    'status_pencairan' => $f->status_pencairan,
                    'status_label' => $f->status_label,
                    'tanggal_pencairan' => $f->tanggal_pencairan?->format('Y-m-d'),
                    'bukti_transfer_path' => $f->bukti_transfer_path,
                ]),
                'creator' => $contract->creator ? [
                    'id' => $contract->creator->id,
                    'name' => $contract->creator->name,
                ] : null,
                'created_at' => $contract->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $contract->updated_at?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Pembuatan kontrak draft secara langsung (legacy compatibility).
     */
    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'university_id' => ['nullable', 'integer', 'exists:universities,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'terms' => ['nullable', 'string'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'contract_value' => ['nullable', 'numeric', 'min:0'],
        ]);

        $contract = DB::transaction(function () use ($validated, $request) {
            $year = date('Y');
            $prefix = "KTR/{$year}/";
            $lastContract = Contract::withoutGlobalScopes()
                ->where('nomor_kontrak', 'like', "{$prefix}%")
                ->lockForUpdate()
                ->orderByDesc('id')
                ->first();

            $nextSequence = 1;
            if ($lastContract && preg_match('/\/(\d+)$/', (string) $lastContract->nomor_kontrak, $matches)) {
                $nextSequence = (int) $matches[1] + 1;
            }
            $contractNumber = sprintf('%s%04d', $prefix, $nextSequence);

            return Contract::create([
                'nomor_kontrak' => $contractNumber,
                'judul_kontrak' => $validated['title'],
                'university_id' => $validated['university_id'] ?? $request->user()->university_id,
                'tanggal_kontrak' => $validated['start_date'] ?? now()->toDateString(),
                'dana_disetujui' => $validated['contract_value'] ?? 0,
                'status_kontrak' => Contract::STATUS_DRAFT,
                'id_proposal' => null,
            ]);
        });

        return redirect()->back()
            ->with('success', "[SUKSES] Draft kontrak {$contract->nomor_kontrak} berhasil dibuat.");
    }

    /**
     * Perbarui status kontrak penelitian.
     */
    public function updateStatus(Request $request, Contract $contract): RedirectResponse
    {
        $this->authorizeContractAccess($contract);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:Draft,Signed,Active,Closed,draft,signed,active,closed'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $contract->update([
            'status_kontrak' => $validated['status'],
        ]);

        return back()->with('success', "[SUKSES] Status kontrak {$contract->nomor_kontrak} berhasil diperbarui.");
    }

    private function authorizeContractAccess(Contract $contract): void
    {
        $user = auth()->user();
        if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return;
        }

        if ($contract->university_id !== null && $user && $user->university_id !== $contract->university_id) {
            abort(403, 'Anda tidak memiliki akses ke kontrak ini.');
        }
    }
}
