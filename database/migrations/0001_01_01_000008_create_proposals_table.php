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
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $table->foreignId('id_pengusul')->constrained('users')->cascadeOnDelete();
            $table->foreignId('id_skema_pendanaan')->constrained('research_schemas')->restrictOnDelete();
            $table->string('judul_penelitian');
            $table->text('abstrak');
            $table->longText('latar_belakang')->nullable();
            $table->decimal('biaya_yang_diusulkan', 15, 2)->default(0);
            $table->enum('status_proposal', [
                'Draft',
                'Submitted',
                'Submitted_Kampus',
                'Approved_Kampus',
                'Rejected_Kampus',
                'Submitted_Bappeda',
                'Administrasi_Valid',
                'Lolos_Administrasi',
                'Ditolak_Administrasi',
                'Ditolak',
                'Lolos_Didanai',
            ])->default('Draft');
            $table->text('catatan_administrasi')->nullable();
            $table->date('tanggal_pengajuan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
