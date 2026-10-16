<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model Kontrak Penelitian
 *
 * Menangani dokumen kontrak perjanjian kerja penelitian berpenomoran unik institusional.
 * Merujuk pada Skema 21 Tabel Bersih (Klaster 4: Modul 3).
 */
class Contract extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'Draft';

    public const STATUS_SIGNED = 'Signed';

    public const STATUS_ACTIVE = 'Active';

    public const STATUS_CLOSED = 'Closed';

    // Legacy status aliases for backward compatibility
    public const STATUS_COMPLETED = 'Closed';

    public const STATUS_CANCELLED = 'Closed';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'university_id',
        'id_proposal',
        'nomor_kontrak',
        'judul_kontrak',
        'dana_disetujui',
        'tanggal_kontrak',
        'file_dokumen_kontrak',
        'status_kontrak',
        // Virtual / legacy aliases
        'proposal_id',
        'contract_number',
        'title',
        'description',
        'status',
        'contract_value',
        'total_pendanaan_disetujui',
        'party_1',
        'party_2',
        'start_date',
        'end_date',
        'signed_at',
        'document_path',
        'notes',
        'terms',
        'pembinaan_id',
        'pembinaan_registration_id',
        'journal_id',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'dana_disetujui' => 'decimal:2',
        'contract_value' => 'decimal:2',
        'tanggal_kontrak' => 'date',
        'start_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'title',
        'contract_number',
        'status',
        'contract_value',
        'status_label',
    ];

    protected static function booted(): void
    {
        static::creating(function (Contract $contract) {
            if (! $contract->status_kontrak) {
                $contract->status_kontrak = self::STATUS_DRAFT;
            }
            if (! $contract->tanggal_kontrak) {
                $contract->tanggal_kontrak = now()->toDateString();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke proposal penelitian induk (1:1).
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    /**
     * Relasi ke tahapan termin pendanaan (1:N).
     */
    public function fundings(): HasMany
    {
        return $this->hasMany(Funding::class, 'id_contract');
    }

    /**
     * Relasi ke lampiran dokumen kontrak (legacy support).
     */
    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class);
    }

    /**
     * Relasi ke pembinaan (legacy support).
     */
    public function pembinaan(): BelongsTo
    {
        return $this->belongsTo(Pembinaan::class);
    }

    /**
     * User pembuat kontrak (legacy support).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User pengubah kontrak (legacy support).
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            $q->where('nomor_kontrak', 'like', "%{$search}%")
                ->orWhere('judul_kontrak', 'like', "%{$search}%")
                ->orWhereHas('university', function (Builder $universityQuery) use ($search) {
                    $universityQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
        });
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        $map = [
            'draft' => self::STATUS_DRAFT,
            'signed' => self::STATUS_SIGNED,
            'active' => self::STATUS_ACTIVE,
            'closed' => self::STATUS_CLOSED,
            'completed' => self::STATUS_CLOSED,
            'cancelled' => self::STATUS_CLOSED,
        ];

        $val = is_string($status) ? ($map[strtolower($status)] ?? $status) : $status;

        return $query->where('status_kontrak', $val);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors, Mutators & Helpers
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return self::getStatusOptions()[$this->status_kontrak] ?? (string) $this->status_kontrak;
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status_kontrak) {
            self::STATUS_ACTIVE => 'green',
            self::STATUS_SIGNED => 'blue',
            self::STATUS_CLOSED => 'gray',
            default => 'yellow',
        };
    }

    public function getNomorKontrakAttribute(): ?string
    {
        return $this->attributes['nomor_kontrak'] ?? null;
    }

    public function setNomorKontrakAttribute($value): void
    {
        $this->attributes['nomor_kontrak'] = $value;
    }

    public function getContractNumberAttribute(): ?string
    {
        return $this->attributes['nomor_kontrak'] ?? null;
    }

    public function setContractNumberAttribute($value): void
    {
        $this->attributes['nomor_kontrak'] = $value;
    }

    public function getJudulKontrakAttribute(): ?string
    {
        return $this->attributes['judul_kontrak'] ?? null;
    }

    public function setJudulKontrakAttribute($value): void
    {
        $this->attributes['judul_kontrak'] = $value;
    }

    public function getTitleAttribute(): ?string
    {
        return $this->attributes['judul_kontrak'] ?? null;
    }

    public function setTitleAttribute($value): void
    {
        $this->attributes['judul_kontrak'] = $value;
    }

    public function getIdProposalAttribute(): ?int
    {
        return isset($this->attributes['id_proposal']) ? (int) $this->attributes['id_proposal'] : null;
    }

    public function setIdProposalAttribute($value): void
    {
        $this->attributes['id_proposal'] = $value;
    }

    public function getProposalIdAttribute(): ?int
    {
        return $this->getIdProposalAttribute();
    }

    public function setProposalIdAttribute($value): void
    {
        $this->attributes['id_proposal'] = $value;
    }

    public function getDanaDisetujuiAttribute(): ?string
    {
        return isset($this->attributes['dana_disetujui']) ? (string) $this->attributes['dana_disetujui'] : null;
    }

    public function setDanaDisetujuiAttribute($value): void
    {
        $this->attributes['dana_disetujui'] = $value;
    }

    public function getContractValueAttribute(): ?string
    {
        return $this->getDanaDisetujuiAttribute();
    }

    public function setContractValueAttribute($value): void
    {
        $this->attributes['dana_disetujui'] = $value;
    }

    public function getTotalPendanaanDisetujuiAttribute(): ?string
    {
        return $this->getDanaDisetujuiAttribute();
    }

    public function setTotalPendanaanDisetujuiAttribute($value): void
    {
        $this->attributes['dana_disetujui'] = $value;
    }

    public function getTanggalKontrakAttribute(): ?string
    {
        return $this->attributes['tanggal_kontrak'] ?? null;
    }

    public function setTanggalKontrakAttribute($value): void
    {
        $this->attributes['tanggal_kontrak'] = $value;
    }

    public function getStartDateAttribute(): ?string
    {
        return $this->attributes['tanggal_kontrak'] ?? null;
    }

    public function setStartDateAttribute($value): void
    {
        $this->attributes['tanggal_kontrak'] = $value;
    }

    public function getFileDokumenKontrakAttribute(): ?string
    {
        return $this->attributes['file_dokumen_kontrak'] ?? null;
    }

    public function setFileDokumenKontrakAttribute($value): void
    {
        $this->attributes['file_dokumen_kontrak'] = $value;
    }

    public function getDocumentPathAttribute(): ?string
    {
        return $this->attributes['file_dokumen_kontrak'] ?? null;
    }

    public function setDocumentPathAttribute($value): void
    {
        $this->attributes['file_dokumen_kontrak'] = $value;
    }

    public function getStatusKontrakAttribute(): ?string
    {
        return $this->attributes['status_kontrak'] ?? self::STATUS_DRAFT;
    }

    public function setStatusKontrakAttribute($value): void
    {
        $map = [
            'draft' => self::STATUS_DRAFT,
            'signed' => self::STATUS_SIGNED,
            'active' => self::STATUS_ACTIVE,
            'closed' => self::STATUS_CLOSED,
            'completed' => self::STATUS_CLOSED,
            'cancelled' => self::STATUS_CLOSED,
        ];
        $val = is_string($value) ? ($map[strtolower($value)] ?? $value) : $value;
        $this->attributes['status_kontrak'] = $val;
    }

    public function getStatusAttribute(): ?string
    {
        return $this->attributes['status_kontrak'] ?? self::STATUS_DRAFT;
    }

    public function setStatusAttribute($value): void
    {
        $this->setStatusKontrakAttribute($value);
    }

    // Virtual mutators for legacy columns to prevent SQL insert errors
    public function setParty1Attribute($value): void {}

    public function setParty2Attribute($value): void {}

    public function setEndDateAttribute($value): void {}

    public function setSignedAtAttribute($value): void {}

    public function setNotesAttribute($value): void {}

    public function setTermsAttribute($value): void {}

    public function setDescriptionAttribute($value): void {}

    public function setPembinaanIdAttribute($value): void {}

    public function setPembinaanRegistrationIdAttribute($value): void {}

    public function setJournalIdAttribute($value): void {}

    public function setCreatedByAttribute($value): void {}

    public function setUpdatedByAttribute($value): void {}

    public function getParty1Attribute(): ?string
    {
        return null;
    }

    public function getParty2Attribute(): ?string
    {
        return null;
    }

    public function getEndDateAttribute(): ?string
    {
        return null;
    }

    public function getNotesAttribute(): ?string
    {
        return null;
    }

    /**
     * @return array<string, string>
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_SIGNED => 'Tertanda Tangan',
            self::STATUS_ACTIVE => 'Aktif',
            self::STATUS_CLOSED => 'Selesai',
        ];
    }
}
