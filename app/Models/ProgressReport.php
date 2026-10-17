<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Laporan Kemajuan (Progress Report)
 *
 * Menangani rekaman berkas laporan kemajuan riset, catatan kendala, logbook aktivitas, dan skor penilaian monev.
 * Merujuk pada Skema 21 Tabel Bersih (Klaster 5: Modul 4).
 */
class ProgressReport extends Model
{
    use HasFactory;

    public const STATUS_SUBMITTED = 'Submitted';

    public const STATUS_APPROVED = 'Approved';

    public const STATUS_REVISION = 'Revision';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id_proposal',
        'id_monev_schedule',
        'persentase_kemajuan',
        'ringkasan_progres',
        'catatan_kendala',
        'file_laporan_kemajuan',
        'file_logbook',
        'logbook',
        'skor_monev',
        'catatan_reviewer_monev',
        'status_laporan',
        // Virtual / legacy aliases
        'proposal_id',
        'monev_schedule_id',
        'progress_percentage',
        'summary',
        'issues',
        'status',
        'report_file',
        'logbook_file',
        'score',
        'reviewer_notes',
        'content',
        'title',
        'report_type',
        'report_date',
        'report_period',
        'attachment_path',
        'contract_id',
        'user_id',
        'submitted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'persentase_kemajuan' => 'integer',
        'progress_percentage' => 'integer',
        'skor_monev' => 'decimal:2',
        'score' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'proposal_id',
        'status',
        'progress_percentage',
        'status_label',
    ];

    protected static function booted(): void
    {
        static::creating(function (ProgressReport $report) {
            if (! $report->ringkasan_progres) {
                $report->ringkasan_progres = $report->content ?? 'Ringkasan progres pelaksanaan penelitian.';
            }
            if (! $report->file_laporan_kemajuan) {
                $report->file_laporan_kemajuan = $report->attachment_path ?? 'reports/default-progress-report.pdf';
            }
            if (! $report->status_laporan) {
                $report->status_laporan = self::STATUS_SUBMITTED;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke proposal riset induk (N:1).
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    /**
     * Relasi ke Dosen Pengusul melalui proposal (legacy compatibility).
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Proposal::class,
            'id',          // Foreign key on proposals table
            'id',          // Foreign key on users table
            'id_proposal', // Local key on progress_reports table
            'id_pengusul'  // Local key on proposals table
        );
    }

    /**
     * Relasi ke jadwal tahapan monev (N:1).
     */
    public function monevSchedule(): BelongsTo
    {
        return $this->belongsTo(MonevSchedule::class, 'id_monev_schedule');
    }

    /**
     * Relasi kontrak melalui proposal (legacy compatibility).
     */
    public function contract(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            Contract::class,
            Proposal::class,
            'id',          // Foreign key on proposals table
            'id_proposal', // Foreign key on contracts table
            'id_proposal', // Local key on progress_reports table
            'id'           // Local key on proposals table
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        $map = [
            'submitted' => self::STATUS_SUBMITTED,
            'approved' => self::STATUS_APPROVED,
            'revision' => self::STATUS_REVISION,
        ];

        $val = is_string($status) ? ($map[strtolower($status)] ?? $status) : $status;

        return $query->where('status_laporan', $val);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status_laporan', self::STATUS_APPROVED);
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('status_laporan', self::STATUS_SUBMITTED);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors, Mutators & Helpers
    |--------------------------------------------------------------------------
    */

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

    public function getIdMonevScheduleAttribute(): ?int
    {
        return isset($this->attributes['id_monev_schedule']) ? (int) $this->attributes['id_monev_schedule'] : null;
    }

    public function setIdMonevScheduleAttribute($value): void
    {
        $this->attributes['id_monev_schedule'] = $value;
    }

    public function getMonevScheduleIdAttribute(): ?int
    {
        return $this->getIdMonevScheduleAttribute();
    }

    public function setMonevScheduleIdAttribute($value): void
    {
        $this->attributes['id_monev_schedule'] = $value;
    }

    public function getPersentaseKemajuanAttribute(): ?int
    {
        return isset($this->attributes['persentase_kemajuan']) ? (int) $this->attributes['persentase_kemajuan'] : 0;
    }

    public function setPersentaseKemajuanAttribute($value): void
    {
        $this->attributes['persentase_kemajuan'] = (int) $value;
    }

    public function getProgressPercentageAttribute(): int
    {
        return $this->getPersentaseKemajuanAttribute() ?? 0;
    }

    public function setProgressPercentageAttribute($value): void
    {
        $this->attributes['persentase_kemajuan'] = (int) $value;
    }

    public function getRingkasanProgresAttribute(): ?string
    {
        return $this->attributes['ringkasan_progres'] ?? null;
    }

    public function setRingkasanProgresAttribute($value): void
    {
        $this->attributes['ringkasan_progres'] = $value;
    }

    public function getSummaryAttribute(): ?string
    {
        return $this->getRingkasanProgresAttribute();
    }

    public function setSummaryAttribute($value): void
    {
        $this->attributes['ringkasan_progres'] = $value;
    }

    public function getContentAttribute(): ?string
    {
        return $this->getRingkasanProgresAttribute();
    }

    public function setContentAttribute($value): void
    {
        $this->attributes['ringkasan_progres'] = $value;
    }

    public function getCatatanKendalaAttribute(): ?string
    {
        return $this->attributes['catatan_kendala'] ?? null;
    }

    public function setCatatanKendalaAttribute($value): void
    {
        $this->attributes['catatan_kendala'] = $value;
    }

    public function getIssuesAttribute(): ?string
    {
        return $this->getCatatanKendalaAttribute();
    }

    public function setIssuesAttribute($value): void
    {
        $this->attributes['catatan_kendala'] = $value;
    }

    public function getFileLaporanKemajuanAttribute(): ?string
    {
        return $this->attributes['file_laporan_kemajuan'] ?? null;
    }

    public function setFileLaporanKemajuanAttribute($value): void
    {
        $this->attributes['file_laporan_kemajuan'] = $value;
    }

    public function getReportFileAttribute(): ?string
    {
        return $this->getFileLaporanKemajuanAttribute();
    }

    public function setReportFileAttribute($value): void
    {
        $this->attributes['file_laporan_kemajuan'] = $value;
    }

    public function getAttachmentPathAttribute(): ?string
    {
        return $this->getFileLaporanKemajuanAttribute();
    }

    public function setAttachmentPathAttribute($value): void
    {
        $this->attributes['file_laporan_kemajuan'] = $value;
    }

    public function getFileLogbookAttribute(): ?string
    {
        return $this->attributes['file_logbook'] ?? null;
    }

    public function setFileLogbookAttribute($value): void
    {
        $this->attributes['file_logbook'] = $value;
    }

    public function getLogbookFileAttribute(): ?string
    {
        return $this->getFileLogbookAttribute();
    }

    public function setLogbookFileAttribute($value): void
    {
        $this->attributes['file_logbook'] = $value;
    }

    public function getLogbookAttribute(): ?string
    {
        return $this->getFileLogbookAttribute();
    }

    public function setLogbookAttribute($value): void
    {
        $this->attributes['file_logbook'] = $value;
    }

    public function getEvaluationsAttribute(): array
    {
        if (! $this->skor_monev && ! $this->catatan_reviewer_monev) {
            return [];
        }

        return [
            [
                'id' => $this->id,
                'score' => (float) $this->skor_monev,
                'notes' => $this->catatan_reviewer_monev,
                'status' => $this->status_laporan === 'Approved' ? 'reviewed' : ($this->status_laporan === 'Revision' ? 'revised' : 'pending'),
                'evaluated_at' => $this->updated_at?->toIso8601String(),
                'reviewer' => [
                    'id' => 0,
                    'name' => 'Reviewer Monev',
                ],
            ],
        ];
    }

    public function getSkorMonevAttribute(): ?string
    {
        return isset($this->attributes['skor_monev']) ? (string) $this->attributes['skor_monev'] : null;
    }

    public function setSkorMonevAttribute($value): void
    {
        $this->attributes['skor_monev'] = $value;
    }

    public function getScoreAttribute(): ?string
    {
        return $this->getSkorMonevAttribute();
    }

    public function setScoreAttribute($value): void
    {
        $this->attributes['skor_monev'] = $value;
    }

    public function getCatatanReviewerMonevAttribute(): ?string
    {
        return $this->attributes['catatan_reviewer_monev'] ?? null;
    }

    public function setCatatanReviewerMonevAttribute($value): void
    {
        $this->attributes['catatan_reviewer_monev'] = $value;
    }

    public function getReviewerNotesAttribute(): ?string
    {
        return $this->getCatatanReviewerMonevAttribute();
    }

    public function setReviewerNotesAttribute($value): void
    {
        $this->attributes['catatan_reviewer_monev'] = $value;
    }

    public function getStatusLaporanAttribute(): ?string
    {
        return $this->attributes['status_laporan'] ?? self::STATUS_SUBMITTED;
    }

    public function setStatusLaporanAttribute($value): void
    {
        $map = [
            'submitted' => self::STATUS_SUBMITTED,
            'approved' => self::STATUS_APPROVED,
            'revision' => self::STATUS_REVISION,
        ];
        $val = is_string($value) ? ($map[strtolower($value)] ?? $value) : $value;
        $this->attributes['status_laporan'] = $val;
    }

    public function getStatusAttribute(): ?string
    {
        return $this->getStatusLaporanAttribute();
    }

    public function setStatusAttribute($value): void
    {
        $this->setStatusLaporanAttribute($value);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status_laporan) {
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_REVISION => 'Revisi',
            default => 'Diajukan',
        };
    }

    public function getUserIdAttribute(): ?int
    {
        return $this->proposal?->id_pengusul;
    }

    // Virtual mutators for legacy columns
    public function setContractIdAttribute($value): void {}

    public function setUserIdAttribute($value): void {}

    public function setTitleAttribute($value): void {}

    public function setReportTypeAttribute($value): void {}

    public function setReportDateAttribute($value): void {}

    public function setReportPeriodAttribute($value): void {}

    public function setSubmittedAtAttribute($value): void {}
}
