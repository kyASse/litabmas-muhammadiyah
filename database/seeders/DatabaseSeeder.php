<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with 21 clean research tables initial data.
     */
    public function run(): void
    {
        $this->command->info('Starting LITABMAS Database Seeding...');
        $this->command->info('');

        // Seeder execution order respects foreign key constraints
        $this->call([
            RoleSeeder::class,               // 1. 5 Standard research roles
            UniversitySeeder::class,         // 2. Default universities (UMY, etc.)
            UserSeeder::class,               // 3. Default testing accounts for all 5 roles
            AssessmentCriteriaSeeder::class, // 4. Standard LPPM proposal evaluation rubric
            ResearchSchemaSeeder::class,     // 5. Default research schemes
        ]);

        $this->command->info('');
        $this->command->info('Database seeding completed successfully!');
        $this->command->info('');
        $this->command->info('Default test login accounts (password: password):');
        $this->command->info('   - Super Admin      : superadmin@litabmas.ac.id');
        $this->command->info('   - Admin Kampus UMY : adminkampus@litabmas.ac.id');
        $this->command->info('   - Admin Keuangan   : finance@litabmas.ac.id');
        $this->command->info('   - Reviewer UMY     : reviewer@litabmas.ac.id');
        $this->command->info('   - Peneliti UMY     : dosen@litabmas.ac.id');
        $this->command->info('   - Admin Kampus UAD : adminkampus.uad@litabmas.ac.id');
        $this->command->info('   - Peneliti UAD     : dosen.uad@litabmas.ac.id');
    }
}
