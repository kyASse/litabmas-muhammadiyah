# Admin Kampus Researcher Account Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Admin Kampus (LPPM) to review, filter, and approve newly registered researcher accounts belonging to their own university with strict multi-tenancy isolation and IDOR protection.

**Architecture:** Route authorization is expanded to multi-role (`Super Admin` and `Admin Kampus`). Eloquent queries in `UserController` and `DashboardController` are strictly scoped by `university_id` for `Admin Kampus`. The React frontend (`Admin/Users/Index.tsx`) gains quick-filter tabs for pending approvals, and the Admin Dashboard displays pending verification metrics.

**Tech Stack:** Laravel 11/12, Inertia.js, React 19, TypeScript, Tailwind CSS, Pest PHP.

**Spec:** [docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md) & [docs/technical/architecture.md](file:///c:/Chill/Sanbercode/Project/litabmas-muhammadiyah/docs/technical/architecture.md)

---

## File Structure & Responsibilities

| File | Responsibility |
|---|---|
| `routes/web.php` | Expose `admin/users` and `admin/users/{user}/toggle-active` to `Admin Kampus` alongside `Super Admin`. |
| `app/Http/Controllers/Admin/UserController.php` | Enforce multi-tenancy (`university_id` scoping) for `Admin Kampus` and IDOR protection in `toggleActive`. |
| `app/Http/Controllers/Admin/DashboardController.php` | Aggregate `pending_users_count` for the institutional dashboard. |
| `resources/js/components/app-sidebar.tsx` | Provide navigation menu item for `Admin Kampus` to access researcher management. |
| `resources/js/lang/en.ts` & `resources/js/lang/id.ts` | 100% dictionary key parity for user approval tabs, buttons, and alert copy. |
| `resources/js/pages/Admin/Users/Index.tsx` | Quick filter tabs (All vs Pending Approval), institution lock badge for Admin Kampus, and direct activation action. |
| `resources/js/pages/Dashboard/Admin.tsx` | Display pending researcher verification metric card with deep link to pending users. |
| `tests/Feature/AdminKampusUserApprovalTest.php` | Automated Pest tests for tenant isolation, approval, IDOR prevention, and dashboard metrics. |

---

## Tasks

### Task 1: Backend Route Authorization, Multi-Tenancy Isolation, and Pest Tests

- [ ] Write failing Pest test in `tests/Feature/AdminKampusUserApprovalTest.php`:
  - `admin kampus can access users list and only sees users from own university`
  - `admin kampus cannot see users from other universities`
  - `admin kampus can activate inactive researcher from own university`
  - `admin kampus receives 403 forbidden when attempting to activate user from another university`
  - `admin kampus receives 403 forbidden when attempting to delete or edit super admin`
- [ ] Run test to verify it fails (`docker exec litabmas_app ./vendor/bin/pest tests/Feature/AdminKampusUserApprovalTest.php`).
- [ ] Update `routes/web.php`:
  - Move `Route::resource('users', AdminUserController::class)` and `Route::post('users/{user}/toggle-active', ...)` into a shared route group with middleware `role:Super Admin,Admin Kampus`.
- [ ] Update `app/Http/Controllers/Admin/UserController.php`:
  - In `index(Request $request)`: Check if `$user->isAdminKampus() && !$user->isSuperAdmin()`. If so, scope query with `$query->where('university_id', $user->university_id)`. Scope the `stats` aggregation to the same university.
  - In `toggleActive(Request $request, User $user)`: Check if `$currentUser->isAdminKampus() && !$currentUser->isSuperAdmin()`. If `$user->university_id !== $currentUser->university_id`, abort with HTTP 403.
- [ ] Run Pest test to ensure all tests pass (`docker exec litabmas_app ./vendor/bin/pest tests/Feature/AdminKampusUserApprovalTest.php`).
- [ ] Commit changes: `git commit -m "feat(auth): enable multi-tenant user approval for admin kampus with IDOR protection"`.

---

### Task 2: Navigation Menu & Internationalization Parity

- [x] Add translation keys to `resources/js/lang/en.ts` and `resources/js/lang/id.ts`:
  - `t.adminUsers.tabAll`: 'All Users' / 'Semua Pengguna'
  - `t.adminUsers.tabPending`: 'Pending Approval' / 'Menunggu Persetujuan'
  - `t.adminUsers.pendingCount`: '{count} Pending' / '{count} Menunggu'
  - `t.adminUsers.activateAction`: 'Approve Account' / 'Setujui Akun'
  - `t.adminUsers.ownInstitutionOnly`: 'Your Institution ({name})' / 'Institusi Anda ({name})'
  - `t.adminUsers.pendingResearchers`: 'Pending Researchers' / 'Peneliti Menunggu Aktivasi'
- [x] Update `resources/js/components/app-sidebar.tsx`:
  - Add `{ title: t.navigation.users, href: '/admin/users', icon: Users }` to `roleNavItems` for `ROLE_NAMES.ADMIN_KAMPUS`.
- [x] Verify TypeScript types: `npx tsc --noEmit`.
- [x] Commit changes: `git commit -m "feat(navigation): add users menu for admin kampus and i18n keys for approval workflow"`.

---

### Task 3: Researcher Approval Antarmuka & Quick-Filter in `Admin/Users/Index.tsx`

- [x] Update `resources/js/pages/Admin/Users/Index.tsx`:
  - Detect if logged-in user is `Admin Kampus` (via shared auth props).
  - Hide or lock University dropdown filter for Admin Kampus, displaying an institution badge instead.
  - Add quick-switch tabs above the table: `[Semua Pengguna]` and `[Menunggu Persetujuan (Pending)]` with dynamic counter badge.
  - When switching to `Pending Approval` tab, automatically filter `is_active = 0`.
  - Highlight inactive rows with subtle warning accent and primary "Setujui Akun" button.
- [x] Run `npx tsc --noEmit` to verify 0 errors.
- [x] Commit changes: `git commit -m "feat(ui): add quick filter tabs and approval actions in admin users index"`.

---

### Task 4: Dashboard Admin Kampus Integration & Metric Card

- [x] Update `app/Http/Controllers/Admin/DashboardController.php`:
  - Calculate `pending_researchers_count`: `User::where('university_id', $universityId)->where('is_active', false)->count()`.
  - Pass `pending_researchers_count` in `$stats` payload to `Dashboard/Admin.tsx`.
- [x] Update `resources/js/pages/Dashboard/Admin.tsx`:
  - Add `pending_researchers_count?: number` to `DashboardStats` interface.
  - Render an actionable alert banner or metric card if `pending_researchers_count > 0` linking to `/admin/users?is_active=0` with label `t.adminUsers.pendingResearchers`.
- [x] Run `npx tsc --noEmit` and `npm run build`.
- [x] Run full feature test suite:
  `docker exec litabmas_app ./vendor/bin/pest tests/Feature/AdminKampusUserApprovalTest.php tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/AuthenticationTest.php`
- [x] Commit changes: `git commit -m "feat(dashboard): integrate pending researcher approval metric for admin kampus"`.
