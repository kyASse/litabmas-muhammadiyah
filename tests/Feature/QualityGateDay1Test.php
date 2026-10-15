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
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class QualityGateDay1Test extends TestCase
{
    use RefreshDatabase;

    /**
     * Uji rute /design-system-preview mengembalikan HTTP 200 dan merender komponen DesignSystemPreview.
     */
    public function test_design_system_preview_route_returns_ok_and_renders_inertia_component(): void
    {
        $response = $this->get('/design-system-preview');

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('DesignSystemPreview')
        );
    }

    /**
     * Uji rute beranda / mengembalikan HTTP 200 dan merender komponen welcome dengan props riset.
     */
    public function test_home_landing_page_renders_cleanly_with_standalone_research_props(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('welcome')
            ->has('overallStats')
            ->has('activeSchemas')
        );
    }


    /**
     * Uji keberadaan seluruh 21 tabel domain bersih sesuai spesifikasi Kamus Data schema.md.
     */
    public function test_all_twenty_one_clean_domain_tables_exist(): void
    {
        $cleanDomainTables = [
            'universities',
            'roles',
            'users',
            'role_user',
            'activity_logs',
            'notifications',
            'research_schemas',
            'proposals',
            'proposal_documents',
            'assessment_criteria',
            'reviews',
            'contracts',
            'fundings',
            'monev_schedules',
            'progress_reports',
            'research_outputs',
            'journal_outputs',
            'book_outputs',
            'hki_outputs',
            'product_outputs',
            'evaluations',
        ];

        foreach ($cleanDomainTables as $tableName) {
            $this->assertTrue(
                Schema::hasTable($tableName),
                "[FAIL] Tabel domain bersih '{$tableName}' tidak ditemukan dalam basis data."
            );
        }
    }

    /**
     * Uji pembersihan tuntas: seluruh tabel warisan (legacy) OJS dan JurnalMu tidak boleh ada.
     */
    public function test_legacy_purged_tables_do_not_exist(): void
    {
        $purgedLegacyTables = [
            // Modul warisan OJS / Submission Kelas G
            'articles',
            'journals',
            'issues',
            'submission_files',
            'review_assignments',
            'copyedits',
            'galleys',
            'article_authors',

            // Modul warisan JurnalMu & Akreditasi Dikti
            'accreditations',
            'coaching_periods',
            'journal_coaches',
            'institutional_evaluations',
            'review_rubrics_old',
            'agendas',
            'assessment_attachments',
            'assessment_issues',
            'assessment_journal_metadata',
            'assessment_notes',
            'assessment_responses',
            'essay_questions',
            'evaluation_categories',
            'evaluation_indicators',
            'evaluation_sub_categories',
            'journal_assessments',
            'journal_reassignments',
            'pembinaans',
            'pembinaan_registrations',
            'pembinaan_registration_attachments',
            'pembinaan_reviews',
            'scientific_fields',
        ];

        foreach ($purgedLegacyTables as $tableName) {
            $this->assertFalse(
                Schema::hasTable($tableName),
                "[FAIL] Tabel legacy warisan '{$tableName}' masih ditemukan dalam basis data."
            );
        }
    }

    /**
     * Uji isolasi multi-tenancy mencegah akses data lintas kampus (cross-tenant data leakage).
     */
    public function test_multi_tenancy_isolation_prevents_cross_tenant_access(): void
    {
        // 1. Inisialisasi data master universitas tenant
        $universityA = University::create([
            'code' => 'UMY',
            'name' => 'Universitas Muhammadiyah Yogyakarta',
        ]);

        $universityB = University::create([
            'code' => 'UAD',
            'name' => 'Universitas Ahmad Dahlan',
        ]);

        // 2. Inisialisasi peran pengguna
        $rolePeneliti = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti',
        ]);

        $roleSuperAdmin = Role::create([
            'name' => Role::SUPER_ADMIN,
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
        ]);

        // 3. Inisialisasi entitas pengguna tenant dan super admin
        $userA = User::create([
            'name' => 'Dosen Universitas A',
            'email' => 'dosen.a@umy.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $rolePeneliti->id,
            'university_id' => $universityA->id,
            'is_active' => true,
        ]);

        $userB = User::create([
            'name' => 'Dosen Universitas B',
            'email' => 'dosen.b@uad.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $rolePeneliti->id,
            'university_id' => $universityB->id,
            'is_active' => true,
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin Pusat',
            'email' => 'superadmin.global@litabmas.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $roleSuperAdmin->id,
            'university_id' => null,
            'is_active' => true,
        ]);

        // 4. Buat skema riset untuk masing-masing tenant
        $schemaA = ResearchSchema::create([
            'university_id' => $universityA->id,
            'nama_skema' => 'Skema Hibah Riset UMY 2026',
            'deskripsi' => 'Skema riset internal universitas A',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $schemaB = ResearchSchema::create([
            'university_id' => $universityB->id,
            'nama_skema' => 'Skema Hibah Riset UAD 2026',
            'deskripsi' => 'Skema riset internal universitas B',
            'biaya_maksimal' => 45000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        // 5. Buat proposal untuk masing-masing tenant
        $proposalA = Proposal::create([
            'university_id' => $universityA->id,
            'id_pengusul' => $userA->id,
            'id_skema_pendanaan' => $schemaA->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas UMY',
            'abstrak' => 'Abstrak penelitian universitas A',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $proposalB = Proposal::create([
            'university_id' => $universityB->id,
            'id_pengusul' => $userB->id,
            'id_skema_pendanaan' => $schemaB->id,
            'judul_penelitian' => 'Optimasi Panel Surya UAD',
            'abstrak' => 'Abstrak penelitian universitas B',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        // 6. Buat kontrak untuk masing-masing tenant
        $contractA = Contract::create([
            'university_id' => $universityA->id,
            'id_proposal' => $proposalA->id,
            'nomor_kontrak' => 'KTR/2026/UMY/001',
            'judul_kontrak' => 'Kontrak Riset UMY 001',
            'dana_disetujui' => 30000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => 'Active',
        ]);

        $contractB = Contract::create([
            'university_id' => $universityB->id,
            'id_proposal' => $proposalB->id,
            'nomor_kontrak' => 'KTR/2026/UAD/001',
            'judul_kontrak' => 'Kontrak Riset UAD 001',
            'dana_disetujui' => 35000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => 'Active',
        ]);

        // 7. Buat jadwal monev untuk masing-masing tenant
        $monevA = MonevSchedule::create([
            'university_id' => $universityA->id,
            'nama_tahap' => 'Monev Tengah Tahun UMY',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(14)->toDateString(),
            'is_active' => true,
        ]);

        $monevB = MonevSchedule::create([
            'university_id' => $universityB->id,
            'nama_tahap' => 'Monev Tengah Tahun UAD',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(14)->toDateString(),
            'is_active' => true,
        ]);

        // 8. Verifikasi isolasi untuk Pengguna Universitas A
        $this->actingAs($userA);

        $schemasForA = ResearchSchema::all();
        $this->assertCount(1, $schemasForA);
        $this->assertTrue($schemasForA->contains('id', $schemaA->id));
        $this->assertFalse($schemasForA->contains('id', $schemaB->id));

        $proposalsForA = Proposal::all();
        $this->assertCount(1, $proposalsForA);
        $this->assertTrue($proposalsForA->contains('id', $proposalA->id));
        $this->assertFalse($proposalsForA->contains('id', $proposalB->id));

        $contractsForA = Contract::all();
        $this->assertCount(1, $contractsForA);
        $this->assertTrue($contractsForA->contains('id', $contractA->id));
        $this->assertFalse($contractsForA->contains('id', $contractB->id));

        $monevForA = MonevSchedule::all();
        $this->assertCount(1, $monevForA);
        $this->assertTrue($monevForA->contains('id', $monevA->id));
        $this->assertFalse($monevForA->contains('id', $monevB->id));

        // 9. Verifikasi isolasi untuk Pengguna Universitas B
        $this->actingAs($userB);

        $schemasForB = ResearchSchema::all();
        $this->assertCount(1, $schemasForB);
        $this->assertTrue($schemasForB->contains('id', $schemaB->id));
        $this->assertFalse($schemasForB->contains('id', $schemaA->id));

        $proposalsForB = Proposal::all();
        $this->assertCount(1, $proposalsForB);
        $this->assertTrue($proposalsForB->contains('id', $proposalB->id));
        $this->assertFalse($proposalsForB->contains('id', $proposalA->id));

        $contractsForB = Contract::all();
        $this->assertCount(1, $contractsForB);
        $this->assertTrue($contractsForB->contains('id', $contractB->id));
        $this->assertFalse($contractsForB->contains('id', $contractA->id));

        $monevForB = MonevSchedule::all();
        $this->assertCount(1, $monevForB);
        $this->assertTrue($monevForB->contains('id', $monevB->id));
        $this->assertFalse($monevForB->contains('id', $monevA->id));

        // 10. Verifikasi Super Admin dapat melewati isolasi dan melihat semua rekaman
        $this->actingAs($superAdmin);

        $allSchemas = ResearchSchema::all();
        $this->assertCount(2, $allSchemas);
        $this->assertTrue($allSchemas->contains('id', $schemaA->id));
        $this->assertTrue($allSchemas->contains('id', $schemaB->id));

        $allProposals = Proposal::all();
        $this->assertCount(2, $allProposals);
        $this->assertTrue($allProposals->contains('id', $proposalA->id));
        $this->assertTrue($allProposals->contains('id', $proposalB->id));

        $allContracts = Contract::all();
        $this->assertCount(2, $allContracts);
        $this->assertTrue($allContracts->contains('id', $contractA->id));
        $this->assertTrue($allContracts->contains('id', $contractB->id));

        $allMonev = MonevSchedule::all();
        $this->assertCount(2, $allMonev);
        $this->assertTrue($allMonev->contains('id', $monevA->id));
        $this->assertTrue($allMonev->contains('id', $monevB->id));
    }
}
