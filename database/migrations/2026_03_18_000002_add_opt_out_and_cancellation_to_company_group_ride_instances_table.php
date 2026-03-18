<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            // JSON array of user IDs who opted-out of this daily instance
            $table->json('opted_out_employees')->nullable()->after('scheduled_notification_sent');

            // Who cancelled (driver or admin) and their reason
            $table->enum('cancelled_by', ['driver', 'admin'])->nullable()->after('opted_out_employees');
            $table->text('cancellation_reason')->nullable()->after('cancelled_by');

            // Track when driver accepted this specific daily instance
            $table->timestamp('accepted_at')->nullable()->after('cancellation_reason');
        });
    }

    public function down(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->dropColumn(['opted_out_employees', 'cancelled_by', 'cancellation_reason', 'accepted_at']);
        });
    }
};
