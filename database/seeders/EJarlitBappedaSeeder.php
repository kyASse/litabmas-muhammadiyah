<?php

namespace Database\Seeders;

use App\Models\AssessmentCriteria;
use App\Models\ResearchSchema;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EJarlitBappedaSeeder extends Seeder
{
    /**
     * Jalankan seeder master data bersih E-Jarlit Bappeda Kota Yogyakarta 2026.
     */
    public function run(): void
    {
        $this->command->info('[INFO] Memulai Seeding Master Data Bersih E-Jarlit Bappeda Kota Yogyakarta 2026...');

        $defaultPassword = Hash::make('password');

        // 1. Master Peran Sistem (5 Peran Sah)
        $this->command->info('[INFO] 1. Menyinkronkan 5 Peran Sah Sistem...');
        $roles = [
            [
                'name' => Role::SUPER_ADMIN,
                'guard_name' => 'web',
                'display_name' => 'Super Administrator Bappeda',
                'description' => 'Memiliki akses penuh ke seluruh modul sistem riset E-Jarlit Bappeda Kota Yogyakarta.',
            ],
            [
                'name' => Role::ADMIN_KEUANGAN,
                'guard_name' => 'web',
                'display_name' => 'Admin Keuangan Bappeda',
                'description' => 'Mengelola standar biaya masukan, review anggaran proposal, verifikasi tagihan, dan pencairan termin hibah.',
            ],
            [
                'name' => Role::ADMIN_KAMPUS,
                'guard_name' => 'web',
                'display_name' => 'Administrator LPPM Kampus',
                'description' => 'Memverifikasi dan memberikan persetujuan awal (pre-screening) usulan riset dosen internal kampus.',
            ],
            [
                'name' => Role::REVIEWER,
                'guard_name' => 'web',
                'display_name' => 'Reviewer Ahli / Independen',
                'description' => 'Menilai kualitas keilmuan dan metodologi usulan riset pada Fase 2 (Substansi) serta evaluasi monev.',
            ],
            [
                'name' => Role::PENELITI,
                'guard_name' => 'web',
                'display_name' => 'Dosen / Peneliti',
                'description' => 'Menyusun usulan proposal, mengunggah laporan kemajuan 4 tahap, berkas presentasi, dokumen tagihan, dan luaran.',
            ],
        ];

        $roleModels = [];
        foreach ($roles as $roleData) {
            $roleModels[$roleData['name']] = Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        // 2. Master Perguruan Tinggi Mitra di Wilayah Kota Yogyakarta (7 Kampus)
        $this->command->info('[INFO] 2. Mendaftarkan 7 Perguruan Tinggi Mitra di Wilayah Kota Yogyakarta...');
        $partnerUniversitiesData = [
            [
                'code' => 'UGM',
                'name' => 'Universitas Gadjah Mada',
                'address' => 'Bulaksumur, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281',
                'contact_email' => 'info@ugm.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'UNY',
                'name' => 'Universitas Negeri Yogyakarta',
                'address' => 'Jl. Colombo No.1, Karang Malang, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281',
                'contact_email' => 'info@uny.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'UAD',
                'name' => 'Universitas Ahmad Dahlan',
                'address' => 'Jl. Kapas No.9, Semaki, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166',
                'contact_email' => 'info@uad.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'UMY',
                'name' => 'Universitas Muhammadiyah Yogyakarta',
                'address' => 'Jl. Brawijaya, Geblagan, Tamantirto, Kec. Kasihan, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55183',
                'contact_email' => 'info@umy.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'UIN',
                'name' => 'UIN Sunan Kalijaga',
                'address' => 'Jl. Laksda Adisucipto, Papringan, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281',
                'contact_email' => 'info@uin-suka.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'UST',
                'name' => 'Universitas Sarjanawiyata Tamansiswa',
                'address' => 'Jl. Batikan No.Taman, Tahunan, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55167',
                'contact_email' => 'info@ustjogja.ac.id',
                'is_active' => true,
            ],
            [
                'code' => 'ISI',
                'name' => 'Institut Seni Indonesia Yogyakarta',
                'address' => 'Jl. Parangtritis No.KM. 6.5, Glondong, Panggungharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188',
                'contact_email' => 'info@isi.ac.id',
                'is_active' => true,
            ],
        ];

        $universities = [];
        foreach ($partnerUniversitiesData as $univData) {
            $universities[$univData['code']] = University::updateOrCreate(
                ['code' => $univData['code']],
                $univData
            );
        }

        // 3. Master Akun Inti E-Jarlit Bappeda Kota Yogyakarta
        $this->command->info('[INFO] 3. Membuat Akun Inti Pengelola E-Jarlit Bappeda...');
        $coreAccounts = [
            [
                'name' => 'Super Admin Bappeda Kota Yogyakarta',
                'email' => 'admin.bappeda@jogjakota.go.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::SUPER_ADMIN]->id,
                'university_id' => null,
                'nidn' => null,
                'phone' => '08112651001',
                'faculty' => 'Bappeda Kota Yogyakarta',
                'study_program' => 'Bidang Riset dan Inovasi Daerah',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Admin Keuangan Bappeda Kota Yogyakarta',
                'email' => 'keuangan.bappeda@jogjakota.go.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KEUANGAN]->id,
                'university_id' => null,
                'nidn' => null,
                'phone' => '08112651002',
                'faculty' => 'Bappeda Kota Yogyakarta',
                'study_program' => 'Subbid Perbendaharaan dan Anggaran Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Prof. Dr. Ir. Wahyudi Siswanto, M.T. (Reviewer Ahli E-Jarlit)',
                'email' => 'reviewer.ejarlit@jogjakota.go.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::REVIEWER]->id,
                'university_id' => null,
                'nidn' => '0015086801',
                'phone' => '08112651003',
                'faculty' => 'Dewan Riset Daerah',
                'study_program' => 'Teknologi dan Perencanaan Wilayah',
                'is_active' => true,
                'is_reviewer' => true,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($coreAccounts as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->roles()->syncWithoutDetaching([
                $userData['role_id'] => ['assigned_at' => now()],
            ]);
        }

        // 4. Akun Admin Kampus dan Dosen Peneliti Contoh untuk 7 Universitas Mitra
        $this->command->info('[INFO] 4. Membuat Akun Admin Kampus dan Dosen Peneliti Contoh per Universitas Mitra...');
        $sampleAccounts = [
            // UGM
            [
                'name' => 'Admin LPPM UGM',
                'email' => 'admin.ugm@ugm.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UGM']->id,
                'phone' => '08120001001',
                'faculty' => 'LPPM',
                'study_program' => 'Pengelolaan Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Hendra Wijaya, M.Eng.',
                'email' => 'dosen.ugm@ugm.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UGM']->id,
                'nidn' => '0515088201',
                'phone' => '08120001002',
                'faculty' => 'Fakultas Teknik',
                'study_program' => 'Teknik Sipil dan Lingkungan',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // UNY
            [
                'name' => 'Admin LPPM UNY',
                'email' => 'admin.uny@uny.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UNY']->id,
                'phone' => '08120002001',
                'faculty' => 'LPPM',
                'study_program' => 'Manajemen Publikasi',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Prof. Dr. Nurhadi, M.Pd.',
                'email' => 'dosen.uny@uny.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UNY']->id,
                'nidn' => '0522047901',
                'phone' => '08120002002',
                'faculty' => 'Fakultas Ilmu Pendidikan',
                'study_program' => 'Kurikulum dan Teknologi Pendidikan',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // UAD
            [
                'name' => 'Admin LPPM UAD',
                'email' => 'admin.uad@uad.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UAD']->id,
                'phone' => '08120003001',
                'faculty' => 'LPPM',
                'study_program' => 'Manajemen Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Andi Prasetyo, M.T.',
                'email' => 'dosen.uad@uad.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UAD']->id,
                'nidn' => '0501018501',
                'phone' => '08120003002',
                'faculty' => 'Teknologi Industri',
                'study_program' => 'Informatika',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // UMY
            [
                'name' => 'Admin LPPM UMY',
                'email' => 'admin.umy@umy.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UMY']->id,
                'phone' => '08120004001',
                'faculty' => 'LPPM',
                'study_program' => 'Manajemen Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Tri Wahyuni, M.Si.',
                'email' => 'dosen.umy@umy.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UMY']->id,
                'nidn' => '0601018502',
                'phone' => '08120004002',
                'faculty' => 'Ilmu Sosial dan Politik',
                'study_program' => 'Ilmu Pemerintahan',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // UIN Sunan Kalijaga
            [
                'name' => 'Admin LP2M UIN Sunan Kalijaga',
                'email' => 'admin.uin@uin-suka.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UIN']->id,
                'phone' => '08120005001',
                'faculty' => 'LP2M',
                'study_program' => 'Pengelolaan Pengabdian & Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Ahmad Fauzi, M.Ag.',
                'email' => 'dosen.uin@uin-suka.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UIN']->id,
                'nidn' => '2015098301',
                'phone' => '08120005002',
                'faculty' => 'Sains dan Teknologi',
                'study_program' => 'Teknik Informatika',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // UST
            [
                'name' => 'Admin LP3M UST',
                'email' => 'admin.ust@ustjogja.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['UST']->id,
                'phone' => '08120006001',
                'faculty' => 'LP3M',
                'study_program' => 'Publikasi dan Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Sri Rejeki, M.Hum.',
                'email' => 'dosen.ust@ustjogja.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['UST']->id,
                'nidn' => '0514038101',
                'phone' => '08120006002',
                'faculty' => 'Keguruan dan Ilmu Pendidikan',
                'study_program' => 'Pendidikan Bahasa dan Sastra Indonesia',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            // ISI Yogyakarta
            [
                'name' => 'Admin LPPM ISI Yogyakarta',
                'email' => 'admin.isi@isi.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::ADMIN_KAMPUS]->id,
                'university_id' => $universities['ISI']->id,
                'phone' => '08120007001',
                'faculty' => 'LPPM',
                'study_program' => 'Tata Kelola Karya Riset',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Bambang Priyanto, M.Sn.',
                'email' => 'dosen.isi@isi.ac.id',
                'password' => $defaultPassword,
                'role_id' => $roleModels[Role::PENELITI]->id,
                'university_id' => $universities['ISI']->id,
                'nidn' => '0012067701',
                'phone' => '08120007002',
                'faculty' => 'Fakultas Seni Rupa',
                'study_program' => 'Desain Komunikasi Visual',
                'is_active' => true,
                'is_reviewer' => false,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($sampleAccounts as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->roles()->syncWithoutDetaching([
                $userData['role_id'] => ['assigned_at' => now()],
            ]);
        }

        // 5. Master Skema Penelitian Bappeda Kota Yogyakarta TA 2026
        $this->command->info('[INFO] 5. Mendaftarkan Master Skema Penelitian Bappeda Kota Yogyakarta TA 2026...');
        $bappedaSchemas = [
            [
                'nama_skema' => 'Riset Terapan Inovasi Kota Yogyakarta 2026',
                'deskripsi' => 'Skema riset terapan inovatif yang berorientasi pada pemecahan masalah perkotaan, tata kelola lingkungan, transportasi ramah lingkungan, dan digitalisasi layanan publik Kota Yogyakarta.',
                'biaya_maksimal' => 50000000.00,
                'tahun_anggaran' => 2026,
                'tanggal_mulai' => '2026-01-01',
                'tanggal_selesai' => '2026-12-31',
                'is_active' => true,
            ],
            [
                'nama_skema' => 'Riset Kebijakan Strategis Pembangunan Daerah 2026',
                'deskripsi' => 'Skema riset kebijakan strategis untuk perumusan naskah akademik, arah kebijakan tematik daerah, pengentasan kemiskinan perkotaan, dan rekomendasi program prioritas Pemerintah Kota Yogyakarta.',
                'biaya_maksimal' => 75000000.00,
                'tahun_anggaran' => 2026,
                'tanggal_mulai' => '2026-01-01',
                'tanggal_selesai' => '2026-12-31',
                'is_active' => true,
            ],
        ];

        foreach ($universities as $univ) {
            foreach ($bappedaSchemas as $schemaData) {
                ResearchSchema::updateOrCreate(
                    [
                        'university_id' => $univ->id,
                        'nama_skema' => $schemaData['nama_skema'],
                        'tahun_anggaran' => 2026,
                    ],
                    array_merge($schemaData, [
                        'university_id' => $univ->id,
                    ])
                );
            }
        }

        // 6. Master Kriteria Seleksi: Administrasi (Checklist Ya/Tidak) & Substansi (Pilihan Ganda 1-5 Terbobot)
        $this->command->info('[INFO] 6. Mendaftarkan Kriteria Seleksi Administrasi & Substansi E-Jarlit...');

        // 6A. Kriteria Administrasi (Checklist Dinamis Ya/Tidak, Bobot 0)
        $administrasiCriteria = [
            [
                'nama_kriteria' => 'Kesesuaian Format & Sistematika Penulisan Proposal',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
                'bobot' => 0,
                'urutan' => 1,
                'deskripsi' => 'Pemeriksaan kepatuhan sistematika usulan riset, batasan jumlah kata abstrak, format proposal, dan kelengkapan lampiran sesuai panduan E-Jarlit Bappeda 2026.',
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Keabsahan Surat Pengantar/Persetujuan LPPM Kampus',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
                'bobot' => 0,
                'urutan' => 2,
                'deskripsi' => 'Surat pengantar resmi yang ditandatangani oleh pimpinan LPPM/LP2M/LP3M perguruan tinggi mitra di wilayah Kota Yogyakarta disertai stempel resmi institusi.',
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Surat Pernyataan Keaslian dan Bebas Plagiarisme (Bermeterai)',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
                'bobot' => 0,
                'urutan' => 3,
                'deskripsi' => 'Surat pernyataan orisinalitas riset bermeterai sah (Rp10.000) yang menyatakan usulan bebas plagiarisme dan tidak sedang didanai oleh sumber pembiayaan lain.',
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Kesesuaian Tema Riset dengan Isu Prioritas Pembangunan Kota Yogyakarta',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_YA_TIDAK,
                'bobot' => 0,
                'urutan' => 4,
                'deskripsi' => 'Relevansi topik penelitian dengan tema prioritas RPJMD dan isu strategis pembangunan Pemerintah Kota Yogyakarta.',
                'is_active' => true,
            ],
        ];

        foreach ($administrasiCriteria as $crit) {
            AssessmentCriteria::updateOrCreate(
                [
                    'nama_kriteria' => $crit['nama_kriteria'],
                    'tahap_seleksi' => AssessmentCriteria::TAHAP_ADMINISTRASI,
                ],
                $crit
            );
        }

        // 6B. Kriteria Substansi (Pilihan Ganda Diskret 1-5 Terbobot, Total Bobot 100%)
        $substansiCriteria = [
            [
                'nama_kriteria' => 'Kebaharuan, Orisinalitas & Nilai Ilmiah',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_SUBSTANSI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_PILIHAN_GANDA,
                'bobot' => 25,
                'urutan' => 1,
                'deskripsi' => 'Keaslian ide riset, novelty terhadap kajian terdahulu, ketajaman rumusan masalah, dan kedalaman tinjauan pustaka jurnal internasional/nasional terkini.',
                'pilihan_skor' => [
                    1 => 'Sangat Kurang - Tidak ada unsur kebaharuan ilmiah',
                    2 => 'Kurang - Kebaharuan sangat minim dan pengulangan ide lama',
                    3 => 'Cukup - Terdapat kebaharuan namun kajian pustaka terbatas',
                    4 => 'Baik - Memiliki kebaharuan jelas dan didukung pustaka mutakhir',
                    5 => 'Sangat Baik - Orisinalitas tinggi dan nilai terobosan ilmiah luar biasa',
                ],
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Metodologi Penelitian & Ketepatan Instrumen Analisis',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_SUBSTANSI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_PILIHAN_GANDA,
                'bobot' => 30,
                'urutan' => 2,
                'deskripsi' => 'Kesesuaian desain metodologi, kejelasan teknik sampling, keabsahan instrumen pengumpulan data, dan ketepatan metode analisis statistik/kualitatif.',
                'pilihan_skor' => [
                    1 => 'Sangat Kurang - Metodologi tidak relevan atau keliru',
                    2 => 'Kurang - Metodologi tidak terstruktur dan instrumen lemah',
                    3 => 'Cukup - Metode cukup standar namun analisis kurang mendalam',
                    4 => 'Baik - Rancangan metode tepat dan instrumen pengujian valid',
                    5 => 'Sangat Baik - Desain metode sangat komprehensif, presisi, dan teruji',
                ],
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Kemanfaatan Hasil bagi Pemerintah Kota Yogyakarta & Masyarakat',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_SUBSTANSI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_PILIHAN_GANDA,
                'bobot' => 25,
                'urutan' => 3,
                'deskripsi' => 'Dampak aplikatif riset untuk rekomendasi kebijakan Pemkot Yogyakarta, pemecahan masalah perkotaan, dan kemanfaatan nyata bagi masyarakat luas.',
                'pilihan_skor' => [
                    1 => 'Sangat Kurang - Tidak memiliki dampak relevan bagi Kota Yogyakarta',
                    2 => 'Kurang - Kemanfaatan sangat sempit dan teoritis semata',
                    3 => 'Cukup - Bermanfaat terbatas untuk sektor atau wilayah tertentu',
                    4 => 'Baik - Memberikan masukan rekomendasi nyata bagi Pemkot',
                    5 => 'Sangat Baik - Solutif, aplikatif, dan berdampak strategis tinggi bagi kota',
                ],
                'is_active' => true,
            ],
            [
                'nama_kriteria' => 'Kelayakan Jadwal, Rincian Anggaran (RAB), dan Target Luaran',
                'tahap_seleksi' => AssessmentCriteria::TAHAP_SUBSTANSI,
                'tipe_jawaban' => AssessmentCriteria::TIPE_PILIHAN_GANDA,
                'bobot' => 20,
                'urutan' => 4,
                'deskripsi' => 'Kewajaran alokasi anggaran belanja sesuai Standar Biaya Masukan (SBM), kepatuhan jadwal tahapan 1 tahun, serta ketercapaian target luaran wajib dan tambahan.',
                'pilihan_skor' => [
                    1 => 'Sangat Kurang - RAB tidak wajar dan jadwal tidak realistis',
                    2 => 'Kurang - Alokasi biaya boros dan target luaran meragukan',
                    3 => 'Cukup - Biaya dan jadwal pelaksanaan cukup memadai',
                    4 => 'Baik - RAB terperinci wajar dan luaran jelas terukur',
                    5 => 'Sangat Baik - Efisiensi anggaran optimal, jadwal presisi, dan luaran terjamin',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($substansiCriteria as $crit) {
            AssessmentCriteria::updateOrCreate(
                [
                    'nama_kriteria' => $crit['nama_kriteria'],
                    'tahap_seleksi' => AssessmentCriteria::TAHAP_SUBSTANSI,
                ],
                $crit
            );
        }

        $this->command->info('[SUKSES] Seluruh Master Data Bersih E-Jarlit Bappeda Kota Yogyakarta 2026 berhasil disemai.');
    }
}
