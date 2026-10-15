<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRole = Role::where('name', Role::SUPER_ADMIN)->first();
        $adminKampusRole = Role::where('name', Role::ADMIN_KAMPUS)->first();
        $adminKeuanganRole = Role::where('name', Role::ADMIN_KEUANGAN)->first();
        $reviewerRole = Role::where('name', Role::REVIEWER)->first();
        $penelitiRole = Role::where('name', Role::PENELITI)->first();

        $umy = University::where('code', 'UMY')->first();
        $umyId = $umy ? $umy->id : null;

        $defaultPassword = Hash::make('password');

        $users = [
            [
                'name' => 'Super Administrator',
                'email' => 'superadmin@litabmas.ac.id',
                'password' => $defaultPassword,
                'role_id' => $superAdminRole?->id,
                'university_id' => null,
                'nidn' => null,
                'phone' => '081200000001',
                'faculty' => null,
                'study_program' => null,
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Admin Kampus UMY',
                'email' => 'adminkampus@litabmas.ac.id',
                'password' => $defaultPassword,
                'role_id' => $adminKampusRole?->id,
                'university_id' => $umyId,
                'nidn' => '0612017801',
                'phone' => '081200000002',
                'faculty' => 'LPPM',
                'study_program' => 'Manajemen Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Admin Keuangan UMY',
                'email' => 'finance@litabmas.ac.id',
                'password' => $defaultPassword,
                'role_id' => $adminKeuanganRole?->id,
                'university_id' => $umyId,
                'nidn' => '0615038002',
                'phone' => '081200000003',
                'faculty' => 'Biro Keuangan',
                'study_program' => 'Akuntansi',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Reviewer Ahli UMY',
                'email' => 'reviewer@litabmas.ac.id',
                'password' => $defaultPassword,
                'role_id' => $reviewerRole?->id,
                'university_id' => $umyId,
                'nidn' => '0620057503',
                'phone' => '081200000004',
                'faculty' => 'Teknik',
                'study_program' => 'Teknik Elektro',
                'is_active' => true,
                'is_reviewer' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dosen Peneliti UMY',
                'email' => 'dosen@litabmas.ac.id',
                'password' => $defaultPassword,
                'role_id' => $penelitiRole?->id,
                'university_id' => $umyId,
                'nidn' => '0601018501',
                'phone' => '081200000005',
                'faculty' => 'Teknik',
                'study_program' => 'Teknologi Informasi',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // Backward compatibility user
            [
                'name' => 'Legacy Super Admin',
                'email' => 'superadmin@ajm.ac.id',
                'password' => Hash::make('password123'),
                'role_id' => $superAdminRole?->id,
                'university_id' => null,
                'nidn' => null,
                'phone' => '081234567890',
                'faculty' => null,
                'study_program' => null,
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            $roleId = $userData['role_id'];
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            if ($roleId) {
                $user->roles()->syncWithoutDetaching([$roleId]);
            }
        }

        $this->command->info('Default test users seeded successfully.');
    }
}
