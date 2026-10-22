<?php

namespace App\Models;

use App\Models\Traits\EnforcesReadOnlyArchive;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalDocument extends Model
{
    use EnforcesReadOnlyArchive, HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'proposal_documents';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id_proposal',
        'nama_file',
        'file_path',
        'file_size',
        'tipe_dokumen',
        // Virtual / legacy aliases
        'proposal_id',
        'file_name',
        'file_type',
        'document_type',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Virtual attributes appended to array/JSON representation.
     */
    protected $appends = [
        'proposal_id',
        'file_name',
        'document_type',
    ];

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
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

    public function getFileNameAttribute(): ?string
    {
        return $this->attributes['nama_file'] ?? null;
    }

    public function setFileNameAttribute($value): void
    {
        $this->attributes['nama_file'] = $value;
    }

    public function getDocumentTypeAttribute(): ?string
    {
        return $this->attributes['tipe_dokumen'] ?? null;
    }

    public function setDocumentTypeAttribute($value): void
    {
        $map = [
            'Dokumen Utama' => 'Proposal_Utama',
            'Proposal Utama' => 'Proposal_Utama',
            'Surat Pernyataan' => 'Surat_Pernyataan',
            'Lampiran' => 'Lampiran',
        ];
        $this->attributes['tipe_dokumen'] = $map[$value] ?? $value;
    }

    public function getFileTypeAttribute(): ?string
    {
        return 'application/pdf';
    }

    public function setFileTypeAttribute($value): void
    {
        // Virtual attribute - ignore for SQL insert
    }

    public function getDescriptionAttribute(): ?string
    {
        return null;
    }

    public function setDescriptionAttribute($value): void
    {
        // Virtual attribute - ignore for SQL insert
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the proposal this document belongs to.
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }
}
