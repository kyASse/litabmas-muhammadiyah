<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class University extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'ptm_code',
        'name',
        'short_name',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'email',
        'website',
        'logo_url',
        'accreditation_status',
        'cluster',
        'profile_description',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get all users belonging to this university
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all research schemas belonging to this university
     */
    public function researchSchemas(): HasMany
    {
        return $this->hasMany(ResearchSchema::class);
    }

    /**
     * Get all proposals belonging to this university
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    /**
     * Get all contracts belonging to this university
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    /**
     * Get all monev schedules belonging to this university
     */
    public function monevSchedules(): HasMany
    {
        return $this->hasMany(MonevSchedule::class);
    }

    /**
     * Get all admin kampus for this university
     */
    public function adminKampus()
    {
        return $this->users()->whereHas('role', function ($query) {
            $query->where('name', 'Admin Kampus');
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope to get active universities
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to search universities by name or code
     */
    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('ptm_code', 'like', "%{$search}%")
                ->orWhere('short_name', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by accreditation status
     */
    public function scopeByAccreditation($query, ?string $status)
    {
        if (! $status) {
            return $query;
        }

        return $query->where('accreditation_status', $status);
    }

    /**
     * Scope to filter by cluster
     */
    public function scopeByCluster($query, ?string $cluster)
    {
        if (! $cluster) {
            return $query;
        }

        return $query->where('cluster', $cluster);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get full
     */
    public function getFullAddressAttribute(): string
    {
        return collect([
            $this->address,
            $this->city,
            $this->province,
            $this->postal_code,
        ])->filter()->implode(', ');
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Get total users count (Admin Kampus + Users)
     */
    public function getTotalUsersAttribute(): int
    {
        return $this->users()->count();
    }
}
