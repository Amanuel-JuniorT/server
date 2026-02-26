<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VehicleType>
 */
class VehicleTypeFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    return [
      'name' => 'economy',
      'display_name' => 'Economy',
      'base_fare' => 140,
      'price_per_km' => 25,
      'price_per_minute' => 5,
      'minimum_fare' => 100,
      'capacity' => 4,
      'is_active' => true
    ];
  }
}
