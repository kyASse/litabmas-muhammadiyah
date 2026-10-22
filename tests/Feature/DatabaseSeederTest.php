<?php

namespace Tests\Feature;

use App\Models\AssessmentCriteria;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Test at least 3 universities are seeded with required attributes.
     */
    public function test_universities_are_seeded_with_expected_attributes(): void
    {
        $this->assertGreaterThanOrEqual(3, University::count());

        $expectedCodes = ['UMY', 'UAD', 'UMS'];
        foreach ($expectedCodes as $code) {
            $university = University::where('code', $code)->first();
            $this->assertNotNull($university, "[FAIL] Universitas dengan kode {$code} tidak ditemukan.");
            $this->assertNotEmpty($university->name);
            $this->assertNotEmpty($university->address);
            $this->assertNotEmpty($university->contact_email);
        }

        $umy = University::where('code', 'UMY')->first();
        $this->assertEquals('Universitas Muhammadiyah Yogyakarta', $umy->name);
        $this->assertEquals('info@umy.ac.id', $umy->contact_email);

        $uad = University::where('code', 'UAD')->first();
        $this->assertEquals('Universitas Ahmad Dahlan', $uad->name);
        $this->assertEquals('info@uad.ac.id', $uad->contact_email);

        $ums = University::where('code', 'UMS')->first();
        $this->assertEquals('Universitas Muhammadiyah Surakarta', $ums->name);
        $this->assertEquals('info@ums.ac.id', $ums->contact_email);
    }

    /**
     * Test exactly 5 standard research roles are seeded.
     */
    public function test_five_standard_roles_are_seeded(): void
    {
        $this->assertEquals(5, Role::count());

        $expectedRoles = [
            Role::SUPER_ADMIN,
            Role::ADMIN_KAMPUS,
            Role::ADMIN_KEUANGAN,
            Role::REVIEWER,
            Role::PENELITI,
        ];

        foreach ($expectedRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            $this->assertNotNull($role, "[FAIL] Role {$roleName} tidak ditemukan.");
            $this->assertEquals('web', $role->guard_name);
            $this->assertNotEmpty($role->display_name);
            $this->assertNotEmpty($role->description);
        }
    }

    /**
     * Test all 5 standard role users exist with expected attributes and role synchronization.
     */
    public function test_standard_users_are_seeded_with_correct_roles_and_tenancy(): void
    {
        $umy = University::where('code', 'UMY')->first();
        $this->assertNotNull($umy);

        // 1. Super Admin (university_id must be null)
        $superAdmin = User::where('email', 'superadmin@litabmas.ac.id')->first();
        $this->assertNotNull($superAdmin);
        $this->assertNull($superAdmin->university_id);
        $this->assertTrue($superAdmin->hasRole(Role::SUPER_ADMIN));
        $this->assertTrue($superAdmin->isSuperAdmin());
        $this->assertTrue(Hash::check('password', $superAdmin->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $superAdmin->id,
            'role_id' => $superAdmin->role_id,
        ]);

        // 2. Admin Kampus UMY
        $adminKampus = User::where('email', 'adminkampus@litabmas.ac.id')->first();
        $this->assertNotNull($adminKampus);
        $this->assertEquals($umy->id, $adminKampus->university_id);
        $this->assertTrue($adminKampus->hasRole(Role::ADMIN_KAMPUS));
        $this->assertTrue($adminKampus->isAdminKampus());
        $this->assertTrue(Hash::check('password', $adminKampus->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $adminKampus->id,
            'role_id' => $adminKampus->role_id,
        ]);

        // 3. Admin Keuangan UMY
        $adminKeuangan = User::where('email', 'finance@litabmas.ac.id')->first();
        $this->assertNotNull($adminKeuangan);
        $this->assertEquals($umy->id, $adminKeuangan->university_id);
        $this->assertTrue($adminKeuangan->hasRole(Role::ADMIN_KEUANGAN));
        $this->assertTrue($adminKeuangan->isAdminKeuangan());
        $this->assertTrue(Hash::check('password', $adminKeuangan->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $adminKeuangan->id,
            'role_id' => $adminKeuangan->role_id,
        ]);

        // 4. Reviewer UMY
        $reviewer = User::where('email', 'reviewer@litabmas.ac.id')->first();
        $this->assertNotNull($reviewer);
        $this->assertEquals($umy->id, $reviewer->university_id);
        $this->assertTrue($reviewer->hasRole(Role::REVIEWER));
        $this->assertTrue($reviewer->isReviewer());
        $this->assertTrue((bool) $reviewer->is_reviewer);
        $this->assertTrue(Hash::check('password', $reviewer->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $reviewer->id,
            'role_id' => $reviewer->role_id,
        ]);

        // 5. Peneliti UMY
        $peneliti = User::where('email', 'dosen@litabmas.ac.id')->first();
        $this->assertNotNull($peneliti);
        $this->assertEquals($umy->id, $peneliti->university_id);
        $this->assertTrue($peneliti->hasRole(Role::PENELITI));
        $this->assertTrue(Hash::check('password', $peneliti->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $peneliti->id,
            'role_id' => $peneliti->role_id,
        ]);
    }

    /**
     * Test multi-campus cross-tenant test users for UAD.
     */
    public function test_cross_tenant_test_users_are_seeded_for_uad(): void
    {
        $umy = University::where('code', 'UMY')->first();
        $uad = University::where('code', 'UAD')->first();
        $this->assertNotNull($umy);
        $this->assertNotNull($uad);
        $this->assertNotEquals($umy->id, $uad->id);

        // 1. Admin Kampus UAD
        $adminUad = User::where('email', 'adminkampus.uad@litabmas.ac.id')->first();
        $this->assertNotNull($adminUad);
        $this->assertEquals($uad->id, $adminUad->university_id);
        $this->assertTrue($adminUad->hasRole(Role::ADMIN_KAMPUS));
        $this->assertTrue($adminUad->isAdminKampus());
        $this->assertTrue(Hash::check('password', $adminUad->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $adminUad->id,
            'role_id' => $adminUad->role_id,
        ]);

        // 2. Dosen Peneliti UAD
        $dosenUad = User::where('email', 'dosen.uad@litabmas.ac.id')->first();
        $this->assertNotNull($dosenUad);
        $this->assertEquals($uad->id, $dosenUad->university_id);
        $this->assertTrue($dosenUad->hasRole(Role::PENELITI));
        $this->assertTrue(Hash::check('password', $dosenUad->password));
        $this->assertDatabaseHas('role_user', [
            'user_id' => $dosenUad->id,
            'role_id' => $dosenUad->role_id,
        ]);

        // Cross-tenant verification
        $adminUmy = User::where('email', 'adminkampus@litabmas.ac.id')->first();
        $this->assertNotEquals($adminUmy->university_id, $adminUad->university_id);

        $dosenUmy = User::where('email', 'dosen@litabmas.ac.id')->first();
        $this->assertNotEquals($dosenUmy->university_id, $dosenUad->university_id);
    }

    /**
     * Test active research schemes are seeded for UMY.
     */
    public function test_active_research_schemes_are_seeded_for_umy(): void
    {
        $umy = University::where('code', 'UMY')->first();
        $this->assertNotNull($umy);

        $schemas = ResearchSchema::where('university_id', $umy->id)->get();
        $this->assertGreaterThanOrEqual(2, $schemas->count());

        // 1. Penelitian Dosen Pemula (PDP) 2026
        $pdp = ResearchSchema::where('university_id', $umy->id)
            ->where('nama_skema', 'Penelitian Dosen Pemula (PDP) 2026')
            ->first();
        $this->assertNotNull($pdp);
        $this->assertEquals(20000000, (float) $pdp->biaya_maksimal);
        $this->assertTrue((bool) $pdp->is_active);

        // 2. Penelitian Terapan Unggulan Perguruan Tinggi (PTUPT) 2026
        $ptupt = ResearchSchema::where('university_id', $umy->id)
            ->where('nama_skema', 'Penelitian Terapan Unggulan Perguruan Tinggi (PTUPT) 2026')
            ->first();
        $this->assertNotNull($ptupt);
        $this->assertEquals(50000000, (float) $ptupt->biaya_maksimal);
        $this->assertTrue((bool) $ptupt->is_active);
    }

    /**
     * Test standard assessment criteria rubric is seeded.
     */
    public function test_standard_assessment_criteria_are_seeded(): void
    {
        $this->assertGreaterThanOrEqual(4, AssessmentCriteria::count());

        $totalBobot = (int) AssessmentCriteria::sum('bobot');
        $this->assertEquals(100, $totalBobot);

        $criteria = AssessmentCriteria::orderBy('urutan')->get();
        foreach ($criteria as $item) {
            $this->assertNotEmpty($item->nama_kriteria);
            $this->assertNotEmpty($item->deskripsi);
            $this->assertGreaterThan(0, $item->bobot);
            $this->assertGreaterThan(0, $item->urutan);
        }
    }

    /**
     * Test all seeded users have both role_id column and role_user pivot synchronized.
     */
    public function test_all_seeded_users_have_synchronized_roles(): void
    {
        $users = User::whereNotNull('role_id')->get();
        $this->assertNotEmpty($users);

        foreach ($users as $user) {
            $pivotExists = DB::table('role_user')
                ->where('user_id', $user->id)
                ->where('role_id', $user->role_id)
                ->exists();

            $this->assertTrue(
                $pivotExists,
                "[FAIL] User {$user->email} memiliki role_id {$user->role_id} tetapi tidak sinkron pada pivot role_user."
            );
        }
    }
}
