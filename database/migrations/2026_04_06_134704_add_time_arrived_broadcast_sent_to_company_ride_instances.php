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
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->boolean('time_arrived_broadcast_sent')->default(false)->after('reminder_go_sent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->dropColumn('time_arrived_broadcast_sent');
        });
    }
};
