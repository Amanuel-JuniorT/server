<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Location extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $primaryKey = 'driver_id';
    protected $fillable = ['driver_id', 'latitude', 'longitude', 'updated_at'];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}

