<?php

namespace App\Http\Requests\Progress;

use App\Models\MonevSchedule;
use App\Models\Proposal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProgressReportRequest extends FormRequest
{
    /**
     * Otorisasi pengajuan laporan kemajuan oleh dosen/peneliti.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Aturan validasi pengunggahan laporan kemajuan riset (PRD Modul 4).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_proposal' => ['required', 'integer', 'exists:proposals,id'],
            'id_monev_schedule' => ['required', 'integer', 'exists:monev_schedules,id'],
            'persentase_kemajuan' => ['required', 'integer', 'min:1', 'max:100'],
            'ringkasan_progres' => ['required', 'string', 'min:20'],
            'catatan_kendala' => ['nullable', 'string'],
            'file_laporan_kemajuan' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'file_logbook' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    /**
     * Penamaan atribut untuk pesan validasi.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'id_proposal' => 'proposal penelitian',
            'id_monev_schedule' => 'jadwal monev',
            'persentase_kemajuan' => 'persentase kemajuan',
            'ringkasan_progres' => 'ringkasan progres',
            'catatan_kendala' => 'catatan kendala',
            'file_laporan_kemajuan' => 'berkas laporan kemajuan',
            'file_logbook' => 'berkas logbook aktivitas',
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
            'id_proposal.required' => 'Proposal riset wajib dipilih.',
            'id_proposal.exists' => 'Proposal riset yang dipilih tidak ditemukan.',
            'id_monev_schedule.required' => 'Jadwal tahapan monev wajib dipilih.',
            'id_monev_schedule.exists' => 'Jadwal tahapan monev tidak ditemukan.',
            'persentase_kemajuan.required' => 'Persentase kemajuan wajib diisi.',
            'persentase_kemajuan.integer' => 'Persentase kemajuan harus berupa bilangan bulat.',
            'persentase_kemajuan.min' => 'Persentase kemajuan minimal 1 persen.',
            'persentase_kemajuan.max' => 'Persentase kemajuan maksimal 100 persen.',
            'ringkasan_progres.required' => 'Ringkasan progres riset wajib diisi.',
            'ringkasan_progres.min' => 'Ringkasan progres riset minimal 20 karakter.',
            'file_laporan_kemajuan.required' => 'Berkas laporan kemajuan riset wajib diunggah.',
            'file_laporan_kemajuan.file' => 'Berkas laporan kemajuan harus berupa berkas valid.',
            'file_laporan_kemajuan.mimes' => 'Berkas laporan kemajuan harus berupa berkas PDF.',
            'file_laporan_kemajuan.max' => 'Ukuran berkas laporan kemajuan maksimal 10MB (10240 KB).',
            'file_logbook.file' => 'Berkas logbook harus berupa berkas valid.',
            'file_logbook.mimes' => 'Berkas logbook harus berupa berkas PDF.',
            'file_logbook.max' => 'Ukuran berkas logbook maksimal 10MB (10240 KB).',
        ];
    }

    /**
     * Validasi kustom: jendela waktu monev, hak kepemilikan proposal, dan inspeksi magic bytes (%PDF-).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            // 1. Verifikasi Jendela Waktu Monev Aktif & Multi-tenancy
            if ($this->id_monev_schedule) {
                $schedule = MonevSchedule::find($this->id_monev_schedule);
                if (! $schedule) {
                    $v->errors()->add(
                        'id_monev_schedule',
                        'Jadwal monev tidak ditemukan pada institusi Anda.'
                    );
                } elseif (! $schedule->isOpenForSubmission()) {
                    $v->errors()->add(
                        'id_monev_schedule',
                        '[TENGGAT_LEWAT] Periode unggah laporan kemajuan untuk tahap ini belum dibuka atau telah berakhir.'
                    );
                }
            }

            // 2. Verifikasi Kepemilikan Proposal oleh Peneliti & Multi-tenancy
            if ($this->id_proposal) {
                $proposal = Proposal::find($this->id_proposal);
                $user = $this->user();
                if (! $proposal) {
                    $v->errors()->add(
                        'id_proposal',
                        'Proposal riset tidak ditemukan pada institusi Anda.'
                    );
                } elseif ($user && ! $user->isSuperAdmin() && (int) $proposal->id_pengusul !== (int) $user->id) {
                    $v->errors()->add(
                        'id_proposal',
                        'Anda tidak memiliki hak akses untuk mengunggah laporan pada proposal ini.'
                    );
                }
            }

            // 3. Inspeksi Magic Bytes %PDF- pada file_laporan_kemajuan
            if ($this->hasFile('file_laporan_kemajuan')) {
                $file = $this->file('file_laporan_kemajuan');
                if ($file && $file->isValid()) {
                    $content = @file_get_contents($file->getRealPath(), false, null, 0, 8);
                    if ($content === false || ! str_starts_with($content, '%PDF-')) {
                        $v->errors()->add(
                            'file_laporan_kemajuan',
                            '[DOKUMEN_TIDAK_VALID] Berkas laporan kemajuan harus berformat PDF resmi (%PDF-).'
                        );
                    }
                }
            }

            // 4. Inspeksi Magic Bytes %PDF- pada file_logbook (jika disertakan)
            if ($this->hasFile('file_logbook')) {
                $file = $this->file('file_logbook');
                if ($file && $file->isValid()) {
                    $content = @file_get_contents($file->getRealPath(), false, null, 0, 8);
                    if ($content === false || ! str_starts_with($content, '%PDF-')) {
                        $v->errors()->add(
                            'file_logbook',
                            '[DOKUMEN_TIDAK_VALID] Berkas logbook harus berformat PDF resmi (%PDF-).'
                        );
                    }
                }
            }
        });
    }
}
