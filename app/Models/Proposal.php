<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Proposal Model
 *
 * Merepresentasikan proposal penelitian yang diajukan oleh Dosen / Peneliti.
 * Sesuai dengan spesifikasi 21 Tabel Bersih Bab 6.2 PRD.
 */
class Proposal extends Model
{
    use BelongsToTenant, HasFactory;

    // ─── Status Constants ────────────────────────────────────────────────────

    public const STATUS_DRAFT = 'Draft';

    public const STATUS_SUBMITTED = 'Submitted';

    public const STATUS_ADMINISTRASI_VALID = 'Administrasi_Valid';

    public const STATUS_DITOLAK = 'Ditolak';

    public const STATUS_LOLOS_DIDANAI = 'Lolos_Didanai';

    // ─── Fillable ────────────────────────────────────────────────────────────

    protected $fillable = [
        'university_id',
        'id_pengusul',
        'id_skema_pendanaan',
        'judul_penelitian',
        'abstrak',
        'latar_belakang',
        'biaya_yang_diusulkan',
        'status_proposal',
        'catatan_administrasi',
        'tanggal_pengajuan',
        // Virtual / legacy aliases
        'title',
        'description',
        'judul',
        'deskripsi',
        'user_id',
        'research_schema_id',
        'rejection_reason',
        'abstract',
        'background',
        'file_dokumen_proposal',
        'proposal_doc_path',
    ];

    /**
     * Virtual attributes appended to array/JSON representation.
     */
    protected $appends = [
        'title',
        'description',
        'judul',
        'deskripsi',
        'status',
        'user_id',
        'research_schema_id',
    ];

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    public function getTitleAttribute(): ?string
    {
        return $this->attributes['judul_penelitian'] ?? null;
    }

    public function setTitleAttribute($value): void
    {
        $this->attributes['judul_penelitian'] = $value;
    }

    public function getJudulAttribute(): ?string
    {
        return $this->attributes['judul_penelitian'] ?? null;
    }

    public function setJudulAttribute($value): void
    {
        $this->attributes['judul_penelitian'] = $value;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['abstrak'] ?? null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['abstrak'] = $value;
    }

    public function getDeskripsiAttribute(): ?string
    {
        return $this->attributes['abstrak'] ?? null;
    }

    public function setDeskripsiAttribute($value): void
    {
        $this->attributes['abstrak'] = $value;
    }

    public function getAbstractAttribute(): ?string
    {
        return $this->attributes['abstrak'] ?? null;
    }

    public function setAbstractAttribute($value): void
    {
        $this->attributes['abstrak'] = $value;
    }

    public function getBackgroundAttribute(): ?string
    {
        return $this->attributes['latar_belakang'] ?? null;
    }

    public function setBackgroundAttribute($value): void
    {
        $this->attributes['latar_belakang'] = $value;
    }

    public function getUserIdAttribute(): ?int
    {
        return $this->attributes['id_pengusul'] ?? null;
    }

    public function setUserIdAttribute($value): void
    {
        $this->attributes['id_pengusul'] = $value;
    }

    public function getResearchSchemaIdAttribute(): ?int
    {
        return $this->attributes['id_skema_pendanaan'] ?? null;
    }

    public function setResearchSchemaIdAttribute($value): void
    {
        $this->attributes['id_skema_pendanaan'] = $value;
    }

    public function getStatusAttribute(): string
    {
        return $this->status_proposal ?? self::STATUS_DRAFT;
    }

    public function setStatusAttribute($value): void
    {
        $this->attributes['status_proposal'] = $value;
    }

    public function getProposalDocPathAttribute(): ?string
    {
        return $this->file_dokumen_proposal;
    }

    public function setProposalDocPathAttribute($value): void
    {
        $this->attributes['file_dokumen_proposal'] = $value;
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    /**
     * Relasi ke User (Dosen pengusul).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pengusul');
    }

    public function pengusul(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pengusul');
    }

    /**
     * Relasi ke ResearchSchema (skema penelitian).
     */
    public function researchSchema(): BelongsTo
    {
        return $this->belongsTo(ResearchSchema::class, 'id_skema_pendanaan');
    }

    public function skemaPendanaan(): BelongsTo
    {
        return $this->belongsTo(ResearchSchema::class, 'id_skema_pendanaan');
    }

    /**
     * Relasi ke ProposalDocument.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(ProposalDocument::class, 'id_proposal');
    }

    /**
     * Relasi ke ProposalMember (anggota tim peneliti).
     */
    public function members(): HasMany
    {
        return $this->hasMany(ProposalMember::class, 'id_proposal');
    }

    /**
     * Relasi ke Review (penunjukan/penilaian reviewer).
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'id_proposal');
    }

    /**
     * Relasi ke Kontrak Penelitian.
     */
    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class, 'id_proposal');
    }

    /**
     * Relasi ke Laporan Kemajuan (Monev).
     */
    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class, 'id_proposal');
    }

    /**
     * Relasi ke Luaran Penelitian.
     */
    public function researchOutputs(): HasMany
    {
        return $this->hasMany(ResearchOutput::class, 'id_proposal');
    }

    /**
     * Relasi ke Evaluasi Akhir Penelitian.
     */
    public function evaluation(): HasOne
    {
        return $this->hasOne(Evaluation::class, 'id_proposal');
    }
}
