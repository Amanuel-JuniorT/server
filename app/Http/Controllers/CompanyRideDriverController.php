<?php

namespace App\Http\Controllers;

use App\Models\CompanyGroupRideInstance;
use App\Events\CompanyRideDriverAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

use App\Services\UnifiedNotificationService;

class CompanyRideDriverController extends Controller
{
  public function __construct(
    private readonly UnifiedNotificationService $notificationService
  ) {}

  /**
   * Get all company rides assigned to the authenticated driver
   */
  public function getAssignedRides(Request $request)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $rides = CompanyGroupRideInstance::with(['company', 'employee', 'driver', 'rideGroup.members.employee'])
        ->where('driver_id', $driver->id)
        ->orderBy('created_at', 'desc')
        ->get();

      return response()->json([
        'success' => true,
        'data' => [
          'rides' => $rides
        ]
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch driver company rides', [
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch rides',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get active company ride for the driver (if any)
   */
  public function getActiveRide(Request $request)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $ride = CompanyGroupRideInstance::with(['company', 'employee', 'rideGroup.members.employee'])
        ->where('driver_id', $driver->id)
        ->whereIn('status', ['accepted', 'in_progress'])
        ->orderBy('created_at', 'desc')
        ->first();

      if (!$ride) {
        return response()->json([
          'success' => true,
          'data' => [
            'ride' => null
          ],
          'message' => 'No active ride'
        ]);
      }

      return response()->json([
        'success' => true,
        'data' => [
          'ride' => $ride
        ]
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch active company ride', [
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch active ride',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get specific company ride details
   */
  public function getRide(Request $request, $id)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $ride = CompanyGroupRideInstance::with(['company', 'employee', 'rideGroup.members.employee'])
        ->where('id', $id)
        ->where('driver_id', $driver->id)
        ->first();

      if (!$ride) {
        return response()->json([
          'success' => false,
          'message' => 'Ride not found or not assigned to you'
        ], 404);
      }

      return response()->json([
        'success' => true,
        'data' => [
          'ride' => $ride
        ]
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch company ride details', [
        'ride_id' => $id,
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch ride details',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Driver starts a company ride
   */
  public function startRide(Request $request, $id)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $ride = CompanyGroupRideInstance::where('id', $id)
        ->where('driver_id', $driver->id)
        ->where('status', 'accepted')
        ->first();

      if (!$ride) {
        return response()->json([
          'success' => false,
          'message' => 'Ride not found, not assigned to you, or not in accepted status'
        ], 404);
      }

      DB::beginTransaction();
      try {
        $ride->status = 'in_progress';
        $ride->started_at = now();
        $ride->save();

        DB::commit();

        Log::info('Company ride started by driver', [
          'ride_id' => $ride->id,
          'driver_id' => $driver->id
        ]);

        // Broadcast event to notify company admin
        broadcast(new CompanyRideDriverAssigned($ride->fresh()));

        // Notify employee (Hybrid)
        if ($ride->employee_id) {
          $this->notificationService->notifyUser(
            $ride->employee_id,
            "Company Ride Started",
            "Your driver is on the way for your company ride to {$ride->destination_address}",
            ['ride_id' => $ride->id],
            null,
            'Passenger'
          );
        }

        return response()->json([
          'success' => true,
          'data' => [
            'ride' => $ride->fresh()
          ],
          'message' => 'Ride started successfully'
        ]);
      } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
      }
    } catch (\Exception $e) {
      Log::error('Failed to start company ride', [
        'ride_id' => $id,
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to start ride',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Driver completes a company ride
   */
  public function completeRide(Request $request, $id)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $ride = CompanyGroupRideInstance::where('id', $id)
        ->where('driver_id', $driver->id)
        ->where('status', 'in_progress')
        ->first();

      if (!$ride) {
        return response()->json([
          'success' => false,
          'message' => 'Ride not found, not assigned to you, or not in progress'
        ], 404);
      }

      DB::beginTransaction();
      try {
        $ride->status = 'completed';
        $ride->completed_at = now();
        $ride->save();

        // Set driver back to available
        $driver->status = 'available';
        $driver->save();

        DB::commit();

        Log::info('Company ride completed by driver', [
          'ride_id' => $ride->id,
          'driver_id' => $driver->id
        ]);

        // Broadcast event to notify company admin
        broadcast(new CompanyRideDriverAssigned($ride->fresh()));

        // Notify employee (Hybrid)
        if ($ride->employee_id) {
          $this->notificationService->notifyUser(
            $ride->employee_id,
            "Company Ride Completed",
            "Your company ride has been completed. Have a great day!",
            ['ride_id' => $ride->id],
            null,
            'Passenger'
          );
        }

        return response()->json([
          'success' => true,
          'data' => [
            'ride' => $ride->fresh()
          ],
          'message' => 'Ride completed successfully'
        ]);
      } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
      }
    } catch (\Exception $e) {
      Log::error('Failed to complete company ride', [
        'ride_id' => $id,
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to complete ride',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Driver cancels a company ride
   */
  public function cancelRide(Request $request, $id)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      $ride = CompanyGroupRideInstance::where('id', $id)
        ->where('driver_id', $driver->id)
        ->whereIn('status', ['accepted', 'in_progress'])
        ->first();

      if (!$ride) {
        return response()->json([
          'success' => false,
          'message' => 'Ride not found, not assigned to you, or cannot be cancelled'
        ], 404);
      }

      DB::beginTransaction();
      try {
        $ride->status = 'cancelled';
        $ride->save();

        // Set driver back to available
        $driver->status = 'available';
        $driver->save();

        DB::commit();

        Log::info('Company ride cancelled by driver', [
          'ride_id' => $ride->id,
          'driver_id' => $driver->id
        ]);

        // Broadcast event to notify company admin
        broadcast(new CompanyRideDriverAssigned($ride->fresh()));

        // Notify employee (Hybrid)
        if ($ride->employee_id) {
          $this->notificationService->notifyUser(
            $ride->employee_id,
            "Company Ride Cancelled",
            "Your company ride has been cancelled by the driver.",
            ['ride_id' => $ride->id],
            null,
            'Passenger'
          );
        }

        return response()->json([
          'success' => true,
          'data' => [
            'ride' => $ride->fresh()
          ],
          'message' => 'Ride cancelled successfully'
        ]);
      } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
      }
    } catch (\Exception $e) {
      Log::error('Failed to cancel company ride', [
        'ride_id' => $id,
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to cancel ride',
        'error' => $e->getMessage()
      ], 500);
    }
  }


  /**
   * Get available company rides (requested and unassigned)
   */
  public function getAvailableRides(Request $request)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      // Rides that are requested and have no driver assigned
      $rides = CompanyGroupRideInstance::with(['company', 'employee', 'rideGroup.members.employee'])
        ->where('status', 'requested')
        ->whereNull('driver_id')
        ->orderBy('created_at', 'desc')
        ->get();

      return response()->json([
        'success' => true,
        'data' => [
          'rides' => $rides
        ]
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch available company rides', [
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch available rides',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Driver accepts a company ride
   */
  public function acceptRide(Request $request, $id)
  {
    try {
      $user = $request->user();
      $driver = $user->driver;

      if (!$driver) {
        return response()->json([
          'success' => false,
          'message' => 'User is not a driver'
        ], 403);
      }

      // Check if driver is approved
      if ($driver->approval_state !== 'approved') {
        return response()->json([
          'success' => false,
          'message' => 'You must be an approved driver to accept rides'
        ], 403);
      }

      // Check if driver already has an active ride
      $activeRide = CompanyGroupRideInstance::where('driver_id', $driver->id)
        ->whereIn('status', ['accepted', 'in_progress'])
        ->exists();

      if ($activeRide) {
        return response()->json([
          'success' => false,
          'message' => 'You already have an active ride'
        ], 409);
      }

      DB::beginTransaction();
      try {
        $ride = CompanyGroupRideInstance::lockForUpdate()->find($id);

        if (!$ride) {
          DB::rollBack();
          return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        if ($ride->status !== 'requested' || $ride->driver_id !== null) {
          DB::rollBack();
          return response()->json(['success' => false, 'message' => 'Ride is no longer available'], 409);
        }

        // Assign driver
        $ride->driver_id = $driver->id;
        $ride->status = 'accepted';
        $ride->accepted_at = now();
        $ride->save();

        // Update driver status
        $driver->status = 'on_ride'; // Or 'busy'
        $driver->save();

        DB::commit();

        Log::info('Company ride accepted by driver', [
          'ride_id' => $ride->id,
          'driver_id' => $driver->id
        ]);

        // Notify employee (Hybrid)
        if ($ride->employee_id) {
          $this->notificationService->notifyUser(
            $ride->employee_id,
            "Driver Assigned",
            "A driver has been assigned to your company ride request.",
            ['ride_id' => $ride->id],
            null,
            'Passenger'
          );
        }

        broadcast(new CompanyRideDriverAssigned($ride->fresh()));

        return response()->json([
          'success' => true,
          'data' => ['ride' => $ride->fresh()],
          'message' => 'Ride accepted successfully'
        ]);
      } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
      }
    } catch (\Exception $e) {
      Log::error('Failed to accept company ride', [
        'ride_id' => $id,
        'driver_id' => $user->driver->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to accept ride',
        'error' => $e->getMessage()
      ], 500);
    }
  }
}
