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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $table->foreignId('id_proposal')->unique()->constrained('proposals')->cascadeOnDelete();
            $table->string('nomor_kontrak', 100)->unique();
            $table->string('judul_kontrak');
            $table->decimal('dana_disetujui', 15, 2);
            $table->date('tanggal_kontrak');
            $table->string('file_dokumen_kontrak')->nullable();
            $table->enum('status_kontrak', ['Draft', 'Signed', 'Active', 'Closed'])->default('Draft');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
