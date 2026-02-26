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
        // SQLite doesn't support DROP CONSTRAINT, so we skip this for SQLite
        if (DB::getDriverName() !== 'sqlite') {
            // Drop the existing check constraint
            DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check');
            
            // Add the new check constraint with payment type
            DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('topup', 'withdraw', 'transfer', 'payment'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // SQLite doesn't support DROP CONSTRAINT, so we skip this for SQLite
        if (DB::getDriverName() !== 'sqlite') {
            // Drop the new check constraint
            DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check');
            
            // Restore the original check constraint
            DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('topup', 'withdraw', 'transfer'))");
        }
    }
};