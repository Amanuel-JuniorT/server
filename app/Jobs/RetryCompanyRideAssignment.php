<?php

namespace App\Jobs;

use App\Models\CompanyGroupRideInstance;
use App\Services\CompanyRideAssignmentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RetryCompanyRideAssignment implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [300, 600, 900]; // 5min, 10min, 15min

    /**
     * Create a new job instance.
     */
    public function __construct(public CompanyGroupRideInstance $ride)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(CompanyRideAssignmentService $assignmentService): void
    {
        // Refresh ride to get latest state
        $this->ride->refresh();

        // Skip if already has driver assigned
        if ($this->ride->driver_id !== null) {
            Log::info('Ride already has driver assigned, skipping retry', [
                'ride_id' => $this->ride->id,
                'driver_id' => $this->ride->driver_id
            ]);
            return;
        }

        // Skip if max retries reached
        if ($this->ride->assignment_retry_count >= 5) {
            Log::warning('Max retries reached for ride', [
                'ride_id' => $this->ride->id,
                'retry_count' => $this->ride->assignment_retry_count
            ]);
            // TODO: Notify company admin
            return;
        }

        // Skip if ride is expired
        if ($this->ride->is_expired) {
            Log::info('Ride has expired, skipping retry', [
                'ride_id' => $this->ride->id,
                'scheduled_time' => $this->ride->scheduled_time,
                'status' => $this->ride->status
            ]);
            return;
        }

        // Attempt assignment
        $result = $assignmentService->assignDriver($this->ride);

        if ($result['success']) {
            Log::info('Driver assigned via retry job', [
                'ride_id' => $this->ride->id,
                'driver_id' => $result['driver']->id,
                'retry_count' => $this->ride->assignment_retry_count
            ]);
            // TODO: Notify driver and employee
        } else {
            // Increment retry count
            $this->ride->increment('assignment_retry_count');

            Log::warning('Retry assignment failed', [
                'ride_id' => $this->ride->id,
                'reason' => $result['reason'],
                'retry_count' => $this->ride->assignment_retry_count
            ]);

            // If max retries reached, notify admin
            if ($this->ride->assignment_retry_count >= 5) {
                // TODO: Notify company admin
                Log::error('Max retries reached, manual assignment required', [
                    'ride_id' => $this->ride->id
                ]);
            }
        }
    }
}
