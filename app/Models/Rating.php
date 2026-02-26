<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = ['ride_id', 'from_user_id', 'to_user_id', 'score', 'comment'];

    protected static function boot()
    {
        parent::boot();

        // Update driver's average rating when a new rating is created
        static::created(function ($rating) {
            $rating->updateDriverRating();
        });
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function from()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function to()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * Update the driver's average rating with enhanced calculation
     */
    private function updateDriverRating()
    {
        // Get the driver associated with the rated user
        $driver = Driver::where('user_id', $this->to_user_id)->first();
        
        if ($driver) {
            // Get all ratings for this driver
            $ratings = Rating::where('to_user_id', $this->to_user_id)->get();
            
            if ($ratings->count() > 0) {
                // Calculate enhanced statistics
                $ratingStats = $this->calculateRatingStatistics($ratings);
                
                // Update driver's rating with the calculated average
                $driver->update([
                    'rating' => $ratingStats['average'],
                    'total_ratings' => $ratingStats['total_count'],
                    'rating_breakdown' => json_encode($ratingStats['breakdown'])
                ]);
                
                \Log::info("Updated driver rating for user {$this->to_user_id}: {$ratingStats['average']} (from {$ratingStats['total_count']} ratings)");
            }
        }
    }

    /**
     * Calculate comprehensive rating statistics
     */
    private function calculateRatingStatistics($ratings)
    {
        $totalCount = $ratings->count();
        $scores = $ratings->pluck('score')->toArray();
        
        // Basic average
        $average = round(array_sum($scores) / $totalCount, 2);
        
        // Rating breakdown (count of each star rating)
        $breakdown = [
            5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0
        ];
        
        foreach ($scores as $score) {
            if (isset($breakdown[$score])) {
                $breakdown[$score]++;
            }
        }
        
        // Calculate percentages
        $breakdownPercentages = [];
        foreach ($breakdown as $star => $count) {
            $breakdownPercentages[$star] = [
                'count' => $count,
                'percentage' => round(($count / $totalCount) * 100, 1)
            ];
        }
        
        // Calculate weighted average (optional - gives more weight to recent ratings)
        $weightedAverage = $this->calculateWeightedAverage($ratings);
        
        return [
            'average' => $average,
            'weighted_average' => $weightedAverage,
            'total_count' => $totalCount,
            'breakdown' => $breakdownPercentages,
            'recent_trend' => $this->calculateRecentTrend($ratings)
        ];
    }

    /**
     * Calculate weighted average giving more weight to recent ratings
     */
    private function calculateWeightedAverage($ratings)
    {
        $totalWeight = 0;
        $weightedSum = 0;
        
        foreach ($ratings as $index => $rating) {
            // More recent ratings get higher weight
            $weight = $index + 1; // Simple linear weighting
            $weightedSum += $rating->score * $weight;
            $totalWeight += $weight;
        }
        
        return $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 0;
    }

    /**
     * Calculate recent trend (last 5 ratings vs previous 5)
     */
    private function calculateRecentTrend($ratings)
    {
        $sortedRatings = $ratings->sortByDesc('created_at');
        $recentRatings = $sortedRatings->take(5);
        $previousRatings = $sortedRatings->skip(5)->take(5);
        
        $recentAverage = $recentRatings->count() > 0 ? $recentRatings->avg('score') : 0;
        $previousAverage = $previousRatings->count() > 0 ? $previousRatings->avg('score') : 0;
        
        return [
            'recent_average' => round($recentAverage, 2),
            'previous_average' => round($previousAverage, 2),
            'trend' => $recentAverage > $previousAverage ? 'improving' : ($recentAverage < $previousAverage ? 'declining' : 'stable')
        ];
    }
}

