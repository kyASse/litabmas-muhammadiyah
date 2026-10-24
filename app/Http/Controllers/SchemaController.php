<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchemaRequest;
use App\Http\Requests\UpdateSchemaRequest;
use App\Http\Resources\SchemaResource;
use App\Models\ResearchSchema;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SchemaController extends Controller
{
    /**
     * Display a listing of the Schema (Tabel Skema Penelitian).
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ResearchSchema::class);

        $query = ResearchSchema::withCount('proposals');

        // Filter pencarian berdasarkan nama skema atau deskripsi
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_skema', 'like', "%{$search}%")
                    ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan status aktif
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter berdasarkan tahun anggaran
        if ($request->filled('tahun_anggaran')) {
            $query->where('tahun_anggaran', $request->input('tahun_anggaran'));
        } elseif ($request->filled('year')) {
            $query->where('tahun_anggaran', $request->input('year'));
        }

        // Sorting (default: terbaru)
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['nama_skema', 'name', 'created_at', 'biaya_maksimal', 'max_funding', 'is_active', 'proposals_count', 'tahun_anggaran', 'year'];

        $dbSortColumn = $sortBy;
        if ($dbSortColumn === 'name') {
            $dbSortColumn = 'nama_skema';
        } elseif ($dbSortColumn === 'max_funding') {
            $dbSortColumn = 'biaya_maksimal';
        } elseif ($dbSortColumn === 'year') {
            $dbSortColumn = 'tahun_anggaran';
        }

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($dbSortColumn, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $schemas = $query->paginate($request->input('per_page', 10))->withQueryString();

        return Inertia::render('Admin/Schema/Index', [
            'schemas' => SchemaResource::collection($schemas),
            'filters' => [
                'search' => $request->search ?? '',
                'is_active' => $request->is_active ?? '',
                'tahun_anggaran' => $request->tahun_anggaran ?? $request->year ?? '',
                'year' => $request->year ?? $request->tahun_anggaran ?? '',
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    /**
     * Show the form for creating a new Schema.
     */
    public function create(): Response
    {
        $this->authorize('create', ResearchSchema::class);

        return Inertia::render('Admin/Schema/Create');
    }

    /**
     * Display the specified Schema.
     */
    public function show(Request $request, ResearchSchema $schema): Response
    {
        $this->authorize('view', $schema);

        $schema->loadCount('proposals');

        $proposalsQuery = $schema->proposals()->with(['user.university']);

        if ($request->filled('search')) {
            $search = $request->search;
            $proposalsQuery->where(function ($q) use ($search) {
                $q->where('judul_penelitian', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $proposalsQuery->where('status_proposal', $request->status);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['judul_penelitian', 'status_proposal', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $proposalsQuery->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $proposalsQuery->latest();
        }

        $proposals = $proposalsQuery->paginate($request->input('per_page', 10))->withQueryString();

        return Inertia::render('Admin/Schema/Show', [
            'schema' => (new SchemaResource($schema))->resolve(),
            'proposals' => $proposals,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified Schema.
     */
    public function edit(ResearchSchema $schema): Response
    {
        $this->authorize('update', $schema);

        return Inertia::render('Admin/Schema/Edit', [
            'schema' => (new SchemaResource($schema))->resolve(),
        ]);
    }

    /**
     * Store a newly created Schema.
     */
    public function store(StoreSchemaRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('file_panduan')) {
            $path = $request->file('file_panduan')->store('schema_guides', 'public');
            $validated['file_panduan'] = $path;
        }

        $user = $request->user();
        if (! isset($validated['university_id'])) {
            $validated['university_id'] = $user->university_id ?? University::value('id') ?? 1;
        }

        $schema = ResearchSchema::create($validated);
        $schemaName = $schema->nama_skema ?? $schema->name ?? 'Skema';

        return redirect()->route('admin.schema.index')
            ->with('success', "Skema Penelitian '{$schemaName}' berhasil ditambahkan.");
    }

    /**
     * Update the specified Schema.
     */
    public function update(UpdateSchemaRequest $request, ResearchSchema $schema)
    {
        $validated = $request->validated();

        if ($request->hasFile('file_panduan')) {
            if ($schema->file_panduan && Storage::disk('public')->exists($schema->file_panduan)) {
                Storage::disk('public')->delete($schema->file_panduan);
            }
            $path = $request->file('file_panduan')->store('schema_guides', 'public');
            $validated['file_panduan'] = $path;
        }

        $schema->update($validated);
        $schemaName = $schema->nama_skema ?? $schema->name ?? 'Skema';

        return redirect()->route('admin.schema.index')
            ->with('success', "Skema Penelitian '{$schemaName}' berhasil diperbarui.");
    }

    /**
     * Remove the specified Schema.
     */
    public function destroy(ResearchSchema $schema)
    {
        $this->authorize('delete', $schema);

        // Check if there are proposals using this schema
        if ($schema->proposals()->exists()) {
            abort(403, '[DITOLAK] Tidak dapat menghapus skema yang sedang digunakan oleh proposal.');
        }

        if ($schema->file_panduan && Storage::disk('public')->exists($schema->file_panduan)) {
            Storage::disk('public')->delete($schema->file_panduan);
        }

        $name = $schema->nama_skema ?? $schema->name;
        $schema->delete();

        return redirect()->route('admin.schema.index')
            ->with('success', "Skema Penelitian '{$name}' berhasil dihapus.");
    }
}
