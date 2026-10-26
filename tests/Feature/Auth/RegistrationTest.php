<?php

use App\Models\Role;
use App\Models\University;
use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new researcher can register with valid institutional data', function () {
    $this->seedRoles();

    $university = University::factory()->create([
        'name' => 'Universitas Gadjah Mada',
        'code' => 'UGM',
        'is_active' => true,
    ]);

    $response = $this->post('/register', [
        'name' => 'Dr. Budi Santoso, M.T.',
        'email' => 'budi.santoso@ugm.ac.id',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'university_id' => $university->id,
        'nidn' => '0512038501',
        'faculty' => 'Fakultas Teknik',
        'study_program' => 'Teknik Sipil',
        'phone' => '081234567890',
    ]);

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('status');

    $penelitiRole = Role::where('name', Role::PENELITI)->first();

    $this->assertDatabaseHas('users', [
        'name' => 'Dr. Budi Santoso, M.T.',
        'email' => 'budi.santoso@ugm.ac.id',
        'role_id' => $penelitiRole->id,
        'university_id' => $university->id,
        'nidn' => '0512038501',
        'faculty' => 'Fakultas Teknik',
        'study_program' => 'Teknik Sipil',
        'phone' => '081234567890',
        'is_active' => false,
    ]);

    $user = User::where('email', 'budi.santoso@ugm.ac.id')->first();
    expect($user)->not->toBeNull();
    expect($user->is_active)->toBeFalse();
    expect($user->hasRole(Role::PENELITI))->toBeTrue();
});

test('newly registered researcher cannot authenticate before approval', function () {
    $this->seedRoles();

    $university = University::factory()->create(['is_active' => true]);

    $this->post('/register', [
        'name' => 'Peneliti Belum Aktif',
        'email' => 'peneliti.pending@kampus.ac.id',
        'password' => 'SecretPass123',
        'password_confirmation' => 'SecretPass123',
        'university_id' => $university->id,
    ]);

    // Try to login with the registered credentials
    $response = $this->post('/login', [
        'email' => 'peneliti.pending@kampus.ac.id',
        'password' => 'SecretPass123',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('registration requires mandatory fields', function () {
    $response = $this->post('/register', []);

    $response->assertSessionHasErrors([
        'name',
        'email',
        'password',
        'university_id',
    ]);
});

test('registration rejects duplicate email', function () {
    $this->seedRoles();

    $existingUser = User::factory()->user()->create([
        'email' => 'dosen.terdaftar@kampus.ac.id',
    ]);

    $university = University::factory()->create();

    $response = $this->post('/register', [
        'name' => 'Dosen Kembar',
        'email' => 'dosen.terdaftar@kampus.ac.id',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'university_id' => $university->id,
    ]);

    $response->assertSessionHasErrors('email');
});
