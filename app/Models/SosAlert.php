<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SosAlert extends Model
{
    protected $fillable = [
        'user_id',
        'ride_id',
        'status',
        'latitude',
        'longitude',
        'message',
        'resolved_by',
        'resolved_at',
        'resolution_note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
