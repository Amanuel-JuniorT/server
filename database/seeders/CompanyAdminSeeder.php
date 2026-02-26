<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompanyAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test company if it doesn't exist
        $company = Company::firstOrCreate(
            ['code' => 'TEST01'],
            [
                'name' => 'Test Company Ltd',
                'description' => 'A test company for development purposes',
                'address' => '123 Test Street, Test City, TC 12345',
                'phone' => '+1-555-0123',
                'email' => 'admin@testcompany.com',
                'is_active' => true,
            ]
        );

        // Create a company admin
        Admin::firstOrCreate(
            ['email' => 'company.admin@testcompany.com'],
            [
                'name' => 'Company Admin',
                'email' => 'company.admin@testcompany.com',
                'password' => Hash::make('password'),
                'role' => 'company_admin',
                'company_id' => $company->id,
            ]
        );

        // Create a super admin if it doesn't exist
        Admin::firstOrCreate(
            ['email' => 'super.admin@ecab.com'],
            [
                'name' => 'Super Admin',
                'email' => 'super.admin@ecab.com',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'company_id' => null,
            ]
        );

        $this->command->info('Company admin seeder completed successfully!');
        $this->command->info('Company Admin: company.admin@testcompany.com / password');
        $this->command->info('Super Admin: super.admin@ecab.com / password');
    }
}
