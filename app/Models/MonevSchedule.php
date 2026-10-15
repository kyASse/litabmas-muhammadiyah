<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonevSchedule extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'university_id',
        'nama_tahap',
        'tanggal_mulai',
        'tanggal_selesai',
        'deskripsi',
        'is_active',
        // Legacy / compatibility aliases
        'contract_id',
        'evaluator_id',
        'date',
        'time',
        'location',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_active' => 'boolean',
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the contract associated with the schedule.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    /**
     * Get the evaluator associated with the schedule.
     */
    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    /**
     * Scope to filter schedules by evaluator.
     */
    public function scopeForEvaluator($query, int $evaluatorId)
    {
        return $query->where('evaluator_id', $evaluatorId);
    }

    /**
     * Check if status is scheduled.
     */
    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    /**
     * Check if status is done.
     */
    public function isDone(): bool
    {
        return $this->status === 'done';
    }

    /**
     * Check if status is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Get human-readable status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'scheduled' => 'Terjadwal',
            'done' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            default => (string) $this->status,
        };
    }

    /**
     * Relasi ke rekaman laporan kemajuan (ProgressReport).
     */
    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class, 'id_monev_schedule');
    }
}
