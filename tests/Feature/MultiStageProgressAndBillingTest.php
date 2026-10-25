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

class MultiStageProgressAndBillingTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected University $otherUniversity;

    protected ResearchSchema $schema;

    protected User $researcher;

    protected User $reviewer;

    protected User $financeAdmin;

    protected User $otherFinanceAdmin;

    protected User $superAdmin;

    protected MonevSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => Role::SUPER_ADMIN], ['display_name' => 'Super Admin']);
        Role::firstOrCreate(['name' => Role::ADMIN_KAMPUS], ['display_name' => 'Admin Kampus']);
        Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], ['display_name' => 'Admin Keuangan']);
        Role::firstOrCreate(['name' => Role::REVIEWER], ['display_name' => 'Reviewer']);
        Role::firstOrCreate(['name' => Role::PENELITI], ['display_name' => 'Peneliti']);

        $this->university = University::create([
            'code' => 'UMT',
            'name' => 'Universitas Muhammadiyah Terintegrasi',
        ]);

        $this->otherUniversity = University::create([
            'code' => 'UAD',
            'name' => 'Universitas Ahmad Dahlan',
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Penelitian Terapan Unggulan',
            'deskripsi' => 'Skema riset aplikatif.',
            'biaya_maksimal' => 50000000.00,
            'is_active' => true,
        ]);

        $this->researcher = $this->createUserWithRole(Role::PENELITI, $this->university);
        $this->reviewer = $this->createUserWithRole(Role::REVIEWER, $this->university);
        $this->financeAdmin = $this->createUserWithRole(Role::ADMIN_KEUANGAN, $this->university);
        $this->otherFinanceAdmin = $this->createUserWithRole(Role::ADMIN_KEUANGAN, $this->otherUniversity);
        $this->superAdmin = $this->createUserWithRole(Role::SUPER_ADMIN, $this->university);

        $this->schedule = MonevSchedule::create([
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Kemajuan Periode 2026',
            'tanggal_mulai' => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(20)->toDateString(),
            'deskripsi' => 'Jadwal monev aktif riset.',
            'is_active' => true,
        ]);
    }

    protected function createUserWithRole(string $roleName, University $university): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        /** @var User $user */
        $user = User::factory()->create([
            'university_id' => $university->id,
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        $user->roles()->syncWithoutDetaching([$role->id]);

        return $user;
    }

    protected function createProposalWithContract(float $danaDisetujui = 20000000.00): array
    {
        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Pertanian Presisi AI',
            'abstrak' => 'Abstrak penelitian pertanian presisi berbasis sensor cerdas.',
            'biaya_yang_diusulkan' => $danaDisetujui,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);

        $contract = Contract::create([
            'university_id' => $this->university->id,
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KTR/2026/T5/'.uniqid(),
            'judul_kontrak' => 'Kontrak Riset Sistem Pertanian Presisi AI',
            'dana_disetujui' => $danaDisetujui,
            'status_kontrak' => Contract::STATUS_ACTIVE,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(8)->toDateString(),
            'created_by' => $this->financeAdmin->id,
        ]);

        $termin1 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => $danaDisetujui * 0.70,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        $termin2 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => $danaDisetujui * 0.30,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        return [$proposal, $contract, $termin1, $termin2];
    }

    public function test_researcher_can_submit_progress_report_with_stage_presentation_and_billing(): void
    {
        Storage::fake('public');

        [$proposal] = $this->createProposalWithContract();

        $pdfContent = "%PDF-1.4\n%Laporan Kemajuan Antara\n%%EOF";
        $reportFile = UploadedFile::fake()->createWithContent('laporan_antara.pdf', $pdfContent);
        $presentationFile = UploadedFile::fake()->create('presentasi_monev.pptx', 2048, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        $billingFile = UploadedFile::fake()->createWithContent('tagihan_termin2.pdf', "%PDF-1.4\n%Invoice\n%%EOF");

        $payload = [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => 'Antara',
            'persentase_kemajuan' => 65,
            'ringkasan_progres' => 'Kemajuan riset telah mencapai tahap analisis data dan prototype sensor.',
            'catatan_kendala' => 'Kendala pasokan sensor impor teratasi.',
            'file_laporan_kemajuan' => $reportFile,
            'file_presentasi' => $presentationFile,
            'file_tagihan' => $billingFile,
            'nominal_tagihan' => 6000000.00,
        ];

        $response = $this->actingAs($this->researcher)->post(route('progress.store'), $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('progress.index'));

        $this->assertDatabaseHas('progress_reports', [
            'id_proposal' => $proposal->id,
            'tipe_laporan' => 'Antara',
            'persentase_kemajuan' => 65,
            'nominal_tagihan' => 6000000.00,
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        $report = ProgressReport::where('id_proposal', $proposal->id)->first();
        $this->assertNotNull($report->file_presentasi);
        $this->assertNotNull($report->file_tagihan);

        Storage::disk('public')->assertExists($report->file_laporan_kemajuan);
        Storage::disk('public')->assertExists($report->file_presentasi);
        Storage::disk('public')->assertExists($report->file_tagihan);
    }

    public function test_researcher_can_submit_all_four_report_stages(): void
    {
        Storage::fake('public');

        $stages = [
            ProgressReport::TIPE_PENDAHULUAN,
            ProgressReport::TIPE_BULANAN,
            ProgressReport::TIPE_ANTARA,
            ProgressReport::TIPE_AKHIR,
        ];

        [$proposal] = $this->createProposalWithContract();

        foreach ($stages as $index => $stage) {
            $pdfContent = "%PDF-1.4\n%Laporan {$stage}\n%%EOF";
            $reportFile = UploadedFile::fake()->createWithContent("laporan_{$stage}.pdf", $pdfContent);

            $payload = [
                'id_proposal' => $proposal->id,
                'id_monev_schedule' => $this->schedule->id,
                'tipe_laporan' => $stage,
                'persentase_kemajuan' => ($index + 1) * 25,
                'ringkasan_progres' => "Pengujian progres untuk tahapan {$stage} berhasil dieksekusi dengan baik.",
                'file_laporan_kemajuan' => $reportFile,
            ];

            $response = $this->actingAs($this->researcher)->post(route('progress.store'), $payload);
            $response->assertSessionHasNoErrors();
        }

        $this->assertEquals(4, ProgressReport::where('id_proposal', $proposal->id)->count());

        foreach ($stages as $stage) {
            $this->assertDatabaseHas('progress_reports', [
                'id_proposal' => $proposal->id,
                'tipe_laporan' => $stage,
            ]);
        }
    }

    public function test_validation_rejects_invalid_presentation_and_billing_files(): void
    {
        Storage::fake('public');

        [$proposal] = $this->createProposalWithContract();

        $pdfContent = "%PDF-1.4\n%Valid Report\n%%EOF";
        $reportFile = UploadedFile::fake()->createWithContent('laporan.pdf', $pdfContent);

        // File presentasi salah format (bukan pdf, ppt, pptx)
        $invalidPresentation = UploadedFile::fake()->create('slide.txt', 100, 'text/plain');

        // File tagihan salah format (bukan pdf, jpg, jpeg, png)
        $invalidBilling = UploadedFile::fake()->create('invoice.exe', 100, 'application/x-msdownload');

        $payload = [
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => 'Antara',
            'persentase_kemajuan' => 50,
            'ringkasan_progres' => 'Ringkasan progres riset minimal dua puluh karakter terisi.',
            'file_laporan_kemajuan' => $reportFile,
            'file_presentasi' => $invalidPresentation,
            'file_tagihan' => $invalidBilling,
        ];

        $response = $this->actingAs($this->researcher)->post(route('progress.store'), $payload);

        $response->assertSessionHasErrors(['file_presentasi', 'file_tagihan']);
    }

    public function test_termin_2_blocked_with_422_if_only_pendahuluan_or_bulanan_report_is_approved(): void
    {
        Storage::fake('public');

        [$proposal, $contract, $termin1, $termin2] = $this->createProposalWithContract();

        // Termin 1 sudah cair
        $termin1->update([
            'status_pencairan' => Funding::STATUS_DISBURSED,
            'tanggal_pencairan' => now()->subMonth()->toDateString(),
        ]);

        $proofFile = UploadedFile::fake()->createWithContent('transfer.pdf', "%PDF-1.4\n%Transfer\n%%EOF");
        $disbursePayload = [
            'bukti_transfer' => $proofFile,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan Termin 2',
        ];

        // 1. Tanpa laporan apapun -> 422
        $response = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $disbursePayload);
        $response->assertStatus(422);

        // 2. Hanya Laporan Pendahuluan yang Approved -> tetap 422
        ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => ProgressReport::TIPE_PENDAHULUAN,
            'persentase_kemajuan' => 25,
            'ringkasan_progres' => 'Laporan pendahuluan telah selesai dan disetujui.',
            'file_laporan_kemajuan' => 'reports/pendahuluan.pdf',
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $responsePendahuluan = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $disbursePayload);
        $responsePendahuluan->assertStatus(422);

        // 3. Ditambah Laporan Bulanan yang Approved -> tetap 422
        ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => ProgressReport::TIPE_BULANAN,
            'persentase_kemajuan' => 45,
            'ringkasan_progres' => 'Laporan bulanan telah selesai dan disetujui.',
            'file_laporan_kemajuan' => 'reports/bulanan.pdf',
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $responseBulanan = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $disbursePayload);
        $responseBulanan->assertStatus(422);

        // Termin 2 harus tetap Pending
        $this->assertEquals(Funding::STATUS_PENDING, $termin2->fresh()->status_pencairan);
    }

    public function test_termin_2_disbursement_succeeds_when_antara_report_is_approved(): void
    {
        Storage::fake('public');

        [$proposal, $contract, $termin1, $termin2] = $this->createProposalWithContract();

        $termin1->update([
            'status_pencairan' => Funding::STATUS_DISBURSED,
            'tanggal_pencairan' => now()->subMonth()->toDateString(),
        ]);

        // Buat Laporan Antara berstatus Approved
        ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => ProgressReport::TIPE_ANTARA,
            'persentase_kemajuan' => 70,
            'ringkasan_progres' => 'Laporan antara telah selesai dan telah disetujui reviewer.',
            'file_laporan_kemajuan' => 'reports/antara.pdf',
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $proofFile = UploadedFile::fake()->createWithContent('transfer_t2.pdf', "%PDF-1.4\n%Transfer T2\n%%EOF");
        $payload = [
            'bukti_transfer' => $proofFile,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan dana Termin 2 resmi disetujui.',
        ];

        $response = $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertEquals(Funding::STATUS_DISBURSED, $termin2->fresh()->status_pencairan);
        $this->assertNotNull($termin2->fresh()->bukti_transfer_path);
    }

    public function test_authorization_only_finance_admin_and_super_admin_can_disburse_funding(): void
    {
        Storage::fake('public');

        [$proposal, $contract, $termin1, $termin2] = $this->createProposalWithContract();

        $proofFile = UploadedFile::fake()->createWithContent('transfer_t1.pdf', "%PDF-1.4\n%Transfer\n%%EOF");
        $payload = [
            'bukti_transfer' => $proofFile,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan dana Termin 1',
        ];

        // 1. Peneliti ditolak (403)
        $this->actingAs($this->researcher)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload)
            ->assertStatus(403);

        // 2. Reviewer ditolak (403)
        $this->actingAs($this->reviewer)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload)
            ->assertStatus(403);

        // 3. Admin Keuangan kampus lain ditolak (403) karena tenancy isolation
        $this->actingAs($this->otherFinanceAdmin)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload)
            ->assertStatus(403);

        // 4. Admin Keuangan satu kampus berhasil
        $this->actingAs($this->financeAdmin)
            ->post("/finance/fundings/{$termin1->id}/disburse", $payload)
            ->assertRedirect();

        $this->assertEquals(Funding::STATUS_DISBURSED, $termin1->fresh()->status_pencairan);

        // 5. Super Admin berhasil (misal mencairkan termin 2 setelah Laporan Antara disetujui)
        ProgressReport::create([
            'id_proposal' => $proposal->id,
            'id_monev_schedule' => $this->schedule->id,
            'tipe_laporan' => ProgressReport::TIPE_ANTARA,
            'persentase_kemajuan' => 70,
            'ringkasan_progres' => 'Laporan antara telah disetujui reviewer.',
            'file_laporan_kemajuan' => 'reports/antara.pdf',
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $proofFile2 = UploadedFile::fake()->createWithContent('transfer_t2.pdf', "%PDF-1.4\n%Transfer2\n%%EOF");
        $payload2 = [
            'bukti_transfer' => $proofFile2,
            'tanggal_pencairan' => now()->toDateString(),
            'catatan_keuangan' => 'Pencairan dana Termin 2 oleh Super Admin',
        ];

        $this->actingAs($this->superAdmin)
            ->post("/finance/fundings/{$termin2->id}/disburse", $payload2)
            ->assertRedirect();

        $this->assertEquals(Funding::STATUS_DISBURSED, $termin2->fresh()->status_pencairan);
    }
}
