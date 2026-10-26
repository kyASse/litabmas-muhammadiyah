<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::updating(function ($user) {
            if ($user->isDirty('role_id')) {
                $oldRoleId = $user->getOriginal('role_id');
                if ($oldRoleId) {
                    $user->roles()->detach($oldRoleId);
                }
            }
        });

        static::saved(function ($user) {
            // Sync primary role_id to role_user
            if ($user->role_id) {
                $user->roles()->syncWithoutDetaching([$user->role_id => [
                    'assigned_at' => now(),
                    'assigned_by' => Auth::id(),
                ]]);
            }

            // Sync is_reviewer flag to Reviewer role
            $reviewerRole = Role::where('name', Role::REVIEWER)->first();
            if ($reviewerRole) {
                if ($user->is_reviewer) {
                    $user->roles()->syncWithoutDetaching([$reviewerRole->id => [
                        'assigned_at' => now(),
                        'assigned_by' => Auth::id(),
                    ]]);
                } else {
                    $user->roles()->detach($reviewerRole->id);
                }
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'phone',
        'role_id',
        'university_id',
        'nidn',
        'faculty',
        'study_program',
        'is_active',
        'is_reviewer',
        'last_login_at',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
        'microsoft_id',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'is_reviewer' => 'boolean',
            'password' => 'hashed',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the role of this user (backwards compatibility - returns primary role)
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get all roles of this user (many-to-many relationship)
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user')
            ->withPivot('assigned_at', 'assigned_by');
    }

    /**
     * Get the university of this user
     */
    public function university()
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Get the user who approved/rejected this user's registration
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get all proposals submitted by this user
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'id_pengusul');
    }

    /**
     * Get all reviews conducted by this user
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'id_reviewer');
    }

    /**
     * Get all evaluations conducted by this user
     */
    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'id_evaluator');
    }

    /**
     * Get all progress reports submitted by this user
     */
    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class);
    }

    /**
     * Get all monev schedules evaluated by this user
     */
    public function evaluatorSchedules(): HasMany
    {
        return $this->hasMany(MonevSchedule::class, 'evaluator_id');
    }

    /**
     * Get all monev schedules assigned to this user as evaluator.
     */
    public function monevSchedules(): HasMany
    {
        return $this->hasMany(MonevSchedule::class, 'evaluator_id');
    }

    /**
     * Get all activity logs for this user.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope to get only active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by role
     */
    public function scopeByRole($query, string $roleName)
    {
        return $query->whereHas('role', function ($q) use ($roleName) {
            $q->where('name', $roleName);
        });
    }

    /**
     * Scope to filter by university
     *
     * Accepts nullable int to prevent TypeError when user has no university assigned.
     * Returns unscoped query when universityId is null (safe fallback).
     */
    public function scopeForUniversity($query, ?int $universityId)
    {
        if (is_null($universityId)) {
            return $query;
        }

        return $query->where('university_id', $universityId);
    }

    /**
     * Scope to get Super Admins
     */
    public function scopeSuperAdmins($query)
    {
        return $query->byRole(Role::SUPER_ADMIN);
    }

    /**
     * Scope to get Admin Kampus
     */
    public function scopeAdminKampus($query)
    {
        return $query->byRole(Role::ADMIN_KAMPUS);
    }

    /**
     * Scope to get Peneliti (Dosen)
     */
    public function scopePeneliti($query)
    {
        return $query->byRole(Role::PENELITI);
    }

    /**
     * Scope to search users
     */
    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('position', 'like', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Check if user is Super Admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole(Role::SUPER_ADMIN);
    }

    /**
     * Check if user is Admin Kampus
     */
    public function isAdminKampus(): bool
    {
        return $this->hasRole(Role::ADMIN_KAMPUS);
    }

    /**
     * Check if user is Admin Keuangan
     */
    public function isAdminKeuangan(): bool
    {
        return $this->hasRole(Role::ADMIN_KEUANGAN);
    }

    /**
     * Check if user is Peneliti
     */
    public function isPeneliti(): bool
    {
        return $this->hasRole(Role::PENELITI);
    }

    /**
     * Check if user is Reviewer
     */
    public function isReviewer(): bool
    {
        // Check is_reviewer flag (backwards compatibility)
        if ($this->is_reviewer) {
            return true;
        }

        // Check in roles relationship (multi-role)
        return $this->hasRole(Role::REVIEWER);
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleName): bool
    {
        // 1. Check in primary role (legacy compatibility)
        if ($this->role && $this->role->name === $roleName) {
            return true;
        }

        // 2. Fallback check by role_id direct query if relation not loaded or stale
        if ($this->role_id && (! $this->relationLoaded('role') || is_null($this->role))) {
            $primaryRoleName = Role::where('id', $this->role_id)->value('name');
            if ($primaryRoleName === $roleName) {
                return true;
            }
        }

        // 3. Check in roles relationship (multi-role pivot)
        if ($this->relationLoaded('roles')) {
            if ($this->roles->contains('name', $roleName)) {
                return true;
            }
        }

        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check if user has any of the specified roles
     */
    public function hasAnyRole(array $roleNames): bool
    {
        // 1. Check in primary role (legacy compatibility)
        if ($this->role && in_array($this->role->name, $roleNames)) {
            return true;
        }

        // 2. Fallback check by role_id direct query if relation not loaded or stale
        if ($this->role_id && (! $this->relationLoaded('role') || is_null($this->role))) {
            $primaryRoleName = Role::where('id', $this->role_id)->value('name');
            if ($primaryRoleName && in_array($primaryRoleName, $roleNames)) {
                return true;
            }
        }

        // 3. Check in roles relationship (multi-role pivot)
        if ($this->relationLoaded('roles')) {
            if ($this->roles->contains(fn ($role) => in_array($role->name, $roleNames))) {
                return true;
            }
        }

        return $this->roles()->whereIn('name', $roleNames)->exists();
    }

    /**
     * Check if user has all of the specified roles
     */
    public function hasAllRoles(array $roleNames): bool
    {
        $userRoles = $this->getRoleNames();

        foreach ($roleNames as $roleName) {
            if (! in_array($roleName, $userRoles, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get all role names for this user
     */
    public function getRoleNames(): array
    {
        if ($this->relationLoaded('roles')) {
            $roleNames = $this->roles->pluck('name')->toArray();
        } else {
            $roleNames = $this->roles()->pluck('name')->toArray();
        }

        // Add primary role if exists and not already in array
        $primaryRole = null;
        if ($this->role) {
            $primaryRole = $this->role->name;
        } elseif ($this->role_id) {
            $primaryRole = Role::where('id', $this->role_id)->value('name');
        }

        if ($primaryRole && ! in_array($primaryRole, $roleNames, true)) {
            $roleNames[] = $primaryRole;
        }

        return array_values(array_unique($roleNames));
    }

    /**
     * Check if user can manage data for a specific university
     */
    public function canManageUniversity(int $universityId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ($this->isAdminKampus()) {
            return $this->university_id === $universityId;
        }

        return false;
    }

    /**
     * Get initials for avatar
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1).substr($words[1], 0, 1));
        }

        return strtoupper(substr($this->name, 0, 2));
    }
}
