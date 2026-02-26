<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'company_id',
        'email_verified_at',
        'is_active',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'company_id' => 'integer',
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the company that this admin manages
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Check if admin is a super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if admin is a company admin
     */
    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }

    /**
     * Check if admin is valid and active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if admin can manage a specific company
     */
    public function canManageCompany($companyId): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->isCompanyAdmin() && $this->company_id == $companyId;
    }

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        // Use the ResendEmailService to send the verification email
        // We resolve it from the container since we can't inject into a model easily
        $resendService = app(\App\Services\ResendEmailService::class);
        $resendService->sendVerificationEmail($this);
    }
}
