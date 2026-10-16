<?php

namespace App\Http\Controllers;

use App\Http\Requests\Finance\DisburseFundingRequest;
use App\Http\Requests\StoreFundingRequest;
use App\Models\Contract;
use App\Models\Funding;
use App\Services\FundingDisbursementService;
use App\Services\FundingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FundingController extends Controller
{
    /**
     * Menampilkan form pembuatan termin pencairan dana
     */
    public function create(Request $request, Contract $contract)
    {
        // Pengecekan Otorisasi Multi-Tenancy / Security
        $user = $request->user();
        if (! $user->hasAnyRole(['Admin Keuangan', 'Super Admin'])) {
            if ($user->hasRole('Admin Kampus')) {
                if ($contract->university_id !== $user->university_id) {
                    abort(403, 'Unauthorized access to this contract funding.');
                }
            } else {
                abort(403, 'Unauthorized access.');
            }
        }

        $service = app(FundingService::class);
        $sisa = $service->calculateSisa($contract);

        $contract->load(['proposal', 'fundings' => function ($query) {
            $query->where('status', '!=', Funding::STATUS_CANCELLED)
                ->orderBy('created_at', 'asc');
        }]);

        return Inertia::render('Finance/Funding/Create', [
            'contract' => $contract,
            'termins' => $contract->fundings,
            'sisa' => $sisa,
        ]);
    }

    /**
     * Menyimpan data termin pencairan baru
     */
    public function storeTermin(StoreFundingRequest $request)
    {
        $validated = $request->validated();
        $contract = Contract::findOrFail($validated['id_contract']);

        $service = app(FundingService::class);
        $fundingNumber = $service->generateFundingNumber($contract);

        // Hitung nominal dari persentase
        $amount = ((float) $validated['percentage'] / 100) * (float) $contract->contract_value;

        Funding::create([
            'contract_id' => $contract->id,
            'funding_number' => $fundingNumber,
            'description' => $validated['description'] ?? null,
            'amount' => round($amount, 2),
            'percentage' => $validated['percentage'],
            'status' => Funding::STATUS_PLANNED,
            'funding_date' => $validated['funding_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('finance.funding.create', $contract->id)
            ->with('success', 'Termin pencairan berhasil ditambahkan.');
    }

    /**
     * Upload bukti transfer (proof of disbursement) for a funding term.
     */
    public function uploadBukti(Request $request, Funding $funding): RedirectResponse
    {
        $validated = $request->validate([
            'proof_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'reference_number' => 'nullable|string|max:100',
            'paid_at' => 'nullable|date',
        ], [
            'proof_document.required' => 'File bukti transfer harus diunggah.',
            'proof_document.mimes' => 'File hanya boleh berformat PDF, JPG, atau PNG.',
            'proof_document.max' => 'Ukuran file tidak boleh lebih dari 5MB.',
        ]);

        $file = $validated['proof_document'];
        $fileName = time().'_'.$file->getClientOriginalName();
        $filePath = $file->storeAs('funding_receipts', $fileName, 'public');

        $funding->update([
            'proof_document_path' => $filePath,
            'reference_number' => $validated['reference_number'] ?? $funding->reference_number,
            'paid_at' => $validated['paid_at'] ?? $funding->paid_at ?? now(),
            'status' => Funding::STATUS_DISBURSED,
        ]);

        return back()->with('success', 'Bukti transfer dana berhasil diunggah.');
    }

    /**
     * Mencetak kwitansi termin ke dalam format PDF
     */
    public function printKwitansi(Request $request, $id)
    {
        // Mengambil data funding dan relasi contract.university
        $funding = Funding::with(['contract.university'])->findOrFail($id);

        // Pengecekan Otorisasi Multi-Tenancy
        $user = $request->user();
        if ($user->hasRole('Admin Kampus') && $funding->contract->university_id !== $user->university_id) {
            abort(403, 'Unauthorized access to this funding receipt.');
        }

        // Siapkan data untuk dikirim ke view
        $data = [
            'title' => 'Kwitansi Termin Pencairan',
            'date' => date('d/m/Y'),
            'funding' => $funding,
        ];

        // Konfigurasi Kertas Dinamis
        // Mengambil parameter dari URL, jika tidak ada gunakan nilai default
        $orientation = $request->query('orientation', 'landscape');
        $size = $request->query('size', 'A4');

        // Render tampilan PDF
        $pdf = Pdf::loadView('print.kwitansi', $data);

        // Logika penentuan ukuran kertas
        if ($size === 'custom') {
            // Jika custom, ambil nilai width dan height dari URL (dalam satuan point/pt)
            // Default 500x300 pt jika tidak diisi
            $width = $request->query('width', 500);
            $height = $request->query('height', 300);

            // DomPDF menerima array [x, y, width, height] untuk ukuran custom
            $pdf->setPaper([0, 0, $width, $height]);
        } else {
            // Untuk ukuran standar (A4, Letter, Legal, dll) dan orientasi (landscape/portrait)
            $pdf->setPaper($size, $orientation);
        }

        // Tampilkan PDF di browser
        return $pdf->stream('Kwitansi_Termin_'.$funding->id.'.pdf');
    }

    /**
     * Menampilkan daftar pendanaan riset (Finance).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Funding::with([
            'contract.university',
            'contract.proposal.user',
            'contract.proposal.progressReports',
            'contract.proposal.researchSchema',
        ]);

        if ($user && ! $user->isSuperAdmin()) {
            $query->whereHas('contract', function ($q) use ($user) {
                if ($user->university_id) {
                    $q->where('university_id', $user->university_id);
                }
            });
        }

        $fundings = $query->orderBy('created_at', 'desc')->paginate(10)->through(function ($f) {
            $proposal = $f->contract?->proposal;
            $hasApprovedMonev = (bool) ($proposal && $proposal->progressReports->contains(fn ($r) => $r->status_laporan === 'Approved'));

            return [
                'id' => $f->id,
                'contract_id' => $f->id_contract ?? $f->contract_id,
                'id_contract' => $f->id_contract ?? $f->contract_id,
                'termin_ke' => (int) ($f->termin_ke ?? ($f->percentage > 50 ? 1 : 2)),
                'persentase_dana' => (float) ($f->persentase_dana ?? $f->percentage ?? 0),
                'nominal_dana' => (float) ($f->nominal_dana ?? $f->amount ?? 0),
                'status_pencairan' => $f->status_pencairan ?? $f->status ?? Funding::STATUS_PLANNED,
                'status_label' => $f->status_label,
                'status_color' => $f->status_color,
                'tanggal_pencairan' => $f->tanggal_pencairan?->format('Y-m-d') ?? $f->paid_at?->format('Y-m-d'),
                'bukti_transfer_path' => $f->bukti_transfer_path ?? $f->proof_document_path,
                'catatan_keuangan' => $f->catatan_keuangan ?? $f->notes,
                'reference_number' => $f->reference_number,
                'is_monev_approved' => $hasApprovedMonev,
                'contract' => $f->contract ? [
                    'id' => $f->contract->id,
                    'nomor_kontrak' => $f->contract->nomor_kontrak ?? $f->contract->contract_number,
                    'judul_kontrak' => $f->contract->judul_kontrak ?? $f->contract->title,
                    'dana_disetujui' => (float) ($f->contract->dana_disetujui ?? $f->contract->contract_value ?? 0),
                    'university' => $f->contract->university ? [
                        'id' => $f->contract->university->id,
                        'name' => $f->contract->university->name,
                        'short_name' => $f->contract->university->short_name,
                        'code' => $f->contract->university->code,
                    ] : null,
                    'proposal' => $proposal ? [
                        'id' => $proposal->id,
                        'judul_penelitian' => $proposal->judul_penelitian ?? $proposal->title,
                        'pengusul' => $proposal->user ? [
                            'id' => $proposal->user->id,
                            'name' => $proposal->user->name,
                            'email' => $proposal->user->email,
                        ] : null,
                        'research_schema' => $proposal->researchSchema ? [
                            'id' => $proposal->researchSchema->id,
                            'nama_skema' => $proposal->researchSchema->nama_skema,
                        ] : null,
                    ] : null,
                ] : null,
            ];
        });

        return Inertia::render('Finance/Funding/Index', [
            'fundings' => $fundings,
        ]);
    }

    /**
     * Pencairan dana termin riset (Disburse).
     */
    public function disburse(DisburseFundingRequest $request, $id, FundingDisbursementService $service)
    {
        $funding = $id instanceof Funding
            ? $id
            : Funding::with('contract.proposal.progressReports')->findOrFail($id);

        $service->disburse(
            $funding,
            $request->file('bukti_transfer'),
            $request->validated('tanggal_pencairan'),
            $request->validated('catatan_keuangan')
        );

        return redirect()->back()->with('success', '[SUKSES] Dana termin berhasil dicairkan.');
    }
}
