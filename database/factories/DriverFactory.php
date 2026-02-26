<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Driver>
 */
class DriverFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'license_number' => $this->faker->unique()->numerify('LIC####'),
            'status' => 'available',
            'approval_state' => 'approved',
            'license_image_path' => 'license_images/default.png',
            'profile_picture_path' => 'profile_pictures/default.png',
            'rating' => 5.00,
        ];
    }
}
