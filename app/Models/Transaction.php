<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = ['wallet_id', 'amount', 'type', 'note', 'status', 'receipt_path'];

    // Enable timestamps since the database has created_at and updated_at columns
    public $timestamps = true;

    // Only allow these specific fields
    protected $guarded = [];

    public function wallet()
    {
        return $this->belongsTo(Wallet::class, 'wallet_id');
    }
}
