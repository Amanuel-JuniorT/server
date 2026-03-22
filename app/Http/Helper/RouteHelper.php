<?php

namespace App\Http\Helper;

use App\Utils\PolyUtil;
use Illuminate\Support\Facades\Http;

class RouteHelper
{
    /**
     * Comprehensive route matching algorithm
     *
     * @param array $route1Coords Origin and destination coordinates for first route
     * @param array $route2Coords Origin and destination coordinates for second route
     * @param string $route2Polyline Encoded polyline for second route
     * @param array $options Matching options and thresholds
     * @return array Match score and detailed analysis
     */
    public static function matchRoutes($route1Coords, $route2Coords, $route2Polyline, $options = [])
    {
        // Default options
        $defaults = [
            'max_origin_distance' => 2.0, // km
            'max_dest_distance' => 2.0,   // km
            'route_overlap_threshold' => 0.1, // km (100m)
            'direction_tolerance' => 45,   // degrees
            'min_match_score' => 0.6,     // minimum score to consider a match
            'weights' => [
                'proximity' => 0.4,       // origin/destination proximity
                'direction' => 0.3,        // route direction similarity
                'overlap' => 0.3           // route path overlap
            ]
        ];

        $options = array_merge($defaults, $options);

        // 1. Calculate origin and destination distances
        $originDistance = Haversine::distance(
            $route1Coords['origin_lat'],
            $route1Coords['origin_lng'],
            $route2Coords['origin_lat'],
            $route2Coords['origin_lng']
        );

        $destDistance = Haversine::distance(
            $route1Coords['destination_lat'],
            $route1Coords['destination_lng'],
            $route2Coords['destination_lat'],
            $route2Coords['destination_lng']
        );

        // 2. Calculate proximity score (0-1)
        $originProximityScore = max(0, 1 - ($originDistance / $options['max_origin_distance']));
        $destProximityScore = max(0, 1 - ($destDistance / $options['max_dest_distance']));
        $proximityScore = ($originProximityScore + $destProximityScore) / 2;

        // 3. Calculate direction similarity
        $route1Bearing = self::calculateBearing(
            $route1Coords['origin_lat'],
            $route1Coords['origin_lng'],
            $route1Coords['destination_lat'],
            $route1Coords['destination_lng']
        );

        $route2Bearing = self::calculateBearing(
            $route2Coords['origin_lat'],
            $route2Coords['origin_lng'],
            $route2Coords['destination_lat'],
            $route2Coords['destination_lng']
        );

        $bearingDifference = abs($route1Bearing - $route2Bearing);
        // Handle angle wrapping (e.g., 350° vs 10° should be 20° difference, not 340°)
        if ($bearingDifference > 180) {
            $bearingDifference = 360 - $bearingDifference;
        }

        $directionScore = max(0, 1 - ($bearingDifference / $options['direction_tolerance']));

        // 4. Calculate route overlap (if polyline is provided)
        $overlapScore = 0;
        $route2Points = [];

        if ($route2Polyline) {
            $route2Points = PolyUtil::decode($route2Polyline);

            // For route overlap, we need to simulate route1's path
            // Since we don't have route1's polyline, we'll create a simplified path
            $route1Points = self::generateSimplifiedRoute(
                $route1Coords['origin_lat'],
                $route1Coords['origin_lng'],
                $route1Coords['destination_lat'],
                $route1Coords['destination_lng']
            );

            $overlapScore = self::calculateRouteOverlap($route1Points, $route2Points, $options['route_overlap_threshold']);
        }

        // 5. Calculate weighted final score
        $finalScore = ($proximityScore * $options['weights']['proximity']) +
                     ($directionScore * $options['weights']['direction']) +
                     ($overlapScore * $options['weights']['overlap']);

        // 6. Determine if it's a match
        $isMatch = $finalScore >= $options['min_match_score'];

        return [
            'is_match' => $isMatch,
            'score' => round($finalScore, 3),
            'details' => [
                'proximity_score' => round($proximityScore, 3),
                'direction_score' => round($directionScore, 3),
                'overlap_score' => round($overlapScore, 3),
                'origin_distance_km' => round($originDistance, 2),
                'dest_distance_km' => round($destDistance, 2),
                'bearing_difference_degrees' => round($bearingDifference, 1),
                'route1_bearing' => round($route1Bearing, 1),
                'route2_bearing' => round($route2Bearing, 1)
            ]
        ];
    }

    /**
     * Generate a simplified route path between two points
     */
    private static function generateSimplifiedRoute($originLat, $originLng, $destLat, $destLng)
    {
        // Create a simple straight-line path with intermediate points
        $numPoints = 10;
        $points = [];

        for ($i = 0; $i <= $numPoints; $i++) {
            $ratio = $i / $numPoints;
            $lat = $originLat + ($destLat - $originLat) * $ratio;
            $lng = $originLng + ($destLng - $originLng) * $ratio;

            $points[] = ['lat' => $lat, 'lng' => $lng];
        }

        return $points;
    }

    /**
     * Calculate overlap between two route paths
     */
    private static function calculateRouteOverlap($route1Points, $route2Points, $threshold)
    {
        $sharedPoints = 0;
        $totalComparisons = 0;

        foreach ($route1Points as $point1) {
            foreach ($route2Points as $point2) {
                $distance = Haversine::distance(
                    $point1['lat'],
                    $point1['lng'],
                    $point2['lat'],
                    $point2['lng']
                );

                if ($distance <= $threshold) {
                    $sharedPoints++;
                    break; // Found a match for this point, move to next
                }
            }
            $totalComparisons++;
        }

        return $totalComparisons > 0 ? $sharedPoints / $totalComparisons : 0;
    }

    public static function calculateRouteMatchScore($newPolyline, $existingPolyline, $newCoords, $existingCoords)
    {
        // 1️⃣ Decode polylines
        $newPoints = PolyUtil::decode($newPolyline);
        $existingPoints = PolyUtil::decode($existingPolyline);

        // 2️⃣ Calculate start/end distances (meters)
        $startDist = Haversine::distance(
            $newCoords['origin_lat'],
            $newCoords['origin_lng'],
            $existingCoords['origin_lat'],
            $existingCoords['origin_lng']
        );
        $endDist = Haversine::distance(
            $newCoords['destination_lat'],
            $newCoords['destination_lng'],
            $existingCoords['destination_lat'],
            $existingCoords['destination_lng']
        );

        // Normalize proximity score (0-1)
        $proximityScore = max(0, 1 - (($startDist + $endDist) / 10000)); // 10km range

        // 3️⃣ Calculate bearing difference (direction)
        $bearing1 = self::calculateBearing(
            $newCoords['origin_lat'],
            $newCoords['origin_lng'],
            $newCoords['destination_lat'],
            $newCoords['destination_lng']
        );
        $bearing2 = self::calculateBearing(
            $existingCoords['origin_lat'],
            $existingCoords['origin_lng'],
            $existingCoords['destination_lat'],
            $existingCoords['destination_lng']
        );

        $directionDiff = abs($bearing1 - $bearing2);
        $directionScore = max(0, 1 - ($directionDiff / 180)); // 0-180 degrees

        // 4️⃣ Calculate route overlap (shared points)
        $sharedPoints = 0;
        foreach ($newPoints as $point) {
            foreach ($existingPoints as $ePoint) {
                if (Haversine::distance($point['lat'], $point['lng'], $ePoint['lat'], $ePoint['lng']) < 0.1) {
                    $sharedPoints++;
                    break;
                }
            }
        }
        $routeScore = $sharedPoints / max(count($newPoints), count($existingPoints));

        // 5️⃣ Final weighted score
        return ($routeScore * 0.5) + ($proximityScore * 0.3) + ($directionScore * 0.2);
    }

    private static function calculateBearing($lat1, $lng1, $lat2, $lng2)
    {
        $lat1 = deg2rad($lat1);
        $lat2 = deg2rad($lat2);
        $diffLng = deg2rad($lng2 - $lng1);

        $x = sin($diffLng) * cos($lat2);
        $y = cos($lat1) * sin($lat2) - sin($lat1) * cos($lat2) * cos($diffLng);

        $initialBearing = atan2($x, $y);
        $initialBearing = rad2deg($initialBearing);

        // Normalize to 0–360°
        return fmod(($initialBearing + 360), 360);
    }

    public static function getCurrentRoutePolyline($originLat, $originLng, $destLat, $destLng)
    {
        $apiKey = env("GOOGLE_DIRECTION_API_KEY");
        $url = "https://maps.googleapis.com/maps/api/directions/json?" . http_build_query([
            'origin' => "$originLat,$originLng",
            'destination' => "$destLat,$destLng",
            'key' => $apiKey
        ]);

        $response = Http::get($url);

        if ($response->failed()) {
            return null;
        }

        $json = $response->json();

        if (empty($json['routes'][0]['overview_polyline']['points'])) {
            return null;
        }

        return $json['routes'][0]['overview_polyline']['points'];
    }

    public static function calculateDetourEta($driverLat, $driverLng, $hostDestLat, $hostDestLng, $joinerOrgLat, $joinerOrgLng, $joinerDestLat, $joinerDestLng)
    {
        $apiKey = env("GOOGLE_DIRECTION_API_KEY");
        if (!$apiKey) return null;

        // 1. Get original ETA (Driver -> Host Dest)
        $originalUrl = "https://maps.googleapis.com/maps/api/directions/json?" . http_build_query([
            'origin' => "$driverLat,$driverLng",
            'destination' => "$hostDestLat,$hostDestLng",
            'key' => $apiKey
        ]);
        
        $originalResponse = Http::get($originalUrl);
        $originalDurationSeconds = 0;
        
        if ($originalResponse->successful()) {
            $json = $originalResponse->json();
            if (!empty($json['routes'][0]['legs'])) {
                $originalDurationSeconds = $json['routes'][0]['legs'][0]['duration']['value'];
            }
        }

        // 2. Get detour ETA (Driver -> Joiner Org -> Joiner Dest -> Host Dest)
        $detourUrl = "https://maps.googleapis.com/maps/api/directions/json?" . http_build_query([
            'origin' => "$driverLat,$driverLng",
            'destination' => "$hostDestLat,$hostDestLng",
            'waypoints' => "optimize:false|$joinerOrgLat,$joinerOrgLng|$joinerDestLat,$joinerDestLng",
            'key' => $apiKey
        ]);

        $detourResponse = Http::get($detourUrl);
        if ($detourResponse->failed()) {
            return null;
        }

        $json = $detourResponse->json();
        if (empty($json['routes'][0]['legs'])) {
            return null;
        }

        $totalDetourDurationSeconds = 0;
        foreach ($json['routes'][0]['legs'] as $leg) {
            $totalDetourDurationSeconds += $leg['duration']['value'];
        }

        $extraSeconds = $totalDetourDurationSeconds - $originalDurationSeconds;
        $extraMinutes = (int) round($extraSeconds / 60);
        
        return [
            'extra_minutes' => max(0, $extraMinutes),
            'detour_polyline' => $json['routes'][0]['overview_polyline']['points'] ?? null,
            'total_duration_seconds' => $totalDetourDurationSeconds
        ];
    }
}
