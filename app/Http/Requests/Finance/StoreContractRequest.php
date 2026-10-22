<?php

namespace App\Http\Requests\Finance;

use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreContractRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->hasAnyRole([
            Role::ADMIN_KEUANGAN,
            Role::ADMIN_KAMPUS,
            Role::SUPER_ADMIN,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_proposal' => ['required', 'integer', 'exists:proposals,id'],
            'dana_disetujui' => ['required', 'numeric', 'min:1000000'],
            'tanggal_kontrak' => ['required', 'date'],
            'nomor_kontrak' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $proposalId = $this->input('id_proposal');
            if (! $proposalId) {
                return;
            }

            // Tenant isolation & existence check
            $proposal = Proposal::find($proposalId);
            if (! $proposal) {
                $foreignProposal = Proposal::withoutGlobalScopes()->find($proposalId);
                if ($foreignProposal && auth()->check() && ! auth()->user()->isSuperAdmin() && auth()->user()->university_id !== $foreignProposal->university_id) {
                    abort(403, 'Akses ditolak: Proposal berada di luar institusi Anda.');
                }

                $validator->errors()->add('id_proposal', 'Proposal tidak ditemukan.');

                return;
            }

            if ($proposal->status_proposal !== Proposal::STATUS_LOLOS_DIDANAI) {
                $validator->errors()->add('id_proposal', 'Proposal belum berstatus lolos didanai.');
            }

            if ($proposal->contract()->exists()) {
                $validator->errors()->add('id_proposal', 'Proposal ini sudah memiliki kontrak.');
            }

            $maxBudget = (float) ($proposal->researchSchema?->biaya_maksimal ?? $proposal->researchSchema?->anggaran_maksimal ?? 0);
            $danaDisetujui = (float) $this->input('dana_disetujui');
            if ($maxBudget > 0 && $danaDisetujui > $maxBudget) {
                $validator->errors()->add('dana_disetujui', 'Dana yang disetujui melebihi batas anggaran maksimal skema penelitian.');
            }
        });
    }
}
