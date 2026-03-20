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
        // Add billing and security fields to existing tables
        Schema::table('companies', function (Blueprint $table) {
            $table->enum('billing_type', ['prepaid', 'weekly_postpaid', 'monthly_postpaid'])->default('prepaid')->after('is_active');
            $table->decimal('credit_limit', 12, 2)->default(0)->after('billing_type');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('signature')->nullable()->after('status');
        });

        // Create ride_reports table for multi-stakeholder transparency
        Schema::create('ride_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_instance_id')->constrained('company_group_ride_instances');
            $table->foreignId('company_id')->constrained('companies');
            $table->foreignId('driver_id')->nullable()->constrained('drivers');
            $table->json('passenger_ids'); // List of participants
            $table->decimal('total_amount', 10, 2);
            $table->decimal('driver_earnings', 10, 2);
            $table->decimal('platform_commission', 10, 2);
            $table->string('origin_address');
            $table->string('destination_address');
            $table->timestamp('completed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ride_reports');
        
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('signature');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['billing_type', 'credit_limit']);
        });
    }
};
