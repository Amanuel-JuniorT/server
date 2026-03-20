<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
  protected $fillable = [
    'name',
    'code',
    'description',
    'address',
    'default_pickup_address',
    'default_origin_lat',
    'default_origin_lng',
    'phone',
    'email',
    'is_active',
    'billing_type',
    'credit_limit'
  ];

  protected $casts = [
    'is_active' => 'boolean',
    'default_origin_lat' => 'decimal:7',
    'default_origin_lng' => 'decimal:7',
    'billing_type' => 'string',
    'credit_limit' => 'decimal:2',
  ];

  protected $appends = ['setup_status'];

  /**
   * Get the company setup status (for onboarding)
   */
  public function getSetupStatusAttribute(): array
  {
    $steps = [
      ['id' => 'profile', 'title' => 'Basic Profile Info', 'description' => 'Company name and email address', 'completed' => !empty($this->name) && !empty($this->email)],
      ['id' => 'phone', 'title' => 'Contact Number', 'description' => 'A valid phone number for the company', 'completed' => !empty($this->phone)],
      ['id' => 'address', 'title' => 'Office Address', 'description' => 'Full physical address of the company', 'completed' => !empty($this->address)],
      ['id' => 'location', 'title' => 'Map Location', 'description' => 'Pin the office location on the map', 'completed' => !empty($this->default_origin_lat) && !empty($this->default_origin_lng)],
    ];

    $totalSteps = count($steps);
    $completedSteps = count(array_filter($steps, fn($step) => $step['completed']));
    $progress = ($totalSteps > 0) ? round(($completedSteps / $totalSteps) * 100) : 100;
    $isComplete = ($totalSteps > 0) ? ($completedSteps === $totalSteps) : true;

    return [
      'progress' => $progress,
      'is_complete' => $isComplete,
      'steps' => $steps,
      'missing_fields' => array_keys(array_filter([
        'email' => empty($this->email),
        'phone' => empty($this->phone),
        'address' => empty($this->address),
        'location' => empty($this->default_origin_lat) || empty($this->default_origin_lng),
      ])),
    ];
  }

  public function employees(): HasMany
  {
    return $this->hasMany(CompanyEmployee::class);
  }

  public function wallet()
  {
    return $this->hasOne(Wallet::class);
  }

  public function rides(): HasMany
  {
    return $this->hasMany(CompanyGroupRideInstance::class);
  }

  public function driverContracts(): HasMany
  {
    return $this->hasMany(CompanyDriverContract::class);
  }

  /**
   * Get contracted drivers (through active contracts)
   */
  public function contractedDrivers()
  {
    return $this->belongsToMany(Driver::class, 'company_driver_contracts', 'company_id', 'driver_id')
      ->wherePivot('status', 'active')
      ->wherePivot('start_date', '<=', now()->toDateString())
      ->where(function ($query) {
        $query->whereNull('company_driver_contracts.end_date')
          ->orWhere('company_driver_contracts.end_date', '>=', now()->toDateString());
      })
      ->withTimestamps();
  }

  /**
   * Generate a unique company code
   */
  public static function generateCode(): string
  {
    do {
      $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
    } while (self::where('code', $code)->exists());

    return $code;
  }

  /**
   * Get active employees count
   */
  public function getActiveEmployeesCountAttribute(): int
  {
    return $this->employees()->where('status', 'approved')->count();
  }
}
