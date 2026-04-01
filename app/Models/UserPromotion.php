<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPromotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'promotion_campaign_id',
        'status',
        'rides_remaining',
        'used_at',
        'expires_at',
        'ride_id',
        'metadata',
    ];

    protected $casts = [
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
        'rides_remaining' => 'integer',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campaign()
    {
        return $this->belongsTo(PromotionCampaign::class, 'promotion_campaign_id');
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
