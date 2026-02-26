<?php

use App\Models\User;
use App\Models\Ride;
use App\Jobs\DispatchRideJob;

// Find or create a test passenger
$passenger = User::where('role', 'passenger')->first();
if (!$passenger) {
  echo "Creating test passenger...\n";
  $passenger = User::create([
    'name' => 'Test Passenger',
    'email' => 'testpassenger_' . time() . '@test.com',
    'password' => bcrypt('password'),
    'phone' => '+251911' . rand(100000, 999999),
    'role' => 'passenger'
  ]);
}

echo "Using Passenger ID: {$passenger->id} ({$passenger->name})\n\n";

// Create a test ride
echo "Creating test ride...\n";
$ride = Ride::create([
  'passenger_id' => $passenger->id,
  'origin_lat' => 9.0070602,  // Bole, Addis Ababa
  'origin_lng' => 38.8587002,
  'destination_lat' => 8.9837879,  // Bole Airport
  'destination_lng' => 38.7963064,
  'pickup_address' => 'Bole, Addis Ababa',
  'destination_address' => 'Bole Addis Ababa International Airport',
  'price' => 323.12,
  'status' => 'requested',
  'requested_at' => now(),
  'rejected_driver_ids' => [],
  'cash_payment' => true,
  'passenger_accepts_pooling' => false,
]);

echo "✓ Test Ride created with ID: {$ride->id}\n";
echo "  Pickup: {$ride->pickup_address}\n";
echo "  Destination: {$ride->destination_address}\n";
echo "  Price: {$ride->price} ETB\n\n";

// Dispatch the job
echo "Dispatching DispatchRideJob...\n";
DispatchRideJob::dispatch($ride);

// Check jobs table
$jobCount = DB::table('jobs')->count();
echo "✓ Job dispatched!\n";
echo "  Jobs in queue: {$jobCount}\n\n";

echo "Now run: php artisan queue:work --once --verbose\n";
echo "To process this job and see the output.\n";
