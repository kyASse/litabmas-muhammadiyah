<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResearchOutputRequest;
use App\Models\BookOutput;
use App\Models\HkiOutput;
use App\Models\JournalOutput;
use App\Models\ProductOutput;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OutputController extends Controller
{
    /**
     * Display a listing of research outputs for the user or proposal.
     */
    public function index(Request $request)
    {
        $proposalId = $request->input('proposal_id');

        $query = ResearchOutput::with([
            'proposal.pengusul',
            'journalOutput',
            'bookOutput',
            'hkiOutput',
            'productOutput',
        ]);

        if ($proposalId) {
            $query->where('id_proposal', $proposalId);
        } else {
            $query->whereHas('proposal', function ($q) {
                $q->where('id_pengusul', Auth::id());
            });
        }

        $outputs = $query->latest()->paginate(10)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($outputs);
        }

        return Inertia::render('Output/Index', [
            'outputs' => $outputs,
        ]);
    }

    /**
     * Show the form for creating a new research output.
     */
    public function create()
    {
        abort_if(! auth()->check(), 403, '[BLOKIR] Anda harus login untuk mengakses halaman ini.');

        $outputTypes = [
            'Journal' => 'Jurnal / Publikasi Ilmiah',
            'Book' => 'Buku / Modul Ajar',
            'Hki' => 'Hak Kekayaan Intelektual (HKI)',
            'Product' => 'Produk / Prototipe',
        ];

        return Inertia::render('Output/Create', [
            'outputTypes' => $outputTypes,
            'journals' => [],
        ]);
    }

    /**
     * Store a newly created research output across 4 clusters.
     */
    public function store(StoreResearchOutputRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $proposal = Proposal::withoutGlobalScopes()->findOrFail($request->input('id_proposal'));

            $tipeLuaran = $request->input('tipe_luaran');
            $folder = strtolower($tipeLuaran);

            $filePath = null;
            if ($request->hasFile('file_dokumen')) {
                $filePath = $request->file('file_dokumen')->store("outputs/{$folder}", 'public');
            }

            $researchOutput = ResearchOutput::create([
                'id_proposal' => $proposal->id,
                'tipe_luaran' => $tipeLuaran,
                'target_status' => $request->input('target_status', 'Wajib'),
                'status_verifikasi' => 'Submitted',
                'tanggal_pelaporan' => now(),
            ]);

            switch ($tipeLuaran) {
                case 'Journal':
                    JournalOutput::create([
                        'id_research_output' => $researchOutput->id,
                        'nama_jurnal' => $request->input('nama_jurnal'),
                        'judul_artikel' => $request->input('judul_artikel'),
                        'issn' => $request->input('issn'),
                        'indeksasi' => $request->input('indeksasi'),
                        'status_publikasi' => $request->input('status_publikasi'),
                        'doi_url' => $request->input('doi_url'),
                        'file_artikel_path' => $filePath,
                    ]);
                    break;

                case 'Book':
                    BookOutput::create([
                        'id_research_output' => $researchOutput->id,
                        'judul_buku' => $request->input('judul_buku'),
                        'isbn' => $request->input('isbn'),
                        'penerbit' => $request->input('penerbit'),
                        'tahun_terbit' => $request->input('tahun_terbit'),
                        'jumlah_halaman' => $request->input('jumlah_halaman'),
                        'file_cover_path' => $filePath,
                    ]);
                    break;

                case 'Hki':
                    HkiOutput::create([
                        'id_research_output' => $researchOutput->id,
                        'judul_ciptaan' => $request->input('judul_ciptaan'),
                        'jenis_hki' => $request->input('jenis_hki'),
                        'nomor_pendaftaran' => $request->input('nomor_pendaftaran'),
                        'nomor_sertifikat' => $request->input('nomor_sertifikat'),
                        'file_sertifikat_path' => $filePath,
                    ]);
                    break;

                case 'Product':
                    ProductOutput::create([
                        'id_research_output' => $researchOutput->id,
                        'nama_produk' => $request->input('nama_produk'),
                        'deskripsi_produk' => $request->input('deskripsi_produk'),
                        'tingkat_kesiapan_teknologi' => $request->input('tingkat_kesiapan_teknologi'),
                        'dokumentasi_produk_path' => $filePath,
                    ]);
                    break;
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => '[SUKSES] Luaran penelitian berhasil disimpan.',
                    'data' => $researchOutput->load(['journalOutput', 'bookOutput', 'hkiOutput', 'productOutput']),
                ], 201);
            }

            return redirect()->route('outputs.index')->with('success', '[SUKSES] Luaran penelitian berhasil disimpan.');
        });
    }

    /**
     * Show the form for editing the specified research output.
     */
    public function edit(ResearchOutput $output)
    {
        $this->authorizeAccess($output);

        return Inertia::render('Output/Edit', [
            'outputs' => $output->load(['journalOutput', 'bookOutput', 'hkiOutput', 'productOutput']),
        ]);
    }

    /**
     * Update the specified research output in storage.
     */
    public function update(Request $request, ResearchOutput $output)
    {
        $this->authorizeAccess($output);

        $request->validate([
            'target_status' => 'nullable|string|in:Wajib,Tambahan',
            'catatan_verifikasi' => 'nullable|string',
        ]);

        $output->update(array_filter([
            'target_status' => $request->input('target_status'),
            'catatan_verifikasi' => $request->input('catatan_verifikasi'),
        ]));

        return redirect()->route('outputs.index')->with('success', '[SUKSES] Output berhasil diperbarui.');
    }

    /**
     * Remove the specified research output from storage.
     */
    public function destroy(ResearchOutput $output)
    {
        $this->authorizeAccess($output);

        // Delete associated files
        if ($output->journalOutput?->file_artikel_path) {
            Storage::disk('public')->delete($output->journalOutput->file_artikel_path);
        }
        if ($output->bookOutput?->file_cover_path) {
            Storage::disk('public')->delete($output->bookOutput->file_cover_path);
        }
        if ($output->hkiOutput?->file_sertifikat_path) {
            Storage::disk('public')->delete($output->hkiOutput->file_sertifikat_path);
        }
        if ($output->productOutput?->dokumentasi_produk_path) {
            Storage::disk('public')->delete($output->productOutput->dokumentasi_produk_path);
        }

        $output->delete();

        return redirect()->route('outputs.index')->with('success', '[SUKSES] Output deleted successfully');
    }

    /**
     * Authorize access to mutate research output.
     */
    protected function authorizeAccess(ResearchOutput $output): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403, '[BLOKIR] Anda harus login untuk melakukan aksi ini.');
        }

        $isOwner = $output->proposal?->id_pengusul === $user->id;
        $isAdmin = $user->hasAnyRole([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, Role::SUPER_ADMIN, 'Admin Kampus', 'Super Admin'], true);

        abort_if(! $isOwner && ! $isAdmin, 403, '[BLOKIR] Anda tidak memiliki hak akses terhadap luaran ini.');
    }
}
