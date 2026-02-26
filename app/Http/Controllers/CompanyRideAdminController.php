<?php

namespace App\Http\Controllers;

use App\Models\CompanyGroupRideInstance;
use App\Models\Driver;
use App\Events\CompanyRideDriverAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyRideAdminController extends Controller
{
    /**
     * Admin assigns a driver to a company ride
     */
    public function assignDriver(Request $request, $rideId)
    {
        try {
            $user = $request->user();

            // Check if user is admin (you may want to add admin check middleware)
            // For now, we'll allow any authenticated user (you should add proper admin check)

            $validated = $request->validate([
                'driver_id' => 'required|exists:drivers,id',
            ]);

            $ride = CompanyGroupRideInstance::where('id', $rideId)
                ->where('status', 'pending')
                ->first();

            if (!$ride) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ride not found or not in pending status'
                ], 404);
            }

            $driver = Driver::find($validated['driver_id']);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver not found'
                ], 404);
            }

            // Check if driver is available
            if ($driver->status !== 'available') {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver is not available'
                ], 400);
            }

            DB::beginTransaction();
            try {
                $ride->driver_id = $driver->id;
                $ride->status = 'accepted';
                $ride->save();

                // Update driver status
                $driver->status = 'on_ride';
                $driver->save();

                DB::commit();

                Log::info('Company ride assigned to driver', [
                    'ride_id' => $ride->id,
                    'driver_id' => $driver->id
                ]);

                // Broadcast event
                broadcast(new CompanyRideDriverAssigned($ride->fresh()));

                return response()->json([
                    'success' => true,
                    'data' => [
                        'ride' => $ride->fresh()->load(['company', 'employee', 'driver.user', 'driver.vehicle'])
                    ],
                    'message' => 'Driver assigned successfully'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Failed to assign driver to company ride', [
                'ride_id' => $rideId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign driver',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all pending company rides
     */
    public function getPendingRides(Request $request)
    {
        try {
            $rides = CompanyGroupRideInstance::with(['company', 'employee'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'rides' => $rides
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pending company rides', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending rides',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get company ride statistics
     */
    public function getCompanyRideStats(Request $request)
    {
        try {
            $stats = [
                'total' => CompanyGroupRideInstance::count(),
                'pending' => CompanyGroupRideInstance::where('status', 'pending')->count(),
                'accepted' => CompanyGroupRideInstance::where('status', 'accepted')->count(),
                'in_progress' => CompanyGroupRideInstance::where('status', 'in_progress')->count(),
                'completed' => CompanyGroupRideInstance::where('status', 'completed')->count(),
                'cancelled' => CompanyGroupRideInstance::where('status', 'cancelled')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch company ride stats', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
