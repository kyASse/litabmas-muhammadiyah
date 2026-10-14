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
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_proposal')->unique()->constrained('proposals')->cascadeOnDelete();
            $table->foreignId('id_evaluator')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_laporan_akhir');
            $table->longText('ringkasan_hasil');
            $table->unsignedInteger('persentase_capaian_luaran')->default(0);
            $table->decimal('skor_akhir_substansi', 5, 2)->default(0);
            $table->enum('rekomendasi_kelulusan', [
                'Lulus_Memuaskan',
                'Lulus_Cukup',
                'Tidak_Lulus',
            ])->nullable();
            $table->string('nomor_skts', 100)->unique()->nullable();
            $table->string('file_skts_path')->nullable();
            $table->enum('status_penelitian', [
                'Dalam_Evaluasi',
                'Selesai',
                'Gagal',
            ])->default('Dalam_Evaluasi');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
