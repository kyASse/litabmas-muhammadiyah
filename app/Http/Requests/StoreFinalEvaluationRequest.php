<?php

namespace App\Http\Requests;

use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreFinalEvaluationRequest extends FormRequest
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

        // Researcher must be the owner of the proposal and from the same tenant
        return (int) $user->id === (int) $proposal->id_pengusul
            && (int) $user->university_id === (int) $proposal->university_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ringkasan_hasil' => ['required', 'string'],
            'file_laporan_akhir' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // 1. Magic bytes inspection for PDF (%PDF-)
            if ($this->hasFile('file_laporan_akhir')) {
                $file = $this->file('file_laporan_akhir');
                if ($file && $file->isValid()) {
                    $handle = fopen($file->getRealPath(), 'rb');
                    $header = fread($handle, 5);
                    fclose($handle);

                    if ($header !== '%PDF-') {
                        $validator->errors()->add('file_laporan_akhir', '[KRITIS] Berkas harus berupa dokumen PDF yang valid (%PDF-).');
                    }
                }
            }

            // 2. Precondition check for final evaluation
            $proposal = $this->route('proposal');
            if (! ($proposal instanceof Proposal)) {
                $proposal = Proposal::find($proposal);
            }

            if (! $proposal) {
                return;
            }

            $wajibOutputs = $proposal->researchOutputs()
                ->where('target_status', 'Wajib')
                ->get();

            // Must have at least 1 output marked 'Wajib'
            if ($wajibOutputs->isEmpty()) {
                abort(422, '[BLOKIR] Pengajuan evaluasi akhir diblokir. Seluruh luaran wajib harus telah berstatus Terverifikasi (Verified) oleh LPPM.');
            }

            // All outputs marked 'Wajib' must have status 'Verified'
            $unverifiedWajib = $wajibOutputs->filter(fn ($output) => $output->status_verifikasi !== 'Verified');
            if ($unverifiedWajib->isNotEmpty()) {
                abort(422, '[BLOKIR] Pengajuan evaluasi akhir diblokir. Seluruh luaran wajib harus telah berstatus Terverifikasi (Verified) oleh LPPM.');
            }
        });
    }

    /**
     * Custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ringkasan_hasil.required' => '[WAJIB] Ringkasan hasil penelitian wajib diisi.',
            'file_laporan_akhir.required' => '[WAJIB] Berkas naskah laporan akhir wajib diunggah.',
            'file_laporan_akhir.file' => '[KRITIS] Berkas yang diunggah harus berupa file yang valid.',
            'file_laporan_akhir.mimes' => '[KRITIS] Berkas laporan akhir wajib berformat PDF.',
            'file_laporan_akhir.max' => '[KRITIS] Ukuran berkas laporan akhir maksimal 10MB.',
        ];
    }
}
