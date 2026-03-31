<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\SystemConfiguration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaults = [
            // General
            ['key' => 'streak_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'rewards', 'description' => 'Enable milestone streak rewards for passengers'],
            ['key' => 'referral_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'rewards', 'description' => 'Enable automatic referral payout system'],
            
            // Passenger Streaks
            ['key' => 'streak_target_rides', 'value' => '5', 'type' => 'integer', 'group' => 'rewards', 'description' => 'Rides required to hit a streak'],
            ['key' => 'streak_reward_amount', 'value' => '50', 'type' => 'integer', 'group' => 'rewards', 'description' => 'ETB rewarded for completing a streak'],
            ['key' => 'streak_reward_type', 'value' => 'fixed', 'type' => 'string', 'group' => 'rewards', 'description' => 'fixed or percent'],
            
            // Referrals
            ['key' => 'referral_inviter_reward_amount', 'value' => '50', 'type' => 'integer', 'group' => 'rewards', 'description' => 'Reward for the person sharing the code'],
            ['key' => 'referral_inviter_reward_type', 'value' => 'fixed', 'type' => 'string', 'group' => 'rewards', 'description' => 'fixed or percent'],
            ['key' => 'referral_invitee_reward_amount', 'value' => '30', 'type' => 'integer', 'group' => 'rewards', 'description' => 'Reward for the person using a code'],
            ['key' => 'referral_invitee_reward_type', 'value' => 'percent', 'type' => 'string', 'group' => 'rewards', 'description' => 'fixed or percent'],
        ];

        foreach ($defaults as $config) {
            SystemConfiguration::firstOrCreate(['key' => $config['key']], $config);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't typically delete configurations on rollback to prevent data loss
    }
};
