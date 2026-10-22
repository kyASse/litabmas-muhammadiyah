# Day 4: Modul 5 (Luaran Riset) & Modul 6 (Evaluasi Akhir, SKTS, & Read-Only Archive) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Module 5 (4 research output clusters with institution-scoped deduplication guard & LPPM verification) and Module 6 (100% final evaluation with verified outputs precondition, unique institutional SKTS certificate with editorial font-serif styling, permanent HTTP 403 Read-Only Archive Lock, and Force Majeure protocol).

**Architecture:** Dual-layer defense with FormRequests, Eloquent models matching the 21 clean tables schema, policies and model traits enforcing the Read-Only Archive Lock, React + Inertia UI adhering to the Hybrid Scholarly Enterprise design system, strict zero-emoji invariant, and dynamic bilingual i18n dictionary.

**Tech Stack:** Laravel 12 (PHP 8.4), Eloquent ORM, Inertia.js v2, React 18, TypeScript, Tailwind CSS, Lucide React, PHPUnit.

**Spec:** `docs/superpowers/specs/2026-10-19-day4-output-skts-archive-design.md`

## Global Constraints

- 100% zero emoji across all source code, comments, validation messages, UI labels, git commits, and SKTS documents.
- Multi-tenancy isolation strictly maintained via `university_id` and `TenantScope`.
- Output Deduplication Guard validates canonical uniqueness (DOI, ISBN, HKI registration number) scoped to the institution (`university_id`).
- Precondition for final evaluation requires at least 1 output marked `Wajib` and all `Wajib` outputs must have status `Verified`.
- Read-Only Archive Lock permanently blocks (HTTP 403) all update and delete mutations on proposals, contracts, fundings, progress reports, and research outputs once SKTS is issued (`status_penelitian = 'Selesai'`).
- All frontend text must be registered in both `resources/js/lang/en.ts` and `resources/js/lang/id.ts`.
- All quality gates must pass: `OutputDeduplicationTest`, `FinalEvaluationPreconditionTest`, and `ReadOnlyArchiveLockTest`.

---

### Task 1: Model Alignment & Class-Table Inheritance (21 Clean Tables)

**Files:**
- Modify: `app/Models/ResearchOutput.php`
- Modify: `app/Models/JournalOutput.php`
- Modify: `app/Models/BookOutput.php`
- Modify: `app/Models/HkiOutput.php`
- Modify: `app/Models/ProductOutput.php`
- Modify: `app/Models/Evaluation.php`
- Modify: `app/Models/Proposal.php`
- Test: `tests/Unit/ResearchOutputModelTest.php`

**Interfaces:**
- Consumes: Clean database migrations (`0001_01_01_000016_create_research_outputs_table.php`, `0001_01_01_000017_create_research_output_details_tables.php`, `0001_01_01_000018_create_evaluations_table.php`)
- Produces: Correct Eloquent 1:1 child relationships (`journalOutput()`, `bookOutput()`, `hkiOutput()`, `productOutput()`, `evaluation()`) and proposal relation (`researchOutputs()`).

- [ ] **Step 1: Write the failing unit test for models and relationships**

Create `tests/Unit/ResearchOutputModelTest.php`:
```php
<?php

namespace Tests\Unit;

use App\Models\BookOutput;
use App\Models\Evaluation;
use App\Models\HkiOutput;
use App\Models\JournalOutput;
use App\Models\ProductOutput;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResearchOutputModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_research_output_belongs_to_proposal_and_has_specific_clusters(): void
    {
        $university = University::factory()->create(['code' => 'UMM']);
        $user = User::factory()->create(['university_id' => $university->id]);
        $schema = ResearchSchema::factory()->create(['university_id' => $university->id]);
        $proposal = Proposal::factory()->create([
            'university_id' => $university->id,
            'id_pengusul' => $user->id,
            'id_skema_pendanaan' => $schema->id,
        ]);

        $output = ResearchOutput::create([
            'id_proposal' => $proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Draft',
        ]);

        $journal = JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Ilmiah Pendidikan',
            'judul_artikel' => 'Peningkatan Mutu Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1234/jip.v1i1.1',
        ]);

        $this->assertInstanceOf(Proposal::class, $output->proposal);
        $this->assertInstanceOf(JournalOutput::class, $output->journalOutput);
        $this->assertEquals('Jurnal Ilmiah Pendidikan', $output->journalOutput->nama_jurnal);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter ResearchOutputModelTest`
Expected: FAIL due to missing or mismatched relation methods and attributes.

- [ ] **Step 3: Update Models to match Clean 21 Tables Schema**

Align `ResearchOutput.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResearchOutput extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'research_outputs';

    protected $fillable = [
        'id_proposal',
        'tipe_luaran',
        'target_status',
        'status_verifikasi',
        'catatan_verifikasi',
        'tanggal_pelaporan',
    ];

    protected $casts = [
        'tanggal_pelaporan' => 'date',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    public function journalOutput(): HasOne
    {
        return $this->hasOne(JournalOutput::class, 'id_research_output');
    }

    public function bookOutput(): HasOne
    {
        return $this->hasOne(BookOutput::class, 'id_research_output');
    }

    public function hkiOutput(): HasOne
    {
        return $this->hasOne(HkiOutput::class, 'id_research_output');
    }

    public function productOutput(): HasOne
    {
        return $this->hasOne(ProductOutput::class, 'id_research_output');
    }
}
```

Align `JournalOutput.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalOutput extends Model
{
    use HasFactory;

    protected $table = 'journal_outputs';

    protected $fillable = [
        'id_research_output',
        'nama_jurnal',
        'judul_artikel',
        'issn',
        'indeksasi',
        'status_publikasi',
        'doi_url',
        'file_artikel_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
```

Align `BookOutput.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookOutput extends Model
{
    use HasFactory;

    protected $table = 'book_outputs';

    protected $fillable = [
        'id_research_output',
        'judul_buku',
        'isbn',
        'penerbit',
        'tahun_terbit',
        'jumlah_halaman',
        'file_cover_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
```

Align `HkiOutput.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HkiOutput extends Model
{
    use HasFactory;

    protected $table = 'hki_outputs';

    protected $fillable = [
        'id_research_output',
        'judul_ciptaan',
        'jenis_hki',
        'nomor_pendaftaran',
        'nomor_sertifikat',
        'file_sertifikat_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
```

Align `ProductOutput.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductOutput extends Model
{
    use HasFactory;

    protected $table = 'product_outputs';

    protected $fillable = [
        'id_research_output',
        'nama_produk',
        'deskripsi_produk',
        'tingkat_kesiapan_teknologi',
        'dokumentasi_produk_path',
    ];

    public function researchOutput(): BelongsTo
    {
        return $this->belongsTo(ResearchOutput::class, 'id_research_output');
    }
}
```

Align `Evaluation.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    use HasFactory;

    protected $table = 'evaluations';

    protected $fillable = [
        'id_proposal',
        'id_evaluator',
        'file_laporan_akhir',
        'ringkasan_hasil',
        'persentase_capaian_luaran',
        'skor_akhir_substansi',
        'rekomendasi_kelulusan',
        'nomor_skts',
        'file_skts_path',
        'status_penelitian',
    ];

    protected $casts = [
        'persentase_capaian_luaran' => 'integer',
        'skor_akhir_substansi' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'id_proposal');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_evaluator');
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter ResearchOutputModelTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Models/ tests/Unit/ResearchOutputModelTest.php
git commit -m "feat(models): align research output and evaluation models to clean 21 tables schema"
```

---

### Task 2: Output Deduplication Guard & Research Output Reporting (Backend)

**Files:**
- Create: `app/Http/Requests/StoreResearchOutputRequest.php`
- Create: `app/Http/Requests/VerifyOutputRequest.php`
- Modify: `app/Http/Controllers/OutputController.php`
- Create: `app/Http/Controllers/Admin/OutputVerifyController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/OutputDeduplicationTest.php`

**Interfaces:**
- Consumes: `ResearchOutput`, `JournalOutput`, `BookOutput`, `HkiOutput`, `ProductOutput`
- Produces: API/endpoints `POST /outputs`, `GET /outputs`, `POST /admin/outputs/{output}/verify`, with canonical normalizations for DOI, ISBN, and HKI registration numbers.

- [ ] **Step 1: Write the failing feature test `tests/Feature/OutputDeduplicationTest.php`**

```php
<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class OutputDeduplicationTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected User $researcher1;
    protected User $researcher2;
    protected Proposal $proposal1;
    protected Proposal $proposal2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::factory()->create(['code' => 'UMM']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);

        $this->researcher1 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);
        $this->researcher2 = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);

        $schema = ResearchSchema::factory()->create(['university_id' => $this->university->id]);

        $this->proposal1 = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher1->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->proposal2 = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher2->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);
    }

    public function test_duplicate_journal_doi_is_rejected_within_same_institution(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('paper.pdf', $pdfContent);

        // Store first journal output
        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'IEEE Transactions on Software Engineering',
            'judul_artikel' => 'Autonomous Coding with Agents',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.001',
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        // Second researcher tries to register the exact same DOI
        $this->actingAs($this->researcher2);
        $file2 = UploadedFile::fake()->createWithContent('paper2.pdf', $pdfContent);

        $response2 = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal2->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'nama_jurnal' => 'Another Journal',
            'judul_artikel' => 'Copying Paper',
            'indeksasi' => 'Scopus',
            'status_publikasi' => 'Published',
            'doi_url' => 'https://doi.org/10.1109/TSE.2026.001',
            'file_dokumen' => $file2,
        ]);

        $response2->assertSessionHasErrors('doi_url');
    }

    public function test_duplicate_book_isbn_is_rejected_within_same_institution(): void
    {
        $this->actingAs($this->researcher1);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('cover.pdf', $pdfContent);

        $response = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal1->id,
            'tipe_luaran' => 'Book',
            'target_status' => 'Wajib',
            'judul_buku' => 'Metodologi Penelitian Terapan',
            'isbn' => '978-602-1234-56-7',
            'penerbit' => 'UMM Press',
            'tahun_terbit' => 2026,
            'jumlah_halaman' => 250,
            'file_dokumen' => $file,
        ]);
        $response->assertSessionHasNoErrors();

        $this->actingAs($this->researcher2);
        $file2 = UploadedFile::fake()->createWithContent('cover2.pdf', $pdfContent);

        // Try registering the same ISBN (with different formatting dashes)
        $response2 = $this->post(route('outputs.store'), [
            'id_proposal' => $this->proposal2->id,
            'tipe_luaran' => 'Book',
            'target_status' => 'Wajib',
            'judul_buku' => 'Buku Serupa',
            'isbn' => '9786021234567',
            'penerbit' => 'Penerbit Lain',
            'tahun_terbit' => 2026,
            'file_dokumen' => $file2,
        ]);

        $response2->assertSessionHasErrors('isbn');
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter OutputDeduplicationTest`
Expected: FAIL because routes and validation rule do not exist yet.

- [ ] **Step 3: Implement `StoreResearchOutputRequest` and `VerifyOutputRequest`**

Create `app/Http/Requests/StoreResearchOutputRequest.php`:
Enforce canonical normalization (DOI lowercased, ISBN stripped of dashes, HKI trimmed) and check for existing records within the same `university_id`. Enforce magic bytes inspection `%PDF-` and 10MB limit.

Create `app/Http/Requests/VerifyOutputRequest.php`:
Validate `status_verifikasi` in `Verified,Rejected`, and `catatan_verifikasi` required if `Rejected`.

- [ ] **Step 4: Implement `OutputController.php` and `Admin/OutputVerifyController.php`**

Implement `OutputController.php`:
- `index()`: lists outputs for proposal / user.
- `store()`: executes database transaction creating `ResearchOutput` and its respective child record (`JournalOutput`, `BookOutput`, `HkiOutput`, or `ProductOutput`).
- `destroy()`: soft-deletes output.

Implement `Admin/OutputVerifyController.php`:
- `index()`: lists outputs requiring verification.
- `verify()`: updates `status_verifikasi` and `catatan_verifikasi`.

Update `routes/web.php` for `outputs.*` and `admin.outputs.*`.

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter OutputDeduplicationTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/Http/Requests/ app/Http/Controllers/ routes/web.php tests/Feature/OutputDeduplicationTest.php
git commit -m "feat(outputs): implement 4 clusters reporting and output deduplication guard"
```

---

### Task 3: Final Evaluation & SKTS Precondition Guard (Backend)

**Files:**
- Create: `app/Http/Requests/StoreFinalEvaluationRequest.php`
- Create: `app/Http/Requests/GenerateSktsRequest.php`
- Create: `app/Http/Controllers/EvaluationController.php`
- Create: `app/Http/Controllers/Admin/SktsController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/FinalEvaluationPreconditionTest.php`

**Interfaces:**
- Consumes: `Proposal`, `ResearchOutput`, `Evaluation`
- Produces: `POST /proposals/{proposal}/final-evaluation` (requires min 1 Wajib output and ALL Wajib outputs `Verified`), `POST /admin/proposals/{proposal}/skts` (generates institutional unique SKTS number).

- [ ] **Step 1: Write the failing feature test `tests/Feature/FinalEvaluationPreconditionTest.php`**

```php
<?php

namespace Tests\Feature;

use App\Models\JournalOutput;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FinalEvaluationPreconditionTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected User $researcher;
    protected User $admin;
    protected Proposal $proposal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::factory()->create(['code' => 'UMM']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);

        $this->researcher = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);
        $this->admin = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        $schema = ResearchSchema::factory()->create(['university_id' => $this->university->id]);

        $this->proposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);
    }

    public function test_final_evaluation_submission_blocked_if_no_wajib_output(): void
    {
        $this->actingAs($this->researcher);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif...',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_final_evaluation_submission_blocked_if_wajib_output_not_verified(): void
    {
        $this->actingAs($this->researcher);

        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Submitted',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif...',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_final_evaluation_submission_succeeds_when_all_wajib_outputs_verified(): void
    {
        $this->actingAs($this->researcher);

        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        JournalOutput::create([
            'id_research_output' => $output->id,
            'nama_jurnal' => 'Jurnal Nasional',
            'judul_artikel' => 'Hasil Riset',
            'indeksasi' => 'Sinta_2',
            'status_publikasi' => 'Accepted',
        ]);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('final_report.pdf', $pdfContent);

        $response = $this->post(route('evaluations.store', $this->proposal), [
            'ringkasan_hasil' => 'Uraian hasil riset yang telah selesai secara komprehensif mencapai target 100 persen.',
            'file_laporan_akhir' => $file,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $this->proposal->id,
            'status_penelitian' => 'Dalam_Evaluasi',
        ]);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter FinalEvaluationPreconditionTest`
Expected: FAIL because routes and controllers are missing.

- [ ] **Step 3: Implement `StoreFinalEvaluationRequest`, `GenerateSktsRequest`, `EvaluationController`, and `Admin/SktsController`**

1. `StoreFinalEvaluationRequest`:
   - Validates PDF file and summary.
   - In `withValidator`, checks:
     - Count of `Wajib` outputs >= 1.
     - Count of `Wajib` outputs where `status_verifikasi != 'Verified'` == 0.
     - If failed, add error: `[BLOKIR] Pengajuan evaluasi akhir diblokir. Seluruh luaran wajib harus telah berstatus Terverifikasi (Verified) oleh LPPM.`
2. `EvaluationController`:
   - `show()`: Displays evaluation status, output list, and upload form.
   - `store()`: Stores final evaluation record in `evaluations` table with status `Dalam_Evaluasi`.
3. `Admin/SktsController`:
   - `evaluate()`: LPPM records final score and recommendation (`Lulus_Memuaskan`, `Lulus_Cukup`, or `Tidak_Lulus`).
   - `generateSkts()`: Generates unique SKTS number: `SKTS/{university_code}/{year}/{proposal_id}`, updates status to `Selesai`.
4. Update `routes/web.php`.

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter FinalEvaluationPreconditionTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Http/Requests/ app/Http/Controllers/ routes/web.php tests/Feature/FinalEvaluationPreconditionTest.php
git commit -m "feat(evaluation): enforce final evaluation precondition guard and skts generator"
```

---

### Task 4: Read-Only Archive Lock & Force Majeure Termination (Backend)

**Files:**
- Create: `app/Models/Traits/EnforcesReadOnlyArchive.php`
- Modify: `app/Models/Proposal.php`
- Modify: `app/Models/Contract.php`
- Modify: `app/Models/Funding.php`
- Modify: `app/Models/ProgressReport.php`
- Modify: `app/Models/ResearchOutput.php`
- Modify: `app/Policies/ProposalPolicy.php`
- Modify: `app/Policies/ContractPolicy.php`
- Modify: `app/Policies/ResearchOutputPolicy.php`
- Modify: `app/Policies/ProgressReportPolicy.php`
- Create: `app/Http/Requests/TerminateResearchRequest.php`
- Modify: `app/Http/Controllers/Admin/SktsController.php`
- Test: `tests/Feature/ReadOnlyArchiveLockTest.php`

**Interfaces:**
- Consumes: `Proposal`, `Evaluation` (`status_penelitian == 'Selesai'`)
- Produces: HTTP 403 Forbidden interceptor on model updating/deleting events and policies; Force Majeure termination method `terminateForceMajeure`.

- [ ] **Step 1: Write the failing feature test `tests/Feature/ReadOnlyArchiveLockTest.php`**

```php
<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Evaluation;
use App\Models\JournalOutput;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadOnlyArchiveLockTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected User $researcher;
    protected User $admin;
    protected Proposal $proposal;
    protected Contract $contract;
    protected Evaluation $evaluation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::factory()->create(['code' => 'UMM']);
        $roleDosen = Role::firstOrCreate(['name' => 'Dosen']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin Kampus']);

        $this->researcher = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleDosen->id,
        ]);
        $this->admin = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $roleAdmin->id,
        ]);

        $schema = ResearchSchema::factory()->create(['university_id' => $this->university->id]);

        $this->proposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $schema->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);

        $this->contract = Contract::factory()->create([
            'university_id' => $this->university->id,
            'id_proposal' => $this->proposal->id,
            'nomor_kontrak' => 'KONTRAK/2026/001',
            'dana_disetujui' => 20000000,
        ]);

        // SKTS issued: status_penelitian is 'Selesai'
        $this->evaluation = Evaluation::create([
            'id_proposal' => $this->proposal->id,
            'id_evaluator' => $this->admin->id,
            'file_laporan_akhir' => 'reports/final.pdf',
            'ringkasan_hasil' => 'Penelitian selesai dengan hasil memuaskan.',
            'persentase_capaian_luaran' => 100,
            'skor_akhir_substansi' => 95.00,
            'rekomendasi_kelulusan' => 'Lulus_Memuaskan',
            'nomor_skts' => 'SKTS/UMM/2026/' . $this->proposal->id,
            'status_penelitian' => 'Selesai',
        ]);
    }

    public function test_updating_proposal_after_skts_issued_is_blocked_with_403(): void
    {
        $this->actingAs($this->researcher);

        $response = $this->put(route('proposals.update', $this->proposal), [
            'judul_penelitian' => 'Judul Baru Setelah SKTS Terbit',
            'abstrak' => 'Percobaan perubahan data yang sudah selesai.',
            'id_skema_pendanaan' => $this->proposal->id_skema_pendanaan,
            'biaya_yang_diusulkan' => 15000000,
        ]);

        $response->assertStatus(403);
    }

    public function test_deleting_research_output_after_skts_issued_is_blocked_with_403(): void
    {
        $output = ResearchOutput::create([
            'id_proposal' => $this->proposal->id,
            'tipe_luaran' => 'Journal',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Verified',
        ]);

        $this->actingAs($this->researcher);

        $response = $this->delete(route('outputs.destroy', $output));
        $response->assertStatus(403);
    }

    public function test_force_majeure_terminates_research_and_cancels_pending_funding(): void
    {
        // Setup a pending proposal with contract & pending termin 2
        $pendingProposal = Proposal::factory()->create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'status_proposal' => 'Lolos_Didanai',
        ]);
        $contract = Contract::factory()->create([
            'university_id' => $this->university->id,
            'id_proposal' => $pendingProposal->id,
            'dana_disetujui' => 10000000,
        ]);
        $funding1 = $contract->fundings()->create([
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => 7000000,
            'status_pencairan' => 'Disbursed',
        ]);
        $funding2 = $contract->fundings()->create([
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => 3000000,
            'status_pencairan' => 'Pending',
        ]);

        $this->actingAs($this->admin);

        $response = $this->post(route('admin.proposals.terminate', $pendingProposal), [
            'alasan_terminasi' => 'Bencana alam banjir bandang merusak fasilitas laboratorium riset.',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('evaluations', [
            'id_proposal' => $pendingProposal->id,
            'status_penelitian' => 'Gagal',
            'rekomendasi_kelulusan' => 'Tidak_Lulus',
        ]);

        $this->assertEquals('Cancelled', $funding2->fresh()->status_pencairan);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter ReadOnlyArchiveLockTest`
Expected: FAIL because trait and policies are not yet locking mutations.

- [ ] **Step 3: Implement `EnforcesReadOnlyArchive` trait and attach to models and policies**

Create `app/Models/Traits/EnforcesReadOnlyArchive.php`:
```php
<?php

namespace App\Models\Traits;

use App\Models\Proposal;

trait EnforcesReadOnlyArchive
{
    public static function bootEnforcesReadOnlyArchive(): void
    {
        static::updating(function ($model) {
            $model->preventMutationIfArchived();
        });

        static::deleting(function ($model) {
            $model->preventMutationIfArchived();
        });
    }

    public function preventMutationIfArchived(): void
    {
        $proposal = $this instanceof Proposal
            ? $this
            : ($this->proposal ?? ($this->contract?->proposal ?? null));

        if ($proposal) {
            $isArchived = $proposal->evaluation && $proposal->evaluation->status_penelitian === 'Selesai';
            if ($isArchived) {
                abort(403, '[TERKUNCI] Data usulan telah berstatus Selesai dan terkunci permanen sebagai Arsip Baca-Saja.');
            }
        }
    }
}
```

Attach trait to `Proposal`, `Contract`, `Funding`, `ProgressReport`, `ResearchOutput`.
Update `ProposalPolicy`, `ContractPolicy`, `ResearchOutputPolicy`, `ProgressReportPolicy` to deny updates and deletions when archived.

Create `TerminateResearchRequest` and implement `terminateForceMajeure` in `Admin/SktsController.php`.

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter ReadOnlyArchiveLockTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Models/ app/Policies/ app/Http/Requests/ app/Http/Controllers/ routes/web.php tests/Feature/ReadOnlyArchiveLockTest.php
git commit -m "feat(security): enforce read-only archive lock and force majeure termination"
```

---

### Task 5: Frontend Modul 5 - Research Output Submission & LPPM Verification

**Files:**
- Create: `resources/js/Pages/Output/Index.tsx`
- Create: `resources/js/Pages/Output/CreateModal.tsx`
- Create: `resources/js/Pages/Admin/Output/Verify.tsx`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`

**Interfaces:**
- Consumes: Output list props, proposal props, verification matrix data
- Produces: Dynamic interactive forms for Journal, Book, HKI, Product; LPPM verification table with modal/split viewer; i18n keys for all output labels.

- [ ] **Step 1: Register all output-related i18n keys in `en.ts` and `id.ts`**

Register keys in `resources/js/lang/en.ts` and `resources/js/lang/id.ts`:
- `output.title`, `output.create`, `output.mandatory`, `output.additional`, `output.journal`, `output.book`, `output.hki`, `output.product`, `output.doi`, `output.isbn`, `output.verify`, `output.verified`, `output.rejected`, `output.status`, `output.actions`, etc.
- 100% zero emoji invariant.

- [ ] **Step 2: Build `resources/js/Pages/Output/CreateModal.tsx`**

Build dynamic modal using `@headlessui/react` or standard Dialog, supporting:
- Cluster switcher tabs (Journal, Book, HKI, Product).
- Cluster-specific inputs (DOI for journal, ISBN for book, Registration No for HKI, TKT 1-9 for product).
- PDF file uploader with drag-and-drop and size checking (<10MB).
- Target status selector (`Wajib` vs `Tambahan`).

- [ ] **Step 3: Build `resources/js/Pages/Output/Index.tsx`**

Build output listing page:
- Summary cards: Total Luaran, Luaran Wajib Terverifikasi, Luaran Tambahan.
- Table listing all reported outputs with badges: `[WAJIB]`, `[TAMBAHAN]`, `[VERIFIED]`, `[SUBMITTED]`, `[REJECTED]`.
- PDF download links and delete action (disabled if locked).

- [ ] **Step 4: Build `resources/js/Pages/Admin/Output/Verify.tsx`**

Build LPPM verification table:
- Filters for university, status (`Submitted`, `Verified`, `Rejected`), and cluster type.
- Document preview button.
- Verification action modal: Approve (`Verified`) or Reject with mandatory notes (`catatan_verifikasi`).

- [ ] **Step 5: Verify frontend TypeScript build**

Run: `npm run build`
Expected: SUCCESS with no typescript errors.

- [ ] **Step 6: Commit**

```bash
git add resources/js/Pages/Output/ resources/js/Pages/Admin/Output/ resources/js/lang/
git commit -m "feat(ui): implement research output submission and lppm verification interface"
```

---

### Task 6: Frontend Modul 6 - Final Evaluation, SKTS Certificate (Editorial Font-Serif), & Read-Only Banner

**Files:**
- Create: `resources/js/Pages/Evaluation/Show.tsx`
- Create: `resources/js/Pages/Evaluation/SktsCertificate.tsx`
- Modify: `resources/js/lang/en.ts`
- Modify: `resources/js/lang/id.ts`

**Interfaces:**
- Consumes: Proposal evaluation data, SKTS metadata, institutional details
- Produces: Final evaluation upload interface with precondition status check; Read-only banner `[ARSIP BACA-SAJA]`; Printable editorial SKTS certificate (`font-serif`, university logo, seal, QR verification).

- [ ] **Step 1: Register all evaluation & SKTS i18n keys in `en.ts` and `id.ts`**

Register keys for:
- `evaluation.title`, `evaluation.final_report`, `evaluation.summary`, `evaluation.score`, `evaluation.recommendation`, `evaluation.skts_number`, `evaluation.archive_banner`, `evaluation.read_only_notice`, `skts.certificate_title`, `skts.grant_decree`, etc.

- [ ] **Step 2: Build `resources/js/Pages/Evaluation/Show.tsx`**

- Prominent status header.
- If `status_penelitian === 'Selesai'`, render a sticky/top banner: `[ARSIP BACA-SAJA] Penelitian ini telah selesai dan diarsipkan secara permanen. Seluruh data terkunci.`
- Checkbox/indicator matrix showing verification status of all `Wajib` outputs.
- Upload form for 100% final report (PDF) with summary textarea.
- Button to view SKTS certificate if issued.

- [ ] **Step 3: Build `resources/js/Pages/Evaluation/SktsCertificate.tsx`**

- Editorial layout with `font-serif` (Merriweather / Georgia).
- Institutional header (University name, LPPM header, address).
- Official decree wording and recipient details (Researcher name, NIDN, Proposal Title, Grant Schema, Year).
- Final grade and predicate badge (`LULUS MEMUASKAN` / `LULUS CUKUP`).
- Monospace tabular SKTS number: `SKTS/{CODE}/{YEAR}/{ID}`.
- Integrity QR Code (SVG/Canvas rendering or verification URL).
- Print CSS styling (`@media print`) and button to trigger `window.print()`.

- [ ] **Step 4: Verify frontend TypeScript build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Evaluation/ resources/js/lang/
git commit -m "feat(ui): implement final evaluation view and editorial skts certificate"
```

---

### Task 7: Full Quality Gate Verification & Code Formatting

**Files:**
- Test files, PHP codebase, Frontend codebase

- [ ] **Step 1: Run all feature and unit tests**

Run:
```bash
php artisan test --filter OutputDeduplicationTest
php artisan test --filter FinalEvaluationPreconditionTest
php artisan test --filter ReadOnlyArchiveLockTest
```
Expected: All tests pass 100%.

- [ ] **Step 2: Run code styling and linting**

Run:
```bash
./vendor/bin/pint
npm run lint --if-present
npm run build
```

- [ ] **Step 3: Commit formatting changes if any**

```bash
git add .
git commit -m "chore: format code with pint and build frontend assets"
```
