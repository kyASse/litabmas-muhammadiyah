<?php

namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;
use App\Models\University;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    /**
     * Boot trait untuk mendaftarkan global scope dan event model.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Daftarkan TenantScope secara otomatis
        static::addGlobalScope(new TenantScope);

        // Otomatisasi pengisian university_id saat pembuatan entitas baru
        static::creating(function ($model) {
            if (Auth::check() && ! $model->university_id && ! Auth::user()->isSuperAdmin()) {
                $model->university_id = Auth::user()->university_id;
            }
        });
    }

    /**
     * Relasi ke entitas induk universitas penyewa (tenant).
     */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class, 'university_id');
    }
}
