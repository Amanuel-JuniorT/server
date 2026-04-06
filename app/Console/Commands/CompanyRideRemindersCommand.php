<?php

namespace App\Console\Commands;

use App\Events\CompanyRideArrived;
use App\Models\CompanyGroupRideInstance;
use App\Models\DeviceToken;
use App\Models\Location;
use App\Services\RoutingService;
use App\Services\UnifiedNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CompanyRideRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rides:remind-company';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Handle reminders and go-now alerts for company rides';

    /**
     * Execute the console command.
     */
    public function handle(UnifiedNotificationService $notificationService, RoutingService $routingService)
    {
        $now = now();
        Log::info("[CompanyRemind] Command started at {$now->toDateTimeString()}");
        
        // Find active ride instances for today
        $instances = CompanyGroupRideInstance::whereDate('scheduled_time', $now->toDateString())
            ->whereIn('status', ['requested', 'accepted'])
            ->with(['rideGroup', 'driver', 'employee'])
            ->get();

        Log::info("[CompanyRemind] Found " . $instances->count() . " active instances for today.");

        foreach ($instances as $instance) {
            $scheduledTime = $instance->scheduled_time;
            $diffInMinutes = $now->diffInMinutes($scheduledTime, false);

            Log::info("[CompanyRemind] Processing Instance #{$instance->id} | Scheduled: {$scheduledTime->format('H:i:s')} | Diff: {$diffInMinutes} mins");

            // 1. 2-Hour Reminder
            if ($diffInMinutes <= 120 && $diffInMinutes > 110 && !$instance->reminder_2h_sent) {
                Log::info("[CompanyRemind] Triggering 2h reminder for Instance #{$instance->id}");
                $this->sendReminder($instance, $notificationService, '2h');
                $instance->update(['reminder_2h_sent' => true]);
            }

            // 2. 1-Hour Reminder
            if ($diffInMinutes <= 60 && $diffInMinutes > 50 && !$instance->reminder_1h_sent) {
                Log::info("[CompanyRemind] Triggering 1h reminder for Instance #{$instance->id}");
                $this->sendReminder($instance, $notificationService, '1h');
                $instance->update(['reminder_1h_sent' => true]);
            }

            // 3. "Go Now" Alert
            if ($diffInMinutes <= 45 && $diffInMinutes > 0 && !$instance->reminder_go_sent && $instance->driver_id) {
                Log::info("[CompanyRemind] Checking 'Go Now' for Instance #{$instance->id}");
                $this->handleGoNowAlert($instance, $notificationService, $routingService);
            }

            // 4. Time Arrived
            if ($diffInMinutes <= 1 && $diffInMinutes >= -2 && $instance->status === 'accepted') {
                Log::info("[CompanyRemind] Triggering 'Time Arrived' for Instance #{$instance->id}");
                $this->handleTimeArrived($instance, $notificationService, $routingService);
            }
        }
        Log::info("[CompanyRemind] Command finished.");
    }

    private function sendReminder(CompanyGroupRideInstance $instance, UnifiedNotificationService $service, string $type)
    {
        $timeStr = $type === '2h' ? '2 hours' : '1 hour';
        $title = "Upcoming Company Ride";
        $body = "Your scheduled ride is in {$timeStr} (at " . $instance->scheduled_time->format('H:i') . ").";

        // Notify Driver
        if ($instance->driver_id) {
            $service->notifyUser($instance->driver->user_id, $title, $body, [
                'type' => 'company_ride_reminder',
                'ride_instance_id' => $instance->id,
                'reminder_type' => $type
            ], null, 'Driver');
        }

        // Notify Employees (Members of the group)
        $members = $instance->rideGroup->members()->with('employee')->get();
        Log::info("[CompanyRemind] Notifying " . $members->count() . " members for Instance #{$instance->id}");
        foreach ($members as $member) {
            if (!$instance->isEmployeeOptedOut($member->employee_id)) {
                $service->notifyUser($member->employee_id, $title, $body, [
                    'type' => 'company_ride_reminder',
                    'ride_instance_id' => $instance->id,
                    'reminder_type' => $type
                ], null, 'Passenger');
            } else {
                Log::info("[CompanyRemind] Member {$member->employee_id} opted out, skipping.");
            }
        }
    }

    private function handleGoNowAlert(CompanyGroupRideInstance $instance, UnifiedNotificationService $service, RoutingService $routingService)
    {
        $driverLocation = Location::where('driver_id', $instance->driver_id)->first();
        if (!$driverLocation) return;

        // Optimized order starts with the first person to pick up
        $optimizedOrder = $routingService->getOptimalPickupOrder($instance->rideGroup, $instance->driver);
        if (empty($optimizedOrder)) return;

        $firstPickup = $optimizedOrder[0];
        $travelTime = $routingService->getTravelTime(
            $driverLocation->latitude, 
            $driverLocation->longitude, 
            $firstPickup->pickup_lat, 
            $firstPickup->pickup_lng
        );

        $buffer = 5; // 5 minutes buffer
        $timeUntilStart = now()->diffInMinutes($instance->scheduled_time, false);

        Log::info("[CompanyRemind] Instance #{$instance->id} Go Now logic: Travel Time = {$travelTime}, Time Until Start = {$timeUntilStart} mins, Current Buffer = {$buffer}");

        if ($timeUntilStart <= ($travelTime + $buffer)) {
            Log::info("[CompanyRemind] THRESHOLD MET: Sending Go Now to Driver for Instance #{$instance->id}");
            $service->notifyUser($instance->driver->user_id, "Time to Go!", "Start moving now to reach your first pickup on time. Estimated travel: {$travelTime} mins.", [
                'type' => 'company_ride_go_now',
                'ride_instance_id' => $instance->id,
                'travel_time' => $travelTime
            ], null, 'Driver');

            $instance->update(['reminder_go_sent' => true]);
        } else {
            Log::info("[CompanyRemind] Go Now not yet: Time Until Start ({$timeUntilStart}) > (Travel Time {$travelTime} + Buffer {$buffer})");
        }
    }

    private function handleTimeArrived(CompanyGroupRideInstance $instance, UnifiedNotificationService $service, RoutingService $routingService)
    {
        // Get optimized route for the bottom sheet
        $optimizedOrder = $routingService->getOptimalPickupOrder($instance->rideGroup, $instance->driver);
        $orderData = array_map(function($member) {
            return [
                'id' => $member->employee_id,
                'name' => $member->employee->name ?? 'Unknown',
                'address' => $member->pickup_address,
                'lat' => $member->pickup_lat,
                'lng' => $member->pickup_lng
            ];
        }, $optimizedOrder);

        // Broadcast event for the driver app to show bottom sheet
        Log::info("[CompanyRemind] Broadcasting Arrival for Instance #{$instance->id} with " . count($orderData) . " stops.");
        broadcast(new CompanyRideArrived($instance, $orderData));

        // FCM for good measure
        Log::info("[CompanyRemind] Sending Arrival FCM to Driver for Instance #{$instance->id}");
        $service->notifyUser($instance->driver->user_id, "Ride Time Arrived", "Your company ride starts now. View the picking order in the app.", [
            'type' => 'company_ride_arrived',
            'ride_instance_id' => $instance->id,
            'optimized_order' => json_encode($orderData)
        ], null, 'Driver');
    }
}
