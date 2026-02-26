<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vehicle>
 */
class VehicleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'driver_id' => \App\Models\Driver::factory(),
            'vehicle_type_id' => \App\Models\VehicleType::factory(),
            'capacity' => 4,
            'make' => $this->faker->company,
            'model' => $this->faker->word,
            'plate_number' => $this->faker->unique()->bothify('??-###'),
            'color' => $this->faker->colorName,
            'year' => $this->faker->year,
            'has_air_conditioning' => false,
            'has_child_seat' => false
        ];
    }
}
