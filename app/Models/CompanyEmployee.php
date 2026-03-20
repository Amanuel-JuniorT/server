<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyEmployee extends Model
{
  protected $fillable = [
    'company_id',
    'user_id',
    'status',
    'requested_at',
    'approved_at',
    'rejected_at',
    'left_at',
    'approved_by',
    'rejection_reason',
    'home_address',
    'home_lat',
    'home_lng'
  ];

  protected $casts = [
    'requested_at' => 'datetime',
    'approved_at' => 'datetime',
    'rejected_at' => 'datetime',
    'left_at' => 'datetime',
  ];

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function approver(): BelongsTo
  {
    return $this->belongsTo(Admin::class, 'approved_by');
  }

  /**
   * The "booted" method of the model.
   */
  protected static function booted()
  {
      static::updated(function ($employee) {
          // If status changed to 'left', remove from all ride groups
          if ($employee->isDirty('status') && $employee->status === 'left') {
              \Illuminate\Support\Facades\DB::table('company_ride_group_members')
                  ->where('employee_id', $employee->user_id)
                  ->whereIn('ride_group_id', function($query) use ($employee) {
                      $query->select('id')
                          ->from('company_ride_groups')
                          ->where('company_id', $employee->company_id);
                  })
                  ->delete();
          }
      });

      static::deleted(function ($employee) {
          // If the relationship is deleted, also remove from ride groups
          \Illuminate\Support\Facades\DB::table('company_ride_group_members')
              ->where('employee_id', $employee->user_id)
              ->whereIn('ride_group_id', function($query) use ($employee) {
                  $query->select('id')
                      ->from('company_ride_groups')
                      ->where('company_id', $employee->company_id);
              })
              ->delete();
      });
  }

  /**
   * Check if employee is currently active
   */
  public function isActive(): bool
  {
    return $this->status === 'approved';
  }

  /**
   * Check if employee is pending approval
   */
  public function isPending(): bool
  {
    return $this->status === 'pending';
  }
}
