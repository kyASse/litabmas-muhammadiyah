<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Terapkan penyaringan tenant pada pembangun kueri Eloquent.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Pengecualian Super Admin untuk keperluan pemantauan global
            if ($user->isSuperAdmin()) {
                return;
            }

            // Terapkan penyaringan ketat berdasarkan university_id pengguna aktif
            if ($user->university_id) {
                $builder->where($model->getTable().'.university_id', $user->university_id);
            } else {
                // Jika pengguna tidak terafiliasi dengan universitas mana pun, blokir akses
                $builder->whereRaw('1 = 0');
            }
        }
    }
}
