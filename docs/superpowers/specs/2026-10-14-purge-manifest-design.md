# Desain Teknis Arsitektur: Purge Manifest & Blueprint Pembersihan (Bab 8 PRD)

- **Dokumen Referensi**: `docs/PRD_Sistem_Penelitian_Terintegrasi_Standalone.md`
- **Tanggal Efektif**: 14 Oktober 2026
- **Status Dokumen**: Disetujui (Approved Baseline)
- **Target Cabang Git**: `refactor/standalone-research-purge` (dicabangkan dari `main`)

---

## 1. Latar Belakang & Tujuan Arsitektural

Sistem Penelitian Terintegrasi Multi-Kampus ditransformasikan menjadi aplikasi web mandiri (*standalone web application*) yang terpisah seutuhnya dari ekosistem lama JurnalMu (modul akreditasi dan pembinaan Dikti) serta modul Submission System OJS (Kelas G).

Tujuan blueprint pembersihan ini adalah mengimplementasikan **Bab 8 (Purge Manifest & Blueprint Pembersihan)** dan kriteria penerimaan **Bab 10.1** dari PRD:
1. Mengeliminasi 100% berkas dan folder warisan (OJS & JurnalMu) dari basis kode.
2. Menyelaraskan rute `routes/web.php` dan komponen navigasi dengan 5 peran penelitian standar.
3. Melakukan konsolidasi skema basis data ke **21 Tabel Bersih** (Bab 6.2 PRD) dengan migrasi kronologis yang rapi.
4. Memastikan aplikasi lolos seluruh gerbang verifikasi teknis: `composer dump-autoload`, `php artisan route:list`, `php artisan migrate:fresh --seed`, dan `npm run build`.

---

## 2. Inventaris Purge Berkas Fisik (Purge Manifest)

### 2.1 Backend Controller Dihapus (`app/Http/Controllers/`)
- **Controller OJS / Submission**:
  - `app/Http/Controllers/SubmissionController.php`
  - `app/Http/Controllers/SubmissionWizardController.php`
  - `app/Http/Controllers/DiscussionController.php`
  - `app/Http/Controllers/CitationController.php`
  - `app/Http/Controllers/PublicJournalController.php`
  - `app/Http/Controllers/ReviewerProfileController.php`
  - `app/Http/Controllers/EmailTemplateController.php`
- **Direktori Modul Dihapus**:
  - `app/Http/Controllers/Editorial/`
  - `app/Http/Controllers/Copyediting/`
  - `app/Http/Controllers/Production/`
  - `app/Http/Controllers/Revision/`
  - `app/Http/Controllers/Dikti/`
  - `app/Http/Controllers/AdminKampus/`
- **Controller Legacy JurnalMu di `app/Http/Controllers/Admin/`**:
  - `AccreditationTemplateController.php`
  - `AssessmentController.php`
  - `BorangIndikatorController.php`
  - `EssayQuestionController.php`
  - `EvaluationCategoryController.php`
  - `EvaluationIndicatorController.php`
  - `EvaluationSubCategoryController.php`
  - `JournalController.php`
  - `PembinaanController.php`
  - `DataMasterController.php`

### 2.2 Backend Model Dihapus (`app/Models/`)
- **Model OJS**:
  - `Submission.php`, `SubmissionFile.php`, `SubmissionContributor.php`, `SubmissionDiscussion.php`, `DiscussionMessage.php`
  - `EditorialAssignment.php`, `EditorialDecision.php`, `CopyeditingTask.php`, `RevisionRound.php`, `ProductionIssue.php`, `PlagiarismCheck.php`, `Galley.php`, `Issue.php`, `Article.php`, `Journal.php`
  - `AuthorProfile.php`, `ReviewAssignment.php`, `ReviewDecision.php`, `ReviewerAssignment.php`, `ReviewForm.php`, `EmailTemplate.php`
- **Model JurnalMu & Warisan**:
  - `AccreditationTemplate.php`, `Agenda.php`, `AssessmentAttachment.php`, `AssessmentIssue.php`, `AssessmentJournalMetadata.php`, `AssessmentNote.php`, `AssessmentResponse.php`
  - `EssayQuestion.php`, `EvaluationCategory.php`, `EvaluationIndicator.php`, `EvaluationSubCategory.php`, `JournalAssessment.php`, `JournalReassignment.php`
  - `Pembinaan.php`, `PembinaanRegistration.php`, `PembinaanRegistrationAttachment.php`, `PembinaanReview.php`, `ScientificField.php`
- **Model Redundan Non-Standar**:
  - `Announcement.php`, `SkemaPendanaan.php` (digantikan `ResearchSchema.php`), `SystemLog.php` (digantikan `ActivityLog.php`), `UserRole.php` (digantikan pivot `role_user`).

### 2.3 Frontend Pages & Komponen Dihapus (`resources/js/`)
- **Direktori Halaman**:
  - `resources/js/pages/Submission/`
  - `resources/js/pages/Editorial/`, `Copyediting/`, `Production/`, `Revision/`, `Discussion/`, `Journals/`, `Public/`, `Browse/`, `Dikti/`, `AdminKampus/`
- **Halaman Mandiri Legacy**:
  - `resources/js/pages/Resources.tsx`, `resources/js/pages/Support.tsx`
- **Komponen Spesifik OJS**:
  - `resources/js/components/WizardProgressBar.tsx`, `KeywordInput.tsx`, `ContributorForm.tsx`, `SubmissionStatusBadge.tsx`, `SubmissionTimeline.tsx`, `RevokeRoleModal.tsx`, `RoleBadge.tsx`.

---

## 3. Penyelarasan Rute & Navigasi (PRD Bab 4 & Bab 7)

### 3.1 Penataan Rute (`routes/web.php`)
File rute dibersihkan dari 1.128 baris warisan dan disusun menjadi blok terstruktur:
1. **Public File Serving**: Streaming `/storage/{path}` untuk keamanan penyimpanan file berkas riset di lingkungan dev Windows & produksi.
2. **Autentikasi & Profil**: Rute login, register, logout, profile bawaan Laravel Breeze/Inertia.
3. **Landing & Redirect**: Rute `/` dengan redirect cerdas ke dashboard masing-masing peran.
4. **Grup Peran Peneliti (`role:Peneliti`)**:
   - `GET /proposals`, `GET /proposals/create`, `POST /proposals`, `GET /proposals/{id}`, `GET /proposals/{id}/edit`, `PUT /proposals/{id}`, `DELETE /proposals/{id}`
   - `POST /documents/upload`
   - `GET /progress`, `POST /progress`
   - `GET /outputs`, `POST /outputs`
   - `GET /evaluations/my-final-report`
5. **Grup Peran Reviewer (`role:Reviewer`)**:
   - `GET /reviewer/dashboard`
   - `GET /reviewer/proposals/{id}`, `POST /reviewer/proposals/{id}/assessment`
   - `POST /reviewer/monev/{id}`
   - `POST /reviewer/evaluations/{id}`
6. **Grup Peran Admin Keuangan (`role:Admin Keuangan`)**:
   - `GET /finance/contracts`, `POST /finance/contracts`
   - `GET /finance/fundings`, `POST /finance/fundings/{id}/disburse`
   - `GET /finance/reports`
7. **Grup Peran Admin Kampus / LPPM (`role:Admin Kampus`)**:
   - `GET /admin/schemas`, `POST /admin/schemas`
   - `GET /admin/proposals`, `POST /admin/proposals/{id}/verify`, `POST /admin/assign`
   - `GET /admin/monev`
   - `POST /admin/output/{id}/verify`
   - `POST /admin/evaluations/{id}/certify`
8. **Grup Peran Super Admin (`role:Super Admin`)**:
   - `GET /admin/universities`
   - `GET /admin/users`
   - `GET /admin/logs`
   - `GET /admin/settings`

### 3.2 Penyelarasan Navigasi Antarmuka (`resources/js/components/app-sidebar.tsx`)
- Tautan mati (`support`, `resources`, `admin.data-master.*`, `admin.borang-indikator.*`, `admin.assessments.summary`, menu OJS) dibuang seutuhnya.
- Item navigasi sidebar disesuaikan per peran pengguna aktif dengan ikon Lucide React yang konsisten dan bebas emoji.
- Penyesuaian `resources/js/types/index.d.ts` dan konstanta peran di `resources/js/constants/roles.ts`.

---

## 4. Konsolidasi Basis Data (21 Tabel Bersih & Seeder)

### 4.1 Entitas 21 Tabel Bersih (PRD Bab 6.2)
1. `universities` (Pusat isolasi tenant multi-institusi)
2. `roles` (5 peran standar penelitian)
3. `users` (dengan atribut `university_id`, `role_id`, `nidn`, `phone`, `faculty`, `study_program`)
4. `role_user` (Tabel pivot user-role)
5. `activity_logs` (Audit trail sistem)
6. `notifications` (Notifikasi sistem dan pengumuman)
7. `research_schemas` (Skema hibah penelitian)
8. `proposals` (Usulan riset)
9. `proposal_documents` (Berkas dokumen pendukung riset)
10. `assessment_criteria` (Rubrik kriteria penilaian substansi)
11. `reviews` (Penilaian proposal oleh reviewer)
12. `contracts` (Kontrak hibah riset yang disetujui)
13. `fundings` (Termin pencairan dan bukti transfer)
14. `monev_schedules` (Jadwal periode pelaksanaan Monev)
15. `progress_reports` (Laporan kemajuan dan logbook riset)
16. `research_outputs` (Tabel induk pelaporan luaran riset)
17. `journal_outputs` (Detail luaran jurnal & indeksasi)
18. `book_outputs` (Detail luaran buku, penerbit, ISBN)
19. `hki_outputs` (Detail sertifikat HKI & paten)
20. `product_outputs` (Detail prototipe/produk & TKT 1-9)
21. `evaluations` (Evaluasi akhir, penutupan kontrak, & penerbitan SKTS)
*Serta tabel infrastruktur Laravel:* `sessions`, `cache`, `password_reset_tokens`, `failed_jobs`, `jobs`.

### 4.2 Strategi Migrasi & Seeder
- Menghapus tumpukan >100 migrasi lama di `database/migrations/` dan menggantinya dengan berkas migrasi kronologis yang rapi dan konsisten sesuai 21 tabel bersih di atas.
- Mengonfigurasi `database/seeders/DatabaseSeeder.php` untuk memanggil seeder inti:
  - `RoleSeeder`: Menjamin keberadaan 5 role (`Super Admin`, `Admin Kampus`, `Admin Keuangan`, `Reviewer`, `Peneliti`).
  - `UniversitySeeder`: Menyediakan data tenant kampus awal.
  - `UserSeeder`: Menyediakan akun pengujian untuk masing-masing peran yang terikat pada kampus tertentu.
  - `AssessmentCriteriaSeeder`: Kriteria rubrik penilaian substansi standar.

---

## 5. Pembersihan Residu Dependensi (Residual Cleanup)

1. **Model `User.php`**:
   - Membuang method relasi warisan: `submissions()`, `editorialAssignments()`, `journals()`, `pembinaanRegistrations()`, `scientificField()`.
   - Menambahkan dan mempertahankan relasi riset: `university()`, `roles()`, `proposals()`, `reviews()`, `evaluations()`.
   - Menggunakan helper `hasRole()` dan `hasAnyRole()` yang kompatibel dengan kolom `role_id` legacy dan tabel pivot `role_user`.
2. **Model `University.php`**:
   - Membuang relasi `journals()` dan `scientificFields()`.
   - Menyelaraskan relasi tenant: `users()`, `researchSchemas()`, `proposals()`, `contracts()`, `monevSchedules()`.
3. **Autoloader & Cache**:
   - Menjalankan `php artisan optimize:clear` dan `composer dump-autoload` untuk menghapus class mapping lama dari composer.

---

## 6. Kriteria Penerimaan & Verifikasi Mutlak (Acceptance Gate)

Implementasi dinyatakan berhasil dan selesai jika memenuhi 4 kriteria tanpa error:
1. **Manifest File Verification**: 100% berkas dan direktori yang tercantum pada Bab 2 dokumen ini terverifikasi tidak ada lagi di direktori proyek.
2. **Route List Verification**: `php artisan route:list` berhasil dieksekusi tanpa peringatan kelas controller hilang.
3. **Fresh Migration & Seed Verification**: `php artisan migrate:fresh --seed` selesai dengan exit code 0 dan 21 tabel terbentuk sempurna.
4. **Frontend Build Verification**: `npm run build` selesai tanpa galat kompilasi TypeScript atau missing module.
