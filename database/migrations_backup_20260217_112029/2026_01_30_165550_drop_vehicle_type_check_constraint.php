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
        // For PostgreSQL, changing an enum to a string doesn't always drop the check constraint
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to restore the constraint if we're not rolling back the column type change
    }
};
