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
}
