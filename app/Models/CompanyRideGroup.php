<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyRideGroup extends Model
{
    protected $fillable = [
        'company_id',
        'group_name',
        'group_type',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'destination_address',
        'destination_lat',
        'destination_lng',
        'scheduled_time',
        'max_capacity',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'pickup_lat' => 'decimal:7',
        'pickup_lng' => 'decimal:7',
        'destination_lat' => 'decimal:7',
        'destination_lng' => 'decimal:7',
        'scheduled_time' => 'datetime:H:i',
        'start_date' => 'date',
        'end_date' => 'date',
        'max_capacity' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(CompanyRideGroupMember::class, 'ride_group_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CompanyRideGroupAssignment::class, 'ride_group_id');
    }

    public function rideInstances(): HasMany
    {
        return $this->hasMany(CompanyGroupRideInstance::class, 'ride_group_id');
    }

    public function addMember($employeeId, $pickupAddress = null, $lat = null, $lng = null)
    {
        if ($this->isFull()) {
            return false;
        }

        return $this->members()->create([
            'employee_id' => $employeeId,
            'pickup_address' => $pickupAddress,
            'pickup_lat' => $lat,
            'pickup_lng' => $lng,
        ]);
    }

    public function removeMember($employeeId)
    {
        return $this->members()->where('employee_id', $employeeId)->delete();
    }

    public function isFull(): bool
    {
        return $this->members()->count() >= $this->max_capacity;
    }

    public function getAvailableSlots(): int
    {
        return $this->max_capacity - $this->members()->count();
    }
}
