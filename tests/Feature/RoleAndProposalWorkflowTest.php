<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RoleAndProposalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private University $universityA;

    private University $universityB;

    private Role $superAdminRole;

    private Role $adminKampusRole;

    private Role $adminKeuanganRole;

    private Role $reviewerRole;

    private Role $penelitiRole;

    private User $superAdmin;

    private User $adminKampusA;

    private User $adminKampusB;

    private User $dosenA;

    private ResearchSchema $schema;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

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
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
            'description' => 'Super Administrator Bappeda Pusat',
        ]);

        $this->adminKeuanganRole = Role::create([
            'name' => Role::ADMIN_KEUANGAN,
            'guard_name' => 'web',
            'display_name' => 'Admin Keuangan',
            'description' => 'Admin Keuangan Bappeda Pusat',
        ]);

        $this->adminKampusRole = Role::create([
            'name' => Role::ADMIN_KAMPUS,
            'guard_name' => 'web',
            'display_name' => 'Admin Kampus',
            'description' => 'Admin LPPM Kampus Mitra',
        ]);

        $this->reviewerRole = Role::create([
            'name' => Role::REVIEWER,
            'guard_name' => 'web',
            'display_name' => 'Reviewer',
            'description' => 'Tenaga Ahli Penilai Proposal',
        ]);

        $this->penelitiRole = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti',
            'description' => 'Dosen Peneliti Kampus',
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Admin Pusat',
            'email' => 'superadmin.pusat@litabmas.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->superAdminRole->id,
            'university_id' => null,
            'is_active' => true,
        ]);

        $this->adminKampusA = User::create([
            'name' => 'Admin LPPM Univ A',
            'email' => 'admin.lppm@univ-a.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->adminKampusRole->id,
            'university_id' => $this->universityA->id,
            'is_active' => true,
        ]);

        $this->adminKampusB = User::create([
            'name' => 'Admin LPPM Univ B',
            'email' => 'admin.lppm@univ-b.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->adminKampusRole->id,
            'university_id' => $this->universityB->id,
            'is_active' => true,
        ]);

        $this->dosenA = User::create([
            'name' => 'Dosen Peneliti Univ A',
            'email' => 'dosen.a@univ-a.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'university_id' => $this->universityA->id,
            'nidn' => '0501018801',
            'study_program' => 'Teknik Informatika',
            'is_active' => true,
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema Penelitian Terapan Kota',
            'deskripsi' => 'Skema riset kolaborasi Pemda Bappeda dan Kampus Mitra',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);
    }

    /**
     * Memverifikasi struktur role RBAC resmi dan pembersihan role legacy.
     */
    public function test_system_roles_aligned_to_five_official_roles_and_legacy_purged(): void
    {
        $this->assertEquals('Super Admin', Role::SUPER_ADMIN);
        $this->assertEquals('Admin Keuangan', Role::ADMIN_KEUANGAN);
        $this->assertEquals('Admin Kampus', Role::ADMIN_KAMPUS);
        $this->assertEquals('Reviewer', Role::REVIEWER);
        $this->assertEquals('Peneliti', Role::PENELITI);

        // Pastikan role legacy User dan Pengelola Jurnal telah dibersihkan
        $this->assertFalse(defined(Role::class . '::USER'));
        $this->assertFalse(defined(Role::class . '::PENGELOLA_JURNAL'));
        $this->assertFalse(method_exists(User::class, 'isUser'));
        $this->assertFalse(method_exists(User::class, 'isPengelolaJurnal'));

        // Pastikan helper role resmi tersedia
        $this->assertTrue(method_exists(User::class, 'isPeneliti'));
        $this->assertTrue($this->dosenA->isPeneliti());
        $this->assertTrue($this->adminKampusA->isAdminKampus());
        $this->assertTrue($this->superAdmin->isSuperAdmin());
    }

    /**
     * Dosen dapat mengajukan proposal baru dengan status Submitted_Kampus.
     */
    public function test_dosen_can_submit_proposal_to_status_submitted_kampus(): void
    {
        $file = UploadedFile::fake()->create('proposal_penelitian.pdf', 500, 'application/pdf');

        $payload = [
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Optimalisasi Pengelolaan Sampah Kota Berbasis IoT',
            'abstrak' => 'Abstrak usulan penelitian penanganan sampah perkotaan dengan sistem cerdas terintegrasi sensor timbulan sampah secara komprehensif dan berkelanjutan.',
            'latar_belakang' => 'Latar belakang permasalahan volume timbulan sampah harian.',
            'biaya_yang_diusulkan' => 35000000,
            'action' => 'submit_kampus',
            'file_dokumen_proposal' => $file,
        ];

        $response = $this->actingAs($this->dosenA)->post('/proposals', $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('proposals.index'));

        $this->assertDatabaseHas('proposals', [
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Optimalisasi Pengelolaan Sampah Kota Berbasis IoT',
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
        ]);
    }

    /**
     * Dosen dapat menyerahkan draf yang sudah ada ke Admin Kampus.
     */
    public function test_dosen_can_submit_draft_proposal_to_campus(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Kajian Mobilitas Transportasi Rendah Karbon',
            'abstrak' => 'Ringkasan penelitian transportasi ramah lingkungan.',
            'biaya_yang_diusulkan' => 28000000,
            'status_proposal' => Proposal::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->dosenA)->post("/proposals/{$proposal->id}/submit-kampus");

        $response->assertRedirect(route('proposals.index'));
        $this->assertEquals(Proposal::STATUS_SUBMITTED_KAMPUS, $proposal->fresh()->status_proposal);
        $this->assertNotNull($proposal->fresh()->tanggal_pengajuan);
    }

    /**
     * Admin Kampus dari universitas yang sama dapat menyetujui proposal ke status Approved_Kampus.
     */
    public function test_admin_kampus_from_same_university_can_approve_proposal(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Sensor Kualitas Air Sungai',
            'abstrak' => 'Monitoring berkala parameter kimia dan biologi perairan.',
            'biaya_yang_diusulkan' => 42000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->adminKampusA)
            ->post("/admin/proposals/{$proposal->id}/campus-approve");

        $response->assertRedirect();
        $this->assertEquals(Proposal::STATUS_APPROVED_KAMPUS, $proposal->fresh()->status_proposal);
    }

    /**
     * Admin Kampus dari universitas lain diblokir dengan 403 Forbidden saat menyetujui usulan lintas kampus.
     */
    public function test_admin_kampus_from_other_university_receives_403_forbidden_on_campus_approve(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Studi Ketahanan Pangan Berkelanjutan Kampus A',
            'abstrak' => 'Analisis ketersediaan rantai pasok pangan.',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->adminKampusB)
            ->post("/admin/proposals/{$proposal->id}/campus-approve");

        $response->assertStatus(403);
        $this->assertEquals(Proposal::STATUS_SUBMITTED_KAMPUS, $proposal->fresh()->status_proposal);
    }

    /**
     * Admin Kampus dari universitas yang sama dapat menolak usulan dengan catatan perbaikan.
     */
    public function test_admin_kampus_from_same_university_can_reject_proposal_with_notes(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Desain Smart Grid Mikro Perkotaan',
            'abstrak' => 'Integrasi panel surya atap dan grid baterai komunal.',
            'biaya_yang_diusulkan' => 45000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->adminKampusA)
            ->post("/admin/proposals/{$proposal->id}/campus-reject", [
                'catatan_penolakan' => 'Mohon sesuaikan rincian anggaran biaya sesuai panduan tarif lokal.',
            ]);

        $response->assertRedirect();
        $refreshed = $proposal->fresh();
        $this->assertEquals(Proposal::STATUS_REJECTED_KAMPUS, $refreshed->status_proposal);
        $this->assertEquals('Mohon sesuaikan rincian anggaran biaya sesuai panduan tarif lokal.', $refreshed->catatan_administrasi);
    }

    /**
     * Admin Kampus dari universitas lain diblokir dengan 403 Forbidden saat menolak usulan lintas kampus.
     */
    public function test_admin_kampus_from_other_university_receives_403_forbidden_on_campus_reject(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Analisis Ruang Terbuka Hijau Wilayah Padat',
            'abstrak' => 'Pemetaan spasial vegetasi perkotaan.',
            'biaya_yang_diusulkan' => 20000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->adminKampusB)
            ->post("/admin/proposals/{$proposal->id}/campus-reject", [
                'catatan_penolakan' => 'Percobaan penolakan usulan lintas institusi.',
            ]);

        $response->assertStatus(403);
        $this->assertEquals(Proposal::STATUS_SUBMITTED_KAMPUS, $proposal->fresh()->status_proposal);
    }

    /**
     * Super Admin Pusat dapat melihat proposal berstatus Approved_Kampus (antrean Bappeda).
     */
    public function test_super_admin_can_view_approved_kampus_proposals(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityA->id,
            'id_pengusul' => $this->dosenA->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Evaluasi Mitigasi Bencana Banjir Perkotaan',
            'abstrak' => 'Pemodelan hidrologi daerah aliran sungai.',
            'biaya_yang_diusulkan' => 49000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->superAdmin)->get('/admin/proposals');

        $response->assertOk();

        $detailResponse = $this->actingAs($this->superAdmin)->get("/admin/proposals/{$proposal->id}");
        $detailResponse->assertOk();
    }
}
