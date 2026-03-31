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
            ['rides_completed_count' => \Illuminate\Support\Facades\DB::raw('rides_completed_count + 1')]
        );
    }

    /**
     * Check if user reached a streak milestone.
     * Uses the user's streak_progress counter (reset after reward).
     */
    protected function checkStreakReward(User $user)
    {
        $target = (int) $this->config->get('streak_target_rides', 5);

        // Atomically increment the counter
        $user->increment('streak_progress');
        $user->refresh();
        $currentProgress = (int) $user->streak_progress;

        Log::info("Streak progress for User {$user->id}: {$currentProgress}/{$target}");

        if ($currentProgress >= $target) {
            // Guard: avoid double-rewarding within same week
            $alreadyAwarded = UserPromotion::where('user_id', $user->id)
                ->where('metadata->type', 'streak_reward')
                ->where('created_at', '>=', now()->subDays(7))
                ->exists();

            if (!$alreadyAwarded) {
                $discountType = $this->config->get('streak_reward_type', 'flat');
                $discountValue = (float) $this->config->get('streak_reward_amount', 50);

                $this->issueReward($user, 'streak_reward', "🏆 You completed {$target} rides! Your reward is ready.", $discountType, $discountValue);
                // Reset so the next cycle starts fresh
                $user->update(['streak_progress' => 0]);
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
                // Award Invitee (The new user)
                $inviteeType = $this->config->get('referral_invitee_reward_type', 'percent');
                $inviteeValue = (float) $this->config->get('referral_invitee_reward_amount', 30);
                $this->issueReward($user, 'referral_invitee', "Welcome Gift! Thanks for joining.", $inviteeType, $inviteeValue);

                // Award Inviter (The parent referrer)
                $inviterType = $this->config->get('referral_inviter_reward_type', 'flat');
                $inviterValue = (float) $this->config->get('referral_inviter_reward_amount', 50);
                $this->issueReward($referrer, 'referral_inviter', "Referral Reward! Your friend just took their first ride.", $inviterType, $inviterValue);
            }
        }
    }

    /**
     * Issue a voucher from a specialized campaign.
     * Uses updateOrCreate to ensure dynamic config changes apply to new vouchers immediately.
     */
    protected function issueReward(User $user, string $type, string $message, string $discountType = 'flat', float $discountValue = 50.0)
    {
        // Update or create a hidden system campaign for this reward
        $campaign = PromotionCampaign::updateOrCreate(
            ['code' => strtoupper($type)],
            [
                'name' => ucwords(str_replace('_', ' ', $type)),
                'description' => "Automated reward for {$type}",
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
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
