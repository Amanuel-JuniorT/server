<?php

namespace App\Http\Controllers;

use App\Jobs\SendFcmMessage;
use App\Models\DeviceToken;
use App\Models\UserNotification;
use App\Services\FcmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use App\Services\UnifiedNotificationService;

class AdminNotificationController extends Controller
{
  public function __construct(
    private readonly UnifiedNotificationService $notificationService
  ) {}

  public function send(Request $request, FcmService $fcmService)
  {
    try {
      $validated = $request->validate([
        'target' => 'required|in:all_passengers,all_drivers,user_id,tokens',
        'user_id' => 'nullable|integer',
        'tokens' => 'nullable|array',
        'title' => 'required|string|max:255',
        'body' => 'required|string|max:2000',
        'data' => 'nullable',
        'high_priority' => 'nullable|boolean',
      ]);

      // Determine WebSocket channel based on target
      $channel = 'promotions';
      if ($validated['target'] === 'user_id' && !empty($validated['user_id'])) {
        $channel = 'passenger.' . $validated['user_id'];
      } elseif ($validated['target'] === 'all_drivers') {
        $channel = 'drivers_broadcast';
      }

      // Resolve FCM tokens and user IDs from DeviceToken table (case-insensitive)
      $tokens = [];
      $userIds = [];

      if ($validated['target'] === 'all_passengers') {
        $rows = DeviceToken::whereRaw('LOWER(app) = ?', ['passenger'])->get();
        $tokens = $rows->pluck('token')->filter()->unique()->values()->all();
        $userIds = $rows->pluck('user_id')->unique()->values()->all();
        
        // Fallback to user-table fcm_token
        if (empty($tokens)) {
            $users = \App\Models\User::where('role', 'passenger')->whereNotNull('fcm_token')->get();
            $tokens = $users->pluck('fcm_token')->filter()->unique()->values()->all();
            $userIds = array_unique(array_merge($userIds, $users->pluck('id')->all()));
        }
      } elseif ($validated['target'] === 'all_drivers') {
        $rows = DeviceToken::whereRaw('LOWER(app) = ?', ['driver'])->get();
        $tokens = $rows->pluck('token')->filter()->unique()->values()->all();
        $userIds = $rows->pluck('user_id')->unique()->values()->all();
        
        // Fallback to user-table fcm_token
        if (empty($tokens)) {
            $users = \App\Models\User::where('role', 'driver')->whereNotNull('fcm_token')->get();
            $tokens = $users->pluck('fcm_token')->filter()->unique()->values()->all();
            $userIds = array_unique(array_merge($userIds, $users->pluck('id')->all()));
        }
      } elseif ($validated['target'] === 'user_id' && !empty($validated['user_id'])) {
        $rows = DeviceToken::where('user_id', $validated['user_id'])->get();
        $tokens = $rows->pluck('token')->filter()->unique()->values()->all();
        $userIds = [$validated['user_id']];
        
        // Fallback to user-table fcm_token
        if (empty($tokens)) {
            $user = \App\Models\User::find($validated['user_id']);
            if ($user && $user->fcm_token) {
                $tokens = [$user->fcm_token];
            }
        }
      } elseif ($validated['target'] === 'tokens' && !empty($validated['tokens'])) {
        $tokens = array_values(array_unique(array_filter($validated['tokens'])));
      }

      // Persist notification history for each targeted user
      foreach ($userIds as $uid) {
        try {
          UserNotification::create([
            'user_id' => $uid,
            'title'   => $validated['title'],
            'body'    => $validated['body'],
            'data'    => $validated['data'] ?? [],
            'type'    => $validated['data']['type'] ?? 'admin',
          ]);
        } catch (\Exception $e) {
          Log::warning("Failed to persist admin notification for user {$uid}: " . $e->getMessage());
        }
      }

      // Send via FCM
      $fcmCount = 0;
      if (!empty($tokens)) {
        try {
          $fcmResult = $fcmService->sendToTokens(
            $tokens,
            $validated['title'],
            $validated['body'],
            $validated['data'] ?? [],
            $validated['high_priority'] ?? true
          );
          $fcmCount = count($tokens);
          Log::info('Admin FCM broadcast sent', ['count' => $fcmCount, 'result' => $fcmResult]);
        } catch (\Exception $e) {
          Log::error('Admin FCM send failed', ['error' => $e->getMessage()]);
        }
      } else {
        Log::info('Admin notification: no FCM tokens found', ['target' => $validated['target']]);
      }

      // Also broadcast via WebSocket (Reverb) for users active in the app
      broadcast(new \App\Events\SendPromotion(
        $validated['title'],
        $validated['body'],
        $validated['data'] ?? [],
        $channel
      ))->toOthers();

      Log::info('Admin notification sent', [
        'admin_id' => optional($request->user())->id,
        'target'   => $validated['target'],
        'title'    => $validated['title'],
        'fcm_sent' => $fcmCount,
        'db_saved' => count($userIds),
      ]);

      return response()->json([
        'success'   => true,
        'message'   => 'Notification sent via FCM (' . $fcmCount . ' devices) + WebSocket',
        'fcm_count' => $fcmCount,
        'db_saved'  => count($userIds),
      ]);
    } catch (\Exception $e) {
      Log::error('Admin notification send failed', ['error' => $e->getMessage()]);
      return response()->json([
        'success' => false,
        'message' => 'Failed to send notification: ' . $e->getMessage(),
      ], 500);
    }
  }

  public function send02(Request $request, FcmService $fcmService)
  {
    try {
      $validated = $request->validate([
        'target' => 'in:all_passengers,all_drivers,user_id,tokens',
        'user_id' => 'nullable|integer',
        'tokens' => 'nullable|array',
        'title' => 'required|string|max:255',
        'body' => 'required|string|max:2000',
        'data' => 'nullable',
        'high_priority' => 'nullable|boolean',
      ]);

      // Determine channel based on target
      $channel = 'promotions';
      if ($validated['target'] === 'user_id' && !empty($validated['user_id'])) {
        $channel = 'passenger.' . $validated['user_id'];
      } elseif ($validated['target'] === 'all_drivers') {
        $channel = 'drivers_broadcast';
      }

      $tokens = [];
      $userIds = [];

      if ($validated['target'] === 'all_passengers') {
        $users = \App\Models\User::where('role', 'passenger')->get();
        $tokens = $users->whereNotNull('fcm_token')->pluck('fcm_token')->filter()->values()->all();
        $userIds = $users->pluck('id')->all();
      } elseif ($validated['target'] === 'all_drivers') {
        $users = \App\Models\User::where('role', 'driver')->get();
        $tokens = $users->whereNotNull('fcm_token')->pluck('fcm_token')->filter()->values()->all();
        $userIds = $users->pluck('id')->all();
      } elseif ($validated['target'] === 'user_id' && !empty($validated['user_id'])) {
        $user = \App\Models\User::find($validated['user_id']);
        if ($user) {
          if ($user->fcm_token) $tokens = [$user->fcm_token];
          $userIds = [$user->id];
        }
      } elseif ($validated['target'] === 'tokens' && !empty($validated['tokens'])) {
        $tokens = $validated['tokens'];
      }

      $tokens = array_values(array_unique(array_filter($tokens)));

      // Persist to user_notifications for each targeted user
      foreach ($userIds as $uid) {
        try {
          \App\Models\UserNotification::create([
            'user_id' => $uid,
            'title'   => $validated['title'],
            'body'    => $validated['body'],
            'data'    => $validated['data'] ?? [],
            'type'    => $validated['data']['type'] ?? 'admin',
          ]);
        } catch (\Exception $e) {
          Log::warning("Failed to persist admin notification for user {$uid}: " . $e->getMessage());
        }
      }

      $fcmResult = [];
      if (!empty($tokens)) {
        try {
          $fcmResult = $fcmService->sendToTokens(
            $tokens,
            $validated['title'],
            $validated['body'],
            $validated['data'] ?? [],
            $validated['high_priority'] ?? true
          );
          Log::info('FCM Broadcast Sent', ['count' => count($tokens), 'result' => $fcmResult]);
        } catch (\Exception $e) {
          Log::error('FCM Send Failed', ['error' => $e->getMessage()]);
        }
      }

      Log::info('Admin broadcast Promotion', [
        'admin_id' => optional($request->user())->id,
        'channel' => $channel,
        'title' => $validated['title']
      ]);

      broadcast(new \App\Events\SendPromotion(
        $validated['title'],
        $validated['body'],
        $validated['data'] ?? [],
        $channel
      ))->toOthers();

      return response()->json([
        'success' => true,
        'message' => 'Broadcast sent to ' . $channel,
        'fcm_count' => count($tokens),
        'db_saved' => count($userIds),
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to send notification',
        'error' => $e->getMessage()
      ], 500);
    }
  }
}
