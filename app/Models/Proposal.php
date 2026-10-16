<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

/**
 * Proposal Model
 *
 * Merepresentasikan proposal penelitian yang diajukan oleh Dosen / Peneliti.
 * Sesuai dengan spesifikasi 21 Tabel Bersih Bab 6.2 PRD.
 */
class Proposal extends Model
{
    use BelongsToTenant, HasFactory;

    protected static function booted(): void
    {
        static::creating(function ($proposal) {
            if (! $proposal->university_id) {
                if (auth()->check() && auth()->user()->university_id) {
                    $proposal->university_id = auth()->user()->university_id;
                } else {
                    $proposal->university_id = ($proposal->id_pengusul ? User::find($proposal->id_pengusul)?->university_id : null)
                        ?? ($proposal->id_skema_pendanaan ? ResearchSchema::find($proposal->id_skema_pendanaan)?->university_id : null)
                        ?? ($proposal->research_schema_id ? ResearchSchema::find($proposal->research_schema_id)?->university_id : null)
                        ?? University::value('id')
                        ?? University::create([
                            'code' => 'UMT-DEFAULT',
                            'name' => 'Universitas Muhammadiyah Default',
                        ])->id;
                }
            }
        });
    }

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
        'status',
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
        'proposal_doc_path',
        'proposal_doc_url',
        'rejection_reason',
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

    public function getRejectionReasonAttribute(): ?string
    {
        return $this->attributes['catatan_administrasi'] ?? null;
    }

    public function setRejectionReasonAttribute($value): void
    {
        $this->attributes['catatan_administrasi'] = $value;
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

    public function setStatusProposalAttribute($value): void
    {
        $map = [
            'draft' => self::STATUS_DRAFT,
            'submitted' => self::STATUS_SUBMITTED,
            'administrasi_valid' => self::STATUS_ADMINISTRASI_VALID,
            'ditolak' => self::STATUS_DITOLAK,
            'lolos_didanai' => self::STATUS_LOLOS_DIDANAI,
        ];
        $normalized = is_string($value) ? ($map[strtolower($value)] ?? $value) : $value;
        $this->attributes['status_proposal'] = $normalized;
    }

    public function setStatusAttribute($value): void
    {
        $this->setStatusProposalAttribute($value);
    }


    protected ?string $virtualFileDokumenProposal = null;

    public function getFileDokumenProposalAttribute(): ?string
    {
        return $this->virtualFileDokumenProposal
            ?? ($this->attributes['file_dokumen_proposal'] ?? null)
            ?? $this->documents()->where('tipe_dokumen', 'Proposal_Utama')->value('file_path')
            ?? $this->documents()->value('file_path');
    }

    public function setFileDokumenProposalAttribute($value): void
    {
        $this->virtualFileDokumenProposal = $value;
    }

    public function getProposalDocPathAttribute(): ?string
    {
        return $this->file_dokumen_proposal;
    }

    public function setProposalDocPathAttribute($value): void
    {
        $this->virtualFileDokumenProposal = $value;
    }

    public function getProposalDocUrlAttribute(): ?string
    {
        $path = $this->proposal_doc_path ?? $this->file_dokumen_proposal;
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        return Storage::disk('public')->url($path);
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
