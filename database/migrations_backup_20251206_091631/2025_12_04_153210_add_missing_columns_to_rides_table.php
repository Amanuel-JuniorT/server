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
        Schema::table('rides', function (Blueprint $table) {
            // Add missing columns that are in the Ride model's $fillable array
            if (!Schema::hasColumn('rides', 'pickup_address')) {
                $table->string('pickup_address')->nullable();
            }
            if (!Schema::hasColumn('rides', 'destination_address')) {
                $table->string('destination_address')->nullable();
            }
            if (!Schema::hasColumn('rides', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable();
            }
            if (!Schema::hasColumn('rides', 'cash_payment')) {
                $table->boolean('cash_payment')->default(true);
            }
            if (!Schema::hasColumn('rides', 'prepaid')) {
                $table->boolean('prepaid')->default(false);
            }
            if (!Schema::hasColumn('rides', 'is_straight_hail')) {
                $table->boolean('is_straight_hail')->default(false);
            }
            if (!Schema::hasColumn('rides', 'rejected_driver_ids')) {
                $table->json('rejected_driver_ids')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn([
                'pickup_address',
                'destination_address',
                'cancelled_at',
                'cash_payment',
                'prepaid',
                'is_straight_hail',
                'rejected_driver_ids'
            ]);
        });
    }
};
