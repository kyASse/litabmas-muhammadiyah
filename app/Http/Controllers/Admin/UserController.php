<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of Users.
     */
    public function index(Request $request): Response
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();
        $isAdminKampus = $currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin();

        // Base query for all system users
        $query = User::query()
            ->with(['role', 'roles', 'university']);

        // Multi-tenancy isolation for Admin Kampus
        if ($isAdminKampus) {
            $query->where('university_id', $currentUser->university_id);
        } elseif ($request->filled('university_id')) {
            $query->where('university_id', $request->university_id);
        }

        // Filter by Role if requested
        if ($request->filled('role')) {
            $roleName = $request->role;
            $query->where(function ($q) use ($roleName) {
                $q->whereHas('role', fn ($r) => $r->where('name', $roleName))
                    ->orWhereHas('roles', fn ($r) => $r->where('name', $roleName));
            });
        }

        // Apply filters if any
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by Active Status
        if ($request->has('is_active') && $request->is_active !== null && $request->is_active !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by Reviewer Status
        if ($request->has('is_reviewer') && $request->is_reviewer !== null && $request->is_reviewer !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('is_reviewer', $request->boolean('is_reviewer'))
                    ->orWhereHas('roles', function ($query) {
                        $query->where('name', Role::REVIEWER);
                    });
            });
        }

        // Get Users with counts
        $users = $query
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                // Get all roles for this user
                $userRoles = $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                ])->toArray();

                // Add primary role if not already in roles array
                if ($user->role && ! collect($userRoles)->contains('id', $user->role->id)) {
                    $userRoles[] = [
                        'id' => $user->role->id,
                        'name' => $user->role->name,
                        'display_name' => $user->role->display_name,
                    ];
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar_url' => $user->avatar_url,
                    'is_active' => $user->is_active,
                    'is_reviewer' => $user->is_reviewer ?? false,
                    'roles' => $userRoles,
                    'university' => $user->university ? [
                        'id' => $user->university->id,
                        'name' => $user->university->name,
                        'short_name' => $user->university->short_name,
                        'code' => $user->university->code,
                    ] : null,
                    'last_login_at' => $user->last_login_at?->format('Y-m-d H:i:s'),
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Get all universities for filter dropdown (with cache)
        $universities = $isAdminKampus
            ? University::where('id', $currentUser->university_id)->get(['id', 'name', 'code'])
            : Cache::remember('universities.active.list', 3600, function () {
                return University::where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']);
            });

        $statsQuery = User::query();
        if ($isAdminKampus) {
            $statsQuery->where('university_id', $currentUser->university_id);
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'universities' => $universities,
            'stats' => [
                'total_users' => (clone $statsQuery)->count(),
                'active_users' => (clone $statsQuery)->where('is_active', true)->count(),
                'reviewers_count' => (clone $statsQuery)->where(function ($q) {
                    $q->where('is_reviewer', true)
                        ->orWhereHas('roles', fn ($q) => $q->where('name', Role::REVIEWER));
                })->count(),
                'researchers_count' => (clone $statsQuery)->where(function ($q) {
                    $q->whereHas('role', fn ($q) => $q->where('name', Role::PENELITI))
                        ->orWhereHas('roles', fn ($q) => $q->where('name', Role::PENELITI));
                })->count(),
            ],
            'filters' => $request->only(['search', 'university_id', 'is_active', 'is_reviewer', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new User.
     */
    public function create()
    {
        $this->authorize('manage-users');

        // Get all active universities (with cache)
        $universities = Cache::remember('universities.active.list', 3600, function () {
            return University::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        });

        // Get assignable roles (not Super Admin)
        $roles = Role::query()
            ->whereNotIn('name', [Role::SUPER_ADMIN])
            ->orderBy('display_name')
            ->get(['id', 'name', 'display_name', 'description']);

        $scientificFields = [];

        return Inertia::render('Admin/Users/Create', [
            'universities' => $universities,
            'roles' => $roles,
            'scientificFields' => $scientificFields,
        ]);
    }

    /**
     * Store a newly created User in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();

        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'university_id' => 'required|exists:universities,id',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'required|exists:roles,id',
            'is_active' => 'required|boolean',
        ]);

        // Multi-tenancy guard for Admin Kampus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ((int) $validated['university_id'] !== (int) $currentUser->university_id) {
                abort(403, 'Akses ditolak: Tidak dapat membuat pengguna di luar institusi Anda.');
            }
        }

        // Get the first role as primary role for backwards compatibility
        $primaryRoleId = $validated['role_ids'][0];

        // Create new User
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'position' => $validated['position'] ?? null,
            'university_id' => $validated['university_id'],
            'role_id' => $primaryRoleId, // Set primary role for backwards compatibility
            'is_active' => $validated['is_active'],
            'is_reviewer' => false, // Will be set by role assignment
        ]);

        // Attach all selected roles to the user
        $user->roles()->attach($validated['role_ids'], [
            'assigned_at' => now(),
            'assigned_by' => auth()->id(),
        ]);

        // Update is_reviewer flag if Reviewer role is selected
        $reviewerRole = Role::where('name', Role::REVIEWER)->first();
        if ($reviewerRole && in_array($reviewerRole->id, $validated['role_ids'])) {
            $user->update(['is_reviewer' => true]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully with assigned roles.');
    }

    /**
     * Display the specified User.
     */
    public function show(Request $request, User $user): Response
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ($user->university_id !== $currentUser->university_id) {
                abort(403, 'Akses ditolak: Pengguna bukan dari institusi Anda.');
            }
        }

        // Load relationships
        $user->load(['role', 'roles', 'university', 'proposals', 'reviews']);

        // Get all roles for this user
        $userRoles = $user->roles->map(fn ($role) => [
            'id' => $role->id,
            'name' => $role->name,
            'display_name' => $role->display_name,
        ])->toArray();

        // Add primary role if not already in roles array
        if ($user->role && ! collect($userRoles)->contains('id', $user->role->id)) {
            $userRoles[] = [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'display_name' => $user->role->display_name,
            ];
        }

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'position' => $user->position,
                'avatar_url' => $user->avatar_url,
                'is_active' => $user->is_active,
                'is_reviewer' => $user->is_reviewer ?? false,
                'roles' => $userRoles,
                'scientific_field' => null,
                'university' => $user->university ? [
                    'id' => $user->university->id,
                    'name' => $user->university->name,
                    'short_name' => $user->university->short_name,
                    'code' => $user->university->code,
                    'city' => $user->university->city,
                    'province' => $user->university->province,
                ] : null,
                'last_login_at' => $user->last_login_at?->format('Y-m-d H:i'),
                'created_at' => $user->created_at->format('Y-m-d H:i'),
                'updated_at' => $user->updated_at->format('Y-m-d H:i'),
                'proposals_count' => $user->proposals()->count(),
                'reviews_count' => $user->reviews()->count(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified User.
     */
    public function edit(Request $request, User $user): Response
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();

        // Prevent unauthorized editing of Super Admin
        if ($user->isSuperAdmin() && ! $currentUser->isSuperAdmin()) {
            abort(403, 'Unauthorized to edit Super Administrator.');
        }

        // Multi-tenancy IDOR guard for Admin Kampus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ($user->university_id !== $currentUser->university_id) {
                abort(403, 'Akses ditolak: Pengguna bukan dari institusi Anda.');
            }
        }

        $user->load(['university', 'roles']);

        // Get all active universities
        $universities = University::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        // Get assignable roles (not Super Admin)
        $roles = Role::query()
            ->whereNotIn('name', [Role::SUPER_ADMIN])
            ->orderBy('display_name')
            ->get(['id', 'name', 'display_name', 'description']);

        $scientificFields = [];

        // Get user's current role IDs
        $userRoleIds = $user->roles->pluck('id')->toArray();

        // If no roles in pivot table but has primary role, add it
        if (empty($userRoleIds) && $user->role_id) {
            $userRoleIds = [$user->role_id];
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'position' => $user->position,
                'university_id' => $user->university_id,
                'scientific_field_id' => null,
                'is_active' => $user->is_active,
                'is_reviewer' => $user->is_reviewer ?? false,
                'role_ids' => $userRoleIds,
            ],
            'universities' => $universities,
            'roles' => $roles,
            'scientificFields' => $scientificFields,
        ]);
    }

    /**
     * Update the specified User in storage.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();

        // Prevent unauthorized editing of Super Admin
        if ($user->isSuperAdmin() && ! $currentUser->isSuperAdmin()) {
            abort(403, 'Unauthorized to edit Super Administrator.');
        }

        // Multi-tenancy IDOR guard for Admin Kampus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ($user->university_id !== $currentUser->university_id) {
                abort(403, 'Akses ditolak: Pengguna bukan dari institusi Anda.');
            }
        }

        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'university_id' => 'required|exists:universities,id',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        // Prevent Admin Kampus from changing user university to another campus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ((int) $validated['university_id'] !== (int) $currentUser->university_id) {
                abort(403, 'Akses ditolak: Tidak dapat memindahkan institusi pengguna.');
            }
        }

        // Get the first role as primary role for backwards compatibility
        $primaryRoleId = $validated['role_ids'][0];

        // Update User
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'position' => $validated['position'] ?? null,
            'university_id' => $validated['university_id'],
            'role_id' => $primaryRoleId, // Update primary role
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        // Sync roles in pivot table
        $user->roles()->sync(collect($validated['role_ids'])->mapWithKeys(function ($roleId) {
            return [$roleId => [
                'assigned_at' => now(),
                'assigned_by' => auth()->id(),
            ]];
        }));

        // Update is_reviewer flag based on role assignment
        $reviewerRole = Role::where('name', Role::REVIEWER)->first();
        $hasReviewerRole = $reviewerRole && in_array($reviewerRole->id, $validated['role_ids']);
        $user->update(['is_reviewer' => $hasReviewerRole]);

        // Update password if provided
        if (! empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully with new role assignments.');
    }

    /**
     * Remove the specified User from storage.
     */
    public function destroy(Request $request, User $user)
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();

        // Prevent deleting Super Admin
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot delete Super Administrator.');
        }

        // Multi-tenancy IDOR guard for Admin Kampus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ($user->university_id !== $currentUser->university_id) {
                abort(403, 'Akses ditolak: Pengguna bukan dari institusi Anda.');
            }
        }

        // Load role relationship
        $user->load('role');

        // Check if User has proposals
        if ($user->proposals()->count() > 0) {
            return back()->with('error', 'Cannot delete user with existing proposals.');
        }

        // Soft delete User
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Toggle active status of the User.
     */
    public function toggleActive(Request $request, User $user)
    {
        $this->authorize('manage-users');

        $currentUser = $request->user();

        // Prevent deactivating Super Admin
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot deactivate Super Administrator.');
        }

        // Multi-tenancy IDOR guard for Admin Kampus
        if ($currentUser && $currentUser->isAdminKampus() && ! $currentUser->isSuperAdmin()) {
            if ($user->university_id !== $currentUser->university_id) {
                abort(403, 'Akses ditolak: Pengguna bukan dari institusi Anda.');
            }
        }

        // Load role relationship
        $user->load('role');

        // Toggle active status
        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$status} successfully.");
    }
}
