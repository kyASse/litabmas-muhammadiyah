<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentCriteria extends Model
{
    use HasFactory;

    protected $table = 'assessment_criteria';

    protected $fillable = [
        'nama_kriteria',
        'bobot',
        'deskripsi',
        'urutan',
        'criterion',
        'score',
        'notes',
        'review_id',
    ];

    public function getCriterionAttribute(): ?string
    {
        return $this->attributes['nama_kriteria'] ?? null;
    }

    public function setCriterionAttribute($value): void
    {
        $this->attributes['nama_kriteria'] = $value;
    }

    public function review()
    {
        return $this->belongsTo(Review::class, 'review_id');
    }
}
