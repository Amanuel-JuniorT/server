<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ride;
use Illuminate\Support\Facades\Auth;

class DriverTripController extends Controller
{
    /**
     * Get ride history for the authenticated driver
     */
    public function history(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get the driver record for this user
            $driver = \App\Models\Driver::where('user_id', $user->id)->first();
            
            if (!$driver) {
                return response()->json([
                    'status' => false,
                    'message' => 'Driver profile not found',
                    'data' => []
                ], 404);
            }

            $rides = Ride::with('passenger:id,name,email,phone') // eager load passenger details
                        ->where('driver_id', $driver->id)
                        ->where('status', 'completed')
                        ->orderBy('completed_at', 'desc')
                        ->get();

            // Transform the data to include all necessary fields
            $transformedRides = $rides->map(function ($ride) {
                return [
                    'id' => $ride->id,
                    'passenger_id' => $ride->passenger_id,
                    'passenger_name' => $ride->passenger ? $ride->passenger->name : 'Unknown',
                    'passenger_phone' => $ride->passenger ? $ride->passenger->phone : 'N/A',
                    'driver_id' => $ride->driver_id,
                    'origin' => $ride->pickup_address, // Map pickup_address to origin
                    'destination' => $ride->destination_address, // Map destination_address to destination
                    'origin_lat' => $ride->origin_lat,
                    'origin_lng' => $ride->origin_lng,
                    'destination_lat' => $ride->destination_lat,
                    'destination_lng' => $ride->destination_lng,
                    'pickup_address' => $ride->pickup_address,
                    'destination_address' => $ride->destination_address,
                    'price' => $ride->price,
                    'status' => $ride->status,
                    'created_at' => $ride->created_at,
                    'updated_at' => $ride->updated_at,
                    'requested_at' => $ride->requested_at,
                    'started_at' => $ride->started_at,
                    'completed_at' => $ride->completed_at,
                ];
            });

            return response()->json($transformedRides, 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching ride history: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching ride history',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}
