<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Helper\Haversine;
use App\Http\Helper\RouteHelper;
use App\Models\Ride;
use App\Models\Pooling;
use App\Models\User;
use App\Utils\PolyUtil;
use App\Events\PoolRequestToPassenger;
use App\Events\PoolRequestToDriver;
use App\Events\PoolConfirmed;
use App\Events\PoolRejected;
use App\Jobs\ProcessPoolTimeout;
use App\Jobs\RetryPoolMatch;
use Illuminate\Support\Facades\DB;

use App\Services\UnifiedNotificationService;

class PoolingController extends Controller
{
    public function __construct(
        private readonly UnifiedNotificationService $notificationService
    ) {}

    /**
     * Request a pool ride (Passenger B)
     */
    public function requestPoolRide(Request $request)
    {
        $request->validate([
            'origin_lat' => 'required|numeric',
            'origin_lng' => 'required|numeric',
            'destination_lat' => 'required|numeric',
            'destination_lng' => 'required|numeric',
            'polyline' => 'required|string',
        ]);

        $pooler = $request->user();

        // Find compatible rides
        $compatibleRides = Ride::with(['driver', 'passenger'])
            ->where('status', 'accepted')
            ->where('is_pool_enabled', true)
            ->where('passenger_accepts_pooling', true)
            ->whereBetween('destination_lat', [
                $request->destination_lat - 0.1,
                $request->destination_lat + 0.1
            ])
            ->whereBetween('destination_lng', [
                $request->destination_lng - 0.1,
                $request->destination_lng + 0.1
            ])
            ->limit(20)
            ->get();

        if ($compatibleRides->isEmpty()) {
            return response()->json([
                'message' => 'No pool rides available nearby'
            ], 404);
        }

        $matches = [];

        foreach ($compatibleRides as $ride) {
            // Get or generate route polyline
            $ridePolyline = $ride->encoded_route ?? RouteHelper::getCurrentRoutePolyline(
                $ride->origin_lat,
                $ride->origin_lng,
                $ride->destination_lat,
                $ride->destination_lng
            );

            if (!$ridePolyline) {
                continue;
            }

            // Calculate match score
            $poolerCoords = [
                'origin_lat' => $request->origin_lat,
                'origin_lng' => $request->origin_lng,
                'destination_lat' => $request->destination_lat,
                'destination_lng' => $request->destination_lng
            ];

            $rideCoords = [
                'origin_lat' => $ride->origin_lat,
                'origin_lng' => $ride->origin_lng,
                'destination_lat' => $ride->destination_lat,
                'destination_lng' => $ride->destination_lng
            ];

            $matchResult = RouteHelper::matchRoutes(
                $poolerCoords,
                $rideCoords,
                $ridePolyline,
                [
                    'max_origin_distance' => 3.0,
                    'max_dest_distance' => 3.0,
                    'min_match_score' => 0.7,
                ]
            );

            if ($matchResult['is_match']) {
                $matches[] = [
                    'ride' => $ride,
                    'match_result' => $matchResult
                ];
            }
        }

        if (empty($matches)) {
            return response()->json([
                'message' => 'No suitable pool matches found'
            ], 404);
        }

        // Sort by highest match score
        usort($matches, fn($a, $b) => $b['match_result']['score'] <=> $a['match_result']['score']);

        // Create pooling record for best match
        $bestMatch = $matches[0];
        $pooling = Pooling::create([
            'ride_id' => $bestMatch['ride']->id,
            'passenger_id' => $pooler->id,
            'driver_id' => $bestMatch['ride']->driver_id,
            'origin_lat' => $request->origin_lat,
            'origin_lng' => $request->origin_lng,
            'destination_lat' => $request->destination_lat,
            'destination_lng' => $request->destination_lng,
            'status' => 'pending_passenger_a'
        ]);

        // Calculate exact detour time
        $driverLat = $bestMatch['ride']->driver->latitude ?? $bestMatch['ride']->origin_lat;
        $driverLng = $bestMatch['ride']->driver->longitude ?? $bestMatch['ride']->origin_lng;

        $detourData = RouteHelper::calculateDetourEta(
            $driverLat,
            $driverLng,
            $bestMatch['ride']->destination_lat,
            $bestMatch['ride']->destination_lng,
            $request->origin_lat,
            $request->origin_lng,
            $request->destination_lat,
            $request->destination_lng
        );
        $detourMinutes = $detourData ? $detourData['extra_minutes'] : 4; // Fallback

        // Calculate savings (30% discount)
        $estimatedFare = 70; // Calculate dynamically based on distance
        $savings = $estimatedFare * 0.3;

        // Notify Passenger A (Hybrid)
        $this->notificationService->notifyUser(
            $bestMatch['ride']->passenger_id,
            "Pool Request",
            "Someone wants to join your ride! Save money by sharing.",
            ['pooling_id' => $pooling->id],
            new PoolRequestToPassenger(
                $pooling,
                $pooler->name,
                4.5,
                round($bestMatch['match_result']['score'] * 100) . '%',
                $savings,
                $detourMinutes
            ),
            'Passenger'
        );

        // Schedule timeout for Passenger A (20 seconds)
        dispatch(new ProcessPoolTimeout($pooling->id, 'passenger'))
            ->delay(now()->addSeconds(20));

        return response()->json([
            'message' => 'Pool request sent',
            'pooling_id' => $pooling->id,
            'status' => 'waiting_for_passenger_acceptance',
            'match_score' => $bestMatch['match_result']['score'],
            'estimated_savings' => $savings
        ]);
    }

    /**
     * Passenger A response to pool request
     */
    public function passengerResponse(Request $request, $poolingId)
    {
        $request->validate([
            'action' => 'required|in:accept,reject'
        ]);

        $pooling = Pooling::findOrFail($poolingId);

        // Verify this is Passenger A
        if ($pooling->ride->passenger_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->action === 'accept') {
            $pooling->update(['status' => 'passenger_a_accepted']);

            // Notify driver (Hybrid)
            $this->notificationService->notifyUser(
                $pooling->ride->driver->user_id,
                "Pool Request Update",
                "Both passengers agreed to pool! Confirm to start.",
                ['pooling_id' => $pooling->id],
                new PoolRequestToDriver(
                    $pooling,
                    $pooling->passenger->name,
                    4.5,
                    '85%',
                    25,
                    '+4 Minutes'
                ),
                'Driver'
            );

            // Schedule driver timeout (30 seconds)
            dispatch(new ProcessPoolTimeout($pooling->id, 'driver'))
                ->delay(now()->addSeconds(30));

            return response()->json([
                'message' => 'Pool request accepted',
                'status' => 'waiting_for_driver'
            ]);
        } else {
            $pooling->update(['status' => 'rejected_by_passenger_a']);

            // Notify Passenger B immediately
            $this->notificationService->notifyUser(
                $pooling->passenger_id,
                "Pool Request Rejected",
                "Your pool request was not accepted. Searching for another ride...",
                ['pooling_id' => $pooling->id],
                new PoolRejected(
                    $pooling->passenger_id,
                    $pooling->id,
                    'passenger_rejected'
                ),
                'Passenger'
            );

            // Retry: find the next-best match for Passenger B
            dispatch(new RetryPoolMatch($pooling->id, ($pooling->retry_count ?? 0) + 1))
                ->delay(now()->addSeconds(2));

            return response()->json(['message' => 'Pool request rejected']);
        }
    }

    /**
     * Driver response to pool request
     */
    public function driverResponse(Request $request, $poolingId)
    {
        $request->validate([
            'action' => 'required|in:accept,reject'
        ]);

        $pooling = Pooling::findOrFail($poolingId);

        // Verify this is the driver
        if ($pooling->driver_id !== $request->user()->driver->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->action === 'accept') {
            DB::transaction(function () use ($pooling) {
                // Create second ride record for Passenger B
                $originalRide = $pooling->ride;
                $poolRide = Ride::create([
                    'passenger_id' => $pooling->passenger_id,
                    'driver_id' => $pooling->driver_id,
                    'origin_lat' => $pooling->origin_lat,
                    'origin_lng' => $pooling->origin_lng,
                    'destination_lat' => $pooling->destination_lat,
                    'destination_lng' => $pooling->destination_lng,
                    'pickup_address' => 'Pool pickup', // Get from geocoding
                    'destination_address' => 'Pool destination',
                    'price' => $originalRide->price * 0.7, // 30% discount
                    'status' => 'accepted',
                    'is_pool_ride' => true,
                    'parent_ride_id' => $originalRide->id,
                    'pool_partner_ride_id' => $originalRide->id,
                    'requested_at' => now(),
                ]);

                // Update original ride
                $originalRide->update([
                    'pool_partner_ride_id' => $poolRide->id,
                    'price' => $originalRide->price * 0.7 // 30% discount
                ]);

                // Update pooling status
                $pooling->update(['status' => 'confirmed']);

                // Notify all parties (Passenger A, Passenger B, Driver)
                // Passenger B
                $this->notificationService->notifyUser(
                    $pooling->passenger_id,
                    "Pool Confirmed",
                    "Your shared ride has been confirmed!",
                    ['ride_id' => $poolRide->id],
                    null, // PoolConfirmed broadcasts globally
                    'Passenger'
                );
                
                // Passenger A
                $this->notificationService->notifyUser(
                    $pooling->ride->passenger_id,
                    "Pool Confirmed",
                    "Pool confirmed! Your fare has been reduced.",
                    ['ride_id' => $pooling->ride_id],
                    null,
                    'Passenger'
                );

                broadcast(new PoolConfirmed($pooling, $poolRide->id));
            });

            return response()->json([
                'message' => 'Pool confirmed',
                'status' => 'confirmed'
            ]);
        } else {
            $pooling->update(['status' => 'rejected_by_driver']);

            // Notify Passenger B immediately
            $this->notificationService->notifyUser(
                $pooling->passenger_id,
                "Pool Request Rejected",
                "The driver couldn't take you both. Searching for another ride...",
                ['pooling_id' => $pooling->id],
                new PoolRejected(
                    $pooling->passenger_id,
                    $pooling->id,
                    'driver_rejected'
                ),
                'Passenger'
            );

            // Retry: find the next-best match for Passenger B
            dispatch(new RetryPoolMatch($pooling->id, ($pooling->retry_count ?? 0) + 1))
                ->delay(now()->addSeconds(2));

            return response()->json(['message' => 'Pool request rejected']);
        }
    }

    /**
     * Cancel pool request (Passenger B)
     */
    public function cancelPoolRequest(Request $request, $poolingId)
    {
        $pooling = Pooling::findOrFail($poolingId);

        // Verify this is Passenger B
        if ($pooling->passenger_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pooling->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Pool request cancelled']);
    }
}
