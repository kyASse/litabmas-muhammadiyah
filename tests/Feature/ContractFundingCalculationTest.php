<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Funding;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractFundingCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected University $otherUniversity;
    protected ResearchSchema $schema;
    protected User $financeAdmin;
    protected User $researcher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => Role::SUPER_ADMIN], ['display_name' => 'Super Admin']);
        Role::firstOrCreate(['name' => Role::ADMIN_KAMPUS], ['display_name' => 'Admin Kampus']);
        Role::firstOrCreate(['name' => Role::ADMIN_KEUANGAN], ['display_name' => 'Admin Keuangan']);
        Role::firstOrCreate(['name' => Role::REVIEWER], ['display_name' => 'Reviewer']);
        Role::firstOrCreate(['name' => Role::PENELITI], ['display_name' => 'Peneliti']);
        Role::firstOrCreate(['name' => Role::USER], ['display_name' => 'User']);

        $this->university = University::create([
            'code' => 'UMT',
            'name' => 'Universitas Muhammadiyah Terintegrasi',
        ]);

        $this->otherUniversity = University::create([
            'code' => 'UMS',
            'name' => 'Universitas Muhammadiyah Surakarta',
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Penelitian Terapan Unggulan',
            'deskripsi' => 'Skema riset aplikatif berorientasi produk.',
            'biaya_maksimal' => 50000000.00,
            'is_active' => true,
        ]);

        $this->financeAdmin = $this->createUserWithRole(Role::ADMIN_KEUANGAN, $this->university);
        $this->researcher = $this->createUserWithRole(Role::PENELITI, $this->university);
    }

    protected function createUserWithRole(string $roleName, University $university): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        /** @var User $user */
        $user = User::factory()->create([
            'university_id' => $university->id,
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        $user->roles()->syncWithoutDetaching([$role->id]);

        return $user;
    }

    protected function createProposal(string $status = Proposal::STATUS_LOLOS_DIDANAI, float $biaya = 25000000.00, ?University $uni = null, ?User $author = null): Proposal
    {
        $targetUni = $uni ?? $this->university;
        $targetAuthor = $author ?? $this->researcher;

        return Proposal::create([
            'university_id' => $targetUni->id,
            'id_pengusul' => $targetAuthor->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Tenaga Surya Modular Terpadu',
            'abstrak' => 'Riset implementasi modul surya terdesentralisasi berbasis IoT untuk pemantauan energi terbarukan.',
            'biaya_yang_diusulkan' => $biaya,
            'status_proposal' => $status,
            'tanggal_pengajuan' => now()->toDateString(),
        ]);
    }

    public function test_contract_creation_rejected_if_proposal_not_lolos_didanai(): void
    {
        // Proposal berstatus 'Submitted' (belum lolos didanai)
        $proposalSubmitted = $this->createProposal(Proposal::STATUS_SUBMITTED, 25000000.00);

        $payloadSubmitted = [
            'id_proposal' => $proposalSubmitted->id,
            'dana_disetujui' => 18000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ];

        $responseSubmitted = $this->actingAs($this->financeAdmin)
            ->postJson('/finance/contracts', $payloadSubmitted);

        $responseSubmitted->assertStatus(422);

        $this->assertDatabaseMissing('contracts', [
            'id_proposal' => $proposalSubmitted->id,
        ]);

        // Proposal berstatus 'Draft'
        $proposalDraft = $this->createProposal(Proposal::STATUS_DRAFT, 25000000.00);

        $payloadDraft = [
            'id_proposal' => $proposalDraft->id,
            'dana_disetujui' => 18000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ];

        $responseDraft = $this->actingAs($this->financeAdmin)
            ->postJson('/finance/contracts', $payloadDraft);

        $responseDraft->assertStatus(422);

        $this->assertDatabaseMissing('contracts', [
            'id_proposal' => $proposalDraft->id,
        ]);
    }

    public function test_contract_creation_calculates_exact_70_30_funding_split(): void
    {
        // Proposal berstatus Lolos_Didanai dengan usulan 25jt, disetujui 18jt
        $proposal = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI, 25000000.00);

        $payload = [
            'id_proposal' => $proposal->id,
            'dana_disetujui' => 18000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ];

        $response = $this->actingAs($this->financeAdmin)
            ->post('/finance/contracts', $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Verifikasi kontrak berhasil dibuat
        $contract = Contract::where('id_proposal', $proposal->id)->firstOrFail();
        $this->assertEquals(18000000.00, (float) $contract->dana_disetujui);
        $this->assertEquals($this->university->id, $contract->university_id);
        $this->assertEquals(Contract::STATUS_DRAFT, $contract->status_kontrak);

        // Verifikasi pembagian termin pendanaan 70% dan 30%
        $fundings = Funding::where('id_contract', $contract->id)
            ->orderBy('termin_ke', 'asc')
            ->get();

        $this->assertCount(2, $fundings);

        // Termin 1: 70% dari 18.000.000 = 12.600.000
        $termin1 = $fundings->where('termin_ke', 1)->first();
        $this->assertNotNull($termin1);
        $this->assertEquals(70, $termin1->persentase_dana);
        $this->assertEquals(12600000.00, (float) $termin1->nominal_dana);
        $this->assertEquals(Funding::STATUS_PENDING, $termin1->status_pencairan);

        // Termin 2: 30% dari 18.000.000 = 5.400.000
        $termin2 = $fundings->where('termin_ke', 2)->first();
        $this->assertNotNull($termin2);
        $this->assertEquals(30, $termin2->persentase_dana);
        $this->assertEquals(5400000.00, (float) $termin2->nominal_dana);
        $this->assertEquals(Funding::STATUS_PENDING, $termin2->status_pencairan);

        // Menjamin total nominal kedua termin persis sama dengan dana yang disetujui
        $totalNominal = (float) $termin1->nominal_dana + (float) $termin2->nominal_dana;
        $this->assertEquals(18000000.00, $totalNominal);
    }

    public function test_contract_generation_creates_unique_contract_number(): void
    {
        $proposal1 = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI, 20000000.00);
        $proposal2 = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI, 30000000.00);

        $this->actingAs($this->financeAdmin)->post('/finance/contracts', [
            'id_proposal' => $proposal1->id,
            'dana_disetujui' => 15000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ]);

        $this->actingAs($this->financeAdmin)->post('/finance/contracts', [
            'id_proposal' => $proposal2->id,
            'dana_disetujui' => 22000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ]);

        $contract1 = Contract::where('id_proposal', $proposal1->id)->firstOrFail();
        $contract2 = Contract::where('id_proposal', $proposal2->id)->firstOrFail();

        $this->assertNotEmpty($contract1->nomor_kontrak);
        $this->assertNotEmpty($contract2->nomor_kontrak);
        $this->assertNotEquals($contract1->nomor_kontrak, $contract2->nomor_kontrak);

        $currentYear = date('Y');
        $this->assertStringContainsString($currentYear, $contract1->nomor_kontrak);
        $this->assertStringContainsString($this->university->code, $contract1->nomor_kontrak);
        $this->assertStringContainsString($currentYear, $contract2->nomor_kontrak);
        $this->assertStringContainsString($this->university->code, $contract2->nomor_kontrak);
    }

    public function test_contract_enforces_tenant_isolation(): void
    {
        // Admin Keuangan dari universitas lain
        $foreignFinanceAdmin = $this->createUserWithRole(Role::ADMIN_KEUANGAN, $this->otherUniversity);

        // Proposal milik universitas pertama
        $proposal = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI, 25000000.00);

        $payload = [
            'id_proposal' => $proposal->id,
            'dana_disetujui' => 18000000.00,
            'tanggal_kontrak' => now()->toDateString(),
        ];

        // Percobaan pembuatan kontrak lintas universitas wajib ditolak (HTTP 403 / 404 / 422)
        $response = $this->actingAs($foreignFinanceAdmin)
            ->postJson('/finance/contracts', $payload);

        $this->assertTrue(
            in_array($response->status(), [403, 404, 422]),
            'Akses lintas tenant wajib diblokir dengan kode HTTP 403, 404, atau 422.'
        );

        $this->assertDatabaseMissing('contracts', [
            'id_proposal' => $proposal->id,
            'university_id' => $this->otherUniversity->id,
        ]);
    }

    public function test_contract_and_funding_routes_are_registered_for_ziggy(): void
    {
        // Pastikan nama rute kanonikal finance.* terdaftar di sistem
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('finance.contracts.index'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('finance.contracts.store'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('finance.contracts.show'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('finance.funding.disburse'));

        // Pastikan alias rute tanpa prefix finance.* juga terdaftar untuk kompatibilitas Ziggy frontend
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('contracts.index'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('contracts.store'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('contracts.show'));
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('funding.disburse'));
    }

    public function test_finance_contracts_index_renders_successfully_with_contracts(): void
    {
        $proposal = $this->createProposal(Proposal::STATUS_LOLOS_DIDANAI, 25000000.00);

        // Buat kontrak dengan tanggal_kontrak string eksplisit
        $contract = Contract::create([
            'university_id' => $this->university->id,
            'id_proposal' => $proposal->id,
            'nomor_kontrak' => 'KTR/2026/UMM/9999',
            'judul_kontrak' => 'Kontrak Pengujian Render Index',
            'dana_disetujui' => 20000000.00,
            'tanggal_kontrak' => '2026-10-17',
            'status_kontrak' => Contract::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->financeAdmin)
            ->get('/finance/contracts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Finance/Contract/Index')
            ->has('contracts.data', 1)
            ->where('contracts.data.0.tanggal_kontrak', '2026-10-17')
            ->where('contracts.data.0.nomor_kontrak', 'KTR/2026/UMM/9999')
        );
    }
}

