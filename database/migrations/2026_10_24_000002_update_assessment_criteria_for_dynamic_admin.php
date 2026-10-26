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
        Schema::table('assessment_criteria', function (Blueprint $table) {
            $table->enum('tahap_seleksi', ['Administrasi', 'Substansi'])->default('Substansi')->after('nama_kriteria');
            $table->enum('tipe_jawaban', ['Ya_Tidak', 'Pilihan_Ganda'])->default('Pilihan_Ganda')->after('tahap_seleksi');
            $table->json('pilihan_skor')->nullable()->after('tipe_jawaban');
            $table->boolean('is_active')->default(true)->after('urutan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_criteria', function (Blueprint $table) {
            $table->dropColumn(['tahap_seleksi', 'tipe_jawaban', 'pilihan_skor', 'is_active']);
        });
    }
};
