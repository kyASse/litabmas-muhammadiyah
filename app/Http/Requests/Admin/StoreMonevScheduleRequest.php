<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreMonevScheduleRequest extends FormRequest
{
    /**
     * Otorisasi pengguna untuk penetapan jadwal tahapan monev.
     * Hanya Admin Kampus dan Super Admin yang diizinkan.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->hasAnyRole([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN])
            || $user->isAdminKampus()
            || $user->isSuperAdmin();
    }

    /**
     * Aturan validasi pembentukan jadwal tahapan monev (PRD Modul 4).
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'nama_tahap' => ['required', 'string', 'max:255'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'deskripsi' => ['nullable', 'string'],
        ];

        if ($this->user()?->isSuperAdmin()) {
            $rules['university_id'] = ['nullable', 'integer', 'exists:universities,id'];
        }

        return $rules;
    }

    /**
     * Penamaan atribut untuk pesan validasi.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nama_tahap' => 'nama tahap monev',
            'tanggal_mulai' => 'tanggal mulai',
            'tanggal_selesai' => 'tanggal selesai',
            'deskripsi' => 'deskripsi tahap monev',
            'university_id' => 'institusi universitas',
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
            'nama_tahap.required' => 'Nama tahap monev wajib diisi.',
            'nama_tahap.max' => 'Nama tahap monev maksimal 255 karakter.',
            'tanggal_mulai.required' => 'Tanggal mulai periode monev wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_selesai.required' => 'Tanggal selesai periode monev wajib diisi.',
            'tanggal_selesai.date' => 'Format tanggal selesai tidak valid.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama dengan atau setelah tanggal mulai.',
        ];
    }
}
