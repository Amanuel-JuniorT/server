<?php

namespace App\Http\Controllers;

use App\Events\NewRideRequested;
use App\Events\RideResponse;
use App\Models\Driver;
use Illuminate\Http\Request;
use App\Models\Ride;
use Illuminate\Support\Facades\DB;
use App\Models\CompanyEmployee;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Models\VehicleType;

class PassengerController extends Controller
{
    public function getPassengerProfile(Request $request)
    {
        try {
            $user = $request->user('sanctum');
            if (!$user) {
                return response()->json(['message' => 'User not authorized'], 403);
            }
            // Get the most recent company employee relationship
            $companyEmployee = CompanyEmployee::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$companyEmployee) {
                $state = "none";
            } else {
                $state = match ($companyEmployee->status) {
                    'pending' => 'pending',
                    'approved' => 'linked',
                    'rejected' => 'rejected',
                    'left' => 'left',
                    default => 'none'
                };
            }

            $deviceToken = DeviceToken::where('user_id', $user->id)->first();

            $user_data = [
                'company_status' => $state,
                'has_fcm_token' => ($user->fcm_token || $deviceToken) ? true : false,
            ];

            $lastRide = Ride::where('passenger_id', $user->id)->first();
            if ($lastRide != null && $lastRide->status != 'completed') {
                $last_ride_status = $lastRide->status;
                $user_data = array_merge($user_data, [
                    'last_ride_status' => $last_ride_status
                ]);
            }

            $user_data = array_merge($user_data, $user->toArray());

            return response()->json(['message' => "User data fetched.", 'user' => $user_data]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function editPassengerProfile(Request $request)
    {
        $user = $request->user('sanctum');
        if (!$user) {
            return response()->json(['message' => 'User not authorized'], 403);
        }

        try {
            $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }

            if ($request->hasFile('profile_picture')) {
                // Delete old profile picture if it exists
                if ($user->profile_image && Storage::exists($user->profile_image)) {
                    Storage::delete($user->profile_image);
                }

                $profilePicturePath = $request->file('profile_picture')->store('profile_pictures');
                $user->profile_image = $profilePicturePath;
            }

            $user->save();

            $userData = $user->toArray();
            if ($user->profile_image) {
                $userData['profile_image_url'] = Storage::url($user->profile_image);
            }

            return response()->json([
                'message' => 'User profile updated successfully',
                'user' => $userData
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function passengerRides(Request $request)
    {
        try {
            //     {
            //         id: 2,
            //         date: '2024-01-10',
            //         pickup: '789 Pine St, City',
            //         destination: '321 Elm St, City',
            //         driver: 'Jane Driver',
            //         fare: 18.75,
            //         rating: 4,
            //         status: 'completed',
            //     },
            $user = $request->user('sanctum');
            if (!$user) {
                return response()->json(['message' => 'User not authorized'], 403);
            }
            $id = $user->id;
            $rides = Ride::where('passenger_id', $id)->with(['driver.user', 'vehicleType'])->orderBy('created_at', 'desc')->get();

            $totalDistance = 0;
            $completedRides = 0;

            $data = $rides->map(function ($ride) use (&$totalDistance, &$completedRides) {
                $driver = $ride->driver;
                $driver_name = $driver && $driver->user ? $driver->user->name : 'No driver';
                $driver_id = $driver ? $driver->id : null;
                $driver_image = null;
                if ($driver) {
                    if ($driver->profile_picture_path) {
                        $driver_image = Storage::url($driver->profile_picture_path);
                    } else if ($driver->user && $driver->user->profile_image) {
                        $driver_image = Storage::url($driver->user->profile_image);
                    }
                }
                $vehicle_info = $ride->vehicleType ? $ride->vehicleType->display_name : 'Standard Ride';

                if ($ride->status === 'completed') {
                    $completedRides++;
                    $totalDistance += (float) ($ride->actual_distance ?? 0);
                }

                return [
                    'id' => $ride->id,
                    'requested_at' => $ride->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                    'pickup' => $ride->pickup_address,
                    'destination' => $ride->destination_address,
                    'price' => (float) $ride->price,
                    'status' => $ride->status,
                    'driver_name' => $driver_name,
                    'driver_id' => $driver_id,
                    'driver_image' => $driver_image,
                    'vehicle_info' => $vehicle_info,
                    'actual_distance' => (float) ($ride->actual_distance ?? 0),
                    'actual_duration' => (int) ($ride->actual_duration ?? 0),
                    'waiting_minutes' => (int) ($ride->waiting_minutes ?? 0),
                ];
            });

            return response()->json([
                'message' => "Rides fetched.",
                'data' => $data,
                'summary' => [
                    'total_rides' => $completedRides,
                    'total_distance' => round($totalDistance, 1),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function requestRide(Request $request)
    {
        try {
            $user = $request->user('sanctum');

            if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

            $request->validate([
                'originLat' => 'required|numeric|between:-90,90',
                'originLng' => 'required|numeric|between:-180,180',
                'destLat' => 'required|numeric|between:-90,90',
                'destLng' => 'required|numeric|between:-180,180',
                'pickupAddress' => 'required|string',
                'destinationAddress' => 'required|string',
                'accepts_pooling' => 'required|boolean',
                'vehicle_type_id' => 'required|exists:vehicle_types,id',
            ]);

            $vehicleType = VehicleType::findOrFail($request->vehicle_type_id);

            // Calculate fare
            $distance = $this->calculateDistance(
                $request->originLat,
                $request->originLng,
                $request->destLat,
                $request->destLng
            );
            $fare = round(max($vehicleType->base_fare + ($vehicleType->price_per_km * $distance), $vehicleType->minimum_fare), 2);

            $radius = 5; // kilometers
            $platformCommissionRate = floatval($vehicleType->commission_percentage) / 100;
            $min_balance = $fare * $platformCommissionRate * 1.2;

            $sql = "
                SELECT drivers.*, locations.latitude, locations.longitude,
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
                INNER JOIN vehicles ON drivers.id = vehicles.driver_id
                INNER JOIN wallets ON users.id = wallets.user_id
                WHERE drivers.status = 'available' 
                AND drivers.approval_state = 'approved' 
                AND vehicles.vehicle_type_id = ?
                AND wallets.balance >= ?
                AND (
                        6371 * acos(
                            cos(radians(?)) *
                            cos(radians(locations.latitude)) *
                            cos(radians(locations.longitude) - radians(?)) +
                            sin(radians(?)) *
                            sin(radians(locations.latitude))
                        )
                    ) <= ?
                ORDER BY distance ASC
            ";

            $nearestDriver = DB::selectOne($sql, [
                $request->originLat,
                $request->originLng,
                $request->originLat,
                $vehicleType->id,
                $min_balance,
                $request->originLat,
                $request->originLng,
                $request->originLat,
                $radius
            ]);

            if (!$nearestDriver) {
                return response()->json(['message' => 'No available drivers nearby.'], 404);
            }

            // 2. Create the ride only after we have a driver to notify

            DB::beginTransaction();
            $ride = Ride::create([
                'passenger_id' => $user->id,
                'origin_lat' => $request->originLat,
                'origin_lng' => $request->originLng,
                'destination_lat' => $request->destLat,
                'destination_lng' => $request->destLng,
                'pickup_address' => $request->pickupAddress,
                'destination_address' => $request->destinationAddress,
                'status' => "requested",
                'driver_id' => $nearestDriver->id,
                'requested_at' => now(),
                'cash_payment' => true, // Default to cash payment
                'passenger_accepts_pooling' => $request->boolean('accepts_pooling', false),
                'price' => $fare,
                'vehicle_type_id' => $vehicleType->id,
            ]);



            // Broadcast to specific driver (private channel)
            broadcast(new NewRideRequested($ride))->toOthers();
            DB::commit();

            return response()->json([
                'ride' => $ride,
                'driver_id' => $nearestDriver->id,
                'driverLatitude' => $nearestDriver->latitude,
                'driverLongitude' => $nearestDriver->longitude,
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            if (isset($ride) && $ride->exists) {
                $ride->delete();
            }
            return response()->json(['message' => 'Failed to dispatch ride request.' . $e->getMessage()], 500);
        }
    }

    /**
     * Driver rejects a ride.
     */
    public function reject($id, Request $request)
    {
        $ride = Ride::where('id', $id)
            ->where('status', 'requested')
            ->firstOrFail();

        $driver = $request->user('sanctum')->driver;

        if (!$driver || $ride->driver_id != $driver->id) {
            return response()->json(['message' => 'Unauthorized rejection.'], 403);
        }

        $driver->rejected_rides += 1;
        $driver->status = 'available';
        $driver->save();

        // Exclude this driver and try to send to next nearest
        $excludedDrivers = $ride->rejected_driver_ids ?? [];
        $excludedDrivers[] = $driver->id;
        $ride->rejected_driver_ids = $excludedDrivers;

        $vehicleType = $ride->vehicleType;
        $platformCommissionRate = $vehicleType ? (floatval($vehicleType->commission_percentage) / 100) : 0.15;
        $min_balance = floatval($ride->price) * $platformCommissionRate * 1.2;

        // Find next nearest
        $nextDriver = Driver::select('drivers.*')
            ->join('locations', 'drivers.id', '=', 'locations.driver_id')
            ->join('vehicles', 'drivers.id', '=', 'vehicles.driver_id')
            ->join('wallets', 'drivers.user_id', '=', 'wallets.user_id')
            ->where('drivers.status', 'available')
            ->where('drivers.approval_state', 'approved')
            ->where('vehicles.vehicle_type_id', $ride->vehicle_type_id)
            ->where('wallets.balance', '>=', $min_balance)
            ->whereNotIn('drivers.id', $excludedDrivers)
            ->orderByRaw("
            (
                6371 * acos(
                    cos(radians(?)) *
                    cos(radians(locations.latitude)) *
                    cos(radians(locations.longitude) - radians(?)) +
                    sin(radians(?)) *
                    sin(radians(locations.latitude))
                )
            ) ASC", [
                $ride->origin_lat,
                $ride->origin_lng,
                $ride->origin_lat
            ])
            ->first();

        if ($nextDriver) {
            $ride->driver_id = $nextDriver->id;
            $ride->save();

            $location = $nextDriver->location;

            broadcast(new NewRideRequested($ride))->toOthers();
            broadcast(new RideResponse($ride->passenger_id, "redirect", "Reassigned to another driver", $location, null))->toOthers();

            return response()->json(['message' => 'Reassigned to another driver.'], 200);
        }


        $ride->status = "cancelled";
        $driver->status = 'available';
        $driver->save();
        $ride->save();
        broadcast(new RideResponse($ride->passenger_id, "end", "No nearby drivers", null, null))->toOthers();

        return response()->json(['message' => 'No more drivers available.'], 404);
    }

    /**
     * Haversine formula for distance in kilometers.
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
