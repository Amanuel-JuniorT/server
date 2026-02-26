<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyRideGroupAssignment extends Model
{
    protected $fillable = [
        'ride_group_id',
        'driver_id',
        'company_id',
        'start_date',
        'end_date',
        'days_of_week',
        'status',
        'accepted_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'days_of_week' => 'array',
        'accepted_at' => 'datetime',
    ];

    public function rideGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyRideGroup::class, 'ride_group_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function accept()
    {
        $this->status = 'accepted';
        $this->accepted_at = now();
        $this->save();
    }

    public function activate()
    {
        $this->status = 'active';
        $this->save();
    }

    public function complete()
    {
        $this->status = 'completed';
        $this->save();
    }

    public function isActive(): bool
    {
        return $this->status === 'active' &&
            now()->between($this->start_date, $this->end_date);
    }
}
