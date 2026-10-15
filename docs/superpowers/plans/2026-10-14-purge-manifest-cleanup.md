# Purge Manifest & Blueprint Pembersihan (Bab 8 PRD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengeliminasi 100% kode warisan OJS Kelas G dan JurnalMu, merampingkan rute/navigasi untuk 5 peran penelitian, mengonsolidasi basis data ke 21 tabel bersih, serta membuktikan `migrate:fresh --seed` dan `npm run build` berhasil 100%.

**Architecture:** Menerapkan pendekatan *Atomic Phased Execution* pada branch terisolasi `refactor/standalone-research-purge`. Pembersihan dilakukan secara runut mulai dari Controller, Model, Frontend, Rute, Navigasi, hingga Migrasi/Seeder, diakhiri dengan eksekusi acceptance gate.

**Tech Stack:** Laravel 12 (PHP 8.2+), React 19, TypeScript, Inertia.js 2.0, Vite 6+, Tailwind CSS 4, MySQL / MariaDB, Eloquent ORM.

**Spec:** `docs/superpowers/specs/2026-10-14-purge-manifest-design.md`

## Global Constraints

- Branch Git kerja: `refactor/standalone-research-purge` (tidak mengubah langsung `main`).
- Bebas emoji pada seluruh kode, pesan commit, komentar, dan antarmuka.
- Wajib menggunakan helper `$user->hasRole($role)` atau `$user->hasAnyRole([$roles])` untuk backward compatibility pivot `role_user` dan kolom legacy `role_id`.
- 100% berkas yang tertera pada Purge Manifest Bab 8 PRD wajib terhapus secara fisik.
- Menghasilkan 21 tabel bersih sesuai Bab 6.2 PRD saat `migrate:fresh --seed`.
- `npm run build` dan `php artisan route:list` wajib berakhir dengan exit code 0 tanpa error.

---

### Task 1: Git Isolation & Pre-checks

**Files:**
- Worktree/Branch: `refactor/standalone-research-purge`

**Interfaces:**
- Consumes: Branch `main` dalam status clean.
- Produces: Branch terisolasi `refactor/standalone-research-purge` siap eksekusi.

- [ ] **Step 1: Periksa status git saat ini**

```bash
git status -s
git branch --show-current
```
Expected: Branch `main` bersih tanpa uncommitted changes.

- [ ] **Step 2: Buat dan beralih ke branch baru `refactor/standalone-research-purge`**

```bash
git checkout -b refactor/standalone-research-purge
```
Expected: `Switched to a new branch 'refactor/standalone-research-purge'`

- [ ] **Step 3: Verifikasi branch aktif**

```bash
git branch --show-current
```
Expected: `refactor/standalone-research-purge`

---

### Task 2: Purge Legacy Backend Controllers (Bab 8.1)

**Files:**
- Delete:
  - `app/Http/Controllers/SubmissionController.php`
  - `app/Http/Controllers/SubmissionWizardController.php`
  - `app/Http/Controllers/DiscussionController.php`
  - `app/Http/Controllers/CitationController.php`
  - `app/Http/Controllers/PublicJournalController.php`
  - `app/Http/Controllers/ReviewerProfileController.php`
  - `app/Http/Controllers/EmailTemplateController.php`
  - `app/Http/Controllers/Editorial/`
  - `app/Http/Controllers/Copyediting/`
  - `app/Http/Controllers/Production/`
  - `app/Http/Controllers/Revision/`
  - `app/Http/Controllers/Dikti/`
  - `app/Http/Controllers/AdminKampus/`
  - `app/Http/Controllers/Admin/AccreditationTemplateController.php`
  - `app/Http/Controllers/Admin/AssessmentController.php`
  - `app/Http/Controllers/Admin/BorangIndikatorController.php`
  - `app/Http/Controllers/Admin/EssayQuestionController.php`
  - `app/Http/Controllers/Admin/EvaluationCategoryController.php`
  - `app/Http/Controllers/Admin/EvaluationIndicatorController.php`
  - `app/Http/Controllers/Admin/EvaluationSubCategoryController.php`
  - `app/Http/Controllers/Admin/JournalController.php`
  - `app/Http/Controllers/Admin/PembinaanController.php`
  - `app/Http/Controllers/Admin/DataMasterController.php`

**Interfaces:**
- Consumes: File Controller lama di `app/Http/Controllers/`.
- Produces: Direktori Controller yang bersih dari OJS dan JurnalMu.

- [ ] **Step 1: Eksekusi skrip penghapusan controller legacy**

```powershell
pwsh -Command '
$files = @(
  "app/Http/Controllers/SubmissionController.php",
  "app/Http/Controllers/SubmissionWizardController.php",
  "app/Http/Controllers/DiscussionController.php",
  "app/Http/Controllers/CitationController.php",
  "app/Http/Controllers/PublicJournalController.php",
  "app/Http/Controllers/ReviewerProfileController.php",
  "app/Http/Controllers/EmailTemplateController.php",
  "app/Http/Controllers/Admin/AccreditationTemplateController.php",
  "app/Http/Controllers/Admin/AssessmentController.php",
  "app/Http/Controllers/Admin/BorangIndikatorController.php",
  "app/Http/Controllers/Admin/EssayQuestionController.php",
  "app/Http/Controllers/Admin/EvaluationCategoryController.php",
  "app/Http/Controllers/Admin/EvaluationIndicatorController.php",
  "app/Http/Controllers/Admin/EvaluationSubCategoryController.php",
  "app/Http/Controllers/Admin/JournalController.php",
  "app/Http/Controllers/Admin/PembinaanController.php",
  "app/Http/Controllers/Admin/DataMasterController.php"
)
foreach ($f in $files) {
  if (Test-Path $f) { Remove-Item -Force $f; Write-Output "Removed: $f" }
}

$dirs = @(
  "app/Http/Controllers/Editorial",
  "app/Http/Controllers/Copyediting",
  "app/Http/Controllers/Production",
  "app/Http/Controllers/Revision",
  "app/Http/Controllers/Dikti",
  "app/Http/Controllers/AdminKampus"
)
foreach ($d in $dirs) {
  if (Test-Path $d) { Remove-Item -Recurse -Force $d; Write-Output "Removed Dir: $d" }
}
'
```

- [ ] **Step 2: Verifikasi fisik bahwa seluruh controller terhapus**

```powershell
pwsh -Command '
$check = @(
  "app/Http/Controllers/SubmissionController.php",
  "app/Http/Controllers/Editorial",
  "app/Http/Controllers/AdminKampus",
  "app/Http/Controllers/Admin/BorangIndikatorController.php"
)
$remaining = $check | Where-Object { Test-Path $_ }
if ($remaining.Count -eq 0) { Write-Output "VERIFIED: All target controllers removed." } else { Write-Error "Still exists: $remaining" }
'
```
Expected: `VERIFIED: All target controllers removed.`

- [ ] **Step 3: Commit perubahan Task 2**

```bash
git add -A
git commit -m "refactor(controller): purge legacy OJS and JurnalMu controllers per Bab 8.1"
```

---

### Task 3: Purge Legacy Backend Models (Bab 8.2)

**Files:**
- Delete:
  - OJS Models: `app/Models/Submission.php`, `SubmissionFile.php`, `SubmissionContributor.php`, `SubmissionDiscussion.php`, `DiscussionMessage.php`, `EditorialAssignment.php`, `EditorialDecision.php`, `CopyeditingTask.php`, `RevisionRound.php`, `ProductionIssue.php`, `PlagiarismCheck.php`, `Galley.php`, `Issue.php`, `Article.php`, `Journal.php`, `AuthorProfile.php`, `ReviewAssignment.php`, `ReviewDecision.php`, `ReviewerAssignment.php`, `ReviewForm.php`, `EmailTemplate.php`
  - JurnalMu & Warisan Models: `app/Models/AccreditationTemplate.php`, `Agenda.php`, `AssessmentAttachment.php`, `AssessmentIssue.php`, `AssessmentJournalMetadata.php`, `AssessmentNote.php`, `AssessmentResponse.php`, `EssayQuestion.php`, `EvaluationCategory.php`, `EvaluationIndicator.php`, `EvaluationSubCategory.php`, `JournalAssessment.php`, `JournalReassignment.php`, `Pembinaan.php`, `PembinaanRegistration.php`, `PembinaanRegistrationAttachment.php`, `PembinaanReview.php`, `ScientificField.php`
  - Redundant Non-standard Models: `app/Models/Announcement.php`, `app/Models/SkemaPendanaan.php`, `app/Models/SystemLog.php`, `app/Models/UserRole.php`

**Interfaces:**
- Consumes: File Model lama di `app/Models/`.
- Produces: Direktori Model bersih hanya berisi entitas riset inti 21 tabel.

- [ ] **Step 1: Eksekusi skrip penghapusan model legacy**

```powershell
pwsh -Command '
$models = @(
  "Submission.php", "SubmissionFile.php", "SubmissionContributor.php", "SubmissionDiscussion.php", "DiscussionMessage.php",
  "EditorialAssignment.php", "EditorialDecision.php", "CopyeditingTask.php", "RevisionRound.php", "ProductionIssue.php",
  "PlagiarismCheck.php", "Galley.php", "Issue.php", "Article.php", "Journal.php",
  "AuthorProfile.php", "ReviewAssignment.php", "ReviewDecision.php", "ReviewerAssignment.php", "ReviewForm.php", "EmailTemplate.php",
  "AccreditationTemplate.php", "Agenda.php", "AssessmentAttachment.php", "AssessmentIssue.php", "AssessmentJournalMetadata.php",
  "AssessmentNote.php", "AssessmentResponse.php", "EssayQuestion.php", "EvaluationCategory.php", "EvaluationIndicator.php",
  "EvaluationSubCategory.php", "JournalAssessment.php", "JournalReassignment.php", "Pembinaan.php", "PembinaanRegistration.php",
  "PembinaanRegistrationAttachment.php", "PembinaanReview.php", "ScientificField.php",
  "Announcement.php", "SkemaPendanaan.php", "SystemLog.php", "UserRole.php"
)
foreach ($m in $models) {
  $target = "app/Models/$m"
  if (Test-Path $target) { Remove-Item -Force $target; Write-Output "Removed: $target" }
}
'
```

- [ ] **Step 2: Verifikasi daftar model yang tersisa**

```powershell
pwsh -Command '
$remaining = Get-ChildItem -Path app/Models | Select-Object -ExpandProperty Name
Write-Output "Remaining Models:"
$remaining
'
```
Expected: Hanya berisi model 21 tabel bersih (`University.php`, `Role.php`, `User.php`, `ActivityLog.php`, `Notification.php`, `ResearchSchema.php`, `Proposal.php`, `ProposalDocument.php`, `AssessmentCriteria.php`, `Review.php`, `Contract.php`, `Funding.php`, `MonevSchedule.php`, `ProgressReport.php`, `ResearchOutput.php`, `JournalOutput.php`, `BookOutput.php`, `HkiOutput.php`, `ProductOutput.php`, `Evaluation.php`).

- [ ] **Step 3: Commit perubahan Task 3**

```bash
git add -A
git commit -m "refactor(model): purge legacy OJS and JurnalMu models per Bab 8.2"
```

---

### Task 4: Purge Legacy Frontend Pages and OJS Components (Bab 8.3)

**Files:**
- Delete:
  - `resources/js/pages/Submission/`
  - `resources/js/pages/Editorial/`, `Copyediting/`, `Production/`, `Revision/`, `Discussion/`, `Journals/`, `Public/`, `Browse/`, `Dikti/`, `AdminKampus/`
  - `resources/js/pages/Resources.tsx`, `Support.tsx`
  - Komponen: `WizardProgressBar.tsx`, `KeywordInput.tsx`, `ContributorForm.tsx`, `SubmissionStatusBadge.tsx`, `SubmissionTimeline.tsx`, `RevokeRoleModal.tsx`, `RoleBadge.tsx`

**Interfaces:**
- Consumes: Berkas frontend legacy.
- Produces: Direktori `resources/js/pages/` dan `components/` yang bersih dari OJS.

- [ ] **Step 1: Eksekusi skrip penghapusan frontend pages dan komponen OJS**

```powershell
pwsh -Command '
$dirs = @(
  "resources/js/pages/Submission",
  "resources/js/pages/Editorial",
  "resources/js/pages/Copyediting",
  "resources/js/pages/Production",
  "resources/js/pages/Revision",
  "resources/js/pages/Discussion",
  "resources/js/pages/Journals",
  "resources/js/pages/Public",
  "resources/js/pages/Browse",
  "resources/js/pages/Dikti",
  "resources/js/pages/AdminKampus"
)
foreach ($d in $dirs) {
  if (Test-Path $d) { Remove-Item -Recurse -Force $d; Write-Output "Removed Dir: $d" }
}

$files = @(
  "resources/js/pages/Resources.tsx",
  "resources/js/pages/Support.tsx",
  "resources/js/components/WizardProgressBar.tsx",
  "resources/js/components/KeywordInput.tsx",
  "resources/js/components/ContributorForm.tsx",
  "resources/js/components/SubmissionStatusBadge.tsx",
  "resources/js/components/SubmissionTimeline.tsx",
  "resources/js/components/RevokeRoleModal.tsx",
  "resources/js/components/RoleBadge.tsx"
)
foreach ($f in $files) {
  if (Test-Path $f) { Remove-Item -Force $f; Write-Output "Removed: $f" }
}
'
```

- [ ] **Step 2: Verifikasi fisik bahwa halaman dan komponen terhapus**

```powershell
pwsh -Command '
$check = @("resources/js/pages/Submission", "resources/js/pages/Resources.tsx", "resources/js/components/WizardProgressBar.tsx")
$remaining = $check | Where-Object { Test-Path $_ }
if ($remaining.Count -eq 0) { Write-Output "VERIFIED: All target frontend files removed." } else { Write-Error "Still exists: $remaining" }
'
```
Expected: `VERIFIED: All target frontend files removed.`

- [ ] **Step 3: Commit perubahan Task 4**

```bash
git add -A
git commit -m "refactor(frontend): purge legacy pages and OJS components per Bab 8.3"
```

---

### Task 5: Route, Model Relationship, & Autoloader Alignment

**Files:**
- Modify: `routes/web.php`
- Modify: `app/Models/User.php`
- Modify: `app/Models/University.php`

**Interfaces:**
- Consumes: Target rute Bab 7 dan model entitas bersih.
- Produces: `routes/web.php` yang tervalidasi dengan `php artisan route:list` tanpa broken controller.

- [ ] **Step 1: Bersihkan relasi model `User.php` dari rujukan model lama**

Hapus relasi: `submissions()`, `journals()`, `editorialAssignments()`, `pembinaanRegistrations()`, `scientificField()`.
Pertahankan / pastikan ada relasi:
- `university()`: belongsTo(University::class)
- `roles()`: belongsToMany(Role::class, 'role_user')
- `proposals()`: hasMany(Proposal::class, 'id_pengusul')
- `reviews()`: hasMany(Review::class, 'id_reviewer')
- `evaluations()`: hasMany(Evaluation::class, 'id_evaluator')
Pastikan method helper `hasRole($role)` dan `hasAnyRole($roles)` tersedia:
```php
public function hasRole(string $roleName): bool
{
    if ($this->role && $this->role->name === $roleName) {
        return true;
    }
    return $this->roles()->where('name', $roleName)->exists();
}

public function hasAnyRole(array $roleNames): bool
{
    if ($this->role && in_array($this->role->name, $roleNames, true)) {
        return true;
    }
    return $this->roles()->whereIn('name', $roleNames)->exists();
}
```

- [ ] **Step 2: Bersihkan relasi model `University.php` dari rujukan model lama**

Hapus relasi: `journals()`, `scientificFields()`.
Pertahankan / pastikan ada relasi:
- `users()`: hasMany(User::class)
- `researchSchemas()`: hasMany(ResearchSchema::class)
- `proposals()`: hasMany(Proposal::class)
- `contracts()`: hasMany(Contract::class)
- `monevSchedules()`: hasMany(MonevSchedule::class)

- [ ] **Step 3: Perbarui `routes/web.php` secara bersih sesuai Bab 7 PRD**

Susun `routes/web.php` agar hanya mengimpor controller yang masih ada (ProposalController, SchemaController, DocumentController, ReviewerController, ReviewController, ContractController, FundingController, FinanceReportController, ProgressController, MonevDocumentController, OutputController, OutputDocController, EvaluationController, ActivityLogController, Admin/UniversityController, Admin/UserController, Auth controllers).
Daftarkan grup rute sesuai Bab 7:
- Auth routes
- Storage stream: `/storage/{path}`
- Home/Dashboard redirect
- `middleware(['auth', 'role:Peneliti'])`
- `middleware(['auth', 'role:Reviewer'])`
- `middleware(['auth', 'role:Admin Keuangan'])`
- `middleware(['auth', 'role:Admin Kampus'])`
- `middleware(['auth', 'role:Super Admin'])`

- [ ] **Step 4: Jalankan autoloader dan verifikasi route list**

```bash
composer dump-autoload
php artisan optimize:clear
php artisan route:list
```
Expected: `php artisan route:list` berjalan lancar dengan status 0 tanpa galat `Target class [XYZ] does not exist`.

- [ ] **Step 5: Commit perubahan Task 5**

```bash
git add -A
git commit -m "refactor(routes): align web.php and model relationships to Bab 7 PRD"
```

---

### Task 6: Frontend Navigation & TypeScript Types Alignment

**Files:**
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/constants/roles.ts`
- Modify: `resources/js/types/index.d.ts` (jika ada rujukan tipe OJS/JurnalMu)

**Interfaces:**
- Consumes: Navigasi antarmuka dan 5 peran penelitian.
- Produces: Komponen navigasi yang bebas dari link mati dan lulus validasi TypeScript.

- [ ] **Step 1: Selaraskan konstanta peran di `resources/js/constants/roles.ts`**

Pastikan hanya memuat 5 peran standar:
```typescript
export const ROLE_NAMES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_KAMPUS: 'Admin Kampus',
    ADMIN_KEUANGAN: 'Admin Keuangan',
    REVIEWER: 'Reviewer',
    PENELITI: 'Peneliti',
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];
```

- [ ] **Step 2: Perbarui `resources/js/components/app-sidebar.tsx`**

Hapus `commonNavItems` yang mengarah ke `route('support')` dan `route('resources')`.
Susun item menu sidebar untuk 5 peran:
- `ROLE_NAMES.SUPER_ADMIN`: Universities (`/admin/universities`), Users (`/admin/users`), System Logs (`/admin/logs`), Settings (`/admin/settings`).
- `ROLE_NAMES.ADMIN_KAMPUS`: Skema Penelitian (`/admin/schemas`), Usulan Proposal (`/admin/proposals`), Jadwal Monev (`/admin/monev`), Verifikasi Luaran (`/admin/output`), Kelulusan & SKTS (`/admin/evaluations`).
- `ROLE_NAMES.ADMIN_KEUANGAN`: Kontrak Hibah (`/finance/contracts`), Termin & Pencairan (`/finance/fundings`), Laporan Keuangan (`/finance/reports`).
- `ROLE_NAMES.REVIEWER`: Dashboard Reviewer (`/reviewer/dashboard`), Penilaian Proposal (`/reviewer/proposals`), Penilaian Monev (`/reviewer/monev`).
- `ROLE_NAMES.PENELITI`: Usulan Penelitian (`/proposals`), Laporan Kemajuan (`/progress`), Luaran Riset (`/outputs`), Evaluasi Akhir (`/evaluations/my-final-report`).

- [ ] **Step 3: Verifikasi kompilasi TypeScript untuk komponen navigasi**

```bash
npx tsc --noEmit
```
Expected: Tidak ada error tipe pada `app-sidebar.tsx` dan `roles.ts`.

- [ ] **Step 4: Commit perubahan Task 6**

```bash
git add -A
git commit -m "refactor(frontend): align app-sidebar navigation with 5 research roles"
```

---

### Task 7: Database Migration Consolidation (21 Clean Tables) & Seeders

**Files:**
- Directory: `database/migrations/`
- Modify: `database/seeders/DatabaseSeeder.php`
- Create/Modify: `database/seeders/RoleSeeder.php`, `UniversitySeeder.php`, `UserSeeder.php`, `AssessmentCriteriaSeeder.php`

**Interfaces:**
- Consumes: Spesifikasi 21 Tabel Bersih Bab 6.2 PRD.
- Produces: Set migrasi kronologis yang bersih dan seeder yang sukses dieksekusi via `php artisan migrate:fresh --seed`.

- [ ] **Step 1: Backup migrasi lama dan susun migrasi baru 21 tabel bersih**

Pindahkan migrasi lama keluar dari direktori aktif atau bersihkan seluruh migrasi yang tidak relevan dengan 21 tabel bersih.
Susun file migrasi dengan urutan penamaan timestamp kronologis:
1. `0001_01_01_000000_create_universities_table.php` (tabel `universities`)
2. `0001_01_01_000001_create_roles_table.php` (tabel `roles`)
3. `0001_01_01_000002_create_users_table.php` (tabel `users` dengan `university_id`, `role_id`, dsb.)
4. `0001_01_01_000003_create_role_user_table.php` (tabel `role_user`)
5. `0001_01_01_000004_create_activity_logs_table.php` (tabel `activity_logs`)
6. `0001_01_01_000005_create_notifications_table.php` (tabel `notifications`)
7. `0001_01_01_000006_create_sessions_and_cache_tables.php` (tabel bawaan: `sessions`, `cache`, `cache_locks`, `password_reset_tokens`, `jobs`, `failed_jobs`)
8. `0001_01_01_000007_create_research_schemas_table.php` (tabel `research_schemas`)
9. `0001_01_01_000008_create_proposals_table.php` (tabel `proposals`)
10. `0001_01_01_000009_create_proposal_documents_table.php` (tabel `proposal_documents`)
11. `0001_01_01_000010_create_assessment_criteria_table.php` (tabel `assessment_criteria`)
12. `0001_01_01_000011_create_reviews_table.php` (tabel `reviews`)
13. `0001_01_01_000012_create_contracts_table.php` (tabel `contracts`)
14. `0001_01_01_000013_create_fundings_table.php` (tabel `fundings`)
15. `0001_01_01_000014_create_monev_schedules_table.php` (tabel `monev_schedules`)
16. `0001_01_01_000015_create_progress_reports_table.php` (tabel `progress_reports`)
17. `0001_01_01_000016_create_research_outputs_table.php` (tabel `research_outputs`)
18. `0001_01_01_000017_create_research_output_details_tables.php` (tabel `journal_outputs`, `book_outputs`, `hki_outputs`, `product_outputs`)
19. `0001_01_01_000018_create_evaluations_table.php` (tabel `evaluations`)

- [ ] **Step 2: Perbarui seeder (`DatabaseSeeder.php`)**

Konfigurasi seeder untuk menginisialisasi:
- 5 Peran: `Super Admin`, `Admin Kampus`, `Admin Keuangan`, `Reviewer`, `Peneliti`.
- Universitas default (misal: "Universitas Muhammadiyah Contoh", kode: "UM-01").
- Akun default untuk pengujian:
  - Super Admin: `superadmin@litabmas.ac.id` (password: `password`)
  - Admin Kampus: `adminkampus@litabmas.ac.id`
  - Keuangan: `finance@litabmas.ac.id`
  - Reviewer: `reviewer@litabmas.ac.id`
  - Dosen/Peneliti: `dosen@litabmas.ac.id`
- Kriteria penilaian bawaan (rubrik standar LPPM).

- [ ] **Step 3: Jalankan `php artisan migrate:fresh --seed`**

```bash
php artisan migrate:fresh --seed
```
Expected: `Migration table created successfully. ... Database seeding completed successfully.` (Exit code 0).

- [ ] **Step 4: Commit perubahan Task 7**

```bash
git add -A
git commit -m "feat(database): consolidate clean 21 tables migrations and research seeders"
```

---

### Task 8: Final Acceptance Gate Verification & Build

**Files:**
- N/A (Verifikasi sistem secara menyeluruh)

**Interfaces:**
- Consumes: Seluruh basis kode pada branch `refactor/standalone-research-purge`.
- Produces: Bukti eksekusi sukses 4 kriteria penerimaan Bab 10.1.

- [ ] **Step 1: Jalankan manifest audit verifikasi fisik**

```powershell
pwsh -Command '
$manifest = @(
  "app/Http/Controllers/SubmissionController.php",
  "app/Http/Controllers/Editorial",
  "app/Http/Controllers/Dikti",
  "app/Models/Submission.php",
  "app/Models/Journal.php",
  "resources/js/pages/Submission",
  "resources/js/pages/Editorial"
)
$remaining = $manifest | Where-Object { Test-Path $_ }
if ($remaining.Count -eq 0) {
  Write-Output "[PASSED] Manifest Check: 100% legacy files and directories removed."
} else {
  Write-Error "[FAILED] Legacy files still exist: $remaining"
}
'
```
Expected: `[PASSED] Manifest Check: 100% legacy files and directories removed.`

- [ ] **Step 2: Jalankan verifikasi route list**

```bash
php artisan route:list
```
Expected: Menampilkan seluruh rute penelitian tanpa exception.

- [ ] **Step 3: Jalankan verifikasi migrasi dan database seeding**

```bash
php artisan migrate:fresh --seed
```
Expected: Berjalan dengan exit code 0 tanpa galat relasi.

- [ ] **Step 4: Jalankan verifikasi build frontend**

```bash
npm run build
```
Expected: `vite build` selesai sukses menghasilkan assets di `public/build` tanpa error TypeScript.

- [ ] **Step 5: Final commit & push branch**

```bash
git status
git log -n 5 --oneline
```
Expected: Git working tree bersih dan riwayat commit tersusun rapi.
