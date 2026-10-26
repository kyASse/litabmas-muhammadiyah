<?php

use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seedRoles();

    $this->univA = University::factory()->create([
        'name' => 'Universitas Muhammadiyah A',
        'code' => 'UMA',
        'is_active' => true,
    ]);

    $this->univB = University::factory()->create([
        'name' => 'Universitas Muhammadiyah B',
        'code' => 'UMB',
        'is_active' => true,
    ]);

    $this->adminKampusA = User::factory()->adminKampus($this->univA->id)->create([
        'name' => 'Admin Kampus A',
        'email' => 'admin.a@uma.ac.id',
        'is_active' => true,
    ]);

    $this->adminKampusB = User::factory()->adminKampus($this->univB->id)->create([
        'name' => 'Admin Kampus B',
        'email' => 'admin.b@umb.ac.id',
        'is_active' => true,
    ]);

    $this->superAdmin = User::factory()->superAdmin()->create([
        'name' => 'Super Administrator',
        'email' => 'superadmin@litabmas.ac.id',
        'is_active' => true,
    ]);

    $this->researcherA = User::factory()->peneliti($this->univA->id)->create([
        'name' => 'Peneliti UMA',
        'email' => 'peneliti@uma.ac.id',
        'is_active' => false,
    ]);

    $this->researcherB = User::factory()->peneliti($this->univB->id)->create([
        'name' => 'Peneliti UMB',
        'email' => 'peneliti@umb.ac.id',
        'is_active' => false,
    ]);
});

test('admin kampus can access users list and only sees users from own university', function () {
    $response = $this->actingAs($this->adminKampusA)->get(route('admin.users.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Users/Index')
        ->has('users.data', 2)
        ->where('users.data.0.university.id', $this->univA->id)
        ->where('users.data.1.university.id', $this->univA->id)
        ->where('stats.total_users', 2)
        ->where('stats.active_users', 1)
        ->where('stats.researchers_count', 1)
    );
});

test('admin kampus cannot see users from other universities even with query parameter manipulation', function () {
    $response = $this->actingAs($this->adminKampusA)->get(route('admin.users.index', [
        'university_id' => $this->univB->id,
    ]));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Users/Index')
        ->where('stats.total_users', 2)
        ->has('users.data', function (Assert $collection) {
            $collection->each(fn (Assert $item) => $item->where('university.id', $this->univA->id)->etc());
        })
    );
});

test('admin kampus can activate inactive researcher from own university', function () {
    expect($this->researcherA->is_active)->toBeFalse();

    $response = $this->actingAs($this->adminKampusA)
        ->post(route('admin.users.toggle-active', $this->researcherA));

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    expect($this->researcherA->fresh()->is_active)->toBeTrue();
});

test('admin kampus receives 403 forbidden when attempting to activate user from another university', function () {
    expect($this->researcherB->is_active)->toBeFalse();

    $response = $this->actingAs($this->adminKampusA)
        ->post(route('admin.users.toggle-active', $this->researcherB));

    $response->assertStatus(403);
    expect($this->researcherB->fresh()->is_active)->toBeFalse();
});

test('admin kampus receives 403 forbidden when attempting to deactivate or delete super admin', function () {
    // Attempt to deactivate Super Admin
    $toggleResponse = $this->actingAs($this->adminKampusA)
        ->post(route('admin.users.toggle-active', $this->superAdmin));

    $toggleResponse->assertStatus(403);
    expect($this->superAdmin->fresh()->is_active)->toBeTrue();

    // Attempt to delete Super Admin
    $deleteResponse = $this->actingAs($this->adminKampusA)
        ->delete(route('admin.users.destroy', $this->superAdmin));

    $deleteResponse->assertStatus(403);
    expect(User::find($this->superAdmin->id))->not->toBeNull();
});

test('admin kampus dashboard includes pending researchers count for own university', function () {
    $response = $this->actingAs($this->adminKampusA)->get(route('admin.dashboard'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Admin')
        ->where('stats.pending_researchers_count', 1)
    );
});
