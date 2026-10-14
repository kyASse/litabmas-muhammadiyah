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
        Schema::create('research_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_proposal')->constrained('proposals')->cascadeOnDelete();
            $table->enum('tipe_luaran', ['Journal', 'Book', 'Hki', 'Product']);
            $table->enum('target_status', ['Wajib', 'Tambahan'])->default('Wajib');
            $table->enum('status_verifikasi', ['Draft', 'Submitted', 'Verified', 'Rejected'])->default('Draft');
            $table->text('catatan_verifikasi')->nullable();
            $table->date('tanggal_pelaporan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_outputs');
    }
};
