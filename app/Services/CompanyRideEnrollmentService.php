<?php

namespace App\Services;

use App\Models\CompanyRideGroup;
use App\Models\CompanyRideGroupAssignment;
use App\Models\Driver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyRideEnrollmentService
{
    /**
     * Minimum driver rating to be eligible to see & enroll in company routes.
     */
    const MIN_RATING = 4.0;

    /**
     * Get all open (unassigned) ride groups a driver is eligible to enroll in.
     * Eligibility: driver must be approved, have an active contract with the company,
     * and have a rating >= MIN_RATING.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOpenGroupsForDriver(Driver $driver)
    {
        // Only show groups that belong to companies that have an active contract with this driver

        // TODO: Implement the logic to get the eligible (who have contract) companies
        // $eligibleCompanyIds = DB::table('company_driver_contracts')
        //     ->where('driver_id', $driver->id)
        //     ->where('status', 'active')
        //     ->where('start_date', '<=', now()->toDateString())
        //     ->where(function ($q) {
        //         $q->whereNull('end_date')
        //           ->orWhere('end_date', '>=', now()->toDateString());
        //     })
        //     ->pluck('company_id');

        // if ($eligibleCompanyIds->isEmpty()) {
        //     return collect();
        // }

        // Check driver rating eligibility
        if (($driver->rating ?? 0) < self::MIN_RATING) {
            Log::info('Driver not eligible for company routes due to low rating', [
                'driver_id' => $driver->id,
                'rating'    => $driver->rating,
            ]);
            return collect();
        }

        // All active groups in eligible companies that have at least one pending (unassigned) assignment
        return CompanyRideGroup::where('status', 'active')
            ->where('end_date', '>=', now()->toDateString())
            ->whereHas('assignments', function ($q) {
                $q->where('status', 'pending')
                  ->whereNull('driver_id');
            })
            ->with(['members.employee', 'company', 'assignments' => function ($q) {
                $q->where('status', 'pending')->whereNull('driver_id');
            }])
            ->get();
    }

    /**
     * Check whether a driver has a time conflict with an existing enrolled group.
     * Conflict: same day(s) and scheduled_time window overlaps.
     *
     * We define a conflict as: both groups share at least one active day AND
     * their scheduled_times are within a 60-minute proximity of each other.
     *
     * @return bool true = conflict exists, false = safe to enroll
     */
    public function checkConflict(Driver $driver, CompanyRideGroup $newGroup): bool
    {
        $driverAssignments = CompanyRideGroupAssignment::where('driver_id', $driver->id)
            ->whereIn('status', ['accepted', 'active'])
            ->where('start_date', '<=', $newGroup->end_date)
            ->where('end_date', '>=', $newGroup->start_date ?? now())
            ->with('rideGroup')
            ->get();

        $newDays = $newGroup->active_days ?? CompanyRideGroup::DEFAULT_ACTIVE_DAYS;
        $newTime = $newGroup->scheduled_time; // Carbon instance (H:i)

        foreach ($driverAssignments as $existing) {
            $existingGroup = $existing->rideGroup;
            if (!$existingGroup) {
                continue;
            }

            $existingDays = $existingGroup->active_days ?? CompanyRideGroup::DEFAULT_ACTIVE_DAYS;
            $sharedDays = array_intersect($newDays, $existingDays);

            if (empty($sharedDays)) {
                continue; // No day overlap — no conflict
            }

            // Check if scheduled times are within 60 minutes of each other
            $existingTime = $existingGroup->scheduled_time;
            $diffMinutes = abs($newTime->diffInMinutes($existingTime));

            if ($diffMinutes < 60) {
                Log::info('Driver enrollment conflict detected', [
                    'driver_id'         => $driver->id,
                    'new_group_id'      => $newGroup->id,
                    'existing_group_id' => $existingGroup->id,
                    'diff_minutes'      => $diffMinutes,
                ]);
                return true;
            }
        }

        return false;
    }

    /**
     * Enroll a driver in a ride group by accepting its pending (unassigned) assignment.
     *
     * @throws \RuntimeException on conflict or no open slot
     * @return CompanyRideGroupAssignment
     */
    public function enroll(Driver $driver, int $assignmentId): CompanyRideGroupAssignment
    {
        $assignment = CompanyRideGroupAssignment::where('id', $assignmentId)
            ->where('status', 'pending')
            ->whereNull('driver_id')
            ->with('rideGroup')
            ->firstOrFail();

        $group = $assignment->rideGroup;

        if ($this->checkConflict($driver, $group)) {
            throw new \RuntimeException('Time conflict with one of your existing enrolled routes.');
        }

        DB::beginTransaction();
        try {
            $assignment->driver_id   = $driver->id;
            $assignment->status      = 'accepted';
            $assignment->accepted_at = now();
            $assignment->save();

            DB::commit();

            Log::info('Driver enrolled in company ride group', [
                'driver_id'     => $driver->id,
                'assignment_id' => $assignment->id,
                'group_id'      => $group->id,
            ]);

            return $assignment->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Enrollment failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Withdraw a driver from a ride group assignment.
     * The assignment's driver_id is cleared and status reverts to 'pending'
     * so another driver can pick it up.
     *
     * @return CompanyRideGroupAssignment
     */
    public function withdraw(Driver $driver, int $assignmentId): CompanyRideGroupAssignment
    {
        $assignment = CompanyRideGroupAssignment::where('id', $assignmentId)
            ->where('driver_id', $driver->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $assignment->driver_id   = null;
            $assignment->status      = 'pending';
            $assignment->accepted_at = null;
            $assignment->save();

            DB::commit();

            Log::info('Driver withdrew from company ride group', [
                'driver_id'     => $driver->id,
                'assignment_id' => $assignmentId,
            ]);

            return $assignment->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Withdrawal failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
