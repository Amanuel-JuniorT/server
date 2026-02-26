<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pooling extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'passenger_id',
        'driver_id',
        'origin_lat',
        'origin_lng',
        'destination_lat',
        'destination_lng',
        'status',
        'requested_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships

    /**
     * The main ride that initiated the pooling.
     */
    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    /**
     * The passenger who initiated the pooling.
     */
    public function passenger()
    {
        return $this->belongsTo(User::class, 'passenger_id');
    }

    /**
     * The driver who accepted the pooling.
     */
    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
