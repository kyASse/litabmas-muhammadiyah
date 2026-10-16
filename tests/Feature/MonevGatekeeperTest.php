<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Funding;
use App\Models\MonevSchedule;
use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MonevGatekeeperTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected ResearchSchema $schema;
    protected User $adminKampus;
    protected User $financeAdmin;
    protected User $reviewer;
    protected User $researcher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => Role::SUPER_ADMIN], ['display_name' => 'Super Admin']);
        Role::firstOrCreate(['name' => Role::ADMIN_KAMPUS], ['display_name' => 'Admin Kampus']);
        Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], ['display_name' => 'Admin Keuangan']);
        Role::firstOrCreate(['name' => Role::REVIEWER], ['display_name' => 'Reviewer']);
        Role::firstOrCreate(['name' => Role::PENELITI], ['display_name' => 'Peneliti']);
        Role::firstOrCreate(['name' => Role::USER], ['display_name' => 'User']);

        $this->university = University::create([
            'code' => 'UMT',
            'name' => 'Universitas Muhammadiyah Terintegrasi',
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Penelitian Terapan Unggulan',
            'deskripsi' => 'Skema riset aplikatif berorientasi produk.',
            'biaya_maksimal' => 50000000.00,
            'is_active' => true,
        ]);

        $this->adminKampus = $this->createUserWithRole(Role::ADMIN_KAMPUS);
        $this->financeAdmin = $this->createUserWithRole(Role::ADMIN_KEUANGAN);
        $this->reviewer = $this->createUserWithRole(Role::REVIEWER);
        $this->researcher = $this->createUserWithRole(Role::PENELITI);
    }

    protected function createUserWithRole(string $roleName): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        /** @var User $user */
        $user = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        $user->roles()->syncWithoutDetaching([$role->id]);

        return $user;
    }

    protected function createProposal(string $status = Proposal::STATUS_LOLOS_DIDANAI): Proposal
    {
        return Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Pertanian Presisi Berbasis AI',
            'abstrak' => 'Riset implementasi sensor cerdas untuk optimasi irigasi pertanian.',
            'biaya_yang_diusulkan' => 30000000.00,
            'status_proposal' => $status,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);
    }

    /**
     * Helper untuk membuat kontrak dengan 2 termin (Termin 1 = 70%, Termin 2 = 30%).
     *
     * @return array{0: Contract, 1: Funding, 2: Funding}
     */
    protected function createContractWithTermins(float $danaDisetujui = 20000000.00): array
    {
        $proposal = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI);

        $contract = Contract::create([
            'university_id' => $this->university->id,
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KTR/'.date('Y').'/UMT/0001',
            'judul_kontrak' => $proposal->judul_penelitian,
            'dana_disetujui' => $danaDisetujui,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => Contract::STATUS_SIGNED,
        ]);

        $termin1Nominal = round($danaDisetujui * 0.70, 2);
        $termin2Nominal = $danaDisetujui - $termin1Nominal;

        $termin1 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => $termin1Nominal,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        $termin2 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => $termin2Nominal,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        return [$contract, $termin1, $termin2];
    }

    protected function createActiveMonevSchedule(): MonevSchedule
    {
        return MonevSchedule::create([
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Kemajuan Riset Semester Ganjil 2026',
            'tanggal_mulai' => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(10)->toDateString(),
            'deskripsi' => 'Periode pengunggahan berkas laporan kemajuan riset.',
            'is_active' => true,
        ]);
    }

    public function test_termin_1_disbursement_succeeds_with_valid_bank_transfer_proof(): void
    {
        Storage::fake('public');

        [$contract, $termin1, $termin2] = $this->createContractWithTermins();

        $pdfContent = "%PDF-1.5\n%Bukti transfer termin 1\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('bukti_transfer_termin1.pdf', $pdfContent);

        $payload = [
            'bukti_transfer' => $file,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan dana Termin 1 sebesar 70% telah berhasil diproses.',
        ];

        $response = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $termin1->refresh();
        $this->assertEquals(Funding::STATUS_DISBURSED, $termin1->status_pencairan);
        $this->assertNotNull($termin1->bukti_transfer_path);
        $this->assertEquals(now()->toDateString(), $termin1->tanggal_pencairan?->toDateString() ?? $termin1->tanggal_pencairan);
        $this->assertEquals($payload['catatan_keuangan'], $termin1->catatan_keuangan);

        Storage::disk('public')->assertExists($termin1->bukti_transfer_path);
    }

    public function test_termin_2_disbursement_is_blocked_with_422_when_monev_not_approved(): void
    {
        Storage::fake('public');

        [$contract, $termin1, $termin2] = $this->createContractWithTermins();

        // Termin 1 dicairkan terlebih dahulu
        $termin1->update([
            'status_pencairan' => Funding::STATUS_DISBURSED,
            'tanggal_pencairan' => now()->subMonth()->toDateString(),
        ]);

        $pdfContent = "%PDF-1.5\n%Bukti transfer termin 2\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('bukti_transfer_termin2.pdf', $pdfContent);

        $payload = [
            'bukti_transfer' => $file,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Percobaan pencairan Termin 2 sebelum monev disetujui.',
        ];

        // Skenario A: Belum ada laporan kemajuan sama sekali (wajib HTTP 422)
        $responseWithoutReport = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload);

        $responseWithoutReport->assertStatus(422);

        $termin2->refresh();
        $this->assertEquals(Funding::STATUS_PENDING, $termin2->status_pencairan);

        // Skenario B: Laporan kemajuan ada tetapi masih berstatus Submitted (belum dievaluasi)
        $schedule = $this->createActiveMonevSchedule();
        $report = ProgressReport::create([
            'id_proposal' => $contract->id_proposal,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 60,
            'ringkasan_progres' => 'Pengujian instrumen telah berjalan 60 persen.',
            'file_laporan_kemajuan' => 'reports/progress_draft.pdf',
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        $responseSubmitted = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload);

        $responseSubmitted->assertStatus(422);

        // Skenario C: Laporan kemajuan berstatus Revision (perlu perbaikan)
        $report->update(['status_laporan' => ProgressReport::STATUS_REVISION]);

        $responseRevision = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload);

        $responseRevision->assertStatus(422);

        $termin2->refresh();
        $this->assertEquals(Funding::STATUS_PENDING, $termin2->status_pencairan);
    }

    public function test_termin_2_disbursement_succeeds_after_monev_is_approved(): void
    {
        Storage::fake('public');

        [$contract, $termin1, $termin2] = $this->createContractWithTermins();

        // Termin 1 sudah dicairkan
        $termin1->update([
            'status_pencairan' => Funding::STATUS_DISBURSED,
            'tanggal_pencairan' => now()->subMonth()->toDateString(),
        ]);

        // Laporan kemajuan disetujui (Approved) oleh reviewer
        $schedule = $this->createActiveMonevSchedule();
        ProgressReport::create([
            'id_proposal' => $contract->id_proposal,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 75,
            'ringkasan_progres' => 'Capaian luaran dan progres riset telah mencapai 75 persen.',
            'file_laporan_kemajuan' => 'reports/progress_approved.pdf',
            'skor_monev' => 88.50,
            'catatan_reviewer_monev' => 'Progres riset sesuai dengan target capaian.',
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $pdfContent = "%PDF-1.5\n%Bukti transfer termin 2 resmi\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('bukti_transfer_termin2.pdf', $pdfContent);

        $payload = [
            'bukti_transfer' => $file,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan dana Termin 2 sebesar 30% setelah Monev disetujui.',
        ];

        $response = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $termin2->refresh();
        $this->assertEquals(Funding::STATUS_DISBURSED, $termin2->status_pencairan);
        $this->assertNotNull($termin2->bukti_transfer_path);
        Storage::disk('public')->assertExists($termin2->bukti_transfer_path);
    }

    public function test_termin_disbursement_fails_without_bank_transfer_proof(): void
    {
        Storage::fake('public');

        [$contract, $termin1, $termin2] = $this->createContractWithTermins();

        $payload = [
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan tanpa berkas bukti transfer.',
        ];

        $response = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload);

        $response->assertSessionHasErrors('bukti_transfer');

        $termin1->refresh();
        $this->assertEquals(Funding::STATUS_PENDING, $termin1->status_pencairan);
    }

    public function test_termin_disbursement_enforces_tenant_isolation(): void
    {
        Storage::fake('public');

        [$contract, $termin1, $termin2] = $this->createContractWithTermins();

        // Buat institusi lain beserta user Admin Keuangan dari institusi tersebut
        $otherUniversity = University::create([
            'code' => 'UMS',
            'name' => 'Universitas Muhammadiyah Surakarta',
        ]);

        $roleFinance = Role::where('name', Role::ADMIN_KEUANGAN)->firstOrFail();
        /** @var User $otherFinanceAdmin */
        $otherFinanceAdmin = User::factory()->create([
            'university_id' => $otherUniversity->id,
            'role_id' => $roleFinance->id,
            'is_active' => true,
        ]);
        $otherFinanceAdmin->roles()->syncWithoutDetaching([$roleFinance->id]);

        $pdfContent = "%PDF-1.5\n%Bukti transfer cross-tenant\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('bukti_transfer_cross.pdf', $pdfContent);

        $payload = [
            'bukti_transfer' => $file,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Percobaan pencairan lintas universitas.',
        ];

        $response = $this->actingAs($otherFinanceAdmin)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload);

        // Akses lintas tenant wajib ditolak dengan HTTP 403 Forbidden
        $response->assertStatus(403);

        $termin1->refresh();
        $this->assertEquals(Funding::STATUS_PENDING, $termin1->status_pencairan);
    }

    public function test_progress_report_submission_rejected_outside_active_monev_schedule(): void
    {
        Storage::fake('public');

        $proposal = $this->createProposal();

        // Jadwal monev yang sudah kedaluwarsa (masa lampau)
        $expiredSchedule = MonevSchedule::create([
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Semester Lalu',
            'tanggal_mulai' => now()->subDays(30)->toDateString(),
            'tanggal_selesai' => now()->subDays(10)->toDateString(),
            'deskripsi' => 'Tahap monev yang sudah berakhir.',
            'is_active' => true,
        ]);

        $pdfContent = "%PDF-1.5\n%Laporan konten pengujian\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('laporan_kemajuan.pdf', $pdfContent);

        $payloadExpired = [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $expiredSchedule->id,
            'persentase_kemajuan' => 50,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $file,
        ];

        $responseExpired = $this->actingAs($this->researcher)
            ->post('/progress', $payloadExpired);

        $responseExpired->assertSessionHasErrors();
        $this->assertDatabaseMissing('progress_reports', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $expiredSchedule->id,
        ]);

        // Jadwal monev di masa depan (belum dibuka)
        $futureSchedule = MonevSchedule::create([
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Tahap 2 Masa Depan',
            'tanggal_mulai' => now()->addDays(10)->toDateString(),
            'tanggal_selesai' => now()->addDays(25)->toDateString(),
            'deskripsi' => 'Tahap monev belum dimulai.',
            'is_active' => true,
        ]);

        $payloadFuture = [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $futureSchedule->id,
            'persentase_kemajuan' => 50,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $file,
        ];

        $responseFuture = $this->actingAs($this->researcher)
            ->post('/progress', $payloadFuture);

        $responseFuture->assertSessionHasErrors();
        $this->assertDatabaseMissing('progress_reports', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $futureSchedule->id,
        ]);
    }

    public function test_progress_report_submission_validates_pdf_and_percentage(): void
    {
        Storage::fake('public');

        $proposal = $this->createProposal();
        $activeSchedule = $this->createActiveMonevSchedule();

        // 1. Berkas bukan PDF
        $invalidFile = UploadedFile::fake()->create('laporan.docx', 500, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        $responseInvalidFile = $this->actingAs($this->researcher)->post('/progress', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $activeSchedule->id,
            'persentase_kemajuan' => 50,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $invalidFile,
        ]);
        $responseInvalidFile->assertSessionHasErrors('file_laporan_kemajuan');

        // 2. Berkas melebihi 10MB (> 10240 KB)
        $oversizedFile = UploadedFile::fake()->create('laporan_besar.pdf', 11000, 'application/pdf');
        $responseOversized = $this->actingAs($this->researcher)->post('/progress', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $activeSchedule->id,
            'persentase_kemajuan' => 50,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $oversizedFile,
        ]);
        $responseOversized->assertSessionHasErrors('file_laporan_kemajuan');

        // 3. Persentase kemajuan di luar rentang 1-100%
        $validPdf = UploadedFile::fake()->createWithContent('laporan.pdf', "%PDF-1.5\n%Laporan valid\n%%EOF");

        $responseZeroPercent = $this->actingAs($this->researcher)->post('/progress', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $activeSchedule->id,
            'persentase_kemajuan' => 0,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $validPdf,
        ]);
        $responseZeroPercent->assertSessionHasErrors('persentase_kemajuan');

        $responseExcessPercent = $this->actingAs($this->researcher)->post('/progress', [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $activeSchedule->id,
            'persentase_kemajuan' => 150,
            'ringkasan_progres' => 'Penelitian telah mencapai tahap pengumpulan data lapangan yang representatif.',
            'file_laporan_kemajuan' => $validPdf,
        ]);
        $responseExcessPercent->assertSessionHasErrors('persentase_kemajuan');
    }

    public function test_admin_can_create_monev_schedule(): void
    {
        $payload = [
            'nama_tahap' => 'Monev Kemajuan Riset Semester Ganjil 2026',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addDays(14)->toDateString(),
            'deskripsi' => 'Monitoring dan evaluasi laporan kemajuan penelitian tahun 2026.',
        ];

        $response = $this->actingAs($this->adminKampus)
            ->post('/admin/monev-schedules', $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('monev_schedules', [
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Kemajuan Riset Semester Ganjil 2026',
        ]);
    }

    public function test_reviewer_can_evaluate_monev_progress_report(): void
    {
        $proposal = $this->createProposal();
        $schedule = $this->createActiveMonevSchedule();

        $report = ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 70,
            'ringkasan_progres' => 'Tahap pengujian lapangan dan pengumpulan data selesai.',
            'file_laporan_kemajuan' => 'reports/progress_testing.pdf',
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        $payload = [
            'skor_monev' => 85.50,
            'status_laporan' => 'Approved',
            'catatan_reviewer_monev' => 'Progres penelitian telah sesuai dengan target luaran yang direncanakan.',
        ];

        $response = $this->actingAs($this->reviewer)
            ->post("/reviewer/monev/{$report->id}/evaluate", $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $report->refresh();
        $this->assertEquals(ProgressReport::STATUS_APPROVED, $report->status_laporan);
        $this->assertEquals(85.50, (float) $report->skor_monev);
        $this->assertEquals($payload['catatan_reviewer_monev'], $report->catatan_reviewer_monev);
    }

    public function test_reviewer_evaluation_blocked_when_conflict_of_interest(): void
    {
        $proposal = $this->createProposal();
        $schedule = $this->createActiveMonevSchedule();

        $report = ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 70,
            'ringkasan_progres' => 'Tahap pengujian lapangan dan pengumpulan data selesai.',
            'file_laporan_kemajuan' => 'reports/progress_testing.pdf',
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        $payload = [
            'skor_monev' => 90.00,
            'status_laporan' => 'Approved',
            'catatan_reviewer_monev' => 'Reviewer mengevaluasi usulan miliknya sendiri.',
        ];

        // Reviewer juga merangkap sebagai pengusul proposal ini ($this->researcher)
        $roleReviewer = Role::where('name', Role::REVIEWER)->firstOrFail();
        $this->researcher->roles()->syncWithoutDetaching([$roleReviewer->id]);

        $response = $this->actingAs($this->researcher)
            ->post("/reviewer/monev/{$report->id}/evaluate", $payload);

        $response->assertStatus(403);
    }

    public function test_reviewer_evaluation_blocked_across_tenants(): void
    {
        $proposal = $this->createProposal();
        $schedule = $this->createActiveMonevSchedule();

        $report = ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 70,
            'ringkasan_progres' => 'Tahap pengujian lapangan dan pengumpulan data selesai.',
            'file_laporan_kemajuan' => 'reports/progress_testing.pdf',
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        $otherUniversity = University::create([
            'code' => 'UMY',
            'name' => 'Universitas Muhammadiyah Yogyakarta',
        ]);
        $roleReviewer = Role::where('name', Role::REVIEWER)->firstOrFail();
        $otherReviewer = User::factory()->create([
            'university_id' => $otherUniversity->id,
            'role_id' => $roleReviewer->id,
            'is_active' => true,
        ]);
        $otherReviewer->roles()->syncWithoutDetaching([$roleReviewer->id]);

        $payload = [
            'skor_monev' => 80.00,
            'status_laporan' => 'Approved',
            'catatan_reviewer_monev' => 'Evaluasi monev lintas tenant.',
        ];

        $response = $this->actingAs($otherReviewer)
            ->post("/reviewer/monev/{$report->id}/evaluate", $payload);

        $response->assertStatus(403);
    }
}
