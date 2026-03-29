<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromotionCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'code',
        'discount_type',
        'discount_value',
        'max_discount_amount',
        'min_trip_amount',
        'targeting_rules',
        'total_budget',
        'current_spend',
        'usage_limit_per_user',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'targeting_rules' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'discount_value' => 'float',
        'max_discount_amount' => 'float',
        'min_trip_amount' => 'float',
        'total_budget' => 'float',
        'current_spend' => 'float',
    ];

    /**
     * Get the user promotions associated with this campaign.
     */
    public function userPromotions()
    {
        return $this->hasMany(UserPromotion::class);
    }
}
