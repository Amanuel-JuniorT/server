<?php

namespace App\Http\Helper;

class Haversine
{
	/**
 * Calculate distance between two points using Haversine formula
 *
 * @param float $lat1 Latitude of point 1
 * @param float $lon1 Longitude of point 1
 * @param float $lat2 Latitude of point 2
 * @param float $lon2 Longitude of point 2
 * @param string $unit 'km' or 'mi' (default: km)
 * @return float Distance in specified units
 */
public static function distance($lat1, $lon1, $lat2, $lon2, $unit = 'km')
{
    $earthRadius = ($unit === 'km') ? 6371 : 3959; // Radius in km or miles

    $latDelta = deg2rad($lat2 - $lat1);
    $lonDelta = deg2rad($lon2 - $lon1);

    $angle = 2 * asin(sqrt(
        pow(sin($latDelta / 2), 2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        pow(sin($lonDelta / 2), 2)
    ));

    return $angle * $earthRadius;
}
}
