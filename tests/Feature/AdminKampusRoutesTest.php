<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminKampusRoutesTest extends TestCase
{
    use RefreshDatabase;

    private User $adminKampus;

    private University $university;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => Role::ADMIN_KAMPUS,
            'guard_name' => 'web',
            'display_name' => 'Admin Kampus / LPPM',
        ]);

        $this->university = University::factory()->create([
            'is_active' => true,
        ]);

        $this->adminKampus = User::factory()->create([
            'role_id' => $role->id,
            'university_id' => $this->university->id,
            'is_active' => true,
        ]);
    }

    public function test_admin_kampus_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Admin')
            ->has('stats')
            ->has('yearlyFundingData')
            ->has('facultyPerformance')
            ->has('topResearch')
            ->has('topLecturers')
            ->has('systemLogs')
        );
    }

    public function test_admin_kampus_can_access_schemas(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/schema');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Schema/Index'));
    }

    public function test_admin_kampus_can_access_schema_create(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/schema/create');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Schema/Create'));
    }

    public function test_admin_kampus_can_access_schema_show(): void
    {
        $schema = ResearchSchema::create([
            'name' => 'Penelitian Dosen Pemula (PDP)',
            'description' => 'Skema riset pendanaan kompetitif untuk dosen pemula.',
            'max_funding' => 20000000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminKampus)->get("/admin/schema/{$schema->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Schema/Show')
            ->has('schema.id')
        );
    }

    public function test_admin_kampus_can_access_schema_edit(): void
    {
        $schema = ResearchSchema::create([
            'name' => 'Penelitian Terapan Unggulan (PTUPT)',
            'description' => 'Skema riset terapan institusional.',
            'max_funding' => 50000000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminKampus)->get("/admin/schema/{$schema->id}/edit");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Schema/Edit'));
    }

    public function test_admin_kampus_can_access_proposals(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/proposals');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Proposal/Index'));
    }

    public function test_admin_kampus_can_access_reviewer_assign(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/reviewer/assign');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Reviewer/Assign'));
    }

    public function test_admin_kampus_can_access_reviews_summary(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/reviews/summary');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Reviewer/Summary'));
    }

    public function test_admin_kampus_can_access_monev_report(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/monev');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Monev/Report'));
    }

    public function test_admin_kampus_can_access_monev_report_with_contracts_data(): void
    {
        $schema = ResearchSchema::factory()->create([
            'university_id' => $this->university->id,
        ]);

        $proposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_skema_pendanaan' => $schema->id,
            'id_pengusul' => $this->adminKampus->id,
        ]);

        Contract::factory()->create([
            'university_id' => $this->university->id,
            'proposal_id' => $proposal->id,
            'status' => 'Active',
            'contract_value' => 10000000,
        ]);

        $response = $this->actingAs($this->adminKampus)->get('/admin/monev');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Monev/Report')
            ->has('data.ringkasan')
            ->has('data.anggaran')
            ->has('data.penelitian_terbaru.data', 1)
        );
    }

    public function test_admin_kampus_can_access_monev_schedules(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/monev-schedules');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Monev/Schedule'));
    }

    public function test_admin_kampus_can_access_output_verify(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/outputs');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Output/Verify'));
    }

    public function test_admin_kampus_can_access_output_report(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/output/report');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Output/Report'));
    }

    public function test_admin_kampus_cannot_access_super_admin_universities(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/universities');
        $response->assertStatus(403);
    }

    public function test_admin_kampus_cannot_access_super_admin_campus_admins(): void
    {
        $response = $this->actingAs($this->adminKampus)->get('/admin/admin-kampus');
        $response->assertStatus(403);
    }
}
