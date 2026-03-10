<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ride;
use App\Models\CompanyRideGroup;
use Carbon\Carbon;

class CorporateJobsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Check if we have any company ride groups (mock data if not)
        // For this seeder, we'll just create direct rides with a specific 'corporate' flag or context
        // explicitly for the driver app to consume as "Available Corporate Jobs"

        $corporateJobs = [
            [
                'passenger_id' => 1,
                'driver_id' => null,
                'pickup_address' => 'Bole International Airport, Addis Ababa',
                'destination_address' => 'Hilton Hotel, Addis Ababa',
                'origin_lat' => 8.977468,
                'origin_lng' => 38.799753,
                'destination_lat' => 9.022736,
                'destination_lng' => 38.761743,
                'status' => 'requested',
                'price' => 450.00,
                'cash_payment' => false,
                'requested_at' => Carbon::now()->subMinutes(5),
            ],
            [
                'passenger_id' => 1,
                'driver_id' => null,
                'pickup_address' => 'African Union Headquarters',
                'destination_address' => 'Sheraton Addis',
                'origin_lat' => 9.003306,
                'origin_lng' => 38.746029,
                'destination_lat' => 9.020556,
                'destination_lng' => 38.756667,
                'status' => 'requested',
                'price' => 300.00,
                'cash_payment' => false,
                'requested_at' => Carbon::now()->subMinutes(10),
            ],
             [
                'passenger_id' => 1,
                'driver_id' => null,
                'pickup_address' => 'Edna Mall, Bole',
                'destination_address' => 'Kazanchis Business District',
                'origin_lat' => 9.001673,
                'origin_lng' => 38.783181,
                'destination_lat' => 9.018503,
                'destination_lng' => 38.766347,
                'status' => 'requested',
                'price' => 220.00,
                'cash_payment' => false,
                'requested_at' => Carbon::now()->subMinutes(2),
            ]
        ];

        foreach ($corporateJobs as $job) {
             // Ensure we don't duplicate based on some criteria if needed, 
             // but for seeding new jobs, simple creation is usually fine.
             Ride::create($job);
        }

        $this->command->info('Corporate jobs seeded successfully!');
    }
}
