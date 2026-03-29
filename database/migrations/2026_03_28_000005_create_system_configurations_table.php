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
        Schema::create('system_configurations', function (Blueprint $row) {
            $row->id();
            $row->string('key')->unique();
            $row->text('value')->nullable();
            $row->string('type')->default('string'); // boolean, integer, decimal, string, json
            $row->string('group')->default('general'); // rewards, billing, safety, etc.
            $row->text('description')->nullable();
            $row->timestamps();
        });

        // Seed initial reward configurations
        DB::table('system_configurations')->insert([
            [
                'key' => 'referral_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'rewards',
                'description' => 'Enable or disable the referral system globally.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'referral_reward_amount',
                'value' => '20',
                'type' => 'decimal',
                'group' => 'rewards',
                'description' => 'Discount percentage for both referral parties.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'streak_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'rewards',
                'description' => 'Enable or disable the ride streak rewards system.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'streak_target_rides',
                'value' => '5',
                'type' => 'integer',
                'group' => 'rewards',
                'description' => 'Number of rides required in a 7-day period to earn a reward.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_configurations');
    }
};
