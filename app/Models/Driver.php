<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Driver extends Model
{
    use HasFactory;


    public function user()
    {
        return $this->belongsTo(User::class);
    }
    protected $fillable = [
        'user_id',
        'license_number',
        'license_expiry',
        'experience_years',
        'emergency_contact_name',
        'emergency_contact_phone',
        'vehicle_type',
        'plate_number',
        'make',
        'model',
        'year',
        'capacity',
        'color',
        'license_image_path',
        'profile_picture_path',
        'status',
        'rating',
        'total_ratings',
        'rating_breakdown',
        'approval_state',
        'reject_message',
        'reliability_score',
        'no_show_count',
        'corporate_agreed_version'
    ];

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function vehicle()
    {
        return $this->hasOne(Vehicle::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }

    public function location()
    {
        return $this->hasOne(Location::class);
    }

    public function companyRides()
    {
        return $this->hasMany(CompanyGroupRideInstance::class);
    }

    public function companyContracts()
    {
        return $this->hasMany(CompanyDriverContract::class);
    }
}
