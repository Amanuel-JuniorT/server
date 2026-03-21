<?php

namespace App\Http\Controllers;

use App\Models\CompanyGroupRideInstance;
use App\Events\CompanyRideDriverAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

use App\Services\UnifiedNotificationService;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\RideReport;

class CompanyRideDriverController extends Controller
{
  public function __construct(
    private readonly \App\Services\UnifiedNotificationService $notificationService,
    private readonly \App\Services\CompanyRideAssignmentService $assignmentService
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
        ->where(function ($query) use ($driver) {
            $query->where('driver_id', $driver->id)
                  ->orWhere(function ($q) {
                      $q->whereNull('driver_id')
                        ->whereIn('status', ['requested', 'marketplace_pending']);
                  });
        })
        ->first();

      // If no specific instance, try to find an assignment (Marketplace enrollment view)
      if (!$ride) {
          $assignment = \App\Models\CompanyRideGroupAssignment::with(['rideGroup.members.employee', 'company'])
              ->where('id', $id)
              ->first();

          if ($assignment) {
              $group = $assignment->rideGroup;
              // Synthesize a virtual ride object for the detail page
              $ride = [
                  'id' => $assignment->id, // Use assignment ID so "Enroll" works
                  'is_assignment' => true,
                  'company_id' => $assignment->company_id,
                  'ride_group_id' => $assignment->ride_group_id,
                  'pickup_address' => $group->pickup_address,
                  'destination_address' => $group->destination_address,
                  'pickup_lat' => (double) $group->pickup_lat,
                  'pickup_lng' => (double) $group->pickup_lng,
                  'destination_lat' => (double) $group->destination_lat,
                  'destination_lng' => (double) $group->destination_lng,
                  'status' => ($assignment->driver_id == $driver->id) ? 'enrolled' : 'enrollment_available',
                  'company' => $assignment->company,
                  'ride_group' => $group,
                  'scheduled_time' => $group->scheduled_time ? $group->scheduled_time->format('H:i') : null,
                  'created_at' => $assignment->created_at->toIso8601String(),
              ];
          }
      }

      if (!$ride) {
        return response()->json([
          'success' => false,
          'message' => 'Ride or Route not found',
          'debug_driver_id' => $driver->id,
          'debug_requested_id' => $id
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

        // PRODUCTION SETTLEMENT LOGIC
        try {
            DB::beginTransaction();
            $company = $ride->company;
            $driverUser = $driver->user;
            
            // 1. Calculate Financials
            $totalAmount = (float) $ride->price;
            $commissionRate = 0.15; // Standard 15% commission
            $platformCommission = $totalAmount * $commissionRate;
            $driverEarnings = $totalAmount - $platformCommission;

            // 2. Settlement based on Billing Type
            $companyWallet = Wallet::firstOrCreate(['company_id' => $company->id], ['balance' => 0]);
            
            // Check prepaid balance
            if ($company->billing_type === 'prepaid' && $companyWallet->balance < $totalAmount) {
                // In production, we might allow it once or fail it. 
                // Since this is 'completeRide', we can't really fail the ride itself if it's already done.
                // We will record the debt and flag the company.
                Log::warning("Company {$company->name} has insufficient balance for completed ride #{$ride->id}");
            }

            // Deduct from Company
            $companyWallet->decrement('balance', $totalAmount);
            Transaction::create([
                'wallet_id' => $companyWallet->id,
                'type' => 'payment',
                'amount' => -$totalAmount,
                'note' => "Group Ride #{$ride->id} - {$ride->pickup_address} to {$ride->destination_address}",
                'status' => 'approved',
            ]);

            // Credit Driver
            $driverWallet = Wallet::firstOrCreate(['user_id' => $driverUser->id], ['balance' => 0]);
            $driverWallet->increment('balance', $driverEarnings);
            Transaction::create([
                'wallet_id' => $driverWallet->id,
                'type' => 'payment',
                'amount' => $driverEarnings,
                'note' => "Earnings for Group Ride #{$ride->id}",
                'status' => 'approved',
            ]);

            // Credit Platform (System Admin ID 1)
            $platformWallet = Wallet::firstOrCreate(['user_id' => 1], ['balance' => 0]);
            $platformWallet->increment('balance', $platformCommission);
            Transaction::create([
                'wallet_id' => $platformWallet->id,
                'type' => 'payment',
                'amount' => $platformCommission,
                'note' => "Commission for Group Ride #{$ride->id} (Company: {$company->name})",
                'status' => 'approved',
            ]);

            // 3. Generate Ride Report
            RideReport::create([
                'ride_instance_id' => $ride->id,
                'company_id' => $company->id,
                'driver_id' => $driver->id,
                'passenger_ids' => [$ride->employee_id], // Currently single employee per instance
                'total_amount' => $totalAmount,
                'driver_earnings' => $driverEarnings,
                'platform_commission' => $platformCommission,
                'origin_address' => $ride->pickup_address,
                'destination_address' => $ride->destination_address,
                'completed_at' => now(),
            ]);

            DB::commit();
        } catch (\Exception $financialException) {
            DB::rollBack();
            Log::error("Financial settlement failed for ride #{$ride->id}: " . $financialException->getMessage());
            // We still return true for the ride completion to the driver app, but log the critical financial error
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

        // Trigger fallback to find another driver
        $this->assignmentService->triggerFallback($ride, 'driver', 'Cancelled by driver');

        return response()->json([
          'success' => true,
          'data' => [
            'ride' => $ride->fresh()
          ],
          'message' => 'Ride cancelled successfully. It has been put back into the available pool.'
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
