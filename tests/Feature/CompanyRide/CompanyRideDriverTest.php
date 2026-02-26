<?php

use App\Models\User;
use App\Models\Driver;
use App\Models\Company;
use App\Models\Employee;
use App\Models\CompanyRide;
use App\Models\Vehicle;

test('driver can get all assigned company rides', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id, 'status' => 'available']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride1 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'completed'
    ]);
    
    $ride2 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'in_progress'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/driver/company-rides');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'rides' => [
                    '*' => [
                        'id',
                        'company_id',
                        'employee_id',
                        'driver_id',
                        'status',
                        'pickup_address',
                        'destination_address',
                        'price'
                    ]
                ]
            ]
        ])
        ->assertJson(['success' => true]);

    expect($response->json('data.rides'))->toHaveCount(2);
});

test('driver can get active company ride', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id, 'status' => 'on_ride']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $activeRide = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'in_progress'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/driver/company-ride/active');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.id', $activeRide->id)
        ->assertJsonPath('data.ride.status', 'in_progress');
});

test('driver can get specific company ride details', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id]);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'accepted'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/driver/company-ride/{$ride->id}");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.id', $ride->id);
});

test('driver can start a company ride', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id, 'status' => 'on_ride']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'accepted'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/driver/company-ride/{$ride->id}/start");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.status', 'in_progress');

    $this->assertDatabaseHas('company_rides', [
        'id' => $ride->id,
        'status' => 'in_progress'
    ]);

    expect($ride->fresh()->started_at)->not->toBeNull();
});

test('driver can complete a company ride', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id, 'status' => 'on_ride']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'in_progress',
        'started_at' => now()
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/driver/company-ride/{$ride->id}/complete");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.status', 'completed');

    $this->assertDatabaseHas('company_rides', [
        'id' => $ride->id,
        'status' => 'completed'
    ]);

    $this->assertDatabaseHas('drivers', [
        'id' => $driver->id,
        'status' => 'available'
    ]);

    expect($ride->fresh()->completed_at)->not->toBeNull();
});

test('driver can cancel a company ride', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id, 'status' => 'on_ride']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'accepted'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/driver/company-ride/{$ride->id}/cancel");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.status', 'cancelled');

    $this->assertDatabaseHas('company_rides', [
        'id' => $ride->id,
        'status' => 'cancelled'
    ]);

    $this->assertDatabaseHas('drivers', [
        'id' => $driver->id,
        'status' => 'available'
    ]);
});

test('driver cannot access rides assigned to other drivers', function () {
    $user1 = User::factory()->create(['role' => 'driver']);
    $driver1 = Driver::factory()->create(['user_id' => $user1->id]);
    
    $user2 = User::factory()->create(['role' => 'driver']);
    $driver2 = Driver::factory()->create(['user_id' => $user2->id]);
    
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver2->id,
        'status' => 'accepted'
    ]);

    $response = $this->actingAs($user1, 'sanctum')
        ->getJson("/api/driver/company-ride/{$ride->id}");

    $response->assertStatus(404)
        ->assertJson(['success' => false]);
});

test('driver cannot start ride that is not in accepted status', function () {
    $user = User::factory()->create(['role' => 'driver']);
    $driver = Driver::factory()->create(['user_id' => $user->id]);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'driver_id' => $driver->id,
        'status' => 'pending'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/driver/company-ride/{$ride->id}/start");

    $response->assertStatus(404)
        ->assertJson(['success' => false]);
});



