<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanyDriverContract;
use App\Models\Driver;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class CompanyDriverContractSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Get existing companies
    $companies = Company::all();

    if ($companies->isEmpty()) {
      $this->command->warn('No companies found. Please run CompanyAdminSeeder first.');
      return;
    }

    // Get existing approved drivers (prefer approved drivers for active contracts)
    $approvedDrivers = Driver::where('approval_state', 'approved')->get();

    // If no approved drivers, get any drivers
    if ($approvedDrivers->isEmpty()) {
      $approvedDrivers = Driver::all();
    }

    if ($approvedDrivers->isEmpty()) {
      $this->command->warn('No drivers found. Please run DatabaseSeeder first.');
      return;
    }

    $this->command->info('Seeding driver-company contracts...');

    $contractsCreated = 0;
    $driverIndex = 0;

    // Create contracts for each company
    foreach ($companies as $company) {
      // Assign 2-5 drivers per company
      $driversPerCompany = rand(2, min(5, $approvedDrivers->count()));

      for ($i = 0; $i < $driversPerCompany; $i++) {
        if ($driverIndex >= $approvedDrivers->count()) {
          $driverIndex = 0; // Reset if we run out of drivers
        }

        $driver = $approvedDrivers[$driverIndex];
        $driverIndex++;

        // Check if contract already exists for this driver-company pair
        $existingContract = CompanyDriverContract::where('company_id', $company->id)
          ->where('driver_id', $driver->id)
          ->first();

        if ($existingContract) {
          continue; // Skip if contract already exists
        }

        // Determine contract status (mix of active, pending, and expired)
        $statusOptions = ['active', 'active', 'active', 'pending', 'expired']; // More active contracts
        $status = $statusOptions[array_rand($statusOptions)];

        // Set contract dates based on status
        $contractStartDate = Carbon::now()->subDays(rand(30, 180));

        if ($status === 'active') {
          // Active contracts: start date in past, end date in future or null
          $contractEndDate = rand(0, 1) ? null : Carbon::now()->addDays(rand(30, 365));
        } elseif ($status === 'pending') {
          // Pending contracts: start date in future
          $contractStartDate = Carbon::now()->addDays(rand(1, 30));
          $contractEndDate = $contractStartDate->copy()->addDays(rand(90, 365));
        } else {
          // Expired contracts: both dates in past
          $contractEndDate = Carbon::now()->subDays(rand(1, 90));
          $contractStartDate = $contractEndDate->copy()->subDays(rand(90, 365));
        }

        // Create the contract
        CompanyDriverContract::create([
          'company_id' => $company->id,
          'driver_id' => $driver->id,
          'status' => $status,
          'contract_start_date' => $contractStartDate,
          'contract_end_date' => $contractEndDate,
          'terms' => $this->generateTerms(),
        ]);

        $contractsCreated++;
      }
    }

    $this->command->info("Successfully created {$contractsCreated} driver-company contracts!");

    // Display summary
    $activeCount = CompanyDriverContract::where('status', 'active')->count();
    $pendingCount = CompanyDriverContract::where('status', 'pending')->count();
    $expiredCount = CompanyDriverContract::where('status', 'expired')->count();

    $this->command->info("Active contracts: {$activeCount}");
    $this->command->info("Pending contracts: {$pendingCount}");
    $this->command->info("Expired contracts: {$expiredCount}");
  }

  /**
   * Generate sample contract terms
   */
  private function generateTerms(): string
  {
    $terms = [
      'Driver agrees to provide transportation services according to company policies and standards.',
      'Driver must maintain vehicle in good condition and follow all traffic regulations.',
      'Company will provide dispatch and ride assignment services.',
      'Driver is responsible for fuel and maintenance costs.',
      'Payment terms: Weekly payment based on completed rides.',
      'Driver must maintain valid license and insurance at all times.',
      'Contract may be terminated by either party with 30 days notice.',
    ];

    return implode(' ', array_slice($terms, 0, rand(3, 5)));
  }
}




