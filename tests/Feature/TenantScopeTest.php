<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\MonevSchedule;
use App\Models\Proposal;
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

    /**
     * Uji pengguna tenant hanya dapat melihat proposal milik universitasnya sendiri.
     */
    public function test_tenant_user_only_sees_their_university_proposals(): void
    {
        $schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Univ A',
            'deskripsi' => 'Deskripsi skema A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema Riset Univ B',
            'deskripsi' => 'Deskripsi skema B',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $proposalA = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->userUniversityA->id,
            'id_skema_pendanaan' => $schemaA->id,
            'judul_penelitian' => 'Proposal Riset Kampus A',
            'abstrak' => 'Ringkasan riset kampus A',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);

        $proposalB = Proposal::create([
            'university_id' => $this->universityB->id,
            'id_pengusul' => $this->userUniversityB->id,
            'id_skema_pendanaan' => $schemaB->id,
            'judul_penelitian' => 'Proposal Riset Kampus B',
            'abstrak' => 'Ringkasan riset kampus B',
            'biaya_yang_diusulkan' => 40000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);

        // Autentikasi sebagai pengguna Universitas A
        $this->actingAs($this->userUniversityA);
        $resultsA = Proposal::all();
        $this->assertCount(1, $resultsA);
        $this->assertTrue($resultsA->contains('id', $proposalA->id));
        $this->assertFalse($resultsA->contains('id', $proposalB->id));

        // Autentikasi sebagai pengguna Universitas B
        $this->actingAs($this->userUniversityB);
        $resultsB = Proposal::all();
        $this->assertCount(1, $resultsB);
        $this->assertTrue($resultsB->contains('id', $proposalB->id));
        $this->assertFalse($resultsB->contains('id', $proposalA->id));
    }

    /**
     * Uji Super Admin dapat melihat seluruh proposal lintas universitas.
     */
    public function test_super_admin_sees_all_proposals(): void
    {
        $schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Univ A',
            'deskripsi' => 'Deskripsi skema A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema Riset Univ B',
            'deskripsi' => 'Deskripsi skema B',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $proposalA = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->userUniversityA->id,
            'id_skema_pendanaan' => $schemaA->id,
            'judul_penelitian' => 'Proposal Riset Kampus A',
            'abstrak' => 'Ringkasan riset kampus A',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);

        $proposalB = Proposal::create([
            'university_id' => $this->universityB->id,
            'id_pengusul' => $this->userUniversityB->id,
            'id_skema_pendanaan' => $schemaB->id,
            'judul_penelitian' => 'Proposal Riset Kampus B',
            'abstrak' => 'Ringkasan riset kampus B',
            'biaya_yang_diusulkan' => 40000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);

        // Autentikasi sebagai Super Admin
        $this->actingAs($this->superAdmin);
        $results = Proposal::all();
        $this->assertCount(2, $results);
        $this->assertTrue($results->contains('id', $proposalA->id));
        $this->assertTrue($results->contains('id', $proposalB->id));
    }

    /**
     * Uji pengguna tenant hanya dapat melihat kontrak milik universitasnya sendiri.
     */
    public function test_tenant_user_only_sees_their_university_contracts(): void
    {
        $schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Riset Univ A',
            'deskripsi' => 'Deskripsi skema A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema Riset Univ B',
            'deskripsi' => 'Deskripsi skema B',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $proposalA = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->userUniversityA->id,
            'id_skema_pendanaan' => $schemaA->id,
            'judul_penelitian' => 'Proposal Riset A',
            'abstrak' => 'Ringkasan riset A',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $proposalB = Proposal::create([
            'university_id' => $this->universityB->id,
            'id_pengusul' => $this->userUniversityB->id,
            'id_skema_pendanaan' => $schemaB->id,
            'judul_penelitian' => 'Proposal Riset B',
            'abstrak' => 'Ringkasan riset B',
            'biaya_yang_diusulkan' => 40000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $contractA = Contract::create([
            'university_id' => $this->universityA->id,
            'id_proposal' => $proposalA->id,
            'nomor_kontrak' => 'SP3/2026/UNIV-A/001',
            'judul_kontrak' => 'Kontrak Riset Univ A',
            'dana_disetujui' => 30000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => 'Active',
        ]);

        $contractB = Contract::create([
            'university_id' => $this->universityB->id,
            'id_proposal' => $proposalB->id,
            'nomor_kontrak' => 'SP3/2026/UNIV-B/001',
            'judul_kontrak' => 'Kontrak Riset Univ B',
            'dana_disetujui' => 40000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => 'Active',
        ]);

        // Autentikasi sebagai pengguna Universitas A
        $this->actingAs($this->userUniversityA);
        $resultsA = Contract::all();
        $this->assertCount(1, $resultsA);
        $this->assertTrue($resultsA->contains('id', $contractA->id));
        $this->assertFalse($resultsA->contains('id', $contractB->id));

        // Autentikasi sebagai pengguna Universitas B
        $this->actingAs($this->userUniversityB);
        $resultsB = Contract::all();
        $this->assertCount(1, $resultsB);
        $this->assertTrue($resultsB->contains('id', $contractB->id));
        $this->assertFalse($resultsB->contains('id', $contractA->id));

        // Autentikasi sebagai Super Admin
        $this->actingAs($this->superAdmin);
        $resultsAdmin = Contract::all();
        $this->assertCount(2, $resultsAdmin);
        $this->assertTrue($resultsAdmin->contains('id', $contractA->id));
        $this->assertTrue($resultsAdmin->contains('id', $contractB->id));
    }

    /**
     * Uji pengguna tenant hanya dapat melihat jadwal monev milik universitasnya sendiri.
     */
    public function test_tenant_user_only_sees_their_university_monev_schedules(): void
    {
        $monevA = MonevSchedule::create([
            'university_id' => $this->universityA->id,
            'nama_tahap' => 'Monev Tengah Tahun Univ A',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(14)->toDateString(),
            'deskripsi' => 'Pelaksanaan monev kemajuan univ A',
            'is_active' => true,
        ]);

        $monevB = MonevSchedule::create([
            'university_id' => $this->universityB->id,
            'nama_tahap' => 'Monev Tengah Tahun Univ B',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(14)->toDateString(),
            'deskripsi' => 'Pelaksanaan monev kemajuan univ B',
            'is_active' => true,
        ]);

        // Autentikasi sebagai pengguna Universitas A
        $this->actingAs($this->userUniversityA);
        $resultsA = MonevSchedule::all();
        $this->assertCount(1, $resultsA);
        $this->assertTrue($resultsA->contains('id', $monevA->id));
        $this->assertFalse($resultsA->contains('id', $monevB->id));

        // Autentikasi sebagai pengguna Universitas B
        $this->actingAs($this->userUniversityB);
        $resultsB = MonevSchedule::all();
        $this->assertCount(1, $resultsB);
        $this->assertTrue($resultsB->contains('id', $monevB->id));
        $this->assertFalse($resultsB->contains('id', $monevA->id));

        // Autentikasi sebagai Super Admin
        $this->actingAs($this->superAdmin);
        $resultsAdmin = MonevSchedule::all();
        $this->assertCount(2, $resultsAdmin);
        $this->assertTrue($resultsAdmin->contains('id', $monevA->id));
        $this->assertTrue($resultsAdmin->contains('id', $monevB->id));
    }

    /**
     * Uji pembuatan Proposal, Contract, dan MonevSchedule otomatis menetapkan university_id dari pengguna aktif.
     */
    public function test_creating_proposal_contract_and_monev_auto_assigns_university_id(): void
    {
        $this->actingAs($this->userUniversityA);

        $schema = ResearchSchema::create([
            'nama_skema' => 'Skema Otomatis Kampus A',
            'deskripsi' => 'Deskripsi skema',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'id_pengusul' => $this->userUniversityA->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Proposal Otomatis Kampus A',
            'abstrak' => 'Ringkasan otomatis',
            'biaya_yang_diusulkan' => 25000000,
            'status_proposal' => Proposal::STATUS_DRAFT,
        ]);

        $this->assertNotNull($proposal->university_id);
        $this->assertEquals($this->universityA->id, $proposal->university_id);

        $contract = Contract::create([
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'SP3/2026/AUTO/001',
            'judul_kontrak' => 'Kontrak Otomatis Kampus A',
            'dana_disetujui' => 25000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => 'Draft',
        ]);

        $this->assertNotNull($contract->university_id);
        $this->assertEquals($this->universityA->id, $contract->university_id);

        $monev = MonevSchedule::create([
            'nama_tahap' => 'Monev Otomatis Kampus A',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(7)->toDateString(),
            'is_active' => true,
        ]);

        $this->assertNotNull($monev->university_id);
        $this->assertEquals($this->universityA->id, $monev->university_id);
    }
}
