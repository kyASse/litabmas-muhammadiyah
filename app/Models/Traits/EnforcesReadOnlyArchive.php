<?php

namespace App\Models\Traits;

use App\Models\Proposal;

trait EnforcesReadOnlyArchive
{
    public static function bootEnforcesReadOnlyArchive(): void
    {
        static::updating(function ($model) {
            $model->preventMutationIfArchived();
        });

        static::deleting(function ($model) {
            $model->preventMutationIfArchived();
        });
    }

    public function preventMutationIfArchived(): void
    {
        $proposal = $this instanceof Proposal
            ? $this
            : ($this->proposal ?? ($this->contract?->proposal ?? null));

        if ($proposal) {
            $evaluation = $proposal->relationLoaded('evaluation') && $proposal->getRelation('evaluation') !== null
                ? $proposal->getRelation('evaluation')
                : $proposal->evaluation()->first();

            $isArchived = $evaluation && $evaluation->status_penelitian === 'Selesai';
            if ($isArchived) {
                abort(403, '[TERKUNCI] Data usulan telah berstatus Selesai dan terkunci permanen sebagai Arsip Baca-Saja.');
            }
        }
    }
}
