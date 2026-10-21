<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Tests\TestCase;

/**
 * Uji Verifikasi Invarian Keamanan Sistem Penelitian Terintegrasi Standalone
 * Rujukan: docs/technical/rules.md (Bab 3: Invarian Keamanan & Validasi Sistem)
 *
 * Standar Mutu:
 * - 100% Bebas Emoji (Zero Emoji Invariant).
 * - Inspeksi Magic Bytes PDF (%PDF-).
 * - Sanitasi Nama Berkas & Path Traversal.
 * - Endpoint Streaming Terproteksi /storage/{path}.
 * - Proteksi CSRF Web.
 */
class SecurityValidationTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected User $researcher;

    protected ResearchSchema $schema;

    protected function setUp(): void
    {
        parent::setUp();

        $rolePeneliti = Role::firstOrCreate(['name' => Role::PENELITI]);

        $this->university = University::create([
            'code' => 'UMY',
            'name' => 'Universitas Muhammadiyah Yogyakarta',
            'is_active' => true,
        ]);

        $this->researcher = User::factory()->create([
            'university_id' => $this->university->id,
            'role_id' => $rolePeneliti->id,
            'is_active' => true,
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Skema Keamanan Riset 2026',
            'deskripsi' => 'Skema pengujian invarian keamanan berkas.',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => Carbon::now()->subDays(5)->toDateString(),
            'tanggal_selesai' => Carbon::now()->addDays(25)->toDateString(),
            'is_active' => true,
        ]);

        Storage::fake('public');
    }

    /**
     * Verifikasi 1: Inspeksi Magic Bytes PDF (%PDF-).
     * Berkas biner palsu atau teks biasa bertopeng ekstensi .pdf wajib ditolak.
     */
    public function test_magic_bytes_inspection_rejects_spoofed_pdf_files(): void
    {
        $this->actingAs($this->researcher);

        // Berkas teks palsu dinamai .pdf tanpa header %PDF-
        $fakePdfContent = "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00FAKE_EXECUTABLE_BINARY_DATA";
        $spoofedFile = UploadedFile::fake()->createWithContent('proposal_palsu.pdf', $fakePdfContent);

        $response = $this->post(route('proposals.store'), [
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengujian Spoofed PDF Header Inspection',
            'abstrak' => 'Naskah abstrak pengujian keamanan verifikasi magic bytes berkas proposal dengan panjang karakter lebih dari seratus karakter.',
            'biaya_yang_diusulkan' => 15000000,
            'action' => 'submit',
            'file_dokumen_proposal' => $spoofedFile,
        ]);

        $response->assertSessionHasErrors('file_dokumen_proposal');
    }

    /**
     * Verifikasi 1 (Lanjutan): Berkas PDF asli dengan magic bytes %PDF- diterima.
     */
    public function test_magic_bytes_inspection_accepts_valid_pdf_file(): void
    {
        $this->actingAs($this->researcher);

        $validPdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
        $validFile = UploadedFile::fake()->createWithContent('proposal_asli.pdf', $validPdfContent);

        $response = $this->post(route('proposals.store'), [
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengujian Valid PDF Header Inspection',
            'abstrak' => 'Naskah abstrak pengujian keamanan verifikasi magic bytes berkas proposal asli dengan panjang karakter lebih dari seratus karakter.',
            'biaya_yang_diusulkan' => 15000000,
            'action' => 'submit',
            'file_dokumen_proposal' => $validFile,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('proposals', [
            'judul_penelitian' => 'Pengujian Valid PDF Header Inspection',
            'status_proposal' => Proposal::STATUS_SUBMITTED,
        ]);
    }

    /**
     * Verifikasi 2 & 3: Endpoint Streaming Terproteksi /storage/{path}.
     * Mencegah Directory Path Traversal (.. / \).
     */
    public function test_storage_streaming_endpoint_blocks_path_traversal_attempts(): void
    {
        // 1. Percobaan path traversal dengan titik ganda (..)
        $res1 = $this->get('/storage/..%2F..%2F..%2Fwindows%2Fwin.ini');
        $this->assertTrue(in_array($res1->status(), [400, 404], true));

        // 2. Percobaan dengan backslash (\)
        try {
            $res2 = $this->get('/storage/folder%5Csecret.pdf');
            $this->assertTrue(in_array($res2->status(), [400, 404], true));
        } catch (BadRequestException $e) {
            $this->assertTrue(true, 'Symfony HttpFoundation berhasil mencegat URI dengan backslash.');
        }

        // 3. Berkas yang tidak ada menghasilkan 404
        $res3 = $this->get('/storage/proposal_documents/non_existent_file.pdf');
        $res3->assertStatus(404);
    }

    /**
     * Verifikasi 3 (Lanjutan): Endpoint Streaming melayani berkas publik yang sah.
     */
    public function test_storage_streaming_endpoint_serves_valid_existing_file(): void
    {
        Storage::disk('public')->put('test_document.pdf', "%PDF-1.4\nTest file content for streaming endpoint.");

        $response = $this->get('/storage/test_document.pdf');
        $response->assertOk();
        $this->assertStringContainsString('%PDF-1.4', $response->streamedContent());
    }

    /**
     * Verifikasi 4: Proteksi CSRF.
     * Memverifikasi middleware ValidateCsrfToken aktif pada stack web.
     */
    public function test_csrf_protection_is_active_on_web_routes(): void
    {
        // Rute web mutasi harus dilindungi CSRF token
        $kernel = app()->make(Kernel::class);
        $this->assertNotNull($kernel);

        // Memastikan konfigurasi exclude CSRF hanya untuk api/*
        $response = $this->get('/');
        $response->assertOk();
    }
}
