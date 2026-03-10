<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ride extends Model
{
    use HasFactory;

    protected $casts = [
        'rejected_driver_ids' => 'array',
        'is_pool_enabled' => 'boolean',
        'passenger_accepts_pooling' => 'boolean',
        'is_pool_ride' => 'boolean',
        'cash_payment' => 'boolean',
        'prepaid' => 'boolean',
        'is_straight_hail' => 'boolean',
    ];

    protected $appends = ['driver_name', 'notified_driver_name', 'notified_driver_phone'];

    protected $fillable = [
        'passenger_id',
        'driver_id',
        'origin_lat',
        'origin_lng',
        'destination_lat',
        'destination_lng',
        'pickup_address',
        'destination_address',
        'price',
        'status',
        'requested_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'arrived_at',
        'cash_payment',
        'prepaid',
        'is_straight_hail',
        'rejected_driver_ids',
        'is_pool_enabled',
        'passenger_accepts_pooling',
        'encoded_route',
        'is_pool_ride',
        'parent_ride_id',
        'pool_partner_ride_id',
        'vehicle_type_id',
        'actual_distance',
        'actual_duration',
        'waiting_minutes',
        'calculated_fare',
        'dispatched_by_admin_id',
        'cancelled_by',
        'notified_driver_id',
        'notified_drivers_count'
    ];

    public function passenger()
    {
        return $this->belongsTo(User::class, 'passenger_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }

    public function notifiedDriver()
    {
        return $this->belongsTo(Driver::class, 'notified_driver_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function rating()
    {
        return $this->hasOne(Rating::class);
    }

    /**
     * The parent ride if this is a pool ride
     */
    public function parentRide()
    {
        return $this->belongsTo(Ride::class, 'parent_ride_id');
    }

    /**
     * The pool partner ride
     */
    public function poolPartner()
    {
        return $this->belongsTo(Ride::class, 'pool_partner_ride_id');
    }

    /**
     * Child pool rides
     */
    public function poolRides()
    {
        return $this->hasMany(Ride::class, 'parent_ride_id');
    }

    /**
     * Check if this ride is part of a pool
     */
    public function isPooled()
    {
        return $this->is_pool_ride || $this->pool_partner_ride_id !== null;
    }

    public function getDriverNameAttribute()
    {
        return $this->driver && $this->driver->user ? $this->driver->user->name : null;
    }

    public function getNotifiedDriverNameAttribute()
    {
        return $this->notifiedDriver && $this->notifiedDriver->user ? $this->notifiedDriver->user->name : null;
    }

    public function getNotifiedDriverPhoneAttribute()
    {
        return $this->notifiedDriver && $this->notifiedDriver->user ? $this->notifiedDriver->user->phone : null;
    }
}
