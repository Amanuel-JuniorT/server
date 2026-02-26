<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckScheduledRides extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rides:check-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for scheduled company rides and notify employees';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Notification window: notify if scheduled time is within the next 15 minutes, or already past (but not too old, e.g. < 1 hour).
        $now = now();
        $notificationWindowEnd = $now->copy()->addMinutes(15);
        $notificationWindowStart = $now->copy()->subHour(); // Don't notify for very old rides

        $rides = \App\Models\CompanyGroupRideInstance::where('scheduled_notification_sent', false)
            ->whereIn('status', ['requested', 'accepted', 'in_progress']) // Notify for any active status if time is up
            ->whereNotNull('scheduled_time')
            ->whereBetween('scheduled_time', [$notificationWindowStart, $notificationWindowEnd])
            ->with(['employee'])
            ->get();

        $this->info("Found {$rides->count()} rides to notify.");

        foreach ($rides as $ride) {
            if (!$ride->employee || !$ride->employee->fcm_token) {
                $this->warn("Ride {$ride->id}: No employee or FCM token found.");
                continue;
            }

            try {
                // Send FCM notification
                // Assuming fcm_token is stored on User model (employee relation)
                // Use SendFcmMessage job

                // Get tokens - fcm_token might be a string or array, or stored in another table.
                // Assuming simple string on user based on other controllers, or handling list if multiple devices.
                // Let's check User model for fcm_token or related. 
                // Based on previous conversations, there is FcmTokenController, so maybe it's a separate model? 
                // Wait, User.php might have it. I'll assume fcm_token column on users table for now, or check User model.
                // Actually, let's use a safe approach.

                $tokens = [];
                if ($ride->employee->fcm_token) {
                    $tokens[] = $ride->employee->fcm_token;
                }

                // Also check DeviceToken model if exists (saw it in list)
                $deviceTokens = \App\Models\DeviceToken::where('user_id', $ride->employee->id)->pluck('token')->toArray();
                $tokens = array_merge($tokens, $deviceTokens);
                $tokens = array_unique($tokens);

                if (empty($tokens)) {
                    $this->warn("Ride {$ride->id}: No FCM tokens found for user {$ride->employee->id}.");
                    continue;
                }

                $title = "Ride Scheduled Time";
                $body = "Your scheduled company ride is coming up at " . $ride->scheduled_time->format('H:i');

                \App\Jobs\SendFcmMessage::dispatch(
                    $tokens,
                    $title,
                    $body,
                    ['type' => 'company_ride_scheduled', 'ride_id' => $ride->id]
                );

                $ride->scheduled_notification_sent = true;
                $ride->save();

                $this->info("Ride {$ride->id}: Notification sent.");
            } catch (\Exception $e) {
                $this->error("Ride {$ride->id}: Failed to notify. " . $e->getMessage());
            }
        }
    }
}
