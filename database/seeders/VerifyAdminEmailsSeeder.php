<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VerifyAdminEmailsSeeder extends Seeder
{
    public function run(): void
    {
        $count = DB::table('admins')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);

        $this->command->info("Marked {$count} admin(s) email as verified.");
    }
}
