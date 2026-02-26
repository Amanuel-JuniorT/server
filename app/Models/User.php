<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;


    protected $fillable = ['name', 'email', 'phone', 'password', 'role', 'is_active', 'is_employee', 'company_id', 'company_name', 'fcm_token', 'privacy_settings'];

    protected $casts = [
        'privacy_settings' => 'array',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function driver()
    {
        return $this->hasOne(Driver::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class, 'passenger_id');
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function ratingsGiven()
    {
        return $this->hasMany(Rating::class, 'from_user_id');
    }

    public function ratingsReceived()
    {
        return $this->hasMany(Rating::class, 'to_user_id');
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function companyEmployee()
    {
        return $this->hasMany(CompanyEmployee::class);
    }

    public function companyRides()
    {
        return $this->hasMany(CompanyGroupRideInstance::class, 'employee_id');
    }

    public function favorites()
    {
        return $this->hasMany(FavoriteLocation::class);
    }

    /**
     * Check if user is an employee
     */
    public function isEmployee(): bool
    {
        return $this->is_employee && $this->company_id !== null;
    }

    /**
     * Get the current/latest company employee relationship
     */
    public function getLatestCompanyEmployee()
    {
        return $this->companyEmployee()->orderBy('created_at', 'desc')->first();
    }
}
