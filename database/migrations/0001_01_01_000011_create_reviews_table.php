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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_proposal')->constrained('proposals')->cascadeOnDelete();
            $table->foreignId('id_reviewer')->constrained('users')->cascadeOnDelete();
            $table->date('tanggal_mulai_review');
            $table->date('tanggal_selesai_review');
            $table->json('komponen_penilaian')->nullable();
            $table->decimal('skor_total', 5, 2)->default(0);
            $table->text('catatan_evaluasi')->nullable();
            $table->enum('keputusan_rekomendasi', ['Diterima', 'Ditolak', 'Revisi'])->nullable();
            $table->enum('status_review', ['Assigned', 'In_Progress', 'Completed'])->default('Assigned');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
