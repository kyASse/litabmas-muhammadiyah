<?php

namespace Tests\Feature;

use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    private University $universityA;

    private University $universityB;

    private Role $superAdminRole;

    private Role $userRole;

    private User $userUniversityA;

    private User $userUniversityB;

    private User $superAdmin;

    private User $unaffiliatedUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->universityA = University::create([
            'code' => 'UNIV-A',
            'name' => 'Universitas Muhammadiyah A',
        ]);

        $this->universityB = University::create([
            'code' => 'UNIV-B',
            'name' => 'Universitas Muhammadiyah B',
        ]);

        $this->superAdminRole = Role::create([
            'name' => Role::SUPER_ADMIN,
            'display_name' => 'Super Administrator',
            'description' => 'Super Administrator with global access',
        ]);

        $this->userRole = Role::create([
            'name' => Role::USER,
            'display_name' => 'Regular User',
            'description' => 'Regular User / Dosen',
        ]);

        $this->userUniversityA = User::create([
            'name' => 'Pengguna Univ A',
            'email' => 'user.a@univ-a.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->userRole->id,
            'university_id' => $this->universityA->id,
            'is_active' => true,
        ]);

        $this->userUniversityB = User::create([
            'name' => 'Pengguna Univ B',
            'email' => 'user.b@univ-b.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->userRole->id,
            'university_id' => $this->universityB->id,
            'is_active' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@litabmas.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->superAdminRole->id,
            'university_id' => null,
            'is_active' => true,
        ]);

        $this->unaffiliatedUser = User::create([
            'name' => 'Pengguna Tanpa Kampus',
            'email' => 'unaffiliated@test.com',
            'password' => bcrypt('password'),
            'role_id' => $this->userRole->id,
            'university_id' => null,
            'is_active' => true,
        ]);
    }

    /**
     * Uji pengguna tenant hanya dapat melihat data milik universitasnya sendiri.
     */
    public function test_tenant_user_only_sees_their_university_records(): void
    {
        $schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Universitas A',
            'deskripsi' => 'Deskripsi skema univ A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema Riset Universitas B',
            'deskripsi' => 'Deskripsi skema univ B',
            'biaya_maksimal' => 75000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        // Autentikasi sebagai pengguna Universitas A
        $this->actingAs($this->userUniversityA);

        $results = ResearchSchema::all();

        $this->assertCount(1, $results);
        $this->assertTrue($results->contains('id', $schemaA->id));
        $this->assertFalse($results->contains('id', $schemaB->id));

        // Autentikasi sebagai pengguna Universitas B
        $this->actingAs($this->userUniversityB);

        $resultsB = ResearchSchema::all();

        $this->assertCount(1, $resultsB);
        $this->assertTrue($resultsB->contains('id', $schemaB->id));
        $this->assertFalse($resultsB->contains('id', $schemaA->id));
    }

    /**
     * Uji Super Admin dapat melewati TenantScope dan melihat seluruh data lintas universitas.
     */
    public function test_super_admin_bypasses_tenant_scope(): void
    {
        $schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Universitas A',
            'deskripsi' => 'Deskripsi skema univ A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema Riset Universitas B',
            'deskripsi' => 'Deskripsi skema univ B',
            'biaya_maksimal' => 75000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        // Autentikasi sebagai Super Admin
        $this->actingAs($this->superAdmin);

        $results = ResearchSchema::all();

        $this->assertCount(2, $results);
        $this->assertTrue($results->contains('id', $schemaA->id));
        $this->assertTrue($results->contains('id', $schemaB->id));
    }

    /**
     * Uji pembuatan entitas otomatis menetapkan university_id dari pengguna aktif non-super-admin.
     */
    public function test_creating_record_auto_assigns_university_id_for_regular_user(): void
    {
        $this->actingAs($this->userUniversityA);

        $newSchema = ResearchSchema::create([
            'nama_skema' => 'Skema Otomatis Kampus A',
            'deskripsi' => 'Pengujian pengisian otomatis university_id',
            'biaya_maksimal' => 20000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $this->assertNotNull($newSchema->university_id);
        $this->assertEquals($this->universityA->id, $newSchema->university_id);

        $this->assertDatabaseHas('research_schemas', [
            'id' => $newSchema->id,
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Otomatis Kampus A',
        ]);
    }

    /**
     * Uji pengguna tanpa afiliasi universitas diblokir dari melihat catatan data apapun.
     */
    public function test_unaffiliated_user_sees_no_records(): void
    {
        ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Univ A',
            'deskripsi' => 'Deskripsi A',
            'biaya_maksimal' => 10000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $this->actingAs($this->unaffiliatedUser);

        $results = ResearchSchema::all();

        $this->assertCount(0, $results);
    }
}
