<?php

namespace App\Http\Requests;

use App\Models\ResearchSchema;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchemaRequest extends FormRequest
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

        return $user->can('create', ResearchSchema::class)
            || $user->isSuperAdmin()
            || $user->isAdminKampus();
    }

    /**
     * Prepare input before validation.
     * Maps alias input keys to canonical 21-table schema attributes.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('name') && ! $this->has('nama_skema')) {
            $merge['nama_skema'] = $this->input('name');
        }

        if ($this->has('description') && ! $this->has('deskripsi')) {
            $merge['deskripsi'] = $this->input('description');
        }

        if ($this->has('max_funding') && ! $this->has('biaya_maksimal')) {
            $merge['biaya_maksimal'] = $this->input('max_funding');
        }

        if ($this->has('start_date') && ! $this->has('tanggal_mulai')) {
            $merge['tanggal_mulai'] = $this->input('start_date');
        }

        if ($this->has('end_date') && ! $this->has('tanggal_selesai')) {
            $merge['tanggal_selesai'] = $this->input('end_date');
        }

        // Default fallbacks for required fields if omitted
        if (! $this->has('biaya_maksimal') && ! isset($merge['biaya_maksimal'])) {
            $merge['biaya_maksimal'] = 10000000;
        }

        if (! $this->has('tanggal_mulai') && ! isset($merge['tanggal_mulai'])) {
            $merge['tanggal_mulai'] = now()->toDateString();
        }

        if (! $this->has('tanggal_selesai') && ! isset($merge['tanggal_selesai'])) {
            $merge['tanggal_selesai'] = now()->addMonths(12)->toDateString();
        }

        if ($merge) {
            $this->merge($merge);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama_skema' => [
                'required',
                'string',
                'max:255',
                Rule::unique('research_schemas', 'nama_skema'),
            ],
            'deskripsi' => ['nullable', 'string', 'max:5000'],
            'biaya_maksimal' => ['required', 'numeric', 'min:1000000'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'file_panduan' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Configure the validator instance.
     * Mirror errors from canonical attributes to alias keys for backward compatibility.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->has('nama_skema')) {
                foreach ($validator->errors()->get('nama_skema') as $msg) {
                    $validator->errors()->add('name', $msg);
                }
            }
            if ($validator->errors()->has('deskripsi')) {
                foreach ($validator->errors()->get('deskripsi') as $msg) {
                    $validator->errors()->add('description', $msg);
                }
            }
            if ($validator->errors()->has('biaya_maksimal')) {
                foreach ($validator->errors()->get('biaya_maksimal') as $msg) {
                    $validator->errors()->add('max_funding', $msg);
                }
            }
            if ($validator->errors()->has('tanggal_mulai')) {
                foreach ($validator->errors()->get('tanggal_mulai') as $msg) {
                    $validator->errors()->add('start_date', $msg);
                }
            }
            if ($validator->errors()->has('tanggal_selesai')) {
                foreach ($validator->errors()->get('tanggal_selesai') as $msg) {
                    $validator->errors()->add('end_date', $msg);
                }
            }
        });
    }
}
