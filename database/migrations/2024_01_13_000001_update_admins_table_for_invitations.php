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
    Schema::table('admins', function (Blueprint $table) {
      // Add email verification and active status if they don't exist
      if (!Schema::hasColumn('admins', 'email_verified_at')) {
        $table->timestamp('email_verified_at')->nullable()->after('email');
      }
      if (!Schema::hasColumn('admins', 'is_active')) {
        $table->boolean('is_active')->default(true)->after('password');
      }
      // Ensure role column exists (migration might have it, but checking to be safe or update default)
      if (!Schema::hasColumn('admins', 'role')) {
        $table->string('role')->default('admin')->after('name');
      }
      // Ensure company_id is nullable (it should be for super admins)
      if (Schema::hasColumn('admins', 'company_id')) {
        $table->unsignedBigInteger('company_id')->nullable()->change();
      } else {
        $table->unsignedBigInteger('company_id')->nullable()->after('role');
      }
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('admins', function (Blueprint $table) {
      $table->dropColumn(['email_verified_at', 'is_active']);
      // We generally don't drop role or company_id if they might have been there before, 
      // but for a clean rollback we could if we knew they were added here.
      // For safety, let's just drop the new ones.
    });
  }
};
