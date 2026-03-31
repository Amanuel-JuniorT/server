<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResetWeeklyStreaks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-weekly-streaks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resets all user streak progress to 0 for the new week.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\PromotionAutomationService $service)
    {
        $service->resetWeeklyStreaks();
        $this->info('Weekly streaks reset successfully.');
    }
}
