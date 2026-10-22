<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HkiOutput extends Model
{
    use HasFactory;

    protected $table = 'hki_outputs';

    protected $fillable = [
        'id_research_output',
        'judul_ciptaan',
        'jenis_hki',
        'nomor_pendaftaran',
        'nomor_sertifikat',
        'file_sertifikat_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
