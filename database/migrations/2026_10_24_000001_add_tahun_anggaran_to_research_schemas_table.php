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
        Schema::table('research_schemas', function (Blueprint $table) {
            $table->unsignedSmallInteger('tahun_anggaran')->default(date('Y'))->after('nama_skema');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('research_schemas', function (Blueprint $table) {
            $table->dropColumn('tahun_anggaran');
        });
    }
};
