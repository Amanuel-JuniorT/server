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
}
