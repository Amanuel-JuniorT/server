<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyGroupRideInstance extends Model
{
  protected $table = 'company_group_ride_instances';

  protected $fillable = [
    'company_id',
    'employee_id',
    'driver_id',
    'ride_group_id',
    'origin_lat',
    'origin_lng',
    'destination_lat',
    'destination_lng',
    'pickup_address',
    'destination_address',
    'price',
    'scheduled_time',
    'status',
    'assignment_retry_count',
    'requested_at',
    'accepted_at',
    'started_at',
    'completed_at',
    'scheduled_notification_sent',
    'opted_out_employees',
    'cancelled_by',
    'cancellation_reason',
  ];

  protected $casts = [
    'origin_lat' => 'decimal:7',
    'origin_lng' => 'decimal:7',
    'destination_lat' => 'decimal:7',
    'destination_lng' => 'decimal:7',
    'price' => 'decimal:2',
    'scheduled_time' => 'datetime',
    'requested_at' => 'datetime',
    'accepted_at' => 'datetime',
    'started_at' => 'datetime',
    'completed_at' => 'datetime',
    'opted_out_employees' => 'array',
  ];

  protected $appends = [
    'time_label',
    'is_expired',
  ];

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }

  public function employee(): BelongsTo
  {
    return $this->belongsTo(User::class, 'employee_id');
  }

  public function driver(): BelongsTo
  {
    return $this->belongsTo(Driver::class);
  }

  public function rideGroup(): BelongsTo
  {
    return $this->belongsTo(CompanyRideGroup::class, 'ride_group_id');
  }

  /**
   * Check if ride is active
   */
  public function isActive(): bool
  {
    return in_array($this->status, ['requested', 'accepted', 'in_progress']);
  }

  /**
   * Check if a given user has opted out of this ride instance.
   */
  public function isEmployeeOptedOut(int $userId): bool
  {
    return in_array($userId, $this->opted_out_employees ?? []);
  }

  /**
   * Add a user to the opted-out list for this instance.
   */
  public function optOut(int $userId): void
  {
    $current = $this->opted_out_employees ?? [];
    if (!in_array($userId, $current)) {
      $current[] = $userId;
      $this->opted_out_employees = $current;
      $this->save();
    }
  }

  /**
   * Check if ride is completed
   */
  public function isCompleted(): bool
  {
    return $this->status === 'completed';
  }

  /**
   * Whether a scheduled ride has passed without completion/acceptance
   */
  public function getIsExpiredAttribute(): bool
  {
    if (!$this->scheduled_time) {
      return false;
    }
    return $this->scheduled_time->lt(now()) && in_array($this->status, ['requested']);
  }

  /**
   * Human label based on scheduled_time relative to now
   * Values: expired, past, today, upcoming, none
   */
  public function getTimeLabelAttribute(): string
  {
    if (!$this->scheduled_time) {
      return 'none';
    }

    $scheduled = $this->scheduled_time;
    $todayStart = now()->startOfDay();
    $todayEnd = now()->endOfDay();

    if ($this->getIsExpiredAttribute()) {
      return 'expired';
    }

    if ($scheduled->lt($todayStart)) {
      return 'past';
    }

    if ($scheduled->between($todayStart, $todayEnd)) {
      return 'today';
    }

    return 'upcoming';
  }
}
