<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentCriteria extends Model
{
    use HasFactory;

    protected $table = 'assessment_criteria';

    public const TAHAP_ADMINISTRASI = 'Administrasi';

    public const TAHAP_SUBSTANSI = 'Substansi';

    public const TIPE_YA_TIDAK = 'Ya_Tidak';

    public const TIPE_PILIHAN_GANDA = 'Pilihan_Ganda';

    protected $fillable = [
        'nama_kriteria',
        'bobot',
        'deskripsi',
        'urutan',
        'tahap_seleksi',
        'tipe_jawaban',
        'pilihan_skor',
        'is_active',
        // legacy aliases
        'criterion',
        'score',
        'notes',
        'review_id',
    ];

    protected $casts = [
        'bobot' => 'integer',
        'urutan' => 'integer',
        'pilihan_skor' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Virtual attributes appended to array/JSON representation.
     *
     * @var list<string>
     */
    protected $appends = [
        'criterion',
        'code',
        'question',
        'weight',
    ];

    public function scopeAdministrasi($query)
    {
        return $query->where('tahap_seleksi', self::TAHAP_ADMINISTRASI);
    }

    public function scopeSubstansi($query)
    {
        return $query->where('tahap_seleksi', self::TAHAP_SUBSTANSI);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getCriterionAttribute(): ?string
    {
        return $this->attributes['nama_kriteria'] ?? null;
    }

    public function setCriterionAttribute($value): void
    {
        $this->attributes['nama_kriteria'] = $value;
    }

    public function getQuestionAttribute(): ?string
    {
        return $this->attributes['nama_kriteria'] ?? null;
    }

    public function getCodeAttribute(): ?string
    {
        $order = $this->attributes['urutan'] ?? $this->id ?? 1;

        return 'K'.$order;
    }

    public function getWeightAttribute(): int
    {
        return (int) ($this->attributes['bobot'] ?? 25);
    }

    public function review()
    {
        return $this->belongsTo(Review::class, 'review_id');
    }
}
