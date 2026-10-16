<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model Termin Pendanaan
 *
 * Menangani rincian tahapan termin pencairan dana hibah penelitian beserta bukti transfer perbankan.
 * Merujuk pada Skema 21 Tabel Bersih (Klaster 4: Modul 3).
 */
class Funding extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'Pending';

    public const STATUS_DISBURSED = 'Disbursed';

    public const STATUS_VERIFIED = 'Verified';

    // Legacy status aliases for backward compatibility
    public const STATUS_PLANNED = 'Pending';

    public const STATUS_REQUESTED = 'Pending';

    public const STATUS_APPROVED = 'Pending';

    public const STATUS_CANCELLED = 'Pending';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id_contract',
        'termin_ke',
        'persentase_dana',
        'nominal_dana',
        'tanggal_pencairan',
        'bukti_transfer_path',
        'status_pencairan',
        'catatan_keuangan',
        // Virtual / legacy aliases
        'contract_id',
        'termin_number',
        'funding_number',
        'description',
        'amount',
        'percentage',
        'status',
        'funding_date',
        'due_date',
        'paid_at',
        'payment_method',
        'reference_number',
        'proof_document_path',
        'notes',
        'created_by',
        'approved_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'termin_ke' => 'integer',
        'persentase_dana' => 'integer',
        'nominal_dana' => 'decimal:2',
        'tanggal_pencairan' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'contract_id',
        'amount',
        'percentage',
        'status',
        'funding_number',
        'termin_number',
        'bukti_transfer_path',
        'status_label',
        'cair_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (Funding $funding) {
            if (! $funding->termin_ke) {
                $funding->termin_ke = 1;
            }
            if (! $funding->persentase_dana) {
                $funding->persentase_dana = $funding->termin_ke === 1 ? 70 : 30;
            }
            if (! $funding->nominal_dana && $funding->id_contract) {
                $contract = $funding->contract ?? Contract::find($funding->id_contract);
                if ($contract && $contract->dana_disetujui) {
                    $funding->nominal_dana = ($contract->dana_disetujui * $funding->persentase_dana) / 100;
                } else {
                    $funding->nominal_dana = 0;
                }
            }
            if (! $funding->status_pencairan) {
                $funding->status_pencairan = self::STATUS_PENDING;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke kontrak penelitian induk (N:1).
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'id_contract');
    }

    /**
     * User pembuat (legacy support).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User penyetuju (legacy support).
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status_pencairan', self::STATUS_PENDING);
    }

    public function scopeDisbursed(Builder $query): Builder
    {
        return $query->where('status_pencairan', self::STATUS_DISBURSED);
    }

    public function scopeTermin(Builder $query, int $termin): Builder
    {
        return $query->where('termin_ke', $termin);
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        $map = [
            'pending' => self::STATUS_PENDING,
            'planned' => self::STATUS_PENDING,
            'requested' => self::STATUS_PENDING,
            'approved' => self::STATUS_PENDING,
            'disbursed' => self::STATUS_DISBURSED,
            'verified' => self::STATUS_VERIFIED,
            'cancelled' => self::STATUS_PENDING,
            'belum_cair' => self::STATUS_PENDING,
            'proses_transfer' => self::STATUS_PENDING,
            'sudah_cair' => self::STATUS_DISBURSED,
        ];

        $val = is_string($status) ? ($map[strtolower($status)] ?? $status) : $status;

        return $query->where('status_pencairan', $val);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors, Mutators & Helpers
    |--------------------------------------------------------------------------
    */

    public function getIdContractAttribute(): ?int
    {
        return isset($this->attributes['id_contract']) ? (int) $this->attributes['id_contract'] : null;
    }

    public function setIdContractAttribute($value): void
    {
        $this->attributes['id_contract'] = $value;
    }

    public function getContractIdAttribute(): ?int
    {
        return $this->getIdContractAttribute();
    }

    public function setContractIdAttribute($value): void
    {
        $this->attributes['id_contract'] = $value;
    }

    public function getTerminKeAttribute(): ?int
    {
        return isset($this->attributes['termin_ke']) ? (int) $this->attributes['termin_ke'] : null;
    }

    public function setTerminKeAttribute($value): void
    {
        $this->attributes['termin_ke'] = $value;
    }

    public function getTerminNumberAttribute(): int
    {
        return $this->termin_ke ?? 1;
    }

    public function setTerminNumberAttribute($value): void
    {
        $this->attributes['termin_ke'] = (int) $value;
    }

    public function getFundingNumberAttribute(): string
    {
        $num = $this->termin_ke ?? 1;

        return 'TRM-'.str_pad((string) $num, 3, '0', STR_PAD_LEFT);
    }

    public function setFundingNumberAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['termin_ke'] = (int) $value;
        } elseif (is_string($value) && preg_match('/\d+/', $value, $matches)) {
            $this->attributes['termin_ke'] = (int) $matches[0];
        }
    }

    public function getPersentaseDanaAttribute(): ?int
    {
        return isset($this->attributes['persentase_dana']) ? (int) $this->attributes['persentase_dana'] : null;
    }

    public function setPersentaseDanaAttribute($value): void
    {
        $this->attributes['persentase_dana'] = $value;
    }

    public function getPercentageAttribute(): ?int
    {
        return $this->getPersentaseDanaAttribute();
    }

    public function setPercentageAttribute($value): void
    {
        $this->attributes['persentase_dana'] = $value;
    }

    public function getNominalDanaAttribute(): ?string
    {
        return isset($this->attributes['nominal_dana']) ? (string) $this->attributes['nominal_dana'] : null;
    }

    public function setNominalDanaAttribute($value): void
    {
        $this->attributes['nominal_dana'] = $value;
    }

    public function getAmountAttribute(): ?string
    {
        return $this->getNominalDanaAttribute();
    }

    public function setAmountAttribute($value): void
    {
        $this->attributes['nominal_dana'] = $value;
    }

    public function getFundingDateAttribute(): ?string
    {
        return $this->tanggal_pencairan?->toDateString();
    }

    public function setFundingDateAttribute($value): void
    {
        $this->attributes['tanggal_pencairan'] = $value;
    }

    public function getPaidAtAttribute(): ?string
    {
        return $this->tanggal_pencairan?->toDateString();
    }

    public function setPaidAtAttribute($value): void
    {
        $this->attributes['tanggal_pencairan'] = $value;
    }

    public function getCairAtAttribute(): ?string
    {
        return $this->tanggal_pencairan?->toDateString();
    }

    public function getBuktiTransferPathAttribute(): ?string
    {
        return $this->attributes['bukti_transfer_path'] ?? null;
    }

    public function setBuktiTransferPathAttribute($value): void
    {
        $this->attributes['bukti_transfer_path'] = $value;
    }

    public function getProofDocumentPathAttribute(): ?string
    {
        return $this->getBuktiTransferPathAttribute();
    }

    public function setProofDocumentPathAttribute($value): void
    {
        $this->attributes['bukti_transfer_path'] = $value;
    }

    public function getStatusPencairanAttribute(): ?string
    {
        return $this->attributes['status_pencairan'] ?? self::STATUS_PENDING;
    }

    public function setStatusPencairanAttribute($value): void
    {
        $map = [
            'pending' => self::STATUS_PENDING,
            'planned' => self::STATUS_PENDING,
            'requested' => self::STATUS_PENDING,
            'approved' => self::STATUS_PENDING,
            'disbursed' => self::STATUS_DISBURSED,
            'verified' => self::STATUS_VERIFIED,
            'cancelled' => self::STATUS_PENDING,
            'belum_cair' => self::STATUS_PENDING,
            'proses_transfer' => self::STATUS_PENDING,
            'sudah_cair' => self::STATUS_DISBURSED,
        ];
        $val = is_string($value) ? ($map[strtolower($value)] ?? $value) : $value;
        $this->attributes['status_pencairan'] = $val;
    }

    public function getStatusAttribute(): ?string
    {
        return $this->getStatusPencairanAttribute();
    }

    public function setStatusAttribute($value): void
    {
        $this->setStatusPencairanAttribute($value);
    }

    public function getCatatanKeuanganAttribute(): ?string
    {
        return $this->attributes['catatan_keuangan'] ?? null;
    }

    public function setCatatanKeuanganAttribute($value): void
    {
        $this->attributes['catatan_keuangan'] = $value;
    }

    public function getNotesAttribute(): ?string
    {
        return $this->getCatatanKeuanganAttribute();
    }

    public function setNotesAttribute($value): void
    {
        $this->attributes['catatan_keuangan'] = $value;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::getStatusOptions()[$this->status_pencairan] ?? (string) $this->status_pencairan;
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status_pencairan) {
            self::STATUS_DISBURSED => 'green',
            self::STATUS_VERIFIED => 'blue',
            default => 'yellow',
        };
    }

    // Virtual mutators for legacy columns to prevent SQL errors
    public function setDescriptionAttribute($value): void {}

    public function setDueDateAttribute($value): void {}

    public function setPaymentMethodAttribute($value): void {}

    public function setReferenceNumberAttribute($value): void {}

    public function setCreatedByAttribute($value): void {}

    public function setApprovedByAttribute($value): void {}

    /**
     * @return array<string, string>
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Menunggu Pencairan',
            self::STATUS_DISBURSED => 'Telah Dicairkan',
            self::STATUS_VERIFIED => 'Terverifikasi Penerimaan',
        ];
    }
}
