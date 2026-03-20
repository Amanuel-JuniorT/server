<?php

namespace App\Http\Controllers;

use App\Models\DriverAgreement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DriverAgreementController extends Controller
{
    /**
     * Check the driver's agreement status
     */
    public function checkStatus()
    {
        try {
            $user = Auth::user();
            $driver = $user->driver;

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a driver'
                ], 403);
            }

            // The desired version string, could be managed in DB or config later
            $currentVersion = '1.0';

            $agreement = DriverAgreement::where('driver_id', $driver->id)
                ->where('version', $currentVersion)
                ->where('status', 'active')
                ->first();

            return response()->json([
                'success' => true,
                'has_agreed' => $agreement ? true : false,
                'agreement' => $agreement
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to check agreement status', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check agreement status'
            ], 500);
        }
    }

    /**
     * Driver accepts the current platform agreement
     */
    public function accept(Request $request)
    {
        try {
            $user = Auth::user();
            $driver = $user->driver;

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a driver'
                ], 403);
            }

            $currentVersion = '1.0'; // To keep it simple

            // Upsert agreement
            $agreement = DriverAgreement::updateOrCreate(
                [
                    'driver_id' => $driver->id,
                    'version' => $currentVersion,
                ],
                [
                    'status' => 'active',
                    'start_date' => now(),
                    'agreed_at' => now(),
                    // Optionally save terms JSON explicitly here if required
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Agreement accepted successfully',
                'data' => $agreement
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to accept agreement', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept agreement'
            ], 500);
        }
    }
}
