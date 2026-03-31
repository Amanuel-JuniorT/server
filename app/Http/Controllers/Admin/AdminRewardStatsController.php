<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserPromotion;
use App\Models\PromotionCampaign;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminRewardStatsController extends Controller
{
    public function index(Request $request)
    {
        $timeRange = $request->get('range', '30'); // Default 30 days
        $startDate = Carbon::now()->subDays((int)$timeRange);

        // 1. High-Level Summary Stats
        $stats = [
            'total_redeemed' => UserPromotion::where('status', 'applied')->count(),
            'total_issued' => UserPromotion::count(),
            'total_active_value' => DB::table('user_promotions')
                ->join('promotion_campaigns', 'user_promotions.promotion_campaign_id', '=', 'promotion_campaigns.id')
                ->where('user_promotions.status', 'available')
                ->sum('promotion_campaigns.discount_value'),
            'streak_wins' => UserPromotion::whereHas('campaign', function($q) {
                $q->where('name', 'like', '%Streak%');
            })->count(),
            'promo_code_redemptions' => UserPromotion::whereHas('campaign', function($q) {
                $q->whereNotNull('code');
            })->count(),
        ];

        // 2. Time-series Trend Data (Last X Days)
        $trends = UserPromotion::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as redeemed")
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 3. User Leaderboard (Top 10 Earners)
        $topEarners = User::withCount('userPromotions')
            ->whereHas('userPromotions')
            ->orderBy('user_promotions_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'count' => $user->user_promotions_count,
                    'profile_picture' => $user->profile_image ? \Storage::url($user->profile_image) : null
                ];
            });

        // 4. Recent "Winner" Activity Feed
        $recentActivity = UserPromotion::with(['user', 'campaign'])
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get()
            ->map(function($up) {
                return [
                    'id' => $up->id,
                    'user_name' => $up->user->name ?? 'Unknown',
                    'campaign_name' => $up->campaign->name,
                    'type' => str_contains(strtolower($up->campaign->name), 'streak') ? 'streak' : 'promo',
                    'amount' => $up->campaign->discount_value,
                    'discount_type' => $up->campaign->discount_type,
                    'time_ago' => $up->created_at->diffForHumans(),
                    'date' => $up->created_at->format('M d, H:i')
                ];
            });

        return Inertia::render('admin/rewards-analytics', [
            'stats' => $stats,
            'trends' => $trends,
            'topEarners' => $topEarners,
            'recentActivity' => $recentActivity,
            'filters' => [
                'range' => $timeRange
            ]
        ]);
    }
}
