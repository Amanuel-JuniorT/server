<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Location;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory(10)->create()->each(function ($user) {
            if ($user->role === 'passenger') return;

            $driver = Driver::factory()->create(['user_id' => $user->id]);
            Vehicle::factory()->create(['driver_id' => $driver->id]);
            Location::create([
                'driver_id' => $driver->id,
                'latitude' => 8.9806,
                'longitude' => 38.7578,
                'updated_at' => now(),
            ]);
        });

        // Seed driver-company contracts (requires companies and drivers to exist)
        // Uncomment the line below to automatically seed contracts when running DatabaseSeeder
        // $this->call(CompanyDriverContractSeeder::class);
        $this->call(VehicleTypeSeeder::class);
        $this->call(PilotDataSeeder::class);
        
        // Seed promotions and corporate jobs
        $this->call(PromotionsSeeder::class);
        $this->call(CorporateJobsSeeder::class);
    }
}
