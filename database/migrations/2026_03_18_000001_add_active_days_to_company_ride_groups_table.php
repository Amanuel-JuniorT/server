<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_ride_groups', function (Blueprint $table) {
            // JSON array of day abbreviations: ["mon","tue","wed","thu","fri"]
            // null means "use system default" (weekdays Mon-Fri)
            $table->json('active_days')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('company_ride_groups', function (Blueprint $table) {
            $table->dropColumn('active_days');
        });
    }
};
