<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::creating(function ($transaction) {
            $transaction->signature = $transaction->generateSignature();
        });
    }

    protected $fillable = ['wallet_id', 'amount', 'type', 'note', 'status', 'receipt_path', 'signature'];

    // Enable timestamps since the database has created_at and updated_at columns
    public $timestamps = true;

    /**
     * Generate HMAC signature for transaction integrity.
     */
    public function generateSignature(): string
    {
        $data = implode(':', [
            $this->wallet_id,
            (float) $this->amount,
            $this->type,
            $this->created_at ? $this->created_at->toDateTimeString() : now()->toDateTimeString()
        ]);

        return hash_hmac('sha256', $data, config('app.key'));
    }

    /**
     * Verify the transaction signature.
     */
    public function verifySignature(): bool
    {
        if (!$this->signature) return false;
        return hash_equals($this->signature, $this->generateSignature());
    }

    protected $guarded = [];

    public function wallet()
    {
        return $this->belongsTo(Wallet::class, 'wallet_id');
    }
}
