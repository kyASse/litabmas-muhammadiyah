<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Evaluation;
use App\Models\Funding;
use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\Review;
use App\Models\University;
use Database\Seeders\ProductionDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Uji Kelayakan ProductionDemoSeeder
 * Standar Mutu: Bebas Emoji, Validasi Alur Riset 6 Fase Multi-Kampus.
 */
class ProductionDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProductionDemoSeeder::class);
    }

    public function test_production_demo_seeder_populates_multi_campus_tenancy(): void
    {
        $this->assertGreaterThanOrEqual(3, University::count());
        $this->assertDatabaseHas('universities', ['code' => 'UMY', 'is_active' => true]);
        $this->assertDatabaseHas('universities', ['code' => 'UAD', 'is_active' => true]);
        $this->assertDatabaseHas('universities', ['code' => 'UMS', 'is_active' => true]);
    }

    public function test_production_demo_seeder_populates_all_proposal_statuses(): void
    {
        $this->assertDatabaseHas('proposals', ['status_proposal' => Proposal::STATUS_DRAFT]);
        $this->assertDatabaseHas('proposals', ['status_proposal' => Proposal::STATUS_SUBMITTED]);
        $this->assertDatabaseHas('proposals', ['status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID]);
        $this->assertDatabaseHas('proposals', ['status_proposal' => Proposal::STATUS_LOLOS_DIDANAI]);
    }

    public function test_production_demo_seeder_populates_review_and_contracts_with_70_30_split(): void
    {
        $this->assertDatabaseHas('reviews', ['status_review' => Review::STATUS_IN_PROGRESS]);

        $contractActive = Contract::where('status_kontrak', Contract::STATUS_ACTIVE)->first();
        $this->assertNotNull($contractActive);

        $t1 = Funding::where('id_contract', $contractActive->id)->where('termin_ke', 1)->first();
        $t2 = Funding::where('id_contract', $contractActive->id)->where('termin_ke', 2)->first();

        $this->assertNotNull($t1);
        $this->assertNotNull($t2);
        $this->assertEquals(70, $t1->persentase_dana);
        $this->assertEquals(30, $t2->persentase_dana);
        $this->assertEquals((float) $contractActive->dana_disetujui, (float) ($t1->nominal_dana + $t2->nominal_dana));
    }

    public function test_production_demo_seeder_populates_approved_monev_and_verified_outputs(): void
    {
        $this->assertDatabaseHas('progress_reports', [
            'status_laporan' => ProgressReport::STATUS_APPROVED,
        ]);

        $this->assertDatabaseHas('research_outputs', [
            'tipe_luaran' => ResearchOutput::TIPE_JOURNAL,
            'status_verifikasi' => ResearchOutput::STATUS_VERIFIED,
        ]);

        $this->assertDatabaseHas('research_outputs', [
            'tipe_luaran' => ResearchOutput::TIPE_HKI,
            'status_verifikasi' => ResearchOutput::STATUS_VERIFIED,
        ]);
    }

    public function test_production_demo_seeder_populates_skts_issued_and_force_majeure(): void
    {
        // 1. Proposal Selesai dengan SKTS
        $evalSelesai = Evaluation::where('status_penelitian', Evaluation::STATUS_SELESAI)->first();
        $this->assertNotNull($evalSelesai);
        $this->assertNotEmpty($evalSelesai->nomor_skts);
        $this->assertStringStartsWith('SKTS/UMY/2026/', $evalSelesai->nomor_skts);

        // 2. Proposal Ditutup Force Majeure
        $evalGagal = Evaluation::where('status_penelitian', Evaluation::STATUS_GAGAL)->first();
        $this->assertNotNull($evalGagal);
        $this->assertDatabaseHas('fundings', [
            'status_pencairan' => Funding::STATUS_CANCELLED,
        ]);
    }
}
