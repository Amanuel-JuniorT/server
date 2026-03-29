<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivityStat extends Model
{
    protected $fillable = ['user_id', 'date', 'rides_completed_count'];

    protected $casts = [
        'date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
