<?php

namespace App\Jobs;

use App\Models\CompanyGroupRideInstance;
use App\Services\UnifiedNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifyDriversOfAvailableRide implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly CompanyGroupRideInstance $ride
    ) {}

    public function handle(UnifiedNotificationService $notificationService): void
    {
        $ride = $this->ride;

        if (!$ride || $ride->status !== 'requested' || $ride->driver_id !== null) {
            Log::info('NotifyDriversOfAvailableRide: ride already assigned or not in requested state', [
                'ride_id' => $ride?->id,
            ]);
            return;
        }

        $today = now()->toDateString();

        // Find all eligible drivers: active contract with the company + approved + available
        $eligibleDriverIds = DB::table('company_driver_contracts')
            ->where('company_id', $ride->company_id)
            ->where('status', 'active')
            ->where('start_date', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', $today);
            })
            ->pluck('driver_id');

        if ($eligibleDriverIds->isEmpty()) {
            Log::warning('NotifyDriversOfAvailableRide: no eligible contracted drivers found', [
                'company_id' => $ride->company_id,
                'ride_id'    => $ride->id,
            ]);
            return;
        }

        // Resolve the user IDs for these drivers
        $driverUserIds = DB::table('drivers')
            ->whereIn('id', $eligibleDriverIds)
            ->where('status', 'available')
            ->where('approval_state', 'approved')
            ->pluck('user_id');

        if ($driverUserIds->isEmpty()) {
            Log::info('NotifyDriversOfAvailableRide: no available drivers to notify', [
                'ride_id' => $ride->id,
            ]);
            return;
        }

        $companyName     = $ride->company?->name ?? 'A company';
        $scheduledTime   = $ride->scheduled_time?->format('H:i') ?? 'N/A';
        $destination     = $ride->destination_address ?? 'the destination';

        foreach ($driverUserIds as $userId) {
            try {
                $notificationService->notifyUser(
                    $userId,
                    'Company Ride Available',
                    "{$companyName} needs a driver for a ride at {$scheduledTime} to {$destination}. Open the app to accept!",
                    ['company_ride_id' => $ride->id, 'type' => 'company_ride_available'],
                    null,
                    'Driver'
                );
            } catch (\Exception $e) {
                Log::error('Failed to notify driver about available company ride', [
                    'user_id' => $userId,
                    'ride_id' => $ride->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        Log::info('NotifyDriversOfAvailableRide: notifications sent', [
            'ride_id'        => $ride->id,
            'notified_count' => count($driverUserIds),
        ]);
    }
}
