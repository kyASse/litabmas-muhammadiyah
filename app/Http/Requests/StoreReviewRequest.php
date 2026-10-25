<?php

namespace App\Http\Requests;

use App\Models\Review;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Menggunakan hasRole(Role::REVIEWER) yang menangani fallback legacy
     * secara aman, sesuai aturan proyek.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole(Role::REVIEWER);
    }

    /**
     * Prepare inputs for validation (normalize comments and calculate score).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('komponen_penilaian') && is_array($this->komponen_penilaian)) {
            $normalized = [];
            foreach ($this->komponen_penilaian as $item) {
                if (is_array($item)) {
                    $rawComment = $item['komentar']
                        ?? $item['komentar_indikator']
                        ?? $item['catatan_kriteria']
                        ?? $item['catatan']
                        ?? $item['notes']
                        ?? null;

                    if ($rawComment !== null) {
                        $trimmed = trim((string) $rawComment);
                        $item['komentar'] = $trimmed;
                        $item['komentar_indikator'] = $trimmed;
                        $item['catatan_kriteria'] = $trimmed;
                    }
                    $normalized[] = $item;
                } else {
                    $normalized[] = $item;
                }
            }
            $this->merge(['komponen_penilaian' => $normalized]);

            if (! $this->has('score') || $this->input('score') === null) {
                $calc = Review::calculateScoreFromComponents($normalized);
                $this->merge(['score' => $calc]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proposal_id' => 'required|integer|exists:proposals,id',
            'komponen_penilaian' => 'required|array|min:1',
            'komponen_penilaian.*.kriteria' => 'required|string',
            'komponen_penilaian.*.bobot' => 'required|numeric|min:0|max:100',
            'komponen_penilaian.*.skor' => 'required|integer|min:1|max:5',
            'komponen_penilaian.*.komentar' => 'required|string|min:1',
            'score' => 'required|numeric|min:0|max:100',
            'comments' => 'required_if:recommendation,revision,rejected|nullable|string',
            'recommendation' => 'required|in:accepted,rejected,revision,Diterima,Revisi,Ditolak',
        ];
    }

    /**
     * Get custom error messages for validation.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'komponen_penilaian.*.skor.required' => 'Skor kriteria wajib dipilih.',
            'komponen_penilaian.*.skor.integer' => 'Skor kriteria harus berupa angka bulat 1 sampai 5.',
            'komponen_penilaian.*.skor.min' => 'Skor kriteria minimal bernilai 1.',
            'komponen_penilaian.*.skor.max' => 'Skor kriteria maksimal bernilai 5.',
            'komponen_penilaian.*.komentar.required' => 'Komentar kualitatif per butir kriteria wajib diisi.',
            'komponen_penilaian.*.komentar.min' => 'Komentar kualitatif per butir kriteria tidak boleh kosong.',
        ];
    }
}
