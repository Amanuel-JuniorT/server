<?php

namespace App\Http\Controllers;

use App\Models\CompanyRideGroup;
use App\Models\CompanyRideGroupAssignment;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CompanyRideGroupController extends Controller
{
    /**
     * List all ride groups for a company
     */
    public function index($companyId)
    {
        try {
            $groups = CompanyRideGroup::where('company_id', $companyId)
                ->with(['members.employee', 'assignments.driver'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $groups
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch ride groups', [
                'company_id' => $companyId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ride groups'
            ], 500);
        }
    }

    /**
     * Get single ride group details
     */
    public function show($companyId, $groupId)
    {
        try {
            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->with(['members.employee', 'assignments.driver'])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $group
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ride group not found'
            ], 404);
        }
    }

    /**
     * Create new ride group
     */
    public function store(Request $request, $companyId)
    {
        $validator = Validator::make($request->all(), [
            'group_name' => 'required|string|max:255',
            'group_type' => 'required|in:to_office,from_office',
            'pickup_address' => 'sometimes|nullable|string',
            'pickup_lat' => 'sometimes|nullable|numeric',
            'pickup_lng' => 'sometimes|nullable|numeric',
            'destination_address' => 'sometimes|nullable|string',
            'destination_lat' => 'sometimes|nullable|numeric',
            'destination_lng' => 'sometimes|nullable|numeric',
            'scheduled_time' => 'required|date_format:H:i',
            'max_capacity' => 'nullable|integer|min:1|max:4',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'members' => 'required|array|min:1|max:4',
            'members.*.employee_id' => 'required|exists:company_employees,id',
            'members.*.address' => 'required|string',
            'members.*.latitude' => 'required|numeric',
            'members.*.longitude' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $group = CompanyRideGroup::create([
                'company_id' => $companyId,
                'group_name' => $request->group_name,
                'group_type' => $request->group_type,
                'pickup_address' => $request->pickup_address,
                'pickup_lat' => $request->pickup_lat,
                'pickup_lng' => $request->pickup_lng,
                'destination_address' => $request->destination_address,
                'destination_lat' => $request->destination_lat,
                'destination_lng' => $request->destination_lng,
                'scheduled_time' => $request->scheduled_time,
                'max_capacity' => $request->max_capacity ?? 4,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => 'active',
            ]);

            // Add members to the group
            foreach ($request->members as $member) {
                // The migration expects users.id in employee_id column,
                // but the validation checks company_employees.id.
                // We need to fetch the user_id from the CompanyEmployee record.
                $employee = \App\Models\CompanyEmployee::find($member['employee_id']);

                $group->addMember(
                    $employee->user_id,
                    $member['address'],
                    $member['latitude'],
                    $member['longitude']
                );
            }

            // Automatically create an unassigned assignment so drivers can see and accept it
            // The assignment covers the same period as the ride group
            $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; // Default to weekdays
            CompanyRideGroupAssignment::create([
                'ride_group_id' => $group->id,
                'driver_id' => null, // Unassigned - any driver can accept
                'company_id' => $companyId,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'days_of_week' => $daysOfWeek,
                'status' => 'pending',
            ]);

            AuditService::medium('Ride Group Created', $group, "Created company ride group: {$group->group_name} for company ID: {$companyId}");

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $group->load('members.employee'),
                'message' => 'Ride group created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create ride group', [
                'company_id' => $companyId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create ride group: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update ride group
     */
    public function update(Request $request, $companyId, $groupId)
    {
        $validator = Validator::make($request->all(), [
            'group_name' => 'sometimes|string|max:255',
            'pickup_address' => 'sometimes|string',
            'pickup_lat' => 'sometimes|numeric',
            'pickup_lng' => 'sometimes|numeric',
            'destination_address' => 'sometimes|string',
            'destination_lat' => 'sometimes|numeric',
            'destination_lng' => 'sometimes|numeric',
            'scheduled_time' => 'sometimes|date_format:H:i',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'status' => 'sometimes|in:active,inactive',
            'members' => 'sometimes|array|min:1|max:4',
            'members.*.employee_id' => 'required_with:members|exists:company_employees,id',
            'members.*.address' => 'required_with:members|string',
            'members.*.latitude' => 'required_with:members|numeric',
            'members.*.longitude' => 'required_with:members|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->firstOrFail();

            $group->update($request->only([
                'group_name',
                'pickup_address',
                'pickup_lat',
                'pickup_lng',
                'destination_address',
                'destination_lat',
                'destination_lng',
                'scheduled_time',
                'start_date',
                'end_date',
                'status'
            ]));

            // Sync members if provided
            if ($request->has('members')) {
                // Remove all existing members
                $group->members()->delete();

                // Add new members
                foreach ($request->members as $member) {
                    $employee = \App\Models\CompanyEmployee::find($member['employee_id']);

                    $group->addMember(
                        $employee->user_id,
                        $member['address'],
                        $member['latitude'],
                        $member['longitude']
                    );
                }
            }

            AuditService::medium('Ride Group Updated', $group, "Updated company ride group: {$group->group_name}");

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $group->load('members.employee'),
                'message' => 'Ride group updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update ride group', [
                'company_id' => $companyId,
                'group_id' => $groupId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update ride group'
            ], 500);
        }
    }

    /**
     * Delete ride group
     */
    public function destroy($companyId, $groupId)
    {
        try {
            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->firstOrFail();

            $group->delete();

            AuditService::high('Ride Group Deleted', null, "Deleted ride group ID: {$groupId} for company ID: {$companyId}");

            return response()->json([
                'success' => true,
                'message' => 'Ride group deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete ride group'
            ], 500);
        }
    }

    /**
     * Add member to ride group
     */
    public function addMember(Request $request, $companyId, $groupId)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
            'pickup_address' => 'nullable|string',
            'pickup_lat' => 'nullable|numeric',
            'pickup_lng' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->firstOrFail();

            if ($group->isFull()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ride group is at maximum capacity'
                ], 409);
            }

            $member = $group->addMember(
                $request->employee_id,
                $request->pickup_address,
                $request->pickup_lat,
                $request->pickup_lng
            );

            return response()->json([
                'success' => true,
                'data' => $member,
                'message' => 'Member added successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add member to ride group', [
                'group_id' => $groupId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add member'
            ], 500);
        }
    }

    /**
     * Remove member from ride group
     */
    public function removeMember($companyId, $groupId, $employeeId)
    {
        try {
            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->firstOrFail();

            $group->removeMember($employeeId);

            return response()->json([
                'success' => true,
                'message' => 'Member removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove member'
            ], 500);
        }
    }

    /**
     * Assign ride group to driver for a period
     */
    public function assignDriver(Request $request, $companyId, $groupId)
    {
        $validator = Validator::make($request->all(), [
            'driver_id' => 'nullable|exists:drivers,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'days_of_week' => 'required|array',
            'days_of_week.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $group = CompanyRideGroup::where('company_id', $companyId)
                ->where('id', $groupId)
                ->firstOrFail();

            $assignment = CompanyRideGroupAssignment::create([
                'ride_group_id' => $groupId,
                'driver_id' => $request->driver_id,
                'company_id' => $companyId,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'days_of_week' => $request->days_of_week,
                'status' => 'pending',
            ]);

            AuditService::medium('Driver Assigned to Ride Group', $assignment, "Assigned driver ID: " . ($request->driver_id ?? 'Auto-Dispatch') . " to ride group ID: {$groupId}");

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $assignment->load('driver', 'rideGroup'),
                'message' => 'Driver assigned successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign driver', [
                'group_id' => $groupId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign driver'
            ], 500);
        }
    }

    /**
     * Get available ride group assignments for driver
     */
    public function getAvailableForDriver(Request $request)
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

            $assignments = CompanyRideGroupAssignment::where(function ($query) use ($driver) {
                $query->where('driver_id', $driver->id)
                    ->orWhereNull('driver_id');
            })
                ->where('status', 'pending')
                ->where('end_date', '>=', now()->toDateString())
                ->with(['rideGroup.members.employee', 'company'])
                ->get();

            $formatted = $assignments->map(function ($assignment) {
                $group = $assignment->rideGroup;
                return [
                    'assignment_id' => $assignment->id,
                    'ride_group_id' => $assignment->ride_group_id,
                    'group_name' => $group->group_name ?? 'Unknown Group',
                    'group_type' => $group->group_type ?? 'to_office',
                    'scheduled_time' => $group->scheduled_time ? now()->format('Y-m-d') . 'T' . $group->scheduled_time->format('H:i:s') . '.000000Z' : null,
                    'start_date' => $assignment->start_date->toDateString(),
                    'end_date' => $assignment->end_date->toDateString(),
                    'days_of_week' => $assignment->days_of_week,
                    'status' => $assignment->status,
                    'pickup_address' => $group->pickup_address,
                    'pickup_lat' => $group->pickup_lat,
                    'pickup_lng' => $group->pickup_lng,
                    'destination_address' => $group->destination_address,
                    'destination_lat' => $group->destination_lat,
                    'destination_lng' => $group->destination_lng,
                    'max_capacity' => $group->max_capacity,
                    'company' => [
                        'id' => $assignment->company->id,
                        'name' => $assignment->company->name,
                        'phone' => $assignment->company->phone,
                        'address' => $assignment->company->address,
                    ],
                    'members' => $group->members->map(function ($member) {
                        return [
                            'name' => $member->employee->name ?? 'Unknown',
                            'pickup_address' => $member->custom_pickup_address ?? $member->pickup_address,
                            'pickup_lat' => $member->custom_pickup_lat ?? $member->pickup_lat,
                            'pickup_lng' => $member->custom_pickup_lng ?? $member->pickup_lng,
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formatted
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available assignments'
            ], 500);
        }
    }

    /**
     * Driver accepts ride group assignment
     */
    public function acceptAssignment(Request $request, $assignmentId)
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

            $assignment = CompanyRideGroupAssignment::where('id', $assignmentId)
                ->where(function ($query) use ($driver) {
                    $query->where('driver_id', $driver->id)
                        ->orWhereNull('driver_id');
                })
                ->where('status', 'pending')
                ->firstOrFail();

            if ($assignment->driver_id === null) {
                $assignment->driver_id = $driver->id;
            }

            $assignment->accept();

            return response()->json([
                'success' => true,
                'data' => $assignment->load('rideGroup.members.employee'),
                'message' => 'Assignment accepted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept assignment'
            ], 500);
        }
    }

    /**
     * Get driver's accepted/active assignments
     */
    public function getDriverAssignments(Request $request)
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

            $assignments = CompanyRideGroupAssignment::where('driver_id', $driver->id)
                ->whereIn('status', ['accepted', 'active'])
                ->with(['rideGroup.members.employee', 'company'])
                ->orderBy('start_date', 'desc')
                ->get();

            $formatted = $assignments->map(function ($assignment) {
                $group = $assignment->rideGroup;
                return [
                    'assignment_id' => $assignment->id,
                    'ride_group_id' => $assignment->ride_group_id,
                    'group_name' => $group->group_name ?? 'Unknown Group',
                    'group_type' => $group->group_type ?? 'to_office',
                    'scheduled_time' => $group->scheduled_time ? now()->format('Y-m-d') . 'T' . $group->scheduled_time->format('H:i:s') . '.000000Z' : null,
                    'start_date' => $assignment->start_date->toDateString(),
                    'end_date' => $assignment->end_date->toDateString(),
                    'days_of_week' => $assignment->days_of_week,
                    'status' => $assignment->status,
                    'pickup_address' => $group->pickup_address,
                    'pickup_lat' => $group->pickup_lat,
                    'pickup_lng' => $group->pickup_lng,
                    'destination_address' => $group->destination_address,
                    'destination_lat' => $group->destination_lat,
                    'destination_lng' => $group->destination_lng,
                    'max_capacity' => $group->max_capacity,
                    'company' => [
                        'id' => $assignment->company->id,
                        'name' => $assignment->company->name,
                        'phone' => $assignment->company->phone,
                        'address' => $assignment->company->address,
                    ],
                    'members' => $group->members->map(function ($member) {
                        return [
                            'name' => $member->employee->name ?? 'Unknown',
                            'pickup_address' => $member->custom_pickup_address ?? $member->pickup_address,
                            'pickup_lat' => $member->custom_pickup_lat ?? $member->pickup_lat,
                            'pickup_lng' => $member->custom_pickup_lng ?? $member->pickup_lng,
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formatted
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assignments'
            ], 500);
        }
    }
}
