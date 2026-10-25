<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchSchema extends Model
{
    use BelongsToTenant, HasFactory;

    protected static function booted(): void
    {
        static::creating(function ($schema) {
            if (! $schema->university_id) {
                if (auth()->check() && auth()->user()->university_id) {
                    $schema->university_id = auth()->user()->university_id;
                } else {
                    $schema->university_id = University::value('id') ?? University::create([
                        'code' => 'UMT-DEFAULT',
                        'name' => 'Universitas Muhammadiyah Default',
                        'address' => 'Jl. Default',
                        'contact_email' => 'default@kampus.ac.id',
                    ])->id;
                }
            }
            if (! $schema->tanggal_mulai) {
                $schema->tanggal_mulai = now()->toDateString();
            }
            if (! $schema->tanggal_selesai) {
                $schema->tanggal_selesai = now()->addMonths(12)->toDateString();
            }
            if (! isset($schema->biaya_maksimal)) {
                $schema->biaya_maksimal = 10000000;
            }
        });
    }

    protected $fillable = [
        'university_id',
        'nama_skema',
        'deskripsi',
        'biaya_maksimal',
        'tanggal_mulai',
        'tanggal_selesai',
        'file_panduan',
        'is_active',
        'tahun_anggaran',
        'year',
        'name',
        'description',
        'max_funding',
    ];

    protected $casts = [
        'tahun_anggaran' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'name',
        'description',
        'max_funding',
        'year',
    ];

    public function getYearAttribute(): ?int
    {
        return isset($this->attributes['tahun_anggaran']) ? (int) $this->attributes['tahun_anggaran'] : null;
    }

    public function setYearAttribute($value): void
    {
        $this->attributes['tahun_anggaran'] = $value;
    }

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

    public function getAnggaranMaksimalAttribute()
    {
        return $this->attributes['biaya_maksimal'] ?? 0;
    }

    public function setAnggaranMaksimalAttribute($value): void
    {
        $this->attributes['biaya_maksimal'] = $value;
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'id_skema_pendanaan');
    }
}
