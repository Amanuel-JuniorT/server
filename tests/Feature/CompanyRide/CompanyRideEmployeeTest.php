<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Employee;
use App\Models\CompanyRide;

test('employee can request a company ride', function () {
    $user = User::factory()->create(['role' => 'passenger']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'is_active' => true
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/company-ride/request', [
            'originLat' => 9.1450,
            'originLng' => 38.7610,
            'destLat' => 9.1500,
            'destLng' => 38.7700,
            'pickupAddress' => 'Addis Ababa, Ethiopia',
            'destinationAddress' => 'Bole, Addis Ababa'
        ]);

    $response->assertStatus(201)
        ->assertJson(['success' => true])
        ->assertJsonStructure([
            'success',
            'data' => [
                'ride' => [
                    'id',
                    'company_id',
                    'employee_id',
                    'status',
                    'pickup_address',
                    'destination_address',
                    'price'
                ]
            ]
        ]);

    $this->assertDatabaseHas('company_rides', [
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);
});

test('employee can get all their company rides', function () {
    $user = User::factory()->create(['role' => 'passenger']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id
    ]);

    $ride1 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'completed'
    ]);

    $ride2 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'in_progress'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/company-rides');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonStructure([
            'success',
            'data' => [
                'rides' => [
                    '*' => [
                        'id',
                        'company_id',
                        'employee_id',
                        'status'
                    ]
                ]
            ]
        ]);

    expect($response->json('data.rides'))->toHaveCount(2);
});

test('employee can get active company ride', function () {
    $user = User::factory()->create(['role' => 'passenger']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id
    ]);

    $activeRide = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'in_progress'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/company-ride/active');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.id', $activeRide->id);
});

test('employee can cancel their company ride', function () {
    $user = User::factory()->create(['role' => 'passenger']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id
    ]);

    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/company-ride/{$ride->id}/cancel");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.status', 'cancelled');

    $this->assertDatabaseHas('company_rides', [
        'id' => $ride->id,
        'status' => 'cancelled'
    ]);
});

test('non-employee cannot request company ride', function () {
    $user = User::factory()->create(['role' => 'passenger']);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/company-ride/request', [
            'originLat' => 9.1450,
            'originLng' => 38.7610,
            'destLat' => 9.1500,
            'destLng' => 38.7700
        ]);

    $response->assertStatus(403)
        ->assertJson(['success' => false]);
});

test('employee cannot cancel completed ride', function () {
    $user = User::factory()->create(['role' => 'passenger']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id
    ]);

    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'completed'
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson("/api/company-ride/{$ride->id}/cancel");

    $response->assertStatus(404);
});



