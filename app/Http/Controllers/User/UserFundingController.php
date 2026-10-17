<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Funding;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class UserFundingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $baseQuery = Contract::query()
            ->whereHas('proposal', function ($q) use ($user) {
                $q->where('id_pengusul', $user->id);
            });

        $fundingStats = [
            'total_approved' => (float) (clone $baseQuery)->sum('dana_disetujui'),
            'total_disbursed' => (float) Funding::query()
                ->whereIn('id_contract', (clone $baseQuery)->select('contracts.id'))
                ->disbursed()
                ->sum('nominal_dana'),
            'active_contracts' => (clone $baseQuery)->where('status_kontrak', Contract::STATUS_ACTIVE)->count(),
        ];
        $fundingStats['total_remaining'] = $fundingStats['total_approved'] - $fundingStats['total_disbursed'];

        $contracts = $baseQuery
            ->with(['proposal:id,judul_penelitian', 'fundings' => fn ($q) => $q->orderBy('termin_ke')])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $formattedContracts = $contracts->through(function (Contract $contract) {
            $totalDisbursed = (float) $contract->fundings->where('status_pencairan', Funding::STATUS_DISBURSED)->sum('nominal_dana');
            $contractValue = (float) $contract->dana_disetujui;
            $disbursementPercentage = $contractValue > 0
                ? round(($totalDisbursed / $contractValue) * 100, 2)
                : 0;

            return [
                'id' => $contract->id,
                'contract_number' => $contract->nomor_kontrak,
                'title' => $contract->judul_kontrak ?? $contract->proposal?->judul_penelitian,
                'start_date' => self::formatDate($contract->tanggal_kontrak),
                'contract_value' => $contractValue,
                'status' => $contract->status,
                'status_label' => Contract::getStatusOptions()[$contract->status_kontrak] ?? ucfirst($contract->status_kontrak),
                'total_disbursed' => $totalDisbursed,
                'remaining_funding' => max($contractValue - $totalDisbursed, 0),
                'disbursement_percentage' => $disbursementPercentage,
                'fundings' => $contract->fundings->map(fn (Funding $funding) => [
                    'id' => $funding->id,
                    'funding_number' => $funding->termin_ke,
                    'description' => $funding->description ?? "Termin {$funding->termin_ke}",
                    'amount' => (float) $funding->nominal_dana,
                    'percentage' => (float) $funding->persentase_dana,
                    'status' => $funding->status_pencairan,
                    'status_label' => $funding->getStatusLabelAttribute(),
                    'status_color' => $funding->getStatusColorAttribute(),
                    'funding_date' => self::formatDate($funding->tanggal_pencairan),
                    'paid_at' => self::formatDate($funding->tanggal_pencairan),
                    'reference_number' => $funding->reference_number,
                    'proof_document_path' => $funding->bukti_transfer_path,
                    'notes' => $funding->catatan_keuangan,
                ])->values()->toArray(),
                'created_at' => self::formatDate($contract->created_at, 'Y-m-d H:i:s'),
            ];
        });

        return Inertia::render('Proposal/FundingInfo', [
            'contracts' => $formattedContracts,
            'fundingStats' => $fundingStats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Format tanggal secara aman dari Carbon, string, atau null.
     */
    public static function formatDate(mixed $date, string $format = 'Y-m-d'): ?string
    {
        if (! $date) {
            return null;
        }

        if ($date instanceof \DateTimeInterface) {
            return $date->format($format);
        }

        try {
            return Carbon::parse($date)->format($format);
        } catch (\Throwable) {
            return is_string($date) ? $date : null;
        }
    }
}
