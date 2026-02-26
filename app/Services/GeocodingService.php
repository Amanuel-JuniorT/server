<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    private $apiKey;
    private $baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    public function __construct()
    {
        $this->apiKey = config('services.google_maps.api_key');
    }

    /**
     * Convert coordinates to readable address using Google Geocoding API
     */
    public function reverseGeocode(float $latitude, float $longitude): ?string
    {
        if (!$this->apiKey) {
            Log::warning('Google Maps API key not configured for reverse geocoding');
            return $this->getFallbackAddress($latitude, $longitude);
        }

        try {
            $response = Http::get($this->baseUrl, [
                'latlng' => "{$latitude},{$longitude}",
                'key' => $this->apiKey,
                'language' => 'en',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['status'] === 'OK' && !empty($data['results'])) {
                    $result = $data['results'][0];
                    return $result['formatted_address'] ?? $this->getFallbackAddress($latitude, $longitude);
                }
            }

            Log::warning('Geocoding API request failed', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'response' => $response->body()
            ]);

        } catch (\Exception $e) {
            Log::error('Geocoding service error', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'error' => $e->getMessage()
            ]);
        }

        return $this->getFallbackAddress($latitude, $longitude);
    }

    /**
     * Get a fallback address when geocoding fails
     */
    private function getFallbackAddress(float $latitude, float $longitude): string
    {
        // Try to determine approximate location based on coordinates
        $lat = round($latitude, 4);
        $lng = round($longitude, 4);
        
        // Simple location approximation for Ethiopia (Addis Ababa area)
        if ($lat >= 8.5 && $lat <= 9.5 && $lng >= 38.0 && $lng <= 39.0) {
            return "Addis Ababa Area ({$lat}, {$lng})";
        }
        
        // Generic fallback
        return "Location ({$lat}, {$lng})";
    }

    /**
     * Batch reverse geocode multiple coordinates
     */
    public function batchReverseGeocode(array $coordinates): array
    {
        $addresses = [];
        
        foreach ($coordinates as $index => $coord) {
            $addresses[$index] = $this->reverseGeocode($coord['lat'], $coord['lng']);
        }
        
        return $addresses;
    }
}
