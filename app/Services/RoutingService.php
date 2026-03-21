<?php

namespace App\Services;

use App\Models\CompanyRideGroup;
use App\Models\Driver;
use App\Models\Location;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RoutingService
{
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.google_maps.api_key');
    }

    /**
     * Get the optimal pickup order for a ride group.
     * Uses a greedy nearest-neighbor approach.
     * 
     * @param CompanyRideGroup $group
     * @param Driver|null $driver
     * @return array List of ordered member models
     */
    public function getOptimalPickupOrder(CompanyRideGroup $group, ?Driver $driver = null): array
    {
        $members = $group->members()->get();
        if ($members->isEmpty()) {
            return [];
        }

        // Start point: Driver's location or the group's default pickup (if it's a "from office" type)
        $startLat = null;
        $startLng = null;

        if ($driver) {
            $driverLocation = Location::where('driver_id', $driver->id)->first();
            if ($driverLocation) {
                $startLat = $driverLocation->latitude;
                $startLng = $driverLocation->longitude;
            }
        }

        // Fallback to group pickup location if driver location unknown or not provided
        if ($startLat === null) {
            $startLat = $group->pickup_lat;
            $startLng = $group->pickup_lng;
        }

        $orderedMembers = [];
        $unvisited = $members->all();

        $currentLat = $startLat;
        $currentLng = $startLng;

        while (!empty($unvisited)) {
            $closestIndex = 0;
            $minDist = $this->calculateDistance($currentLat, $currentLng, $unvisited[0]->pickup_lat, $unvisited[0]->pickup_lng);

            for ($i = 1; $i < count($unvisited); $i++) {
                $dist = $this->calculateDistance($currentLat, $currentLng, $unvisited[$i]->pickup_lat, $unvisited[$i]->pickup_lng);
                if ($dist < $minDist) {
                    $minDist = $dist;
                    $closestIndex = $i;
                }
            }

            $closest = $unvisited[$closestIndex];
            $orderedMembers[] = $closest;
            
            $currentLat = $closest->pickup_lat;
            $currentLng = $closest->pickup_lng;
            
            array_splice($unvisited, $closestIndex, 1);
        }

        return $orderedMembers;
    }

    /**
     * Get estimated travel time in minutes between two points.
     */
    public function getTravelTime(float $lat1, float $lng1, float $lat2, float $lng2): int
    {
        if ($this->apiKey) {
            try {
                $response = Http::get('https://maps.googleapis.com/maps/api/distancematrix/json', [
                    'origins' => "{$lat1},{$lng1}",
                    'destinations' => "{$lat2},{$lng2}",
                    'key' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if ($data['status'] === 'OK' && isset($data['rows'][0]['elements'][0]['duration']['value'])) {
                        // value is in seconds, convert to minutes
                        return ceil($data['rows'][0]['elements'][0]['duration']['value'] / 60);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Distance Matrix API failed: " . $e->getMessage());
            }
        }

        // Fallback: Haversine distance with average speed (30 km/h for city traffic)
        $distanceKm = $this->calculateDistance($lat1, $lng1, $lat2, $lng2);
        $averageSpeedKmh = 25; // Conservative estimate for Addis Ababa
        return ceil(($distanceKm / $averageSpeedKmh) * 60);
    }

    /**
     * Calculate Haversine distance between two points in km.
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
