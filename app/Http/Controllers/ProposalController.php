<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProposalRequest;
use App\Http\Requests\UpdateProposalRequest;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Models\ProposalMember;
use App\Models\ResearchSchema;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProposalController extends Controller
{
    /**
     * Display a listing of the resource for authenticated Dosen.
     */
    public function index(Request $request): Response
    {
        $query = Proposal::query()
            ->with(['researchSchema', 'user:id,name,email', 'members.user', 'documents'])
            ->where('id_pengusul', auth()->id());

        if ($request->filled('search')) {
            $query->where('judul_penelitian', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('status_proposal', $request->status);
        }

        if ($request->filled('tahun_anggaran')) {
            $year = $request->input('tahun_anggaran');
            $query->whereHas('researchSchema', fn ($sq) => $sq->where('tahun_anggaran', $year));
        } elseif ($request->filled('year')) {
            $year = $request->input('year');
            $query->whereHas('researchSchema', fn ($sq) => $sq->where('tahun_anggaran', $year));
        }

        $proposals = $query
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Proposal/Index', [
            'proposals' => $proposals,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'tahun_anggaran' => $request->tahun_anggaran ?? $request->year ?? '',
                'year' => $request->year ?? $request->tahun_anggaran ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $universityId = $user?->university_id;

        $schemas = ResearchSchema::select('id', 'nama_skema', 'deskripsi', 'biaya_maksimal', 'tanggal_mulai', 'tanggal_selesai', 'is_active')
            ->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            })
            ->get();

        $lecturers = User::select('id', 'name', 'email', 'nidn', 'study_program')
            ->when($universityId, fn ($q) => $q->where('university_id', $universityId))
            ->when($user, fn ($q) => $q->where('id', '!=', $user->id))
            ->orderBy('name')
            ->get();

        return Inertia::render('Proposal/Create', [
            'schemas' => $schemas,
            'lecturers' => $lecturers,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProposalRequest $request): RedirectResponse
    {
        $userId = $request->user()->id;
        $lockKey = 'submit-proposal:'.$userId;
        $lock = Cache::lock($lockKey, 10);

        if (! $lock->get()) {
            return back()->withErrors([
                'error' => '[PERINGATAN] Permintaan Anda sedang diproses. Mohon tunggu beberapa saat.',
            ]);
        }

        try {
            $proposal = DB::transaction(function () use ($request) {
                $validated = $request->validated();
                $action = $request->input('action', 'submit');
                $isDraft = ($action === 'draft');
                $isKampus = in_array($action, ['submit_kampus', 'submit-kampus', 'campus'], true) || $request->input('target') === 'kampus';

                if ($isDraft) {
                    $status = Proposal::STATUS_DRAFT;
                } elseif ($isKampus) {
                    $status = Proposal::STATUS_SUBMITTED_KAMPUS;
                } else {
                    $status = Proposal::STATUS_SUBMITTED;
                }

                $proposal = Proposal::create([
                    'university_id' => $request->user()->university_id,
                    'id_pengusul' => $request->user()->id,
                    'id_skema_pendanaan' => $validated['id_skema_pendanaan'],
                    'judul_penelitian' => $validated['judul_penelitian'],
                    'abstrak' => $validated['abstrak'],
                    'latar_belakang' => $request->input('latar_belakang'),
                    'biaya_yang_diusulkan' => $validated['biaya_yang_diusulkan'] ?? 0,
                    'status_proposal' => $status,
                    'tanggal_pengajuan' => $isDraft ? null : now()->toDateString(),
                ]);

                if ($request->hasFile('file_dokumen_proposal')) {
                    $file = $request->file('file_dokumen_proposal');
                    $fileName = $file->getClientOriginalName();
                    $storedName = time().'_'.Str::slug(pathinfo($fileName, PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
                    $filePath = $file->storeAs('proposal_documents', $storedName, 'public');

                    ProposalDocument::create([
                        'id_proposal' => $proposal->id,
                        'nama_file' => $fileName,
                        'file_path' => $filePath,
                        'file_size' => $file->getSize(),
                        'tipe_dokumen' => 'Proposal_Utama',
                    ]);

                    $proposal->file_dokumen_proposal = $filePath;
                }

                if (! empty($validated['members']) && is_array($validated['members'])) {
                    foreach ($validated['members'] as $member) {
                        ProposalMember::create([
                            'id_proposal' => $proposal->id,
                            'user_id' => $member['user_id'],
                            'peran' => $member['peran'] ?? 'Anggota Peneliti',
                            'alokasi_jam_per_minggu' => $member['alokasi_jam_per_minggu'] ?? 10,
                        ]);
                    }
                }

                return $proposal;
            });

            $message = ($proposal->status_proposal === Proposal::STATUS_DRAFT)
                ? '[SUKSES] Usulan penelitian berhasil disimpan sebagai draf.'
                : '[SUKSES] Usulan penelitian berhasil diajukan.';

            return redirect()->route('proposals.index')
                ->with('success', $message);
        } finally {
            $lock->release();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Proposal $proposal): Response
    {
        $this->authorize('view', $proposal);

        $proposal->load([
            'user:id,name,email',
            'researchSchema',
            'documents',
            'members.user:id,name,email',
        ]);

        return Inertia::render('Proposal/Show', [
            'proposal' => $proposal,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Proposal $proposal): Response
    {
        $this->authorize('update', $proposal);

        $schemas = ResearchSchema::select('id', 'nama_skema', 'deskripsi', 'biaya_maksimal')->get();

        return Inertia::render('Proposal/Edit', [
            'proposal' => $proposal->load(['members.user', 'documents']),
            'schemas' => $schemas,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProposalRequest $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('update', $proposal);

        $validated = $request->validated();
        $action = $request->input('action', 'submit');
        $isDraft = ($action === 'draft');
        $isKampus = in_array($action, ['submit_kampus', 'submit-kampus', 'campus'], true) || $request->input('target') === 'kampus';

        if ($isDraft) {
            $status = Proposal::STATUS_DRAFT;
        } elseif ($isKampus) {
            $status = Proposal::STATUS_SUBMITTED_KAMPUS;
        } else {
            $status = Proposal::STATUS_SUBMITTED;
        }

        DB::transaction(function () use ($request, $proposal, $validated, $status, $isDraft) {
            $updateData = [];
            if (isset($validated['judul_penelitian'])) {
                $updateData['judul_penelitian'] = $validated['judul_penelitian'];
            }
            if (isset($validated['abstrak'])) {
                $updateData['abstrak'] = $validated['abstrak'];
            }
            if (isset($validated['id_skema_pendanaan'])) {
                $updateData['id_skema_pendanaan'] = $validated['id_skema_pendanaan'];
            }
            if (isset($validated['biaya_yang_diusulkan'])) {
                $updateData['biaya_yang_diusulkan'] = $validated['biaya_yang_diusulkan'];
            }
            if ($request->filled('latar_belakang')) {
                $updateData['latar_belakang'] = $request->input('latar_belakang');
            }
            $updateData['status_proposal'] = $status;
            if (! $isDraft && ! $proposal->tanggal_pengajuan) {
                $updateData['tanggal_pengajuan'] = now()->toDateString();
            }

            $proposal->update($updateData);

            if ($request->hasFile('file_dokumen_proposal')) {
                $file = $request->file('file_dokumen_proposal');
                $fileName = $file->getClientOriginalName();
                $storedName = time().'_'.Str::slug(pathinfo($fileName, PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
                $filePath = $file->storeAs('proposal_documents', $storedName, 'public');

                $oldDoc = $proposal->documents()->where('tipe_dokumen', 'Proposal_Utama')->first();
                if ($oldDoc && $oldDoc->file_path) {
                    Storage::disk('public')->delete($oldDoc->file_path);
                }

                ProposalDocument::updateOrCreate(
                    ['id_proposal' => $proposal->id, 'tipe_dokumen' => 'Proposal_Utama'],
                    [
                        'nama_file' => $fileName,
                        'file_path' => $filePath,
                        'file_size' => $file->getSize(),
                    ]
                );

                $proposal->file_dokumen_proposal = $filePath;
            }

            if (! empty($validated['members']) && is_array($validated['members'])) {
                $proposal->members()->delete();
                foreach ($validated['members'] as $member) {
                    ProposalMember::create([
                        'id_proposal' => $proposal->id,
                        'user_id' => $member['user_id'],
                        'peran' => $member['peran'] ?? 'Anggota Peneliti',
                        'alokasi_jam_per_minggu' => $member['alokasi_jam_per_minggu'] ?? 10,
                    ]);
                }
            }
        });

        $message = ($proposal->status_proposal === Proposal::STATUS_DRAFT)
            ? '[SUKSES] Usulan penelitian berhasil disimpan sebagai draf.'
            : '[SUKSES] Usulan penelitian berhasil diajukan.';

        return redirect()->route('proposals.index')
            ->with('success', $message);
    }

    /**
     * Submit an existing draft proposal to campus LPPM.
     */
    public function submitKampus(Request $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('update', $proposal);

        $proposal->update([
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        return redirect()->route('proposals.index')
            ->with('success', '[SUKSES] Usulan penelitian berhasil diajukan ke Admin Kampus.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Proposal $proposal): RedirectResponse
    {
        $this->authorize('delete', $proposal);

        foreach ($proposal->documents as $doc) {
            if ($doc->file_path) {
                Storage::disk('public')->delete($doc->file_path);
            }
        }
        if ($proposal->file_dokumen_proposal) {
            Storage::disk('public')->delete($proposal->file_dokumen_proposal);
        }

        $proposal->delete();

        return redirect()->route('proposals.index')
            ->with('success', '[SUKSES] Usulan penelitian berhasil dihapus.');
    }

    /**
     * Download the specified proposal document.
     */
    public function downloadDocument($id)
    {
        $proposal = Proposal::find($id);
        $filePath = null;

        if (! $proposal) {
            $document = ProposalDocument::findOrFail($id);
            $proposal = $document->proposal;
            $filePath = $document->file_path;
        } else {
            $filePath = $proposal->file_dokumen_proposal;
        }

        $this->authorize('view', $proposal);

        if (! $filePath || ! Storage::disk('public')->exists($filePath)) {
            abort(404, 'Dokumen proposal tidak ditemukan.');
        }

        return Storage::disk('public')->download($filePath);
    }
}
