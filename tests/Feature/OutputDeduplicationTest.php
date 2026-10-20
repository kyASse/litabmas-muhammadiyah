<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class OutputDeduplicationTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected User $researcher1;

    protected User $researcher2;

    protected Proposal $proposal1;

    protected Proposal $proposal2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::factory()->create(['code' => 'UMM']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);

        $this->researcher1 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);
        $this->researcher2 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);

        $schema = ResearchSchema::factory()->create(['university_id' => $this->university->id]);

        $this->proposal1 = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher1->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->proposal2 = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher2->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);
    }

    public function test_duplicate_journal_doi_is_rejected_within_same_institution(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        // Store first journal output
        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE Transactions on Software Engineering',
            'judul_artikel' => 'Autonomous Coding with Agents',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.001',
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        // Second researcher tries to register the exact same DOI
        $this->actingAs($this->researcher2);
        $file2 = UploadedFile::fake()->createWithContent('paper2.pdf', $pdfContent);

        $response2 = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal2->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'Another Journal',
            'judul_artikel' => 'Copying Paper',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.001',
            'file_dokumen' => $file2,
        ]);

        $response2->assertSessionHasErrors('doi_url');
    }

    public function test_duplicate_book_isbn_is_rejected_within_same_institution(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('cover.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Book',
            'target_status' => 'Wajib',
            'judul_buku' => 'Metodologi Penelitian Terapan',
            'isbn' => '978-602-1234-56-7',
            'penerbit' => 'UMM Press',
            'tahun_terbit' => 2026,
            'jumlah_halaman' => 250,
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        $this->actingAs($this->researcher2);
        $file2 = UploadedFile::fake()->createWithContent('cover2.pdf', $pdfContent);

        // Try registering the same ISBN (with different formatting dashes)
        $response2 = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal2->id,
            'tipe_luaran' => 'Book',
            'target_status' => 'Wajib',
            'judul_buku' => 'Buku Serupa',
            'isbn' => '9786021234567',
            'penerbit' => 'Penerbit Lain',
            'tahun_terbit' => 2026,
            'file_dokumen' => $file2,
        ]);

        $response2->assertSessionHasErrors('isbn');
    }

    public function test_duplicate_hki_registration_is_rejected_within_same_institution(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('hki.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Hki',
            'target_status' => 'Wajib',
            'judul_ciptaan' => 'Sistem AI Terintegrasi',
            'jenis_hki' => 'Paten',
            'nomor_pendaftaran' => 'P00202600123',
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        $this->actingAs($this->researcher2);
        $file2 = UploadedFile::fake()->createWithContent('hki2.pdf', $pdfContent);

        $response2 = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal2->id,
            'tipe_luaran' => 'Hki',
            'target_status' => 'Wajib',
            'judul_ciptaan' => 'Sistem Serupa',
            'jenis_hki' => 'Paten',
            'nomor_pendaftaran' => 'p00202600123 ',
            'file_dokumen' => $file2,
        ]);

        $response2->assertSessionHasErrors('nomor_pendaftaran');
    }

    public function test_doi_is_allowed_across_different_institutions(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE Transactions on Software Engineering',
            'judul_artikel' => 'Autonomous Coding with Agents',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.999',
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        // Create university 2 and researcher 3
        $univ2 = University::factory()->create(['code' => 'UAD']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);
        $researcher3 = User::factory()->create([
            'university_id' => $univ2->id,
            'role_id' => $roleDosen->id,
        ]);
        $schema2 = ResearchSchema::factory()->create(['university_id' => $univ2->id]);
        $proposal3 = Proposal::factory()->create([
            'university_id' => $univ2->id,
            'id_pengusul' => $researcher3->id,
            'id_skema_pendanaan' => $schema2->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->actingAs($researcher3);
        $file3 = UploadedFile::fake()->createWithContent('paper3.pdf', $pdfContent);

        $response3 = $this->post(route('outputs.store'), [
            'id_proposal' => $proposal3->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE TSE',
            'judul_artikel' => 'Autonomous Coding',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.999',
            'file_dokumen' => $file3,
        ]);

        $response3->assertSessionHasNoErrors();
    }

    public function test_file_upload_must_be_valid_pdf_with_magic_bytes(): void
    {
        $this->actingAs($this->researcher1);

        $fakeContent = 'This is NOT a PDF file content';
        $file = UploadedFile::fake()->createWithContent('fake.pdf', $fakeContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Product',
            'target_status' => 'Wajib',
            'nama_produk' => 'Smart IoT Sensor',
            'deskripsi_produk' => 'Prototipe sensor pintar berbasis LoRaWAN',
            'tingkat_kesiapan_teknologi' => 5,
            'file_dokumen' => $file,
        ]);

        $response->assertSessionHasErrors('file_dokumen');
    }

    public function test_admin_can_verify_output(): void
    {
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);
        $admin = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        $this->actingAs($this->researcher1);
        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('product.pdf', $pdfContent);

        $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Product',
            'target_status' => 'Wajib',
            'nama_produk' => 'Smart IoT Sensor',
            'deskripsi_produk' => 'Prototipe sensor pintar berbasis LoRaWAN',
            'tingkat_kesiapan_teknologi' => 5,
            'file_dokumen' => $file,
        ]);

        $output = ResearchOutput::latest()->first();

        $this->actingAs($admin);

        // Verification: Verified
        $response = $this->post(route('admin.outputs.verify', $output->id), [
            'status_verifikasi' => 'Verified',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('research_outputs', [
            'id' => $output->id,
            'status_verifikasi' => 'Verified',
        ]);

        // Rejection without notes must fail
        $responseRejectFail = $this->post(route('admin.outputs.verify', $output->id), [
            'status_verifikasi' => 'Rejected',
        ]);
        $responseRejectFail->assertSessionHasErrors('catatan_verifikasi');

        // Rejection with notes must succeed
        $responseRejectPass = $this->post(route('admin.outputs.verify', $output->id), [
            'status_verifikasi' => 'Rejected',
            'catatan_verifikasi' => 'Dokumentasi produk tidak lengkap.',
        ]);
        $responseRejectPass->assertSessionHasNoErrors();
        $this->assertDatabaseHas('research_outputs', [
            'id' => $output->id,
            'status_verifikasi' => 'Rejected',
            'catatan_verifikasi' => 'Dokumentasi produk tidak lengkap.',
        ]);
    }

    public function test_researcher_cannot_submit_output_for_another_users_proposal(): void
    {
        // Researcher 2 attempts to submit output for Researcher 1's proposal
        $this->actingAs($this->researcher2);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE Transactions',
            'judul_artikel' => 'Hijacked Proposal',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/HIJACK.2026.001',
            'file_dokumen' => $file,
        ]);

        $response->assertStatus(403);
    }

    public function test_researcher_cannot_view_outputs_of_another_proposal_via_proposal_id_filter(): void
    {
        // Researcher 2 tries to access Researcher 1's outputs
        $this->actingAs($this->researcher2);

        $response = $this->get(route('outputs.index', ['proposal_id' => $this->proposal1->id]));
        $response->assertStatus(403);
    }

    public function test_admin_kampus_cannot_view_outputs_of_another_university_via_proposal_id(): void
    {
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);
        $admin1 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        // Univ 2 & Proposal 3
        $univ2 = University::factory()->create(['code' => 'UAD']);
        $schema2 = ResearchSchema::factory()->create(['university_id' => $univ2->id]);
        $researcher3 = User::factory()->create([
            'university_id' => $univ2->id,
            'role_id' => Role::firstOrCreate(['name' => 'Dosen'])->id,
        ]);
        $proposal3 = Proposal::factory()->create([
            'university_id' => $univ2->id,
            'id_pengusul' => $researcher3->id,
            'id_skema_pendanaan' => $schema2->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->actingAs($admin1);
        $response = $this->get(route('outputs.index', ['proposal_id' => $proposal3->id]));
        $response->assertStatus(403);
    }

    public function test_admin_kampus_cannot_verify_output_of_another_university(): void
    {
        // Researcher 1 submits output in Univ 1
        $this->actingAs($this->researcher1);
        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE TSE',
            'judul_artikel' => 'Autonomous Coding',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/UNIV1.2026.001',
            'file_dokumen' => $file,
        ]);

        $output1 = ResearchOutput::latest()->first();

        // Admin from Univ 2 tries to verify Univ 1 output
        $univ2 = University::factory()->create(['code' => 'UAD']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);
        $admin2 = User::factory()->create([
            'university_id' => $univ2->id,
            'role_id' => $roleAdmin->id,
        ]);

        $this->actingAs($admin2);
        $response = $this->post(route('admin.outputs.verify', $output1->id), [
            'status_verifikasi' => 'Verified',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_kampus_output_verify_index_is_scoped_to_their_university(): void
    {
        // Output 1 in Univ 1
        $this->actingAs($this->researcher1);
        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file1 = UploadedFile::fake()->createWithContent('paper1.pdf', $pdfContent);
        $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'Jurnal UMM',
            'judul_artikel' => 'Riset UMM',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/UMM.2026.001',
            'file_dokumen' => $file1,
        ]);
        $outputUniv1 = ResearchOutput::where('id_proposal', $this->proposal1->id)->first();

        // Output 2 in Univ 2
        $univ2 = University::factory()->create(['code' => 'UAD']);
        $schema2 = ResearchSchema::factory()->create(['university_id' => $univ2->id]);
        $researcher3 = User::factory()->create([
            'university_id' => $univ2->id,
            'role_id' => Role::firstOrCreate(['name' => 'Dosen'])->id,
        ]);
        $proposal3 = Proposal::factory()->create([
            'university_id' => $univ2->id,
            'id_pengusul' => $researcher3->id,
            'id_skema_pendanaan' => $schema2->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->actingAs($researcher3);
        $file2 = UploadedFile::fake()->createWithContent('paper2.pdf', $pdfContent);
        $this->post(route('outputs.store'), [
            'id_proposal' => $proposal3->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'Jurnal UAD',
            'judul_artikel' => 'Riset UAD',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/UAD.2026.001',
            'file_dokumen' => $file2,
        ]);
        $outputUniv2 = ResearchOutput::where('id_proposal', $proposal3->id)->first();

        // Admin of Univ 1 visits /admin/outputs
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);
        $admin1 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        $this->actingAs($admin1);
        $response = $this->get(route('admin.outputs.index'));
        $response->assertOk();

        // Verify that outputs page only has Univ 1 output, not Univ 2
        $responseOutputs = $response->viewData('page')['props']['outputs']['data'] ?? [];
        $ids = array_column($responseOutputs, 'id');
        $this->assertContains($outputUniv1->id, $ids);
        $this->assertNotContains($outputUniv2->id, $ids);
    }

    public function test_researcher_can_view_outputs_index_and_proposals_list(): void
    {
        $this->actingAs($this->researcher1);

        $response = $this->get(route('outputs.index'));
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('proposals', $pageProps);
        $this->assertNotEmpty($pageProps['proposals']);
        $firstProp = $pageProps['proposals'][0];
        $this->assertEquals($this->proposal1->id, $firstProp['id']);
        $this->assertNotNull($firstProp['judul_penelitian'] ?? $firstProp['judul']);
    }
}
