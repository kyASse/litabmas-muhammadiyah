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
                'nama_skema' => 'Penelitian Dasar Pengembangan IPTEK',
                'deskripsi' => 'Skema penelitian berorientasi pada penjelasan dasar ilmiah dan eksplorasi teoritis keilmuan.',
                'biaya_maksimal' => 25000000,
                'tanggal_mulai' => now()->startOfYear()->toDateString(),
                'tanggal_selesai' => now()->endOfYear()->toDateString(),
                'is_active' => true,
            ],
            [
                'university_id' => $umy->id,
                'nama_skema' => 'Penelitian Terapan Hilirisasi Produk',
                'deskripsi' => 'Skema riset terapan yang bertujuan menghasilkan prototipe fungsional dan solusi praktis industri.',
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
