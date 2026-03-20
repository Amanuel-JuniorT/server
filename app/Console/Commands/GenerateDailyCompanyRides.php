<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateDailyCompanyRides extends Command
{
    protected $signature = 'company:generate-rides';
    protected $description = 'Generate daily company ride records based on active assignments';

    public function handle()
    {
        $today = now()->startOfDay();
        // 3-letter abbreviation, lowercase: mon, tue, wed, thu, fri, sat, sun
        $dayAbbr = strtolower($today->format('D'));

        $this->info("Generating rides for {$dayAbbr} ({$today->toDateString()})...");

        $assignments = \App\Models\CompanyRideGroupAssignment::whereIn('status', ['accepted', 'active'])
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with(['rideGroup.members'])
            ->get();

        $count = 0;
        foreach ($assignments as $assignment) {
            $group = $assignment->rideGroup;

            if (!$group || $group->status !== 'active') {
                continue;
            }

            // Use the group's active_days via model helper (falls back to Mon-Fri)
            if (!$group->isScheduledForDay($dayAbbr)) {
                continue;
            }

            $timeString = $group->scheduled_time->format('H:i:s');
            $scheduledTime = \Carbon\Carbon::parse($today->toDateString() . ' ' . $timeString);

            // Avoid duplicate generation for this group today
            $exists = \App\Models\CompanyGroupRideInstance::where('ride_group_id', $group->id)
                ->whereDate('scheduled_time', $today)
                ->exists();

            if ($exists) {
                $this->line("Ride for group '{$group->group_name}' already exists for today. Skipping.");
                continue;
            }

            $members = $group->members;
            if ($members->isEmpty()) {
                // No members — create a single group-level instance (driver-only)
                \App\Models\CompanyGroupRideInstance::create([
                    'company_id'          => $group->company_id,
                    'ride_group_id'       => $group->id,
                    'driver_id'           => $assignment->driver_id,
                    'origin_lat'          => $group->pickup_lat,
                    'origin_lng'          => $group->pickup_lng,
                    'destination_lat'     => $group->destination_lat,
                    'destination_lng'     => $group->destination_lng,
                    'pickup_address'      => $group->pickup_address,
                    'destination_address' => $group->destination_address,
                    'scheduled_time'      => $scheduledTime,
                    'status'              => $assignment->driver_id ? 'accepted' : 'requested',
                    'requested_at'        => now(),
                    'accepted_at'         => $assignment->driver_id ? now() : null,
                ]);
                $count++;
                // Create one instance per group member
                foreach ($members as $member) {
                    $originLat = ($group->origin_type === 'home') ? ($member->pickup_lat ?? $group->pickup_lat) : $group->pickup_lat;
                    $originLng = ($group->origin_type === 'home') ? ($member->pickup_lng ?? $group->pickup_lng) : $group->pickup_lng;
                    $pickupAdd = ($group->origin_type === 'home') ? ($member->pickup_address ?? $group->pickup_address) : $group->pickup_address;

                    $destLat = ($group->destination_type === 'home') ? ($member->destination_lat ?? $group->destination_lat) : $group->destination_lat;
                    $destLng = ($group->destination_type === 'home') ? ($member->destination_lng ?? $group->destination_lng) : $group->destination_lng;
                    $destAdd = ($group->destination_type === 'home') ? ($member->destination_address ?? $group->destination_address) : $group->destination_address;

                    \App\Models\CompanyGroupRideInstance::create([
                        'company_id'          => $group->company_id,
                        'employee_id'         => $member->employee_id,
                        'ride_group_id'       => $group->id,
                        'driver_id'           => $assignment->driver_id,
                        'origin_lat'          => $originLat,
                        'origin_lng'          => $originLng,
                        'destination_lat'     => $destLat,
                        'destination_lng'     => $destLng,
                        'pickup_address'      => $pickupAdd,
                        'destination_address' => $destAdd,
                        'scheduled_time'      => $scheduledTime,
                        'status'              => $assignment->driver_id ? 'accepted' : 'requested',
                        'requested_at'        => now(),
                        'accepted_at'         => $assignment->driver_id ? now() : null,
                    ]);
                    $count++;
                }
            }

            $this->info("Generated ride(s) for group: {$group->group_name} at {$timeString}");
        }

        $this->info("Successfully generated {$count} ride instance(s).");
    }
}
