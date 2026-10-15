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
                'nama_kriteria' => 'Rekam Jejak dan Kompetensi Tim Peneliti',
                'bobot' => 20,
                'deskripsi' => 'Kesesuaian keahlian pengusul, riwayat publikasi terdahulu, dan kompetensi tim riset.',
                'urutan' => 1,
            ],
            [
                'nama_kriteria' => 'Urgensi, Kebaruan, dan Tinjauan Pustaka',
                'bobot' => 30,
                'deskripsi' => 'Kebaruan ide (novelty), ketajaman rumusan masalah, dan kemutakhiran tinjauan pustaka.',
                'urutan' => 2,
            ],
            [
                'nama_kriteria' => 'Kejelasan Metodologi dan Kelayakan Pelaksanaan',
                'bobot' => 25,
                'deskripsi' => 'Kesesuaian rancangan metode, ketepatan jadwal tahapan, dan kewajaran alokasi anggaran.',
                'urutan' => 3,
            ],
            [
                'nama_kriteria' => 'Potensi Dampak dan Kelayakan Target Luaran',
                'bobot' => 25,
                'deskripsi' => 'Kelayakan pencapaian luaran wajib/tambahan (jurnal terindeks/HKI/buku) dan manfaat hasil riset.',
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
