<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Proposal;
use App\Models\ProposalMember;
use App\Models\ResearchSchema;
use App\Models\Review;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use App\Services\ReviewAggregationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewAssignmentCoITest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected ResearchSchema $schema;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => Role::SUPER_ADMIN], ['display_name' => 'Super Admin']);
        Role::firstOrCreate(['name' => Role::ADMIN_KAMPUS], ['display_name' => 'Admin Kampus']);
        Role::firstOrCreate(['name' => Role::REVIEWER], ['display_name' => 'Reviewer']);
        Role::firstOrCreate(['name' => Role::USER], ['display_name' => 'Dosen / Peneliti']);

        $this->university = University::create([
            'code' => 'UMT-TEST',
            'name' => 'Universitas Muhammadiyah Uji Riset',
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'name' => 'Skema Dasar Terapan',
            'max_funding' => 50000000.00,
            'is_active' => true,
        ]);
    }

    protected function createAdminKampus(): User
    {
        $role = Role::where('name', Role::ADMIN_KAMPUS)->first();
        return User::factory()->create([
            'role_id' => $role->id,
            'university_id' => $this->university->id,
        ]);
    }

    protected function createReviewer(): User
    {
        $role = Role::where('name', Role::REVIEWER)->first();
        return User::factory()->create([
            'role_id' => $role->id,
            'university_id' => $this->university->id,
        ]);
    }

    protected function createProposal(User $author): Proposal
    {
        return Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $author->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Tata Kelola Riset Berbasis AI',
            'abstrak' => 'Abstrak pengujian usulan riset mandiri...',
            'latar_belakang' => 'Latar belakang pengujian...',
            'biaya_yang_diusulkan' => 30000000.00,
            'status_proposal' => 'Administrasi_Valid',
            'tanggal_pengajuan' => now()->toDateString(),
        ]);
    }

    public function test_admin_can_assign_independent_reviewer_successfully(): void
    {
        $admin = $this->createAdminKampus();
        $author = $this->createReviewer();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $payload = [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
        ];

        $response = $this->actingAs($admin)->post('/admin/assign', $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('reviews', [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer->id,
            'status_review' => 'Assigned',
        ]);
    }

    public function test_assignment_fails_if_reviewer_is_lead_researcher_coi(): void
    {
        $admin = $this->createAdminKampus();
        $authorReviewer = $this->createReviewer();
        $proposal = $this->createProposal($authorReviewer);

        $payload = [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $authorReviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
        ];

        $response = $this->actingAs($admin)->post('/admin/assign', $payload);

        $response->assertSessionHasErrors('id_reviewer');
        $errors = session('errors')->get('id_reviewer');
        $this->assertTrue(
            collect($errors)->some(fn ($err) => str_contains($err, '[KRITIS]')),
            'Pesan kesalahan CoI ketua pengusul wajib mengandung tag [KRITIS].'
        );

        $this->assertDatabaseMissing('reviews', [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $authorReviewer->id,
        ]);
    }

    public function test_assignment_fails_if_reviewer_is_team_member_coi(): void
    {
        $admin = $this->createAdminKampus();
        $author = $this->createReviewer();
        $memberReviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        ProposalMember::create([
            'id_proposal' => $proposal->id,
            'user_id' => $memberReviewer->id,
            'peran' => 'Anggota Peneliti',
            'alokasi_jam_per_minggu' => 10,
        ]);

        $payload = [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $memberReviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
        ];

        $response = $this->actingAs($admin)->post('/admin/assign', $payload);

        $response->assertSessionHasErrors('id_reviewer');
        $errors = session('errors')->get('id_reviewer');
        $this->assertTrue(
            collect($errors)->some(fn ($err) => str_contains($err, '[KRITIS]')),
            'Pesan kesalahan CoI anggota tim wajib mengandung tag [KRITIS].'
        );

        $this->assertDatabaseMissing('reviews', [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $memberReviewer->id,
        ]);
    }

    public function test_admin_can_reassign_abandoned_reviewer(): void
    {
        $admin = $this->createAdminKampus();
        $author = $this->createReviewer();
        $abandonedReviewer = $this->createReviewer();
        $newReviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $review = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $abandonedReviewer->id,
            'tanggal_mulai_review' => now()->subDays(15)->toDateString(),
            'tanggal_selesai_review' => now()->subDays(1)->toDateString(),
            'status_review' => 'Assigned',
        ]);

        $payload = [
            'id_reviewer_baru' => $newReviewer->id,
            'tanggal_selesai_baru' => now()->addDays(10)->toDateString(),
            'alasan_pencabutan' => 'Reviewer tidak aktif dan batas waktu telaah telah terlewati (Kasus Batas 6)',
        ];

        $response = $this->actingAs($admin)->post("/admin/assign/{$review->id}/reassign", $payload);

        $response->assertRedirect();

        $review->refresh();
        $this->assertEquals($newReviewer->id, $review->id_reviewer);
        $this->assertEquals('Assigned', $review->status_review);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
        ]);
    }

    public function test_reviewer_can_submit_weighted_rubric_evaluation(): void
    {
        $author = $this->createReviewer();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $review = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
            'status_review' => 'Assigned',
        ]);

        $payload = [
            'komponen_penilaian' => [
                ['kriteria' => 'Orisinalitas dan Urgensi Riset', 'bobot' => 40, 'skor' => 80],
                ['kriteria' => 'Kesesuaian Metodologi', 'bobot' => 30, 'skor' => 90],
                ['kriteria' => 'Kualitas Luaran dan Dampak', 'bobot' => 30, 'skor' => 85],
            ],
            'catatan_evaluasi' => 'Proposal ini memiliki metodologi yang sangat terstruktur, urgensi riset sangat relevan, dan luaran terdefinisi dengan sangat baik.',
            'keputusan_rekomendasi' => 'Diterima',
        ];

        $response = $this->actingAs($reviewer)->post("/reviewer/assignments/{$review->id}/review", $payload);

        $response->assertRedirect();

        $review->refresh();
        $this->assertEquals('Completed', $review->status_review);
        // (80*0.4) + (90*0.3) + (85*0.3) = 32 + 27 + 25.5 = 84.50
        $this->assertEquals(84.50, (float) $review->skor_total);
        $this->assertEquals('Diterima', $review->keputusan_rekomendasi);
        $this->assertEquals($payload['catatan_evaluasi'], $review->catatan_evaluasi);
        $this->assertIsArray($review->komponen_penilaian);
        $this->assertCount(3, $review->komponen_penilaian);
    }

    public function test_review_disparity_detection_flags_extreme_difference_over_30_points(): void
    {
        $author = $this->createReviewer();
        $reviewer1 = $this->createReviewer();
        $reviewer2 = $this->createReviewer();
        $proposal = $this->createProposal($author);

        Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer1->id,
            'skor_total' => 90.00,
            'status_review' => 'Completed',
        ]);

        Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer2->id,
            'skor_total' => 55.00,
            'status_review' => 'Completed',
        ]);

        $service = new ReviewAggregationService();
        $result = $service->calculateFinalScore($proposal->id);

        $this->assertEquals('DISCREPANCY_DETECTED', $result['status']);
        $this->assertTrue($result['requires_third_reviewer']);
        $this->assertEquals(35.0, (float) $result['disparity']);
        $this->assertStringContainsString('[PERINGATAN]', $result['message']);

        // Uji kondisi normal (selisih <= 30 poin)
        Review::where('id_proposal', $proposal->id)
            ->where('id_reviewer', $reviewer2->id)
            ->update(['skor_total' => 80.00]);

        $normalResult = $service->calculateFinalScore($proposal->id);

        $this->assertEquals('NORMAL', $normalResult['status']);
        $this->assertFalse($normalResult['requires_third_reviewer']);
        $this->assertEquals(85.00, (float) $normalResult['final_score']);
    }
}
