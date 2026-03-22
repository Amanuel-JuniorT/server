<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Pooling;
use App\Models\Ride;
use App\Http\Helper\RouteHelper;
use App\Events\PoolRequestToPassenger;
use App\Events\PoolRejected;
use App\Services\UnifiedNotificationService;
use Illuminate\Support\Facades\Log;

class RetryPoolMatch implements ShouldQueue
{
    use Queueable;

    /**
     * Maximum number of times we will try to find a new match.
     * After this, Passenger B gets a PoolRejected event and should fall back
     * to requesting a solo ride.
     */
    private const MAX_RETRIES = 3;

    public function __construct(
        public readonly int $poolingId,
        public readonly int $attempt = 1
    ) {}

    /**
     * Find the next-best match for the pooler after a rejection or timeout.
     *
     * Strategy:
     * 1. Load the original failed Pooling record(s) to build an exclusion list.
     * 2. Run the same matching routine as PoolingController::requestPoolRide.
     * 3. If a new match is found, create a fresh Pooling record and notify Passenger A.
     * 4. If no match found (or max retries hit), broadcast PoolRejected to Passenger B.
     */
    public function handle(UnifiedNotificationService $notificationService): void
    {
        $failedPooling = Pooling::with(['passenger'])->find($this->poolingId);

        if (!$failedPooling) {
            Log::warning("RetryPoolMatch: Pooling {$this->poolingId} not found.");
            return;
        }

        // Don't retry if the original request was already confirmed or cancelled
        if (in_array($failedPooling->status, ['confirmed', 'cancelled'])) {
            return;
        }

        $pooler = $failedPooling->passenger;

        if ($this->attempt > self::MAX_RETRIES) {
            Log::info("RetryPoolMatch: Max retries ({$this->attempt}) reached for pooler #{$pooler->id}. Giving up.");
            $failedPooling->update(['status' => 'no_match_found']);

            $notificationService->notifyUser(
                $pooler->id,
                'No Pool Found',
                'We couldn\'t find a matching shared ride. Searching for a solo ride...',
                ['pooling_id' => $this->poolingId],
                new PoolRejected($pooler->id, $this->poolingId, 'no_match_found'),
                'Passenger'
            );
            return;
        }

        // Build exclusion list: all ride_ids already tried for this pooler
        $excludedRideIds = Pooling::where('passenger_id', $pooler->id)
            ->whereIn('status', [
                'rejected_by_passenger_a',
                'rejected_by_driver',
                'rejected_by_timeout',
                'no_match_found',
            ])
            ->pluck('ride_id')
            ->toArray();

        // Also exclude the ride that just failed
        $excludedRideIds[] = $failedPooling->ride_id;

        Log::info("RetryPoolMatch: attempt {$this->attempt} for pooler #{$pooler->id}, excluding ride IDs: " . implode(',', $excludedRideIds));

        // Find compatible rides (same logic as PoolingController, minus excluded)
        $compatibleRides = Ride::with(['driver', 'passenger'])
            ->where('status', 'accepted')
            ->where('is_pool_enabled', true)
            ->where('passenger_accepts_pooling', true)
            ->whereNotIn('id', $excludedRideIds)
            ->whereBetween('destination_lat', [
                $failedPooling->destination_lat - 0.1,
                $failedPooling->destination_lat + 0.1,
            ])
            ->whereBetween('destination_lng', [
                $failedPooling->destination_lng - 0.1,
                $failedPooling->destination_lng + 0.1,
            ])
            ->limit(20)
            ->get();

        if ($compatibleRides->isEmpty()) {
            Log::info("RetryPoolMatch: No compatible rides found on attempt {$this->attempt}.");
            $this->giveUp($failedPooling, $pooler, $notificationService);
            return;
        }

        $matches = [];

        foreach ($compatibleRides as $ride) {
            $ridePolyline = $ride->encoded_route ?? RouteHelper::getCurrentRoutePolyline(
                $ride->origin_lat, $ride->origin_lng,
                $ride->destination_lat, $ride->destination_lng
            );

            if (!$ridePolyline) continue;

            $matchResult = RouteHelper::matchRoutes(
                [
                    'origin_lat'      => $failedPooling->origin_lat,
                    'origin_lng'      => $failedPooling->origin_lng,
                    'destination_lat' => $failedPooling->destination_lat,
                    'destination_lng' => $failedPooling->destination_lng,
                ],
                [
                    'origin_lat'      => $ride->origin_lat,
                    'origin_lng'      => $ride->origin_lng,
                    'destination_lat' => $ride->destination_lat,
                    'destination_lng' => $ride->destination_lng,
                ],
                $ridePolyline,
                ['max_origin_distance' => 3.0, 'max_dest_distance' => 3.0, 'min_match_score' => 0.7]
            );

            if ($matchResult['is_match']) {
                $matches[] = ['ride' => $ride, 'match_result' => $matchResult];
            }
        }

        if (empty($matches)) {
            Log::info("RetryPoolMatch: No route matches found on attempt {$this->attempt}.");
            $this->giveUp($failedPooling, $pooler, $notificationService);
            return;
        }

        usort($matches, fn($a, $b) => $b['match_result']['score'] <=> $a['match_result']['score']);
        $bestMatch = $matches[0];

        // Create a new Pooling record for the retry
        $newPooling = Pooling::create([
            'ride_id'         => $bestMatch['ride']->id,
            'passenger_id'    => $pooler->id,
            'driver_id'       => $bestMatch['ride']->driver_id,
            'origin_lat'      => $failedPooling->origin_lat,
            'origin_lng'      => $failedPooling->origin_lng,
            'destination_lat' => $failedPooling->destination_lat,
            'destination_lng' => $failedPooling->destination_lng,
            'status'          => 'pending_passenger_a',
            'retry_count'     => $this->attempt,
        ]);

        // Calculate detour
        $driverLat = $bestMatch['ride']->driver->latitude ?? $bestMatch['ride']->origin_lat;
        $driverLng = $bestMatch['ride']->driver->longitude ?? $bestMatch['ride']->origin_lng;
        $detourData = RouteHelper::calculateDetourEta(
            $driverLat, $driverLng,
            $bestMatch['ride']->destination_lat, $bestMatch['ride']->destination_lng,
            $failedPooling->origin_lat, $failedPooling->origin_lng,
            $failedPooling->destination_lat, $failedPooling->destination_lng
        );
        $detourMinutes = $detourData ? $detourData['extra_minutes'] : 4;
        $savings = 70 * 0.3; // TODO: dynamic fare calculation

        // Notify Passenger A of new request
        $notificationService->notifyUser(
            $bestMatch['ride']->passenger_id,
            'Pool Request',
            'Someone wants to join your ride! Save money by sharing.',
            ['pooling_id' => $newPooling->id],
            new PoolRequestToPassenger(
                $newPooling,
                $pooler->name,
                4.5,
                round($bestMatch['match_result']['score'] * 100) . '%',
                $savings,
                $detourMinutes
            ),
            'Passenger'
        );

        // Schedule timeout for Passenger A (20 seconds)
        dispatch(new ProcessPoolTimeout($newPooling->id, 'passenger'))
            ->delay(now()->addSeconds(20));

        Log::info("RetryPoolMatch: New pooling #{$newPooling->id} created on attempt {$this->attempt} for pooler #{$pooler->id}.");
    }

    private function giveUp(Pooling $failedPooling, $pooler, UnifiedNotificationService $notificationService): void
    {
        $failedPooling->update(['status' => 'no_match_found']);

        $notificationService->notifyUser(
            $pooler->id,
            'No Pool Found',
            'We couldn\'t find a matching shared ride. Searching for a solo ride...',
            ['pooling_id' => $failedPooling->id],
            new PoolRejected($pooler->id, $failedPooling->id, 'no_match_found'),
            'Passenger'
        );
    }
}
