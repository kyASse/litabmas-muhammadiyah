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
        Schema::create('proposal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_proposal')->constrained('proposals')->cascadeOnDelete();
            $table->string('nama_file');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size');
            $table->enum('tipe_dokumen', [
                'Proposal_Utama',
                'Surat_Pernyataan',
                'Lampiran',
            ])->default('Proposal_Utama');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_documents');
    }
};
