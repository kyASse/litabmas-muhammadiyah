<?php

namespace App\Http\Requests\Reviewer;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class EvaluateMonevRequest extends FormRequest
{
    /**
     * Otorisasi pengisian evaluasi monev.
     * Hanya Reviewer dan Super Admin yang diizinkan.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->hasAnyRole([Role::REVIEWER, Role::SUPER_ADMIN])
            || $user->isReviewer()
            || $user->isSuperAdmin();
    }

    /**
     * Aturan validasi penilaian laporan kemajuan monev oleh reviewer.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'skor_monev' => ['required', 'numeric', 'min:0', 'max:100'],
            'status_laporan' => ['required', 'in:Approved,Revision'],
            'catatan_reviewer_monev' => ['required', 'string', 'min:10'],
        ];
    }

    /**
     * Penamaan atribut untuk pesan validasi.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'skor_monev' => 'skor monev',
            'status_laporan' => 'status rekomendasi monev',
            'catatan_reviewer_monev' => 'catatan reviewer monev',
        ];
    }

    /**
     * Pesan kesalahan validasi dalam Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'skor_monev.required' => 'Skor monev wajib diisi.',
            'skor_monev.numeric' => 'Skor monev harus berupa angka numerik.',
            'skor_monev.min' => 'Skor monev minimal 0.',
            'skor_monev.max' => 'Skor monev maksimal 100.',
            'status_laporan.required' => 'Status rekomendasi laporan kemajuan wajib dipilih.',
            'status_laporan.in' => 'Status rekomendasi laporan kemajuan harus Approved atau Revision.',
            'catatan_reviewer_monev.required' => 'Catatan reviewer monev wajib diisi.',
            'catatan_reviewer_monev.min' => 'Catatan reviewer monev minimal 10 karakter.',
        ];
    }
}
