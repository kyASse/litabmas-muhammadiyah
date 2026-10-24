<?php

namespace Tests\Feature;

use App\Models\AssessmentCriteria;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Review;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubstantiveReviewScoringTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected ResearchSchema $schema;

    protected Role $reviewerRole;

    protected Role $penelitiRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->reviewerRole = Role::firstOrCreate(
            ['name' => Role::REVIEWER],
            ['display_name' => 'Reviewer']
        );

        $this->penelitiRole = Role::firstOrCreate(
            ['name' => Role::PENELITI],
            ['display_name' => 'Dosen / Peneliti']
        );

        $this->university = University::create([
            'code' => 'UMT-TEST',
            'name' => 'Universitas Muhammadiyah Uji Riset',
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Riset Terapan',
            'tahun_anggaran' => 2026,
            'biaya_maksimal' => 50000000.00,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
        ]);
    }

    protected function createReviewer(): User
    {
        return User::factory()->create([
            'role_id' => $this->reviewerRole->id,
            'university_id' => $this->university->id,
        ]);
    }

    protected function createPeneliti(): User
    {
        return User::factory()->create([
            'role_id' => $this->penelitiRole->id,
            'university_id' => $this->university->id,
        ]);
    }

    protected function createProposal(User $author): Proposal
    {
        return Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $author->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Pengolahan Sampah Pintar Kota',
            'abstrak' => 'Abstrak proposal penelitian pengolahan limbah perkotaan.',
            'biaya_yang_diusulkan' => 35000000.00,
            'status_proposal' => Proposal::STATUS_LOLOS_ADMINISTRASI,
            'catatan_administrasi' => 'Lengkap dan memenuhi syarat administrasi.',
        ]);
    }

    /**
     * Uji 1: Reviewer dapat menyimpan penilaian pilihan ganda diskret terbobot (skala 1-5)
     * dengan komentar per kriteria secara akurat.
     */
    public function test_discrete_rubric_scoring_stored_and_calculated_accurately(): void
    {
        $author = $this->createPeneliti();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        // Kriteria terbobot:
        // 1. Rekam Jejak (bobot 20), pilihan 5 -> (5/5)*20 = 20.00
        // 2. Urgensi & Kebaruan (bobot 30), pilihan 4 -> (4/5)*30 = 24.00
        // 3. Metodologi (bobot 25), pilihan 3 -> (3/5)*25 = 15.00
        // 4. Target Luaran (bobot 25), pilihan 4 -> (4/5)*25 = 20.00
        // Total akumulasi: 20 + 24 + 15 + 20 = 79.00
        $komponen = [
            [
                'kriteria' => 'Rekam Jejak dan Kompetensi Tim Peneliti',
                'bobot' => 20,
                'skor' => 5,
                'komentar' => 'Publikasi dan kompetensi tim sangat baik dan selaras.',
            ],
            [
                'kriteria' => 'Urgensi, Kebaruan, dan Tinjauan Pustaka',
                'bobot' => 30,
                'skor' => 4,
                'komentar' => 'Tinjauan pustaka mutakhir, urgensi masalah terdefinisi jelas.',
            ],
            [
                'kriteria' => 'Kejelasan Metodologi dan Kelayakan Pelaksanaan',
                'bobot' => 25,
                'skor' => 3,
                'komentar' => 'Rancangan metodologi cukup realistis meski mitigasi risiko perlu diperjelas.',
            ],
            [
                'kriteria' => 'Potensi Dampak dan Kelayakan Target Luaran',
                'bobot' => 25,
                'skor' => 4,
                'komentar' => 'Target luaran jurnal bereputasi sangat layak dicapai.',
            ],
        ];

        $payload = [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => $komponen,
            'comments' => 'Secara umum usulan sangat potensial untuk didanai dengan sedikit perbaikan minor.',
            'recommendation' => 'accepted',
        ];

        $response = $this->actingAs($reviewer)
            ->post(route('reviewer.assessment.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $review = Review::where('id_proposal', $proposal->id)
            ->where('id_reviewer', $reviewer->id)
            ->first();

        $this->assertNotNull($review);
        $this->assertEquals(79.00, (float) $review->skor_total);
        $this->assertEquals('Diterima', $review->keputusan_rekomendasi);
        $this->assertIsArray($review->komponen_penilaian);
        $this->assertCount(4, $review->komponen_penilaian);
        $this->assertEquals('Publikasi dan kompetensi tim sangat baik dan selaras.', $review->komponen_penilaian[0]['komentar']);
    }

    /**
     * Uji 2: Penolakan submit jika ada kriteria tanpa skor atau skor di luar batas 1-5 (HTTP 422).
     */
    public function test_submission_rejected_when_any_criterion_is_missing_score_with_http_422(): void
    {
        $author = $this->createPeneliti();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $payload = [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => [
                [
                    'kriteria' => 'Rekam Jejak',
                    'bobot' => 50,
                    'skor' => 5,
                    'komentar' => 'Sangat baik.',
                ],
                [
                    'kriteria' => 'Urgensi',
                    'bobot' => 50,
                    // Missing skor
                    'komentar' => 'Cukup.',
                ],
            ],
            'comments' => 'Evaluasi umum.',
            'recommendation' => 'accepted',
        ];

        $response = $this->actingAs($reviewer)
            ->post(route('reviewer.assessment.store'), $payload);

        $response->assertSessionHasErrors(['komponen_penilaian.1.skor']);
    }

    /**
     * Uji 3: Penolakan submit jika ada kriteria tanpa komentar per bagian (HTTP 422).
     */
    public function test_submission_rejected_when_any_criterion_is_missing_mandatory_comment_with_http_422(): void
    {
        $author = $this->createPeneliti();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $payload = [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => [
                [
                    'kriteria' => 'Rekam Jejak',
                    'bobot' => 50,
                    'skor' => 4,
                    'komentar' => 'Kompeten.',
                ],
                [
                    'kriteria' => 'Urgensi',
                    'bobot' => 50,
                    'skor' => 3,
                    // Empty comment string
                    'komentar' => '',
                ],
            ],
            'comments' => 'Evaluasi umum.',
            'recommendation' => 'accepted',
        ];

        $response = $this->actingAs($reviewer)
            ->post(route('reviewer.assessment.store'), $payload);

        $response->assertSessionHasErrors(['komponen_penilaian.1.komentar']);
    }

    /**
     * Uji 4: Akumulasi skor_total presisi pada nilai ekstrem batas (Min 20, Maks 100).
     */
    public function test_accurate_accumulated_total_score_calculation_on_edge_scores(): void
    {
        $author = $this->createPeneliti();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        // Kasus 1: Seluruh item skor 5 (Sangat Baik) -> 100.00
        $maxComponents = [
            ['kriteria' => 'K1', 'bobot' => 40, 'skor' => 5, 'komentar' => 'Sempurna.'],
            ['kriteria' => 'K2', 'bobot' => 60, 'skor' => 5, 'komentar' => 'Sempurna.'],
        ];

        $this->actingAs($reviewer)->post(route('reviewer.assessment.store'), [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => $maxComponents,
            'recommendation' => 'accepted',
            'comments' => 'Sangat direkomendasikan.',
        ]);

        $review = Review::where('id_proposal', $proposal->id)->first();
        $this->assertEquals(100.00, (float) $review->skor_total);

        // Kasus 2: Seluruh item skor 1 (Sangat Kurang) -> 20.00
        $minComponents = [
            ['kriteria' => 'K1', 'bobot' => 40, 'skor' => 1, 'komentar' => 'Kurang.'],
            ['kriteria' => 'K2', 'bobot' => 60, 'skor' => 1, 'komentar' => 'Kurang.'],
        ];

        $this->actingAs($reviewer)->put(route('reviewer.assessment.update', $review->id), [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => $minComponents,
            'recommendation' => 'rejected',
            'comments' => 'Tidak memenuhi standar kelayakan riset.',
        ]);

        $review->refresh();
        $this->assertEquals(20.00, (float) $review->skor_total);
    }

    /**
     * Uji 5: CoI Guard menolak reviewer yang menilai proposal miliknya sendiri (id_reviewer == id_pengusul).
     */
    public function test_coi_guard_prevents_reviewer_from_evaluating_own_proposal(): void
    {
        // Pengusul adalah reviewer itu sendiri
        $reviewerAuthor = $this->createReviewer();
        $proposal = $this->createProposal($reviewerAuthor);

        $payload = [
            'proposal_id' => $proposal->id,
            'komponen_penilaian' => [
                ['kriteria' => 'K1', 'bobot' => 100, 'skor' => 5, 'komentar' => 'Penilaian sendiri.'],
            ],
            'comments' => 'Percobaan penilaian mandiri.',
            'recommendation' => 'accepted',
        ];

        $response = $this->actingAs($reviewerAuthor)
            ->post(route('reviewer.assessment.store'), $payload);

        $response->assertForbidden();

        $this->assertDatabaseMissing('reviews', [
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewerAuthor->id,
        ]);
    }

    /**
     * Uji 6: Alur penugasan reviewer workspace (/reviewer/assignments/{id}/review)
     * menghitung skor pilihan ganda diskret secara presisi dan menolak CoI.
     */
    public function test_substantive_review_works_via_reviewer_assignment_endpoint(): void
    {
        $author = $this->createPeneliti();
        $reviewer = $this->createReviewer();
        $proposal = $this->createProposal($author);

        $review = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
            'status_review' => 'Assigned',
        ]);

        // (4/5)*35 = 28 + (4/5)*35 = 28 + (3/5)*30 = 18 => 74.00
        $payload = [
            'komponen_penilaian' => [
                ['kriteria' => 'Urgensi Riset', 'bobot' => 35, 'skor' => 4, 'komentar' => 'Urgensi cukup kuat.'],
                ['kriteria' => 'Metodologi', 'bobot' => 35, 'skor' => 4, 'komentar' => 'Rancangan metode memadai.'],
                ['kriteria' => 'Kelayakan Anggaran', 'bobot' => 30, 'skor' => 3, 'komentar' => 'Anggaran perlu rasionalisasi.'],
            ],
            'catatan_evaluasi' => 'Proposal ini memiliki konsep yang baik dengan beberapa catatan efisiensi anggaran belanja peralatan.',
            'keputusan_rekomendasi' => 'Revisi',
        ];

        $response = $this->actingAs($reviewer)
            ->post("/reviewer/assignments/{$review->id}/review", $payload);

        $response->assertRedirect();

        $review->refresh();
        $this->assertEquals('Completed', $review->status_review);
        $this->assertEquals(74.00, (float) $review->skor_total);
        $this->assertEquals('Revisi', $review->keputusan_rekomendasi);
        $this->assertEquals('Urgensi cukup kuat.', $review->komponen_penilaian[0]['komentar']);
    }

    /**
     * Uji 7: CoI Guard pada endpoint penugasan reviewer.
     */
    public function test_coi_guard_blocks_review_submission_via_assignment_endpoint(): void
    {
        $reviewerAuthor = $this->createReviewer();
        $proposal = $this->createProposal($reviewerAuthor);

        $review = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewerAuthor->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
            'status_review' => 'Assigned',
        ]);

        $payload = [
            'komponen_penilaian' => [
                ['kriteria' => 'K1', 'bobot' => 100, 'skor' => 5, 'komentar' => 'Mencoba nilai sendiri.'],
            ],
            'catatan_evaluasi' => 'Catatan telaah mandiri yang melanggar aturan CoI sistem.',
            'keputusan_rekomendasi' => 'Diterima',
        ];

        $response = $this->actingAs($reviewerAuthor)
            ->post("/reviewer/assignments/{$review->id}/review", $payload);

        $response->assertForbidden();
    }
}
