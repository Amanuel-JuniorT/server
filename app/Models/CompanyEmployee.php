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
