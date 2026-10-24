<?php

namespace Database\Seeders;

use App\Models\AssessmentCriteria;
use Illuminate\Database\Seeder;

class AssessmentCriteriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $criteria = [
            [
                'nama_kriteria' => 'Kebaharuan, Orisinalitas & Nilai Ilmiah',
                'bobot' => 25,
                'deskripsi' => 'Keaslian ide riset, novelty terhadap kajian terdahulu, ketajaman rumusan masalah, dan kedalaman tinjauan pustaka jurnal internasional/nasional terkini.',
                'urutan' => 1,
            ],
            [
                'nama_kriteria' => 'Metodologi Penelitian & Ketepatan Instrumen Analisis',
                'bobot' => 30,
                'deskripsi' => 'Kesesuaian desain metodologi, kejelasan teknik sampling, keabsahan instrumen pengumpulan data, dan ketepatan metode analisis statistik/kualitatif.',
                'urutan' => 2,
            ],
            [
                'nama_kriteria' => 'Kemanfaatan Hasil bagi Pemerintah Kota Yogyakarta & Masyarakat',
                'bobot' => 25,
                'deskripsi' => 'Dampak aplikatif riset untuk rekomendasi kebijakan Pemkot Yogyakarta, pemecahan masalah perkotaan, dan kemanfaatan nyata bagi masyarakat luas.',
                'urutan' => 3,
            ],
            [
                'nama_kriteria' => 'Kelayakan Jadwal, Rincian Anggaran (RAB), dan Target Luaran',
                'bobot' => 20,
                'deskripsi' => 'Kewajaran alokasi anggaran belanja sesuai Standar Biaya Masukan (SBM), kepatuhan jadwal tahapan 1 tahun, serta ketercapaian target luaran wajib dan tambahan.',
                'urutan' => 4,
            ],
        ];

        foreach ($criteria as $item) {
            AssessmentCriteria::updateOrCreate(
                ['nama_kriteria' => $item['nama_kriteria']],
                $item
            );
        }

        $this->command->info('Standard Assessment Criteria rubric seeded successfully.');
    }
}
