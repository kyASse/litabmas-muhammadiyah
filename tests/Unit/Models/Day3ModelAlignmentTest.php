<?php

namespace Tests\Unit\Models;

use App\Models\Contract;
use App\Models\Funding;
use App\Models\MonevSchedule;
use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Day3ModelAlignmentTest extends TestCase
{
    use RefreshDatabase;

    protected University $university;

    protected User $researcher;

    protected ResearchSchema $schema;

    protected Proposal $proposal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::create([
            'name' => 'Universitas Muhammadiyah Surakarta',
            'code' => 'UMS',
        ]);

        $role = Role::firstOrCreate(['name' => Role::USER], ['display_name' => 'Peneliti']);

        $this->researcher = User::create([
            'name' => 'Dr. Ahmad Dahlan',
            'email' => 'ahmad@ums.ac.id',
            'password' => bcrypt('secret123'),
            'role_id' => $role->id,
            'university_id' => $this->university->id,
        ]);

        $this->schema = ResearchSchema::create([
            'university_id' => $this->university->id,
            'nama_skema' => 'Penelitian Dasar 2026',
            'biaya_maksimal' => 50000000,
            'tanggal_mulai' => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
            'is_active' => true,
        ]);

        $this->proposal = Proposal::create([
            'university_id' => $this->university->id,
            'id_pengusul' => $this->researcher->id,
            'id_skema_pendanaan' => $this->schema->id,
            'judul_penelitian' => 'Pengembangan Sistem Cerdas',
            'abstrak' => 'Abstrak riset kecerdasan buatan',
            'biaya_yang_diusulkan' => 45000000,
            'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
        ]);
    }

    public function test_contract_model_creation_and_relations(): void
    {
        $contract = Contract::create([
            'university_id' => $this->university->id,
            'id_proposal' => $this->proposal->id,
            'nomor_kontrak' => 'KON/2026/UMS/001',
            'judul_kontrak' => 'Kontrak Hibah Riset Cerdas',
            'dana_disetujui' => 40000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => Contract::STATUS_DRAFT,
        ]);

        $this->assertInstanceOf(Contract::class, $contract);
        $this->assertEquals('KON/2026/UMS/001', $contract->nomor_kontrak);
        $this->assertEquals('KON/2026/UMS/001', $contract->contract_number);
        $this->assertEquals('Kontrak Hibah Riset Cerdas', $contract->title);
        $this->assertEquals('Draft', $contract->status);
        $this->assertEquals(40000000, (float) $contract->contract_value);

        // Test relations
        $this->assertNotNull($contract->proposal);
        $this->assertEquals($this->proposal->id, $contract->proposal->id);
        $this->assertEquals($contract->id, $this->proposal->contract->id);
        $this->assertNotNull($contract->university);
        $this->assertEquals($this->university->id, $contract->university->id);

        // Test scopes
        $found = Contract::byStatus('draft')->first();
        $this->assertNotNull($found);
        $this->assertEquals($contract->id, $found->id);

        $searched = Contract::search('Riset Cerdas')->first();
        $this->assertNotNull($searched);
        $this->assertEquals($contract->id, $searched->id);
    }

    public function test_funding_model_creation_and_relations(): void
    {
        $contract = Contract::create([
            'university_id' => $this->university->id,
            'id_proposal' => $this->proposal->id,
            'nomor_kontrak' => 'KON/2026/UMS/002',
            'judul_kontrak' => 'Kontrak Pendanaan',
            'dana_disetujui' => 100000000,
            'tanggal_kontrak' => now()->toDateString(),
            'status_kontrak' => Contract::STATUS_ACTIVE,
        ]);

        $funding1 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 1,
            'persentase_dana' => 70,
            'nominal_dana' => 70000000,
            'status_pencairan' => Funding::STATUS_DISBURSED,
            'tanggal_pencairan' => now()->toDateString(),
        ]);

        $funding2 = Funding::create([
            'id_contract' => $contract->id,
            'termin_ke' => 2,
            'persentase_dana' => 30,
            'nominal_dana' => 30000000,
            'status_pencairan' => Funding::STATUS_PENDING,
        ]);

        $this->assertEquals(2, $contract->fundings()->count());
        $this->assertEquals($contract->id, $funding1->contract->id);

        // Test virtual accessors
        $this->assertEquals($contract->id, $funding1->contract_id);
        $this->assertEquals(70000000, (float) $funding1->amount);
        $this->assertEquals(70, $funding1->percentage);
        $this->assertEquals('TRM-001', $funding1->funding_number);

        // Test scopes
        $this->assertEquals(1, Funding::pending()->count());
        $this->assertEquals(1, Funding::disbursed()->count());
        $this->assertEquals(1, Funding::termin(1)->count());
        $this->assertEquals(1, Funding::termin(2)->count());
    }

    public function test_monev_schedule_and_progress_report_relations(): void
    {
        $schedule = MonevSchedule::create([
            'university_id' => $this->university->id,
            'nama_tahap' => 'Monev Tengah Tahun 2026',
            'tanggal_mulai' => now()->subDays(2)->toDateString(),
            'tanggal_selesai' => now()->addDays(5)->toDateString(),
            'deskripsi' => 'Pengumpulan laporan kemajuan 70%',
            'is_active' => true,
        ]);

        $this->assertTrue($schedule->isOpenForSubmission());

        $report = ProgressReport::create([
            'id_proposal' => $this->proposal->id,
            'id_monev_schedule' => $schedule->id,
            'persentase_kemajuan' => 75,
            'ringkasan_progres' => 'Telah menyelesaikan pengumpulan data',
            'catatan_kendala' => 'Tidak ada kendala berarti',
            'file_laporan_kemajuan' => 'monev/laporan_kemajuan_1.pdf',
            'file_logbook' => 'monev/logbook_1.pdf',
            'status_laporan' => ProgressReport::STATUS_SUBMITTED,
        ]);

        // Test relations
        $this->assertEquals($schedule->id, $report->monevSchedule->id);
        $this->assertEquals($this->proposal->id, $report->proposal->id);
        $this->assertEquals(1, $schedule->progressReports()->count());
        $this->assertEquals(1, $this->proposal->progressReports()->count());

        // Test virtual accessors
        $this->assertEquals($this->proposal->id, $report->proposal_id);
        $this->assertEquals(75, $report->progress_percentage);
        $this->assertEquals('Submitted', $report->status);

        // Test scopes
        $this->assertEquals(1, ProgressReport::byStatus('submitted')->count());
        $this->assertEquals(0, ProgressReport::approved()->count());
    }
}
