<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Pooling;
use App\Events\PoolRequestToDriver;
use App\Events\PoolRejected;
use App\Jobs\RetryPoolMatch;
use Illuminate\Support\Facades\Log;

class ProcessPoolTimeout implements ShouldQueue
{
    use Queueable;

    public $poolingId;
    public $timeoutType; // 'passenger' or 'driver'

    /**
     * Create a new job instance.
     */
    public function __construct($poolingId, $timeoutType)
    {
        $this->poolingId = $poolingId;
        $this->timeoutType = $timeoutType;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $pooling = Pooling::find($this->poolingId);

        if (!$pooling) {
            Log::warning("Pooling {$this->poolingId} not found for timeout processing");
            return;
        }

        if ($this->timeoutType === 'passenger') {
            // Auto-accept from Passenger A after 20 seconds
            if ($pooling->status === 'pending_passenger_a') {
                $pooling->update(['status' => 'passenger_a_accepted']);

                Log::info("Passenger A auto-accepted pool request {$pooling->id}");

                // Notify driver
                $pooler = $pooling->passenger;
                broadcast(new PoolRequestToDriver(
                    $pooling,
                    $pooler->name,
                    4.5, // Default rating if not available
                    '85%', // Route match
                    25, // Extra earnings (calculate dynamically)
                    '500m' // Pickup detour (calculate dynamically)
                ));

                // Schedule driver timeout
                dispatch(new ProcessPoolTimeout($pooling->id, 'driver'))
                    ->delay(now()->addSeconds(30));
            }
        } elseif ($this->timeoutType === 'driver') {
            // Auto-reject from driver after 30 seconds of silence
            if ($pooling->status === 'pending_driver' || $pooling->status === 'passenger_a_accepted') {
                $pooling->update(['status' => 'rejected_by_timeout']);

                Log::info("Driver auto-rejected pool request {$pooling->id} due to timeout");

                // Notify Passenger B immediately
                broadcast(new PoolRejected(
                    $pooling->passenger_id,
                    $pooling->id,
                    'timeout'
                ));

                // Retry: find the next-best match for Passenger B
                dispatch(new RetryPoolMatch($pooling->id, ($pooling->retry_count ?? 0) + 1))
                    ->delay(now()->addSeconds(2));
            }
        }
    }
}
