<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RidePackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ride_count',
        'price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'ride_count' => 'integer',
    ];

    public function purchases()
    {
        return $this->hasMany(CompanyPackagePurchase::class, 'package_id');
    }
}
