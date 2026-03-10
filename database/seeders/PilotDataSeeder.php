<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Driver;
use App\Models\Company;
use App\Models\CompanyEmployee;
use App\Models\CompanyGroupRideInstance;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class PilotDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('Seeding pilot data for reality check...');

        // 1. Create a Pilot Driver (if not exists)
        $driverUser = User::firstOrCreate(
            ['email' => 'pilot.driver@ecab.com'],
            [
                'name' => 'Pilot Driver',
                'phone' => '+251911000001',
                'password' => Hash::make('password123'),
                'role' => 'driver',
                'is_active' => true,
            ]
        );

        $driver = Driver::firstOrCreate(
            ['user_id' => $driverUser->id],
            [
                'license_number' => 'LC-12345-PILOT',
                'license_expiry' => Carbon::now()->addYears(2),
                'experience_years' => 5,
                'status' => 'available',
                'approval_state' => 'approved',
                'rating' => 4.8,
            ]
        );

        // Check if vehicle exists, if not create using DB facade to avoid model fillable issues or missing columns
        $existingVehicle = \Illuminate\Support\Facades\DB::table('vehicles')->where('driver_id', $driver->id)->first();
        
        if (!$existingVehicle) {
            \Illuminate\Support\Facades\DB::table('vehicles')->insert([
                'driver_id' => $driver->id,
                'vehicle_type' => 'car',
                'plate_number' => 'A-12345',
                'make' => 'Toyota',
                'model' => 'Corolla',
                'year' => 2018,
                'color' => 'White',
                'capacity' => 4,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // 2. Create Active Companies for Corporate Rides
        $companies = [
            [
                'name' => 'TechHub Solutions',
                'code' => 'TECH01',
                'address' => 'Bole Medhankalem, Addis Ababa',
                'lat' => 9.0089,
                'lng' => 38.7697
            ],
            [
                'name' => 'Global Bank HQ',
                'code' => 'BANK01',
                'address' => 'Mexico Square, Addis Ababa',
                'lat' => 9.0102,
                'lng' => 38.7456
            ]
        ];

        foreach ($companies as $compData) {
            $company = Company::firstOrCreate(
                ['code' => $compData['code']],
                [
                    'name' => $compData['name'],
                    'address' => $compData['address'],
                    'default_origin_lat' => $compData['lat'],
                    'default_origin_lng' => $compData['lng'],
                    'email' => strtolower($compData['code']) . '@example.com',
                    'phone' => '+251911999999',
                    'is_active' => true
                ]
            );

            // Create Employees for this company
            $employeeUser = User::create([
                'name' => 'Emp. ' . $company->name,
                'email' => 'emp.' . strtolower($company->code) . '@example.com',
                'phone' => '+2519' . rand(10000000, 99999999),
                'password' => Hash::make('password'),
                'role' => 'passenger',
                'is_employee' => true,
                'company_id' => $company->id
            ]);

            CompanyEmployee::create([
                'user_id' => $employeeUser->id,
                'company_id' => $company->id,
                'status' => 'approved',
                'requested_at' => now(),
                'approved_at' => now(),
            ]);

            // Create a PENDING Corporate Ride Request (Job)
            CompanyGroupRideInstance::create([
                'company_id' => $company->id,
                'employee_id' => $employeeUser->id,
                'origin_lat' => $company->default_origin_lat,
                'origin_lng' => $company->default_origin_lng,
                'destination_lat' => $company->default_origin_lat + 0.02, // Just a bit away
                'destination_lng' => $company->default_origin_lng + 0.02,
                'pickup_address' => $company->address,
                'destination_address' => 'Airport, Addis Ababa',
                'price' => 450.00,
                'scheduled_time' => Carbon::now()->addHours(2), // Upcoming
                'status' => 'requested',
                'requested_at' => Carbon::now(),
            ]);
        }

        // 3. Seed Realistic Promotions and News
        $promotions = [
            [
                'title' => '🎉 Pilot Program Launch!',
                'description' => 'Welcome to the ECAB Pilot Program. Complete 10 rides this week to earn a 500 ETB bonus.',
                'type' => 'news',
                'expiry_date' => Carbon::now()->addMonth(),
                'image_url' => 'https://example.com/pilot_launch.jpg'
            ],
            [
                'title' => 'Morning Rush Hour Boost',
                'description' => 'Earn 1.5x on all rides between 7 AM and 9 AM in Bole area.',
                'type' => 'promotion',
                'expiry_date' => Carbon::now()->addWeeks(2),
                'image_url' => 'https://example.com/morning_boost.jpg'
            ],
            [
                'title' => '⚠️ Road Closure Alert',
                'description' => 'Meskel Square renovation ongoing. Expect delays and use alternative routes.',
                'type' => 'alert',
                'expiry_date' => Carbon::now()->addDays(3),
                'image_url' => null
            ]
        ];

        foreach ($promotions as $promo) {
            Promotion::create(array_merge($promo, ['is_active' => true]));
        }

        $this->command->info('Pilot data seeded successfully: Driver, Companies, Corporate Rides, Promotions.');
    }
}
