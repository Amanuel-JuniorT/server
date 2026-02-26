<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'document_type',
        'file_path',
        'status',
        'uploaded_at',
        'reviewed_at',
        'reviewed_by',
        'rejection_reason'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
