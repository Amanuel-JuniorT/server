<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyPackagePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'package_id',
        'rides_purchased',
        'rides_remaining',
        'amount_paid',
        'status',
        'company_payment_receipt_id',
    ];

    protected $casts = [
        'rides_purchased' => 'integer',
        'rides_remaining' => 'integer',
        'amount_paid' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function package()
    {
        return $this->belongsTo(RidePackage::class, 'package_id');
    }

    public function receipt()
    {
        return $this->belongsTo(CompanyPaymentReceipt::class, 'company_payment_receipt_id');
    }

    /**
     * Scope to only include active purchases with remaining rides.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('rides_remaining', '>', 0);
    }
}
