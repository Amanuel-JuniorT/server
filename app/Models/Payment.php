<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['ride_id', 'amount', 'method', 'status', 'paid_at'];

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
