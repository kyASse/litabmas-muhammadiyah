<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'university_id',
        'activity',
        'ip_address',
        'user_agent',
        // Virtual / legacy aliases
        'submission_id',
        'action',
        'description',
    ];

    /**
     * Virtual attributes appended to array/JSON representation.
     */
    protected $appends = [
        'id_submission',
        'id_user',
        'user_name',
        'action_type',
        'activity_description',
    ];

    /**
     * Relasi ke User yang melakukan aktivitas
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke Submission (jika ada)
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    public function setActionAttribute($value): void
    {
        if (empty($this->attributes['activity'])) {
            $this->attributes['activity'] = (string) $value;
        }
    }

    public function setDescriptionAttribute($value): void
    {
        if (isset($this->attributes['activity']) && $this->attributes['activity'] !== '') {
            $this->attributes['activity'] .= ' - ' . $value;
        } else {
            $this->attributes['activity'] = (string) $value;
        }
    }

    public function getIdSubmissionAttribute(): ?int
    {
        return $this->attributes['submission_id'] ?? null;
    }

    public function getIdUserAttribute(): ?int
    {
        return $this->user_id;
    }

    public function getUserNameAttribute(): string
    {
        return $this->user?->name ?? 'System';
    }

    public function getActionTypeAttribute(): string
    {
        return $this->attributes['action'] ?? ($this->activity ? explode(' - ', $this->activity)[0] : 'ACTIVITY');
    }

    public function getActivityDescriptionAttribute(): ?string
    {
        return $this->attributes['description'] ?? $this->activity;
    }
}
