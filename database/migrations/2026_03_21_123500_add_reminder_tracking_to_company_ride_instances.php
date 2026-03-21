<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->boolean('reminder_2h_sent')->default(false)->after('scheduled_notification_sent');
            $table->boolean('reminder_1h_sent')->default(false)->after('reminder_2h_sent');
            $table->boolean('reminder_go_sent')->default(false)->after('reminder_1h_sent');
        });
    }

    public function down(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->dropColumn(['reminder_2h_sent', 'reminder_1h_sent', 'reminder_go_sent']);
        });
    }
};
