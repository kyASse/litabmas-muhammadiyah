<?php

namespace App\Http\Requests\Finance;

use App\Models\Contract;
use App\Models\Funding;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DisburseFundingRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk melakukan pencairan dana.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        // Dapatkan parameter funding dari route
        $fundingParam = $this->route('funding') ?? $this->route('id');
        $funding = $fundingParam instanceof Funding
            ? $fundingParam
            : Funding::withoutGlobalScopes()->find($fundingParam);

        if (! $funding) {
            return false;
        }

        // Super Admin memiliki hak bypass global lintas institusi
        if ($user->hasRole(Role::SUPER_ADMIN)) {
            return true;
        }

        // Peran yang diizinkan: Admin Keuangan dan Admin Kampus
        if ($user->hasAnyRole([Role::ADMIN_KEUANGAN, Role::ADMIN_KAMPUS])) {
            $contract = Contract::withoutGlobalScopes()->find($funding->id_contract);

            return $contract && (int) $user->university_id === (int) $contract->university_id;
        }

        return false;
    }

    /**
     * Aturan validasi untuk proses pencairan dana termin.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bukti_transfer' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'tanggal_pencairan' => ['required', 'date'],
            'catatan_keuangan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Pesan kesalahan kustom untuk validasi berkas dan formulir pencairan.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'bukti_transfer.required' => 'Bukti transfer wajib diunggah.',
            'bukti_transfer.file' => 'Bukti transfer harus berupa berkas yang valid.',
            'bukti_transfer.mimes' => 'Bukti transfer harus berformat PDF, JPG, JPEG, atau PNG.',
            'bukti_transfer.max' => 'Ukuran berkas bukti transfer maksimal 10MB.',
            'tanggal_pencairan.required' => 'Tanggal pencairan wajib diisi.',
            'tanggal_pencairan.date' => 'Format tanggal pencairan tidak valid.',
            'catatan_keuangan.max' => 'Catatan keuangan maksimal 1000 karakter.',
        ];
    }
}
