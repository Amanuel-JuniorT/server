<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SuperAdminSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $email = env('SUPER_ADMIN_EMAIL');
    $password = env('SUPER_ADMIN_PASSWORD');

    if (!$email || !$password) {
      $this->command->warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env. Skipping super admin seeding.');
      return;
    }

    $admin = Admin::where('email', $email)->first();

    if ($admin) {
      // If admin exists, just ensure they have super_admin role and are active
      // We do NOT reset their password or verification status if they already exist
      // to avoid locking them out if they changed it.
      $admin->update([
        'role' => 'super_admin',
        'is_active' => true,
        'company_id' => null,
      ]);
      $this->command->info("Super Admin '{$email}' updated.");
    } else {
      // Create new super admin
      Admin::create([
        'name' => 'Super Admin',
        'email' => $email,
        'password' => Hash::make($password),
        'role' => 'super_admin',
        'company_id' => null,
        'email_verified_at' => null, // Require verification on first login as requested
        'is_active' => true,
      ]);
      $this->command->info("Super Admin '{$email}' created. Verification required on first login.");
    }
  }
}
