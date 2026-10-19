<?php

namespace App\Models;

use App\Models\Traits\EnforcesReadOnlyArchive;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResearchOutput extends Model
{
    use EnforcesReadOnlyArchive, HasFactory, SoftDeletes;

    protected $table = 'research_outputs';

    public const TIPE_JOURNAL = 'Journal';

    public const TIPE_BOOK = 'Book';

    public const TIPE_HKI = 'Hki';

    public const TIPE_PRODUCT = 'Product';

    public const TARGET_WAJIB = 'Wajib';

    public const TARGET_TAMBAHAN = 'Tambahan';

    public const STATUS_DRAFT = 'Draft';

    public const STATUS_SUBMITTED = 'Submitted';

    public const STATUS_VERIFIED = 'Verified';

    public const STATUS_REJECTED = 'Rejected';

    public const KATEGORI = [
        'Journal' => 'Journal',
        'Book' => 'Book',
        'Hki' => 'Hki',
        'Product' => 'Product',
    ];

    public const STATUS = [
        'Draft' => 'Draft',
        'Submitted' => 'Submitted',
        'Verified' => 'Verified',
        'Rejected' => 'Rejected',
    ];

    protected $fillable = [
        'id_proposal',
        'tipe_luaran',
        'target_status',
        'status_verifikasi',
        'catatan_verifikasi',
        'tanggal_pelaporan',
    ];

    protected $casts = [
        'tanggal_pelaporan' => 'date',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    public function user(): HasOneThrough
    {
        return $this->hasOneThrough(User::class, Proposal::class, 'id', 'id', 'id_proposal', 'id_pengusul');
    }

    public function journalOutput(): HasOne
    {
        return $this->hasOne(JournalOutput::class, 'id_research_output');
    }

    public function bookOutput(): HasOne
    {
        return $this->hasOne(BookOutput::class, 'id_research_output');
    }

    public function hkiOutput(): HasOne
    {
        return $this->hasOne(HkiOutput::class, 'id_research_output');
    }

    public function productOutput(): HasOne
    {
        return $this->hasOne(ProductOutput::class, 'id_research_output');
    }
}
