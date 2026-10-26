<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class AdminKampusController extends Controller
{
    /**
     * Display a listing of Admin Kampus.
     */
    public function index(Request $request): Response
    {
        // Only Super Admin can access
        $this->authorize('manage-admin-kampus');

        // Base query for Admin Kampus only
        $query = User::query()
            ->with(['role', 'university'])
            ->whereHas('role', function ($query) {
                $query->where('name', 'Admin Kampus');
            });

        // Apply filters if any
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Filter by University
        if ($request->has('university_id') && $request->university_id) {
            $query->where('university_id', $request->university_id);
        }

        // Filter by Active Status
        if ($request->has('is_active') && $request->is_active !== null) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Get Admin Kampus with counts
        $adminKampus = $query
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'avatar_url' => $admin->avatar_url,
                'is_active' => $admin->is_active,
                'university' => $admin->university ? [
                    'id' => $admin->university->id,
                    'name' => $admin->university->name,
                    'short_name' => $admin->university->short_name,
                    'code' => $admin->university->code,
                ] : null,
                'last_login_at' => $admin->last_login_at?->format('Y-m-d H:i:s'),
                'created_at' => $admin->created_at->format('Y-m-d H:i:s'),
            ]);

        // Get all universities for filter dropdown (with cache)
        $universities = Cache::remember('universities.active.list', 3600, function () {
            return University::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        });

        $totalAdmins = User::whereHas('role', fn ($q) => $q->where('name', 'Admin Kampus'))
            ->orWhereHas('roles', fn ($q) => $q->where('name', 'Admin Kampus'))
            ->count();

        $activeAdmins = User::where('is_active', true)
            ->where(fn ($q) => $q->whereHas('role', fn ($r) => $r->where('name', 'Admin Kampus'))
                ->orWhereHas('roles', fn ($r) => $r->where('name', 'Admin Kampus')))
            ->count();

        $inactiveAdmins = max(0, $totalAdmins - $activeAdmins);

        $universitiesServed = University::whereHas('users', fn ($q) => $q->whereHas('role', fn ($r) => $r->where('name', 'Admin Kampus'))
            ->orWhereHas('roles', fn ($r) => $r->where('name', 'Admin Kampus'))
        )->count();

        return Inertia::render('Admin/AdminKampus/Index', [
            'adminKampus' => $adminKampus,
            'universities' => $universities,
            'stats' => [
                'total_admins' => $totalAdmins,
                'active_admins' => $activeAdmins,
                'inactive_admins' => $inactiveAdmins,
                'universities_served' => $universitiesServed,
            ],
            'filters' => $request->only(['search', 'university_id', 'is_active']),
        ]);
    }

    /**
     * Show the form for creating a new Admin Kampus.
     */
    public function create(Request $request): Response
    {
        $this->authorize('manage-admin-kampus');

        // Get all active universities
        $universities = University::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/AdminKampus/Create', [
            'universities' => $universities,
        ]);
    }

    /**
     * Store a newly created Admin Kampus in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('manage-admin-kampus');

        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'university_id' => 'required|exists:universities,id',
            'is_active' => 'required|boolean',
        ]);

        // Get Admin Kampus role
        $adminKampusRole = Role::where('name', 'Admin Kampus')->firstOrFail();

        // Create new Admin Kampus user
        $adminKampus = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'university_id' => $validated['university_id'],
            'role_id' => $adminKampusRole->id,
            'is_active' => $validated['is_active'],
        ]);

        $adminKampus->roles()->syncWithoutDetaching([$adminKampusRole->id]);

        return redirect()->route('admin.admin-kampus.index')
            ->with('success', 'Admin Kampus created successfully.');
    }

    /**
     * Display the specified Admin Kampus.
     */
    public function show(Request $request, User $adminKampu): Response
    {
        $this->authorize('manage-admin-kampus');

        // Verify it's an Admin Kampus
        if (! $adminKampu->isAdminKampus()) {
            abort(404, 'Admin Kampus not found.');
        }

        // Load relationships
        $adminKampu->load(['role', 'university']);

        // Operational metrics
        $managedProposalsCount = Proposal::where('university_id', $adminKampu->university_id)->count();
        $managedReviewersCount = User::where('university_id', $adminKampu->university_id)
            ->where(fn ($q) => $q->where('is_reviewer', true)->orWhereHas('roles', fn ($r) => $r->where('name', Role::REVIEWER)))
            ->count();
        $managedUsersCount = User::where('university_id', $adminKampu->university_id)->count();

        return Inertia::render('Admin/AdminKampus/Show', [
            'adminKampus' => [
                'id' => $adminKampu->id,
                'name' => $adminKampu->name,
                'email' => $adminKampu->email,
                'phone' => $adminKampu->phone,
                'position' => $adminKampu->position,
                'avatar_url' => $adminKampu->avatar_url,
                'is_active' => $adminKampu->is_active,
                'university' => $adminKampu->university ? [
                    'id' => $adminKampu->university->id,
                    'name' => $adminKampu->university->name,
                    'short_name' => $adminKampu->university->short_name,
                    'code' => $adminKampu->university->code,
                    'city' => $adminKampu->university->city,
                    'province' => $adminKampu->university->province,
                ] : null,
                'last_login_at' => $adminKampu->last_login_at?->format('Y-m-d H:i'),
                'created_at' => $adminKampu->created_at->format('Y-m-d H:i'),
                'updated_at' => $adminKampu->updated_at->format('Y-m-d H:i'),
                'managed_proposals_count' => $managedProposalsCount,
                'managed_reviewers_count' => $managedReviewersCount,
                'managed_users_count' => $managedUsersCount,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified Admin Kampus.
     */
    public function edit(Request $request, User $adminKampu): Response
    {
        $this->authorize('manage-admin-kampus');

        // Verify it's an Admin Kampus
        if (! $adminKampu->isAdminKampus()) {
            abort(404, 'Admin Kampus not found.');
        }

        $adminKampu->load('university');

        // Get all active universities
        $universities = University::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/AdminKampus/Edit', [
            'adminKampus' => [
                'id' => $adminKampu->id,
                'name' => $adminKampu->name,
                'email' => $adminKampu->email,
                'phone' => $adminKampu->phone,
                'position' => $adminKampu->position,
                'university_id' => $adminKampu->university_id,
                'is_active' => $adminKampu->is_active,
            ],
            'universities' => $universities,
        ]);
    }

    /**
     * Update the specified Admin Kampus in storage.
     */
    public function update(Request $request, User $adminKampu)
    {
        $this->authorize('manage-admin-kampus');

        // Verify it's an Admin Kampus
        if (! $adminKampu->isAdminKampus()) {
            abort(404, 'Admin Kampus not found.');
        }

        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$adminKampu->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'university_id' => 'required|exists:universities,id',
            'is_active' => 'boolean',
        ]);

        // Update Admin Kampus
        $adminKampu->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'position' => $validated['position'] ?? null,
            'university_id' => $validated['university_id'],
            'is_active' => $validated['is_active'] ?? $adminKampu->is_active,
        ]);

        // Update password if provided
        if (! empty($validated['password'])) {
            $adminKampu->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return redirect()->route('admin.admin-kampus.index')
            ->with('success', 'Admin Kampus updated successfully.');
    }

    /**
     * Remove the specified Admin Kampus from storage.
     */
    public function destroy(Request $request, User $adminKampu)
    {
        $this->authorize('manage-admin-kampus');

        // Load role relationship
        $adminKampu->load('role');

        // Verify it's an Admin Kampus
        if (! $adminKampu->isAdminKampus()) {
            abort(404, 'Admin Kampus not found.');
        }

        // Check if Admin Kampus has managed users
        $managedUsersCount = User::where('university_id', $adminKampu->university_id)
            ->where('id', '!=', $adminKampu->id)
            ->count();

        if ($managedUsersCount > 0) {
            return back()->with('error', 'Cannot delete Admin Kampus with existing managed users. Please reassign or delete users first.');
        }

        // Soft delete Admin Kampus
        $adminKampu->delete();

        return redirect()->route('admin.admin-kampus.index')
            ->with('success', 'Admin Kampus deleted successfully.');
    }

    /**
     * Toggle active status of the Admin Kampus.
     */
    public function toggleActive(Request $request, User $admin_kampus)
    {
        $this->authorize('manage-admin-kampus');

        // Load role relationship
        $admin_kampus->load('role');

        // Verify it's an Admin Kampus
        if (! $admin_kampus->isAdminKampus()) {
            abort(404, 'Admin Kampus not found.');
        }

        // Toggle active status
        $admin_kampus->update([
            'is_active' => ! $admin_kampus->is_active,
        ]);

        $status = $admin_kampus->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Admin Kampus {$status} successfully.");
    }

    /**
     * Persetujuan internal proposal oleh Admin Kampus mitra.
     *
     * @route POST /admin/proposals/{proposal}/campus-approve
     */
    public function campusApprove(Request $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('campusApprove', $proposal);

        $proposal->update([
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'catatan_administrasi' => null,
        ]);

        if ($request->header('Referer')) {
            return redirect()->back()->with('success', '[SUKSES] Usulan penelitian berhasil disetujui kampus dan diteruskan ke antrean Bappeda.');
        }

        return redirect()->route('admin.proposals.index')
            ->with('success', '[SUKSES] Usulan penelitian berhasil disetujui kampus dan diteruskan ke antrean Bappeda.');
    }

    /**
     * Penolakan internal proposal oleh Admin Kampus dengan catatan perbaikan.
     *
     * @route POST /admin/proposals/{proposal}/campus-reject
     */
    public function campusReject(Request $request, Proposal $proposal): RedirectResponse
    {
        $this->authorize('campusReject', $proposal);

        $request->validate([
            'catatan_penolakan' => ['required_without_all:catatan,rejection_reason,catatan_administrasi', 'nullable', 'string', 'min:5', 'max:1000'],
            'catatan' => ['nullable', 'string', 'min:5', 'max:1000'],
            'rejection_reason' => ['nullable', 'string', 'min:5', 'max:1000'],
            'catatan_administrasi' => ['nullable', 'string', 'min:5', 'max:1000'],
        ]);

        $reason = $request->input('catatan_penolakan')
            ?? $request->input('catatan')
            ?? $request->input('rejection_reason')
            ?? $request->input('catatan_administrasi');

        $proposal->update([
            'status_proposal' => Proposal::STATUS_REJECTED_KAMPUS,
            'catatan_administrasi' => $reason,
        ]);

        if ($request->header('Referer')) {
            return redirect()->back()->with('success', '[SUKSES] Usulan penelitian ditolak dengan catatan perbaikan untuk peneliti.');
        }

        return redirect()->route('admin.proposals.index')
            ->with('success', '[SUKSES] Usulan penelitian ditolak dengan catatan perbaikan untuk peneliti.');
    }
}
