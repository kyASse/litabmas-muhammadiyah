<?php

namespace App\Http\Requests\Admin;

use App\Models\Review;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class ReassignReviewerRequest extends FormRequest
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
     * Prepare inputs for validation (support aliases).
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('id_reviewer_baru') && $this->has('new_reviewer_id')) {
            $this->merge(['id_reviewer_baru' => $this->input('new_reviewer_id')]);
        }
        if (! $this->has('tanggal_selesai_baru') && $this->has('new_end_date')) {
            $this->merge(['tanggal_selesai_baru' => $this->input('new_end_date')]);
        }
        if (! $this->has('alasan_pencabutan') && $this->has('reason')) {
            $this->merge(['alasan_pencabutan' => $this->input('reason')]);
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
            'id_reviewer_baru' => 'required|integer|exists:users,id',
            'tanggal_selesai_baru' => 'nullable|date',
            'alasan_pencabutan' => 'required|string|min:5',
        ];
    }

    /**
     * Configure the validator instance for CoI protection on reassign.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $reviewId = $this->route('id') ?? $this->route('assignment') ?? $this->route('review');
            $newReviewerId = $this->input('id_reviewer_baru');

            if ($reviewId && $newReviewerId) {
                $review = Review::with('proposal.members')->find($reviewId);
                if ($review && $review->proposal) {
                    if ((int) $newReviewerId === (int) $review->proposal->id_pengusul) {
                        $validator->errors()->add(
                            'id_reviewer_baru',
                            '[KRITIS] Reviewer tidak boleh menjadi ketua pengusul pada usulan yang dinilai.'
                        );
                    }
                    if ($review->proposal->members->contains('user_id', (int) $newReviewerId)) {
                        $validator->errors()->add(
                            'id_reviewer_baru',
                            '[KRITIS] Reviewer terdaftar sebagai anggota tim peneliti pada usulan ini.'
                        );
                    }
                }
            }
        });
    }
}
