<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserRoleHelperTest extends TestCase
{
    use RefreshDatabase;

    private Role $superAdminRole;

    private Role $adminKampusRole;

    private Role $reviewerRole;

    private Role $penelitiRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdminRole = Role::create([
            'name' => Role::SUPER_ADMIN,
            'guard_name' => 'web',
            'display_name' => 'Super Administrator',
            'description' => 'Super Administrator role',
        ]);

        $this->adminKampusRole = Role::create([
            'name' => Role::ADMIN_KAMPUS,
            'guard_name' => 'web',
            'display_name' => 'Admin Kampus',
            'description' => 'Admin LPPM Kampus role',
        ]);

        $this->reviewerRole = Role::create([
            'name' => Role::REVIEWER,
            'guard_name' => 'web',
            'display_name' => 'Reviewer',
            'description' => 'Reviewer role',
        ]);

        $this->penelitiRole = Role::create([
            'name' => Role::PENELITI,
            'guard_name' => 'web',
            'display_name' => 'Peneliti',
            'description' => 'Dosen Peneliti role',
        ]);
    }

    /**
     * Test primary role_id alone without pivot record in role_user (legacy seeder mode).
     */
    public function test_primary_role_id_alone_without_pivot_record(): void
    {
        // Insert user directly or detach pivot to ensure role_user has NO records
        $user = User::create([
            'name' => 'Legacy Dosen',
            'email' => 'legacy.dosen@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_active' => true,
        ]);

        // Explicitly remove pivot record to simulate legacy seeder without pivot
        DB::table('role_user')->where('user_id', $user->id)->delete();
        $this->assertEquals(0, DB::table('role_user')->where('user_id', $user->id)->count());

        // Refresh model from database without pre-loading
        $freshUser = User::find($user->id);

        $this->assertTrue($freshUser->hasRole(Role::PENELITI));
        $this->assertTrue($freshUser->hasAnyRole([Role::PENELITI, Role::SUPER_ADMIN]));
        $this->assertFalse($freshUser->hasRole(Role::REVIEWER));
        $this->assertFalse($freshUser->hasAnyRole([Role::REVIEWER, Role::SUPER_ADMIN]));
        $this->assertContains(Role::PENELITI, $freshUser->getRoleNames());
        $this->assertTrue($freshUser->hasAllRoles([Role::PENELITI]));
    }

    /**
     * Test pivot roles() alone with role_id set to null.
     */
    public function test_pivot_roles_alone_with_null_role_id(): void
    {
        $user = User::create([
            'name' => 'Pivot Reviewer',
            'email' => 'pivot.reviewer@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => null,
            'is_active' => true,
        ]);

        $user->roles()->attach($this->reviewerRole->id, [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]);

        $freshUser = User::find($user->id);
        $this->assertNull($freshUser->role_id);

        $this->assertTrue($freshUser->hasRole(Role::REVIEWER));
        $this->assertTrue($freshUser->hasAnyRole([Role::REVIEWER, 'NonExistentRole']));
        $this->assertFalse($freshUser->hasRole(Role::PENELITI));
        $this->assertFalse($freshUser->hasAnyRole([Role::PENELITI, Role::ADMIN_KAMPUS]));
        $this->assertTrue($freshUser->isReviewer());
    }

    /**
     * Test multi-role user with primary role and additional pivot role.
     */
    public function test_multi_role_user_with_primary_and_pivot_roles(): void
    {
        $user = User::create([
            'name' => 'Multi Role User',
            'email' => 'multirole@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_active' => true,
        ]);

        // Assign additional Reviewer role via pivot
        $user->roles()->syncWithoutDetaching([$this->reviewerRole->id => [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]]);

        $freshUser = User::find($user->id);

        // Verify both roles return true
        $this->assertTrue($freshUser->hasRole(Role::PENELITI));
        $this->assertTrue($freshUser->hasRole(Role::REVIEWER));
        $this->assertTrue($freshUser->hasAnyRole([Role::PENELITI, 'FakeRole']));
        $this->assertTrue($freshUser->hasAnyRole([Role::REVIEWER, 'FakeRole']));
        $this->assertTrue($freshUser->hasAllRoles([Role::PENELITI, Role::REVIEWER]));

        // Verify role names list contains both
        $roleNames = $freshUser->getRoleNames();
        $this->assertContains(Role::PENELITI, $roleNames);
        $this->assertContains(Role::REVIEWER, $roleNames);
    }

    /**
     * Test negative cases where unassigned roles return false.
     */
    public function test_unassigned_role_returns_false(): void
    {
        $user = User::create([
            'name' => 'Single Role User',
            'email' => 'single@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->adminKampusRole->id,
            'is_active' => true,
        ]);

        $this->assertTrue($user->hasRole(Role::ADMIN_KAMPUS));
        $this->assertTrue($user->isAdminKampus());

        // Unassigned roles must return false
        $this->assertFalse($user->hasRole(Role::SUPER_ADMIN));
        $this->assertFalse($user->hasRole(Role::PENELITI));
        $this->assertFalse($user->hasRole(Role::REVIEWER));
        $this->assertFalse($user->hasRole('Random Role'));
        $this->assertFalse($user->isSuperAdmin());

        $this->assertFalse($user->hasAnyRole([Role::SUPER_ADMIN, Role::PENELITI]));
        $this->assertFalse($user->hasAllRoles([Role::ADMIN_KAMPUS, Role::SUPER_ADMIN]));
    }

    /**
     * Test role checks when relations are pre-loaded via eager loading.
     */
    public function test_role_checks_with_eager_loaded_relations(): void
    {
        $user = User::create([
            'name' => 'Eager User',
            'email' => 'eager@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_active' => true,
        ]);

        $user->roles()->syncWithoutDetaching([$this->reviewerRole->id => [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]]);

        // Load with relations pre-loaded
        $eagerUser = User::with(['role', 'roles'])->find($user->id);

        $this->assertTrue($eagerUser->relationLoaded('role'));
        $this->assertTrue($eagerUser->relationLoaded('roles'));

        $this->assertTrue($eagerUser->hasRole(Role::PENELITI));
        $this->assertTrue($eagerUser->hasRole(Role::REVIEWER));
        $this->assertFalse($eagerUser->hasRole(Role::SUPER_ADMIN));

        $this->assertTrue($eagerUser->hasAnyRole([Role::PENELITI]));
        $this->assertTrue($eagerUser->hasAnyRole([Role::REVIEWER]));
        $this->assertFalse($eagerUser->hasAnyRole([Role::SUPER_ADMIN, Role::ADMIN_KAMPUS]));
    }

    /**
     * Test role checks when relation is not pre-loaded.
     */
    public function test_role_checks_when_relations_not_loaded(): void
    {
        $user = User::create([
            'name' => 'Unloaded User',
            'email' => 'unloaded@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->superAdminRole->id,
            'is_active' => true,
        ]);

        // Ensure relations are not loaded
        $unloadedUser = User::find($user->id);
        $this->assertFalse($unloadedUser->relationLoaded('role'));
        $this->assertFalse($unloadedUser->relationLoaded('roles'));

        $this->assertTrue($unloadedUser->hasRole(Role::SUPER_ADMIN));
        $this->assertTrue($unloadedUser->isSuperAdmin());
        $this->assertFalse($unloadedUser->hasRole(Role::ADMIN_KAMPUS));
    }

    /**
     * Test isReviewer helper works via flag, primary role, and pivot table.
     */
    public function test_reviewer_detection_via_flag_primary_and_pivot(): void
    {
        // 1. Reviewer via flag alone
        $flagUser = User::create([
            'name' => 'Flag Reviewer',
            'email' => 'flag.reviewer@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_reviewer' => true,
            'is_active' => true,
        ]);
        $this->assertTrue($flagUser->isReviewer());

        // 2. Reviewer via pivot
        $pivotUser = User::create([
            'name' => 'Pivot Reviewer User',
            'email' => 'pivot.user@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => null,
            'is_reviewer' => false,
            'is_active' => true,
        ]);
        $pivotUser->roles()->attach($this->reviewerRole->id);
        $this->assertTrue($pivotUser->isReviewer());
    }

    /**
     * Test hasAnyRole returns false when passed empty array.
     */
    public function test_has_any_role_with_empty_array_returns_false(): void
    {
        $user = User::create([
            'name' => 'Any Role User',
            'email' => 'anyrole@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_active' => true,
        ]);

        $this->assertFalse($user->hasAnyRole([]));
    }

    /**
     * Test fallback check when role relation is cached as null but role_id is present.
     */
    public function test_fallback_when_role_relation_cached_as_null(): void
    {
        $user = User::create([
            'name' => 'Stale User',
            'email' => 'stale@example.ac.id',
            'password' => bcrypt('password'),
            'role_id' => $this->penelitiRole->id,
            'is_active' => true,
        ]);

        // Remove pivot record to strictly test role_id
        DB::table('role_user')->where('user_id', $user->id)->delete();

        // Simulate stale or explicitly null relation
        $user->setRelation('role', null);

        $this->assertTrue($user->hasRole(Role::PENELITI));
        $this->assertTrue($user->hasAnyRole([Role::PENELITI]));
        $this->assertFalse($user->hasRole(Role::SUPER_ADMIN));
    }
}
