<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Seeder;

class UniversitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $universities = [
            [
                'code' => 'UMY',
                'name' => 'Universitas Muhammadiyah Yogyakarta',
                'address' => 'Jl. Brawijaya, Geblagan, Tamantirto, Kec. Kasihan, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55183',
                'logo' => null,
                'contact_email' => 'info@umy.ac.id',
            ],
            [
                'code' => 'UAD',
                'name' => 'Universitas Ahmad Dahlan',
                'address' => 'Jl. Kapas No.9, Semaki, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166',
                'logo' => null,
                'contact_email' => 'info@uad.ac.id',
            ],
            [
                'code' => 'UMS',
                'name' => 'Universitas Muhammadiyah Surakarta',
                'address' => 'Jl. A. Yani, Pabelan, Kartasura, Sukoharjo, Jawa Tengah 57162',
                'logo' => null,
                'contact_email' => 'info@ums.ac.id',
            ],
            [
                'code' => 'UMM',
                'name' => 'Universitas Muhammadiyah Malang',
                'address' => 'Jl. Raya Tlogomas No.246, Babatan, Tegalgondo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144',
                'logo' => null,
                'contact_email' => 'info@umm.ac.id',
            ],
        ];

        foreach ($universities as $data) {
            University::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }

        $this->command->info('Default Universities seeded successfully.');
    }
}
