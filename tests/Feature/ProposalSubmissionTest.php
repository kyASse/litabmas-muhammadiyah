<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProposalSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function createResearcherWithUniversity(string $roleName = Role::PENELITI): array
    {
        $university = University::create([
            'code' => 'UMT99',
            'name' => 'Universitas Muhammadiyah Test 99',
            'address' => 'Jl. Pendidikan No. 99',
            'contact_email' => 'info@umt99.ac.id',
        ]);

        $role = Role::firstOrCreate(['name' => $roleName], ['display_name' => $roleName]);

        /** @var User $researcher */
        $researcher = User::factory()->create([
            'university_id' => $university->id,
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        $researcher->roles()->syncWithoutDetaching([$role->id]);

        return [$researcher, $university];
    }

    public function test_researcher_can_submit_proposal_with_members_rab_and_pdf(): void
    {
        Storage::fake('public');

        [$researcher, $university] = $this->createResearcherWithUniversity();

        /** @var User $memberUser */
        $memberUser = User::factory()->create([
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Penelitian Terapan 2026',
            'deskripsi' => 'Skema hibah penelitian terapan untuk dosen tetap.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(2)->toDateString(),
            'is_active' => true,
        ]);

        $validPdfContent = "%PDF-1.5\n%Valid proposal content body for testing purposes.\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('dokumen_proposal.pdf', $validPdfContent);

        $payload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas Terdistribusi untuk Efisiensi Energi Terbarukan',
            'abstrak' => 'Penelitian ini bertujuan untuk mengembangkan sistem kendali cerdas terdistribusi yang mampu mengoptimalkan efisiensi pemanfaatan energi surya pada gedung perkantoran dan fasilitas publik secara terintegrasi dan aman.',
            'biaya_yang_diusulkan' => 35000000,
            'members' => [
                [
                    'user_id' => $memberUser->id,
                    'peran' => 'Anggota Peneliti',
                    'alokasi_jam_per_minggu' => 10,
                ],
            ],
            'file_dokumen_proposal' => $file,
        ];

        $response = $this->actingAs($researcher)->post('/proposals', $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('proposals', [
            'university_id' => $university->id,
            'id_pengusul' => $researcher->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas Terdistribusi untuk Efisiensi Energi Terbarukan',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);

        $proposal = Proposal::where('id_pengusul', $researcher->id)
            ->where('id_skema_pendanaan', $schema->id)
            ->first();

        $this->assertNotNull($proposal);

        $this->assertDatabaseHas('proposal_documents', [
            'id_proposal' => $proposal->id,
            'nama_file' => 'dokumen_proposal.pdf',
            'tipe_dokumen' => 'Proposal_Utama',
        ]);

        $doc = ProposalDocument::where('id_proposal', $proposal->id)->first();
        $this->assertNotNull($doc);
        $this->assertGreaterThan(0, $doc->file_size);
        $this->assertNotEmpty($doc->file_path);
        Storage::disk('public')->assertExists($doc->file_path);

        $this->assertDatabaseHas('proposal_members', [
            'id_proposal' => $proposal->id,
            'user_id' => $memberUser->id,
            'peran' => 'Anggota Peneliti',
            'alokasi_jam_per_minggu' => 10,
        ]);
    }

    public function test_proposal_submission_fails_when_schema_deadline_has_passed(): void
    {
        Storage::fake('public');

        [$researcher, $university] = $this->createResearcherWithUniversity();

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Kedaluwarsa',
            'deskripsi' => 'Skema yang batas pengajuannya telah lewat.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->subMonths(2)->toDateString(),
            'tanggal_selesai' => now()->subDay()->toDateString(),
            'is_active' => true,
        ]);

        $validPdfContent = "%PDF-1.5\n%Header\nKonten berkas.";
        $file = UploadedFile::fake()->createWithContent('proposal.pdf', $validPdfContent);

        $payload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Riset Kedaluwarsa yang Mencoba Melanggar Batas Waktu Skema',
            'abstrak' => 'Penelitian ini bertujuan untuk menguji batas pertahanan deadline gatekeeper yang harus menggagalkan pengajuan usulan apabila batas waktu tanggal selesai skema telah terlewati.',
            'biaya_yang_diusulkan' => 25000000,
            'file_dokumen_proposal' => $file,
        ];

        $response = $this->actingAs($researcher)->post('/proposals', $payload);

        $response->assertSessionHasErrors('id_skema_pendanaan');
        $errors = session('errors')->get('id_skema_pendanaan');
        $this->assertStringContainsString('[TENGGAT_LEWAT]', $errors[0]);

        $this->assertDatabaseMissing('proposals', [
            'id_skema_pendanaan' => $schema->id,
            'id_pengusul' => $researcher->id,
        ]);
    }

    public function test_proposal_submission_fails_when_file_is_not_pdf(): void
    {
        Storage::fake('public');

        [$researcher, $university] = $this->createResearcherWithUniversity();

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Aktif Valid',
            'deskripsi' => 'Skema aktif untuk pengujian berkas tidak valid.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(1)->toDateString(),
            'is_active' => true,
        ]);

        $invalidFile = UploadedFile::fake()->create('dokumen_palsu.txt', 200, 'text/plain');

        $payload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Penelitian dengan Ekstensi Berkas Tidak Valid atau Bukan Dokumen PDF',
            'abstrak' => 'Deskripsi abstrak usulan penelitian yang memenuhi batas minimal seratus karakter untuk menguji pencegahan pengunggahan berkas non-PDF pada sistem Litabmas Muhammadiyah.',
            'biaya_yang_diusulkan' => 20000000,
            'file_dokumen_proposal' => $invalidFile,
        ];

        $response = $this->actingAs($researcher)->post('/proposals', $payload);

        $response->assertSessionHasErrors('file_dokumen_proposal');
        $this->assertDatabaseMissing('proposals', [
            'id_skema_pendanaan' => $schema->id,
            'id_pengusul' => $researcher->id,
        ]);
    }

    public function test_proposal_submission_fails_when_file_exceeds_10mb(): void
    {
        Storage::fake('public');

        [$researcher, $university] = $this->createResearcherWithUniversity();

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Aktif Valid 2',
            'deskripsi' => 'Skema aktif untuk pengujian batas ukuran berkas.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(1)->toDateString(),
            'is_active' => true,
        ]);

        // 10,485,760 bytes = 10,240 KB. We upload 11,000 KB (> 10MB)
        $largeFile = UploadedFile::fake()->create('berkas_terlalu_besar.pdf', 11000, 'application/pdf');

        $payload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Penelitian dengan Dokumen Melebihi Batas Maksimal Sepuluh Megabyte',
            'abstrak' => 'Deskripsi abstrak usulan penelitian yang memenuhi batas minimal seratus karakter untuk menguji pencegahan pengunggahan berkas yang berukuran lebih besar dari batas sepuluh megabyte.',
            'biaya_yang_diusulkan' => 30000000,
            'file_dokumen_proposal' => $largeFile,
        ];

        $response = $this->actingAs($researcher)->post('/proposals', $payload);

        $response->assertSessionHasErrors('file_dokumen_proposal');
        $this->assertDatabaseMissing('proposals', [
            'id_skema_pendanaan' => $schema->id,
            'id_pengusul' => $researcher->id,
        ]);
    }

    public function test_proposal_submission_atomic_lock_prevents_double_submission(): void
    {
        Storage::fake('public');

        [$researcher, $university] = $this->createResearcherWithUniversity();

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Uji Idempotensi Atomic Lock',
            'deskripsi' => 'Skema untuk menguji penguncian atomic cache dari pengiriman ganda.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(1)->toDateString(),
            'is_active' => true,
        ]);

        $validPdfContent = "%PDF-1.5\n%Header\nKonten berkas.";
        $file = UploadedFile::fake()->createWithContent('proposal.pdf', $validPdfContent);

        $payload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengujian Penguncian Atomik Idempotensi Proposal Multi Akses',
            'abstrak' => 'Deskripsi abstrak usulan penelitian yang memenuhi batas minimal seratus karakter untuk menguji mekanisme atomic lock dari potensi duplikasi data akibat double submit.',
            'biaya_yang_diusulkan' => 25000000,
            'file_dokumen_proposal' => $file,
        ];

        // Simulate concurrent lock already held by another request/process
        $lockKey = 'submit-proposal:'.$researcher->id;
        $lock = Cache::lock($lockKey, 10);
        $acquired = $lock->get();
        $this->assertTrue($acquired, 'Atomic lock must be acquired for simulation.');

        try {
            $response = $this->actingAs($researcher)->post('/proposals', $payload);

            $response->assertSessionHasErrors('error');
            $errors = session('errors')->get('error');
            $this->assertStringContainsString('[PERINGATAN]', $errors[0]);

            $this->assertDatabaseMissing('proposals', [
                'id_skema_pendanaan' => $schema->id,
                'id_pengusul' => $researcher->id,
            ]);
        } finally {
            $lock->release();
        }
    }

    public function test_submitted_proposal_cannot_be_mutated_by_researcher(): void
    {
        [$researcher, $university] = $this->createResearcherWithUniversity();

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Skema Usulan Terkunci',
            'deskripsi' => 'Skema untuk menguji penguncian draft setelah berstatus submitted.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(1)->toDateString(),
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $university->id,
            'id_pengusul' => $researcher->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Proposal Riset yang Telah Diajukan Resmi ke LPPM',
            'abstrak' => 'Abstrak proposal riset yang sudah disubmit dan menunggu seleksi administrasi oleh operator LPPM.',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_SUBMITTED,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $updatePayload = [
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Percobaan Mengubah Judul Usulan yang Sudah Berstatus Submitted',
            'abstrak' => 'Deskripsi pembaruan yang seharusnya ditolak oleh sistem karena usulan sudah terkunci pada tahap seleksi.',
            'biaya_yang_diusulkan' => 40000000,
        ];

        $response = $this->actingAs($researcher)->put("/proposals/{$proposal->id}", $updatePayload);

        $response->assertStatus(403);

        $this->assertDatabaseHas('proposals', [
            'id' => $proposal->id,
            'judul_penelitian' => 'Proposal Riset yang Telah Diajukan Resmi ke LPPM',
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);
    }
}
