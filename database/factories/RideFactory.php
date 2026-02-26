<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ride>
 */
class RideFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'passenger_id' => \App\Models\User::factory(),
            'driver_id' => \App\Models\Driver::factory(),
            'origin_lat' => $this->faker->latitude,
            'origin_lng' => $this->faker->longitude,
            'destination_lat' => $this->faker->latitude,
            'destination_lng' => $this->faker->longitude,
            'pickup_address' => $this->faker->address,
            'destination_address' => $this->faker->address,
            'price' => $this->faker->randomFloat(2, 50, 500),
            'status' => 'requested',
            'requested_at' => now(),
            'cash_payment' => true,
        ];
    }
}
