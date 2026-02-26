<?php

namespace App\Jobs;

use App\Models\CompanyGroupRideInstance;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ExpireOldCompanyRides implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Find rides that should be expired:
        // - Status is 'requested' or 'accepted' (not yet completed/cancelled)
        // - Has a scheduled_time that is set
        // - Scheduled time has passed by more than 12 hours
        $expiredRides = CompanyGroupRideInstance::whereIn('status', ['requested', 'accepted'])
            ->whereNotNull('scheduled_time')
            ->where('scheduled_time', '<', now()->subHours(12))
            ->get();

        $expiredCount = 0;

        foreach ($expiredRides as $ride) {
            $ride->update(['status' => 'expired']);
            $expiredCount++;

            Log::info('Company ride expired due to timeout', [
                'ride_id' => $ride->id,
                'company_id' => $ride->company_id,
                'employee_id' => $ride->employee_id,
                'scheduled_time' => $ride->scheduled_time,
                'hours_overdue' => now()->diffInHours($ride->scheduled_time)
            ]);
        }

        if ($expiredCount > 0) {
            Log::info('Expired old company rides', [
                'expired_count' => $expiredCount
            ]);
        }
    }
}
