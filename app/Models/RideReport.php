<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RideReport extends Model
{
    protected $fillable = [
        'ride_instance_id',
        'company_id',
        'driver_id',
        'passenger_ids',
        'total_amount',
        'driver_earnings',
        'platform_commission',
        'origin_address',
        'destination_address',
        'completed_at',
    ];

    protected $casts = [
        'passenger_ids' => 'array',
        'total_amount' => 'decimal:2',
        'driver_earnings' => 'decimal:2',
        'platform_commission' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function rideInstance(): BelongsTo
    {
        return $this->belongsTo(CompanyGroupRideInstance::class, 'ride_instance_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
