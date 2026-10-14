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
        Schema::create('fundings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_contract')->constrained('contracts')->cascadeOnDelete();
            $table->unsignedInteger('termin_ke');
            $table->unsignedInteger('persentase_dana');
            $table->decimal('nominal_dana', 15, 2);
            $table->date('tanggal_pencairan')->nullable();
            $table->string('bukti_transfer_path')->nullable();
            $table->enum('status_pencairan', ['Pending', 'Disbursed', 'Verified'])->default('Pending');
            $table->text('catatan_keuangan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fundings');
    }
};
