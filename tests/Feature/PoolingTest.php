<?php

namespace Tests\Feature;

use App\Events\PoolConfirmed;
use App\Events\PoolRequestToDriver;
use App\Events\PoolRequestToPassenger;
use App\Events\PoolRejected;
use App\Models\Driver;
use App\Models\Pooling;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PoolingTest extends TestCase
{
  use RefreshDatabase;

  public function test_pooling_flow_successful_match()
  {
    Event::fake();
    Queue::fake();
    $this->withoutExceptionHandling();

    // 1. Setup Driver
    $driverUser = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create([
      'user_id' => $driverUser->id,
      'pooling_enabled' => true,
      'status' => 'available',
      'approval_state' => 'approved' // Ensure driver is approved
    ]);

    // Mock driver location (using direct DB insert or factory if available)
    // Assuming locations table exists and linked to driver
    \Illuminate\Support\Facades\DB::table('locations')->insert([
      'driver_id' => $driver->id,
      'latitude' => 9.0000,
      'longitude' => 38.7500,
      'updated_at' => now()
    ]);

    // 2. Setup Passenger A (Original Ride)
    $passengerA = User::factory()->create();
    $rideA = Ride::create([
      'passenger_id' => $passengerA->id,
      'driver_id' => $driver->id,
      'origin_lat' => 9.0000,
      'origin_lng' => 38.7500,
      'destination_lat' => 9.0500,
      'destination_lng' => 38.7500,
      'pickup_address' => 'Origin A',
      'destination_address' => 'Dest A',
      'price' => 100,
      'status' => 'accepted',
      'is_pool_enabled' => true,
      'passenger_accepts_pooling' => true,
      'encoded_route' => '_p~iF~ps|UowH?' // Valid mock polyline for (9.0, 38.75) to (9.05, 38.75)
    ]);

    // 3. Setup Passenger B (Pool Requester)
    $passengerB = User::factory()->create();

    // Authenticate as Passenger B
    /** @var User $passengerB */
    $this->actingAs($passengerB);

    // 4. Request Pool Ride (Similar route)
    $response = $this->postJson('/api/ride/pool/request', [
      'origin_lat' => 9.0000,
      'origin_lng' => 38.7500,
      'destination_lat' => 9.0500,
      'destination_lng' => 38.7500,
      'polyline' => '_p~iF~ps|UowH?'
    ]);

    $response->assertStatus(200);
    $response->assertJson(['message' => 'Pool request sent']);

    $poolingId = $response->json('pooling_id');
    $this->assertNotNull($poolingId);

    // Verify Pooling Record created
    $this->assertDatabaseHas('poolings', [
      'id' => $poolingId,
      'status' => 'pending_passenger_a',
      'passenger_id' => $passengerB->id,
      'ride_id' => $rideA->id
    ]);

    // Verify Event to Passenger A
    Event::assertDispatched(PoolRequestToPassenger::class, function ($event) use ($poolingId) {
      return $event->pooling->id == $poolingId;
    });

    // 5. Passenger A Accepts
    /** @var User $passengerA */
    $this->actingAs($passengerA);
    $responseA = $this->postJson("/api/ride/pool/{$poolingId}/passenger-response", [
      'action' => 'accept'
    ]);

    $responseA->assertStatus(200);
    $this->assertDatabaseHas('poolings', [
      'id' => $poolingId,
      'status' => 'passenger_a_accepted'
    ]);

    // Verify Event to Driver
    Event::assertDispatched(PoolRequestToDriver::class);

    // 6. Driver Accepts
    /** @var User $driverUser */
    $this->actingAs($driverUser); // Assuming authentication uses User model
    // Note: PoolingController checks if user->driver->id matches matching driver id. 
    // actingAs($driverUser) should bind user with driver relationship if factories are set up right.

    $responseD = $this->postJson("/api/ride/pool/{$poolingId}/driver-response", [
      'action' => 'accept'
    ]);

    $responseD->assertStatus(200);
    $responseD->assertJson(['status' => 'confirmed']);

    $this->assertDatabaseHas('poolings', [
      'id' => $poolingId,
      'status' => 'confirmed'
    ]);

    // Verify Ride Created for Passenger B
    $this->assertDatabaseHas('rides', [
      'passenger_id' => $passengerB->id,
      'driver_id' => $driver->id,
      'is_pool_ride' => true,
      'parent_ride_id' => $rideA->id,
      'status' => 'accepted'
    ]);

    // Verify PoolConfirmed Event
    Event::assertDispatched(PoolConfirmed::class);
  }

  public function test_pooling_timeout_auto_accepts_passenger_a()
  {
    Event::fake();
    Queue::fake();

    $driverUser = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $driverUser->id, 'pooling_enabled' => true, 'status' => 'available', 'approval_state' => 'approved']);
    \Illuminate\Support\Facades\DB::table('locations')->insert(['driver_id' => $driver->id, 'latitude' => 9.0, 'longitude' => 38.75, 'updated_at' => now()]);

    // Seed driver wallet for commission payments
    \App\Models\Wallet::create(['user_id' => $driverUser->id, 'balance' => 1000]);

    $passengerA = User::factory()->create();
    $rideA = Ride::create([
      'passenger_id' => $passengerA->id,
      'driver_id' => $driver->id,
      'status' => 'accepted',
      'is_pool_enabled' => true,
      'passenger_accepts_pooling' => true,
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75,
      'pickup_address' => 'Origin A',
      'destination_address' => 'Dest A',
      'price' => 100
    ]);

    $passengerB = User::factory()->create();
    $this->actingAs($passengerB);

    $response = $this->postJson('/api/ride/pool/request', [
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75,
      'polyline' => '_p~iF~ps|UowH?'
    ]);

    $poolingId = $response->json('pooling_id');
    Queue::assertPushed(\App\Jobs\ProcessPoolTimeout::class);

    // Run job for passenger timeout
    $job = new \App\Jobs\ProcessPoolTimeout($poolingId, 'passenger');
    $job->handle();

    $this->assertDatabaseHas('poolings', ['id' => $poolingId, 'status' => 'passenger_a_accepted']);
    Event::assertDispatched(PoolRequestToDriver::class);
    Queue::assertPushed(\App\Jobs\ProcessPoolTimeout::class); // Driver timeout scheduled
  }

  public function test_independent_ride_completion()
  {
    $this->withoutExceptionHandling();
    Event::fake();

    // Create platform user (id=1) for commission wallet
    User::factory()->create(['id' => 1, 'email' => 'platform@example.com']);

    $driverUser = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $driverUser->id, 'status' => 'on_ride']);

    // Seed driver wallet
    \App\Models\Wallet::create(['user_id' => $driverUser->id, 'balance' => 1000]);

    $rideA = Ride::create([
      'passenger_id' => User::factory()->create()->id,
      'driver_id' => $driver->id,
      'status' => 'in_progress',
      'is_pool_ride' => false,
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75,
      'pickup_address' => 'A',
      'destination_address' => 'B',
      'price' => 100,
      'cash_payment' => true
    ]);

    $rideB = Ride::create([
      'passenger_id' => User::factory()->create()->id,
      'driver_id' => $driver->id,
      'status' => 'in_progress',
      'is_pool_ride' => true,
      'parent_ride_id' => $rideA->id,
      'pool_partner_ride_id' => $rideA->id,
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.06,
      'destination_lng' => 38.75,
      'pickup_address' => 'A',
      'destination_address' => 'C',
      'price' => 70,
      'cash_payment' => true
    ]);

    $rideA->update(['pool_partner_ride_id' => $rideB->id]);

    $this->actingAs($driverUser);

    // Complete Ride A
    $response = $this->postJson("/api/ride/{$rideA->id}/complete");
    if ($response->status() !== 200) {
      dump($response->json());
    }
    $response->assertStatus(200);

    $this->assertDatabaseHas('rides', ['id' => $rideA->id, 'status' => 'completed']);
    // Driver should still be on_ride because rideB is active
    $this->assertDatabaseHas('drivers', ['id' => $driver->id, 'status' => 'on_ride']);

    // Complete Ride B
    $responseB = $this->postJson("/api/ride/{$rideB->id}/complete");
    $responseB->assertStatus(200);

    $this->assertDatabaseHas('rides', ['id' => $rideB->id, 'status' => 'completed']);
    $this->assertDatabaseHas('rides', ['id' => $rideB->id, 'status' => 'completed']);
    // Driver should now be available
    $this->assertDatabaseHas('drivers', ['id' => $driver->id, 'status' => 'available']);
  }

  public function test_pool_request_rejection_by_passenger_a()
  {
    Event::fake();
    $ride = Ride::factory()->create(['status' => 'accepted', 'is_pool_enabled' => true, 'passenger_accepts_pooling' => true]);
    $passengerA = $ride->passenger;
    $passengerB = User::factory()->create();

    $pooling = Pooling::create([
      'ride_id' => $ride->id,
      'passenger_id' => $passengerB->id,
      'driver_id' => $ride->driver_id,
      'status' => 'pending_passenger_a',
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75
    ]);

    $this->actingAs($passengerA);

    $response = $this->postJson("/api/ride/pool/{$pooling->id}/passenger-response", ['action' => 'reject']);
    $response->assertStatus(200);

    $this->assertDatabaseHas('poolings', ['id' => $pooling->id, 'status' => 'rejected_by_passenger_a']);
    Event::assertDispatched(PoolRejected::class);
  }

  public function test_pool_request_rejection_by_driver()
  {
    Event::fake();
    $ride = Ride::factory()->create(['status' => 'accepted', 'is_pool_enabled' => true, 'passenger_accepts_pooling' => true]);
    $driverUser = $ride->driver->user;
    $passengerB = User::factory()->create();

    $pooling = Pooling::create([
      'ride_id' => $ride->id,
      'passenger_id' => $passengerB->id,
      'driver_id' => $ride->driver_id,
      'status' => 'passenger_a_accepted', // Driver gets response after Pax A accepts
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75
    ]);

    $this->actingAs($driverUser);

    $response = $this->postJson("/api/ride/pool/{$pooling->id}/driver-response", ['action' => 'reject']);
    $response->assertStatus(200);

    $this->assertDatabaseHas('poolings', ['id' => $pooling->id, 'status' => 'rejected_by_driver']);
    Event::assertDispatched(PoolRejected::class);
  }

  public function test_driver_timeout_auto_rejects()
  {
    Event::fake();
    $ride = Ride::factory()->create(['status' => 'accepted', 'is_pool_enabled' => true, 'passenger_accepts_pooling' => true]);
    $passengerB = User::factory()->create();

    $pooling = Pooling::create([
      'ride_id' => $ride->id,
      'passenger_id' => $passengerB->id,
      'driver_id' => $ride->driver_id,
      'status' => 'passenger_a_accepted',
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75
    ]);

    // Manually run the job
    (new \App\Jobs\ProcessPoolTimeout($pooling->id, 'driver'))->handle();

    $this->assertDatabaseHas('poolings', ['id' => $pooling->id, 'status' => 'rejected_by_timeout']);
    Event::assertDispatched(PoolRejected::class);
  }

  public function test_cancellation_of_pool_request_by_passenger_b()
  {
    $passengerB = User::factory()->create();
    $ride = Ride::factory()->create();

    $pooling = Pooling::create([
      'ride_id' => $ride->id,
      'passenger_id' => $passengerB->id,
      'driver_id' => $ride->driver_id,
      'status' => 'pending_passenger_a',
      'origin_lat' => 9.0,
      'origin_lng' => 38.75,
      'destination_lat' => 9.05,
      'destination_lng' => 38.75
    ]);

    $this->actingAs($passengerB);

    $response = $this->deleteJson("/api/ride/pool/{$pooling->id}/cancel");
    $response->assertStatus(200);

    $this->assertDatabaseHas('poolings', ['id' => $pooling->id, 'status' => 'cancelled']);
  }
}
