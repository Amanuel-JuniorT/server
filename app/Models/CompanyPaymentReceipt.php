<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyPaymentReceipt extends Model
{
    protected $fillable = [
        'company_id',
        'contract_period_start',
        'contract_period_end',
        'receipt_image_url',
        'amount',
        'status',
        'submitted_at',
        'verified_at',
        'verified_by',
        'rejection_reason',
    ];

    protected $casts = [
        'contract_period_start' => 'date',
        'contract_period_end' => 'date',
        'amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function verify($adminId)
    {
        $this->status = 'verified';
        $this->verified_at = now();
        $this->verified_by = $adminId;
        $this->save();
    }

    public function reject($adminId, $reason)
    {
        $this->status = 'rejected';
        $this->verified_at = now();
        $this->verified_by = $adminId;
        $this->rejection_reason = $reason;
        $this->save();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
