<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Evaluation;
use App\Models\Funding;
use App\Models\HkiOutput;
use App\Models\JournalOutput;
use App\Models\MonevSchedule;
use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Models\ProposalMember;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\Review;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * ProductionDemoSeeder
 *
 * Menginjeksi skenario data penelitian multi-kampus komprehensif
 * untuk demonstrasi alur hidup riset lengkap (Fase 1 sampai Fase 6)
 * dan seluruh kasus batas kritis per 20 Oktober 2026.
 *
 * Sesuai Invarian Proyek:
 * - 100% Bebas Emoji (Zero Emoji Invariant).
 * - Multi-tenancy isolation (UMY, UAD, UMS).
 * - 21 Tabel Domain Bersih.
 */
class ProductionDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('[INFO] Memulai Seeding Data Demonstrasi Produksi (RPL-2026)...');

        DB::transaction(function () {
            // 1. Pastikan Role Dasar Tersedia
            $this->call([
                RoleSeeder::class,
                UniversitySeeder::class,
                AssessmentCriteriaSeeder::class,
            ]);

            $superAdminRole = Role::where('name', Role::SUPER_ADMIN)->first();
            $adminKampusRole = Role::where('name', Role::ADMIN_KAMPUS)->first();
            $adminKeuanganRole = Role::where('name', Role::ADMIN_KEUANGAN)->first();
            $reviewerRole = Role::where('name', Role::REVIEWER)->first();
            $penelitiRole = Role::where('name', Role::PENELITI)->first();

            // 2. Ambil Instansi Universitas
            $umy = University::where('code', 'UMY')->firstOrFail();
            $uad = University::where('code', 'UAD')->firstOrFail();
            $ums = University::where('code', 'UMS')->firstOrFail();

            $defaultPassword = Hash::make('password');

            // 3. Injeksi Pengguna Multi-Kampus & Sinkronisasi Peran
            $usersData = [
                // Global Super Admin
                [
                    'name' => 'Super Administrator Nasional',
                    'email' => 'superadmin@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $superAdminRole->id,
                    'university_id' => null,
                    'is_active' => true,
                ],
                // Kampus UMY
                [
                    'name' => 'Dr. Hendra Wijaya, M.T. (LPPM UMY)',
                    'email' => 'adminkampus.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $adminKampusRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0612017801',
                    'is_active' => true,
                ],
                [
                    'name' => 'Siti Rahmawati, S.E., M.Acc. (Keuangan UMY)',
                    'email' => 'finance.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $adminKeuanganRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0615038002',
                    'is_active' => true,
                ],
                [
                    'name' => 'Prof. Dr. Ir. Bambang Suratno, M.Eng. (Reviewer UMY)',
                    'email' => 'reviewer1.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $reviewerRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0620057501',
                    'is_reviewer' => true,
                    'is_active' => true,
                ],
                [
                    'name' => 'Dr. Ratna Kusuma, M.Sc. (Reviewer UMY 2)',
                    'email' => 'reviewer2.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $reviewerRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0620057502',
                    'is_reviewer' => true,
                    'is_active' => true,
                ],
                [
                    'name' => 'Dr. Ahmad Fauzi, S.T., M.Eng. (Peneliti Utama UMY)',
                    'email' => 'dosen.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $penelitiRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0601018501',
                    'faculty' => 'Teknik',
                    'study_program' => 'Teknik Elektro',
                    'is_active' => true,
                ],
                [
                    'name' => 'Ir. Maya Safitri, M.Kom. (Anggota Peneliti UMY)',
                    'email' => 'dosen2.umy@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $penelitiRole->id,
                    'university_id' => $umy->id,
                    'nidn' => '0601018502',
                    'faculty' => 'Teknik',
                    'study_program' => 'Teknologi Informasi',
                    'is_active' => true,
                ],
                // Kampus UAD
                [
                    'name' => 'Dr. Irfan Santoso, M.Kom. (LPPM UAD)',
                    'email' => 'adminkampus.uad@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $adminKampusRole->id,
                    'university_id' => $uad->id,
                    'nidn' => '0514028001',
                    'is_active' => true,
                ],
                [
                    'name' => 'Prof. Dr. Nurul Hidayah, M.Pd. (Reviewer UAD)',
                    'email' => 'reviewer.uad@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $reviewerRole->id,
                    'university_id' => $uad->id,
                    'nidn' => '0522037601',
                    'is_reviewer' => true,
                    'is_active' => true,
                ],
                [
                    'name' => 'Dr. Eko Prasetyo, M.Eng. (Peneliti UAD)',
                    'email' => 'dosen.uad@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $penelitiRole->id,
                    'university_id' => $uad->id,
                    'nidn' => '0518068201',
                    'faculty' => 'Farmasi',
                    'study_program' => 'Farmasi Klinis',
                    'is_active' => true,
                ],
                // Kampus UMS
                [
                    'name' => 'Dr. Budi Darmawan, S.Si., M.Sc. (Peneliti UMS)',
                    'email' => 'dosen.ums@litabmas.ac.id',
                    'password' => $defaultPassword,
                    'role_id' => $penelitiRole->id,
                    'university_id' => $ums->id,
                    'nidn' => '0629088401',
                    'faculty' => 'Geografi',
                    'study_program' => 'Sistem Informasi Geografis',
                    'is_active' => true,
                ],
            ];

            $seededUsers = [];
            foreach ($usersData as $ud) {
                $roleId = $ud['role_id'];
                unset($ud['role_id']);
                $user = User::updateOrCreate(
                    ['email' => $ud['email']],
                    array_merge($ud, ['role_id' => $roleId])
                );
                $user->roles()->syncWithoutDetaching([$roleId]);
                $seededUsers[$ud['email']] = $user;
            }

            // 4. Skema Riset Multi-Kampus
            $schemaUmy1 = ResearchSchema::updateOrCreate(
                ['university_id' => $umy->id, 'nama_skema' => 'Penelitian Dosen Pemula UMY 2026'],
                [
                    'deskripsi' => 'Skema kompetitif pembinaan penelitian dosen pemula tingkat universitas.',
                    'biaya_maksimal' => 25000000,
                    'tanggal_mulai' => Carbon::now()->subMonths(6)->toDateString(),
                    'tanggal_selesai' => Carbon::now()->addMonths(6)->toDateString(),
                    'is_active' => true,
                ]
            );

            $schemaUmy2 = ResearchSchema::updateOrCreate(
                ['university_id' => $umy->id, 'nama_skema' => 'Penelitian Terapan Unggulan UMY 2026'],
                [
                    'deskripsi' => 'Skema riset hilirisasi terapan berorientasi paten dan prototipe TRL 5-7.',
                    'biaya_maksimal' => 50000000,
                    'tanggal_mulai' => Carbon::now()->subMonths(8)->toDateString(),
                    'tanggal_selesai' => Carbon::now()->addMonths(4)->toDateString(),
                    'is_active' => true,
                ]
            );

            $schemaUad1 = ResearchSchema::updateOrCreate(
                ['university_id' => $uad->id, 'nama_skema' => 'Hibah Fundamental Farmasi UAD 2026'],
                [
                    'deskripsi' => 'Riset eksplorasi bahan alam obat tradisional dan formulasi sediaan farmasi.',
                    'biaya_maksimal' => 35000000,
                    'tanggal_mulai' => Carbon::now()->subMonths(4)->toDateString(),
                    'tanggal_selesai' => Carbon::now()->addMonths(5)->toDateString(),
                    'is_active' => true,
                ]
            );

            // 5. Jadwal Monev Aktif
            $monevUmy = MonevSchedule::updateOrCreate(
                ['university_id' => $umy->id, 'nama_tahap' => 'Monev Tengah Tahun Hibah Internal UMY 2026'],
                [
                    'tanggal_mulai' => Carbon::now()->subDays(20)->toDateString(),
                    'tanggal_selesai' => Carbon::now()->addDays(20)->toDateString(),
                    'deskripsi' => 'Monitoring ketercapaian logbook 70% dan progress report lapangan.',
                    'is_active' => true,
                ]
            );

            $monevUad = MonevSchedule::updateOrCreate(
                ['university_id' => $uad->id, 'nama_tahap' => 'Monev Kemajuan Riset Semester Ganjil UAD 2026'],
                [
                    'tanggal_mulai' => Carbon::now()->subDays(10)->toDateString(),
                    'tanggal_selesai' => Carbon::now()->addDays(30)->toDateString(),
                    'deskripsi' => 'Evaluasi capaian riset farmasi dan pengeluaran anggaran Termin 1.',
                    'is_active' => true,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 1: PROPOSAL TAHAP DRAF (Draft Stage) - UMY
            // -------------------------------------------------------------
            Proposal::updateOrCreate(
                ['judul_penelitian' => 'Optimasi Algoritma Pengenalan Pola Citra Medis Berbasis Edge Computing'],
                [
                    'university_id' => $umy->id,
                    'id_pengusul' => $seededUsers['dosen.umy@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUmy1->id,
                    'abstrak' => 'Penelitian ini mengembangkan algoritma pengolahan citra medis ringan untuk perangkat embedded edge-AI dengan efisiensi energi tinggi dan latensi rendah.',
                    'latar_belakang' => 'Kebutuhan diagnosis cepat di daerah terpencil menuntut komputasi tepi yang handal.',
                    'biaya_yang_diusulkan' => 22000000,
                    'status_proposal' => Proposal::STATUS_DRAFT,
                    'tanggal_pengajuan' => null,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 2: PROPOSAL TAHAP DIAJUKAN (Submitted Stage) - UMY
            // -------------------------------------------------------------
            $propSubmitted = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Pengembangan Sensor IoT Cerdas untuk Pemantauan Kualitas Air Kolam Budidaya'],
                [
                    'university_id' => $umy->id,
                    'id_pengusul' => $seededUsers['dosen.umy@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUmy1->id,
                    'abstrak' => 'Sistem monitoring kualitas air tambak terpadu dengan sensor pH, DO, suhu, dan transmisi LoRaWan berjarak jangkau hingga 10 kilometer.',
                    'latar_belakang' => 'Petani tambak sering terlambat mendeteksi penurunan kadar oksigen terlarut yang memicu mortalitas ikan massal.',
                    'biaya_yang_diusulkan' => 24500000,
                    'status_proposal' => Proposal::STATUS_SUBMITTED,
                    'tanggal_pengajuan' => Carbon::now()->subDays(5)->toDateString(),
                ]
            );

            ProposalDocument::updateOrCreate(
                ['id_proposal' => $propSubmitted->id, 'nama_file' => 'Proposal_Sensor_IoT_Air.pdf'],
                [
                    'file_path' => 'proposals/demo_proposal_sensor.pdf',
                    'file_size' => 1542000,
                    'tipe_dokumen' => 'Proposal_Utama',
                ]
            );

            ProposalMember::updateOrCreate(
                ['id_proposal' => $propSubmitted->id, 'user_id' => $seededUsers['dosen2.umy@litabmas.ac.id']->id],
                [
                    'peran' => 'Anggota Peneliti (Firmware & Cloud)',
                    'alokasi_jam_per_minggu' => 12,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 3: PROPOSAL LOLOS ADMINISTRASI & SEDANG DINILAI (In Review) - UAD
            // -------------------------------------------------------------
            $propInReview = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Karakterisasi Senyawa Bioaktif Daun Kelor Terenkapsulasi Nanopartikel Eudragit'],
                [
                    'university_id' => $uad->id,
                    'id_pengusul' => $seededUsers['dosen.uad@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUad1->id,
                    'abstrak' => 'Enkapsulasi ekstrak daun kelor menggunakan polimer biokompatibel Eudragit untuk meningkatkan bioavailabilitas antioksidan.',
                    'latar_belakang' => 'Stabilitas senyawa flavonoid rentan terdegradasi pada sistem saluran cerna atas.',
                    'biaya_yang_diusulkan' => 32000000,
                    'status_proposal' => Proposal::STATUS_ADMINISTRASI_VALID,
                    'catatan_administrasi' => 'Lolos seleksi administrasi. Berkas lengkap dan memenuhi standar panduan UAD.',
                    'tanggal_pengajuan' => Carbon::now()->subDays(12)->toDateString(),
                ]
            );

            Review::updateOrCreate(
                ['id_proposal' => $propInReview->id, 'id_reviewer' => $seededUsers['reviewer.uad@litabmas.ac.id']->id],
                [
                    'tanggal_mulai_review' => Carbon::now()->subDays(7)->toDateString(),
                    'tanggal_selesai_review' => Carbon::now()->addDays(7)->toDateString(),
                    'status_review' => Review::STATUS_IN_PROGRESS,
                    'skor_total' => 0,
                    'komponen_penilaian' => null,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 4: KONTRAK TERBIT & TERMIN 1 DICAIRKAN (70%) - UMY
            // -------------------------------------------------------------
            $propContracted = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Fabrikasi Nanokomposit Selulosa Bakteri untuk Membran Desalinasi Air Payau'],
                [
                    'university_id' => $umy->id,
                    'id_pengusul' => $seededUsers['dosen.umy@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUmy2->id,
                    'abstrak' => 'Pemanfaatan limbah cair tahu sebagai media fermentasi selulosa bakteri dengan perlakuan silanisasi untuk desalinasi air tanah pesisir.',
                    'latar_belakang' => 'Krisis air tawar di wilayah pesisir membutuhkan membran filtrasi ramah lingkungan berbiaya rendah.',
                    'biaya_yang_diusulkan' => 45000000,
                    'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
                    'catatan_administrasi' => 'Disetujui rapat pleno LPPM dengan pemotongan anggaran rasional.',
                    'tanggal_pengajuan' => Carbon::now()->subMonths(3)->toDateString(),
                ]
            );

            $contractActive = Contract::updateOrCreate(
                ['id_proposal' => $propContracted->id],
                [
                    'university_id' => $umy->id,
                    'nomor_kontrak' => '048/KNT-LPPM/UMY/2026',
                    'judul_kontrak' => $propContracted->judul_penelitian,
                    'dana_disetujui' => 40000000, // Budget adjustment (40jt dari 45jt usulan)
                    'tanggal_kontrak' => Carbon::now()->subMonths(2)->toDateString(),
                    'file_dokumen_kontrak' => 'contracts/kontrak_048_umy_signed.pdf',
                    'status_kontrak' => Contract::STATUS_ACTIVE,
                ]
            );

            // Termin 1 (70% = 28jt): Disbursed
            Funding::updateOrCreate(
                ['id_contract' => $contractActive->id, 'termin_ke' => 1],
                [
                    'persentase_dana' => 70,
                    'nominal_dana' => 28000000,
                    'tanggal_pencairan' => Carbon::now()->subMonths(1)->subDays(15)->toDateString(),
                    'bukti_transfer_path' => 'transfers/bukti_transfer_termin1_048.pdf',
                    'status_pencairan' => Funding::STATUS_DISBURSED,
                    'catatan_keuangan' => 'Transfer via BSI Giro LPPM UMY Ref: BSI-TRX-8829104',
                ]
            );

            // Termin 2 (30% = 12jt): Pending (Blocked until Monev)
            Funding::updateOrCreate(
                ['id_contract' => $contractActive->id, 'termin_ke' => 2],
                [
                    'persentase_dana' => 30,
                    'nominal_dana' => 12000000,
                    'status_pencairan' => Funding::STATUS_PENDING,
                    'catatan_keuangan' => 'Menunggu pelaksanaan monev dan verifikasi laporan kemajuan',
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 5: MONEV DISETUJUI & SIAP TERMIN 2 (Monev Approved Stage) - UMY
            // -------------------------------------------------------------
            $propMonevApproved = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Desain Konverter Daya Efisiensi Tinggi untuk Kendaraan Listrik Kampus'],
                [
                    'university_id' => $umy->id,
                    'id_pengusul' => $seededUsers['dosen2.umy@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUmy2->id,
                    'abstrak' => 'Implementasi modul SiC MOSFET pada DC-DC boost converter bidirectional guna mencapai efisiensi daya 96.5% pada micro-ev.',
                    'latar_belakang' => 'Efisiensi konversi daya konvensional rendah menyebabkan pemborosan kapasitas baterai lithium.',
                    'biaya_yang_diusulkan' => 38000000,
                    'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
                    'tanggal_pengajuan' => Carbon::now()->subMonths(4)->toDateString(),
                ]
            );

            $contractMonev = Contract::updateOrCreate(
                ['id_proposal' => $propMonevApproved->id],
                [
                    'university_id' => $umy->id,
                    'nomor_kontrak' => '029/KNT-LPPM/UMY/2026',
                    'judul_kontrak' => $propMonevApproved->judul_penelitian,
                    'dana_disetujui' => 35000000,
                    'tanggal_kontrak' => Carbon::now()->subMonths(3)->toDateString(),
                    'file_dokumen_kontrak' => 'contracts/kontrak_029_umy.pdf',
                    'status_kontrak' => Contract::STATUS_ACTIVE,
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractMonev->id, 'termin_ke' => 1],
                [
                    'persentase_dana' => 70,
                    'nominal_dana' => 24500000,
                    'tanggal_pencairan' => Carbon::now()->subMonths(2)->toDateString(),
                    'bukti_transfer_path' => 'transfers/bukti_029_t1.pdf',
                    'status_pencairan' => Funding::STATUS_DISBURSED,
                    'catatan_keuangan' => 'Pencairan Termin 1 70% Berhasil',
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractMonev->id, 'termin_ke' => 2],
                [
                    'persentase_dana' => 30,
                    'nominal_dana' => 10500000,
                    'status_pencairan' => Funding::STATUS_PENDING,
                    'catatan_keuangan' => 'Laporan Monev Disetujui, siap eksekusi pencairan termin 2',
                ]
            );

            ProgressReport::updateOrCreate(
                ['id_proposal' => $propMonevApproved->id],
                [
                    'id_monev_schedule' => $monevUmy->id,
                    'persentase_kemajuan' => 85,
                    'ringkasan_progres' => 'Pengujian laboratorium hardware prototipe konverter telah rampung dengan efisiensi puncak 96.2%. Komponen PCB cetak mandiri teruji stabil.',
                    'catatan_kendala' => 'Komponen induktor toroid impor memerlukan waktu pengiriman 2 minggu.',
                    'file_laporan_kemajuan' => 'progress-reports/laporan_kemajuan_029.pdf',
                    'file_logbook' => 'progress-logbooks/logbook_029.pdf',
                    'skor_monev' => 88.50,
                    'catatan_reviewer_monev' => 'Capaian riset melampaui target jadwal tengah tahun. Dokumen logbook sangat rinci dan dapat dilanjutkan pencairan Termin 2.',
                    'status_laporan' => ProgressReport::STATUS_APPROVED,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 6: RISET SELESAI, LUARAN TERVERIFIKASI & SKTS TERBIT (Completed Stage) - UMY
            // -------------------------------------------------------------
            $propCompleted = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Sintesis Nanopartikel Perak Menggunakan Bioreduktor Ekstrak Kulit Manggis'],
                [
                    'university_id' => $umy->id,
                    'id_pengusul' => $seededUsers['dosen.umy@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUmy1->id,
                    'abstrak' => 'Green synthesis nanopartikel perak (AgNPs) dengan agen pereduksi ramah lingkungan dari limbah kulit manggis sebagai antibakteri resisten antibiotik.',
                    'latar_belakang' => 'Kebutuhan agen antimikroba baru untuk menangani infeksi patogen multi-drug resistant (MDR).',
                    'biaya_yang_diusulkan' => 25000000,
                    'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
                    'tanggal_pengajuan' => Carbon::now()->subMonths(10)->toDateString(),
                ]
            );

            $contractCompleted = Contract::updateOrCreate(
                ['id_proposal' => $propCompleted->id],
                [
                    'university_id' => $umy->id,
                    'nomor_kontrak' => '012/KNT-LPPM/UMY/2026',
                    'judul_kontrak' => $propCompleted->judul_penelitian,
                    'dana_disetujui' => 25000000,
                    'tanggal_kontrak' => Carbon::now()->subMonths(9)->toDateString(),
                    'file_dokumen_kontrak' => 'contracts/kontrak_012_umy_complete.pdf',
                    'status_kontrak' => Contract::STATUS_CLOSED,
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractCompleted->id, 'termin_ke' => 1],
                [
                    'persentase_dana' => 70,
                    'nominal_dana' => 17500000,
                    'tanggal_pencairan' => Carbon::now()->subMonths(8)->toDateString(),
                    'bukti_transfer_path' => 'transfers/bukti_012_t1.pdf',
                    'status_pencairan' => Funding::STATUS_DISBURSED,
                    'catatan_keuangan' => 'Termin 1 Tuntas',
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractCompleted->id, 'termin_ke' => 2],
                [
                    'persentase_dana' => 30,
                    'nominal_dana' => 7500000,
                    'tanggal_pencairan' => Carbon::now()->subMonths(4)->toDateString(),
                    'bukti_transfer_path' => 'transfers/bukti_012_t2.pdf',
                    'status_pencairan' => Funding::STATUS_DISBURSED,
                    'catatan_keuangan' => 'Termin 2 Tuntas 100%',
                ]
            );

            // Luaran Wajib 1: Jurnal Terindeks Scopus (Verified)
            $outJournal = ResearchOutput::updateOrCreate(
                ['id_proposal' => $propCompleted->id, 'tipe_luaran' => ResearchOutput::TIPE_JOURNAL],
                [
                    'target_status' => ResearchOutput::TARGET_WAJIB,
                    'status_verifikasi' => ResearchOutput::STATUS_VERIFIED,
                    'catatan_verifikasi' => 'Artikel terbit pada Journal of Green Nanotechnology (Scopus Q2). DOI tervalidasi.',
                    'tanggal_pelaporan' => Carbon::now()->subMonths(2)->toDateString(),
                ]
            );

            JournalOutput::updateOrCreate(
                ['id_research_output' => $outJournal->id],
                [
                    'nama_jurnal' => 'Journal of Green Materials and Nanotechnology',
                    'judul_artikel' => 'Green Synthesis and Antibacterial Evaluation of Silver Nanoparticles from Mangosteen Pericarp',
                    'issn' => '2345-6789',
                    'indeksasi' => 'Scopus',
                    'status_publikasi' => 'Published',
                    'doi_url' => 'https://doi.org/10.1016/j.jgmn.2026.04.012',
                    'file_artikel_path' => 'outputs/journals/artikel_agnps_2026.pdf',
                ]
            );

            // Luaran Tambahan: Hak Kekayaan Intelektual (Verified)
            $outHki = ResearchOutput::updateOrCreate(
                ['id_proposal' => $propCompleted->id, 'tipe_luaran' => ResearchOutput::TIPE_HKI],
                [
                    'target_status' => ResearchOutput::TARGET_TAMBAHAN,
                    'status_verifikasi' => ResearchOutput::STATUS_VERIFIED,
                    'catatan_verifikasi' => 'Paten sederhana tercatat di DJKI Kemenkumham RI.',
                    'tanggal_pelaporan' => Carbon::now()->subMonths(1)->toDateString(),
                ]
            );

            HkiOutput::updateOrCreate(
                ['id_research_output' => $outHki->id],
                [
                    'judul_ciptaan' => 'Metode Sintesis Nanopartikel Perak Cepat Berbasis Ekstrak Kulit Manggis',
                    'jenis_hki' => 'Paten',
                    'nomor_pendaftaran' => 'S00202604123',
                    'nomor_sertifikat' => 'IDP000098765',
                    'file_sertifikat_path' => 'outputs/hki/sertifikat_paten_s002026.pdf',
                ]
            );

            // Evaluasi Akhir & Terbit SKTS
            Evaluation::updateOrCreate(
                ['id_proposal' => $propCompleted->id],
                [
                    'id_evaluator' => $seededUsers['reviewer1.umy@litabmas.ac.id']->id,
                    'file_laporan_akhir' => 'evaluations/laporan_akhir_012_umy.pdf',
                    'ringkasan_hasil' => 'Penelitian telah memenuhi seluruh kewajiban kontrak hibah 100%. Luaran wajib jurnal terindeks Scopus Q2 telah terbit dan paten sederhana terdaftar.',
                    'persentase_capaian_luaran' => 100,
                    'skor_akhir_substansi' => 94.20,
                    'rekomendasi_kelulusan' => Evaluation::REKOMENDASI_MEMUASKAN,
                    'nomor_skts' => 'SKTS/UMY/2026/'.$propCompleted->id,
                    'file_skts_path' => 'skts/SKTS_UMY_2026_'.$propCompleted->id.'.pdf',
                    'status_penelitian' => Evaluation::STATUS_SELESAI,
                ]
            );

            // -------------------------------------------------------------
            // SKENARIO 7: FORCE MAJEURE DITUTUP (Terminated Stage) - UAD
            // -------------------------------------------------------------
            $propTerminated = Proposal::updateOrCreate(
                ['judul_penelitian' => 'Eksplorasi Etnobotani Tumbuhan Obat di Lereng Gunung Merapi Pasca Erupsi'],
                [
                    'university_id' => $uad->id,
                    'id_pengusul' => $seededUsers['dosen.uad@litabmas.ac.id']->id,
                    'id_skema_pendanaan' => $schemaUad1->id,
                    'abstrak' => 'Survei taksonomi tumbuhan obat tradisional pada zona rawan bencana erupsi vulkanik.',
                    'latar_belakang' => 'Hilangnya biodiversitas flora lokal akibat aliran awan panas Merapi.',
                    'biaya_yang_diusulkan' => 30000000,
                    'status_proposal' => Proposal::STATUS_LOLOS_DIDANAI,
                    'tanggal_pengajuan' => Carbon::now()->subMonths(7)->toDateString(),
                ]
            );

            $contractTerminated = Contract::updateOrCreate(
                ['id_proposal' => $propTerminated->id],
                [
                    'university_id' => $uad->id,
                    'nomor_kontrak' => '009/KNT-LPPM/UAD/2026',
                    'judul_kontrak' => $propTerminated->judul_penelitian,
                    'dana_disetujui' => 28000000,
                    'tanggal_kontrak' => Carbon::now()->subMonths(6)->toDateString(),
                    'file_dokumen_kontrak' => 'contracts/kontrak_009_uad.pdf',
                    'status_kontrak' => Contract::STATUS_CLOSED,
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractTerminated->id, 'termin_ke' => 1],
                [
                    'persentase_dana' => 70,
                    'nominal_dana' => 19600000,
                    'tanggal_pencairan' => Carbon::now()->subMonths(5)->toDateString(),
                    'bukti_transfer_path' => 'transfers/bukti_009_t1.pdf',
                    'status_pencairan' => Funding::STATUS_DISBURSED,
                    'catatan_keuangan' => 'Termin 1 dicairkan sebelum musibah kahar',
                ]
            );

            Funding::updateOrCreate(
                ['id_contract' => $contractTerminated->id, 'termin_ke' => 2],
                [
                    'persentase_dana' => 30,
                    'nominal_dana' => 8400000,
                    'status_pencairan' => Funding::STATUS_CANCELLED,
                    'catatan_keuangan' => 'Dibatalkan akibat terminasi force majeure: Bencana alam tanah longsor merusak plot riset permanen.',
                ]
            );

            Evaluation::updateOrCreate(
                ['id_proposal' => $propTerminated->id],
                [
                    'id_evaluator' => $seededUsers['adminkampus.uad@litabmas.ac.id']->id,
                    'file_laporan_akhir' => 'evaluations/berita_acara_kahar_uad_009.pdf',
                    'ringkasan_hasil' => 'Penelitian ditutup resmi oleh LPPM UAD karena kondisi kahar (Force Majeure). Sisa dana kas telah dikembalikan ke rekening rektorat.',
                    'persentase_capaian_luaran' => 35,
                    'skor_akhir_substansi' => 45.00,
                    'rekomendasi_kelulusan' => Evaluation::REKOMENDASI_TIDAK_LULUS,
                    'status_penelitian' => Evaluation::STATUS_GAGAL,
                ]
            );
        });

        $this->command->info('[SUKSES] ProductionDemoSeeder berhasil menginjeksi seluruh alur riset lengkap 6 fase!');
        $this->command->info('[INFO] Akun Demo Siap Uji (Kata Sandi: password):');
        $this->command->info('       - Super Admin        : superadmin@litabmas.ac.id');
        $this->command->info('       - Admin Kampus UMY   : adminkampus.umy@litabmas.ac.id');
        $this->command->info('       - Admin Keuangan UMY : finance.umy@litabmas.ac.id');
        $this->command->info('       - Reviewer Ahli UMY  : reviewer1.umy@litabmas.ac.id');
        $this->command->info('       - Peneliti Utama UMY : dosen.umy@litabmas.ac.id');
        $this->command->info('       - Admin Kampus UAD   : adminkampus.uad@litabmas.ac.id');
        $this->command->info('       - Peneliti UAD       : dosen.uad@litabmas.ac.id');
    }
}
