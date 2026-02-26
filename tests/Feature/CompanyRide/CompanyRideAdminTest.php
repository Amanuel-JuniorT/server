<?php

use App\Models\User;
use App\Models\Driver;
use App\Models\Company;
use App\Models\Employee;
use App\Models\CompanyRide;

test('admin can assign driver to company ride', function () {
    $admin = User::factory()->create(['role' => 'passenger']); // Assuming admin is a user
    $driver = Driver::factory()->create(['status' => 'available']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/admin/company-ride/{$ride->id}/assign-driver", [
            'driver_id' => $driver->id
        ]);

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.ride.status', 'accepted')
        ->assertJsonPath('data.ride.driver_id', $driver->id);

    $this->assertDatabaseHas('company_rides', [
        'id' => $ride->id,
        'driver_id' => $driver->id,
        'status' => 'accepted'
    ]);

    $this->assertDatabaseHas('drivers', [
        'id' => $driver->id,
        'status' => 'on_ride'
    ]);
});

test('admin can get pending company rides', function () {
    $admin = User::factory()->create();
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $pendingRide1 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);

    $pendingRide2 = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);

    $completedRide = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'completed'
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/company-rides/pending');

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $rides = $response->json('data.rides');
    expect($rides)->toHaveCount(2);
    expect($rides[0]['status'])->toBe('pending');
    expect($rides[1]['status'])->toBe('pending');
});

test('admin can get company ride statistics', function () {
    $admin = User::factory()->create();
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    CompanyRide::factory()->create(['status' => 'pending']);
    CompanyRide::factory()->create(['status' => 'accepted']);
    CompanyRide::factory()->create(['status' => 'in_progress']);
    CompanyRide::factory()->count(2)->create(['status' => 'completed']);
    CompanyRide::factory()->create(['status' => 'cancelled']);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/company-rides/stats');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonStructure([
            'success',
            'data' => [
                'total',
                'pending',
                'accepted',
                'in_progress',
                'completed',
                'cancelled'
            ]
        ]);

    $stats = $response->json('data');
    expect($stats['total'])->toBe(6);
    expect($stats['pending'])->toBe(1);
    expect($stats['completed'])->toBe(2);
});

test('admin cannot assign unavailable driver', function () {
    $admin = User::factory()->create();
    $driver = Driver::factory()->create(['status' => 'on_ride']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'pending'
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/admin/company-ride/{$ride->id}/assign-driver", [
            'driver_id' => $driver->id
        ]);

    $response->assertStatus(400)
        ->assertJson(['success' => false]);
});

test('admin cannot assign driver to non-pending ride', function () {
    $admin = User::factory()->create();
    $driver = Driver::factory()->create(['status' => 'available']);
    $company = Company::factory()->create();
    $employee = Employee::factory()->create(['company_id' => $company->id]);
    
    $ride = CompanyRide::factory()->create([
        'company_id' => $company->id,
        'employee_id' => $employee->id,
        'status' => 'accepted'
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/admin/company-ride/{$ride->id}/assign-driver", [
            'driver_id' => $driver->id
        ]);

    $response->assertStatus(404)
        ->assertJson(['success' => false]);
});



