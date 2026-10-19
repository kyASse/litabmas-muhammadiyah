<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    use HasFactory;

    protected $table = 'evaluations';

    public const REKOMENDASI_MEMUASKAN = 'Lulus_Memuaskan';
    public const REKOMENDASI_CUKUP = 'Lulus_Cukup';
    public const REKOMENDASI_TIDAK_LULUS = 'Tidak_Lulus';

    public const STATUS_DALAM_EVALUASI = 'Dalam_Evaluasi';
    public const STATUS_SELESAI = 'Selesai';
    public const STATUS_GAGAL = 'Gagal';

    protected $fillable = [
        'id_proposal',
        'id_evaluator',
        'file_laporan_akhir',
        'ringkasan_hasil',
        'persentase_capaian_luaran',
        'skor_akhir_substansi',
        'rekomendasi_kelulusan',
        'nomor_skts',
        'file_skts_path',
        'status_penelitian',
    ];

    protected $casts = [
        'persentase_capaian_luaran' => 'integer',
        'skor_akhir_substansi' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_evaluator');
    }
}
