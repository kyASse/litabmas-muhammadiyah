<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCriteriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isSuperAdmin();
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('name') && ! $this->has('nama_kriteria')) {
            $merge['nama_kriteria'] = $this->input('name');
        }
        if ($this->has('question') && ! $this->has('nama_kriteria')) {
            $merge['nama_kriteria'] = $this->input('question');
        }
        if ($this->has('stage') && ! $this->has('tahap_seleksi')) {
            $merge['tahap_seleksi'] = $this->input('stage');
        }
        if (! $this->has('tahap_seleksi') && ! isset($merge['tahap_seleksi'])) {
            $merge['tahap_seleksi'] = 'Substansi';
        }
        if ($this->has('type') && ! $this->has('tipe_jawaban')) {
            $merge['tipe_jawaban'] = $this->input('type');
        }
        if (! $this->has('tipe_jawaban') && ! isset($merge['tipe_jawaban'])) {
            $tahap = $merge['tahap_seleksi'] ?? $this->input('tahap_seleksi');
            $merge['tipe_jawaban'] = $tahap === 'Administrasi' ? 'Ya_Tidak' : 'Pilihan_Ganda';
        }
        if ($this->has('weight') && ! $this->has('bobot')) {
            $merge['bobot'] = $this->input('weight');
        }
        if (! $this->has('bobot') && ! isset($merge['bobot'])) {
            $merge['bobot'] = 0;
        }
        if ($this->has('order') && ! $this->has('urutan')) {
            $merge['urutan'] = $this->input('order');
        }
        if ($this->has('description') && ! $this->has('deskripsi')) {
            $merge['deskripsi'] = $this->input('description');
        }
        if ($merge) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'nama_kriteria' => ['required', 'string', 'max:255'],
            'tahap_seleksi' => ['required', 'in:Administrasi,Substansi'],
            'tipe_jawaban' => ['required', 'in:Ya_Tidak,Pilihan_Ganda'],
            'bobot' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'urutan' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'pilihan_skor' => ['nullable', 'array'],
        ];
    }
}
