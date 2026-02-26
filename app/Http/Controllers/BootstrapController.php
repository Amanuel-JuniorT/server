<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ride;
use App\Models\User;
use App\Models\VehicleType;

class BootstrapController extends Controller
{
  public function index(Request $request)
  {
    
    $user = $request->user('sanctum');

    if(!$user){
      return response()->json([
        'user' => null,
        'auth' => [
          'valid' => false,
        ],
        'ride' => null,
        'config' => [
          'min_app_version' => '1.0.0',
          'maintenance' => false,
          'vehicle_types_version' => (string) (VehicleType::latest('updated_at')->first()?->updated_at?->toIso8601String() ?? '0'),
          'features' => [
            'pooling' => true,
            'wallet' => true
          ]
        ],
      ], 200);
    }

    // 1. User Data
    $userData = null;
    if ($user) {
      $userData = [
        'id' => $user->id,
        'name' => $user->name,
        'role' => $user->role,
        'phone' => $user->phone,
        'email' => $user->email,
        'profile_picture' => $user->profile_picture,
        'company_id' => $user->company_id,
        'company_status' => (function () use ($user) {
          $ce = $user->getLatestCompanyEmployee();
          if (!$ce) return 'none';
          if ($ce->status === 'approved') return 'linked';
          if ($ce->status === 'pending') return 'pending';
          return 'none';
        })(),
        // Add any other critical user fields here
      ];
    }

    // 2. Auth Status
    $authData = [
      'valid' => $user ? true : false,
      // 'expires_at' => ... (Sanctum tokens don't expire easily, but we can return validity)
    ];

    // 3. Ride Status
    $rideData = null;
    if ($user) {
      $activeRide = Ride::where(function ($query) use ($user) {
        $query->where('passenger_id', $user->id)
          ->orWhere('driver_id', $user->id); // Covers both roles
      })
        ->whereIn('status', ['requested', 'accepted', 'arrived', 'in_progress', 'started'])
        ->latest()
        ->first();

      if ($activeRide) {
        $rideData = [
          'status' => strtoupper($activeRide->status), // ONGOING, REQUESTED
          'ride_id' => $activeRide->id,
          'driver_id' => $activeRide->driver_id,
          'passenger_id' => $activeRide->passenger_id,
          // Minimal data needed to redirect
        ];
      } else {
        // Check for recently expired ride (last 5 mins)
        $expiredRide = Ride::where('passenger_id', $user->id)
          ->where('status', 'expired')
          ->where('updated_at', '>=', now()->subMinutes(5)) // Only recent
          ->latest()
          ->first();

        if ($expiredRide) {
          $rideData = [
            'status' => 'EXPIRED',
            'ride_id' => $expiredRide->id,
            'expired_at' => $expiredRide->updated_at->toIso8601String(),
          ];
        }
      }
    }

    // 4. App Config
    $configData = [
      'min_app_version' => '1.0.0', // Read from config/app.php or DB
      'maintenance' => false,
      'vehicle_types_version' => (string) (VehicleType::latest('updated_at')->first()?->updated_at?->toIso8601String() ?? '0'),
      'features' => [
        'pooling' => true,
        'wallet' => true
      ]
    ];

    return response()->json([
      'user' => $userData,
      'auth' => $authData,
      'ride' => $rideData,
      'config' => $configData,
    ]);
  }
}
