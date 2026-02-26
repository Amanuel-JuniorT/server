<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Promotion;
use Carbon\Carbon;

class PromotionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Clear existing promotions
        Promotion::truncate();

        $promotions = [
            [
                'title' => 'Weekly Quest: Complete 50 Rides',
                'description' => 'Get a 500 ETB bonus when you complete 50 rides this week. Keep going!',
                'image_url' => 'https://via.placeholder.com/300x150.png?text=Weekly+Quest',
                'type' => 'quest',
                'expiry_date' => Carbon::now()->addDays(7),
                'is_active' => true,
            ],
            [
                'title' => 'Rainy Day Bonus',
                'description' => 'Earn 15% extra on every ride during peak rainy hours today. Drive safe!',
                'image_url' => 'https://via.placeholder.com/300x150.png?text=Rainy+Bonus',
                'type' => 'surge',
                'expiry_date' => Carbon::now()->addHours(12),
                'is_active' => true,
            ],
            [
                'title' => 'Refer a Friend',
                'description' => 'Invite a new driver and earn 1000 ETB after their first 20 trips.',
                'image_url' => 'https://via.placeholder.com/300x150.png?text=Referral',
                'type' => 'referral',
                'expiry_date' => Carbon::now()->addDays(30),
                'is_active' => true,
            ],
            [
                'title' => 'Welcome Bonus',
                'description' => 'Thanks for joining ECAB! Complete your first 10 rides to unlock a 200 ETB bonus.',
                'image_url' => 'https://via.placeholder.com/300x150.png?text=Welcome',
                'type' => 'onboarding',
                'expiry_date' => Carbon::now()->addDays(14),
                'is_active' => true,
            ],
        ];

        foreach ($promotions as $promo) {
            Promotion::create($promo);
        }

        $this->command->info('Promotions seeded successfully!');
    }
}
