<?php

namespace App\Services;

use App\Models\CompanyGroupRideInstance;
use App\Models\Driver;
use App\Events\CompanyRideDriverAssigned;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyRideAssignmentService
{
  /**
   * Assign the nearest available contracted driver to a company ride
   *
   * @param CompanyGroupRideInstance $ride
   * @return array{success: bool, driver: Driver|null, reason: string|null}
   */
  public function assignDriver(CompanyGroupRideInstance $ride): array
  {
    try {
      // Skip assignment if ride is expired
      if ($ride->is_expired) {
        Log::info('Skipping driver assignment for expired ride', [
          'ride_id' => $ride->id,
          'scheduled_time' => $ride->scheduled_time,
          'status' => $ride->status
        ]);
        return [
          'success' => false,
          'driver' => null,
          'reason' => 'Ride has expired and cannot be assigned'
        ];
      }

      // Get company's active contracted drivers with their locations
      $sql = "
                SELECT
                    drivers.*,
                    locations.latitude,
                    locations.longitude,
                    (
                        6371 * acos(
                            cos(radians(?)) *
                            cos(radians(locations.latitude)) *
                            cos(radians(locations.longitude) - radians(?)) +
                            sin(radians(?)) *
                            sin(radians(locations.latitude))
                        )
                    ) AS distance
                FROM drivers
                INNER JOIN company_driver_contracts ON drivers.id = company_driver_contracts.driver_id
                LEFT JOIN locations ON drivers.id = locations.driver_id
                WHERE
                    company_driver_contracts.company_id = ?
                    AND company_driver_contracts.status = 'active'
                    AND company_driver_contracts.start_date <= ?
                    AND (company_driver_contracts.end_date IS NULL OR company_driver_contracts.end_date >= ?)
                    AND drivers.status = 'available'
                    AND drivers.approval_state = 'approved'
                    AND locations.latitude IS NOT NULL
                    AND locations.longitude IS NOT NULL
                ORDER BY distance ASC
                LIMIT 1
            ";

      $today = now()->toDateString();
      $result = DB::selectOne($sql, [
        $ride->origin_lat,
        $ride->origin_lng,
        $ride->origin_lat,
        $ride->company_id,
        $today,
        $today
      ]);

      if (!$result) {
        // Check if there are any contracted drivers at all
        $hasContracts = DB::table('company_driver_contracts')
          ->where('company_id', $ride->company_id)
          ->where('status', 'active')
          ->where('start_date', '<=', now())
          ->where(function ($query) {
            $query->whereNull('end_date')
              ->orWhere('end_date', '>=', now());
          })
          ->exists();

        if (!$hasContracts) {
          return [
            'success' => false,
            'driver' => null,
            'reason' => 'No contracted drivers available for this company'
          ];
        }

        // Check if drivers are busy or offline
        $availableCount = DB::table('drivers')
          ->join('company_driver_contracts', 'drivers.id', '=', 'company_driver_contracts.driver_id')
          ->where('company_driver_contracts.company_id', $ride->company_id)
          ->where('company_driver_contracts.status', 'active')
          ->where('drivers.status', 'available')
          ->where('drivers.approval_state', 'approved')
          ->count();

        if ($availableCount === 0) {
          return [
            'success' => false,
            'driver' => null,
            'reason' => 'All contracted drivers are currently busy or offline'
          ];
        }

        return [
          'success' => false,
          'driver' => null,
          'reason' => 'No contracted drivers available near the pickup location'
        ];
      }

      $driver = Driver::find($result->id);

      if (!$driver) {
        return [
          'success' => false,
          'driver' => null,
          'reason' => 'Driver not found'
        ];
      }

      // Assign driver to ride
      DB::beginTransaction();
      try {
        $ride->driver_id = $driver->id;
        $ride->status = 'accepted';
        $ride->save();

        $driver->status = 'on_ride';
        $driver->save();

        DB::commit();

        // Refresh ride to get latest state
        $ride->refresh();

        Log::info('Driver assigned to company ride', [
          'ride_id' => $ride->id,
          'driver_id' => $driver->id,
          'company_id' => $ride->company_id
        ]);

        // Broadcast event to notify company admin
        broadcast(new CompanyRideDriverAssigned($ride));

        return [
          'success' => true,
          'driver' => $driver,
          'reason' => null
        ];
      } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Failed to assign driver to ride', [
          'ride_id' => $ride->id,
          'error' => $e->getMessage()
        ]);

        return [
          'success' => false,
          'driver' => null,
          'reason' => 'Failed to complete assignment: ' . $e->getMessage()
        ];
      }
    } catch (\Exception $e) {
      Log::error('Error in driver assignment service', [
        'ride_id' => $ride->id,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'driver' => null,
        'reason' => 'Assignment error: ' . $e->getMessage()
      ];
    }
  }
}
