<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('journal_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_research_output')->unique()->constrained('research_outputs')->cascadeOnDelete();
            $table->string('nama_jurnal');
            $table->string('judul_artikel');
            $table->string('issn', 50)->nullable();
            $table->enum('indeksasi', [
                'Scopus',
                'Sinta_1',
                'Sinta_2',
                'Sinta_3',
                'Sinta_4',
                'Internasional',
                'Nasional',
            ]);
            $table->enum('status_publikasi', ['Submitted', 'Accepted', 'Published'])->default('Submitted');
            $table->string('doi_url')->nullable();
            $table->string('file_artikel_path')->nullable();
            $table->timestamps();
        });

        Schema::create('book_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_research_output')->unique()->constrained('research_outputs')->cascadeOnDelete();
            $table->string('judul_buku');
            $table->string('isbn', 50);
            $table->string('penerbit');
            $table->year('tahun_terbit');
            $table->unsignedInteger('jumlah_halaman')->nullable();
            $table->string('file_cover_path')->nullable();
            $table->timestamps();
        });

        Schema::create('hki_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_research_output')->unique()->constrained('research_outputs')->cascadeOnDelete();
            $table->string('judul_ciptaan');
            $table->enum('jenis_hki', ['Hak_Cipta', 'Paten', 'Desain_Industri']);
            $table->string('nomor_pendaftaran', 100)->nullable();
            $table->string('nomor_sertifikat', 100)->nullable();
            $table->string('file_sertifikat_path')->nullable();
            $table->timestamps();
        });

        Schema::create('product_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_research_output')->unique()->constrained('research_outputs')->cascadeOnDelete();
            $table->string('nama_produk');
            $table->text('deskripsi_produk');
            $table->unsignedInteger('tingkat_kesiapan_teknologi')->default(1);
            $table->string('dokumentasi_produk_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_outputs');
        Schema::dropIfExists('hki_outputs');
        Schema::dropIfExists('book_outputs');
        Schema::dropIfExists('journal_outputs');
    }
};
