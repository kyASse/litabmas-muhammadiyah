<?php

namespace Database\Seeders;

use App\Models\ResearchSchema;
use App\Models\University;
use Illuminate\Database\Seeder;

class ResearchSchemaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $umy = University::where('code', 'UMY')->first();
        if (! $umy) {
            return;
        }

        $schemas = [
            [
                'university_id' => $umy->id,
                'nama_skema' => 'Penelitian Dosen Pemula (PDP) 2026',
                'deskripsi' => 'Skema penelitian pembinaan untuk membina kemampuan meneliti dosen pemula pada perguruan tinggi.',
                'biaya_maksimal' => 20000000,
                'tanggal_mulai' => now()->startOfYear()->toDateString(),
                'tanggal_selesai' => now()->endOfYear()->toDateString(),
                'is_active' => true,
            ],
            [
                'university_id' => $umy->id,
                'nama_skema' => 'Penelitian Terapan Unggulan Perguruan Tinggi (PTUPT) 2026',
                'deskripsi' => 'Skema penelitian terapan yang berorientasi pada produk inovasi iptek yang memiliki tingkat kesiapan teknologi terukur.',
                'biaya_maksimal' => 50000000,
                'tanggal_mulai' => now()->startOfYear()->toDateString(),
                'tanggal_selesai' => now()->endOfYear()->toDateString(),
                'is_active' => true,
            ],
        ];

        foreach ($schemas as $schemaData) {
            ResearchSchema::updateOrCreate(
                [
                    'university_id' => $schemaData['university_id'],
                    'nama_skema' => $schemaData['nama_skema'],
                ],
                $schemaData
            );
        }

        $this->command->info('Research schemas seeded successfully.');
    }
}
