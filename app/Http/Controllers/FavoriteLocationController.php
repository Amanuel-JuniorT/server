<?php

namespace App\Http\Controllers;

use App\Models\FavoriteLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FavoriteLocationController extends Controller
{
  /**
   * Get all favorites for the authenticated user.
   */
  public function index()
  {
    $user = Auth::user();
    $favorites = $user->favorites()->where('is_active', true)->get();

    return response()->json([
      'status' => 'success',
      'data' => $favorites,
    ]);
  }

  /**
   * Sync favorites from the mobile app.
   * Expects an array of favorites.
   */
  public function sync(Request $request)
  {
    $user = Auth::user();
    $favoritesData = $request->input('favorites', []);

    if (!is_array($favoritesData)) {
      return response()->json([
        'status' => 'error',
        'message' => 'Invalid data format. Expected an array of favorites.',
      ], 400);
    }

    try {
      foreach ($favoritesData as $data) {
        // Use address + user_id as unique identifier for syncing
        FavoriteLocation::updateOrCreate(
          [
            'user_id' => $user->id,
            'address' => $data['address'],
          ],
          [
            'name' => $data['name'] ?? null,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'type' => $data['type'] ?? 'favorite',
            'label' => $data['label'] ?? null,
            'is_active' => $data['isActive'] ?? true, // Support app-side 'isActive' key
            'timestamp' => $data['timestamp'] ?? null,
          ]
        );
      }

      // Return the updated state
      $allFavorites = $user->favorites()->get();

      return response()->json([
        'status' => 'success',
        'message' => 'Favorites synced successfully',
        'data' => $allFavorites,
      ]);
    } catch (\Exception $e) {
      Log::error('Favorite sync error: ' . $e->getMessage());
      return response()->json([
        'status' => 'error',
        'message' => 'Failed to sync favorites: ' . $e->getMessage(),
      ], 500);
    }
  }
}
