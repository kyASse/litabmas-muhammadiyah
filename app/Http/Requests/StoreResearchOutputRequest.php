<?php

namespace App\Http\Requests;

use App\Models\BookOutput;
use App\Models\HkiOutput;
use App\Models\JournalOutput;
use App\Models\Proposal;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreResearchOutputRequest extends FormRequest
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

        $proposalId = $this->input('id_proposal');
        if (! $proposalId) {
            return true;
        }

        $proposal = Proposal::find($proposalId);
        if (! $proposal) {
            return true;
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

        // Researcher must be the author of the proposal
        return (int) $user->id === (int) $proposal->id_pengusul;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'id_proposal' => ['required', 'integer', 'exists:proposals,id'],
            'tipe_luaran' => ['required', 'string', 'in:Journal,Book,Hki,Product'],
            'target_status' => ['required', 'string', 'in:Wajib,Tambahan'],
            'file_dokumen' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ];

        $tipeLuaran = $this->input('tipe_luaran');

        if ($tipeLuaran === 'Journal') {
            $rules['nama_jurnal'] = ['required', 'string', 'max:255'];
            $rules['judul_artikel'] = ['required', 'string', 'max:255'];
            $rules['issn'] = ['nullable', 'string', 'max:50'];
            $rules['indeksasi'] = ['required', 'string', 'in:Scopus,Sinta_1,Sinta_2,Sinta_3,Sinta_4,Internasional,Nasional'];
            $rules['status_publikasi'] = ['required', 'string', 'in:Submitted,Accepted,Published'];
            $rules['doi_url'] = ['nullable', 'string', 'max:255'];
        } elseif ($tipeLuaran === 'Book') {
            $rules['judul_buku'] = ['required', 'string', 'max:255'];
            $rules['isbn'] = ['required', 'string', 'max:50'];
            $rules['penerbit'] = ['required', 'string', 'max:255'];
            $rules['tahun_terbit'] = ['required', 'integer', 'min:1900', 'max:'.(date('Y') + 5)];
            $rules['jumlah_halaman'] = ['nullable', 'integer', 'min:1'];
        } elseif ($tipeLuaran === 'Hki') {
            $rules['judul_ciptaan'] = ['required', 'string', 'max:255'];
            $rules['jenis_hki'] = ['required', 'string', 'in:Hak_Cipta,Paten,Desain_Industri'];
            $rules['nomor_pendaftaran'] = ['nullable', 'string', 'max:100'];
            $rules['nomor_sertifikat'] = ['nullable', 'string', 'max:100'];
        } elseif ($tipeLuaran === 'Product') {
            $rules['nama_produk'] = ['required', 'string', 'max:255'];
            $rules['deskripsi_produk'] = ['required', 'string'];
            $rules['tingkat_kesiapan_teknologi'] = ['required', 'integer', 'min:1', 'max:9'];
        }

        return $rules;
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // 1. Magic bytes inspection for PDF
            if ($this->hasFile('file_dokumen')) {
                $file = $this->file('file_dokumen');
                if ($file && $file->isValid()) {
                    $handle = fopen($file->getRealPath(), 'rb');
                    $header = fread($handle, 5);
                    fclose($handle);

                    if ($header !== '%PDF-') {
                        $validator->errors()->add('file_dokumen', '[KRITIS] Berkas harus berupa dokumen PDF yang valid (%PDF-).');
                    }
                }
            }

            // 2. Output Deduplication Guard scoped to institution
            $proposal = Proposal::find($this->input('id_proposal'));
            $universityId = $proposal?->university_id ?? $this->user()?->university_id;

            if (! $proposal || ! $universityId) {
                return;
            }

            $tipeLuaran = $this->input('tipe_luaran');

            if ($tipeLuaran === 'Journal' && $this->filled('doi_url')) {
                $rawDoi = trim((string) $this->input('doi_url'));
                $canonicalDoi = strtolower(preg_replace('#^https?://(dx\.)?doi\.org/#i', '', $rawDoi));

                $exists = JournalOutput::whereHas('researchOutput.proposal', function ($q) use ($universityId) {
                    $q->where('university_id', $universityId);
                })->where(function ($query) use ($rawDoi, $canonicalDoi) {
                    $query->whereRaw('LOWER(TRIM(doi_url)) = ?', [strtolower($rawDoi)])
                        ->orWhereRaw("LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(doi_url, 'https://doi.org/', ''), 'http://doi.org/', ''), 'https://dx.doi.org/', ''), 'http://dx.doi.org/', ''))) = ?", [$canonicalDoi]);
                })->exists();

                if ($exists) {
                    $validator->errors()->add('doi_url', '[DUPLIKASI] Nomor DOI ini telah terdaftar pada luaran penelitian lain di institusi Anda.');
                }
            } elseif ($tipeLuaran === 'Book' && $this->filled('isbn')) {
                $cleanIsbn = preg_replace('/[^0-9X]/i', '', strtoupper(trim((string) $this->input('isbn'))));

                $exists = BookOutput::whereHas('researchOutput.proposal', function ($q) use ($universityId) {
                    $q->where('university_id', $universityId);
                })->whereRaw("UPPER(REPLACE(REPLACE(isbn, '-', ''), ' ', '')) = ?", [$cleanIsbn])
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('isbn', '[DUPLIKASI] Nomor ISBN ini telah terdaftar pada luaran buku lain di institusi Anda.');
                }
            } elseif ($tipeLuaran === 'Hki') {
                if ($this->filled('nomor_pendaftaran')) {
                    $cleanReg = strtoupper(trim((string) $this->input('nomor_pendaftaran')));

                    $exists = HkiOutput::whereHas('researchOutput.proposal', function ($q) use ($universityId) {
                        $q->where('university_id', $universityId);
                    })->whereRaw('UPPER(TRIM(nomor_pendaftaran)) = ?', [$cleanReg])
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add('nomor_pendaftaran', '[DUPLIKASI] Nomor pendaftaran HKI ini telah terdaftar pada luaran lain di institusi Anda.');
                    }
                }

                if ($this->filled('nomor_sertifikat')) {
                    $cleanCert = strtoupper(trim((string) $this->input('nomor_sertifikat')));

                    $exists = HkiOutput::whereHas('researchOutput.proposal', function ($q) use ($universityId) {
                        $q->where('university_id', $universityId);
                    })->whereRaw('UPPER(TRIM(nomor_sertifikat)) = ?', [$cleanCert])
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add('nomor_sertifikat', '[DUPLIKASI] Nomor sertifikat HKI ini telah terdaftar pada luaran lain di institusi Anda.');
                    }
                }
            }
        });
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_proposal.required' => '[WAJIB] Usulan proposal penelitian wajib dipilih.',
            'id_proposal.exists' => '[KRITIS] Usulan proposal penelitian tidak ditemukan.',
            'tipe_luaran.required' => '[WAJIB] Tipe luaran penelitian wajib dipilih.',
            'tipe_luaran.in' => '[KRITIS] Tipe luaran harus berupa Journal, Book, Hki, atau Product.',
            'target_status.required' => '[WAJIB] Status target luaran wajib dipilih.',
            'target_status.in' => '[KRITIS] Status target harus berupa Wajib atau Tambahan.',
            'file_dokumen.required' => '[WAJIB] Berkas bukti fisik luaran wajib diunggah.',
            'file_dokumen.file' => '[KRITIS] Berkas yang diunggah harus berupa file yang valid.',
            'file_dokumen.mimes' => '[KRITIS] Berkas luaran wajib berformat PDF.',
            'file_dokumen.max' => '[KRITIS] Ukuran berkas luaran maksimal 10MB.',
            'nama_jurnal.required' => '[WAJIB] Nama jurnal ilmiah wajib diisi.',
            'judul_artikel.required' => '[WAJIB] Judul artikel ilmiah wajib diisi.',
            'indeksasi.required' => '[WAJIB] Klasifikasi indeksasi jurnal wajib dipilih.',
            'status_publikasi.required' => '[WAJIB] Status publikasi artikel wajib dipilih.',
            'judul_buku.required' => '[WAJIB] Judul buku wajib diisi.',
            'isbn.required' => '[WAJIB] Nomor ISBN buku wajib diisi.',
            'penerbit.required' => '[WAJIB] Nama penerbit buku wajib diisi.',
            'tahun_terbit.required' => '[WAJIB] Tahun terbit buku wajib diisi.',
            'judul_ciptaan.required' => '[WAJIB] Judul ciptaan/invensi HKI wajib diisi.',
            'jenis_hki.required' => '[WAJIB] Jenis HKI wajib dipilih.',
            'nama_produk.required' => '[WAJIB] Nama produk/prototipe wajib diisi.',
            'deskripsi_produk.required' => '[WAJIB] Deskripsi produk wajib diisi.',
            'tingkat_kesiapan_teknologi.required' => '[WAJIB] Tingkat kesiapan teknologi (TKT) wajib diisi.',
            'tingkat_kesiapan_teknologi.min' => '[KRITIS] Nilai TKT minimal adalah 1.',
            'tingkat_kesiapan_teknologi.max' => '[KRITIS] Nilai TKT maksimal adalah 9.',
        ];
    }
}
