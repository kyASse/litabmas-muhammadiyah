<?php

namespace Tests\Unit\Models;

use App\Models\Proposal;
use App\Models\ProposalMember;
use App\Models\ResearchSchema;
use App\Models\Review;
use App\Models\University;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProposalMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_proposal_can_have_members_with_relationships(): void
    {
        $university = University::create([
            'name' => 'Universitas Muhammadiyah Test',
            'code' => 'UMT01',
        ]);

        $leader = User::create([
            'name' => 'Dosen Ketua',
            'email' => 'ketua@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $memberUser = User::create([
            'name' => 'Dosen Anggota',
            'email' => 'anggota@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Penelitian Dasar 2026',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(2)->toDateString(),
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $university->id,
            'id_pengusul' => $leader->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Energi Terbarukan',
            'abstrak' => 'Abstrak riset ilmiah berkualitas tinggi.',
            'biaya_yang_diusulkan' => 35000000,
            'status_proposal' => 'Draft',
        ]);

        $member = ProposalMember::create([
            'id_proposal' => $proposal->id,
            'user_id' => $memberUser->id,
            'peran' => 'Anggota Peneliti',
            'alokasi_jam_per_minggu' => 10,
        ]);

        $this->assertDatabaseHas('proposal_members', [
            'id' => $member->id,
            'id_proposal' => $proposal->id,
            'user_id' => $memberUser->id,
            'peran' => 'Anggota Peneliti',
            'alokasi_jam_per_minggu' => 10,
        ]);

        $this->assertTrue($proposal->members->contains($member));
        $this->assertEquals($memberUser->id, $proposal->members->first()->user->id);
        $this->assertEquals($proposal->id, $member->proposal->id);
    }

    public function test_proposal_member_composite_unique_constraint(): void
    {
        $university = University::create([
            'name' => 'Universitas Muhammadiyah Test',
            'code' => 'UMT02',
        ]);

        $leader = User::create([
            'name' => 'Dosen Ketua 2',
            'email' => 'ketua2@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $memberUser = User::create([
            'name' => 'Dosen Anggota 2',
            'email' => 'anggota2@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Penelitian Terapan 2026',
            'biaya_maksimal' => 75000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(2)->toDateString(),
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $university->id,
            'id_pengusul' => $leader->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Studi AI untuk Pertanian Presisi',
            'abstrak' => 'Abstrak riset kecerdasan buatan.',
            'biaya_yang_diusulkan' => 45000000,
            'status_proposal' => 'Draft',
        ]);

        ProposalMember::create([
            'id_proposal' => $proposal->id,
            'user_id' => $memberUser->id,
            'peran' => 'Anggota',
            'alokasi_jam_per_minggu' => 10,
        ]);

        $this->expectException(QueryException::class);

        // Attempt duplicate insertion with same id_proposal and user_id
        ProposalMember::create([
            'id_proposal' => $proposal->id,
            'user_id' => $memberUser->id,
            'peran' => 'Anggota Kedua',
            'alokasi_jam_per_minggu' => 5,
        ]);
    }

    public function test_review_model_supports_canonical_columns_and_legacy_aliases(): void
    {
        $university = University::create([
            'name' => 'Universitas Muhammadiyah Test',
            'code' => 'UMT03',
        ]);

        $leader = User::create([
            'name' => 'Dosen Peneliti',
            'email' => 'peneliti@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $reviewer = User::create([
            'name' => 'Dosen Reviewer',
            'email' => 'reviewer@test.com',
            'password' => bcrypt('password'),
            'university_id' => $university->id,
            'is_active' => true,
            'is_reviewer' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $university->id,
            'nama_skema' => 'Penelitian Kolaboratif 2026',
            'biaya_maksimal' => 60000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $university->id,
            'id_pengusul' => $leader->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Analisis Kebijakan Energi',
            'abstrak' => 'Abstrak kajian kebijakan energi nasional.',
            'biaya_yang_diusulkan' => 50000000,
            'status_proposal' => 'Administrasi_Valid',
        ]);

        // 1. Create with canonical columns
        $rubric = ['kriteria_1' => 85, 'kriteria_2' => 90];
        $canonicalReview = Review::create([
            'id_proposal' => $proposal->id,
            'id_reviewer' => $reviewer->id,
            'tanggal_mulai_review' => now()->toDateString(),
            'tanggal_selesai_review' => now()->addDays(14)->toDateString(),
            'komponen_penilaian' => $rubric,
            'skor_total' => 87.50,
            'catatan_evaluasi' => 'Metodologi sangat baik dan layak didanai.',
            'keputusan_rekomendasi' => 'Diterima',
            'status_review' => 'Completed',
        ]);

        $this->assertEquals($proposal->id, $canonicalReview->proposal_id);
        $this->assertEquals($reviewer->id, $canonicalReview->reviewer_id);
        $this->assertEquals(87.50, (float) $canonicalReview->score);
        $this->assertEquals(87.50, (float) $canonicalReview->total_score);
        $this->assertEquals('Metodologi sangat baik dan layak didanai.', $canonicalReview->feedback);
        $this->assertEquals('Metodologi sangat baik dan layak didanai.', $canonicalReview->notes);
        $this->assertEquals('Diterima', $canonicalReview->recommendation);
        $this->assertEquals('Completed', $canonicalReview->status);
        $this->assertIsArray($canonicalReview->komponen_penilaian);
        $this->assertEquals(85, $canonicalReview->komponen_penilaian['kriteria_1']);
        $this->assertEquals($proposal->id, $canonicalReview->proposal->id);
        $this->assertEquals($reviewer->id, $canonicalReview->reviewer->id);

        // 2. Create with legacy aliases
        $legacyReview = Review::create([
            'proposal_id' => $proposal->id,
            'reviewer_id' => $reviewer->id,
            'score' => 78.00,
            'feedback' => 'Perlu revisi minor pada RAB.',
            'recommendation' => 'revision',
            'status' => 'in_progress',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
        ]);

        $this->assertEquals($proposal->id, $legacyReview->id_proposal);
        $this->assertEquals($reviewer->id, $legacyReview->id_reviewer);
        $this->assertEquals(78.00, (float) $legacyReview->skor_total);
        $this->assertEquals('Perlu revisi minor pada RAB.', $legacyReview->catatan_evaluasi);
        $this->assertEquals('Revisi', $legacyReview->keputusan_rekomendasi);
        $this->assertEquals('In_Progress', $legacyReview->status_review);
    }
}
