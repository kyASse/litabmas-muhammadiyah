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
        Schema::table('proposals', function (Blueprint $table) {
            $table->boolean('is_administrasi_approved')->nullable()->after('status_proposal');
            $table->boolean('is_rab_approved')->nullable()->after('is_administrasi_approved');
            $table->decimal('rekomendasi_anggaran', 15, 2)->nullable()->after('biaya_yang_diusulkan');
            $table->text('catatan_keuangan')->nullable()->after('catatan_administrasi');
            $table->timestamp('tanggal_verifikasi_administrasi')->nullable()->after('tanggal_pengajuan');
            $table->timestamp('tanggal_verifikasi_rab')->nullable()->after('tanggal_verifikasi_administrasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn([
                'is_administrasi_approved',
                'is_rab_approved',
                'rekomendasi_anggaran',
                'catatan_keuangan',
                'tanggal_verifikasi_administrasi',
                'tanggal_verifikasi_rab',
            ]);
        });
    }
};
