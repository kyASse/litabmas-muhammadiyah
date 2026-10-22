<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\Funding;
use App\Models\JournalOutput;
use App\Models\Proposal;
use App\Models\ProposalMember;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Review;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use App\Services\ReviewAggregationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Uji Defensif 11 Kasus Batas Kritis Sistem Penelitian Terintegrasi Standalone
 * Rujukan: docs/technical/rules.md (Bab 2) & PRD Bab 9
 *
 * Standar Mutu:
 * - 100% Bebas Emoji (Zero Emoji Invariant).
 * - Selaras dengan 21 Tabel Domain Bersih (schema.md).
 */
class CriticalEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    protected University $universityUmy;

    protected University $universityUad;

    protected User $penelitiUmy;

    protected User $penelitiUad;

    protected User $adminUmy;

    protected User $reviewerUmy;

    protected User $superAdmin;

    protected ResearchSchema $schemaUmy;

    protected function setUp(): void
    {
        parent::setUp();

        $rolePeneliti = Role::firstOrCreate(['name' => Role::PENELITI]);
        $roleAdmin = Role::firstOrCreate(['name' => Role::ADMIN_KAMPUS]);
        $roleReviewer = Role::firstOrCreate(['name' => Role::REVIEWER]);
        $roleSuper = Role::firstOrCreate(['name' => Role::SUPER_ADMIN]);

        $this->universityUmy = University::create([
            'code' => 'UMY',
            'name' => 'Universitas Muhammadiyah Yogyakarta',
            'is_active' => true,
        ]);

        $this->universityUad = University::create([
            'code' => 'UAD',
            'name' => 'Universitas Ahmad Dahlan',
            'is_active' => true,
        ]);

        $this->penelitiUmy = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $rolePeneliti->id,
            'is_active' => true,
        ]);

        $this->penelitiUad = User::factory()->create([
            'university_id' => $this->universityUad->id,
            'role_id' => $rolePeneliti->id,
            'is_active' => true,
        ]);

        $this->adminUmy = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $roleAdmin->id,
            'is_active' => true,
        ]);

        $this->reviewerUmy = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $roleReviewer->id,
            'is_reviewer' => true,
            'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'university_id' => null,
            'role_id' => $roleSuper->id,
            'is_active' => true,
        ]);

        $this->schemaUmy = ResearchSchema::create([
            'university_id' => $this->universityUmy->id,
            'nama_skema' => 'Skema Unggulan UMY 2026',
            'deskripsi' => 'Skema riset internal kampus UMY.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => Carbon::now()->subDays(10)->toDateString(),
            'tanggal_selesai' => Carbon::now()->addDays(30)->toDateString(),
            'is_active' => true,
        ]);
    }

    /**
     * [KASUS 01] IDOR via URL Parameter (TenantScope).
     * Pengguna dari UAD dicegat mengakses proposal milik UMY (HTTP 403 atau 404).
     */
    public function test_kasus_01_idor_across_campuses_is_intercepted_by_tenant_scope(): void
    {
        $proposalUmy = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Rahasia Desain Radar UMY',
            'abstrak' => 'Abstrak riset rahasia teknologi kampus UMY dengan narasi ilmiah minimal seratus karakter lengkap.',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_DRAFT,
        ]);

        $this->actingAs($this->penelitiUad);

        $response = $this->get('/proposals/'.$proposalUmy->id);
        $this->assertTrue(in_array($response->status(), [403, 404], true), '[FAIL] Akses IDOR lintas kampus tidak dicegat.');
    }

    /**
     * [KASUS 02] Conflict of Interest (CoI) Reviewer Guard.
     * Penugasan reviewer ditolak jika reviewer adalah ketua pengusul atau anggota tim.
     */
    public function test_kasus_02_reviewer_coi_is_strictly_blocked(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Evaluasi Algoritma Enkripsi',
            'abstrak' => 'Abstrak riset enkripsi data dengan narasi ilmiah minimal seratus karakter untuk memenuhi validasi sistem.',
            'biaya_yang_diusulkan' => 25000000,
            'status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID,
        ]);

        // Anggota tim
        $anggotaTim = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $this->reviewerUmy->role_id,
            'is_reviewer' => true,
        ]);

        ProposalMember::create([
            'id_proposal' => $proposal->id,
            'user_id' => $anggotaTim->id,
            'peran' => 'Anggota Tim Peneliti',
            'alokasi_jam_per_minggu' => 10,
        ]);

        $this->actingAs($this->adminUmy);

        // Uji CoI 1: Menugaskan pengusul sendiri sebagai reviewer
        $response1 = $this->post(route('admin.assign.store'), [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $this->penelitiUmy->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
        ]);
        $response1->assertSessionHasErrors('id_reviewer');

        // Uji CoI 2: Menugaskan anggota tim sebagai reviewer
        $response2 = $this->post(route('admin.assign.store'), [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $anggotaTim->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
        ]);
        $response2->assertSessionHasErrors('id_reviewer');
    }

    /**
     * [KASUS 03] Universitas Dinonaktifkan (Tenant Suspension).
     * Civitas kampus yang disuspensi langsung dicegat oleh CheckTenantActive middleware.
     */
    public function test_kasus_03_tenant_suspension_intercepts_all_requests_immediately(): void
    {
        $this->universityUmy->update(['is_active' => false]);

        $this->actingAs($this->penelitiUmy);

        $response = $this->get('/proposals');
        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('email');
    }

    /**
     * [KASUS 04] Deadline Race Condition.
     * Pengajuan proposal pasca-tenggat skema ditolak oleh backend FormRequest.
     */
    public function test_kasus_04_deadline_race_condition_rejected_after_schema_expiry(): void
    {
        $expiredSchema = ResearchSchema::create([
            'university_id' => $this->universityUmy->id,
            'nama_skema' => 'Skema Kedaluwarsa 2026',
            'deskripsi' => 'Skema yang telah melewati batas waktu penerimaan usulan.',
            'biaya_maksimal' => 20000000,
            'tanggal_mulai' => Carbon::now()->subMonths(2)->toDateString(),
            'tanggal_selesai' => Carbon::now()->subDay()->toDateString(), // Kemarin
            'is_active' => true,
        ]);

        $this->actingAs($this->penelitiUmy);

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('proposal_telat.pdf', $pdfContent);

        $response = $this->post(route('proposals.store'), [
            'id_skema_pendanaan' => $expiredSchema->id,
            'judul_penelitian' => 'Pengajuan Usulan Terlambat Pasca Deadline',
            'abstrak' => 'Naskah abstrak pengajuan usulan terlambat yang dikirim setelah penutupan resmi skema oleh LPPM.',
            'biaya_yang_diusulkan' => 15000000,
            'action' => 'submit',
            'file_dokumen_proposal' => $file,
        ]);

        $response->assertSessionHasErrors('id_skema_pendanaan');
    }

    /**
     * [KASUS 05] Double Submission / Idempotency Cache Lock.
     * Percobaan submit berulang pada jeda cepat dicegat oleh lock cache.
     */
    public function test_kasus_05_double_submission_prevented_by_cache_lock(): void
    {
        $this->actingAs($this->penelitiUmy);

        // Simulasi request pertama sedang berjalan dan memegang lock
        $lockKey = 'submit-proposal:'.$this->penelitiUmy->id;
        $lock = Cache::lock($lockKey, 10);
        $this->assertTrue($lock->get());

        try {
            $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
            $file = UploadedFile::fake()->createWithContent('proposal.pdf', $pdfContent);

            $response = $this->post(route('proposals.store'), [
                'id_skema_pendanaan' => $this->schemaUmy->id,
                'judul_penelitian' => 'Pengajuan Usulan Klik Ganda',
                'abstrak' => 'Abstrak pengujian idempotency pencegahan pengiriman ganda pada koneksi latensi tinggi dengan panjang karakter melebihi seratus karakter untuk validasi.',
                'biaya_yang_diusulkan' => 15000000,
                'action' => 'submit',
                'file_dokumen_proposal' => $file,
            ]);

            $response->assertSessionHasErrors('error');
        } finally {
            $lock->release();
        }
    }

    /**
     * [KASUS 06] Reviewer Ghosting & Re-assignment Workflow.
     * Pencabutan tugas reviewer mangkir mengalihkan penugasan dan mencatat activity log.
     */
    public function test_kasus_06_reviewer_reassignment_resets_review_and_records_audit(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Evaluasi Kinerja Turbin Angin',
            'abstrak' => 'Abstrak evaluasi turbin angin mikro pada wilayah pantai selatan Daerah Istimewa Yogyakarta.',
            'biaya_yang_diusulkan' => 20000000,
            'status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID,
        ]);

        $review = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $this->reviewerUmy->id,
            'tanggal_mulai_review' => now()->subDays(15)->toDateString(),
            'tanggal_selesai_review' => now()->subDay()->toDateString(), // Overdue
            'status_review' => Review::STATUS_IN_PROGRESS,
            'skor_total' => 0,
        ]);

        $reviewerBaru = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $this->reviewerUmy->role_id,
            'is_reviewer' => true,
        ]);

        $this->actingAs($this->adminUmy);

        $response = $this->post(route('admin.assign.reassign', $review->id), [
            'id_reviewer_baru' => $reviewerBaru->id,
            'alasan_pencabutan' => 'Reviewer tidak merespons hingga batas waktu berakhir.',
            'tanggal_selesai_baru' => now()->addDays(10)->toDateString(),
        ]);

        $response->assertSessionHasNoErrors();

        $review->refresh();
        $this->assertEquals($reviewerBaru->id, $review->id_reviewer);
        $this->assertEquals(Review::STATUS_ASSIGNED, $review->status_review);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->adminUmy->id,
        ]);
        $log = ActivityLog::latest('id')->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('REVOKE_REVIEWER', $log->activity);
    }

    /**
     * [KASUS 07] Disparitas Skor Ekstrem (> 30 Poin).
     * ReviewAggregationService mendeteksi disparitas dan mewajibkan reviewer ke-3.
     */
    public function test_kasus_07_score_disparity_over_30_points_detected(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Sintesis Material Katalis',
            'abstrak' => 'Abstrak riset material katalis heterogen untuk reduksi emisi gas buang industri.',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID,
        ]);

        $rev2 = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $this->reviewerUmy->role_id,
            'is_reviewer' => true,
        ]);

        Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $this->reviewerUmy->id,
            'skor_total' => 92.00,
            'status_review' => Review::STATUS_COMPLETED,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(7)->toDateString(),
        ]);

        Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $rev2->id,
            'skor_total' => 55.00,
            'status_review' => Review::STATUS_COMPLETED,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(7)->toDateString(),
        ]);

        $service = new ReviewAggregationService;
        $result = $service->calculateFinalScore($proposal->id);

        $this->assertEquals('DISCREPANCY_DETECTED', $result['status']);
        $this->assertTrue($result['requires_third_reviewer']);
        $this->assertEquals(37.0, $result['disparity']);
    }

    /**
     * [KASUS 08] Penyesuaian Pagu Anggaran (Budget Cut Adjustment).
     * Nilai termin 70:30 dihitung 100% dari dana_disetujui, mengabaikan usulan awal.
     */
    public function test_kasus_08_budget_adjustment_computes_exact_70_30_split(): void
    {
        $roleKeuangan = Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN]);
        $keuangan = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $roleKeuangan->id,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Fabrikasi Panel Surya Fleksibel',
            'abstrak' => 'Abstrak riset teknologi panel surya fleksibel dengan efisiensi konversi daya optimal.',
            'biaya_yang_diusulkan' => 40000000, // Dosen minta 40jt
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $this->actingAs($keuangan);

        // LPPM hanya setujui 20jt
        $response = $this->post(route('finance.contracts.store'), [
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KNT/UMY/2026/099',
            'dana_disetujui' => 20000000,
            'tanggal_kontrak' => now()->toDateString(),
        ]);
        $response->assertSessionHasNoErrors();

        $contract = Contract::where('id_proposal', $proposal->id)->firstOrFail();
        $this->assertEquals(20000000, (float) $contract->dana_disetujui);

        $t1 = Funding::where('id_contract', $contract->id)->where('termin_ke', 1)->firstOrFail();
        $t2 = Funding::where('id_contract', $contract->id)->where('termin_ke', 2)->firstOrFail();

        $this->assertEquals(14000000, (float) $t1->nominal_dana); // 70% dari 20jt
        $this->assertEquals(6000000, (float) $t2->nominal_dana);  // 30% dari 20jt
    }

    /**
     * [KASUS 09] Monev Gatekeeper Lock Termin 2.
     * Pencairan Termin 2 diblokir secara absolut (HTTP 422) sebelum Monev berstatus Approved.
     */
    public function test_kasus_09_termin_2_disbursement_blocked_until_monev_approved(): void
    {
        $roleKeuangan = Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN]);
        $keuangan = User::factory()->create([
            'university_id' => $this->universityUmy->id,
            'role_id' => $roleKeuangan->id,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Optimasi Jalur Logistik Cerdas',
            'abstrak' => 'Abstrak riset optimasi rantai pasok cerdas berbasis algoritma genetika hibrida.',
            'biaya_yang_diusulkan' => 30000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $contract = Contract::create([
            'university_id' => $this->universityUmy->id,
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KNT/UMY/2026/088',
            'judul_kontrak' => $proposal->judul_penelitian,
            'dana_disetujui' => 30000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => Contract::STATUS_ACTIVE,
        ]);

        $termin2 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => 9000000,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        $this->actingAs($keuangan);

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('transfer.pdf', $pdfContent);

        // Belum ada monev approved -> wajib 422
        $response = $this->post(route('finance.funding.disburse', $termin2->id), [
            'tanggal_pencairan' => now()->toDateString(),
            'bukti_transfer' => $file,
            'catatan_keuangan' => 'Percobaan pencairan Termin 2 tanpa monev',
        ]);

        $response->assertStatus(422);
    }

    /**
     * [KASUS 10] Pencegahan Klaim Luaran Ganda (DOI/ISBN).
     * Mendaftarkan DOI yang telah ada pada proposal lain ditolak oleh sistem.
     */
    public function test_kasus_10_duplicate_output_claim_is_rejected(): void
    {
        $proposal1 = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Biofertilizer Berbasis Konsorsium Bakteri',
            'abstrak' => 'Abstrak riset pupuk hayati dengan formulasi konsorsium mikroba pelarut fosfat.',
            'biaya_yang_diusulkan' => 20000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $out1 = ResearchOutput::create([
            'id_proposal' => $proposal1->id,
            'tipe_luaran' => ResearchOutput::TIPE_JOURNAL,
            'target_status' => ResearchOutput::TARGET_WAJIB,
            'status_verifikasi' => ResearchOutput::STATUS_VERIFIED,
        ]);

        JournalOutput::create([
            'id_research_output' => $out1->id,
            'nama_jurnal' => 'Journal of Biotechnology',
            'judul_artikel' => 'Biofertilizer Consortia Effects',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1016/j.biotech.2026.01',
        ]);

        // Proposal ke-2 mencoba klaim DOI yang sama
        $proposal2 = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Evaluasi Pertumbuhan Tanaman',
            'abstrak' => 'Abstrak riset kedua yang mencoba menggunakan luaran jurnal yang sama.',
            'biaya_yang_diusulkan' => 20000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $this->actingAs($this->penelitiUmy);

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $proposal2->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'Journal of Biotechnology',
            'judul_artikel' => 'Biofertilizer Consortia Effects Duplicate',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1016/j.biotech.2026.01', // Sama persis
            'file_dokumen' => $file,
        ]);

        $response->assertSessionHasErrors('doi_url');
    }

    /**
     * [KASUS 11] Protokol Force Majeure.
     * Riset ditutup dengan status Gagal, kontrak ditutup, dan pendanaan pending dibatalkan.
     */
    public function test_kasus_11_force_majeure_protocol_terminates_research_and_cancels_funding(): void
    {
        $proposal = Proposal::create([
            'university_id' => $this->universityUmy->id,
            'id_pengusul' => $this->penelitiUmy->id,
            'id_skema_pendanaan' => $this->schemaUmy->id,
            'judul_penelitian' => 'Riset Observasi Geologi Sesar Aktif',
            'abstrak' => 'Abstrak riset geologi lapangan pada wilayah rawan gempa tektonik.',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);

        $contract = Contract::create([
            'university_id' => $this->universityUmy->id,
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KNT/UMY/2026/077',
            'judul_kontrak' => $proposal->judul_penelitian,
            'dana_disetujui' => 35000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => Contract::STATUS_ACTIVE,
        ]);

        Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => 24500000,
            'status_pencairan' => Funding::STATUS_DISBURSED,
        ]);

        $pendingTermin = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => 10500000,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        $this->actingAs($this->adminUmy);

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('berita_acara_kahar.pdf', $pdfContent);

        $response = $this->post(route('admin.proposals.terminate', $proposal->id), [
            'alasan_terminasi' => 'Bencana alam merusak lokasi observasi lapangan secara permanen.',
            'file_berita_acara' => $file,
        ]);

        $response->assertSessionHasNoErrors();

        $contract->refresh();
        $this->assertEquals(Contract::STATUS_CLOSED, $contract->status_kontrak);

        $pendingTermin->refresh();
        $this->assertEquals(Funding::STATUS_CANCELLED, $pendingTermin->status_pencairan);

        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $proposal->id,
            'status_penelitian' => 'Gagal',
        ]);
    }
}
