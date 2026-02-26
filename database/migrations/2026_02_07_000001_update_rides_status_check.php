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
    if (DB::getDriverName() !== 'sqlite') {
      // Drop old constraint
      DB::statement("ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check");

      // Add new constraint including 'expired' and 'failed'
      DB::statement("ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled', 'scheduled', 'started', 'expired', 'failed'))");
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    if (DB::getDriverName() !== 'sqlite') {
      DB::statement("ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check");
      DB::statement("ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled', 'scheduled', 'started'))");
    }
  }
};
