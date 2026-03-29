<?php

namespace App\Services;

use App\Models\User;
use App\Models\Ride;
use App\Models\UserActivityStat;
use App\Models\PromotionCampaign;
use App\Models\UserPromotion;
use App\Services\AppConfigService;
use App\Services\UnifiedNotificationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PromotionAutomationService
{
    protected $config;
    protected $notificationService;

    public function __construct(AppConfigService $config, UnifiedNotificationService $notificationService)
    {
        $this->config = $config;
        $this->notificationService = $notificationService;
    }

    /**
     * Handle logic when a ride is completed.
     */
    public function handleRideCompleted(Ride $ride)
    {
        $this->updateUserActivity($ride);
        
        // 1. Check for Streak Reward
        if ($this->config->get('streak_enabled', false)) {
            $this->checkStreakReward($ride->passenger);
        }

        // 2. Check for Referral Reward (if first ride)
        if ($this->config->get('referral_enabled', false)) {
            $rideCount = Ride::where('passenger_id', $ride->passenger_id)
                ->where('status', 'completed')
                ->count();
            
            if ($rideCount === 1) {
                $this->processReferralReward($ride->passenger);
            }
        }
    }

    /**
     * Update daily ride count for streaks.
     */
    protected function updateUserActivity(Ride $ride)
    {
        UserActivityStat::updateOrCreate(
            ['user_id' => $ride->passenger_id, 'date' => now()->toDateString()],
            ['rides_completed_count' => \DB::raw('rides_completed_count + 1')]
        );
    }

    /**
     * Check if user reached a streak milestone.
     */
    protected function checkStreakReward(User $user)
    {
        $target = $this->config->get('streak_target_rides', 5);
        
        $totalRidesInWeek = UserActivityStat::where('user_id', $user->id)
            ->where('date', '>=', now()->subDays(7)->toDateString())
            ->sum('rides_completed_count');

        if ($totalRidesInWeek >= $target) {
            // Check if already awarded this week to avoid double-dipping
            $alreadyAwarded = UserPromotion::where('user_id', $user->id)
                ->where('metadata->type', 'streak_reward')
                ->where('created_at', '>=', now()->subDays(7))
                ->exists();

            if (!$alreadyAwarded) {
                $this->issueReward($user, 'streak_reward', "Streak Achievement!");
            }
        }
    }

    /**
     * Process referral reward for both parties.
     */
    protected function processReferralReward(User $user)
    {
        if ($user->referred_by_id) {
            $referrer = User::find($user->referred_by_id);
            
            if ($referrer) {
                // Award both
                $this->issueReward($user, 'referral_invitee', "Welcome Gift! Thanks for joining.");
                $this->issueReward($referrer, 'referral_inviter', "Referral Reward! Your friend just took their first ride.");
            }
        }
    }

    /**
     * Issue a voucher from a specialized campaign.
     */
    protected function issueReward(User $user, string $type, string $message)
    {
        // Find or create a hidden system campaign for this reward
        $campaign = PromotionCampaign::firstOrCreate(
            ['code' => strtoupper($type)],
            [
                'name' => ucwords(str_replace('_', ' ', $type)),
                'description' => "Automated reward for {$type}",
                'discount_type' => 'percent',
                'discount_value' => $this->config->get('referral_reward_amount', 20),
                'is_active' => true,
                'usage_limit_per_user' => 1
            ]
        );

        UserPromotion::create([
            'user_id' => $user->id,
            'promotion_campaign_id' => $campaign->id,
            'status' => 'available',
            'rides_remaining' => 1,
            'metadata' => ['type' => $type]
        ]);

        // Notify user
        $this->notificationService->notifyUser(
            $user->id,
            "You've earned a reward!",
            $message,
            ['type' => 'reward_earned', 'reward_type' => $type]
        );
        
        Log::info("Reward issued: {$type} to User ID: {$user->id}");
    }
}
