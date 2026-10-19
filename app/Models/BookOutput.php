<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookOutput extends Model
{
    use HasFactory;

    protected $table = 'book_outputs';

    protected $fillable = [
        'id_research_output',
        'judul_buku',
        'isbn',
        'penerbit',
        'tahun_terbit',
        'jumlah_halaman',
        'file_cover_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
