<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchSchema extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'university_id',
        'nama_skema',
        'deskripsi',
        'biaya_maksimal',
        'tanggal_mulai',
        'tanggal_selesai',
        'file_panduan',
        'is_active',
        'name',
        'description',
        'max_funding',
    ];

    protected $appends = [
        'name',
        'description',
        'max_funding',
    ];

    public function getNameAttribute(): ?string
    {
        return $this->attributes['nama_skema'] ?? null;
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['nama_skema'] = $value;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['deskripsi'] ?? null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['deskripsi'] = $value;
    }

    public function getMaxFundingAttribute()
    {
        return $this->attributes['biaya_maksimal'] ?? 0;
    }

    public function setMaxFundingAttribute($value): void
    {
        $this->attributes['biaya_maksimal'] = $value;
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'id_skema_pendanaan');
    }
}
