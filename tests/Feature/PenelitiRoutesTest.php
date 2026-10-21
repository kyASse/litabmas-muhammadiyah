<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PenelitiRoutesTest extends TestCase
{
    use RefreshDatabase;

    private User $peneliti;

    private University $university;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti / Dosen',
        ]);

        $this->university = University::factory()->create([
            'code' => 'UMT-TEST',
            'name' => 'Universitas Muhammadiyah Test',
            'is_active' => true,
        ]);

        $this->peneliti = User::factory()->create([
            'role_id' => $role->id,
            'university_id' => $this->university->id,
            'is_active' => true,
        ]);
        $this->peneliti->roles()->syncWithoutDetaching([$role->id]);
    }

    public function test_peneliti_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/User')
            ->has('stats')
            ->has('proposal_stats')
        );
    }

    public function test_peneliti_can_access_proposals_index(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/proposals');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Proposal/Index'));
    }

    public function test_peneliti_can_access_proposal_create(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/proposals/create');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Proposal/Create'));
    }

    public function test_peneliti_can_access_proposal_show_own(): void
    {
        $schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Penelitian Dosen Pemula (PDP)',
            'deskripsi' => 'Skema riset pendanaan kompetitif untuk dosen pemula.',
            'biaya_maksimal' => 20000000,
            'is_active' => true,
        ]);

        $proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->peneliti->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas Berkelanjutan',
            'abstrak' => 'Deskripsi abstrak lengkap mengenai metodologi penelitian cerdas pada lingkungan akademik modern.',
            'status_proposal' => Proposal::STATUS_DRAFT,
            'biaya_yang_diusulkan' => 15000000,
        ]);

        $response = $this->actingAs($this->peneliti)->get("/proposals/{$proposal->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Proposal/Show'));
    }

    public function test_peneliti_cannot_view_other_university_proposal_idor(): void
    {
        $otherUniversity = University::factory()->create([
            'code' => 'UAD-TEST',
            'name' => 'Universitas Ahmad Dahlan Test',
            'is_active' => true,
        ]);

        $otherRole = Role::firstOrCreate(['name' => Role::PENELITI]);
        $otherPeneliti = User::factory()->create([
            'role_id' => $otherRole->id,
            'university_id' => $otherUniversity->id,
            'is_active' => true,
        ]);

        $schema = ResearchSchema::create([
            'university_id' => $otherUniversity->id,
            'nama_skema' => 'Riset Kerjasama Institusi',
            'deskripsi' => 'Skema institusi lain.',
            'biaya_maksimal' => 30000000,
            'is_active' => true,
        ]);

        $otherProposal = Proposal::create([
            'university_id' => $otherUniversity->id,
            'id_pengusul' => $otherPeneliti->id,
            'id_skema_pendanaan' => $schema->id,
            'judul_penelitian' => 'Proposal Rahasia Kampus Lain',
            'abstrak' => 'Deskripsi proposal kampus lain yang terproteksi oleh isolasi tenant.',
            'status_proposal' => Proposal::STATUS_SUBMITTED,
            'biaya_yang_diusulkan' => 25000000,
        ]);

        $response = $this->actingAs($this->peneliti)->get("/proposals/{$otherProposal->id}");
        $this->assertTrue(in_array($response->status(), [403, 404], true), 'IDOR access must be intercepted with HTTP 403 or 404.');
    }

    public function test_peneliti_can_access_funding_index(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/funding');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Proposal/FundingInfo'));
    }

    public function test_peneliti_can_access_progress_index(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/progress');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Progress/Index'));
    }

    public function test_peneliti_can_access_outputs_index(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/outputs');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Output/Index'));
    }

    public function test_outputs_create_redirects_to_outputs_index_with_modal_param(): void
    {
        $response = $this->actingAs($this->peneliti)->get('/outputs/create');
        $response->assertStatus(302);
        $response->assertRedirect(route('outputs.index', ['create' => '1']));
    }
}
