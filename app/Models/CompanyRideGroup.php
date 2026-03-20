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
        'origin_type',
        'destination_type',
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
        'active_days',
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
        'active_days' => 'array',
    ];

    /**
     * Default active days when active_days is not set.
     * Format: 3-letter lowercase abbreviations: mon, tue, wed, thu, fri, sat, sun
     */
    const DEFAULT_ACTIVE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

    /**
     * Check whether this group should run on a given day abbreviation (e.g. 'mon').
     */
    public function isScheduledForDay(string $dayAbbr): bool
    {
        $days = $this->active_days ?? self::DEFAULT_ACTIVE_DAYS;
        return in_array(strtolower($dayAbbr), $days);
    }

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

    public function addMember($employeeId, $pickupAddress = null, $pickupLat = null, $pickupLng = null, $destAddress = null, $destLat = null, $destLng = null)
    {
        if ($this->isFull()) {
            return false;
        }

        return $this->members()->create([
            'employee_id' => $employeeId,
            'pickup_address' => $pickupAddress,
            'pickup_lat' => $pickupLat,
            'pickup_lng' => $pickupLng,
            'destination_address' => $destAddress,
            'destination_lat' => $destLat,
            'destination_lng' => $destLng,
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
