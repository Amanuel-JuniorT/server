<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // PostgreSQL specific: Drop the enum check constraint that Laravel creates
        DB::statement('ALTER TABLE company_package_purchases DROP CONSTRAINT IF EXISTS company_package_purchases_status_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-adding the constraint is complex without knowing exactly which Laravel version generated it,
        // so we leave it as a string column which is safer for future expansions.
    }
};
