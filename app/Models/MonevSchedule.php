<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Jadwal Monitoring dan Evaluasi (Monev)
 *
 * Menangani penetapan periode pelaksanaan monitoring dan evaluasi kemajuan riset oleh LPPM.
 * Merujuk pada Skema 21 Tabel Bersih (Klaster 5: Modul 4).
 */
class MonevSchedule extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'university_id',
        'nama_tahap',
        'tanggal_mulai',
        'tanggal_selesai',
        'deskripsi',
        'is_active',
        // Virtual / legacy compatibility aliases
        'title',
        'name',
        'start_date',
        'end_date',
        'description',
        'contract_id',
        'evaluator_id',
        'date',
        'time',
        'location',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'title',
        'start_date',
        'end_date',
        'description',
        'status_label',
    ];

    protected static function booted(): void
    {
        static::creating(function (MonevSchedule $schedule) {
            if (! $schedule->nama_tahap) {
                $schedule->nama_tahap = 'Tahap Monev '.($schedule->date ?? now()->toDateString());
            }
            if (! $schedule->tanggal_mulai) {
                $schedule->tanggal_mulai = $schedule->date ?? now()->toDateString();
            }
            if (! $schedule->tanggal_selesai) {
                $startDate = $schedule->tanggal_mulai instanceof \DateTimeInterface
                    ? Carbon::instance($schedule->tanggal_mulai)
                    : Carbon::parse($schedule->tanggal_mulai);
                $schedule->tanggal_selesai = $startDate->copy()->addDays(14)->toDateString();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke laporan kemajuan yang dikumpulkan pada jadwal monev ini (1:N).
     */
    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class, 'id_monev_schedule');
    }

    /**
     * Relasi kontrak (legacy compatibility).
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    /**
     * Relasi evaluator (legacy compatibility).
     */
    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Business Rules & Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Memeriksa apakah jadwal monev saat ini terbuka untuk penyerahan laporan kemajuan.
     */
    public function isOpenForSubmission(): bool
    {
        if (! $this->is_active || ! $this->tanggal_mulai || ! $this->tanggal_selesai) {
            return false;
        }

        $today = now()->toDateString();
        $start = $this->tanggal_mulai instanceof \DateTimeInterface
            ? Carbon::instance($this->tanggal_mulai)->toDateString()
            : Carbon::parse((string) $this->tanggal_mulai)->toDateString();
        $end = $this->tanggal_selesai instanceof \DateTimeInterface
            ? Carbon::instance($this->tanggal_selesai)->toDateString()
            : Carbon::parse((string) $this->tanggal_selesai)->toDateString();

        return $today >= $start && $today <= $end;
    }

    /**
     * Helper legacy untuk status penjadwalan.
     */
    public function isScheduled(): bool
    {
        return $this->is_active;
    }

    public function isDone(): bool
    {
        return ! $this->is_active && now()->toDateString() > ($this->tanggal_selesai?->toDateString() ?? '');
    }

    public function isCancelled(): bool
    {
        return ! $this->is_active;
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    public function getNamaTahapAttribute(): ?string
    {
        return $this->attributes['nama_tahap'] ?? null;
    }

    public function setNamaTahapAttribute($value): void
    {
        $this->attributes['nama_tahap'] = $value;
    }

    public function getTitleAttribute(): ?string
    {
        return $this->attributes['nama_tahap'] ?? null;
    }

    public function setTitleAttribute($value): void
    {
        $this->attributes['nama_tahap'] = $value;
    }

    public function getNameAttribute(): ?string
    {
        return $this->attributes['nama_tahap'] ?? null;
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['nama_tahap'] = $value;
    }

    public function getTanggalMulaiAttribute(): ?string
    {
        return $this->attributes['tanggal_mulai'] ?? null;
    }

    public function setTanggalMulaiAttribute($value): void
    {
        $this->attributes['tanggal_mulai'] = $value;
    }

    public function getStartDateAttribute(): ?string
    {
        return $this->attributes['tanggal_mulai'] ?? null;
    }

    public function setStartDateAttribute($value): void
    {
        $this->attributes['tanggal_mulai'] = $value;
    }

    public function getTanggalSelesaiAttribute(): ?string
    {
        return $this->attributes['tanggal_selesai'] ?? null;
    }

    public function setTanggalSelesaiAttribute($value): void
    {
        $this->attributes['tanggal_selesai'] = $value;
    }

    public function getEndDateAttribute(): ?string
    {
        return $this->attributes['tanggal_selesai'] ?? null;
    }

    public function setEndDateAttribute($value): void
    {
        $this->attributes['tanggal_selesai'] = $value;
    }

    public function getDeskripsiAttribute(): ?string
    {
        return $this->attributes['deskripsi'] ?? null;
    }

    public function setDeskripsiAttribute($value): void
    {
        $this->attributes['deskripsi'] = $value;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['deskripsi'] ?? null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['deskripsi'] = $value;
    }

    public function getStatusLabelAttribute(): string
    {
        if (! $this->is_active) {
            return 'Ditutup';
        }

        return $this->isOpenForSubmission() ? 'Terbuka' : 'Terjadwal';
    }

    // Virtual mutators for legacy columns
    public function setContractIdAttribute($value): void {}

    public function setEvaluatorIdAttribute($value): void {}

    public function setDateAttribute($value): void
    {
        if (! isset($this->attributes['tanggal_mulai'])) {
            $this->attributes['tanggal_mulai'] = $value;
        }
        if (! isset($this->attributes['tanggal_selesai'])) {
            $this->attributes['tanggal_selesai'] = $value;
        }
    }

    public function setTimeAttribute($value): void {}

    public function setLocationAttribute($value): void {}

    public function setStatusAttribute($value): void {}
}
