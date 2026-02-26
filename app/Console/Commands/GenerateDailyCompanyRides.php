<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateDailyCompanyRides extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'company:generate-rides';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily company ride records based on active assignments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now()->startOfDay();
        $dayName = strtolower($today->format('l')); // e.g. 'monday'

        $this->info("Generating rides for {$dayName} ({$today->toDateString()})...");

        $assignments = \App\Models\CompanyRideGroupAssignment::whereIn('status', ['accepted', 'active'])
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with(['rideGroup'])
            ->get();

        $count = 0;
        foreach ($assignments as $assignment) {
            $group = $assignment->rideGroup;

            if (!$group || $group->status !== 'active') {
                continue;
            }

            // Check if today is a scheduled day for this assignment
            if (!in_array($dayName, $assignment->days_of_week)) {
                continue;
            }

            // Parse scheduled time (stored as H:i:s in time column)
            // If it's cast as datetime:H:i, use format('H:i:s')
            $timeString = $group->scheduled_time->format('H:i:s');
            $scheduledTime = \Carbon\Carbon::parse($today->toDateString() . ' ' . $timeString);

            // Check if ride already exists for this group and date
            $exists = \App\Models\CompanyGroupRideInstance::where('ride_group_id', $group->id)
                ->whereDate('scheduled_time', $today)
                ->exists();

            if ($exists) {
                $this->line("Ride for group '{$group->group_name}' already exists for today. Skipping.");
                continue;
            }

            // Create the ride
            \App\Models\CompanyGroupRideInstance::create([
                'company_id' => $group->company_id,
                'ride_group_id' => $group->id,
                'driver_id' => $assignment->driver_id,
                'origin_lat' => $group->pickup_lat,
                'origin_lng' => $group->pickup_lng,
                'destination_lat' => $group->destination_lat,
                'destination_lng' => $group->destination_lng,
                'pickup_address' => $group->pickup_address,
                'destination_address' => $group->destination_address,
                'scheduled_time' => $scheduledTime,
                'status' => $assignment->driver_id ? 'accepted' : 'requested',
                'requested_at' => now(),
                'accepted_at' => $assignment->driver_id ? now() : null,
            ]);

            $count++;
            $this->info("Generated ride for group: {$group->group_name} at {$timeString}");
        }

        $this->info("Successfully generated {$count} rides.");
    }
}
