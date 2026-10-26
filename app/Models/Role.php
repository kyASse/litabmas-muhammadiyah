<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    /**
     * Role name constants
     */
    public const SUPER_ADMIN = 'Super Admin';

    public const ADMIN_KAMPUS = 'Admin Kampus';

    public const ADMIN_KEUANGAN = 'Admin Keuangan';

    public const REVIEWER = 'Reviewer';

    public const PENELITI = 'Peneliti';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the users for the role.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'role_user')
            ->withPivot('assigned_at', 'assigned_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope to get specific role by name.
     */
    public function scopeByName($query, string $name)
    {
        return $query->where('name', $name);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * check if role is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->name === self::SUPER_ADMIN;
    }

    /**
     * check if role is admin kampus
     */
    public function isAdminKampus(): bool
    {
        return $this->name === self::ADMIN_KAMPUS;
    }

    /**
     * check if role is admin keuangan
     */
    public function isAdminKeuangan(): bool
    {
        return $this->name === self::ADMIN_KEUANGAN;
    }

    /**
     * check if role is reviewer
     */
    public function isReviewer(): bool
    {
        return $this->name === self::REVIEWER;
    }

    /**
     * check if role is peneliti
     */
    public function isPeneliti(): bool
    {
        return $this->name === self::PENELITI;
    }
}
