<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UniversityController extends Controller
{
    /**
     * Display a listing of universities.
     */
    public function index(Request $request): Response
    {
        // Check authirization
        $this->authorize('viewAny', University::class);

        // Base quewry
        $query = University::query();

        // Super admin can see all universities
        if ($request->user()->isSuperAdmin()) {
            // Apply search filter
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Apply active filter
            if ($request->has('is_active') && $request->is_active) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Apply accreditation filter
            if ($request->has('accreditation_status') && $request->accreditation_status) {
                $query->byAccreditation($request->accreditation_status);
            }

            // Apply cluster filter
            if ($request->has('cluster') && $request->cluster) {
                $query->byCluster($request->cluster);
            }

            // Get universities with counts
            $universities = $query
                ->withCount(['users', 'proposals', 'researchSchemas'])
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($university) => [
                    'id' => $university->id,
                    'code' => $university->code,
                    'ptm_code' => $university->ptm_code,
                    'name' => $university->name,
                    'short_name' => $university->short_name,
                    'city' => $university->city,
                    'province' => $university->province,
                    'phone' => $university->phone,
                    'email' => $university->email,
                    'website' => $university->website,
                    'logo_url' => $university->logo_url,
                    'accreditation_status' => $university->accreditation_status,
                    'cluster' => $university->cluster,
                    'profile_description' => $university->profile_description,
                    'is_active' => $university->is_active,
                    'users_count' => $university->users_count,
                    'proposals_count' => $university->proposals_count ?? 0,
                    'research_schemas_count' => $university->research_schemas_count ?? 0,
                    'full_address' => $university->full_address,
                    'created_at' => $university->created_at->format('Y-m-d'),
                ]);
        } else {
            // Admin Kampus & User can only see their own university
            $universities = $query
                ->where('id', $request->user()->university_id)
                ->withCount(['users', 'proposals', 'researchSchemas'])
                ->paginate(10)
                ->through(fn ($university) => [
                    'id' => $university->id,
                    'code' => $university->code,
                    'name' => $university->name,
                    'short_name' => $university->short_name,
                    'city' => $university->city,
                    'province' => $university->province,
                    'users_count' => $university->users_count,
                    'proposals_count' => $university->proposals_count ?? 0,
                    'research_schemas_count' => $university->research_schemas_count ?? 0,
                ]);
        }

        return Inertia::render('Admin/Universities/Index', [
            'universities' => $universities,
            'filters' => $request->only(['search', 'is_active', 'accreditation_status', 'cluster']),
            'stats' => [
                'total_universities' => University::count(),
                'active_tenants' => University::where('is_active', true)->count(),
                'total_proposals' => Proposal::count(),
                'total_researchers' => User::whereHas('role', fn ($q) => $q->where('name', Role::PENELITI))->orWhereHas('roles', fn ($q) => $q->where('name', Role::PENELITI))->count(),
            ],
            'can' => [
                'create' => $request->user()->can('create', University::class),
            ],
        ]);
    }

    /**
     * Show the form for creating a new university.
     */
    public function create(Request $request): Response
    {
        // Check authorization
        $this->authorize('create', University::class);

        return Inertia::render('Admin/Universities/Create');
    }

    /**
     * Store a newly created university in storage.
     */
    public function store(Request $request)
    {
        // Check authorization
        $this->authorize('create', University::class);

        // Validate request
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:universities,code',
            'ptm_code' => 'nullable|string|max:10|unique:universities,ptm_code',
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'logo_url' => 'nullable|url|max:500',
            'accreditation_status' => 'nullable|string|max:50',
            'cluster' => 'nullable|string|max:50',
            'profile_description' => 'nullable|string|max:250',
            'is_active' => 'boolean',
        ]);

        // Create university
        $university = University::create($validated);

        // Redirect to universities index with success message
        return redirect()->route('admin.universities.index')
            ->with('success', 'University created successfully.');
    }

    /**
     * Display the specified university.
     */
    public function show(Request $request, University $university): Response
    {
        // Check authorization
        $this->authorize('view', $university);

        // Load relationships
        $university->load(['users.role', 'adminKampus.role', 'researchSchemas', 'proposals']);

        return Inertia::render('Admin/Universities/Show', [
            'university' => [
                'id' => $university->id,
                'code' => $university->code,
                'ptm_code' => $university->ptm_code,
                'name' => $university->name,
                'short_name' => $university->short_name,
                'address' => $university->address,
                'city' => $university->city,
                'province' => $university->province,
                'postal_code' => $university->postal_code,
                'phone' => $university->phone,
                'email' => $university->email,
                'website' => $university->website,
                'logo_url' => $university->logo_url,
                'accreditation_status' => $university->accreditation_status,
                'cluster' => $university->cluster,
                'profile_description' => $university->profile_description,
                'is_active' => $university->is_active,
                'full_address' => $university->full_address,
                'created_at' => $university->created_at->format('Y-m-d H:i'),
                'updated_at' => $university->updated_at->format('Y-m-d H:i'),
                'users_count' => $university->users()->count(),
                'admin_kampus_count' => $university->adminKampus()->count(),
                'research_schemas_count' => $university->researchSchemas()->count(),
                'proposals_count' => $university->proposals()->count(),
            ],
            'users' => $university->users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->display_name ?? 'User',
            ]),
            'admin_kampus' => $university->adminKampus->map(fn ($admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role?->display_name ?? 'Admin Kampus',
            ]),
            'research_schemas' => $university->researchSchemas->map(fn ($schema) => [
                'id' => $schema->id,
                'nama_skema' => $schema->nama_skema,
                'anggaran_maksimal' => $schema->biaya_maksimal,
                'biaya_maksimal' => $schema->biaya_maksimal,
                'is_active' => $schema->is_active,
            ]),
            'can' => [
                'update' => $request->user()->can('update', $university),
                'delete' => $request->user()->can('delete', $university),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified university.
     */
    public function edit(Request $request, University $university): Response
    {
        // Check authorization
        $this->authorize('update', $university);

        return Inertia::render('Admin/Universities/Edit', [
            'university' => [
                'id' => $university->id,
                'code' => $university->code,
                'ptm_code' => $university->ptm_code,
                'name' => $university->name,
                'short_name' => $university->short_name,
                'address' => $university->address,
                'city' => $university->city,
                'province' => $university->province,
                'postal_code' => $university->postal_code,
                'phone' => $university->phone,
                'email' => $university->email,
                'website' => $university->website,
                'logo_url' => $university->logo_url,
                'accreditation_status' => $university->accreditation_status,
                'cluster' => $university->cluster,
                'profile_description' => $university->profile_description,
                'is_active' => $university->is_active,
            ],
        ]);
    }

    /**
     * Update the specified university in storage.
     */
    public function update(Request $request, University $university)
    {
        // Check authorization
        $this->authorize('update', $university);

        // Validate request
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:universities,code,'.$university->id,
            'ptm_code' => 'nullable|string|max:10|unique:universities,ptm_code,'.$university->id,
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'logo_url' => 'nullable|url|max:500',
            'accreditation_status' => 'nullable|string|max:50',
            'cluster' => 'nullable|string|max:50',
            'profile_description' => 'nullable|string|max:250',
            'is_active' => 'boolean',
        ]);

        // Update university
        $university->update($validated);

        // Redirect with success message
        return redirect()->route('admin.universities.index')
            ->with('success', 'University updated successfully.');
    }

    /**
     * Remove the specified university from storage.
     */
    public function destroy(Request $request, University $university)
    {
        // Check authorization
        $this->authorize('delete', $university);

        // Check if university has proposals
        if ($university->proposals()->count() > 0) {
            return back()->with('error', 'Cannot delete university with existing proposals.');
        }

        // Soft delete university
        $university->delete();

        // Redirect with success message
        return redirect()->route('admin.universities.index')
            ->with('success', 'University deleted successfully.');
    }

    /**
     * Toggle active status of the university.
     */
    public function toggleActive(Request $request, University $university)
    {
        // Check authorization
        $this->authorize('update', $university);

        // Toggle active status
        $university->update([
            'is_active' => ! $university->is_active,
        ]);

        $status = $university->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "University {$status} successfully.");
    }
}
