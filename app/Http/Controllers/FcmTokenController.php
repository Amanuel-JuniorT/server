<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FcmTokenController extends Controller
{
  public function register(Request $request)
  {

    $user = $request->user('sanctum');
    if (!$user) {
      return response()->json(['message' => 'User not authorized'], 403);
    }

    // Support both 'token' and 'fcm_token' for backward compatibility
    $fcmToken = $request->input('token') ?? $request->input('fcm_token');
    
    if (!$fcmToken) {
      return response()->json(['message' => 'FCM token is required'], 400);
    }

    // Default platform and app if not provided (for driver app compatibility)
    $platform = $request->input('platform', 'android');
    $app = $request->input('app', 'Driver');

    $validated = [
      'token' => $fcmToken,
      'platform' => $platform,
      'app' => $app,
    ];

    $userId = $user->id;

    // Update user's fcm_token field
    $user->update(['fcm_token' => $validated['token']]);

    // Also save to device_tokens table
    $device = DeviceToken::updateOrCreate(
      ['token' => $validated['token']],
      [
        'user_id' => $userId,
        'platform' => $validated['platform'],
        'app' => $validated['app'],
        'last_seen_at' => now(),
      ]
    );

    Log::info('FCM token registered and saved to user profile', [
      'user_id' => $userId,
      'platform' => $device->platform,
      'app' => $device->app,
    ]);

    return response()->json(['success' => true]);
  }

  public function unregister(Request $request)
  {
    $user = $request->user('sanctum');
    if (!$user) {
      return response()->json(['message' => 'User not authorized'], 403);
    }
    $validated = $request->validate([
      'token' => ['required', 'string'],
    ]);

    DeviceToken::where('token', $validated['token'])->delete();

    return response()->json(['success' => true]);
  }
}

