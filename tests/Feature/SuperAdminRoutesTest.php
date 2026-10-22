<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SuperAdminRoutesTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => Role::SUPER_ADMIN,
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
        ]);

        $this->superAdmin = User::factory()->create([
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    public function test_super_admin_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Dashboard/User'));
    }

    public function test_super_admin_can_access_universities(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/universities');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Universities/Index')
            ->has('stats')
        );
    }

    public function test_super_admin_can_access_universities_create(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/universities/create');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Universities/Create'));
    }

    public function test_super_admin_can_access_universities_show(): void
    {
        $university = University::factory()->create();

        $response = $this->actingAs($this->superAdmin)->get("/admin/universities/{$university->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Universities/Show')
            ->has('university')
        );
    }

    public function test_super_admin_can_access_universities_edit(): void
    {
        $university = University::factory()->create();

        $response = $this->actingAs($this->superAdmin)->get("/admin/universities/{$university->id}/edit");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Universities/Edit')
            ->has('university')
        );
    }

    public function test_super_admin_can_access_admin_kampus(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/admin-kampus');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AdminKampus/Index')
            ->has('stats')
        );
    }

    public function test_super_admin_can_access_admin_kampus_create(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/admin-kampus/create');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/AdminKampus/Create'));
    }

    public function test_super_admin_can_access_admin_kampus_show(): void
    {
        $university = University::factory()->create();
        $adminRole = Role::firstOrCreate(
            ['name' => Role::ADMIN_KAMPUS],
            ['guard_name' => 'web', 'display_name' => 'Admin Kampus']
        );
        $adminKampusUser = User::factory()->create([
            'role_id' => $adminRole->id,
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->get("/admin/admin-kampus/{$adminKampusUser->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AdminKampus/Show')
            ->has('adminKampus')
        );
    }

    public function test_super_admin_can_access_admin_kampus_edit(): void
    {
        $university = University::factory()->create();
        $adminRole = Role::firstOrCreate(
            ['name' => Role::ADMIN_KAMPUS],
            ['guard_name' => 'web', 'display_name' => 'Admin Kampus']
        );
        $adminKampusUser = User::factory()->create([
            'role_id' => $adminRole->id,
            'university_id' => $university->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->get("/admin/admin-kampus/{$adminKampusUser->id}/edit");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AdminKampus/Edit')
            ->has('adminKampus')
        );
    }

    public function test_super_admin_can_access_users(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Index')
            ->has('stats')
        );
    }

    public function test_super_admin_can_access_users_create(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/users/create');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Users/Create'));
    }

    public function test_super_admin_can_access_users_show(): void
    {
        $penelitiRole = Role::firstOrCreate(
            ['name' => Role::PENELITI],
            ['guard_name' => 'web', 'display_name' => 'Peneliti']
        );
        $targetUser = User::factory()->create([
            'role_id' => $penelitiRole->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->get("/admin/users/{$targetUser->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Show')
            ->has('user')
        );
    }

    public function test_super_admin_can_access_users_edit(): void
    {
        $penelitiRole = Role::firstOrCreate(
            ['name' => Role::PENELITI],
            ['guard_name' => 'web', 'display_name' => 'Peneliti']
        );
        $targetUser = User::factory()->create([
            'role_id' => $penelitiRole->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->get("/admin/users/{$targetUser->id}/edit");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Edit')
            ->has('user')
        );
    }

    public function test_super_admin_can_access_logs(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/logs');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Logs/Index')
            ->has('logs')
            ->has('stats')
        );
    }

    public function test_super_admin_can_access_settings(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/settings');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Settings/Index'));
    }
}
