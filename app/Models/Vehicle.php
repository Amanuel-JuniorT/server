<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'vehicle_type_id',
        'make',
        'model',
        'plate_number',
        'color',
        'year',
        'capacity',
        'has_air_conditioning',
        'has_child_seat'
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function type()
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }
}
