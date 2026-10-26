<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `proposals` MODIFY `status_proposal` ENUM(
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
                'Lolos_Didanai'
            ) NOT NULL DEFAULT 'Draft'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `proposals` MODIFY `status_proposal` ENUM(
                'Draft',
                'Submitted',
                'Administrasi_Valid',
                'Ditolak',
                'Lolos_Didanai'
            ) NOT NULL DEFAULT 'Draft'");
        }
    }
};
