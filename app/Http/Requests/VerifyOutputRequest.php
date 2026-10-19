<?php

namespace App\Http\Requests;

use App\Models\ResearchOutput;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class VerifyOutputRequest extends FormRequest
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

        $isAuthorizedRole = $user->hasAnyRole([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::ADMIN_KAMPUS, Role::SUPER_ADMIN, 'Admin Kampus', 'Super Admin'], true);

        if (! $isAuthorizedRole) {
            return false;
        }

        $isSuperAdmin = $user->hasAnyRole([Role::SUPER_ADMIN])
            || in_array($user->role?->name, [Role::SUPER_ADMIN, 'Super Admin'], true);
        if ($isSuperAdmin) {
            return true;
        }

        $output = $this->route('output');
        if (is_numeric($output)) {
            $output = ResearchOutput::find($output);
        }

        if ($output instanceof ResearchOutput) {
            $outputUniversityId = $output->proposal?->university_id;
            return (int) $user->university_id === (int) $outputUniversityId;
        }

        return true;
    }

    /**
     * Prepare inputs for validation to support both camelCase and snake_case / legacy aliases.
     */
    protected function prepareForValidation(): void
    {
        // Support 'action' input ('approved' => 'Verified', 'rejected' => 'Rejected')
        if ($this->has('action') && ! $this->has('status_verifikasi')) {
            $action = strtolower((string) $this->input('action'));
            if ($action === 'approved') {
                $this->merge(['status_verifikasi' => 'Verified']);
            } elseif ($action === 'rejected') {
                $this->merge(['status_verifikasi' => 'Rejected']);
            }
        }

        // Support 'keterangan' input as alias for 'catatan_verifikasi'
        if ($this->has('keterangan') && ! $this->has('catatan_verifikasi')) {
            $this->merge(['catatan_verifikasi' => $this->input('keterangan')]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status_verifikasi' => ['required', 'string', 'in:Verified,Rejected'],
            'catatan_verifikasi' => ['required_if:status_verifikasi,Rejected', 'nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status_verifikasi.required' => '[WAJIB] Status verifikasi luaran wajib ditentukan.',
            'status_verifikasi.in' => '[KRITIS] Status verifikasi harus berupa Verified atau Rejected.',
            'catatan_verifikasi.required_if' => '[WAJIB] Catatan verifikasi wajib diisi ketika luaran ditolak.',
            'catatan_verifikasi.max' => '[KRITIS] Catatan verifikasi maksimal 1000 karakter.',
        ];
    }
}
