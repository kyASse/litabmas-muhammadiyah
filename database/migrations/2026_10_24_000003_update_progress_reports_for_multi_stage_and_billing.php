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
        Schema::table('progress_reports', function (Blueprint $table) {
            $table->enum('tipe_laporan', ['Pendahuluan', 'Bulanan', 'Antara', 'Akhir'])
                ->default('Antara')
                ->after('id_monev_schedule');
            $table->string('file_presentasi')->nullable()->after('file_logbook');
            $table->string('file_tagihan')->nullable()->after('file_presentasi');
            $table->decimal('nominal_tagihan', 15, 2)->nullable()->after('file_tagihan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_reports', function (Blueprint $table) {
            $table->dropColumn([
                'tipe_laporan',
                'file_presentasi',
                'file_tagihan',
                'nominal_tagihan',
            ]);
        });
    }
};
