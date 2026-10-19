<?php

namespace App\Http\Requests;

use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TerminateResearchRequest extends FormRequest
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
            'alasan_terminasi' => ['required', 'string', 'min:20'],
            'berita_acara_path' => ['nullable', 'string'],
            'file_berita_acara' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'file_laporan_akhir' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
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
            'alasan_terminasi.required' => '[WAJIB] Alasan terminasi penelitian wajib diisi.',
            'alasan_terminasi.string' => '[FORMAT] Alasan terminasi harus berupa teks.',
            'alasan_terminasi.min' => '[MINIMAL] Alasan terminasi penelitian minimal :min karakter.',
            'file_berita_acara.mimes' => '[FORMAT] Berkas berita acara harus berupa dokumen PDF.',
            'file_berita_acara.max' => '[UKURAN] Ukuran berkas berita acara maksimal 10MB.',
            'file_laporan_akhir.mimes' => '[FORMAT] Berkas laporan harus berupa dokumen PDF.',
            'file_laporan_akhir.max' => '[UKURAN] Ukuran berkas laporan maksimal 10MB.',
        ];
    }
}
