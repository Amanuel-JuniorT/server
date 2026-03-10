<?php

namespace App\Http\Controllers;

use App\Events\DriverLocationChange;
use App\Models\Ride;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Rating;
use App\Services\UnifiedNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Events\GlobalAdminNotification;

class DriverProfileController extends Controller
{
    public function __construct(
        private readonly UnifiedNotificationService $notificationService
    ) {}

    public function submit(Request $request)
    {
        Log::info('Driver detail submission request received', [
            'user_id' => $request->user()?->id,
            'all_data' => $request->except(['license_image', 'profile_picture']),
            'has_license_image' => $request->hasFile('license_image'),
            'has_profile_picture' => $request->hasFile('profile_picture'),
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $existingDriver = $user->driver;

        $plateUniqueRule = Rule::unique('vehicles', 'plate_number');
        if ($existingDriver && $existingDriver->vehicle) {
            $plateUniqueRule = $plateUniqueRule->ignore($existingDriver->vehicle->id);
        }

        $validator = Validator::make($request->all(), [
            'license_number' => 'required|string|max:255',
            'license_image' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'vehicle_type' => 'required|string|max:100',
            'vehicle_type_id' => 'nullable|exists:vehicle_types,id',
            'capacity' => 'required|integer|min:1',
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'plate_number' => ['required', 'string', $plateUniqueRule],
            'color' => 'required|string|max:100',
            'year' => 'required|integer|min:1990|max:' . date('Y'),
        ]);

        if ($validator->fails()) {
            Log::error('Driver details validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_all' => $request->all(),
                'has_license_image' => $request->hasFile('license_image'),
                'license_image_valid' => $request->hasFile('license_image') ? $request->file('license_image')->isValid() : false,
                'license_image_error' => $request->hasFile('license_image') ? $request->file('license_image')->getError() : 'no file',
                'has_profile_picture' => $request->hasFile('profile_picture'),
                'profile_picture_valid' => $request->hasFile('profile_picture') ? $request->file('profile_picture')->isValid() : false,
                'profile_picture_error' => $request->hasFile('profile_picture') ? $request->file('profile_picture')->getError() : 'no file',
            ]);
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $licenseImagePath = $request->file('license_image')->store('license_images');
        $profilePicturePath = $request->file('profile_picture')->store('profile_pictures');

        DB::beginTransaction();

        try {
            if ($existingDriver) {
                if (in_array($existingDriver->approval_state, ['pending', 'approved'])) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Details already submitted and ' . $existingDriver->approval_state . '.',
                    ], 400);
                }

                // Rejected: update existing records and set back to pending
                $existingDriver->license_number = $request->license_number;
                $existingDriver->license_image_path = $licenseImagePath;
                $existingDriver->profile_picture_path = $profilePicturePath;
                $existingDriver->approval_state = 'pending';
                $existingDriver->reject_message = null;
                $existingDriver->status = 'offline';
                $existingDriver->save();

                $vehicle = $existingDriver->vehicle;
                if ($vehicle) {
                    $vehicle->update([
                        'vehicle_type' => $request->vehicle_type,
                        'vehicle_type_id' => $request->vehicle_type_id,
                        'capacity' => $request->capacity,
                        'make' => $request->make,
                        'model' => $request->model,
                        'plate_number' => $request->plate_number,
                        'color' => $request->color,
                        'year' => $request->year,
                    ]);
                } else {
                    Vehicle::create([
                        'driver_id' => $existingDriver->id,
                        'vehicle_type' => $request->vehicle_type,
                        'vehicle_type_id' => $request->vehicle_type_id,
                        'capacity' => $request->capacity,
                        'make' => $request->make,
                        'model' => $request->model,
                        'plate_number' => $request->plate_number,
                        'color' => $request->color,
                        'year' => $request->year,
                    ]);
                }

                $driver = $existingDriver;
            } else {
                $driver = Driver::create([
                    'user_id' => $user->id,
                    'license_number' => $request->license_number,
                    'approval_state' => 'pending',
                    'status' => 'offline',
                    'license_image_path' => $licenseImagePath,
                    'profile_picture_path' => $profilePicturePath,
                ]);

                Vehicle::create([
                    'driver_id' => $driver->id,
                    'vehicle_type' => $request->vehicle_type,
                    'vehicle_type_id' => $request->vehicle_type_id,
                    'capacity' => $request->capacity,
                    'make' => $request->make,
                    'model' => $request->model,
                    'plate_number' => $request->plate_number,
                    'color' => $request->color,
                    'year' => $request->year,
                ]);
            }

            DB::commit();

            // Broadcast notification to admins
            try {
                broadcast(new GlobalAdminNotification("New driver verification request from {$user->name}", 'driver_verification', [
                    'driver_id' => $driver->id,
                    'name' => $user->name,
                ]))->toOthers();
            } catch (\Exception $e) {
                Log::warning('Failed to broadcast driver verification notification: ' . $e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Driver verification submitted',
                'driver_id' => $driver->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Driver details submission failed with exception', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);
            return response()->json(['error' => 'Failed to submit details', 'details' => $e->getMessage()], 500);
        }
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|string|in:available,on_ride,offline',
        ]);

        $user = $request->user();

        if (!$user || !$user->driver) {
            return response()->json(['message' => 'Driver not found or unauthorized'], 401);
        }

        $driver = $user->driver;
        $driver->status = $request->status;
        $driver->save();

        return response()->json(['message' => 'Driver status updated successfully']);
    }

    public function updateLocation(Request $request)
    {
        try {
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'encoded_polyline' => 'nullable|string',
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $driver = $user->driver;

            if (!$driver) {
                return response()->json(['error' => 'Not a driver'], 403);
            }

            // Update location in database
            $location = $driver->location;

            if ($location) {
                $location->update([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'updated_at' => now(),
                ]);
            } else {
                $driver->location()->create([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ]);
            }

            // Cache in Redis for high-speed access (TTL 5 minutes)
            Cache::put("driver_location_{$driver->id}", [
                'lat' => $request->latitude,
                'lng' => $request->longitude,
                'updated_at' => now(),
            ], 300);

            // Also update driver table location fields if they exist
            if ($driver->hasAttribute('latitude')) {
                $driver->latitude = $request->latitude;
                $driver->longitude = $request->longitude;
                $driver->last_location_update = now();
                $driver->save();
            }

            // Send response immediately before broadcasting
            $response = response()->json([
                'success' => true,
                'message' => 'Location updated successfully'
            ]);

            // Broadcast event asynchronously (non-blocking)
            try {
                broadcast(new DriverLocationChange($driver, (float)$request->latitude, (float)$request->longitude, $request->encoded_polyline))->toOthers();
            } catch (\Exception $broadcastException) {
                // Log broadcast error but don't fail the request
                Log::warning('Failed to broadcast location update: ' . $broadcastException->getMessage());
            }

            // Silent FCM fallback for when the passenger app is backgrounded.
            // Only send during an active ride to respect FCM rate limits.
            try {
                $activeRide = Ride::where('driver_id', $driver->id)
                    ->whereIn('status', ['accepted', 'arrived', 'in_progress'])
                    ->first();

                if ($activeRide) {
                    $this->notificationService->sendLocationUpdate($activeRide->passenger_id, [
                        'driver_id'        => $driver->id,
                        'latitude'         => $request->latitude,
                        'longitude'        => $request->longitude,
                        'encoded_polyline' => $request->encoded_polyline ?? '',
                    ]);
                }
            } catch (\Exception $fcmException) {
                Log::warning('Silent FCM location fallback failed: ' . $fcmException->getMessage());
            }

            return $response;
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Location update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to update location',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getNearbyDrivers(Request $request)
    {
        $latitude = $request->query('lat');
        $longitude = $request->query('lng');

        if (!$latitude || !$longitude) {
            return response()->json(["message" => "No Lat and Lng"], 404);
        }

        $radius = 5; // kilometers

        $sql = "
        SELECT *
        FROM (
            SELECT
                drivers.id AS driver_id,
                users.name AS driver_name,
                locations.latitude,
                locations.longitude,
                (
                    6371 * acos(
                        cos(radians(?)) *
                        cos(radians(locations.latitude)) *
                        cos(radians(locations.longitude) - radians(?)) +
                        sin(radians(?)) *
                        sin(radians(locations.latitude))
                    )
                ) AS distance
            FROM locations
            INNER JOIN drivers ON locations.driver_id = drivers.id
            INNER JOIN users ON drivers.user_id = users.id
            WHERE drivers.status = 'available' AND drivers.approval_state = 'approved'
        ) AS sub
        WHERE distance <= ?
        ORDER BY distance ASC
    ";

        $drivers = DB::select($sql, [$latitude, $longitude, $latitude, $radius]);

        return response()->json([
            'status' => 'success',
            'drivers' => $drivers,
        ]);
    }

    public function getProfile(Request $request)
    {
        $user = $request->user();
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $vehicle = $driver->vehicle;
        $location = $driver->location;

        // Get account settings/privacy from user record
        $dbPrivacy = $user->privacy_settings ?? [];
        $privacy = [
            'location_sharing' => $dbPrivacy['location_sharing'] ?? true,
            'profile_visibility' => $dbPrivacy['profile_visibility'] ?? true,
            'data_collection' => $dbPrivacy['data_collection'] ?? true,
            'two_factor_enabled' => $user->two_factor_secret ? true : false,
        ];

        // Get document statuses
        $docStatuses = \App\Models\Document::where('driver_id', $driver->id)
            ->get()
            ->groupBy('document_type')
            ->map(function ($docs) {
                return $docs->sortByDesc('uploaded_at')->first()->status;
            });

        return response()->json([
            'driver' => [
                'id' => $driver->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'license_number' => $driver->license_number,
                'license_expiry' => $driver->license_expiry,
                'experience_years' => $driver->experience_years,
                'emergency_contact_name' => $driver->emergency_contact_name,
                'emergency_contact_phone' => $driver->emergency_contact_phone,
                'approval_state' => $driver->approval_state ?? 'pending',
                'status' => $driver->status,
                'profile_picture_url' => $driver->profile_picture_path ? \Storage::url($driver->profile_picture_path) : null,
                'license_image_url' => $driver->license_image_path ? \Storage::url($driver->license_image_path) : null,
                // Flattened vehicle info
                'vehicle_make' => $vehicle->make ?? null,
                'vehicle_model' => $vehicle->model ?? null,
                'vehicle_year' => $vehicle->year ?? null,
                'plate_number' => $vehicle->plate_number ?? null,
                'vehicle_type' => $vehicle->vehicle_type ?? null,
                'capacity' => $vehicle->capacity ?? null,
                'color' => $vehicle->color ?? null,
                'has_air_conditioning' => $vehicle->has_air_conditioning ?? false,
                'has_child_seat' => $vehicle->has_child_seat ?? false,

                // Document statuses
                'document_statuses' => [
                    'driver_license' => $docStatuses['driver_license'] ?? 'not_uploaded',
                    'vehicle_registration' => $docStatuses['vehicle_registration'] ?? 'not_uploaded',
                    'insurance' => $docStatuses['insurance'] ?? 'not_uploaded',
                    'inspection' => $docStatuses['inspection'] ?? 'not_uploaded',
                ],

                'privacy_settings' => $privacy,

                'location' => $location ? [
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                    'updated_at' => $location->updated_at,
                ] : null,
            ]
        ]);
    }

    public function getStats(Request $request)
    {
        $user = $request->user();
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        try {
            // Get all completed rides for this driver
            $completedRides = \App\Models\Ride::where('driver_id', $driver->id)
                ->where('status', 'completed')
                ->get();

            // Calculate total trips
            $totalTrips = $completedRides->count();

            // Calculate total earnings
            $totalEarnings = $completedRides->sum('price') ?? 0;

            // Get driver rating from ratings table
            $ratings = Rating::where('to_user_id', $user->id)->get();
            $averageRating = $ratings->count() > 0 ? round($ratings->avg('score'), 1) : 5.0;
            $totalRatings = $ratings->count();

            // Get wallet balance
            $wallet = $user->wallet;
            $walletBalance = $wallet ? $wallet->balance : 0;

            // Calculate online hours (simplified - count active hours this week)
            $thisWeekRides = $completedRides->filter(function ($ride) {
                return $ride->created_at >= now()->startOfWeek();
            });
            $onlineHours = $thisWeekRides->count() * 2; // Estimate 2 hours per trip

            return response()->json([
                'success' => true,
                'data' => [
                    'total_trips' => $totalTrips,
                    'total_earnings' => $totalEarnings,
                    'average_rating' => $averageRating,
                    'total_ratings' => $totalRatings,
                    'wallet_balance' => $walletBalance,
                    'online_hours' => $onlineHours,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting driver stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Update user information
            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('phone')) {
                $user->phone = $request->phone;
            }
            $user->save();

            // Update driver information
            if ($request->has('license_number')) {
                $driver->license_number = $request->license_number;
            }
            if ($request->has('license_expiry')) {
                $driver->license_expiry = $request->license_expiry;
            }
            if ($request->has('experience_years')) {
                $driver->experience_years = $request->experience_years;
            }
            if ($request->has('emergency_contact_name')) {
                $driver->emergency_contact_name = $request->emergency_contact_name;
            }
            if ($request->has('emergency_contact_phone')) {
                $driver->emergency_contact_phone = $request->emergency_contact_phone;
            }
            $driver->save();

            // Update vehicle information
            $vehicle = $driver->vehicle;
            if ($vehicle) {
                if ($request->has('vehicle_make')) {
                    $vehicle->make = $request->vehicle_make;
                }
                if ($request->has('vehicle_model')) {
                    $vehicle->model = $request->vehicle_model;
                }
                if ($request->has('vehicle_year')) {
                    $vehicle->year = $request->vehicle_year;
                }
                if ($request->has('plate_number')) {
                    $vehicle->plate_number = $request->plate_number;
                }
                if ($request->has('vehicle_type')) {
                    $vehicle->vehicle_type = $request->vehicle_type;
                }
                if ($request->has('capacity')) {
                    $vehicle->capacity = $request->capacity;
                }
                if ($request->has('has_air_conditioning')) {
                    $vehicle->has_air_conditioning = $request->has_air_conditioning;
                }
                if ($request->has('has_child_seat')) {
                    $vehicle->has_child_seat = $request->has_child_seat;
                }
                $vehicle->save();
            }

            // Update privacy settings
            $privacyFields = ['location_sharing', 'profile_visibility', 'data_collection'];
            $newPrivacy = $user->privacy_settings ?? [];
            $privacyUpdated = false;

            foreach ($privacyFields as $field) {
                if ($request->has($field)) {
                    $newPrivacy[$field] = filter_var($request->$field, FILTER_VALIDATE_BOOLEAN);
                    $privacyUpdated = true;
                }
            }

            if ($privacyUpdated) {
                $user->privacy_settings = $newPrivacy;
                $user->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'driver' => $this->getProfile($request)->getData()->driver
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadDocument(Request $request)
    {
        $user = $request->user();
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'document' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120', // 5MB max
            'document_type' => 'required|string|in:driver_license,vehicle_registration,insurance,inspection,profile_picture'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $documentType = $request->document_type;
            $file = $request->file('document');

            // Store the file
            $path = $file->store('documents/' . $documentType);

            // Update driver record based on document type
            if ($documentType === 'profile_picture') {
                $driver->profile_picture_path = $path;
                $driver->save();
            } elseif ($documentType === 'driver_license') {
                $driver->license_image_path = $path;
                $driver->save();
            }

            // Create document record
            $document = \App\Models\Document::create([
                'driver_id' => $driver->id,
                'document_type' => $documentType,
                'file_path' => $path,
                'status' => 'pending',
                'uploaded_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document' => [
                    'id' => $document->id,
                    'type' => $document->document_type,
                    'status' => $document->status,
                    'url' => \Storage::url($path)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error uploading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error uploading document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getDocuments(Request $request)
    {
        $user = $request->user();
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        try {
            $documents = \App\Models\Document::where('driver_id', $driver->id)
                ->orderBy('uploaded_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'documents' => $documents->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'type' => $doc->document_type,
                        'status' => $doc->status,
                        'url' => \Storage::url($doc->file_path),
                        'rejection_reason' => $doc->rejection_reason,
                        'uploaded_at' => $doc->uploaded_at
                    ];
                })
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching documents: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching documents'
            ], 500);
        }
    }

    /**
     * Change the driver's password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password does not match'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Delete the driver's account.
     */
    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password'], 400);
        }

        DB::beginTransaction();
        try {
            $driver = $user->driver;
            if ($driver) {
                // Check for active rides
                $activeRides = \App\Models\Ride::where('driver_id', $driver->id)
                    ->whereIn('status', ['accepted', 'arrived', 'started'])
                    ->exists();

                if ($activeRides) {
                    return response()->json(['message' => 'Cannot delete account with active rides'], 400);
                }

                // Delete related records
                \App\Models\Document::where('driver_id', $driver->id)->delete();
                \App\Models\Vehicle::where('driver_id', $driver->id)->delete();
                $driver->delete();
            }

            // Log out from all devices
            $user->tokens()->delete();
            $user->delete();

            DB::commit();
            return response()->json(['message' => 'Account deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting account: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete account'], 500);
        }
    }

    /**
     * Toggle Two-Factor Authentication.
     */
    public function toggleTwoFactor(Request $request)
    {
        $user = $request->user();

        // Simple toggle for now - in production this would involve generating/verifying secrets
        if ($user->two_factor_secret) {
            $user->two_factor_secret = null;
            $user->two_factor_recovery_codes = null;
            $user->save();
            return response()->json(['message' => 'Two-factor authentication disabled', 'enabled' => false]);
        } else {
            $user->two_factor_secret = 'placeholder_secret'; // Placeholder
            $user->save();
            return response()->json(['message' => 'Two-factor authentication enabled', 'enabled' => true]);
        }
    }

    /**
     * Request a download of the driver's data.
     */
    public function requestDataDownload(Request $request)
    {
        $user = $request->user();

        // In a real system, this would queue a job to generate a ZIP and email the user
        // For now, we'll just log the request and return success
        Log::info("Data download requested by user ID: {$user->id}");

        return response()->json([
            'message' => 'Your request has been received. We will prepare your data and notify you via email.'
        ]);
    }
}
