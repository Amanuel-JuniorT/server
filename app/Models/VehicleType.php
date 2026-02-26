<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class VehicleType extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'image_path',
        'capacity',
        'base_fare',
        'price_per_km',
        'price_per_minute',
        'minimum_fare',
        'waiting_fee_per_minute',
        'commission_percentage',
        'wallet_transaction_percentage',
        'wallet_transaction_fixed_fee',
        'is_active',
    ];

    protected $casts = [
        'base_fare' => 'decimal:2',
        'price_per_km' => 'decimal:2',
        'price_per_minute' => 'decimal:2',
        'minimum_fare' => 'decimal:2',
        'waiting_fee_per_minute' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'wallet_transaction_percentage' => 'decimal:2',
        'wallet_transaction_fixed_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function rides(): HasMany
    {
        return $this->hasMany(Ride::class);
    }
}
