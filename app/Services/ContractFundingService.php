<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Funding;
use App\Models\Proposal;
use App\Models\University;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContractFundingService
{
    /**
     * Generate nomor kontrak unik institusional secara atomik dengan database lock.
     * Format kanonikal: KTR/{YYYY}/{TENANT_CODE}/{SEQ} (contoh: KTR/2026/UMT/0001).
     */
    public function generateContractNumber(int $universityId): string
    {
        $university = University::find($universityId);
        $tenantCode = $university?->code ? strtoupper($university->code) : 'KMP';
        $year = date('Y');
        $prefix = "KTR/{$year}/{$tenantCode}/";

        $lastContract = Contract::withoutGlobalScopes()
            ->where('nomor_kontrak', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('id')
            ->first();

        $nextSequence = 1;
        if ($lastContract && preg_match('/\/(\d+)$/', (string) $lastContract->nomor_kontrak, $matches)) {
            $nextSequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $nextSequence);
    }

    /**
     * Terbitkan kontrak penelitian baru dan bentuk tahapan pendanaan 70:30 secara otomatis.
     *
     * @throws ValidationException
     */
    public function issueContract(Proposal $proposal, float $danaDisetujui, string $tanggalKontrak, ?string $nomorKontrak = null): Contract
    {
        if ($proposal->status_proposal !== Proposal::STATUS_LOLOS_DIDANAI) {
            throw ValidationException::withMessages([
                'id_proposal' => 'Proposal belum berstatus lolos didanai.',
            ]);
        }

        $maxBudget = (float) ($proposal->researchSchema?->biaya_maksimal ?? $proposal->researchSchema?->anggaran_maksimal ?? 0);
        if ($maxBudget > 0 && $danaDisetujui > $maxBudget) {
            throw ValidationException::withMessages([
                'dana_disetujui' => 'Dana yang disetujui melebihi pagu anggaran skema.',
            ]);
        }

        return DB::transaction(function () use ($proposal, $danaDisetujui, $tanggalKontrak, $nomorKontrak) {
            if (empty($nomorKontrak)) {
                $nomorKontrak = $this->generateContractNumber((int) $proposal->university_id);
            }

            $contract = Contract::create([
                'university_id' => $proposal->university_id,
                'id_proposal' => $proposal->id,
                'nomor_kontrak' => $nomorKontrak,
                'judul_kontrak' => $proposal->judul_penelitian,
                'dana_disetujui' => $danaDisetujui,
                'tanggal_kontrak' => $tanggalKontrak,
                'status_kontrak' => Contract::STATUS_DRAFT,
            ]);

            // Hitung Termin 1 (70%) dan Termin 2 (30%)
            $termin1Nominal = round($danaDisetujui * 0.70, 2);
            $termin2Nominal = round($danaDisetujui - $termin1Nominal, 2);

            Funding::create([
                'id_contract' => $contract->id,
                'termin_ke' => 1,
                'persentase_dana' => 70,
                'nominal_dana' => $termin1Nominal,
                'status_pencairan' => Funding::STATUS_PENDING,
            ]);

            Funding::create([
                'id_contract' => $contract->id,
                'termin_ke' => 2,
                'persentase_dana' => 30,
                'nominal_dana' => $termin2Nominal,
                'status_pencairan' => Funding::STATUS_PENDING,
            ]);

            return $contract->load('fundings');
        });
    }
}
