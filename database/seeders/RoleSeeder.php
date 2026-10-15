<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => Role::SUPER_ADMIN,
                'guard_name' => 'web',
                'display_name' => 'Super Administrator',
                'description' => 'Memiliki akses penuh ke seluruh modul sistem LITABMAS tingkat pusat.',
            ],
            [
                'name' => Role::ADMIN_KAMPUS,
                'guard_name' => 'web',
                'display_name' => 'Administrator LPPM Kampus',
                'description' => 'Mengelola skema penelitian, verifikasi administrasi usulan, dan jadwal monev tingkat kampus.',
            ],
            [
                'name' => Role::ADMIN_KEUANGAN,
                'guard_name' => 'web',
                'display_name' => 'Admin Keuangan',
                'description' => 'Mengelola kontrak pendanaan hibah dan verifikasi pencairan termin.',
            ],
            [
                'name' => Role::REVIEWER,
                'guard_name' => 'web',
                'display_name' => 'Reviewer Penelitian',
                'description' => 'Melakukan penilaian substansi proposal dan monev kemajuan penelitian.',
            ],
            [
                'name' => Role::PENELITI,
                'guard_name' => 'web',
                'display_name' => 'Dosen / Peneliti',
                'description' => 'Mengajukan proposal penelitian, melaporkan kemajuan, dan mengunggah luaran riset.',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        $this->command->info('5 Research Roles seeded successfully.');
    }
}
