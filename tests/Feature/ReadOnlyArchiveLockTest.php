<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Evaluation;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadOnlyArchiveLockTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected User $researcher;

    protected User $admin;

    protected Proposal $proposal;

    protected Contract $contract;

    protected Evaluation $evaluation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::factory()->create(['code' => 'UMM']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);

        $this->researcher = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);
        $this->admin = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        $schema = ResearchSchema::factory()->create(['university_id' => $this->university->id]);

        $this->proposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->contract = Contract::factory()->create([
            'university_id' => $this->university->id,
            'id_proposal' => $this->proposal->id,
            'nomor_kontrak' => 'KONTRAK/2026/001',
            'dana_disetujui' => 20000000,
        ]);

        // SKTS issued: status_penelitian is 'Selesai'
        $this->evaluation = Evaluation::create([
            'id_proposal' => $this->proposal->id,
            'id_evaluator' => $this->admin->id,
            'file_laporan_akhir' => 'reports/final.pdf',
            'ringkasan_hasil' => 'Penelitian selesai dengan hasil memuaskan.',
            'persentase_capaian_luaran' => 100,
            'skor_akhir_substansi' => 95.00,
            'rekomendasi_kelulusan' => 'Lulus_Memuaskan',
            'nomor_skts' => 'SKTS/UMM/2026/'.$this->proposal->id,
            'status_penelitian' => 'Selesai',
        ]);
    }

    public function test_updating_proposal_after_skts_issued_is_blocked_with_403(): void
    {
        $this->actingAs($this->researcher);

        $response = $this->put(route('proposals.update', $this->proposal), [
            'judul_penelitian' => 'Judul Baru Setelah SKTS Terbit',
            'abstrak' => 'Percobaan perubahan data yang sudah selesai.',
            'id_skema_pendanaan' => $this->proposal->id_skema_pendanaan,
            'biaya_yang_diusulkan' => 15000000,
        ]);

        $response->assertStatus(403);
    }

    public function test_deleting_research_output_after_skts_issued_is_blocked_with_403(): void
    {
        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        $this->actingAs($this->researcher);

        $response = $this->delete(route('outputs.destroy', $output));
        $response->assertStatus(403);
    }

    public function test_force_majeure_terminates_research_and_cancels_pending_funding(): void
    {
        // Setup a pending proposal with contract & pending termin 2
        $pendingProposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);
        $contract = Contract::factory()->create([
            'university_id' => $this->university->id,
            'id_proposal' => $pendingProposal->id,
            'dana_disetujui' => 10000000,
        ]);
        $funding1 = $contract->fundings()->create([
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => 7000000,
            'status_pencairan' => 'Disbursed',
        ]);
        $funding2 = $contract->fundings()->create([
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => 3000000,
            'status_pencairan' => 'Pending',
        ]);

        $this->actingAs($this->admin);

        $response = $this->post(route('admin.proposals.terminate', $pendingProposal), [
            'alasan_terminasi' => 'Bencana alam banjir bandang merusak fasilitas laboratorium riset.',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $pendingProposal->id,
            'status_penelitian' => 'Gagal',
            'rekomendasi_kelulusan' => 'Tidak_Lulus',
        ]);

        $this->assertEquals('Cancelled', $funding2->fresh()->status_pencairan);
    }
}
