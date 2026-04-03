<?php

namespace App\Services;

use App\Models\PromotionCampaign;
use App\Models\UserPromotion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PromotionEngineService
{
    /**
     * Get the best applicable promotion for a user and calculate the discount.
     *
     * @param User $user
     * @param float $originalFare
     * @param array $context Additional context like location, vehicle type, etc.
     * @param string $targetType The type of user searching (passenger or driver)
     * @return array [applied_promotion_id, discount_amount, final_fare]
     */
    public function applyBestPromotion(User $user, float $originalFare, array $context = [], string $targetType = 'passenger')
    {
        $activePromotions = $this->getAvailablePromotionsForUser($user, $targetType);

        if ($activePromotions->isEmpty()) {
            return [
                'applied_promotion_id' => null,
                'discount_amount' => 0,
                'final_fare' => $originalFare
            ];
        }

        $bestDiscount = 0;
        $bestPromotionId = null;

        foreach ($activePromotions as $userPromotion) {
            $campaign = $userPromotion->campaign;

            // Basic eligibility checks
            if ($originalFare < $campaign->min_trip_amount) {
                continue;
            }

            // TODO: Add Geofencing checks using $context['lat'], $context['lng'] if defined in targeting_rules

            $discount = $this->calculateDiscount($campaign, $originalFare);

            // Logic: Pick the best discount. 
            // If discounts are equal, pick the most recently earned one (latest).
            if ($discount > $bestDiscount) {
                $bestDiscount = $discount;
                $bestPromotionId = $campaign->id;
            }
            // If they are equal, we keep the first one found (the newest, due to the query's latest() sort)
        }

        return [
            'applied_promotion_id' => $bestPromotionId,
            'discount_amount' => (float)$bestDiscount,
            'final_fare' => (float)max(0, $originalFare - $bestDiscount)
        ];
    }

    /**
     * Calculate the discount amount for a specific campaign.
     *
     * @param PromotionCampaign $campaign
     * @param float $fare
     * @return float
     */
    private function calculateDiscount(PromotionCampaign $campaign, float $fare)
    {
        $discount = 0;

        switch ($campaign->discount_type) {
            case 'percent':
                $discount = $fare * ($campaign->discount_value / 100);
                if ($campaign->max_discount_amount && $discount > $campaign->max_discount_amount) {
                    $discount = $campaign->max_discount_amount;
                }
                break;
            case 'fixed':
                $discount = $campaign->discount_value;
                break;
            case 'flat_fare':
                $discount = max(0, $fare - $campaign->discount_value);
                break;
        }

        return round($discount, 2);
    }

    /**
     * Get promotions currently in the user's wallet that are valid for use.
     *
     * @param User $user
     * @param string $targetType
     * @return \Illuminate\Support\Collection
     */
    public function getAvailablePromotionsForUser(User $user, string $targetType = 'passenger')
    {
        return UserPromotion::with('campaign')
            ->where('user_id', $user->id)
            ->whereIn('status', ['available', 'applied'])
            ->whereHas('campaign', function ($query) use ($targetType) {
                $query->where('is_active', true)
                    ->where('target_user_type', $targetType)
                    ->where(function ($q) {
                        $q->whereNull('start_date')
                          ->orWhere('start_date', '<=', Carbon::now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                           ->orWhere('end_date', '>=', Carbon::now());
                    });
            })
            ->latest() // Load the most recently earned ones first
            ->get();
    }

    /**
     * Mark a promotion as used and update campaign spending.
     *
     * @param int $userId
     * @param int $campaignId
     * @param int $rideId
     * @param float $discountAmount
     * @return void
     */
    public function markAsUsed(int $userId, int $campaignId, int $rideId, float $discountAmount)
    {
        DB::beginTransaction();
        try {
            $userPromotion = UserPromotion::where('user_id', $userId)
                ->where('promotion_campaign_id', $campaignId)
                ->whereIn('status', ['available', 'applied'])
                ->first();

            if ($userPromotion) {
                $userPromotion->rides_remaining -= 1;
                $userPromotion->used_at = Carbon::now();
                $userPromotion->ride_id = $rideId;
                
                if ($userPromotion->rides_remaining <= 0) {
                    $userPromotion->status = 'used';
                }
                
                $userPromotion->save();
            }

            $campaign = PromotionCampaign::find($campaignId);
            if ($campaign) {
                $campaign->current_spend += $discountAmount;
                // If budget exceeded, auto-deactivate
                if ($campaign->total_budget && $campaign->current_spend >= $campaign->total_budget) {
                    $campaign->is_active = false;
                }
                $campaign->save();
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to mark promotion as used: " . $e->getMessage());
            throw $e;
        }
    }
}
