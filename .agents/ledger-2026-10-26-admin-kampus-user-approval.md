# Ledger: Admin Kampus Researcher Account Approval

Plan: `docs/superpowers/plans/2026-10-26-admin-kampus-user-approval.md`
Started: 2026-10-26
Branch: `feat/auth-register-login-ejarlit`

## Tasks
- [x] Task 1: Backend Route Authorization, Multi-Tenancy Isolation, and Pest Tests (commit: f2e04aab, Reviewer: APPROVED)
- [x] Task 2: Navigation Menu & Internationalization Parity (commit: 2a723544, Reviewer: APPROVED)
- [x] Task 3: Researcher Approval Antarmuka & Quick-Filter in `Admin/Users/Index.tsx` (commit: 45fe3ad5, Reviewer: APPROVED)
- [x] Task 4: Dashboard Admin Kampus Integration & Metric Card (commit: 5bf820cf, Reviewer: APPROVED)

## Execution Log
- Task 1 completed and reviewed: Backend route authorization added, multi-tenancy isolation and IDOR protection enforced in UserController, Pest tests written and passing (5 passed, 57 assertions).
- Task 2 completed and reviewed: Added Users menu for Admin Kampus in AppSidebar, registered 6 translation keys in en.ts & id.ts with 100% type parity, verified tsc and build without errors.
- Task 3 completed and reviewed: Added quick filter tabs ([Semua Pengguna] & [Menunggu Persetujuan]) with dynamic badge, institution lock badge for Admin Kampus, row highlighting, and direct "Setujui Akun" action button in Admin/Users/Index.tsx. Verified with tsc and Pest tests.
- Task 4 completed and reviewed: Integrated pending_researchers_count into DashboardController and Dashboard/Admin.tsx alert banner, added feature test in AdminKampusUserApprovalTest.php, verified with Pest (15 passed, 96 assertions), tsc (0 errors), and npm run build.
