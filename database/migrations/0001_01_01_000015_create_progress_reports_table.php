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
        Schema::create('progress_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_proposal')->constrained('proposals')->cascadeOnDelete();
            $table->foreignId('id_monev_schedule')->constrained('monev_schedules')->restrictOnDelete();
            $table->unsignedInteger('persentase_kemajuan')->default(0);
            $table->text('ringkasan_progres');
            $table->text('catatan_kendala')->nullable();
            $table->string('file_laporan_kemajuan');
            $table->string('file_logbook')->nullable();
            $table->decimal('skor_monev', 5, 2)->nullable();
            $table->text('catatan_reviewer_monev')->nullable();
            $table->enum('status_laporan', ['Submitted', 'Approved', 'Revision'])->default('Submitted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_reports');
    }
};
