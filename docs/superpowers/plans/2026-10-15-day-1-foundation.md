# Day 1: Fondasi Multi-Tenancy, 21 Tabel Bersih, & Design System Preview Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fondasi multi-tenancy yang bersih dan aman (TenantScope, BelongsToTenant, 21 tabel domain, User role helper, multi-campus seeder) dan sistem desain frontend Hybrid Scholarly Enterprise dengan 6 komponen pakai-ulang pada rute /design-system-preview bebas emoji.

**Architecture:** Laravel 12 + Eloquent Tenancy Scope (Shared Database, Separate Tenancy berporos university_id dengan bypass Super Admin) + React 19 / Inertia.js 2.0 dengan Tailwind CSS 4 token Cool Slate & Dual Typography.

**Tech Stack:** PHP 8.4, Laravel 12, MySQL 8.0, React 19, TypeScript, Tailwind CSS 4, Inertia.js 2.0, Lucide React.

**Spec:** docs/technical/stages.md (Hari 1), docs/technical/architecture.md, docs/technical/schema.md, docs/technical/design.md, .agents/AGENTS.md

## Global Constraints
- Strict Zero Emoji Invariant: Bebas 100% dari simbol emoji pada seluruh berkas, teks UI, komentar, commit, dan respons. Gunakan [STATUS], [WAJIB], [KRITIS], dll.
- 21 Tabel Domain Bersih: Tidak boleh ada tabel peninggalan OJS/JurnalMu.
- Multi-Tenancy Isolation: Isolasi university_id melalui TenantScope dengan bypass Super Admin.
- User Role Compatibility: User::hasRole() dan User::hasAnyRole() memeriksa kolom legacy role_id dan pivot roles() secara hibrida.
- Cool Slate & Dual Typography: font-serif (Newsreader/Merriweather) untuk judul/abstrak, font-sans (Plus Jakarta Sans/Inter) untuk UI operasional, font-mono tabular-nums untuk angka keuangan dan skor.
- 6 Reusable Components: StatusBadge, PDFUploader, TabularFigure, MetricCard, PageHeader, SplitScreenViewer diuji di /design-system-preview.

---

### Task 1: Backend - Implementasi TenantScope dan BelongsToTenant Trait dengan Global Bypass Super Admin

**Files:**
- Create: `app/Models/Scopes/TenantScope.php`
- Create: `app/Models/Traits/BelongsToTenant.php`
- Test: `tests/Feature/TenantScopeTest.php`

**Interfaces:**
- Consumes: `Illuminate\Database\Eloquent\Scope`, `Illuminate\Database\Eloquent\Builder`, `Illuminate\Support\Facades\Auth`, `App\Models\University`
- Produces: `App\Models\Scopes\TenantScope`, `App\Models\Traits\BelongsToTenant`

- [ ] **Step 1: Write the failing test**

Buat file `tests/Feature/TenantScopeTest.php` yang memvalidasi:
1. Pengguna tanpa login tidak menerima filter atau diblokir sesuai aturan sistem.
2. Pengguna terafiliasi dengan University A hanya dapat melihat data milik University A.
3. Pengguna dengan peran Super Admin dapat melihat data lintas universitas (bypass TenantScope).
4. Pembuatan entitas baru otomatis mengisi `university_id` dari user aktif jika user bukan Super Admin.

```php
<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    protected University $universityA;
    protected University $universityB;
    protected User $superAdmin;
    protected User $userA;
    protected User $userB;
    protected ResearchSchema $schemaA;
    protected ResearchSchema $schemaB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);

        $this->universityA = University::create([
            'name' => 'Universitas Muhammadiyah A',
            'code' => 'UMA',
        ]);

        $this->universityB = University::create([
            'name' => 'Universitas Muhammadiyah B',
            'code' => 'UMB',
        ]);

        $superAdminRole = Role::where('name', Role::SUPER_ADMIN)->first();
        $penelitiRole = Role::where('name', Role::PENELITI)->first();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Test',
            'email' => 'superadmin.test@litabmas.ac.id',
            'role_id' => $superAdminRole->id,
            'university_id' => null,
        ]);
        $this->superAdmin->roles()->attach($superAdminRole->id);

        $this->userA = User::factory()->create([
            'name' => 'Dosen UMA',
            'email' => 'dosen.a@uma.ac.id',
            'role_id' => $penelitiRole->id,
            'university_id' => $this->universityA->id,
        ]);
        $this->userA->roles()->attach($penelitiRole->id);

        $this->userB = User::factory()->create([
            'name' => 'Dosen UMB',
            'email' => 'dosen.b@umb.ac.id',
            'role_id' => $penelitiRole->id,
            'university_id' => $this->universityB->id,
        ]);
        $this->userB->roles()->attach($penelitiRole->id);

        $this->schemaA = ResearchSchema::create([
            'university_id' => $this->universityA->id,
            'nama_skema' => 'Skema UMA',
            'biaya_maksimal' => 20000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $this->schemaB = ResearchSchema::create([
            'university_id' => $this->universityB->id,
            'nama_skema' => 'Skema UMB',
            'biaya_maksimal' => 25000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);
    }

    public function test_tenant_user_only_sees_their_university_records(): void
    {
        $this->actingAs($this->userA);

        $schemas = ResearchSchema::all();
        $this->assertCount(1, $schemas);
        $this->assertEquals($this->schemaA->id, $schemas->first()->id);
    }

    public function test_super_admin_bypasses_tenant_scope(): void
    {
        $this->actingAs($this->superAdmin);

        $schemas = ResearchSchema::all();
        $this->assertCount(2, $schemas);
    }

    public function test_creating_record_auto_assigns_university_id_for_regular_user(): void
    {
        $this->actingAs($this->userA);

        $newSchema = ResearchSchema::create([
            'nama_skema' => 'Skema Otomatis UMA',
            'biaya_maksimal' => 15000000,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ]);

        $this->assertEquals($this->universityA->id, $newSchema->university_id);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec litabmas_app php artisan test tests/Feature/TenantScopeTest.php`
Expected: FAIL (TenantScope does not exist or ResearchSchema does not have BelongsToTenant).

- [ ] **Step 3: Implement TenantScope and BelongsToTenant**

Create `app/Models/Scopes/TenantScope.php`:
```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Terapkan penyaringan tenant pada pembangun kueri Eloquent.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Pengecualian Super Admin untuk keperluan pemantauan global
            if ($user->isSuperAdmin()) {
                return;
            }

            // Terapkan penyaringan ketat berdasarkan university_id pengguna aktif
            if ($user->university_id) {
                $builder->where($model->getTable() . '.university_id', $user->university_id);
            } else {
                // Jika pengguna tidak terafiliasi dengan universitas mana pun, blokir akses
                $builder->whereRaw('1 = 0');
            }
        }
    }
}
```

Create `app/Models/Traits/BelongsToTenant.php`:
```php
<?php

namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;
use App\Models\University;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    /**
     * Boot trait untuk mendaftarkan global scope dan event model.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Daftarkan TenantScope secara otomatis
        static::addGlobalScope(new TenantScope());

        // Otomatisasi pengisian university_id saat pembuatan entitas baru
        static::creating(function ($model) {
            if (Auth::check() && ! $model->university_id && ! Auth::user()->isSuperAdmin()) {
                $model->university_id = Auth::user()->university_id;
            }
        });
    }

    /**
     * Relasi ke entitas induk universitas penyewa (tenant).
     */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class, 'university_id');
    }
}
```

Add `use BelongsToTenant;` in `app/Models/ResearchSchema.php`.

- [ ] **Step 4: Run test to verify it passes**

Run: `docker exec litabmas_app php artisan test tests/Feature/TenantScopeTest.php`
Expected: PASS (all 3 tests pass).

- [ ] **Step 5: Commit**

```bash
git add app/Models/Scopes/TenantScope.php app/Models/Traits/BelongsToTenant.php app/Models/ResearchSchema.php tests/Feature/TenantScopeTest.php
git commit -m "feat(backend): implement TenantScope and BelongsToTenant with Super Admin bypass"
```

---

### Task 2: Backend - Integrasi BelongsToTenant pada Model Tenant-Aware (ResearchSchema, Proposal, Contract, MonevSchedule) dan Verifikasi 21 Model Eloquent

**Files:**
- Modify: `app/Models/Proposal.php`
- Modify: `app/Models/Contract.php`
- Modify: `app/Models/MonevSchedule.php`
- Modify: `app/Models/ResearchSchema.php`
- Modify: `tests/Feature/TenantScopeTest.php`

**Interfaces:**
- Consumes: `App\Models\Traits\BelongsToTenant`
- Produces: Tenant-scoped queries across `Proposal`, `Contract`, `MonevSchedule`, `ResearchSchema`

- [ ] **Step 1: Extend test for Proposal, Contract, and MonevSchedule**

Add test cases in `tests/Feature/TenantScopeTest.php` asserting that `Proposal::all()`, `Contract::all()`, and `MonevSchedule::all()` are automatically isolated by `university_id` for regular users and visible across tenants for Super Admin.

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec litabmas_app php artisan test tests/Feature/TenantScopeTest.php`
Expected: FAIL on the newly added tests.

- [ ] **Step 3: Add BelongsToTenant trait to Proposal, Contract, and MonevSchedule**

In `app/Models/Proposal.php`:
- Import `use App\Models\Traits\BelongsToTenant;`
- Add `use BelongsToTenant;` in class definition.

In `app/Models/Contract.php`:
- Import `use App\Models\Traits\BelongsToTenant;`
- Add `use BelongsToTenant;` in class definition.

In `app/Models/MonevSchedule.php`:
- Import `use App\Models\Traits\BelongsToTenant;`
- Add `use BelongsToTenant;` in class definition.

Verify that all 21 models have proper `$casts`, fillables, and relationships per `docs/technical/schema.md`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker exec litabmas_app php artisan test tests/Feature/TenantScopeTest.php`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add app/Models/Proposal.php app/Models/Contract.php app/Models/MonevSchedule.php tests/Feature/TenantScopeTest.php
git commit -m "feat(backend): attach BelongsToTenant trait to Proposal, Contract, and MonevSchedule models"
```

---

### Task 3: Backend - Verifikasi & Penguatan Helper User::hasRole() dan User::hasAnyRole() (Project Rule 3) Beserta Automated Feature Test

**Files:**
- Modify: `app/Models/User.php`
- Create: `tests/Feature/UserRoleHelperTest.php`

**Interfaces:**
- Consumes: `App\Models\User`, `App\Models\Role`
- Produces: Reliable hybrid role check `User::hasRole(string $role)` and `User::hasAnyRole(array $roles)`

- [ ] **Step 1: Write the failing/verification test**

Buat file `tests/Feature/UserRoleHelperTest.php` yang menguji:
1. User dengan role yang hanya tercatat di kolom `role_id` (legacy seeder mode): `hasRole()` dan `hasAnyRole()` harus mengembalikan `true`.
2. User dengan role yang hanya tercatat di relasi pivot `role_user`: `hasRole()` dan `hasAnyRole()` harus mengembalikan `true`.
3. User dengan multiple roles di pivot (misal Dosen Peneliti sekaligus Reviewer): `hasRole(Role::REVIEWER)` dan `hasRole(Role::PENELITI)` keduanya harus mengembalikan `true`.
4. Role yang tidak dimiliki mengembalikan `false`.

```php
<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleHelperTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
    }

    public function test_has_role_works_with_primary_role_id(): void
    {
        $role = Role::where('name', Role::PENELITI)->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);
        // Do not attach to pivot table to test legacy primary role_id alone
        $user->roles()->detach();

        $this->assertTrue($user->fresh()->hasRole(Role::PENELITI));
        $this->assertTrue($user->fresh()->hasAnyRole([Role::PENELITI, Role::REVIEWER]));
        $this->assertFalse($user->fresh()->hasRole(Role::SUPER_ADMIN));
    }

    public function test_has_role_works_with_pivot_table(): void
    {
        $penelitiRole = Role::where('name', Role::PENELITI)->first();
        $reviewerRole = Role::where('name', Role::REVIEWER)->first();

        $user = User::factory()->create([
            'role_id' => null,
        ]);
        $user->roles()->attach([$penelitiRole->id, $reviewerRole->id]);

        $this->assertTrue($user->fresh()->hasRole(Role::PENELITI));
        $this->assertTrue($user->fresh()->hasRole(Role::REVIEWER));
        $this->assertTrue($user->fresh()->hasAnyRole([Role::REVIEWER, Role::SUPER_ADMIN]));
        $this->assertFalse($user->fresh()->hasRole(Role::SUPER_ADMIN));
    }
}
```

- [ ] **Step 2: Run test to check current behavior**

Run: `docker exec litabmas_app php artisan test tests/Feature/UserRoleHelperTest.php`
Verify if tests pass or if any edge case needs adjustment in `User.php`.

- [ ] **Step 3: Implement / Refine User.php role methods**

Ensure `app/Models/User.php`:
```php
public function hasRole(string $roleName): bool
{
    // 1. Check in primary role (legacy compatibility)
    if ($this->role && $this->role->name === $roleName) {
        return true;
    }

    // 2. Fallback check by role_id direct query if relation not loaded
    if ($this->role_id && ! $this->relationLoaded('role')) {
        $primaryRoleName = Role::where('id', $this->role_id)->value('name');
        if ($primaryRoleName === $roleName) {
            return true;
        }
    }

    // 3. Check in roles relationship (multi-role pivot)
    return $this->roles()->where('name', $roleName)->exists();
}

public function hasAnyRole(array $roleNames): bool
{
    // 1. Check in primary role
    if ($this->role && in_array($this->role->name, $roleNames)) {
        return true;
    }

    // 2. Fallback check by role_id direct query if relation not loaded
    if ($this->role_id && ! $this->relationLoaded('role')) {
        $primaryRoleName = Role::where('id', $this->role_id)->value('name');
        if ($primaryRoleName && in_array($primaryRoleName, $roleNames)) {
            return true;
        }
    }

    // 3. Check in roles relationship
    return $this->roles()->whereIn('name', $roleNames)->exists();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker exec litabmas_app php artisan test tests/Feature/UserRoleHelperTest.php`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add app/Models/User.php tests/Feature/UserRoleHelperTest.php
git commit -m "feat(backend): ensure hybrid role checking in User hasRole and hasAnyRole"
```

---

### Task 4: Backend - Multi-Campus Database Seeder (UniversitySeeder, UserSeeder, ResearchSchemaSeeder, DatabaseSeeder) & Verifikasi migrate:fresh --seed

**Files:**
- Modify: `database/seeders/UniversitySeeder.php`
- Modify: `database/seeders/UserSeeder.php`
- Modify: `database/seeders/ResearchSchemaSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/DatabaseSeederTest.php`

**Interfaces:**
- Consumes: Models `University`, `User`, `Role`, `ResearchSchema`, `AssessmentCriteria`
- Produces: Deterministic seed data across 3 universities (UMY, UAD, UMS), test users for all 5 roles, and 2 active research schemes

- [ ] **Step 1: Write test for database seed integrity**

Create `tests/Feature/DatabaseSeederTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\AssessmentCriteria;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_populates_required_day1_data(): void
    {
        $this->artisan('db:seed');

        // 1. Min 3 Universities seeded
        $this->assertGreaterThanOrEqual(3, University::count());
        $this->assertNotNull(University::where('code', 'UMY')->first());
        $this->assertNotNull(University::where('code', 'UAD')->first());
        $this->assertNotNull(University::where('code', 'UMS')->first());

        // 2. 5 Roles seeded
        $this->assertEquals(5, Role::whereIn('name', [
            Role::SUPER_ADMIN,
            Role::ADMIN_KAMPUS,
            Role::ADMIN_KEUANGAN,
            Role::REVIEWER,
            Role::PENELITI,
        ])->count());

        // 3. User test accounts present
        $superAdmin = User::where('email', 'superadmin@litabmas.ac.id')->first();
        $this->assertNotNull($superAdmin);
        $this->assertTrue($superAdmin->hasRole(Role::SUPER_ADMIN));

        $adminKampus = User::where('email', 'adminkampus@litabmas.ac.id')->first();
        $this->assertNotNull($adminKampus);
        $this->assertTrue($adminKampus->hasRole(Role::ADMIN_KAMPUS));

        $peneliti = User::where('email', 'dosen@litabmas.ac.id')->first();
        $this->assertNotNull($peneliti);
        $this->assertTrue($peneliti->hasRole(Role::PENELITI));

        // 4. Research schemes seeded
        $this->assertGreaterThanOrEqual(2, ResearchSchema::count());

        // 5. Assessment criteria seeded
        $this->assertGreaterThanOrEqual(4, AssessmentCriteria::count());
    }
}
```

- [ ] **Step 2: Update UniversitySeeder, UserSeeder, ResearchSchemaSeeder**

In `database/seeders/UniversitySeeder.php`:
Ensure 3 sample universities are seeded: UMY (Universitas Muhammadiyah Yogyakarta), UAD (Universitas Ahmad Dahlan), UMS (Universitas Muhammadiyah Surakarta).

In `database/seeders/UserSeeder.php`:
Ensure all 5 standard roles have test accounts:
- `superadmin@litabmas.ac.id` (Super Admin, null university)
- `adminkampus@litabmas.ac.id` (Admin Kampus UMY)
- `finance@litabmas.ac.id` (Admin Keuangan UMY)
- `reviewer@litabmas.ac.id` (Reviewer UMY)
- `dosen@litabmas.ac.id` (Dosen Peneliti UMY)
And also add cross-tenant test users for UAD:
- `dosen.uad@litabmas.ac.id` (Dosen Peneliti UAD)
- `adminkampus.uad@litabmas.ac.id` (Admin Kampus UAD)

In `database/seeders/ResearchSchemaSeeder.php`:
Ensure at least 2 default active research schemes are seeded for UMY:
1. `Penelitian Dosen Pemula (PDP) 2026` (Pagu: Rp20.000.000)
2. `Penelitian Terapan Unggulan Perguruan Tinggi (PTUPT) 2026` (Pagu: Rp50.000.000)

- [ ] **Step 3: Run migrate:fresh --seed in docker and run tests**

Run: `docker exec litabmas_app php artisan migrate:fresh --seed`
Run: `docker exec litabmas_app php artisan test tests/Feature/DatabaseSeederTest.php`
Expected: SUCCESS without any foreign key errors; all assertions pass.

- [ ] **Step 4: Commit**

```bash
git add database/seeders/ tests/Feature/DatabaseSeederTest.php
git commit -m "feat(backend): complete multi-campus DatabaseSeeder with 3 universities and 5 standard role accounts"
```

---

### Task 5: Frontend - Konfigurasi Token Desain Cool Slate & Tipografi Ganda di Tailwind CSS 4 (app.css, app.blade.php)

**Files:**
- Modify: `resources/views/app.blade.php`
- Modify: `resources/css/app.css`

**Interfaces:**
- Consumes: Tailwind CSS 4, Google/Bunny fonts
- Produces: CSS utility tokens `font-serif`, `font-sans`, `font-mono`, `surface-base`, `surface-card`, `surface-elevated`, `brand-primary`, `brand-accent`, `text-primary`, `text-secondary`, `border-subtle`

- [ ] **Step 1: Update app.blade.php with Newsreader, Plus Jakarta Sans, and JetBrains Mono**

In `resources/views/app.blade.php`:
- Include fonts from Bunny Fonts or Google Fonts:
  - `Plus Jakarta Sans` (400, 500, 600, 700)
  - `Newsreader` (400, 500, 600, 700, italic)
  - `JetBrains Mono` (400, 500, 600)
- Update title default to `SIM-Penelitian Multi-Kampus`.

- [ ] **Step 2: Update resources/css/app.css @theme block**

Add:
```css
@theme {
    --font-serif: 'Newsreader', 'Merriweather', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

    --color-surface-base: #f8fafc;
    --color-surface-card: #ffffff;
    --color-surface-elevated: #f1f5f9;
    --color-surface-muted: #e2e8f0;
    --color-surface-sidebar: #0f172a;

    --color-border-subtle: #e2e8f0;
    --color-border-strong: #cbd5e1;
    --color-border-focus: #1e3a8a;

    --color-brand-primary: #1e3a8a;
    --color-brand-primary-hover: #1e40af;
    --color-brand-primary-light: #eff6ff;

    --color-brand-accent: #059669;
    --color-brand-accent-hover: #047857;
    --color-brand-accent-light: #ecfdf5;

    --color-text-primary: #0f172a;
    --color-text-secondary: #475569;
    --color-text-muted: #94a3b8;
    --color-text-inverse: #ffffff;
}
```

- [ ] **Step 3: Run npm run build to verify syntax**

Run: `npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 4: Commit**

```bash
git add resources/views/app.blade.php resources/css/app.css
git commit -m "feat(frontend): configure Cool Slate tokens and dual typography in Tailwind CSS 4"
```

---

### Task 6: Frontend - Implementasi 6 Komponen Pakai-Ulang Standar (StatusBadge, PDFUploader, TabularFigure, MetricCard, PageHeader, SplitScreenViewer)

**Files:**
- Create/Update: `resources/js/components/UI/StatusBadge.tsx`
- Create/Update: `resources/js/components/UI/PDFUploader.tsx`
- Create/Update: `resources/js/components/UI/TabularFigure.tsx`
- Create/Update: `resources/js/components/UI/MetricCard.tsx`
- Create/Update: `resources/js/components/UI/PageHeader.tsx`
- Create/Update: `resources/js/components/UI/SplitScreenViewer.tsx`
- Create: `resources/js/components/UI/index.ts`
- Test: `resources/js/components/UI/__tests__/UIComponents.test.tsx` (or Vitest / manual build test)

**Interfaces:**
- Consumes: `lucide-react`, React 19, Tailwind CSS classes
- Produces: 6 exported reusable components with strict zero emoji policy and exact prop types

- [ ] **Step 1: Implement StatusBadge.tsx**

Implement `resources/js/components/UI/StatusBadge.tsx` strictly following `docs/technical/design.md` Bab 5.2.
14 status states:
- `Draft` -> `[DRAFT]` (FileEdit, slate)
- `Submitted` -> `[DIAJUKAN]` (Send, sky)
- `In_Review` -> `[SEDANG DIREVIEW]` (Clock, amber)
- `Lolos_Didanai` -> `[LOLOS DIDANAI]` (CheckCircle2, emerald)
- `Ditolak` -> `[DITOLAK]` (XCircle, rose)
- `Revisi` -> `[PERLU REVISI]` (AlertTriangle, amber)
- `Contracted` -> `[TERKONTRAK]` (FileCheck, blue)
- `Disbursed_T1` -> `[CAIR TERMIN 1]` (CheckCircle2, teal)
- `Disbursed_T2` -> `[CAIR TERMIN 2]` (CheckCircle2, emerald)
- `Monev_Approved` -> `[MONEV DISETUJUI]` (Unlock, emerald)
- `Monev_Locked` -> `[TERKUNCI MONEV]` (Lock, rose)
- `Output_Verified` -> `[LUARAN TERVERIFIKASI]` (ShieldCheck, indigo)
- `Completed_SKTS` -> `[SELESAI (SKTS)]` (Archive, slate-900)
- `Terminated` -> `[FORCE MAJEURE / DIBATALKAN]` (XCircle, rose-100)
Zero emoji characters anywhere.

- [ ] **Step 2: Implement PDFUploader.tsx**

Implement `resources/js/components/UI/PDFUploader.tsx`:
- Drag-and-drop zone with UploadCloud icon (Lucide)
- Strict validation: mime-type `application/pdf` or extension `.pdf`
- Size guard: max 10MB (10.485.760 bytes default), configurable `maxSizeMB`
- Selected state shows FileText icon, filename, size in MB, and remove button (X)
- Error message container with AlertCircle icon

- [ ] **Step 3: Implement TabularFigure.tsx**

Implement `resources/js/components/UI/TabularFigure.tsx`:
- Monospace tabular numbers (`font-mono tabular-nums`)
- Types: `currency` (IDR with Intl.NumberFormat), `score` (2 decimals), `percentage` (1 decimal + %), `integer`
- Configurable alignment (`left`, `right`, `center`) - default `right`
- Zero CLS layout stability

- [ ] **Step 4: Implement MetricCard.tsx**

Implement `resources/js/components/UI/MetricCard.tsx`:
- 12-column bento card compatible
- Title uppercase tracking-wider
- Main value formatted via `TabularFigure`
- Micro-icon with configurable background/color
- Optional badge and caption
- Subtle border (`border-slate-200`) and micro-shadow (`shadow-xs`)

- [ ] **Step 5: Implement PageHeader.tsx**

Implement `resources/js/components/UI/PageHeader.tsx`:
- Breadcrumbs trail with ChevronRight icons
- Title with dual-personality toggle: `isEditorialSerif` (Newsreader Serif) vs Operational (Sans)
- Subtitle in text-slate-600
- Badge slot & CTA action buttons slot

- [ ] **Step 6: Implement SplitScreenViewer.tsx**

Implement `resources/js/components/UI/SplitScreenViewer.tsx`:
- 60% Left pane: PDF viewer iframe with `#toolbar=1&navpanes=0`
- 40% Right pane: Interactive evaluation form container
- Top utility bar with Document title, Open in New Tab, Download PDF, and Expand/Minimize toggle button
- Responsive layout collapse on mobile/tablet

- [ ] **Step 7: Create resources/js/components/UI/index.ts barrel export**

Export all 6 components and their TypeScript interfaces.

- [ ] **Step 8: Run npm run build to verify TypeScript and JSX compile cleanly**

Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 9: Commit**

```bash
git add resources/js/components/UI/
git commit -m "feat(frontend): implement 6 core reusable UI components adhering to Hybrid Scholarly Enterprise design"
```

---

### Task 7: Frontend - Rute Internal dan Halaman Katalog /design-system-preview Beserta Showcase Interaktif

**Files:**
- Create: `resources/js/pages/DesignSystemPreview.tsx`
- Modify: `routes/web.php`
- Modify: `app/Http/Controllers/HomeController.php` (or dedicated PreviewController)

**Interfaces:**
- Consumes: 6 UI components from `@/components/UI`, Inertia Head
- Produces: Route `GET /design-system-preview` rendering interactive component catalog

- [ ] **Step 1: Create DesignSystemPreview.tsx**

Create `resources/js/pages/DesignSystemPreview.tsx`:
- Section 1: Color Palette Tokens showcase (Cool Slate, Brand Navy, Academic Emerald, System States)
- Section 2: Typography Scale (Serif Editorial H1/Display vs Sans Operational UI vs Tabular Numbers)
- Section 3: StatusBadge - Grid of all 14 statuses in `sm` and `md` sizes
- Section 4: PDFUploader - Interactive uploader with 10MB test validation and mock file states
- Section 5: TabularFigure - Currency, scores, percentages, and large numbers
- Section 6: MetricCard - 4-column Bento grid with realistic research metrics (Pagu Anggaran, Total Proposal, Reviewer Aktif, Luaran Terverifikasi)
- Section 7: PageHeader - Showcase of both Editorial Serif header and Sans Operational header with breadcrumbs and action buttons
- Section 8: SplitScreenViewer - Interactive demo with toggleable expand/collapse and mock rubric form
- Ensure 100% zero emoji across all headings, labels, and text.

- [ ] **Step 2: Add route in routes/web.php**

In `routes/web.php`:
```php
Route::get('/design-system-preview', function () {
    return inertia('DesignSystemPreview');
})->name('design-system-preview');
```

- [ ] **Step 3: Run npm run build and check route via curl/artisan**

Run: `npm run build`
Expected: PASS without errors.
Run: `docker exec litabmas_app php artisan route:list --name=design-system-preview`
Expected: Route is registered.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/DesignSystemPreview.tsx routes/web.php
git commit -m "feat(frontend): create /design-system-preview component catalog page and route"
```

---

### Task 8: Verifikasi Menyeluruh & Quality Gate Hari 1

**Files:**
- All touched files
- Test: `tests/Feature/QualityGateDay1Test.php`

**Interfaces:**
- Consumes: Complete Day 1 codebase
- Produces: Verified build, migration, tenancy scope, and preview route

- [ ] **Step 1: Write automated feature test for Day 1 Quality Gate**

Create `tests/Feature/QualityGateDay1Test.php`:
- Test route `/design-system-preview` returns status 200 and renders component `DesignSystemPreview`.
- Test that all 21 domain tables exist in the database schema.
- Test that multi-tenancy isolation correctly prevents User A from accessing User B's records.

- [ ] **Step 2: Run full backend test suite**

Run: `docker exec litabmas_app php artisan test tests/Feature/TenantScopeTest.php tests/Feature/UserRoleHelperTest.php tests/Feature/DatabaseSeederTest.php tests/Feature/QualityGateDay1Test.php`
Expected: 100% PASS.

- [ ] **Step 3: Run fresh database migration with seed**

Run: `docker exec litabmas_app php artisan migrate:fresh --seed`
Expected: SUCCESS without any errors.

- [ ] **Step 4: Run frontend production build**

Run: `npm run build`
Expected: SUCCESS without any errors or warnings.

- [ ] **Step 5: Run strict zero emoji invariant audit**

Search for any Unicode emoji character `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` in `app/`, `resources/js/components/UI/`, `resources/js/pages/DesignSystemPreview.tsx`, and `database/seeders/`.
Expected: 0 matches found.

- [ ] **Step 6: Commit all remaining changes**

```bash
git add tests/Feature/QualityGateDay1Test.php
git commit -m "test(quality-gate): add Day 1 quality gate verification tests"
```
