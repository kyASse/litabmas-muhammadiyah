<?php

namespace App\Http\Requests;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $proposal = $this->route('proposal');
        if (! $proposal instanceof Proposal) {
            $proposal = Proposal::find($proposal);
        }

        if (! $proposal) {
            return false;
        }

        return $this->user()->can('update', $proposal);
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
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
        $isSubmit = $this->input('action') === 'submit';

        return [
            'id_skema_pendanaan' => ['nullable', 'integer', 'exists:research_schemas,id'],
            'judul_penelitian' => ['nullable', 'string', 'max:255'],
            'abstrak' => ['nullable', 'string'],
            'latar_belakang' => ['nullable', 'string'],
            'biaya_yang_diusulkan' => ['nullable', 'numeric', 'min:0'],
            'action' => ['nullable', 'string', 'in:draft,submit,submit_kampus,submit-kampus,campus'],
            'file_dokumen_proposal' => [
                'nullable',
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
            // Check deadline if submitting
            if ($this->input('action') === 'submit' && $this->id_skema_pendanaan) {
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

            // PDF inspection if uploaded
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
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'id_skema_pendanaan.exists' => 'Skema penelitian yang dipilih tidak valid.',
            'judul_penelitian.max' => 'Judul penelitian maksimal 255 karakter.',
            'biaya_yang_diusulkan.numeric' => 'Biaya yang diusulkan harus berupa angka.',
            'file_dokumen_proposal.file' => 'Dokumen proposal harus berupa berkas.',
            'file_dokumen_proposal.mimes' => 'Format dokumen proposal harus berformat PDF.',
            'file_dokumen_proposal.max' => 'Ukuran berkas dokumen proposal maksimal 10 MB.',
            'action.in' => 'Aksi proposal tidak valid.',
        ];
    }
}
