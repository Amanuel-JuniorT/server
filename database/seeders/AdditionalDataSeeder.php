<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Driver;
use App\Models\Location;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdditionalDataSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $this->command->info('Creating additional companies and drivers...');

    // Create additional companies
    $companies = $this->createCompanies();
    $this->command->info("Created {$companies} companies.");

    // Create additional approved drivers
    $drivers = $this->createDrivers();
    $this->command->info("Created {$drivers} approved drivers.");

    $this->command->info('Additional data seeding completed!');
  }

  /**
   * Create additional companies
   */
  private function createCompanies(): int
  {
    $companyNames = [
      'Ethio Transport Services',
      'Addis Ababa Cab Co.',
      'Blue Nile Taxi',
      'Royal Transport Ltd',
      'City Ride Services',
      'Express Cab Solutions',
      'Premium Mobility',
      'Green Transport Co.',
    ];

    $created = 0;
    foreach ($companyNames as $name) {
      $code = Company::generateCode();

      $company = Company::firstOrCreate(
        ['code' => $code],
        [
          'name' => $name,
          'description' => "Professional transportation services for {$name}",
          'address' => $this->generateAddress(),
          'phone' => $this->generatePhone(),
          'email' => Str::slug($name) . '@example.com',
          'is_active' => true,
        ]
      );

      if ($company->wasRecentlyCreated) {
        $created++;
      }
    }

    return $created;
  }

  /**
   * Create additional approved drivers
   */
  private function createDrivers(): int
  {
    $created = 0;

    // Create 15 drivers (more than companies for variety)
    for ($i = 0; $i < 15; $i++) {
      // Create user with driver role
      $user = User::create([
        'name' => $this->generateName(),
        'email' => 'driver' . time() . rand(1000, 9999) . '@example.com',
        'phone' => $this->generatePhone(),
        'password' => bcrypt('password'), // Default password for seeded users
        'role' => 'driver',
        'is_active' => true,
      ]);

      // Create driver with approved status
      $driver = Driver::create([
        'user_id' => $user->id,
        'license_number' => 'LIC-' . strtoupper(Str::random(8)),
        'status' => 'available',
        'approval_state' => 'approved',
        'license_image_path' => 'license_images/default.png',
        'profile_picture_path' => 'profile_pictures/default.png',
      ]);

      // Create vehicle for driver
      Vehicle::create([
        'driver_id' => $driver->id,
        'make' => $this->getRandomMake(),
        'model' => $this->getRandomModel(),
        'plate_number' => 'ET-' . strtoupper(Str::random(3)) . '-' . rand(1000, 9999),
        'color' => $this->getRandomColor(),
        'year' => rand(2018, 2024),
        'vehicle_type' => rand(0, 1) ? 'car' : 'motorcycle',
        'capacity' => rand(0, 1) ? 4 : 2,
      ]);

      // Create location for driver
      Location::create([
        'driver_id' => $driver->id,
        'latitude' => 8.9806 + (rand(-100, 100) / 1000), // Random location around Addis Ababa
        'longitude' => 38.7578 + (rand(-100, 100) / 1000),
        'updated_at' => now(),
      ]);

      $created++;
    }

    return $created;
  }

  /**
   * Generate random name
   */
  private function generateName(): string
  {
    $firstNames = ['Abebe', 'Tigist', 'Mulugeta', 'Hirut', 'Yonas', 'Selam', 'Tesfaye', 'Aster', 'Daniel', 'Meskel', 'Bereket', 'Meron'];
    $lastNames = ['Girma', 'Tadesse', 'Kebede', 'Hailu', 'Mengistu', 'Assefa', 'Tekle', 'Wondimu', 'Gebre', 'Fekadu', 'Alemayehu', 'Tsegaye'];

    return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
  }

  /**
   * Generate random address
   */
  private function generateAddress(): string
  {
    $streets = ['Bole Road', 'Churchill Avenue', 'Meskel Square', 'Mexico Square', 'Piassa', 'Arat Kilo', 'Casa', 'Kazanchis'];
    $streetNumber = rand(100, 9999);

    return "{$streetNumber} {$streets[array_rand($streets)]}, Addis Ababa, Ethiopia";
  }

  /**
   * Generate random phone number
   */
  private function generatePhone(): string
  {
    return '+251-' . rand(900, 999) . '-' . rand(100000, 999999);
  }

  /**
   * Get random vehicle make
   */
  private function getRandomMake(): string
  {
    $makes = ['Toyota', 'Honda', 'Hyundai', 'Nissan', 'Suzuki', 'Mazda', 'Ford', 'Volkswagen'];
    return $makes[array_rand($makes)];
  }

  /**
   * Get random vehicle model
   */
  private function getRandomModel(): string
  {
    $models = ['Corolla', 'Civic', 'Accord', 'Camry', 'Elantra', 'Sentra', 'Swift', 'Focus', 'Golf'];
    return $models[array_rand($models)];
  }

  /**
   * Get random color
   */
  private function getRandomColor(): string
  {
    $colors = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown'];
    return $colors[array_rand($colors)];
  }
}
