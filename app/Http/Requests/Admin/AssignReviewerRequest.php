<?php

namespace App\Http\Requests\Admin;

use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class AssignReviewerRequest extends FormRequest
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

        return $user->hasAnyRole([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN])
            || $user->isSuperAdmin()
            || $user->isAdminKampus();
    }

    /**
     * Prepare inputs for validation (support legacy aliases).
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('id_proposal') && $this->has('proposal_id')) {
            $this->merge(['id_proposal' => $this->input('proposal_id')]);
        }
        if (! $this->has('id_reviewer') && $this->has('reviewer_id')) {
            $this->merge(['id_reviewer' => $this->input('reviewer_id')]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'id_proposal' => 'required|integer|exists:proposals,id',
            'id_reviewer' => 'required|integer|exists:users,id',
            'tanggal_mulai_review' => 'nullable|date',
            'tanggal_selesai_review' => 'nullable|date',
        ];
    }

    /**
     * Configure the validator instance for Conflict of Interest (CoI) protection.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $proposalId = $this->input('id_proposal');
            $reviewerId = $this->input('id_reviewer');

            if ($proposalId && $reviewerId) {
                $proposal = Proposal::with('members')->find($proposalId);
                if ($proposal) {
                    if ((int) $reviewerId === (int) $proposal->id_pengusul) {
                        $validator->errors()->add(
                            'id_reviewer',
                            '[KRITIS] Reviewer tidak boleh menjadi ketua pengusul pada usulan yang dinilai.'
                        );
                    }
                    if ($proposal->members->contains('user_id', (int) $reviewerId)) {
                        $validator->errors()->add(
                            'id_reviewer',
                            '[KRITIS] Reviewer terdaftar sebagai anggota tim peneliti pada usulan ini.'
                        );
                    }
                }
            }
        });
    }
}
