<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UnifiedNotificationService
{
    public function __construct(
        private readonly FcmService $fcmService
    ) {}

    /**
     * Send a notification to a specific user through both FCM and Broadcasting (WebSockets)
     * 
     * @param int|User $user The user ID or User model to notify
     * @param string $title Notification title
     * @param string $body Notification body content
     * @param array $data Metadata for the notification (IDs, status, etc)
     * @param string|object $event The broadcast event to trigger
     * @param string $app The target app ('Driver' or 'Passenger')
     */
    public function notifyUser($user, string $title, string $body, array $data = [], $event = null, string $app = 'Passenger')
    {
        $userId = $user instanceof User ? $user->id : $user;

        // 1. Broadcast if an event is provided
        if ($event) {
            broadcast($event);
        }

        // 2. Fetch tokens and send via FCM
        $tokens = DeviceToken::where('user_id', $userId)
            ->where('app', $app)
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            Log::info("No FCM tokens found for user {$userId} on app {$app}");
            return;
        }

        try {
            $this->fcmService->sendToTokens(
                $tokens,
                $title,
                $body,
                $data
            );
        } catch (\Exception $e) {
            Log::error("FCM sending failed for user {$userId}: " . $e->getMessage());
        }
    }

    /**
     * Notify multiple users (e.g., nearby drivers)
     */
    public function notifyUsers(array $userIds, string $title, string $body, array $data = [], $event = null, string $app = 'Driver')
    {
        // 1. Broadcast globally or per-user if event is specific
        // if ($event) {
        //     broadcast($event);
        // }

        // 2. FCM to all tokens
        $tokens = DeviceToken::whereIn('user_id', $userIds)
            ->where('app', $app)
            ->pluck('token')
            ->all();

        if (!empty($tokens)) {
            $this->fcmService->sendToTokens($tokens, $title, $body, $data);
        }
    }

    /**
     * Send a silent (data-only) FCM location update to the passenger.
     * This wakes up the Passenger app in the background without showing a notification.
     * Should only be called when there is an active ride (accepted/arrived/in_progress).
     *
     * @param int $passengerId  The passenger's user ID
     * @param array $locationData  Keys: driver_id, latitude, longitude, encoded_polyline (optional)
     */
    public function sendLocationUpdate(int $passengerId, array $locationData): void
    {
        $tokens = DeviceToken::where('user_id', $passengerId)
            ->where('app', 'Passenger')
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        // FCM data values must all be strings
        $data = [
            'type'             => 'driver_location_update',
            'driver_id'        => (string) ($locationData['driver_id'] ?? ''),
            'latitude'         => (string) ($locationData['latitude'] ?? ''),
            'longitude'        => (string) ($locationData['longitude'] ?? ''),
            'encoded_polyline' => (string) ($locationData['encoded_polyline'] ?? ''),
        ];

        try {
            $this->fcmService->sendSilentData($tokens, $data);
        } catch (\Exception $e) {
            Log::warning("Silent location FCM failed for passenger {$passengerId}: " . $e->getMessage());
        }
    }
}
