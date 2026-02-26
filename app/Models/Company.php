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
    'is_active'
  ];

  protected $casts = [
    'is_active' => 'boolean',
    'default_origin_lat' => 'decimal:7',
    'default_origin_lng' => 'decimal:7',
  ];

  public function employees(): HasMany
  {
    return $this->hasMany(CompanyEmployee::class);
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
