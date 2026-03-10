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
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
            $table->index('phone');
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->index('status');
            $table->index('approval_state');
        });

        Schema::table('rides', function (Blueprint $table) {
            $table->index('status');
            $table->index(['passenger_id', 'status']);
            $table->index(['driver_id', 'status']);
            $table->index('requested_at');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index('type');
            $table->index('status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('company_employees', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('vehicle_types', function (Blueprint $table) {
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['phone']);
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['approval_state']);
        });

        Schema::table('rides', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['passenger_id', 'status']);
            $table->dropIndex(['driver_id', 'status']);
            $table->dropIndex(['requested_at']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('company_employees', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('vehicle_types', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });
    }
};
