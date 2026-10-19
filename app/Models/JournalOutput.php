<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalOutput extends Model
{
    use HasFactory;

    protected $table = 'journal_outputs';

    protected $fillable = [
        'id_research_output',
        'nama_jurnal',
        'judul_artikel',
        'issn',
        'indeksasi',
        'status_publikasi',
        'doi_url',
        'file_artikel_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
