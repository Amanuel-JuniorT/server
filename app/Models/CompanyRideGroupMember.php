<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyRideGroupMember extends Model
{
    protected $fillable = [
        'ride_group_id',
        'employee_id',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
    ];

    protected $casts = [
        'pickup_lat' => 'decimal:7',
        'pickup_lng' => 'decimal:7',
    ];

    public function rideGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyRideGroup::class, 'ride_group_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
