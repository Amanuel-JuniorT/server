<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Ride;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RideControllerTest extends TestCase
{
  use RefreshDatabase;

  public function test_get_active_ride_as_passenger()
  {
    $passenger = User::factory()->create();
    /** @var User $passenger */
    $this->actingAs($passenger);

    // 1. No active ride initially
    $response = $this->getJson('/api/ride/active');
    $response->assertStatus(404);

    // 2. Create active ride (requested)
    $ride = Ride::factory()->create([
      'passenger_id' => $passenger->id,
      'status' => 'requested',
      'driver_id' => null
    ]);

    $response = $this->getJson('/api/ride/active');
    $response->assertStatus(200);
    $response->assertJson([
      'ride_id' => (string)$ride->id,
      'status' => 'requested'
    ]);

    // 3. Mark as accepted and check for driver details
    $driverUser = User::factory()->create(['role' => 'driver', 'name' => 'John Doe']);
    $driver = Driver::factory()->create([
      'user_id' => $driverUser->id,
    ]);
    Vehicle::factory()->create([
      'driver_id' => $driver->id,
      'plate_number' => 'AA-123',
      'model' => 'Toyota Vitz',
      'color' => 'Silver'
    ]);
    $ride->update(['driver_id' => $driver->id, 'status' => 'accepted']);

    $response = $this->getJson('/api/ride/active');
    $response->assertStatus(200);
    $response->assertJson([
      'status' => 'accepted',
      'driver_name' => 'John Doe',
      'plate_number' => 'AA-123',
      'vehicle_model' => 'Toyota Vitz'
    ]);
  }

  public function test_get_active_ride_as_driver()
  {
    /** @var User $driverUser */
    $driverUser = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $driverUser->id]);
    $this->actingAs($driverUser);

    // 1. No active ride
    $response = $this->getJson('/api/ride/active');
    $response->assertStatus(404);

    // 2. Create accepted ride
    $ride = Ride::factory()->create([
      'driver_id' => $driver->id,
      'status' => 'accepted'
    ]);

    $response = $this->getJson('/api/ride/active');
    $response->assertStatus(200);
    $response->assertJson([
      'ride_id' => (string)$ride->id,
      'status' => 'accepted'
    ]);
  }
}
