<?php

namespace Tests\Feature;

use App\Models\Evaluation;
use App\Models\JournalOutput;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FinalEvaluationPreconditionTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected User $researcher;

    protected User $admin;

    protected Proposal $proposal;

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
    }

    public function test_final_evaluation_submission_blocked_if_no_wajib_output(): void
    {
        $this->actingAs($this->researcher);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif...',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_final_evaluation_submission_blocked_if_wajib_output_not_verified(): void
    {
        $this->actingAs($this->researcher);

        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Submitted',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif...',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_final_evaluation_submission_succeeds_when_all_wajib_outputs_verified(): void
    {
        $this->actingAs($this->researcher);

        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif mencapai target 100 persen.',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $this->proposal->id,
            'status_penelitian' => 'Dalam_Evaluasi',
        ]);
    }

    public function test_researcher_cannot_submit_final_evaluation_for_another_users_proposal(): void
    {
        $otherResearcher = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => Role::where('name', 'Dosen')->first()->id,
        ]);

        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $this->actingAs($otherResearcher);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset mencoba submit proposal orang lain.',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_evaluate_and_generate_skts(): void
    {
        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $evaluation = Evaluation::create([
            'id_proposal' => $this->proposal->id,
            'file_laporan_akhir' => 'evaluations/final.pdf',
            'ringkasan_hasil' => 'Hasil riset telah lengkap.',
            'persentase_capaian_luaran' => 100,
            'status_penelitian' => 'Dalam_Evaluasi',
        ]);

        $this->actingAs($this->admin);

        // Evaluate
        $evalResponse = $this->post(route('admin.proposals.evaluate', $this->proposal), [
            'skor_akhir_substansi' => 92.50,
            'rekomendasi_kelulusan' => 'Lulus_Memuaskan',
        ]);
        $evalResponse->assertSessionHasNoErrors();

        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $this->proposal->id,
            'skor_akhir_substansi' => 92.50,
            'rekomendasi_kelulusan' => 'Lulus_Memuaskan',
        ]);

        // Generate SKTS
        $sktsResponse = $this->post(route('admin.proposals.skts', $this->proposal));
        $sktsResponse->assertSessionHasNoErrors();

        $expectedSktsNumber = 'SKTS/UMM/'.date('Y').'/'.$this->proposal->id;
        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $this->proposal->id,
            'nomor_skts' => $expectedSktsNumber,
            'status_penelitian' => 'Selesai',
        ]);
    }

    public function test_admin_from_different_university_cannot_generate_skts(): void
    {
        $otherUniversity = University::factory()->create(['code' => 'UAD']);
        $otherAdmin = User::factory()->create([
            'university_id' => $otherUniversity->id,
            'role_id' => Role::where('name', 'Admin Kampus')->first()->id,
        ]);

        Evaluation::create([
            'id_proposal' => $this->proposal->id,
            'file_laporan_akhir' => 'evaluations/final.pdf',
            'ringkasan_hasil' => 'Hasil riset telah lengkap.',
            'persentase_capaian_luaran' => 100,
            'status_penelitian' => 'Dalam_Evaluasi',
        ]);

        $this->actingAs($otherAdmin);

        $response = $this->post(route('admin.proposals.skts', $this->proposal));
        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    public function test_admin_kampus_can_view_evaluation_page_via_query_param(): void
    {
        $this->actingAs($this->admin);

        $response = $this->get(route('evaluations.show.query', ['proposal_id' => $this->proposal->id]));
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('proposal', $pageProps);
        $this->assertEquals($this->proposal->id, $pageProps['proposal']['id']);
    }

    public function test_admin_kampus_can_view_evaluation_page_via_admin_evaluations_route(): void
    {
        $this->actingAs($this->admin);

        $response = $this->get(route('admin.evaluations.index'));
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('proposal', $pageProps);
    }

    public function test_admin_kampus_can_view_evaluation_page_via_proposal_route(): void
    {
        $this->actingAs($this->admin);

        $response = $this->get(route('evaluations.show', $this->proposal));
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('proposal', $pageProps);
        $this->assertEquals($this->proposal->id, $pageProps['proposal']['id']);
    }
}
