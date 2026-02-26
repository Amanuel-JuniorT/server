<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VehicleType;

class VehicleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'economy',
                'display_name' => 'Economy',
                'description' => 'Affordable every-day rides',
                'capacity' => 4,
                'base_fare' => 140.00,
                'price_per_km' => 25.00,
                'price_per_minute' => 2.00,
                'minimum_fare' => 150.00,
                'commission_percentage' => 15.00,
                'waiting_fee_per_minute' => 5.00,
                'wallet_transaction_fixed_fee' => 0.00,
                'is_active' => true,
            ],
            [
                'name' => 'comfort',
                'display_name' => 'Comfort',
                'description' => 'Newer cars with extra legroom',
                'capacity' => 4,
                'base_fare' => 180.00,
                'price_per_km' => 35.00,
                'price_per_minute' => 3.00,
                'minimum_fare' => 200.00,
                'commission_percentage' => 18.00,
                'waiting_fee_per_minute' => 7.00,
                'wallet_transaction_fixed_fee' => 5.00,
                'is_active' => true,
            ],
            [
                'name' => 'luxury',
                'display_name' => 'Luxury',
                'description' => 'Premium rides in high-end vehicles',
                'capacity' => 4,
                'base_fare' => 250.00,
                'price_per_km' => 50.00,
                'price_per_minute' => 5.00,
                'minimum_fare' => 300.00,
                'commission_percentage' => 20.00,
                'waiting_fee_per_minute' => 10.00,
                'wallet_transaction_fixed_fee' => 10.00,
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            VehicleType::updateOrCreate(['name' => $type['name']], $type);
        }
    }
}
