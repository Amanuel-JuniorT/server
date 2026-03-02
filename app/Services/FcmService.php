<?php

namespace App\Services;

use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

use Illuminate\Support\Facades\Log;

class FcmService
{
    public function __construct(private readonly Messaging $messaging) {}

    public function sendToTokens(array $tokens, string $title, string $body, array $data = [], bool $highPriority = true): array
    {
        Log::info("FCM Sending to " . count($tokens) . " tokens. Title: $title");

        try {
            $notification = Notification::create($title, $body);

            $message = CloudMessage::new()
                ->withNotification($notification)
                ->withData($data);

            if ($highPriority) {
                $message = $message->withAndroidConfig([
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'ecab_rides_v1',
                        'sound' => 'default',
                    ],
                ]);
            }

            $report = $this->messaging->sendMulticast($message, $tokens);

            Log::info("FCM Report: Successes: " . $report->successes()->count() . ", Failures: " . $report->failures()->count());

            if ($report->failures()->count() > 0) {
                foreach ($report->failures() as $failure) {
                    Log::error("FCM Failure: " . $failure->error()->getMessage());
                }
            }

            return [
                'successes' => $report->successes()->count(),
                'failures' => $report->failures()->count(),
            ];
        } catch (\Throwable $e) {
            Log::error("FCM Exception: " . $e->getMessage());
            return ['successes' => 0, 'failures' => count($tokens)];
        }
    }

    /**
     * Send a silent data-only FCM message (no visible notification).
     * Used for background wake-up (e.g. live driver location updates).
     * Android treats this as a high-priority data message that wakes the app
     * even in Doze mode, without showing a notification to the user.
     */
    public function sendSilentData(array $tokens, array $data): array
    {
        if (empty($tokens)) {
            return ['successes' => 0, 'failures' => 0];
        }

        Log::debug("FCM silent data push to " . count($tokens) . " tokens. Type: " . ($data['type'] ?? 'unknown'));

        try {
            $message = CloudMessage::new()
                ->withData($data)
                ->withAndroidConfig([
                    'priority' => 'high',
                    // No 'notification' key = data-only, no visible notification
                ]);

            $report = $this->messaging->sendMulticast($message, $tokens);

            return [
                'successes' => $report->successes()->count(),
                'failures' => $report->failures()->count(),
            ];
        } catch (\Throwable $e) {
            Log::error("FCM Silent Exception: " . $e->getMessage());
            return ['successes' => 0, 'failures' => count($tokens)];
        }
    }
}
