# Cetak Biru Sistem Desain UI/UX: Hybrid Scholarly Enterprise
**Sistem Penelitian Terintegrasi Multi-Kampus (SIM-Penelitian)**

---

## 1. Informasi Dokumen & Identitas Sistem Desain

### 1.1 Metadata Dokumen & Kerangka Acuan

- **Nama Sistem**: Sistem Penelitian Terintegrasi Multi-Kampus (*Multi-Institution Research Management System* / SIM-Penelitian)
- **Versi Desain**: 2.0.0-STANDALONE
- **Status Dokumen**: Disetujui (Approved Baseline)
- **Tanggal Efektif**: 15 Oktober 2026
- **Klasifikasi Desain**: Hybrid Scholarly Enterprise UI/UX Architecture
- **Pustaka Komponen & Utilitas**: Tailwind CSS 4, React 19, TypeScript, Lucide React, Inertia.js 2.0, shadcn/ui
- **Dokumen Referensi Terkait**:
  - [Product Requirement Document (PRD) Standalone](../PRD_Sistem_Penelitian_Terintegrasi_Standalone.md)
  - [Cetak Biru Arsitektur Sistem](./architecture.md)
  - [Kamus Data & Skema Basis Data](./schema.md)
  - [Aturan Bisnis & Penanganan Kasus Batas](./rules.md)

---

### 1.2 Tujuan Dokumen

Dokumen ini merupakan panduan tunggal (*single source of truth*) dalam pengembangan antarmuka pengguna (UI) dan pengalaman pengguna (UX) untuk seluruh modul pada Sistem Penelitian Terintegrasi Standalone. Dokumen ini menetapkan:
1. Prinsip desain "Hybrid Scholarly Enterprise" yang memadukan wibawa tradisi akademik dan efisiensi platform perusahaan modern.
2. Penegakan standar anti-generik (*anti-slop standard*) untuk mengeliminasi kebiasaan desain AI murahan (*AI-generated tells*).
3. Spesifikasi token desain warna (*Cool Slate palette*), tipografi ganda (*dual-personality typography*), dan elevasi mikro.
4. Kewajiban implementasi gerbang pratinjau komponen (*Design System Preview Gate*) sebelum pembuatan antarmuka fitur modul.
5. Cetak biru komposisi halaman untuk seluruh alur 6 fase siklus hidup penelitian.
6. Standar interaktivitas formulir Inertia.js dan penanganan berbagai kondisi sistem (*states & feedback*).

---

## 2. Bab 1: Filosofi Desain "Hybrid Scholarly Enterprise" & Anti-Slop Standard

### 2.1 Konsep Inti "Hybrid Scholarly Enterprise"

Sistem manajemen penelitian universitas memiliki ekologi pengguna yang unik: para dosen dan peneliti senior membutuhkan keheningan intelektual, kedalaman tipografis, dan keterbacaan tinggi saat membaca usulan riset puluhan halaman, sementara operator LPPM dan staf administrasi keuangan menuntut kecepatan kerja, kepadatan data (*information density*), dan kepastian alur transaksi.

Filosofi **Hybrid Scholarly Enterprise** menyelesaikan dialektika tersebut dengan menyatukan dua kepribadian visual:
1. **Dimensi Scholarly (Wibawa Akademik & Intelelektual)**:
   - Diterapkan pada artefak substansi: judul skema hibah, judul proposal penelitian, abstrak riset, kutipan publikasi ilmiah, dan sertifikat Surat Keterangan Tanda Selesai (SKTS).
   - Memanfaatkan tipografi *Serif* berbobot editorial yang anggun, spasi baris rileks untuk teks naratif panjang, serta tata letak dokumen yang mencerminkan martabat institusi perguruan tinggi.
2. **Dimensi Enterprise (Presisi Data & Efisiensi Operasional)**:
   - Diterapkan pada instrumen kendali: navigasi sistem, formulir multi-langkah (*wizards*), tabel matriks data, kartu ringkasan keuangan, tombol aksi, serta badge status.
   - Memanfaatkan palet netral berwibawa (*Cool Slate*), tipografi *Sans-Serif* modern yang jernih, angka monospaced berporos tetap (*tabular numbers*), dan pembatas garis 1px yang tegas.

```
+-------------------------------------------------------------------------------+
|                    HYBRID SCHOLARLY ENTERPRISE ARCHITECTURE                   |
+-------------------------------------------------------------------------------+
|  DIMENSI SCHOLARLY (SUBSTANSI RISET)   |  DIMENSI ENTERPRISE (OPERASIONAL)    |
|  - Font: Newsreader / Merriweather     |  - Font: Plus Jakarta Sans / Inter   |
|  - Objek: Judul Riset, Skema, Abstrak, |  - Objek: Form, Tombol, Sidebar,     |
|    Sitasi Jurnal, Sertifikat SKTS      |    Tabel, Rubrik, Matriks Penilaian  |
|  - Nuansa: Anggun, Formal, Reflektif   |  - Nuansa: Cepat, Padat Data, Presisi|
|  - Spasi: Editorial (Leading-Relaxed)  |  - Spasi: Terstruktur (Leading-Tight)|
+----------------------------------------+--------------------------------------+
|             FONDASI BERSAMA: COOL SLATE PALETTE & WCAG AAA CONTRAST           |
|      Kanvas Slate-50 | Kartu Putih Murni | Border Slate-200 | Navy & Emerald   |
+-------------------------------------------------------------------------------+
```

---

### 2.2 Standar Anti-Slop (Anti-Generic AI Design)

Banyak aplikasi modern yang dibangun oleh perkakas kecerdasan buatan (*AI-generated interfaces*) memperlihatkan gejala desain generik dan tanpa arah (*AI slop*). Sistem Penelitian Terintegrasi Standalone secara mutlak melarang seluruh pola tersebut:

| Ciri Generik AI (AI Slop - DILARANG) | Standar Pengganti Hybrid Scholarly (WAJIB) | Rationale Rekayasa |
|---|---|---|
| **Gradien Mengambang Liar**: Latar belakang ungu/pink pastel mengambang tanpa kaitan brand. | **Kanvas Padat Terstruktur**: Kanvas dasar netral `#F8FAFC` (Slate 50) dengan kartu putih murni `#FFFFFF` berbingkai tegas `#E2E8F0`. | Mengeliminasi distraksi visual dan memfokuskan konsentrasi pada penilaian substansi proposal. |
| **Teks Abu-abu Pudar (Gray-on-gray)**: Label abu-abu di atas latar abu-abu yang melanggar aksesibilitas. | **Kontras Tinggi WCAG AAA**: Teks utama `#0F172A` (Slate 900) dengan rasio kontras 12:1 terhadap kanvas, teks sekunder `#475569`. | Menjamin kenyamanan membaca jangka panjang bagi penilai riset dan peneliti. |
| **Penggunaan Emoji sebagai Ikon**: Menggunakan simbol emoji visual (seperti roket, jempol, tanda silang). | **Ikon Vektor SVG Lucide**: Ikon garis presisi dengan `stroke-width` konsisten (1.5px - 2.0px) dipadukan dengan teks berstruktur `[STATUS]`. | Menghindari inkonsistensi rendering antar-OS dan menjaga wibawa dokumen resmi kenegaraan/kampus. |
| **Headline Rata Tengah 3 Baris**: Hero section kosong dengan teks terpusat tanpa struktur informasi. | **Header Asimetris Berbobot**: Judul rata kiri beralur struktural, disertai breadcrumbs navigasi, metadata skema, dan tombol aksi terarah. | Memberikan konteks kerja langsung tanpa membuang ruang vertikal yang berharga pada layar kerja. |
| **Card-inside-Card Berlebihan**: Penumpukan kartu di dalam kartu yang mengaburkan hierarki visual. | **Diferensiasi Kedalaman Melalui Border & Fill**: Memanfaatkan pembatas 1px dan variasi warna permukaan (`surface-elevated`) daripada nesting kartu. | Mengurangi beban kognitif (*cognitive load*) pada formulir isian riset yang kompleks. |
| **Sudut Sangat Membulat (Bubble UI)**: Kontainer persegi dengan radius ekstrem `rounded-3xl` (24px). | **Radius Fungsional Proporsional**: Kontainer utama dan kartu menggunakan `rounded-lg` (8px), kontrol form `rounded-md` (6px). | Menghadirkan kesan arsitektur antarmuka institusi yang stabil, rapi, dan matang. |
| **Bayangan Hitam Tebal Mengabur**: Drop shadow hitam pekat `shadow-2xl` dengan radius sebaran masif. | **Mikro-Elevasi Natural**: Bayangan mikro halus `shadow-xs` dan `shadow-sm` dengan transparansi alpha 3-5%. | Mempertahankan ketajaman kontur visual tanpa membuat halaman tampak kotor atau berat. |

---

### 2.3 Spesifikasi Fondasi Tema Dark (Deep Academic Midnight Slate Architecture)

Sistem menetapkan konsep visual **Deep Academic Midnight Slate** yang dirancang khusus untuk kenyamanan membaca proposal penelitian berlembar-lembar di malam hari tanpa menimbulkan kelelahan visual (*visual fatigue*). Mode gelap pada SIM-Penelitian bukan sekadar pembalikan warna (*invert*) otomatis atau pemaksaan tema gelap generik, melainkan perancangan ulang hierarki pencahayaan institusional yang bermartabat dan mempertahankan wibawa tradisi akademik (*Scholarly*) serta presisi operasional (*Enterprise*).

Sistem secara ketat menerapkan standar anti-slop pada tema dark untuk mencegah kecenderungan estetika AI yang murahan (*cheap dark mode aesthetic*):

| Karakteristik AI Slop (DILARANG) | Standar Deep Academic Midnight (WAJIB) | Rasional Rekayasa |
|---|---|---|
| **Kanvas Hitam Legam Murni (`#000000`)**: Mengakibatkan mata cepat lelah dan kontras terlalu tajam (*harsh glare*). | **Kanvas Slate-950 (`#020617`) & Kartu Slate-900 (`#0F172A`)**: Kedalaman gelap berbobot abu-abu dingin institusional. | Mengurangi kelelahan mata (*eye strain*) saat penelaah membaca proposal dalam durasi panjang. |
| **Aksen Neon Berpendar Liar**: Border atau tombol dengan pendaran ungu/cyan menyilaukan (*neon glow*). | **Aksen Akademik Terukur**: Deep Navy disesuaikan ke Blue-500 (`#3B82F6`) dan Emerald disesuaikan ke Emerald-500 (`#10B981`) tanpa bayangan neon. | Menjaga martabat dokumen resmi akademik dan integritas platform enterprise. |
| **Badge Silau atau Tak Terbaca**: Badge warna pastel putih di atas latar gelap atau warna gelap pekat tanpa sekat. | **Deep Slate Semi-Transparent Tint**: Kombinasi latar transparan `bg-{color}-950/40`, teks cerah `text-{color}-300`, dan border pembatas 1px `border-{color}-800/60`. | Menghasilkan penanda status yang tegas, rapi, dan memiliki rasio kontras prima. |
| **Bayangan Gelap Berpendar (Colored Drop Shadows)**: Drop shadow warna-warni yang mengaburkan batas elemen. | **Garis Pembatas Presisi 1px**: Pembatas Slate-800 (`#1E293B`) atau Slate-700 (`#334155`) dengan bayangan mikro minimalis. | Mempertahankan batas arsitektur kartu dan formulir tanpa polusi visual. |

---

## 3. Bab 2: Spesifikasi Token Desain & Palet Warna

### 3.1 Token Warna Permukaan & Kanvas (Dynamic Surface Foundation)

Sistem mengadopsi fondasi palet dinamis yang merespons preferensi mode pengguna: **Cool Slate** untuk tema terang (*Light Mode*) dan **Deep Academic Midnight Slate** untuk tema gelap (*Dark Mode*):

| Token Semantik | Light (Hex / Tailwind) | Dark (Hex / Tailwind) | Rasional & Penggunaan |
|---|---|---|---|
| `--surface-base` | `#F8FAFC` (`bg-slate-50`) | `#020617` (`dark:bg-slate-950`) | Kanvas latar belakang utama seluruh viewport aplikasi. |
| `--surface-card` | `#FFFFFF` (`bg-white`) | `#0F172A` (`dark:bg-slate-900`) | Permukaan kartu konten, panel kerja form, tabel data, dan modal. |
| `--surface-elevated` | `#F1F5F9` (`bg-slate-100`) | `#1E293B` (`dark:bg-slate-800`) | Header tabel data, panel filter, popover, dan bilah status sekunder. |
| `--surface-muted` | `#E2E8F0` (`bg-slate-200`) | `#334155` (`dark:bg-slate-700`) | Latar badge netral, placeholder berkas, dan kondisi disabled. |
| `--surface-sidebar` | `#0F172A` (`bg-slate-900`) | `#020617` (`dark:bg-slate-950`) | Latar bilah navigasi utama LPPM (kontras tinggi institusional). |

---

### 3.2 Token Garis Pembatas (Dynamic Borders)

| Token Semantik | Light (Hex / Tailwind) | Dark (Hex / Tailwind) | Rasional & Penggunaan |
|---|---|---|---|
| `--border-subtle` | `#E2E8F0` (`border-slate-200`) | `#1E293B` (`dark:border-slate-800`) | Pembatas standar 1px antar baris tabel, sekat kartu, dan panel. |
| `--border-strong` | `#CBD5E1` (`border-slate-300`) | `#334155` (`dark:border-slate-700`) | Garis batas input form aktif, tab navigasi aktif, dan kartu saat hover. |
| `--border-focus` | `#1E3A8A` (`border-blue-900`) | `#3B82F6` (`dark:border-blue-500`) | Cincin fokus interaksi keyboard (*focus ring*) bersama `ring-2`. |

---

### 3.3 Token Tipografi (Dynamic Text Colors & Contrast)

Sistem memastikan keterbacaan prima dengan penegakan rasio kontras WCAG AAA/AA pada kedua mode:

| Token Semantik | Light (Hex / Tailwind) | Dark (Hex / Tailwind) | Rasio Kontras (Light / Dark) | Penggunaan |
|---|---|---|---|---|
| `--text-primary` | `#0F172A` (`text-slate-900`) | `#F8FAFC` (`dark:text-slate-50`) | 12.0:1 (AAA) / 14.5:1 (AAA) | Judul utama, isi teks bacaan, data penting pada tabel. |
| `--text-secondary` | `#475569` (`text-slate-600`) | `#94A3B8` (`dark:text-slate-400`) | 6.8:1 (AA) / 7.2:1 (AA+) | Label formulir, deskripsi penjelas, breadcrumbs, metadata. |
| `--text-muted` | `#94A3B8` (`text-slate-400`) | `#64748B` (`dark:text-slate-500`) | 3.5:1 (Dekoratif) / 4.8:1 (AA) | Placeholder input form, ikon navigasi tidak aktif. |
| `--text-inverse` | `#FFFFFF` (`text-white`) | `#0F172A` (`dark:text-slate-900`) | 15.0:1 (AAA) / 14.5:1 (AAA) | Teks pada tombol primer brand navy dan badge warna gelap. |

---

### 3.4 Token Identitas Brand Institusi

| Token Semantik | Light (Hex / Tailwind) | Dark (Hex / Tailwind) | Rasional & Penggunaan |
|---|---|---|---|
| `--brand-primary` | `#1E3A8A` (`bg-blue-900` / `text-blue-900`) | `#3B82F6` (`dark:bg-blue-500` / `dark:text-blue-400`) | **Academic Navy / Blue**: Warna jangkar universitas untuk tombol utama, link interaktif, dan brand banner. |
| `--brand-primary-hover` | `#1E40AF` (`hover:bg-blue-800`) | `#60A5FA` (`dark:hover:bg-blue-400`) | Status interaksi hover pada komponen tombol primer. |
| `--brand-primary-light` | `#EFF6FF` (`bg-blue-50`) | `#1E293B` (`dark:bg-slate-800`) | Latar belakang lencana atau baris tabel yang sedang aktif terpilih. |
| `--brand-accent` | `#059669` (`bg-emerald-600` / `text-emerald-600`) | `#10B981` (`dark:bg-emerald-500` / `dark:text-emerald-400`) | **Academic Emerald**: Penanda keberhasilan, status lolos didanai, pencairan dana, dan kelulusan monev. |
| `--brand-accent-hover` | `#047857` (`hover:bg-emerald-700`) | `#34D399` (`dark:hover:bg-emerald-400`) | Status hover aksi sekunder positif (verifikasi, setujui). |
| `--brand-accent-light` | `#ECFDF5` (`bg-emerald-50`) | `#064E3B` (`dark:bg-emerald-950`) | Latar badge status sukses dan kartu evaluasi positif. |

---

### 3.5 Token Keadaan Sistem & Rumus Deep Slate Semi-Transparent Tint

Pada mode terang, status disajikan dengan latar pastel lembut dan teks pekat berbingkai 1px. Pada mode gelap, sistem menerapkan formula khusus **Deep Slate Semi-Transparent Tint**:

`Latar transparan bg-{color}-950/40 + Teks cerah text-{color}-300 + Garis pembatas 1px border-{color}-800/60`

Formula ini mengombinasikan latar belakang gelap transparan beropasitas 40% dari shade 950 (`bg-{color}-950/40`), teks cerah bernilai keterbacaan tinggi dari shade 300 (`text-{color}-300`), dan garis pembatas presisi 1px dari shade 800 beropasitas 60% (`border-{color}-800/60`). Pendekatan ini mencegah kebiasaan buruk tema gelap berupa latar solid pekat tanpa sekat atau warna putih terang menyilaukan.

| Keadaan Sistem | Implementasi Light Mode | Implementasi Dark Mode (Semi-Transparent Tint) | Contoh Status Siklus Riset |
|---|---|---|---|
| **Sukses / Lolos / Verified** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60` | `Lolos_Didanai`, `Disbursed_T2`, `Monev_Approved` |
| **Info / Submitted / Kontrak** | `bg-sky-50 text-sky-700 border-sky-200` | `dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60` | `Submitted`, `Contracted` (`blue-950/40`), `Output_Verified` (`indigo-950/40`) |
| **Warning / Review / Revisi** | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60` | `In_Review`, `Revisi` |
| **Danger / Ditolak / Overdue** | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60` | `Ditolak`, `Terminated` |
| **Neutral / Draft / Arsip** | `bg-slate-100 text-slate-700 border-slate-300` | `dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700` | `Draft`, `Inactive` |
| **Terkunci Monev** | `bg-purple-50 text-purple-700 border-purple-200` | `dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60` | `Monev_Locked` |
| **Pencairan Termin 1** | `bg-teal-50 text-teal-700 border-teal-200` | `dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60` | `Disbursed_T1` |
| **Selesai Resmi SKTS** | `bg-slate-900 text-white border-slate-900` | `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/70` | `Completed_SKTS` |

---

### 3.6 Geometri, Radius, & Elevasi Bayangan

```css
/* Konfigurasi Token Radius Sistem */
--radius-none: 0px;
--radius-sm: 0.25rem;    /* 4px: Tooltip, sub-elemen mikro */
--radius-md: 0.375rem;   /* 6px: Tombol aksi, input field, badge */
--radius-lg: 0.5rem;     /* 8px: Kontainer kartu data, panel form, tabel */
--radius-xl: 0.75rem;    /* 12px: Modal dialog, popover besar */
--radius-full: 9999px;   /* Pil bulat: Avatar civitas, status dot */

/* Konfigurasi Elevasi Bayangan Mikro */
--shadow-xs: 0 1px 2px 0 rgb(15 23 42 / 0.03);
--shadow-sm: 0 1px 3px 0 rgb(15 23 42 / 0.05), 0 1px 2px -1px rgb(15 23 42 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.06);
--shadow-inner: inset 0 2px 4px 0 rgb(15 23 42 / 0.03);
```

> **[PENTING] Larangan Elevasi Tebal**:
> Seluruh antarmuka dilarang menggunakan bayangan berat seperti `shadow-xl`, `shadow-2xl`, atau bayangan berpendar warna-warni (*glow effects*). Elevasi harus mengandalkan kombinasi garis pembatas 1px (`border-slate-200`) dan bayangan mikro `shadow-xs` atau `shadow-sm`.

---

## 4. Bab 3: Disiplin Tipografi Hibrida (Dual-Personality Typography)

### 4.1 Arsitektur Tiga Pilar Font

Untuk menyelaraskan kedalaman literasi akademik dengan kecepatan operasional sistem informasi manajemen, tipografi dibagi secara ketat menjadi 3 keluarga font fungsional:

```
+-------------------------------------------------------------------------------------------------+
|                                 ARSITEKTUR TIPOGRAFI HIBRIDA                                    |
+-------------------------------------------------------------------------------------------------+
| 1. FONT SERIF (EDITORIAL ACADEMIC)  | Newsreader / Merriweather / Source Serif Pro             |
|    Peruntukan:                      | - Judul Skema Hibah Penelitian (H1/H2)                    |
|                                     | - Judul Usulan Riset Dosen pada Detail & Preview          |
|                                     | - Paragraf Abstrak Proposal & Laporan Kemajuan            |
|                                     | - Sitasi Luaran Ilmiah (Jurnal, Buku, HKI)                |
|                                     | - Sertifikat Resmi Surat Keterangan Tanda Selesai (SKTS)  |
+-------------------------------------+-----------------------------------------------------------+
| 2. FONT SANS (OPERATIONAL UI)       | Plus Jakarta Sans / Inter / System UI                     |
|    Peruntukan:                      | - Navigasi Sidebar, Navbar Header, Breadcrumbs            |
|                                     | - Seluruh Label Formulir, Placeholder, & Helper Text      |
|                                     | - Seluruh Tombol Aksi (Button, Dropdown, Menu)            |
|                                     | - Header Kolom Tabel & Lencana Status ([STATUS])          |
|                                     | - Pesan Notifikasi Toast, Dialog Konfirmasi               |
+-------------------------------------+-----------------------------------------------------------+
| 3. FONT MONO TABULAR (DATA METRIC)  | JetBrains Mono / Inter (fitur OpenType: 'tnum')           |
|    Peruntukan:                      | - Nilai Anggaran Penelitian (Format Rupiah IDR)           |
|                                     | - Skor Evaluasi Rubrik Reviewer (0 - 100)                 |
|                                     | - Persentase Capaian Progres Monev (1% - 100%)            |
|                                     | - Nomor Registrasi Kontrak, Kode Registrasi SKTS          |
|                                     | - Nomor Pengenal Digital: DOI, ISBN, Nomor Permohonan HKI |
|                                     | - Tanggal, Waktu, & Durasi Tenggat (Countdown)            |
+-------------------------------------------------------------------------------------------------+
```

---

### 4.2 Skala & Hierarki Tipografi Lengkap

| Hirarki | Font Family | Kelas Tailwind | Ukuran / Line-Height | Weight | Peruntukan Khusus |
|---|---|---|---|---|---|
| **Display 1** | Serif | `font-serif text-3xl tracking-tight` | 30px / 38px (1.25) | Bold (700) | Judul Sertifikat SKTS Resmi, Halaman Utama Laporan Riset. |
| **Heading 1** | Serif | `font-serif text-2xl tracking-tight` | 24px / 32px (1.33) | SemiBold (600) | Judul Usulan Riset pada Halaman Detail & Skema Pendanaan. |
| **Heading 2** | Sans | `font-sans text-xl tracking-normal` | 20px / 28px (1.40) | SemiBold (600) | Judul Bagian Modul, Header Halaman Operasional LPPM. |
| **Heading 3** | Sans | `font-sans text-base tracking-normal` | 16px / 24px (1.50) | SemiBold (600) | Judul Kartu Bento, Sub-seksi Form Wizard, Nama Anggota Tim. |
| **Sub-heading**| Sans | `font-sans text-sm tracking-wide` | 14px / 20px (1.42) | Medium (500) | Kategori Skema, Subjudul Halaman, Nama Institusi Pengusul. |
| **Body Editorial** | Serif | `font-serif text-base leading-relaxed` | 16px / 28px (1.75) | Regular (400) | Abstrak Usulan Riset, Catatan Evaluasi Kualitatif Reviewer. |
| **Body UI** | Sans | `font-sans text-sm leading-normal` | 14px / 20px (1.42) | Regular (400) | Teks Tabel, Deskripsi Form, Isi Pesan Konfirmasi. |
| **Label UI** | Sans | `font-sans text-xs uppercase tracking-wider` | 12px / 16px (1.33) | SemiBold (600) | Label Kolom Data, Label Input Formulir, Kategori Metrik. |
| **Tabular Numbers** | Mono | `font-mono tabular-nums text-sm` | 14px / 20px (1.42) | Medium (500) | Nilai Anggaran Rupiah, Skor Kriteria Rubrik Reviewer. |
| **Tabular Large** | Mono | `font-mono tabular-nums text-2xl` | 24px / 32px (1.33) | Bold (700) | Angka Utama Kartu Metrik Dasbor (Pagu Dana, Total Proposal).|

---

### 4.3 Ketentuan Tipografi Editorial & Pencegahan Pergeseran Tata Letak (Zero CLS)

1. **Batasan Lebar Paragraf Ilmiah**:
   Seluruh teks abstrak dan ulasan narasi panjang wajib menggunakan kelas pembatas lebar `max-w-prose` (sekitar 65-75 karakter per baris) untuk mempertahankan ritme membaca optimal tanpa kelelahan mata.
2. **Penegakan Tabular Numbers**:
   Seluruh kolom tabel yang memuat data finansial, skor reviewer, atau persentase wajib menyertakan kelas Tailwind `font-mono tabular-nums text-right`. Hal ini memastikan lebar digit 0 hingga 9 selalu setara secara proporsional sehingga mencegah pergeseran tata letak (*Cumulative Layout Shift / CLS*) saat data mengalami pembaruan asinkron (*live update*).

---

## 5. Bab 4: Disiplin Aset Visual & Larangan Emoji Mutlak

### 5.1 Kebijakan Larangan Emoji Total (Zero Emoji Invariant)

Sistem Penelitian Terintegrasi Standalone memberlakukan **larangan mutlak terhadap seluruh simbol visual emoji** (karakter Unicode rentang `\uD83C` hingga `\uDBFF`, `\uDC00` hingga `\uDFFF`, serta blok dekoratif `\u2600` hingga `\u27BF`).

```
+-------------------------------------------------------------------------------+
|                       STANDAR PENYAJIAN INDIKATOR STATUS                      |
| POLA YANG DILARANG KERAS (EMOJI SLOP):                                        |
|   [TIDAK BOLEH] [EMOJI] Proposal Ditolak                                      |
|   [TIDAK BOLEH] [EMOJI] Lolos Didanai                                         |
|   [TIDAK BOLEH] [EMOJI] Perlu Revisi                                          |
|   [TIDAK BOLEH] [EMOJI] Termin 2 Terkunci                                     |
+-------------------------------------------------------------------------------+
| STANDAR WAJIB HYBRID SCHOLARLY:                                               |
|   [STATUS_TEXT] didampingi Ikon Vektor SVG Lucide React (Stroke 1.5 - 2.0px)  |
|                                                                               |
|   Contoh Tepat:                                                               |
|   <StatusBadge status="Ditolak" variant="danger" />                           |
|   -> Render: [XCircle 14px] [DITOLAK]                                         |
|   <StatusBadge status="Lolos_Didanai" variant="success" />                    |
|   -> Render: [CheckCircle2 14px] [LOLOS DIDANAI]                              |
|   <StatusBadge status="Revisi" variant="warning" />                           |
|   -> Render: [AlertTriangle 14px] [PERLU REVISI]                              |
|   <StatusBadge status="Terkunci" variant="neutral" />                         |
|   -> Render: [Lock 14px] [TERKUNCI MONEV]                                     |
+-------------------------------------------------------------------------------+
```

**Rasional Penegakan Bebas Emoji**:
1. **Wibawa Institusional**: Platform ini memproses dokumen hukum dan hibah negara; emoji menurunkan bobot formalitas ke level aplikasi hiburan konsumer kasual.
2. **Inkonsistensi Render Antar-Perangkat**: Emoji tampak sangat berbeda pada Windows 11 (warna datar berbingkai tebal), macOS/iOS (glif 3D mengkilap), dan Linux/Ubuntu (sering kali jatuh ke glif biner kotak hitam).
3. **Aksesibilitas Pembaca Layar (*Screen Reader Accessibility*)**: Perangkat pembaca layar tunanetra akan menyuarakan deskripsi mentah emoji (misalnya: *"Police Cars Revolving Light"*, *"Red Circle"*), yang mengacaukan pemahaman pengguna disabilitas terhadap konteks ilmiah.

---

### 5.2 Standar Pustaka Ikon Vektor: Lucide React

Seluruh kebutuhan grafis ikon antarmuka wajib dipenuhi secara eksklusif menggunakan pustaka `lucide-react` dengan spesifikasi teknis seragam:

- **Ukuran Standar**:
  - `size-3.5` (14px): Khusus untuk lencana status mikro (*micro-badges*) dan tag kecil.
  - `size-4` (16px): Standar tombol aksi reguler, input prefix/suffix, dan menu dropdown.
  - `size-5` (20px): Navigasi sidebar, header kartu, dan tab switching.
  - `size-6` (24px): Indikator kartu metrik dasbor utama dan header modal dialog.
  - `size-10` (40px): Status kosong (*empty state illustration container*).
- **Ketebalan Garis (*Stroke Width*)**: Wajib antara `1.5px` (pada ukuran besar >= 20px) hingga `2.0px` (pada ukuran mikro <= 16px). Dilarang menggunakan ikon dengan garis terlalu tebal (> 2.5px) atau terlalu tipis (< 1.0px).

---

### 5.3 Pemetaan Ikon Spesifik Siklus Hidup Penelitian

| Entitas / Fase Riset | Nama Ikon Lucide | Makna Semantik & Titik Pakai |
|---|---|---|
| **Fase 1: Usulan Riset** | `FileText` | Dokumen usulan proposal baru atau draf proposal. |
| **Fase 1: Skema Hibah** | `Layers` | Kategori skema pendanaan tahun anggaran aktif. |
| **Fase 1: Anggota Tim** | `Users` | Susunan ketua dan anggota peneliti dosen/mahasiswa. |
| **Fase 1: Anggaran RAB** | `Calculator` | Penyusunan rincian belanja bahan dan operasional. |
| **Fase 2: Reviewer** | `UserCheck` | Penunjukan penilai independen oleh LPPM. |
| **Fase 2: Rubrik Nilai** | `ClipboardCheck` | Instrumen formulir penilaian kriteria substansi riset. |
| **Fase 2: Konflik Reviewer**| `ShieldAlert` | Deteksi Conflict of Interest (CoI Guard). |
| **Fase 3: Kontrak Riset** | `FileCheck` | Surat perjanjian pelaksanaan penelitian bernomor resmi. |
| **Fase 3: Keuangan & Bank** | `CreditCard` | Pencairan dana termin (Termin 1 70% & Termin 2 30%). |
| **Fase 3: Bukti Transfer**| `Receipt` | Bukti transaksi mutasi bank valid dari Bendahara. |
| **Fase 4: Jadwal Monev** | `Calendar` | Rentang tanggal pelaksanaan seminar kemajuan. |
| **Fase 4: Logbook Riset** | `BookOpen` | Catatan harian aktivitas dan kemajuan lapangan. |
| **Fase 4: Gembok Monev** | `Lock` | Indikator pengunci pencairan Termin 2 (*Gatekeeper Lock*). |
| **Fase 5: Luaran Jurnal** | `Award` | Artikel pada jurnal internasional/nasional terakreditasi. |
| **Fase 5: Luaran Buku** | `Book` | Monograf atau buku referensi ber-ISBN resmi. |
| **Fase 5: Luaran HKI** | `ShieldCheck` | Hak Cipta, Paten Sederhana, atau Desain Industri. |
| **Fase 6: Evaluasi Akhir**| `CheckCircle2` | Penilaian kelulusan akhir 100% oleh tim penilai. |
| **Fase 6: Dokumen SKTS** | `Stamp` | Surat Keterangan Tanda Selesai resmi ber-barcode arsip. |
| **Fase 6: Arsip Terkunci** | `Archive` | Status permanen baca-saja (*Read-Only Archive*). |

---

## 6. Bab 5: Persyaratan Wajib: Pratinjau Sistem Desain & Komponen Pakai-Ulang (Design System Preview Gate)

### 6.1 Ketentuan Gerbang Pratinjau (*Preview Gate Invariant*)

> **[ATURAN PENGEMBANGAN MUTLAK]**:
> Sebelum pengembang diperbolehkan mengimplementasikan layar antarmuka modul riset (seperti Dasbor, Formulir Usulan, Workspace Reviewer, atau Modul Monev), pengembang **WAJIB** membuat dan memvalidasi halaman katalog pratinjau komponen terisolasi (*Design System Preview*) pada rute pengujian internal (misalnya `/design-system-preview` atau katalog komponen berbasis Inertia).

Katalog pratinjau ini berfungsi untuk menguji secara interaktif:
1. Keselarasan kontras warna seluruh state terhadap standar WCAG AAA.
2. Responsivitas dan kerapian tipografi hibrida pada breakpoint mobile (`sm: 640px`), tablet (`md: 768px`), laptop (`lg: 1024px`), dan desktop (`xl: 1280px`).
3. Interaktivitas komponen pakai-ulang terhadap berbagai kondisi ekstrim (*edge case data*), teks judul yang sangat panjang, serta angka desimal kompleks.

---

### 6.2 Spesifikasi 6 Komponen Inti Pakai-Ulang

Berikut adalah kontrak antarmuka TypeScript dan rancangan arsitektur untuk 6 komponen wajib sistem:

#### 1. Komponen `StatusBadge`
Menyajikan status fase penelitian dalam format lencana teks terstruktur dengan mikro-ikon presisi dan varian warna semantik:

```tsx
// resources/js/Components/UI/StatusBadge.tsx
import React from 'react';
import { 
  FileEdit, Send, Clock, CheckCircle2, XCircle, 
  AlertTriangle, FileCheck, Lock, Unlock, ShieldCheck, 
  Archive, LucideIcon 
} from 'lucide-react';

export type BadgeStatusType = 
  | 'Draft' 
  | 'Submitted' 
  | 'In_Review' 
  | 'Lolos_Didanai' 
  | 'Ditolak' 
  | 'Revisi' 
  | 'Contracted' 
  | 'Disbursed_T1' 
  | 'Disbursed_T2' 
  | 'Monev_Approved' 
  | 'Monev_Locked' 
  | 'Output_Verified' 
  | 'Completed_SKTS' 
  | 'Terminated';

interface StatusBadgeProps {
  status: BadgeStatusType;
  labelOverride?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  classes: string;
  icon: LucideIcon;
}

const statusMap: Record<BadgeStatusType, StatusConfig> = {
  Draft: {
    label: '[DRAFT]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: FileEdit,
  },
  Submitted: {
    label: '[DIAJUKAN]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    icon: Send,
  },
  In_Review: {
    label: '[SEDANG DIREVIEW]',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: Clock,
  },
  Lolos_Didanai: {
    label: '[LOLOS DIDANAI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Ditolak: {
    label: '[DITOLAK]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Revisi: {
    label: '[PERLU REVISI]',
    classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: AlertTriangle,
  },
  Contracted: {
    label: '[TERKONTRAK]',
    classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    icon: FileCheck,
  },
  Disbursed_T1: {
    label: '[CAIR TERMIN 1]',
    classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
    icon: CheckCircle2,
  },
  Disbursed_T2: {
    label: '[CAIR TERMIN 2]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Monev_Approved: {
    label: '[MONEV DISETUJUI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: Unlock,
  },
  Monev_Locked: {
    label: '[TERKUNCI MONEV]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    icon: Lock,
  },
  Output_Verified: {
    label: '[LUARAN TERVERIFIKASI]',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    icon: ShieldCheck,
  },
  Completed_SKTS: {
    label: '[SELESAI (SKTS)]',
    classes: 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/70',
    icon: Archive,
  },
  Terminated: {
    label: '[FORCE MAJEURE / DIBATALKAN]',
    classes: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  labelOverride,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = statusMap[status] || statusMap.Draft;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-sans font-medium rounded-md border tracking-wide uppercase ${sizeClasses} ${config.classes} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2} />}
      <span>{labelOverride || config.label}</span>
    </span>
  );
};
```

---

#### 2. Komponen `PDFUploader`
Komponen unggah berkas drag-and-drop khusus dokumen usulan dan laporan PDF dengan validasi ketat ukuran maksimal 10MB:

```tsx
// resources/js/Components/UI/PDFUploader.tsx
import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PDFUploaderProps {
  value: File | null;
  existingFileUrl?: string;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  disabled?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  value,
  existingFileUrl,
  onChange,
  maxSizeMB = 10,
  disabled = false,
  helperText = 'Format dokumen wajib PDF, ukuran berkas maksimal 10 MB.',
  label = 'Unggah Dokumen Proposal (PDF)',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (file: File) => {
    setErrorMessage(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Berkas tidak valid. Hanya berkas berformat .pdf yang diperbolehkan.');
      return;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`Ukuran berkas (${actualMB} MB) melebihi batas maksimal ${maxSizeMB} MB.`);
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        <span className="text-xs text-slate-500 font-mono">Batas: {maxSizeMB} MB</span>
      </div>

      {!value && !existingFileUrl ? (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150 ${
            isDragging 
              ? 'border-blue-900 bg-blue-50/50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
          />
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-800">
            Seret dan lepas dokumen PDF di sini, atau <span className="text-blue-900 underline">pilih dari komputer</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-white border border-slate-200 rounded text-rose-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 truncate">
                {value ? value.name : 'Dokumen-Usulan-Tersimpan.pdf'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {value ? `${(value.size / (1024 * 1024)).toFixed(2)} MB` : 'Berkas Tersimpan'}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => { onChange(null); setErrorMessage(null); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors"
              title="Hapus berkas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-700 mt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
```

---

#### 3. Komponen `TabularFigure`
Komponen penyajian angka berporos tetap (*monospace tabular-nums*) untuk nominal rupiah dan skor dengan perataan kanan dan tanpa pergeseran layout:

```tsx
// resources/js/Components/UI/TabularFigure.tsx
import React from 'react';

interface TabularFigureProps {
  value: number | string | null | undefined;
  type?: 'currency' | 'score' | 'percentage' | 'integer';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const TabularFigure: React.FC<TabularFigureProps> = ({
  value,
  type = 'currency',
  decimals,
  prefix,
  suffix,
  size = 'base',
  weight = 'medium',
  align = 'right',
  className = '',
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  let formatted = '-';
  if (numValue !== null && numValue !== undefined && !isNaN(numValue)) {
    if (type === 'currency') {
      formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }).format(numValue);
    } else if (type === 'percentage') {
      formatted = `${numValue.toFixed(decimals ?? 1)}%`;
    } else if (type === 'score') {
      formatted = numValue.toFixed(decimals ?? 2);
    } else {
      formatted = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }).format(numValue);
    }
  }

  const sizeClasses = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-2xl',
  }[size];

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }[align];

  return (
    <span
      className={`font-mono tabular-nums tracking-tight text-slate-900 ${sizeClasses} ${weightClasses} ${alignClasses} ${className}`}
    >
      {prefix && <span className="text-slate-500 mr-0.5">{prefix}</span>}
      {formatted}
      {suffix && <span className="text-slate-500 ml-0.5">{suffix}</span>}
    </span>
  );
};
```

---

#### 4. Komponen `MetricCard`
Kartu metrik bento untuk dasbor dengan hierarki visual terarah, mikro-ikon aksen, dan indikator tren:

```tsx
// resources/js/Components/UI/MetricCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TabularFigure } from './TabularFigure';

interface MetricCardProps {
  title: string;
  value: number | string;
  type?: 'currency' | 'score' | 'percentage' | 'integer';
  icon: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  caption?: string;
  badgeText?: string;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  type = 'integer',
  icon: Icon,
  iconBgClass = 'bg-blue-50',
  iconColorClass = 'text-blue-900',
  caption,
  badgeText,
  badgeVariant = 'neutral',
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  }[badgeVariant];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-sans font-semibold text-slate-600 uppercase tracking-wider">
          {title}
        </p>
        <div className={`p-2 rounded-md border border-slate-100 ${iconBgClass} ${iconColorClass}`}>
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <TabularFigure
          value={value}
          type={type}
          size="2xl"
          weight="bold"
          align="left"
          className="text-slate-900"
        />
        {badgeText && (
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-sans font-medium uppercase ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-xs font-sans text-slate-500">
          {caption}
        </p>
      )}
    </div>
  );
};
```

---

#### 5. Komponen `PageHeader`
Header halaman modular yang memadukan navigasi remah roti (*breadcrumbs*), judul hibrida (Serif untuk substansi riset, Sans untuk modul operasional), dan area tombol aksi CTA:

```tsx
// resources/js/Components/UI/PageHeader.tsx
import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  isEditorialSerif?: boolean; // True jika judul proposal/skema
  breadcrumbs?: BreadcrumbItem[];
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  isEditorialSerif = false,
  breadcrumbs = [],
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="mb-6 pb-5 border-b border-slate-200">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2 font-sans">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-900 transition-colors truncate max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-medium truncate max-w-sm">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1
              className={`text-slate-900 tracking-tight ${
                isEditorialSerif
                  ? 'font-serif text-2xl sm:text-3xl font-semibold'
                  : 'font-sans text-xl sm:text-2xl font-bold'
              }`}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-600 font-sans max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

#### 6. Komponen `SplitScreenViewer`
Komponen tata letak layar terbagi untuk ruang telaah penilai (*Reviewer Workspace*) dan verifikasi luaran LPPM (rasio 60% pratinjau PDF di kiri, 40% rubrik penilaian interaktif di kanan):

```tsx
// resources/js/Components/UI/SplitScreenViewer.tsx
import React, { useState } from 'react';
import { Maximize2, Minimize2, Download, ExternalLink } from 'lucide-react';

interface SplitScreenViewerProps {
  pdfUrl: string;
  documentTitle: string;
  formContent: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const SplitScreenViewer: React.FC<SplitScreenViewerProps> = ({
  pdfUrl,
  documentTitle,
  formContent,
  headerActions,
}) => {
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100">
      {/* Top Utility Bar */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500">
            Telaah Berkas:
          </span>
          <span className="text-sm font-serif font-semibold text-slate-900 truncate max-w-md">
            {documentTitle}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {headerActions}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Buka Dokumen di Tab Baru"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={pdfUrl}
            download
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Unduh Berkas PDF"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => setIsPdfExpanded(!isPdfExpanded)}
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title={isPdfExpanded ? 'Kembalikan Tampilan Terbagi' : 'Perluas Tampilan PDF'}
          >
            {isPdfExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: PDF Viewer (60% Default / 100% Expanded) */}
        <div
          className={`h-full border-r border-slate-300 bg-slate-800 transition-all duration-200 ${
            isPdfExpanded ? 'w-full' : 'w-full lg:w-[60%]'
          }`}
        >
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title="Pratinjau Dokumen Usulan Riset"
            className="w-full h-full border-0"
          />
        </div>

        {/* Right Pane: Interactive Evaluation Form (40% Default / Hidden when Expanded) */}
        {!isPdfExpanded && (
          <div className="hidden lg:flex flex-col w-[40%] h-full bg-white overflow-y-auto">
            <div className="p-6">
              {formContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 7. Bab 6: Cetak Biru Komposisi Halaman Modul (Anti-Generic Blueprints)

### 7.1 Dasbor Peneliti & LPPM (Bento-Grid Berorientasi Aksi)

Dasbor didesain menggunakan kisi-kisi modular bento (*bento grid*) 12 kolom yang responsif, mengarahkan perhatian pengguna secara instan pada aksi yang membutuhkan respons cepat (*Action-Oriented Dashboard*):

```
+---------------------------------------------------------------------------------------------------+
| [PageHeader]: Dasbor Peneliti LPPM Multi-Kampus                     [Tombol CTA: Ajukan Proposal] |
+---------------------------------------------------------------------------------------------------+
| KARTU BENTO 1 (Col 1-8): STEPPER SIKLUS RISET AKTIF       | KARTU BENTO 2 (Col 9-12): COUNTDOWN   |
| Judul Riset: "Pengembangan Katalis Berbasis Limbah Sawit" | Skema: Penelitian Terapan 2026        |
| [Fase 1: Selesai] -> [Fase 2: Review] -> [Fase 3: Kontrak]| Sisa Waktu Pengajuan:                 |
| Status Saat Ini: [SEDANG DIREVIEW]                        | 04 Hari : 12 Jam : 30 Menit           |
+-----------------------------------------------------------+---------------------------------------+
| KARTU METRIK 1 (Col 1-3)  | KARTU METRIK 2 (Col 4-6)      | KARTU METRIK 3 (Col 7-9)  | METRIK 4  |
| Total Usulan Diajukan     | Komitmen Dana Disetujui       | Laporan Monev Disetujui   | Luaran    |
| [ 3 Usulan ]              | [ Rp 85.000.000 ]             | [ 100% - Lulus ]          | [ 2 / 2 ] |
+-----------------------------------------------------------+---------------------------------------+
| TABEL DAFTAR TINDAKAN SEGERA (Col 1-12)                                                           |
| Dokumen / Tugas                 | Tenggat Waktu | Prioritas       | Tindakan Diperlukan           |
| Laporan Kemajuan Monev Riset 2  | 20 Okt 2026   | [TINGGI]        | [Tombol: Unggah Berkas]       |
| Perbaikan Berkas Kontrak Hibah  | 25 Okt 2026   | [SEDANG]        | [Tombol: Lengkapi Data]       |
+---------------------------------------------------------------------------------------------------+
```

---

### 7.2 Modul 1: Wizard Usulan Riset Dosen (Linear Multi-Step Wizard)

Formulir pengajuan usulan proposal menerapkan pola alur 4 langkah linier (*Linear 4-Step Wizard*) untuk membagi beban pengisian tanpa membuat pengguna kewalahan:

```
[Langkah 1: Identitas & Skema] ===> [Langkah 2: Tim Dosen] ===> [Langkah 3: RAB Tabular] ===> [Langkah 4: Berkas PDF]
```

1. **Langkah 1: Identitas & Skema**: Pemilihan skema hibah aktif, judul penelitian (input teks besar), bidang fokus, rumpun ilmu, dan ringkasan abstrak (dengan pembatas karakter dan hitungan kata dinamis).
2. **Langkah 2: Tim Riset**: Tabel dinamis anggota pengusul dengan pencarian akun dosen terdaftar, penentuan peran (Ketua / Anggota), serta alokasi jam kerja per minggu.
3. **Langkah 3: Rencana Anggaran Biaya (RAB)**: Tabel kalkulator belanja berbasis kelompok mata anggaran (Bahan Habis Pakai, Pengumpulan Data, Analisis Laboratorium, Pelaporan & Luaran) dengan rekapitulasi total otomatis yang memvalidasi pagu maksimal skema.
4. **Langkah 4: Berkas Usulan**: Zona drop `PDFUploader` (maksimal 10MB) dan pratinjau lembar pengesahan.
5. **Indikator Simpan Draf Otomatis (*Auto-save Indicator*)**: Menampilkan status sinkronisasi `[Tersimpan Otomatis ke Draf pukul 14:22 WIB]` di sudut kanan bawah form.

---

### 7.3 Modul 2: Workspace Reviewer Usulan (Split-Screen Review Interface)

Menghilangkan kebutuhan membuka banyak jendela terpisah (*tab hopping*) melalui arsitektur layar terbagi:
- **Sisi Kiri (60%)**: Pratinjau dokumen proposal PDF terintegrasi langsung dengan kontrol zoom, jump to page, dan unduh berkas.
- **Sisi Kanan (40%)**: Lembar instrumen rubrik penilaian:
  - Indikator deteksi CoI (*Conflict of Interest Guard*): Pesan peringatan formal jika reviewer berasal dari program studi yang sama.
  - Matriks kriteria penilaian berbobot (skala nilai 0-100 per kriteria) dengan kalkulasi otomatis nilai tertimbang.
  - Kotak komentar kualitatif editorial untuk masukan perbaikan substansi.
  - Radio button putusan rekomendasi: `Lolos_Didanai`, `Revisi`, atau `Ditolak`.
  - Tombol simpan penilaian dengan dialog konfirmasi rekap nilai akhir.

---

### 7.4 Modul 3: Visualisasi Finansial & Timeline Monev

Antarmuka pengelolaan dana dan pemantauan kemajuan riset:
1. **Bilah Alokasi Termin Finansial**:
   - Visualisasi pembagian dana: **Termin 1 (70%)** dan **Termin 2 (30%)**.
   - Kartu rincian rekening bank peneliti dan status mutasi transfer oleh Bendahara Kampus.
2. **Indikator Gembok Monev (*Monev Gatekeeper Lock*)**:
   - Tombol pencairan dana Termin 2 secara visual dikunci dengan ikon `Lock` dan status badge `[TERKUNCI MONEV]`.
   - Tooltip dan pesan penjelasan: *"Pencairan Termin 2 sebesar 30% terkunci otomatis hingga Berkas Laporan Kemajuan disetujui (Approved) oleh Reviewer Monev."*
   - Hanya setelah status Monev berubah menjadi `Approved`, gembok terbuka menjadi `Unlock` hijau dan tombol aksi *"Ajukan Pencairan Termin 2"* dapat diklik.

---

### 7.5 Modul 5: Matriks Verifikasi Luaran Ilmiah

Antarmuka pelaporan capaian riset:
1. **Pengelompokan Luaran Wajib vs Tambahan**:
   - Tab navigasi klasifikasi luaran: Publikasi Jurnal Ilmiah, Buku Ber-ISBN, HKI / Paten, dan Produk Teknologi Tepat Guna.
2. **Form Validasi Pencegahan Klaim Ganda**:
   - Input khusus untuk kode identitas unik: DOI naskah, nomor ISBN buku, atau nomor pendaftaran HKI.
   - Pengecekan asinkron (*inline lookup*) ke database untuk memastikan luaran belum pernah diklaim oleh judul usulan riset lain.
3. **Panel Verifikasi Operator LPPM**:
   - Switch toggle `[Tolak Luaran]` / `[Verifikasi Berkas]`, disertai kolom isian catatan perbaikan jika luaran ditolak administratif.

---

### 7.6 Modul 6: Halaman Penutupan Riset & Arsip SKTS

Antarmuka kelulusan akhir dan penerbitan sertifikat:
1. **Banner Arsip Baca-Saja (*Read-Only Archive Banner*)**:
   - Banner statis permanen di bagian atas layar: *"Siklus Penelitian ini telah selesai dan diterbitkan Surat Keterangan Tanda Selesai (SKTS). Seluruh berkas proposal, kontrak, logbook, dan laporan telah dikunci permanen dalam mode arsip baca-saja."*
2. **Komponen Sertifikat SKTS Digital**:
   - Format visual sertifikat formal: Judul menggunakan font editorial serif Newsreader/Merriweather, logo universitas berwibawa di bagian tengah atas, nomor surat registrasi resmi institusi, kode verifikasi digital QR-Code di sudut bawah, serta rincian nilai evaluasi akhir (`Lulus_Memuaskan`).

---

## 8. Bab 7: Pola Formulir & Interaktivitas Inertia useForm

### 8.1 Standar Form Inertia.js 2.0

Interaksi formulir dalam sistem ini wajib mematuhi 4 pilar arsitektur penanganan formulir interaktif:

```tsx
// resources/js/Pages/Proposals/Partials/ProposalFormExample.tsx
import React, { useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { PDFUploader } from '@/Components/UI/PDFUploader';

interface FormSchema {
  judul_penelitian: string;
  abstrak: string;
  dana_usulan: number;
  berkas_proposal: File | null;
}

export const ProposalFormExample: React.FC = () => {
  const { data, setData, post, processing, errors, isDirty, reset } = useForm<FormSchema>({
    judul_penelitian: '',
    abstrak: '',
    dana_usulan: 0,
    berkas_proposal: null,
  });

  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // 1. Auto-Focus pada Field Pertama yang Error Pasca-Submit Gagal
  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstField = document.querySelector<HTMLElement>(`[name="${errorKeys[0]}"]`);
      if (firstField) {
        firstField.focus();
        firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errors]);

  // 2. Proteksi Navigasi saat Perubahan Belum Disimpan (Dirty State Guard)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/proposals', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
      {/* Field 1: Judul Riset (Serif Preview) */}
      <div>
        <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Judul Usulan Penelitian <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          name="judul_penelitian"
          value={data.judul_penelitian}
          onChange={(e) => setData('judul_penelitian', e.target.value)}
          placeholder="Tuliskan judul usulan riset secara lengkap dan jelas..."
          disabled={processing}
          className={`w-full font-serif text-base px-3.5 py-2.5 rounded-md border transition-colors ${
            errors.judul_penelitian ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 focus:border-blue-900'
          }`}
        />
        {errors.judul_penelitian && (
          <p className="flex items-center space-x-1 text-xs text-rose-700 mt-1 font-sans">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.judul_penelitian}</span>
          </p>
        )}
      </div>

      {/* Field 2: Berkas Proposal (10MB PDF) */}
      <PDFUploader
        value={data.berkas_proposal}
        onChange={(file) => setData('berkas_proposal', file)}
        disabled={processing}
        required
      />
      {errors.berkas_proposal && (
        <p className="flex items-center space-x-1 text-xs text-rose-700 font-sans">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errors.berkas_proposal}</span>
        </p>
      )}

      {/* Action Zone: Submit Terkunci Otomatis saat Processing */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span className="text-xs text-slate-500 font-sans">
          {isDirty ? 'Ada perubahan belum disimpan' : 'Semua data telah sinkron'}
        </span>

        <button
          type="submit"
          disabled={processing}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-md font-sans text-sm font-semibold text-white transition-all ${
            processing 
              ? 'bg-blue-900/60 cursor-not-allowed' 
              : 'bg-blue-900 hover:bg-blue-800 active:bg-blue-950 shadow-xs'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Data...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Usulan Riset</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
```

---

### 8.2 Rangkuman Aturan Formulir

1. **Submit Terkunci Otomatis (*Processing Lock*)**: Seluruh tombol mutasi form wajib memiliki atribut `disabled={processing}` dengan indikator animasi spinner `Loader2` dan teks dinamis (*"Menyimpan..."* atau *"Mengunggah Berkas..."*) untuk mengeliminasi potensi pengiriman data ganda akibat koneksi internet lambat.
2. **Peringatan Perubahan Belum Disimpan (*Dirty State Confirmation*)**: Jika pengguna mencoba berpindah halaman atau menutup modal saat `isDirty === true`, dialog konfirmasi formal wajib dimunculkan untuk mencegah kehilangan data ketikan formulir.
3. **Validasi Inline Pasca-Blur (*Validation on Blur*)**: Form harus memberikan umpan balik visual saat kursor meninggalkan field input yang tidak memenuhi syarat (*invalid*).
4. **Auto-Scroll & Fokus ke Galat Pertama**: Jika pengiriman form ditolak oleh backend (respons 422 Unprocessable Content), layar secara otomatis bergeser (*smooth scroll*) dan menempatkan fokus kursor pada field pertama yang memicu galat.

---

## 9. Bab 8: Spesifikasi State Visual, Feedback, & Aksesibilitas

### 9.1 Tabel Pemetaan State Visual Komprehensif (14 Status Sistem)

Tabel berikut menjadi rujukan visual baku untuk seluruh pengembang dalam merender status di seluruh bagian aplikasi:

| Status Kode Sistem | Teks Lencana UI | Kelas Warna Latar | Kelas Border | Kelas Warna Teks | Ikon Lucide |
|---|---|---|---|---|---|
| `Draft` | `[DRAFT]` | `bg-slate-100` | `border-slate-300` | `text-slate-700` | `FileEdit` |
| `Submitted` | `[DIAJUKAN]` | `bg-sky-50` | `border-sky-200` | `text-sky-700` | `Send` |
| `In_Review` | `[SEDANG DIREVIEW]` | `bg-amber-50` | `border-amber-200` | `text-amber-700` | `Clock` |
| `Lolos_Didanai` | `[LOLOS DIDANAI]` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` | `CheckCircle2` |
| `Ditolak` | `[DITOLAK]` | `bg-rose-50` | `border-rose-200` | `text-rose-700` | `XCircle` |
| `Revisi` | `[PERLU REVISI]` | `bg-amber-50` | `border-amber-300` | `text-amber-800` | `AlertTriangle` |
| `Contracted` | `[TERKONTRAK]` | `bg-blue-50` | `border-blue-200` | `text-blue-800` | `FileCheck` |
| `Disbursed_T1` | `[CAIR TERMIN 1]` | `bg-teal-50` | `border-teal-200` | `text-teal-700` | `CheckCircle2` |
| `Disbursed_T2` | `[CAIR TERMIN 2]` | `bg-emerald-50` | `border-emerald-300` | `text-emerald-800` | `CheckCircle2` |
| `Monev_Approved` | `[MONEV DISETUJUI]` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` | `Unlock` |
| `Monev_Locked` | `[TERKUNCI MONEV]` | `bg-rose-50` | `border-rose-200` | `text-rose-700` | `Lock` |
| `Output_Verified`| `[LUARAN TERVERIFIKASI]`| `bg-indigo-50` | `border-indigo-200` | `text-indigo-700` | `ShieldCheck` |
| `Completed_SKTS` | `[SELESAI (SKTS)]` | `bg-slate-900` | `border-slate-900` | `text-white` | `Archive` |
| `Terminated` | `[FORCE MAJEURE]` | `bg-rose-100` | `border-rose-300` | `text-rose-800` | `XCircle` |

---

### 9.2 Pola Keadaan Kosong (Empty States Pattern)

Keadaan kosong (*empty states*) harus informatif, tidak boleh hanya menampilkan teks "Tidak ada data". Setiap empty state wajib memuat 4 elemen struktural:
1. **Mikro-Ikon Kontekstual**: Ikon Lucide berukuran `size-10` (40px) di dalam kontainer lingkaran abu-abu lembut `bg-slate-100 text-slate-400`.
2. **Judul Keadaan (Serif/Sans)**: Kalimat jelas yang mendefinisikan apa yang belum ada (contoh: *"Belum Ada Usulan Penelitian yang Diajukan"*).
3. **Deskripsi Penjelas**: Petunjuk ringkas mengenai langkah berikutnya (contoh: *"Pilih skema pendanaan tahun anggaran aktif untuk mulai menyusun usulan riset baru Anda."*).
4. **Tombol Tindakan Utama (CTA)**: Tombol aksi langsung (contoh: *"Pilih Skema & Ajukan Usulan"*).

---

### 9.3 Pola Pemuatan Berkerangka (Themed Skeleton Loader)

Untuk mencegah pergeseran layout (*layout shift*) saat proses pemuatan data asinkron, sistem melarang spinner layar penuh (*full-screen blocking spinner*). Sistem mewajibkan penggunaan *skeleton loader* yang mencerminkan geometri komponen tujuan:

```tsx
// resources/js/Components/UI/TableSkeleton.tsx
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse">
    <div className="h-10 bg-slate-100 border-b border-slate-200" />
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between space-x-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/12" />
          <div className="h-6 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  </div>
);
```

---

### 9.4 Pola Umpan Balik Flash & Toast

Pesan flash dari Laravel Inertia ditampilkan dalam format kartu toast mengambang di sudut kanan atas:
- **Tipe Pesan**: `success`, `error`, `warning`, `info`.
- **Durasi Tampil**: 5.000 milidetik (5 detik) dengan transisi keluar halus (*fade out*).
- **Kontrol Pengguna**: Tersedia tombol tutup manual `X` dan bilah penunjuk durasi susut (*shrinking progress bar*).
- **Format**: Ikon semantik di sisi kiri, judul pesan tebal, dan uraian pesan penjelas.

---

### 9.5 Kepatuhan Aksesibilitas WCAG 2.1 Level AAA/AA

1. **Rasio Kontras Minimum**: Seluruh teks utama wajib memenuhi rasio kontras 12:1 terhadap kanvas, dan teks pendukung minimal 4.5:1.
2. **Cincin Fokus Terlihat (*Visible Focus Rings*)**: Seluruh kontrol interaktif (tombol, tautan, input) wajib menampilkan indikator fokus tegas saat diakses via keyboard: `focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2`.
3. **Dukungan Pengurangan Gerakan (*prefers-reduced-motion*)**: Seluruh transisi CSS wajib menghormati pengaturan aksesibilitas sistem pengguna melalui penonaktifan durasi transisi jika diminta.
4. **Struktur Navigasi Semantik**: Hirarki heading teratur (H1 -> H2 -> H3) tanpa loncatan level, dan setiap tombol hanya-ikon wajib memiliki atribut `aria-label` deskriptif.

---

## 10. Ringkasan Kepatuhan & Checklist Implementasi

Sebelum sebuah layar antarmuka modul dinyatakan selesai (*Done*), pengembang wajib memverifikasi checklist berikut:

- [ ] **Bebas Emoji 100%**: Tidak ada karakter emoji pada teks, judul, lencana status, tombol, atau kode.
- [ ] **Tipografi Hibrida Terpenuhi**: Judul riset, abstrak, dan SKTS menggunakan font serif; antarmuka dan form menggunakan font sans; angka uang dan skor menggunakan font mono tabular.
- [ ] **Warna & Palet Patuh (Light Cool Slate & Dark Deep Academic Midnight)**: Menggunakan token resmi `surface-*`, `border-*`, `text-*`, `brand-*`, serta adaptasi `dark:` sesuai spesifikasi.
- [ ] **Komponen Inti Dipakai Ulang**: Memanfaatkan `StatusBadge`, `PDFUploader`, `TabularFigure`, `MetricCard`, dan `PageHeader` tanpa membuat varian lokal duplikat.
- [ ] **Proteksi Form Inertia**: Tombol submit terkunci saat `processing`, tersedia konfirmasi `isDirty`, dan auto-focus ke error pertama.
- [ ] **Aksesibilitas Kontras & Fokus**: Seluruh teks lolos uji kontras WCAG dan navigasi keyboard memiliki cincin fokus yang jelas.
