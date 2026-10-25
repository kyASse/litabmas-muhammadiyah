<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DualSignoffProposalVerificationTest extends TestCase
{
    use RefreshDatabase;

    private University $university;

    private User $peneliti;

    private ResearchSchema $schema;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::create([
            'code' => 'UNIV-TEST',
            'name' => 'Universitas Uji Coba',
        ]);

        $penelitiRole = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti',
        ]);

        $this->peneliti = User::create([
            'name' => 'Dr. Peneliti Uji',
            'email' => 'peneliti.uji@univ.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $penelitiRole->id,
            'university_id' => $this->university->id,
            'is_active' => true,
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Riset Bappeda 2026',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);
    }

    public function test_proposal_model_supports_dual_signoff_attributes_and_helpers(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Studi Inovasi Smart City Yogyakarta',
            'abstrak' => 'Abstrak penelitian sistem tata kelola cerdas perkotaan.',
            'biaya_yang_diusulkan' => 45000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'is_administrasi_approved' => null,
            'is_rab_approved' => null,
        ]);

        $this->assertFalse($proposal->isAdministrasiApproved());
        $this->assertFalse($proposal->isRabApproved());
        $this->assertFalse($proposal->isDualApproved());

        // Administrasi disetujui, tapi RAB belum
        $proposal->update([
            'is_administrasi_approved' => true,
            'tanggal_verifikasi_administrasi' => now(),
            'catatan_administrasi' => 'Berkas legalitas lengkap.',
        ]);

        $this->assertTrue($proposal->fresh()->isAdministrasiApproved());
        $this->assertFalse($proposal->fresh()->isRabApproved());
        $this->assertFalse($proposal->fresh()->isDualApproved());

        // RAB disetujui, sehingga kedua pihak telah memberikan persetujuan
        $proposal->update([
            'is_rab_approved' => true,
            'tanggal_verifikasi_rab' => now(),
            'catatan_keuangan' => 'RAB telah diaudit dan sesuai SBM Kota Yogyakarta.',
            'rekomendasi_anggaran' => 42000000,
        ]);

        $refreshed = $proposal->fresh();
        $this->assertTrue($refreshed->isAdministrasiApproved());
        $this->assertTrue($refreshed->isRabApproved());
        $this->assertTrue($refreshed->isDualApproved());
        $this->assertEquals(42000000, (float) $refreshed->rekomendasi_anggaran);
    }

    public function test_super_admin_verify_administration_alone_leaves_proposal_in_approved_kampus_until_rab_verified(): void
    {
        $superAdminRole = Role::firstOrCreate(['name' => Role::SUPER_ADMIN], [
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin Pusat',
            'email' => 'superadmin.fase1@bappeda.go.id',
            'password' => bcrypt('password'),
            'role_id' => $superAdminRole->id,
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Kajian Tata Ruang Hijau',
            'abstrak' => 'Abstrak kajian tata ruang.',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
        ]);

        $response = $this->actingAs($superAdmin)->post(route('admin.proposals.verify-administration', $proposal), [
            'checklist' => [1 => true],
            'catatan_administrasi' => 'Berkas proposal lengkap.',
        ]);

        $response->assertRedirect();
        $refreshed = $proposal->fresh();

        $this->assertTrue($refreshed->isAdministrasiApproved());
        $this->assertFalse($refreshed->isRabApproved());
        // Status belum menjadi Lolos_Administrasi karena RAB belum diverifikasi Admin Keuangan
        $this->assertEquals(Proposal::STATUS_APPROVED_KAMPUS, $refreshed->status_proposal);
    }

    public function test_admin_keuangan_can_verify_rab_and_completes_transition_to_lolos_administrasi(): void
    {
        $adminKeuanganRole = Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], [
            'guard_name' => 'web',
            'display_name' => 'Admin Keuangan',
        ]);

        $adminKeuangan = User::create([
            'name' => 'Admin Keuangan Bappeda',
            'email' => 'keuangan.fase1@bappeda.go.id',
            'password' => bcrypt('password'),
            'role_id' => $adminKeuanganRole->id,
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Kajian Drainase Cerdas',
            'abstrak' => 'Abstrak kajian drainase.',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'is_administrasi_approved' => true, // Super Admin sudah menyetujui sebelumnya
            'tanggal_verifikasi_administrasi' => now(),
        ]);

        $response = $this->actingAs($adminKeuangan)->post(route('finance.proposals.verify-rab', $proposal), [
            'status_rab' => 'Approved',
            'rekomendasi_anggaran' => 32000000,
            'catatan_keuangan' => 'RAB disetujui dengan penyesuaian plafon konsumsi seminar.',
        ]);

        $response->assertRedirect();
        $refreshed = $proposal->fresh();

        $this->assertTrue($refreshed->isAdministrasiApproved());
        $this->assertTrue($refreshed->isRabApproved());
        $this->assertTrue($refreshed->isDualApproved());
        // Status resmi berubah menjadi Lolos_Administrasi karena KEDUA belah pihak telah menyetujui
        $this->assertEquals(Proposal::STATUS_LOLOS_ADMINISTRASI, $refreshed->status_proposal);
        $this->assertEquals(32000000, (float) $refreshed->rekomendasi_anggaran);
    }

    public function test_rejection_by_admin_keuangan_sets_status_to_ditolak_administrasi(): void
    {
        $adminKeuanganRole = Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], [
            'guard_name' => 'web',
            'display_name' => 'Admin Keuangan',
        ]);

        $adminKeuangan = User::create([
            'name' => 'Admin Keuangan Bappeda',
            'email' => 'keuangan.tolak@bappeda.go.id',
            'password' => bcrypt('password'),
            'role_id' => $adminKeuanganRole->id,
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Kajian Material Daur Ulang',
            'abstrak' => 'Abstrak material.',
            'biaya_yang_diusulkan' => 48000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
            'is_administrasi_approved' => true,
        ]);

        $response = $this->actingAs($adminKeuangan)->post(route('finance.proposals.verify-rab', $proposal), [
            'status_rab' => 'Rejected',
            'catatan_keuangan' => 'Komponen honorarium melebihi ambang batas SBM Kota Yogyakarta.',
        ]);

        $response->assertRedirect();
        $refreshed = $proposal->fresh();

        $this->assertFalse($refreshed->isRabApproved());
        $this->assertEquals(Proposal::STATUS_DITOLAK_ADMINISTRASI, $refreshed->status_proposal);
    }

    public function test_admin_keuangan_can_access_finance_proposals_index_and_show(): void
    {
        $adminKeuanganRole = Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], [
            'guard_name' => 'web',
            'display_name' => 'Admin Keuangan',
        ]);

        $adminKeuangan = User::create([
            'name' => 'Admin Keuangan Bappeda',
            'email' => 'keuangan.queue@bappeda.go.id',
            'password' => bcrypt('password'),
            'role_id' => $adminKeuanganRole->id,
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Kajian Akses Finance',
            'abstrak' => 'Abstrak.',
            'biaya_yang_diusulkan' => 25000000,
            'status_proposal' => Proposal::STATUS_APPROVED_KAMPUS,
        ]);

        $responseIndex = $this->actingAs($adminKeuangan)->get(route('finance.proposals.index'));
        $responseIndex->assertOk();

        $responseShow = $this->actingAs($adminKeuangan)->get(route('finance.proposals.show', $proposal));
        $responseShow->assertOk();

        // Super Admin juga dapat mengakses antrean audit keuangan (global bypass)
        $superAdminRole = Role::firstOrCreate(['name' => Role::SUPER_ADMIN], [
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
        ]);
        $superAdmin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'superadmin.finance@bappeda.go.id',
            'password' => bcrypt('password'),
            'role_id' => $superAdminRole->id,
            'is_active' => true,
        ]);
        $this->actingAs($superAdmin)->get(route('finance.proposals.index'))->assertOk();

        // Peneliti/Dosen dilarang mengakses antrean audit keuangan (403 Forbidden)
        $this->actingAs($this->peneliti)->get(route('finance.proposals.index'))->assertStatus(403);
    }
}
