<?php

namespace App\Http\Requests;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Prepare input before validation (canonical & legacy mapping).
     */
    protected function prepareForValidation(): void
    {
        // Map legacy to canonical
        if (! $this->has('id_skema_pendanaan') && $this->has('research_schema_id')) {
            $this->merge(['id_skema_pendanaan' => $this->input('research_schema_id')]);
        }
        if (! $this->has('judul_penelitian') && $this->has('title')) {
            $this->merge(['judul_penelitian' => $this->input('title')]);
        }
        if (! $this->has('judul_penelitian') && $this->has('judul')) {
            $this->merge(['judul_penelitian' => $this->input('judul')]);
        }
        if (! $this->has('abstrak') && $this->has('description')) {
            $this->merge(['abstrak' => $this->input('description')]);
        }
        if (! $this->has('abstrak') && $this->has('deskripsi')) {
            $this->merge(['abstrak' => $this->input('deskripsi')]);
        }
        if (! $this->has('biaya_yang_diusulkan') && $this->has('biaya')) {
            $this->merge(['biaya_yang_diusulkan' => $this->input('biaya')]);
        }

        // Map canonical to legacy
        if (! $this->has('title') && $this->has('judul_penelitian')) {
            $this->merge(['title' => $this->input('judul_penelitian')]);
        }
        if (! $this->has('description') && $this->has('abstrak')) {
            $this->merge(['description' => $this->input('abstrak')]);
        }
        if (! $this->has('research_schema_id') && $this->has('id_skema_pendanaan')) {
            $this->merge(['research_schema_id' => $this->input('id_skema_pendanaan')]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isDraft = $this->input('action') === 'draft';

        return [
            'id_skema_pendanaan' => ['required', 'integer', 'exists:research_schemas,id'],
            'judul_penelitian' => ['required', 'string', 'max:255'],
            'abstrak' => ['required', 'string', 'min:100'],
            'latar_belakang' => ['nullable', 'string'],
            'biaya_yang_diusulkan' => ['required', 'numeric', 'min:0'],
            'action' => ['nullable', 'string', 'in:draft,submit,submit_kampus,submit-kampus,campus'],
            'file_dokumen_proposal' => [
                $isDraft ? 'nullable' : 'required',
                'file',
                'mimes:pdf',
                'max:10240',
            ],
            'members' => ['nullable', 'array'],
            'members.*.user_id' => ['required_with:members', 'exists:users,id'],
            'members.*.peran' => ['nullable', 'string', 'max:100'],
            'members.*.alokasi_jam_per_minggu' => ['nullable', 'integer', 'min:1', 'max:168'],
            // Legacy aliases
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'research_schema_id' => ['nullable', 'exists:research_schemas,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // 1. Deadline check: now() <= schema.tanggal_selesai
            if ($this->id_skema_pendanaan) {
                $schema = ResearchSchema::find($this->id_skema_pendanaan);
                if ($schema && $schema->tanggal_selesai) {
                    $deadline = Carbon::parse($schema->tanggal_selesai)->endOfDay();
                    if (now()->greaterThan($deadline)) {
                        $validator->errors()->add(
                            'id_skema_pendanaan',
                            '[TENGGAT_LEWAT] Batas waktu penerimaan usulan untuk skema ini telah berakhir pada '.$deadline->format('d/m/Y H:i:s')
                        );
                    }
                }
            }

            // 2. Magic bytes and mime check for PDF
            if ($this->hasFile('file_dokumen_proposal')) {
                $file = $this->file('file_dokumen_proposal');
                if ($file && $file->isValid()) {
                    $content = @file_get_contents($file->getRealPath());
                    $isPdfMime = in_array($file->getMimeType(), ['application/pdf', 'application/x-pdf'], true)
                        || in_array($file->getClientMimeType(), ['application/pdf', 'application/x-pdf'], true);

                    if ($content !== false && strlen($content) >= 4) {
                        $isPdfMagic = str_starts_with($content, '%PDF');
                        if (! $isPdfMagic) {
                            $validator->errors()->add(
                                'file_dokumen_proposal',
                                '[DOKUMEN_TIDAK_VALID] Berkas dokumen proposal harus berformat PDF resmi (%PDF-).'
                            );
                        }
                    } elseif (! $isPdfMime) {
                        $validator->errors()->add(
                            'file_dokumen_proposal',
                            '[DOKUMEN_TIDAK_VALID] Berkas dokumen proposal harus berupa berkas PDF.'
                        );
                    }
                }
            }

            // 3. Duplicate title check per user per schema in the current calendar year (rules.md Bab 2.2 Aturan 2)
            $userId = $this->user()?->id;
            $judul = trim((string) ($this->judul_penelitian ?? $this->title ?? ''));
            if ($userId && $this->id_skema_pendanaan && $judul !== '') {
                $duplicateExists = Proposal::where('id_pengusul', $userId)
                    ->where('id_skema_pendanaan', $this->id_skema_pendanaan)
                    ->whereRaw('LOWER(TRIM(judul_penelitian)) = ?', [strtolower($judul)])
                    ->whereYear('created_at', now()->year)
                    ->exists();

                if ($duplicateExists) {
                    $validator->errors()->add(
                        'judul_penelitian',
                        '[DUPLIKASI_JUDUL] Anda telah mengajukan proposal dengan judul yang sama pada skema dan tahun anggaran ini.'
                    );
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
            'id_skema_pendanaan.required' => 'Skema penelitian wajib dipilih.',
            'id_skema_pendanaan.exists' => 'Skema penelitian yang dipilih tidak valid.',
            'judul_penelitian.required' => 'Judul penelitian wajib diisi.',
            'judul_penelitian.max' => 'Judul penelitian maksimal 255 karakter.',
            'abstrak.required' => 'Abstrak proposal wajib diisi.',
            'abstrak.min' => 'Abstrak proposal minimal 100 karakter.',
            'biaya_yang_diusulkan.required' => 'Biaya yang diusulkan wajib diisi.',
            'biaya_yang_diusulkan.numeric' => 'Biaya yang diusulkan harus berupa angka.',
            'file_dokumen_proposal.required' => 'Dokumen proposal wajib diunggah saat mengajukan proposal.',
            'file_dokumen_proposal.file' => 'Dokumen proposal harus berupa berkas.',
            'file_dokumen_proposal.mimes' => 'Format dokumen proposal harus berformat PDF.',
            'file_dokumen_proposal.max' => 'Ukuran berkas dokumen proposal maksimal 10 MB.',
            'action.in' => 'Aksi proposal tidak valid.',
        ];
    }
}
