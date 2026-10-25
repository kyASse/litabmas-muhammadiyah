<?php

namespace Tests\Feature;

use App\Models\AssessmentCriteria;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchemaYearAndCriteriaTest extends TestCase
{
    use RefreshDatabase;

    private University $university;

    private User $superAdmin;

    private User $adminKampus;

    private User $peneliti;

    private Role $superAdminRole;

    private Role $adminKampusRole;

    private Role $penelitiRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::create([
            'code' => 'UMYOGYA',
            'name' => 'Universitas Muhammadiyah Yogyakarta',
        ]);

        $this->superAdminRole = Role::create([
            'name' => Role::SUPER_ADMIN,
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
            'description' => 'Super Administrator Bappeda',
        ]);

        $this->adminKampusRole = Role::create([
            'name' => Role::ADMIN_KAMPUS,
            'guard_name' => 'web',
            'display_name' => 'Admin Kampus',
            'description' => 'Admin LPPM Kampus Mitra',
        ]);

        $this->penelitiRole = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti',
            'description' => 'Dosen Peneliti',
        ]);

        $this->superAdmin = User::create([
            'name' => 'Admin Bappeda',
            'email' => 'admin.bappeda@jogjakota.go.id',
            'password' => bcrypt('password'),
            'role_id' => $this->superAdminRole->id,
            'university_id' => null,
            'is_active' => true,
        ]);

        $this->adminKampus = User::create([
            'name' => 'Admin LPPM UMY',
            'email' => 'lppm@umy.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->adminKampusRole->id,
            'university_id' => $this->university->id,
            'is_active' => true,
        ]);

        $this->peneliti = User::create([
            'name' => 'Dr. Peneliti UMY',
            'email' => 'peneliti@umy.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'university_id' => $this->university->id,
            'is_active' => true,
        ]);
    }

    public function test_schema_can_be_created_with_fiscal_year_defaulting_to_current_year(): void
    {
        $schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Riset Terapan Bappeda',
            'deskripsi' => 'Skema penelitian terapan pemerintah kota',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
        ]);

        $this->assertNotNull($schema->tahun_anggaran);
        $this->assertEquals((int) date('Y'), (int) $schema->tahun_anggaran);
        $this->assertEquals((int) date('Y'), (int) $schema->year);
    }

    public function test_schema_can_be_created_via_endpoint_with_explicit_fiscal_year(): void
    {
        $payload = [
            'name' => 'Riset Kolaboratif 2027',
            'description' => 'Skema kolaborasi tahun anggaran depan',
            'max_funding' => 75000000,
            'tahun_anggaran' => 2027,
            'start_date' => '2027-01-01',
            'end_date' => '2027-12-31',
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.schema.store'), $payload);

        $response->assertRedirect(route('admin.schema.index'));

        $this->assertDatabaseHas('research_schemas', [
            'nama_skema' => 'Riset Kolaboratif 2027',
            'tahun_anggaran' => 2027,
        ]);
    }

    public function test_schema_index_can_be_filtered_by_fiscal_year(): void
    {
        ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema TA 2025',
            'tahun_anggaran' => 2025,
            'biaya_maksimal' => 20000000,
            'tanggal_mulai' => '2025-01-01',
            'tanggal_selesai' => '2025-12-31',
        ]);

        ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema TA 2026',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 30000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('admin.schema.index', ['tahun_anggaran' => 2026]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Schema/Index')
            ->has('schemas.data', 1)
            ->where('schemas.current_page', 1)
            ->where('schemas.per_page', 10)
            ->where('schemas.total', 1)
            ->where('schemas.data.0.nama_skema', 'Skema TA 2026')
        );
    }

    public function test_proposal_index_can_be_filtered_by_schema_fiscal_year(): void
    {
        $schema2025 = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema 2025',
            'tahun_anggaran' => 2025,
            'biaya_maksimal' => 20000000,
            'tanggal_mulai' => '2025-01-01',
            'tanggal_selesai' => '2025-12-31',
        ]);

        $schema2026 = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema 2026',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 30000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);

        $p1 = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema2025->id,
            'judul_penelitian' => 'Proposal Riset Tahun 2025',
            'abstrak' => 'Abstrak proposal 2025',
            'biaya_yang_diusulkan' => 15000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
        ]);

        $p2 = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema2026->id,
            'judul_penelitian' => 'Proposal Riset Tahun 2026',
            'abstrak' => 'Abstrak proposal 2026',
            'biaya_yang_diusulkan' => 25000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
        ]);

        // Filter on admin proposals index
        $response = $this->actingAs($this->superAdmin)
            ->get(route('admin.proposals.index', ['tahun_anggaran' => 2026]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Proposal/Index')
            ->has('proposals.data', 1)
            ->where('proposals.data.0.id', $p2->id)
        );

        // Filter on researcher proposals index
        $resResearcher = $this->actingAs($this->peneliti)
            ->get(route('proposals.index', ['tahun_anggaran' => 2025]));

        $resResearcher->assertOk();
        $resResearcher->assertInertia(fn ($page) => $page
            ->component('Proposal/Index')
            ->has('proposals.data', 1)
            ->where('proposals.data.0.id', $p1->id)
        );
    }

    public function test_dynamic_administrative_criteria_can_be_created(): void
    {
        $criterion = AssessmentCriteria::create([
            'nama_kriteria' => 'Kesesuaian Format Surat Pengantar LPPM',
            'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
            'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
            'bobot' => 0,
            'deskripsi' => 'Surat pengantar resmi ditandatangani oleh Ketua LPPM',
            'urutan' => 1,
            'is_active' => true,
        ]);

        $this->assertEquals('Administrasi', $criterion->tahap_seleksi);
        $this->assertEquals('Ya_Tidak', $criterion->tipe_jawaban);
        $this->assertTrue($criterion->is_active);
    }

    public function test_admin_bappeda_can_manage_criteria_via_criteria_controller(): void
    {
        $payload = [
            'nama_kriteria' => 'Kelengkapan Surat Pernyataan Bebas Plagiarisme',
            'tahap_seleksi' => 'Administrasi',
            'tipe_jawaban' => 'Ya_Tidak',
            'bobot' => 0,
            'deskripsi' => 'Surat bermaterai 10000',
            'urutan' => 2,
            'is_active' => true,
        ];

        $res = $this->actingAs($this->superAdmin)
            ->post(route('admin.criteria.store'), $payload);

        $res->assertRedirect(route('admin.criteria.index'));

        $this->assertDatabaseHas('assessment_criteria', [
            'nama_kriteria' => 'Kelengkapan Surat Pernyataan Bebas Plagiarisme',
            'tahap_seleksi' => 'Administrasi',
            'tipe_jawaban' => 'Ya_Tidak',
        ]);
    }

    public function test_dynamic_administrative_verification_passes_when_all_checklist_items_are_yes(): void
    {
        $crit1 = AssessmentCriteria::create([
            'nama_kriteria' => 'Surat Pengantar LPPM',
            'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
            'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
            'bobot' => 0,
            'urutan' => 1,
            'is_active' => true,
        ]);

        $crit2 = AssessmentCriteria::create([
            'nama_kriteria' => 'Kesesuaian Format Proposal dan RAB',
            'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
            'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
            'bobot' => 0,
            'urutan' => 2,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Riset Reguler',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 40000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas Bappeda',
            'abstrak' => 'Abstrak riset sistem cerdas',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'is_rab_approved' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.proposals.verify-administration', $proposal), [
                'checklist' => [
                    $crit1->id => true,
                    $crit2->id => true,
                ],
                'catatan_administrasi' => 'Seluruh berkas lengkap dan sesuai kriteria.',
            ]);

        $response->assertRedirect();

        $proposal->refresh();
        $this->assertEquals(Proposal::STATUS_LOLOS_ADMINISTRASI, $proposal->status_proposal);
        $this->assertEquals('Seluruh berkas lengkap dan sesuai kriteria.', $proposal->catatan_administrasi);
        $this->assertTrue($proposal->isLolosAdministrasi());
    }

    public function test_dynamic_administrative_verification_fails_when_any_checklist_item_is_no(): void
    {
        $crit1 = AssessmentCriteria::create([
            'nama_kriteria' => 'Surat Pengantar LPPM',
            'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
            'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
            'bobot' => 0,
            'urutan' => 1,
            'is_active' => true,
        ]);

        $crit2 = AssessmentCriteria::create([
            'nama_kriteria' => 'Kesesuaian Format Proposal dan RAB',
            'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
            'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
            'bobot' => 0,
            'urutan' => 2,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Riset Reguler',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 40000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas Bappeda Gagal Format',
            'abstrak' => 'Abstrak riset sistem cerdas gagal format',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'is_rab_approved' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.proposals.verify-administration', $proposal), [
                'checklist' => [
                    $crit1->id => true,
                    $crit2->id => false,
                ],
                'catatan_administrasi' => 'RAB melebihi pagu dan format lembar pengesahan tidak sesuai panduan.',
            ]);

        $response->assertRedirect();

        $proposal->refresh();
        $this->assertEquals(Proposal::STATUS_DITOLAK_ADMINISTRASI, $proposal->status_proposal);
        $this->assertEquals('RAB melebihi pagu dan format lembar pengesahan tidak sesuai panduan.', $proposal->catatan_administrasi);
        $this->assertTrue($proposal->isDitolakAdministrasi());
    }

    public function test_non_super_admin_cannot_execute_dynamic_administrative_verification(): void
    {
        $schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Riset Reguler',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 40000000,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Proposal Otorisasi Check',
            'abstrak' => 'Abstrak otorisasi check',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
        ]);

        // Peneliti attempt
        $resPeneliti = $this->actingAs($this->peneliti)
            ->post(route('admin.proposals.verify-administration', $proposal), [
                'checklist' => [1 => true],
            ]);
        $resPeneliti->assertForbidden();

        // Admin Kampus attempt
        $resAdminKampus = $this->actingAs($this->adminKampus)
            ->post(route('admin.proposals.verify-administration', $proposal), [
                'checklist' => [1 => true],
            ]);
        $resAdminKampus->assertForbidden();
    }
}
