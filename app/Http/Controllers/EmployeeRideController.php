<?php

namespace App\Http\Controllers;

use App\Models\CompanyGroupRideInstance;
use App\Models\CompanyRideGroupMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmployeeRideController extends Controller
{
  /**
   * Get company rides for the authenticated employee (passenger)
   * This returns upcoming ride instances where the employee is a member
   */
  public function getCompanyRides(Request $request)
  {
    try {
      $user = $request->user('sanctum');

      if (!$user) {
        return response()->json([
          'success' => false,
          'message' => 'User not authorized'
        ], 403);
      }

      // Get all ride groups where this user is a member
      $memberRecords = CompanyRideGroupMember::where('employee_id', $user->id)
        ->with(['rideGroup.company', 'rideGroup.members.employee', 'rideGroup.assignments' => function ($query) {
          $query->whereIn('status', ['accepted', 'active'])
            ->where('end_date', '>=', now()->toDateString())
            ->with('driver.user');
        }])
        ->get();

      Log::info('Company Rides Debug: Member records found', [
        'user_id' => $user->id,
        'count' => $memberRecords->count()
      ]);

      if ($memberRecords->isEmpty()) {
        return response()->json([
          'success' => true,
          'message' => 'You are not part of any ride groups yet',
          'data' => [
            'rides' => []
          ]
        ]);
      }

      // Get the group IDs
      $groupIds = $memberRecords->pluck('ride_group_id')->toArray();
      Log::info('Company Rides Debug: Group IDs', ['groupIds' => $groupIds]);

      // Get upcoming ride instances for these groups
      $upcomingInstances = CompanyGroupRideInstance::whereIn('ride_group_id', $groupIds)
        ->where('scheduled_time', '>=', now())
        ->whereIn('status', ['requested', 'accepted', 'in_progress'])
        ->with(['rideGroup', 'driver.user', 'driver.location', 'company'])
        ->orderBy('scheduled_time', 'asc')
        ->get();

      Log::info('Company Rides Debug: Upcoming rides query', [
        'count' => $upcomingInstances->count(),
        'now' => now()->toDateTimeString()
      ]);

      // Map member groups to rides, using instances if they exist
      $ridesData = $memberRecords->map(function ($member) use ($upcomingInstances) {
        $group = $member->rideGroup;
        if (!$group) return null;

        // Find an upcoming instance for this group
        $instance = $upcomingInstances->firstWhere('ride_group_id', $group->id);

        if ($instance) {
          // Use instance data
          $groupType = $group->group_type ?? 'to_office';
          $pickup = $groupType === 'to_office' ? $member->custom_pickup_address : $group->pickup_address;
          $destination = $groupType === 'from_office' ? $member->custom_pickup_address : $group->destination_address;

          return [
            'id' => $instance->id,
            'company_id' => $instance->company_id,
            'route_name' => $group->group_name,
            'pickup_location' => $pickup,
            'pickup_address' => $pickup,
            'origin_address' => $pickup,
            'pickup_lat' => $groupType === 'to_office' ? $member->custom_pickup_lat : $group->pickup_lat,
            'pickup_lng' => $groupType === 'to_office' ? $member->custom_pickup_lng : $group->pickup_lng,
            'dropoff_location' => $destination,
            'dropoff_address' => $destination,
            'destination_address' => $destination,
            'dropoff_lat' => $groupType === 'from_office' ? $member->custom_pickup_lat : $group->destination_lat,
            'dropoff_lng' => $groupType === 'from_office' ? $member->custom_pickup_lng : $group->destination_lng,
            'scheduled_time' => $instance->scheduled_time->toDateTimeString(),
            'start_date' => $group->start_date,
            'end_date' => $group->end_date,
            'status' => $instance->status,
            'driver' => $instance->driver ? [
              'id' => $instance->driver->id,
              'user' => [
                'id' => $instance->driver->user->id,
                'name' => $instance->driver->user->name ?? 'Unknown',
                'phone' => $instance->driver->user->phone ?? null,
              ],
              'vehicle' => [
                'plate_number' => $instance->driver->plate_number,
                'make' => $instance->driver->make,
                'model' => $instance->driver->model,
                'color' => $instance->driver->color,
              ],
              'location' => $instance->driver->location ? [ // Added driver location
                'latitude' => $instance->driver->location->latitude,
                'longitude' => $instance->driver->location->longitude,
              ] : null,
            ] : null,
            'driver_name' => $instance->driver->user->name ?? null,
            'driver_phone' => $instance->driver->user->phone ?? null,
            'vehicle_number' => $instance->driver->plate_number ?? null,
            'company_name' => $instance->company->name ?? 'Unknown Company',
            'fellow_passengers' => $instance->rideGroup->members
              ->where('employee_id', '!=', $member->employee_id)
              ->map(function ($m) {
                return $m->employee->name ?? 'Unknown';
              })->values()->toArray(),
          ];
        } else {
          // Return the group as a "scheduled" ride placeholder
          $groupType = $group->group_type ?? 'to_office';

          // Find if there's an active driver assignment for this group
          $activeAssignment = $group->assignments->first();
          $fallbackDriver = null;

          if ($activeAssignment && $activeAssignment->driver) {
            $fallbackDriver = [
              'id' => $activeAssignment->driver->id,
              'name' => $activeAssignment->driver->user->name ?? 'Unknown',
              'phone' => $activeAssignment->driver->user->phone ?? null,
            ];
          }

          $pickup = $groupType === 'to_office' ? $member->custom_pickup_address : $group->pickup_address;
          $destination = $groupType === 'from_office' ? $member->custom_pickup_address : $group->destination_address;

          return [
            'id' => 0, // No specific instance ID
            'company_id' => $group->company_id,
            'route_name' => $group->group_name,
            'pickup_location' => $pickup,
            'pickup_address' => $pickup,
            'origin_address' => $pickup,
            'pickup_lat' => $groupType === 'to_office' ? $member->custom_pickup_lat : $group->pickup_lat,
            'pickup_lng' => $groupType === 'to_office' ? $member->custom_pickup_lng : $group->pickup_lng,
            'dropoff_location' => $destination,
            'dropoff_address' => $destination,
            'destination_address' => $destination,
            'dropoff_lat' => $groupType === 'from_office' ? $member->custom_pickup_lat : $group->destination_lat,
            'dropoff_lng' => $groupType === 'from_office' ? $member->custom_pickup_lng : $group->destination_lng,
            'scheduled_time' => now()->format('Y-m-d') . 'T' . $group->scheduled_time->format('H:i:s') . '.000000Z',
            'start_date' => $group->start_date,
            'end_date' => $group->end_date,
            'status' => 'scheduled',
            'driver' => $fallbackDriver ? [
              'id' => $fallbackDriver['id'],
              'user' => [
                'name' => $fallbackDriver['name'],
                'phone' => $fallbackDriver['phone'],
              ]
            ] : null,
            'driver_name' => $fallbackDriver['name'] ?? null,
            'driver_phone' => $fallbackDriver['phone'] ?? null,
            'vehicle_number' => $activeAssignment && $activeAssignment->driver ? $activeAssignment->driver->plate_number : null,
            'company_name' => $group->company->name ?? 'Unknown Company',
            'fellow_passengers' => $group->members
              ->where('employee_id', '!=', $member->employee_id)
              ->map(function ($m) {
                return $m->employee->name ?? 'Unknown';
              })->values()->toArray(),
          ];
        }
      })->filter()->values();

      return response()->json([
        'success' => true,
        'message' => 'Company rides fetched successfully',
        'data' => [
          'rides' => $ridesData
        ]
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch employee company rides', [
        'user_id' => $request->user()->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch company rides',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get ride group memberships for the authenticated employee
   * This shows which ride groups the employee belongs to
   */
  public function getMyRideGroups(Request $request)
  {
    try {
      $user = $request->user('sanctum');

      if (!$user) {
        return response()->json([
          'success' => false,
          'message' => 'User not authorized'
        ], 403);
      }

      $memberRecords = CompanyRideGroupMember::where('employee_id', $user->id)
        ->with(['rideGroup.company', 'rideGroup.members.employee'])
        ->get();

      $groupsData = $memberRecords->map(function ($member) {
        $group = $member->rideGroup;

        return [
          'id' => $group->id,
          'group_name' => $group->group_name,
          'group_type' => $group->group_type,
          'scheduled_time' => $group->scheduled_time,
          'start_date' => $group->start_date,
          'end_date' => $group->end_date,
          'status' => $group->status,
          'max_capacity' => $group->max_capacity,
          'current_members' => $group->members->count(),
          'my_pickup_address' => $member->custom_pickup_address,
          'company_name' => $group->company->name ?? 'Unknown',
        ];
      });

      return response()->json([
        'success' => true,
        'message' => 'Ride groups fetched successfully',
        'data' => $groupsData
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch employee ride groups', [
        'user_id' => $request->user()->id ?? null,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch ride groups'
      ], 500);
    }
  }

  /**
   * Employee opts out of a specific daily ride instance.
   * Adds their user ID to the opted_out_employees JSON on the instance,
   * and notifies the assigned driver (if any).
   */
  public function optOut(Request $request, int $instanceId)
  {
    try {
      $user = $request->user('sanctum');

      if (!$user) {
        return response()->json(['success' => false, 'message' => 'User not authorized'], 403);
      }

      $instance = CompanyGroupRideInstance::whereIn('status', ['requested', 'accepted'])
        ->where('scheduled_time', '>=', now())
        ->findOrFail($instanceId);

      if ($instance->isEmployeeOptedOut($user->id)) {
        return response()->json(['success' => false, 'message' => 'You have already opted out of this ride'], 409);
      }

      $instance->optOut($user->id);

      // Notify the driver if already assigned
      if ($instance->driver_id) {
        $notificationService = app(\App\Services\UnifiedNotificationService::class);
        $driverUserId = \App\Models\Driver::find($instance->driver_id)?->user_id;

        if ($driverUserId) {
          $notificationService->notifyUser(
            $driverUserId,
            'Passenger Opted Out',
            "{$user->name} will not be joining the {$instance->scheduled_time->format('H:i')} ride to {$instance->destination_address}.",
            ['company_ride_id' => $instance->id, 'type' => 'employee_opt_out'],
            null,
            'Driver'
          );
        }
      }

      return response()->json([
        'success' => true,
        'message' => 'You have successfully opted out of this ride instance.',
      ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
      return response()->json(['success' => false, 'message' => 'Ride instance not found or cannot be opted out of'], 404);
    } catch (\Exception $e) {
      Log::error('Failed to opt out of company ride instance', [
        'instance_id' => $instanceId,
        'user_id'     => $request->user()?->id,
        'error'       => $e->getMessage(),
      ]);
      return response()->json(['success' => false, 'message' => 'Failed to opt out'], 500);
    }
  }
}
