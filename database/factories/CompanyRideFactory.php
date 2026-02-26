<?php

namespace Database\Factories;

use App\Models\CompanyRide;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyRideFactory extends Factory
{
    protected $model = CompanyRide::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'employee_id' => Employee::factory(),
            'driver_id' => null,
            'pickup_address' => $this->faker->address(),
            'destination_address' => $this->faker->address(),
            'origin_lat' => $this->faker->latitude(9.0, 9.2),
            'origin_lng' => $this->faker->longitude(38.7, 38.8),
            'destination_lat' => $this->faker->latitude(9.0, 9.2),
            'destination_lng' => $this->faker->longitude(38.7, 38.8),
            'price' => $this->faker->randomFloat(2, 100, 500),
            'status' => 'pending',
            'scheduled_time' => null,
            'requested_at' => now(),
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'accepted',
            'driver_id' => Driver::factory(),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'driver_id' => Driver::factory(),
            'started_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'driver_id' => Driver::factory(),
            'started_at' => now()->subMinutes(30),
            'completed_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
