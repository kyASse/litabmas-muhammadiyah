<?php

namespace App\Services;

use App\Models\Funding;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class FundingDisbursementService
{
    /**
     * Cairkan dana termin penelitian dengan bukti transfer valid dan verifikasi Monev Gatekeeper Lock.
     *
     * @param Funding $funding
     * @param UploadedFile|mixed $file
     * @param string $tanggalPencairan
     * @param string|null $catatanKeuangan
     * @return Funding
     */
    public function disburse(Funding $funding, mixed $file, string $tanggalPencairan, ?string $catatanKeuangan = null): Funding
    {
        // Monev Gatekeeper Lock: Termin 2 (30%) DIBLOKIR SECARA ABSOLUT (HTTP 422) jika Monev belum disetujui
        if ($funding->termin_ke === 2) {
            $funding->loadMissing('contract.proposal.progressReports');

            $contract = $funding->contract;
            $proposal = $contract?->proposal;

            $isApproved = $proposal && $proposal->progressReports()
                ->where('status_laporan', 'Approved')
                ->exists();

            if (! $isApproved) {
                abort(422, '[BLOKIR] Pencairan dana Termin 2 ditolak. Laporan Kemajuan Monev belum disetujui (Approved) oleh Reviewer.');
            }
        }

        return DB::transaction(function () use ($funding, $file, $tanggalPencairan, $catatanKeuangan) {
            // Simpan berkas bukti transfer resmi ke disk publik
            $path = $file->store('receipts/fundings', 'public');

            // Perbarui data pencairan dana
            $funding->update([
                'status_pencairan' => Funding::STATUS_DISBURSED,
                'status' => Funding::STATUS_DISBURSED,
                'tanggal_pencairan' => $tanggalPencairan,
                'bukti_transfer_path' => $path,
                'proof_document_path' => $path,
                'catatan_keuangan' => $catatanKeuangan,
                'notes' => $catatanKeuangan,
                'paid_at' => now(),
            ]);

            return $funding;
        });
    }
}
