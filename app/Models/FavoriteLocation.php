<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FavoriteLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'type',
        'label',
        'is_active',
        'timestamp',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'latitude' => 'double',
        'longitude' => 'double',
        'timestamp' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
