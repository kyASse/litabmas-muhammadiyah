<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductOutput extends Model
{
    use HasFactory;

    protected $table = 'product_outputs';

    protected $fillable = [
        'id_research_output',
        'nama_produk',
        'deskripsi_produk',
        'tingkat_kesiapan_teknologi',
        'dokumentasi_produk_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
