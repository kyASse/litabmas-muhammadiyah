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
        $this->assertInstanceOf(ResearchOutput::class, $journal->researchOutput);
        $this->assertTrue($proposal->researchOutputs->contains($output));
    }

    public function test_research_output_supports_book_hki_and_product_clusters(): void
    {
        $university = University::factory()->create(['code' => 'UAD']);
        $user = User::factory()->create(['university_id' => $university->id]);
        $schema = ResearchSchema::factory()->create(['university_id' => $university->id]);
        $proposal = Proposal::factory()->create([
            'university_id' => $university->id,
            'id_pengusul' => $user->id,
            'id_skema_pendanaan' => $schema->id,
        ]);

        // Book Output
        $bookOutput = ResearchOutput::create([
            'id_proposal' => $proposal->id,
            'tipe_luaran' => 'Book',
            'target_status' => 'Wajib',
            'status_verifikasi' => 'Draft',
        ]);
        $book = BookOutput::create([
            'id_research_output' => $bookOutput->id,
            'judul_buku' => 'Metodologi Penelitian Terapan',
            'isbn' => '978-602-1234-56-7',
            'penerbit' => 'Muhammadiyah University Press',
            'tahun_terbit' => 2026,
            'jumlah_halaman' => 240,
        ]);
        $this->assertInstanceOf(BookOutput::class, $bookOutput->bookOutput);
        $this->assertEquals('Metodologi Penelitian Terapan', $bookOutput->bookOutput->judul_buku);
        $this->assertInstanceOf(ResearchOutput::class, $book->researchOutput);

        // HKI Output
        $hkiOutput = ResearchOutput::create([
            'id_proposal' => $proposal->id,
            'tipe_luaran' => 'Hki',
            'target_status' => 'Tambahan',
            'status_verifikasi' => 'Draft',
        ]);
        $hki = HkiOutput::create([
            'id_research_output' => $hkiOutput->id,
            'judul_ciptaan' => 'Sistem Informasi Riset Terintegrasi',
            'jenis_hki' => 'Hak_Cipta',
            'nomor_pendaftaran' => 'EC002026001',
        ]);
        $this->assertInstanceOf(HkiOutput::class, $hkiOutput->hkiOutput);
        $this->assertEquals('Hak_Cipta', $hkiOutput->hkiOutput->jenis_hki);
        $this->assertInstanceOf(ResearchOutput::class, $hki->researchOutput);

        // Product Output
        $productOutput = ResearchOutput::create([
            'id_proposal' => $proposal->id,
            'tipe_luaran' => 'Product',
            'target_status' => 'Tambahan',
            'status_verifikasi' => 'Draft',
        ]);
        $product = ProductOutput::create([
            'id_research_output' => $productOutput->id,
            'nama_produk' => 'Prototipe Alat Sensor Otomatis',
            'deskripsi_produk' => 'Perangkat sensor pendeteksi kelembaban berbasis IoT',
            'tingkat_kesiapan_teknologi' => 6,
        ]);
        $this->assertInstanceOf(ProductOutput::class, $productOutput->productOutput);
        $this->assertEquals(6, $productOutput->productOutput->tingkat_kesiapan_teknologi);
        $this->assertInstanceOf(ResearchOutput::class, $product->researchOutput);
    }

    public function test_evaluation_belongs_to_proposal_and_evaluator(): void
    {
        $university = University::factory()->create(['code' => 'UMS']);
        $user = User::factory()->create(['university_id' => $university->id]);
        $evaluator = User::factory()->create(['university_id' => $university->id]);
        $schema = ResearchSchema::factory()->create(['university_id' => $university->id]);
        $proposal = Proposal::factory()->create([
            'university_id' => $university->id,
            'id_pengusul' => $user->id,
            'id_skema_pendanaan' => $schema->id,
        ]);

        $evaluation = Evaluation::create([
            'id_proposal' => $proposal->id,
            'id_evaluator' => $evaluator->id,
            'file_laporan_akhir' => 'evaluations/laporan-akhir.pdf',
            'ringkasan_hasil' => 'Penelitian berhasil mencapai seluruh indikator dengan baik.',
            'persentase_capaian_luaran' => 100,
            'skor_akhir_substansi' => 88.50,
            'rekomendasi_kelulusan' => 'Lulus_Memuaskan',
            'nomor_skts' => 'SKTS/UM/2026/001',
            'file_skts_path' => 'skts/skts-001.pdf',
            'status_penelitian' => 'Selesai',
        ]);

        $this->assertInstanceOf(Proposal::class, $evaluation->proposal);
        $this->assertInstanceOf(User::class, $evaluation->evaluator);
        $this->assertInstanceOf(Evaluation::class, $proposal->fresh()->evaluation);
        $this->assertEquals('Lulus_Memuaskan', $proposal->fresh()->evaluation->rekomendasi_kelulusan);
        $this->assertEquals('SKTS/UM/2026/001', $proposal->fresh()->evaluation->nomor_skts);
    }
}
