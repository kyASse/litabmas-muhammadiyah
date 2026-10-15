<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

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
        'party_1',
        'party_2',
        'start_date',
        'end_date',
        'signed_at',
        'document_path',
        'notes',
        'pembinaan_id',
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
        'end_date' => 'date',
        'signed_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'nomor_kontrak',
        'total_pendanaan_disetujui',
        'status_kontrak',
        'title',
        'status',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function pembinaan(): BelongsTo
    {
        return $this->belongsTo(Pembinaan::class);
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    public function fundings(): HasMany
    {
        return $this->hasMany(Funding::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class);
    }

    /**
     * Get all monev schedules for this contract.
     */
    public function monevSchedules(): HasMany
    {
        return $this->hasMany(MonevSchedule::class, 'contract_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

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
            $q->where('contract_number', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%")
                ->orWhereHas('university', function (Builder $universityQuery) use ($search) {
                    $universityQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('short_name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
        });
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Helpers
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return self::getStatusOptions()[$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'green',
            self::STATUS_COMPLETED => 'blue',
            self::STATUS_CANCELLED => 'red',
            default => 'gray',
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
        return $this->attributes['id_proposal'] ?? null;
    }

    public function setIdProposalAttribute($value): void
    {
        $this->attributes['id_proposal'] = $value;
    }

    public function getProposalIdAttribute(): ?int
    {
        return $this->attributes['id_proposal'] ?? null;
    }

    public function setProposalIdAttribute($value): void
    {
        $this->attributes['id_proposal'] = $value;
    }

    public function getDanaDisetujuiAttribute(): ?string
    {
        return $this->attributes['dana_disetujui'] ?? null;
    }

    public function setDanaDisetujuiAttribute($value): void
    {
        $this->attributes['dana_disetujui'] = $value;
    }

    public function getContractValueAttribute(): ?string
    {
        return $this->attributes['dana_disetujui'] ?? null;
    }

    public function setContractValueAttribute($value): void
    {
        $this->attributes['dana_disetujui'] = $value;
    }

    public function getTotalPendanaanDisetujuiAttribute(): ?string
    {
        return $this->attributes['dana_disetujui'] ?? null;
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
        $this->attributes['status_kontrak'] = $value;
    }

    public function getStatusAttribute(): ?string
    {
        return $this->attributes['status_kontrak'] ?? self::STATUS_DRAFT;
    }

    public function setStatusAttribute($value): void
    {
        $this->attributes['status_kontrak'] = $value;
    }

    /**
     * @return array<string, string>
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_ACTIVE => 'Aktif',
            self::STATUS_COMPLETED => 'Selesai',
            self::STATUS_CANCELLED => 'Dibatalkan',
        ];
    }
}
