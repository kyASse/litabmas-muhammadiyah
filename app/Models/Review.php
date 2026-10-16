<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'reviews';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // Canonical columns (21 Clean Tables)
        'id_proposal',
        'id_reviewer',
        'tanggal_mulai_review',
        'tanggal_selesai_review',
        'komponen_penilaian',
        'skor_total',
        'catatan_evaluasi',
        'keputusan_rekomendasi',
        'status_review',

        // Legacy / virtual aliases
        'proposal_id',
        'reviewer_id',
        'score',
        'total_score',
        'feedback',
        'notes',
        'comments',
        'recommendation',
        'status',
        'start_date',
        'end_date',
        'reviewed_at',
    ];

    /**
     * Virtual attributes appended to array/JSON representation.
     *
     * @var list<string>
     */
    protected $appends = [
        'proposal_id',
        'reviewer_id',
        'score',
        'total_score',
        'feedback',
        'notes',
        'comments',
        'recommendation',
        'status',
        'start_date',
        'end_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_mulai_review' => 'date',
        'tanggal_selesai_review' => 'date',
        'komponen_penilaian' => 'array',
        'skor_total' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the proposal being reviewed.
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    /**
     * Get the reviewer who wrote this review.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_reviewer');
    }

    /**
     * Get criteria assessments for this review.
     */
    public function assessmentCriteria(): HasMany
    {
        return $this->hasMany(AssessmentCriteria::class, 'review_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope to filter by reviewer.
     */
    public function scopeByReviewer($query, int $reviewerId)
    {
        return $query->where('id_reviewer', $reviewerId);
    }

    public function scopeForReviewer($query, int $reviewerId)
    {
        return $query->where('id_reviewer', $reviewerId);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators (Canonical <-> Legacy Mapping)
    |--------------------------------------------------------------------------
    */

    public function getProposalIdAttribute(): ?int
    {
        return $this->attributes['id_proposal'] ?? null;
    }

    public function setProposalIdAttribute($value): void
    {
        $this->attributes['id_proposal'] = $value;
    }

    public function getReviewerIdAttribute(): ?int
    {
        return $this->attributes['id_reviewer'] ?? null;
    }

    public function setReviewerIdAttribute($value): void
    {
        $this->attributes['id_reviewer'] = $value;
    }

    public function getScoreAttribute(): mixed
    {
        return $this->attributes['skor_total'] ?? 0;
    }

    public function setScoreAttribute($value): void
    {
        $this->attributes['skor_total'] = $value;
    }

    public function getTotalScoreAttribute(): mixed
    {
        return $this->attributes['skor_total'] ?? 0;
    }

    public function setTotalScoreAttribute($value): void
    {
        $this->attributes['skor_total'] = $value;
    }

    public function getFeedbackAttribute(): ?string
    {
        return $this->attributes['catatan_evaluasi'] ?? null;
    }

    public function setFeedbackAttribute($value): void
    {
        $this->attributes['catatan_evaluasi'] = $value;
    }

    public function getNotesAttribute(): ?string
    {
        return $this->attributes['catatan_evaluasi'] ?? null;
    }

    public function setNotesAttribute($value): void
    {
        $this->attributes['catatan_evaluasi'] = $value;
    }

    public function getCommentsAttribute(): ?string
    {
        return $this->attributes['catatan_evaluasi'] ?? null;
    }

    public function setCommentsAttribute($value): void
    {
        $this->attributes['catatan_evaluasi'] = $value;
    }

    public function getRecommendationAttribute(): ?string
    {
        return $this->attributes['keputusan_rekomendasi'] ?? null;
    }

    public function setRecommendationAttribute($value): void
    {
        $map = [
            'accepted' => 'Diterima',
            'revision' => 'Revisi',
            'rejected' => 'Ditolak',
            'diterima' => 'Diterima',
            'revisi' => 'Revisi',
            'ditolak' => 'Ditolak',
        ];
        $lower = strtolower((string) $value);
        $this->attributes['keputusan_rekomendasi'] = $map[$lower] ?? $value;
    }

    public function setKeputusanRekomendasiAttribute($value): void
    {
        $map = [
            'accepted' => 'Diterima',
            'revision' => 'Revisi',
            'rejected' => 'Ditolak',
            'diterima' => 'Diterima',
            'revisi' => 'Revisi',
            'ditolak' => 'Ditolak',
        ];
        $lower = strtolower((string) $value);
        $this->attributes['keputusan_rekomendasi'] = $map[$lower] ?? $value;
    }

    public function getStatusAttribute(): string
    {
        return $this->attributes['status_review'] ?? 'Assigned';
    }

    public function setStatusAttribute($value): void
    {
        $map = [
            'pending' => 'Assigned',
            'assigned' => 'Assigned',
            'in_progress' => 'In_Progress',
            'completed' => 'Completed',
        ];
        $lower = strtolower((string) $value);
        $this->attributes['status_review'] = $map[$lower] ?? $value;
    }

    public function setStatusReviewAttribute($value): void
    {
        $map = [
            'pending' => 'Assigned',
            'assigned' => 'Assigned',
            'in_progress' => 'In_Progress',
            'completed' => 'Completed',
        ];
        $lower = strtolower((string) $value);
        $this->attributes['status_review'] = $map[$lower] ?? $value;
    }

    public function getStartDateAttribute(): ?string
    {
        return $this->attributes['tanggal_mulai_review'] ?? null;
    }

    public function setStartDateAttribute($value): void
    {
        $this->attributes['tanggal_mulai_review'] = $value;
    }

    public function getEndDateAttribute(): ?string
    {
        return $this->attributes['tanggal_selesai_review'] ?? null;
    }

    public function setEndDateAttribute($value): void
    {
        $this->attributes['tanggal_selesai_review'] = $value;
    }

    public function getReviewedAtAttribute(): ?Carbon
    {
        return $this->updated_at;
    }

    public function setReviewedAtAttribute($value): void
    {
        // Virtual alias - non-persisted directly to DB column
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods & Model Events
    |--------------------------------------------------------------------------
    */

    /**
     * Check if review has feedback.
     */
    public function hasFeedback(): bool
    {
        return ! empty($this->catatan_evaluasi);
    }

    /**
     * Check if review has recommendation.
     */
    public function hasRecommendation(): bool
    {
        return ! empty($this->keputusan_rekomendasi);
    }

    /**
     * Boot method to handle model events.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->tanggal_mulai_review)) {
                $model->tanggal_mulai_review = now()->toDateString();
            }
            if (empty($model->tanggal_selesai_review)) {
                $model->tanggal_selesai_review = now()->addDays(14)->toDateString();
            }
            if (empty($model->status_review)) {
                $model->status_review = 'Assigned';
            }
            if (! isset($model->attributes['skor_total'])) {
                $model->skor_total = 0;
            }
        });
    }
}
