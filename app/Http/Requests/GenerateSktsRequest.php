<?php

namespace App\Http\Requests;

use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GenerateSktsRequest extends FormRequest
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

        $proposal = $this->route('proposal');
        if (! ($proposal instanceof Proposal)) {
            $proposal = Proposal::find($proposal);
        }

        if (! $proposal) {
            return false;
        }

        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        if ($isSuperAdmin) {
            return true;
        }

        $isAdminKampus = $user->hasAnyRole([Role::ADMIN_KAMPUS])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, 'Admin Kampus'], true);
        if ($isAdminKampus) {
            return (int) $user->university_id === (int) $proposal->university_id;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'skor_akhir_substansi' => ['required_without:skor', 'nullable', 'numeric', 'min:0', 'max:100'],
            'skor' => ['required_without:skor_akhir_substansi', 'nullable', 'numeric', 'min:0', 'max:100'],
            'rekomendasi_kelulusan' => ['required', 'string', 'in:Lulus_Memuaskan,Lulus_Cukup,Tidak_Lulus'],
        ];
    }

    /**
     * Custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'skor_akhir_substansi.required_without' => '[WAJIB] Skor akhir substansi wajib diisi.',
            'skor.required_without' => '[WAJIB] Skor akhir substansi wajib diisi.',
            'skor_akhir_substansi.numeric' => '[KRITIS] Skor akhir substansi harus berupa angka.',
            'skor.numeric' => '[KRITIS] Skor akhir substansi harus berupa angka.',
            'skor_akhir_substansi.min' => '[KRITIS] Skor minimal adalah 0.',
            'skor_akhir_substansi.max' => '[KRITIS] Skor maksimal adalah 100.',
            'rekomendasi_kelulusan.required' => '[WAJIB] Rekomendasi kelulusan wajib dipilih.',
            'rekomendasi_kelulusan.in' => '[KRITIS] Rekomendasi kelulusan harus Lulus_Memuaskan, Lulus_Cukup, atau Tidak_Lulus.',
        ];
    }
}
