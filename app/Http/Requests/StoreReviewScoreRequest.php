<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewScoreRequest extends FormRequest
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

        return $user->hasRole(Role::REVIEWER)
            || $user->hasRole('Reviewer')
            || (method_exists($user, 'isReviewer') && $user->isReviewer());
    }

    /**
     * Prepare inputs for validation (support legacy aliases).
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
        }

        if (! $this->has('catatan_evaluasi')) {
            $notes = $this->input('notes') ?? $this->input('feedback') ?? $this->input('comments');
            if ($notes !== null) {
                $this->merge(['catatan_evaluasi' => $notes]);
            }
        }

        if (! $this->has('keputusan_rekomendasi')) {
            $rec = $this->input('recommendation');
            if ($rec !== null) {
                $map = [
                    'accepted' => 'Diterima',
                    'revision' => 'Revisi',
                    'rejected' => 'Ditolak',
                    'diterima' => 'Diterima',
                    'revisi' => 'Revisi',
                    'ditolak' => 'Ditolak',
                ];
                $this->merge(['keputusan_rekomendasi' => $map[strtolower((string) $rec)] ?? $rec]);
            }
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
            'komponen_penilaian' => 'required|array|min:1',
            'catatan_evaluasi' => 'required|string|min:50',
            'keputusan_rekomendasi' => 'required|in:Diterima,Revisi,Ditolak',
        ];
    }
}
