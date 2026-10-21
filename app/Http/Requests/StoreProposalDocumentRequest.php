<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProposalDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Handled by policy authorization inside controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * Enforces Invariant 6: Single PDF file up to 10MB.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'document_type' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Configure the validator instance with magic bytes check (%PDF-).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->hasFile('file')) {
                $file = $this->file('file');
                if ($file && $file->isValid()) {
                    $content = @file_get_contents($file->getRealPath(), false, null, 0, 8);
                    if ($content === false || ! str_starts_with($content, '%PDF-')) {
                        $validator->errors()->add(
                            'file',
                            '[DOKUMEN_TIDAK_VALID] Berkas dokumen pendukung harus berformat PDF resmi (%PDF-).'
                        );
                    }
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'file.required' => '[WAJIB] Berkas dokumen wajib diunggah.',
            'file.file' => '[KRITIS] Dokumen yang diunggah harus berupa berkas valid.',
            'file.mimes' => '[KRITIS] Format berkas dokumen harus berupa PDF.',
            'file.max' => '[KRITIS] Ukuran berkas dokumen maksimal 10 MB.',
            'document_type.required' => '[WAJIB] Tipe dokumen wajib diisi.',
            'document_type.string' => '[KRITIS] Tipe dokumen harus berupa teks.',
            'document_type.max' => '[KRITIS] Tipe dokumen maksimal 100 karakter.',
            'description.string' => '[KRITIS] Deskripsi harus berupa teks.',
            'description.max' => '[KRITIS] Deskripsi maksimal 1000 karakter.',
        ];
    }
}
