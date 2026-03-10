<?php

namespace App\Http\Controllers;

use App\Models\Ride;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Rating;
use App\Models\Driver;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\VehicleType;
use App\Events\NewRideRequested;
use App\Events\RideAccepted;
use App\Events\RideRejected;
use App\Events\RideStatusChanged;
use App\Events\RideStarted;
use App\Events\RideEnded;
use App\Events\RideCancelled;
use App\Events\PaymentCompleted;
use App\Events\RideRequested;
use App\Services\FcmService;
use App\Events\DriverArrived;
use App\Jobs\DispatchRideJob;
use App\Http\Resources\VehicleTypeResource;

use App\Services\UnifiedNotificationService;

class RideController extends Controller
{
    /**
     * Get available vehicle types with pricing.
     */
    public function getVehicleTypes()
    {
        try {
            Log::info('getVehicleTypes endpoint called');
            $types = VehicleType::where('is_active', true)->get();
            Log::info('Found ' . $types->count() . ' active vehicle types');

            // Return plain array instead of ResourceCollection to match client expectations
            return response()->json($types->map(function ($type) {
                return (new VehicleTypeResource($type))->resolve();
            })->values());
        } catch (\Exception $e) {
            Log::error('Error in getVehicleTypes: ' . $e->getMessage());
            return response()->json(['error' => 'Database error', 'message' => $e->getMessage()], 500);
        }
    }

    public function __construct(
        private readonly UnifiedNotificationService $notificationService
    ) {}

    /**
     * Passenger requests a ride.
     * Consolidates logic from RideController and PassengerController for a robust marketplace experience.
     */
    /**
     * Passenger requests a ride.
     * Starts an asynchronous dispatch process via DispatchRideJob.
     */
    public function requestRide(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'originLat' => 'required|numeric|between:-90,90',
                'originLng' => 'required|numeric|between:-180,180',
                'destLat' => 'required|numeric|between:-90,90',
                'destLng' => 'required|numeric|between:-180,180',
                'pickupAddress' => 'nullable|string',
                'destinationAddress' => 'nullable|string',
                'vehicle_type_id' => 'required|exists:vehicle_types,id',
                'accepts_pooling' => 'nullable|boolean',
            ]);

            $vehicleType = VehicleType::findOrFail($validated['vehicle_type_id']);

            $fare = $this->calculateFare(
                $validated['originLat'],
                $validated['originLng'],
                $validated['destLat'],
                $validated['destLng'],
                $vehicleType
            );

            // 2. Geocoding fallback for addresses
            $geocodingService = new GeocodingService();
            $pickupAddress = $validated['pickupAddress'] ?? $geocodingService->reverseGeocode($validated['originLat'], $validated['originLng']);
            $destinationAddress = $validated['destinationAddress'] ?? $geocodingService->reverseGeocode($validated['destLat'], $validated['destLng']);

            // 3. Create the Ride record with 'requested' status (initial state)
            DB::beginTransaction();
            $ride = Ride::create([
                'passenger_id' => $user->id,
                'origin_lat' => $validated['originLat'],
                'origin_lng' => $validated['originLng'],
                'destination_lat' => $validated['destLat'],
                'destination_lng' => $validated['destLng'],
                'pickup_address' => $pickupAddress,
                'destination_address' => $destinationAddress,
                'price' => $fare,
                'status' => 'requested',
                'requested_at' => now(),
                'rejected_driver_ids' => [],
                'cash_payment' => true,
                'passenger_accepts_pooling' => $request->boolean('accepts_pooling', false),
                'vehicle_type_id' => $vehicleType->id,
            ]);

            // 4. Dispatch the background Job to find a driver
            DispatchRideJob::dispatch($ride);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Searching for nearby drivers...',
                'ride' => $ride,
                'searching' => true,
                'driverLatitude' => $validated['originLat'], // Added to prevent app crash
                'driverLongitude' => $validated['originLng'], // Added to prevent app crash
                'driver_id' => 0, // Placeholder
                'tip' => 'Make sure to show a nice animation in the app while we find the best driver for you!'
            ], 201);
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            Log::error("Ride request dispatch failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to initiate ride request. ' . $e->getMessage()], 500);
        }
    }


    /**
     * Driver accepts a ride.
     */
    public function accept($id, Request $request)
    {
        $driver = $request->user()->driver;
        if (!$driver) return response()->json(['message' => 'Driver not found'], 404);

        DB::beginTransaction();
        try {
            $ride = Ride::where('id', $id)->lockForUpdate()->first();
            if (!$ride || !in_array($ride->status, ['requested', 'searching'])) {
                DB::rollBack();
                return response()->json(['message' => 'Ride already accepted or not available'], 409);
            }

            // Check if a DIFFERENT driver is trying to accept this ride
            if ($ride->driver_id !== null && $ride->driver_id !== $driver->id) {
                DB::rollBack();
                return response()->json(['message' => 'Ride already assigned to another driver'], 409);
            }

            $ride->driver_id = $driver->id;
            $ride->status = 'accepted';
            $ride->is_pool_enabled = $driver->pooling_enabled; // Set based on driver preference
            $ride->save();

            $driver->accepted_rides = ($driver->accepted_rides ?? 0) + 1;
            $driver->status = 'on_ride';
            $driver->save();

            DB::commit();

            $ride->refresh();

            // Prepare driver data for the event
            $driverData = [
                'driver_name' => $driver->user->name ?? 'Unknown Driver',
                'driver_phone' => $driver->user->phone ?? 'N/A',
                'driver_profile' => $driver->user->profile_image ?? '',
                'vehicle_make' => $driver->vehicle->make ?? 'Unknown',
                'vehicle_model' => $driver->vehicle->model ?? 'Unknown',
                'plate_number' => $driver->vehicle->plate_number ?? 'N/A',
                'vehicle_color' => $driver->vehicle->color ?? 'Unknown'
            ];

            $this->notificationService->notifyUser(
                $ride->passenger_id,
                "Ride Accepted",
                "Driver {$driverData['driver_name']} has accepted your ride request!",
                $driverData,
                new RideAccepted($ride->passenger_id, $driverData, $driver->id),
                'Passenger'
            );

            Log::info('RideAccepted hybrid notification sent');

            broadcast(new RideStatusChanged($ride));

            return response()->json([
                'message' => 'Ride accepted',
                'ride' => $ride,
                'passenger' => $ride->passenger,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Retry ride if no driver is found
     */
    public function retryRide($id, Request $request)
    {
        try {
            $user = $request->user('sanctum');

            // /Check if user is authenticated
            if (!$user) return response()->json(['message' => 'Not authorized'], 401);

            // Check if ride is available for retry (requested, searching, or cancelled from a previous failed search)
            $ride = Ride::where('id', $id)
                ->whereIn('status', ['requested', 'searching', 'cancelled', 'no_driver_found'])
                ->first();

            if (!$ride) return response()->json(['message' => 'Ride not available for retry'], 404);

            // Check if user is the passenger of the ride
            if ($ride->passenger_id !== $user->id) return response()->json(['message' => 'Not authorized'], 401);

            // Retry ride
            DB::beginTransaction();
            $ride->update([
                'status' => 'requested',
                'rejected_driver_ids' => [] // Reset rejections so they can be searched again
            ]);

            broadcast(new RideStatusChanged($ride));

            DispatchRideJob::dispatch($ride);
            DB::commit();
            return response()->json(['message' => 'Ride retried successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Driver rejects a ride.
     */
    public function reject($id, Request $request)
    {
        $driver = $request->user()->driver;
        if (!$driver) return response()->json(['message' => 'Driver not found'], 404);

        $ride = Ride::where('id', $id)->whereIn('status', ['requested', 'searching'])->first();
        if (!$ride) return response()->json(['message' => 'Ride not available for rejection'], 404);

        $driver->rejected_rides = ($driver->rejected_rides ?? 0) + 1;
        $driver->save();

        // Track rejected drivers for this ride
        $excludedDrivers = $ride->rejected_driver_ids;
        if (!is_array($excludedDrivers)) {
            $excludedDrivers = $excludedDrivers ? [$excludedDrivers] : [];
        }
        if (!in_array($driver->id, $excludedDrivers)) {
            $excludedDrivers[] = $driver->id;
        }
        $ride->rejected_driver_ids = $excludedDrivers;
        $ride->save();

        broadcast(new RideRejected($ride, $driver))->toOthers();

        $vehicleType = $ride->vehicleType;
        $platformCommissionRate = $vehicleType ? (floatval($vehicleType->commission_percentage) / 100) : 0.15;
        $min_balance = floatval($ride->price) * $platformCommissionRate * 1.2;

        // Try to assign to next nearest driver
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
            return response()->json(['message' => 'Reassigned to another driver.'], 200);
        }

        // No more drivers available, notify passenger
        $ride->status = 'cancelled';
        $ride->cancelled_at = now();
        $ride->save();

        $this->notificationService->notifyUser(
            $ride->passenger_id,
            "No Driver Found",
            "Sorry, all available drivers are currently busy.",
            ['ride_id' => $ride->id, 'status' => 'cancelled'],
            new RideCancelled($ride),
            'Passenger'
        );

        return response()->json(['message' => 'No more drivers available.'], 200);
    }

    /**
     * Complete the ride and handle payment with business logic.
     */
    public function completeRide(Request $request, $id)
    {
        try {
            $ride = Ride::with(['driver', 'passenger'])->where('id', $id)->firstOrFail();

            // Get the authenticated user
            $user = $request->user();

            // Check if user is authorized (either has driver relationship OR is a driver user)
            $isAuthorized = false;
            $driverUserId = null;
            $driverModel = null; // To hold the Driver model instance

            if ($user->driver && $ride->driver_id === $user->driver->id) {
                // User has a separate driver relationship
                $isAuthorized = true;
                $driverUserId = $user->driver->user_id;
                $driverModel = $user->driver;
            } elseif ($user->role === 'driver' && $ride->driver_id === $user->id) {
                // User IS the driver (role='driver')
                $isAuthorized = true;
                $driverUserId = $user->id;
                // If the user is the driver, we need to fetch the Driver model instance
                $driverModel = Driver::where('user_id', $user->id)->first();
            }

            if (!$isAuthorized || !$driverModel) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get payment method from request (default to cash)
            $paymentMethod = $request->input('payment_method', 'cash');
            $isCashPayment = $paymentMethod === 'cash';

            // Business configuration
            // PRODUCTION FARE CALCULATION
            $actualDistance = floatval($request->input('actual_distance', 0));
            $actualDuration = floatval($request->input('actual_duration', 0));
            $waitingMinutes = intval($request->input('waiting_minutes', 0));

            $vt = $ride->vehicleType;
            if ($vt) {
                $base_fare = floatval($vt->base_fare);
                $p_km = floatval($vt->price_per_km);
                $p_min = floatval($vt->price_per_minute);
                $w_fee = floatval($vt->waiting_fee_per_minute);
                $min_fare = floatval($vt->minimum_fare);

                // Calculate fare: Base + (KM * Rate) + (Min * Rate) + (Wait > 5 * Rate)
                $calculatedFare = $base_fare + ($actualDistance * $p_km) + ($actualDuration * $p_min);

                if ($waitingMinutes > 5) {
                    $calculatedFare += ($waitingMinutes - 5) * $w_fee;
                }

                // Apply minimum fare
                if ($calculatedFare < $min_fare) {
                    $calculatedFare = $min_fare;
                }

                $fareAmount = $calculatedFare;
            } else {
                // Fallback: Use fare from request if provided (for dynamic pricing/metered rides), otherwise use initial ride price
                $fareAmount = floatval($request->input('fare', $ride->price));
            }

            // Sync the ride price with the final fare amount
            $ride->price = $fareAmount;
            $ride->save();


            if ($vt) {
                $commissionRate = $vt->commission_percentage / 100;
            }

            $platformCommission = $fareAmount * $commissionRate;
            $driverEarnings = $fareAmount - $platformCommission;

            DB::beginTransaction();
            // Handle payment based on selected payment method
            if ($isCashPayment) {
                // Cash payment - deduct commission from driver's wallet
                $driverWallet = Wallet::firstOrCreate(['user_id' => $driverUserId]);

                if ($driverWallet->balance < $platformCommission) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Driver has insufficient wallet balance to pay platform commission',
                        'required_commission' => $platformCommission,
                        'available_balance' => $driverWallet->balance,
                        'shortfall' => $platformCommission - $driverWallet->balance
                    ], 400);
                }

                // Deduct platform commission from driver's wallet
                $driverWallet->balance -= $platformCommission;
                $driverWallet->save();

                // Create transaction record for commission deduction
                Transaction::create([
                    'wallet_id' => $driverWallet->id,
                    'type' => 'payment',
                    'amount' => -$platformCommission, // Negative amount for deduction
                    'note' => 'Platform commission - Ride #' . $ride->id,
                    'status' => 'approved',
                ]);

                // Create payment record for cash payment
                Payment::create([
                    'ride_id' => $ride->id,
                    'amount' => $fareAmount,
                    'method' => 'cash',
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                Log::info("Cash payment completed: Ride {$ride->id}, Driver {$driverUserId} paid commission: {$platformCommission}");

                // Update ride status and actual data
                $ride->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'cash_payment' => true,
                    'actual_distance' => $actualDistance,
                    'actual_duration' => (int) round($actualDuration),
                    'waiting_minutes' => $waitingMinutes,
                    'calculated_fare' => $fareAmount,
                    'price' => $fareAmount,
                ]);

                // Handle driver status
                if ($ride->isPooled()) {
                    $poolPartner = Ride::where('id', $ride->pool_partner_ride_id)
                        ->where('status', 'in_progress')
                        ->first();
                    $driverModel->status = $poolPartner ? 'on_ride' : 'available';
                } else {
                    $driverModel->status = 'available';
                }
                $driverModel->save();

                DB::commit();

                broadcast(new RideEnded($ride))->toOthers();
                $this->notificationService->notifyUser(
                    $ride->passenger_id,
                    "Ride Completed",
                    "Your ride has been completed. Payment method: Cash.",
                    ['ride_id' => $ride->id],
                    null,
                    'Passenger'
                );
                $this->sendPaymentNotification($ride, $fareAmount, 'cash');

                return response()->json([
                    'message' => 'Ride completed successfully',
                    'ride' => $ride,
                    'payment_method' => 'cash'
                ], 200);
            } else {
                // Wallet payment - Set to pending_payment
                $ride->update([
                    'status' => 'pending_payment',
                    'cash_payment' => false,
                    'actual_distance' => $actualDistance,
                    'actual_duration' => (int) round($actualDuration),
                    'waiting_minutes' => $waitingMinutes,
                    'calculated_fare' => $fareAmount,
                    'price' => $fareAmount,
                ]);

                DB::commit();

                // Notify passenger to approve payment
                $this->notificationService->notifyUser(
                    $ride->passenger_id,
                    "Payment Required",
                    "Your ride is complete. Please authorize the payment of ETB {$fareAmount} from your wallet.",
                    ['ride_id' => $ride->id, 'fare' => $fareAmount, 'status' => 'pending_payment'],
                    null,
                    'Passenger'
                );

                broadcast(new RideEnded($ride))->toOthers();

                return response()->json([
                    'success' => true,
                    'message' => 'Ride completed, waiting for passenger payment approval',
                    'ride' => $ride,
                    'payment_method' => 'wallet',
                    'status' => 'pending_payment'
                ], 200);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Ride completion failed: " . $e->getMessage());
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Passenger confirms and pays for a ride that is in 'pending_payment' status.
     */
    public function confirmWalletPayment(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $ride = Ride::with(['driver', 'passenger', 'vehicleType'])->where('id', $id)->lockForUpdate()->firstOrFail();
            $user = $request->user();

            // Authorization: Only the passenger can confirm payment
            if ($ride->passenger_id !== $user->id) {
                DB::rollBack();
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($ride->status !== 'pending_payment') {
                DB::rollBack();
                return response()->json(['message' => 'Ride is not awaiting wallet payment approval.'], 400);
            }

            // Password verification
            $password = $request->input('password');
            if (!$password || !Hash::check($password, $user->password)) {
                DB::rollBack();
                return response()->json(['message' => 'Invalid wallet password'], 422);
            }

            $fareAmount = $ride->price;
            $commissionRate = 0.15; // default fallback
            if ($ride->vehicleType) {
                $commissionRate = $ride->vehicleType->commission_percentage / 100;
            }
            $platformCommission = $fareAmount * $commissionRate;
            $driverEarnings = $fareAmount - $platformCommission;

            // Wallet deduction logic
            $passengerWallet = Wallet::firstOrCreate(['user_id' => $user->id]);
            $walletFee = $ride->vehicleType ? $ride->vehicleType->wallet_transaction_fixed_fee : 0;
            $totalToDeduct = $fareAmount + $walletFee;

            if ($passengerWallet->balance < $totalToDeduct) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Insufficient wallet balance',
                    'required_amount' => $totalToDeduct,
                    'available_balance' => $passengerWallet->balance
                ], 400);
            }

            // Deduct from passenger
            $passengerWallet->balance -= $totalToDeduct;
            $passengerWallet->save();

            Transaction::create([
                'wallet_id' => $passengerWallet->id,
                'type' => 'payment',
                'amount' => -$fareAmount,
                'note' => 'Ride payment - Ride #' . $ride->id,
                'status' => 'approved',
            ]);

            if ($walletFee > 0) {
                Transaction::create([
                    'wallet_id' => $passengerWallet->id,
                    'type' => 'payment',
                    'amount' => -$walletFee,
                    'note' => 'Wallet transaction fee - Ride #' . $ride->id,
                    'status' => 'approved',
                ]);
            }

            // Credit Driver
            $driver = $ride->driver;
            $driverUserId = $driver->user_id;
            $driverWallet = Wallet::firstOrCreate(['user_id' => $driverUserId]);
            $driverWallet->balance += $driverEarnings;
            $driverWallet->save();

            Transaction::create([
                'wallet_id' => $driverWallet->id,
                'type' => 'payment',
                'amount' => $driverEarnings,
                'note' => 'Ride earnings - Ride #' . $ride->id,
                'status' => 'approved',
            ]);

            // Credit Platform (Admin User ID 1)
            $platformWallet = Wallet::firstOrCreate(['user_id' => 1]);
            $platformWallet->balance += ($platformCommission + $walletFee);
            $platformWallet->save();

            Transaction::create([
                'wallet_id' => $platformWallet->id,
                'type' => 'payment',
                'amount' => $platformCommission,
                'note' => 'Platform commission - Ride #' . $ride->id,
                'status' => 'approved',
            ]);

            if ($walletFee > 0) {
                Transaction::create([
                    'wallet_id' => $platformWallet->id,
                    'type' => 'payment',
                    'amount' => $walletFee,
                    'note' => 'Wallet fee credit - Ride #' . $ride->id,
                    'status' => 'approved',
                ]);
            }

            // Finalize Payment and Ride record
            Payment::create([
                'ride_id' => $ride->id,
                'amount' => $fareAmount,
                'method' => 'wallet',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $ride->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Handle Driver status (same logic as cash)
            $driverModel = $ride->driver;
            if ($ride->isPooled()) {
                $poolPartner = Ride::where('id', $ride->pool_partner_ride_id)
                    ->where('status', 'in_progress')
                    ->first();
                $driverModel->status = $poolPartner ? 'on_ride' : 'available';
            } else {
                $driverModel->status = 'available';
            }
            $driverModel->save();

            DB::commit();

            // Broadcast events and notify driver
            broadcast(new RideEnded($ride))->toOthers();

            $this->notificationService->notifyUser(
                $driverUserId,
                "Payment Received",
                "Passenger has authorized payment of ETB {$fareAmount}. Your earnings: ETB {$driverEarnings}.",
                ['ride_id' => $ride->id, 'earnings' => $driverEarnings],
                null,
                'Driver'
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment authorized and ride completed',
                'ride' => $ride
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Wallet confirmation failed: " . $e->getMessage());
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Driver starts the ride.
     */
    public function startRide($id, Request $request)
    {
        $ride = Ride::where('id', $id)
            ->whereIn('status', ['accepted', 'arrived'])
            ->firstOrFail();
        $driver = $request->user()->driver;
        if (!$driver || $ride->driver_id !== $driver->id) return response()->json(['message' => 'Unauthorized'], 403);

        $ride->status = 'in_progress';
        $ride->started_at = now();
        $ride->save();

        broadcast(new RideStarted($ride))->toOthers();

        return response()->json(['message' => 'Ride started', 'ride' => $ride], 200);
    }



    /**
     * Cancel a ride (by passenger or driver).
     */
    public function cancelRide($id, Request $request)
    {
        $ride = Ride::findOrFail($id);
        $user = $request->user();

        $isPassenger = $ride->passenger_id === $user->id;
        $isDriver = $user->driver && ($ride->driver_id === $user->driver->id);

        if (!$isPassenger && !$isDriver) return response()->json(['message' => 'Unauthorized'], 403);
        if (in_array($ride->status, ['completed', 'cancelled'])) return response()->json(['message' => 'Ride already finished'], 409);

        $ride->status = 'cancelled';
        $ride->cancelled_at = now();
        $ride->cancelled_by = $isPassenger ? 'passenger' : 'driver';
        $ride->save();

        // Improved Driver Status Reset: Handle passenger cancellation and pooled rides
        if ($ride->driver_id) {
            $driverModel = $ride->driver;

            // Check if driver is still on another active ride (pooling)
            $isStillOnAnotherRide = false;
            if ($ride->isPooled()) {
                $isStillOnAnotherRide = Ride::where('driver_id', $ride->driver_id)
                    ->where('id', '!=', $ride->id)
                    ->whereIn('status', ['accepted', 'arrived', 'in_progress'])
                    ->exists();
            }

            if (!$isStillOnAnotherRide) {
                $driverModel->status = 'available';
                $driverModel->save();
            }
        }

        // Customizable notification messages
        $passengerBody = $isPassenger ? "You have cancelled your ride." : "Your driver has cancelled the ride. We apologize for the inconvenience.";
        $driverBody = $isDriver ? "You have cancelled the ride." : "The passenger has cancelled the ride.";

        // Notify passenger
        $this->notificationService->notifyUser(
            $ride->passenger_id,
            "Ride Cancelled",
            $passengerBody,
            ['ride_id' => $ride->id, 'cancelled_by' => $isPassenger ? 'passenger' : 'driver'],
            new RideCancelled($ride),
            'Passenger'
        );

        if ($ride->driver_id) {
            // Notify driver
            $this->notificationService->notifyUser(
                $ride->driver->user_id,
                "Ride Cancelled",
                $driverBody,
                ['ride_id' => $ride->id, 'cancelled_by' => $isPassenger ? 'passenger' : 'driver'],
                null,
                'Driver'
            );
        }

        broadcast(new RideStatusChanged($ride));

        return response()->json(['message' => 'Ride cancelled', 'ride' => $ride], 200);
    }

    /**
     * Get ride history for current user.
     */
    public function history(Request $request)
    {
        $user = $request->user();
        $rides = $user->role === 'driver'
            ? $user->driver->rides()->latest()->get()
            : $user->rides()->latest()->get();
        return response()->json($rides);
    }

    /**
     * Rate a ride (driver or passenger).
     */
    public function rate($id, Request $request)
    {
        $ride = Ride::findOrFail($id);
        $user = $request->user();
        $request->validate([
            'score' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:255',
        ]);
        if ($ride->status !== 'completed') {
            return response()->json(['message' => 'Cannot rate an incomplete ride'], 400);
        }
        $toUserId = $user->id === $ride->passenger_id
            ? optional($ride->driver)->user_id
            : $ride->passenger_id;
        if (!$toUserId) {
            return response()->json(['message' => 'No user to rate'], 400);
        }
        Rating::create([
            'ride_id' => $ride->id,
            'from_user_id' => $user->id,
            'to_user_id' => $toUserId,
            'score' => $request->score,
            'comment' => $request->comment,
        ]);
        return response()->json([
            'message' => 'Rating submitted successfully',
            'rating' => [
                'score' => $request->score,
                'comment' => $request->comment,
                'ride_id' => $ride->id,
                'rated_at' => now()
            ]
        ]);
    }

    /**
     * Get detailed rating statistics for a driver
     */
    public function getDriverRatingStats($driverId, Request $request)
    {
        $driver = Driver::where('user_id', $driverId)->first();

        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $ratings = Rating::where('to_user_id', $driverId)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($ratings->count() === 0) {
            return response()->json([
                'driver_id' => $driverId,
                'average_rating' => 5.00,
                'total_ratings' => 0,
                'rating_breakdown' => [
                    5 => ['count' => 0, 'percentage' => 0],
                    4 => ['count' => 0, 'percentage' => 0],
                    3 => ['count' => 0, 'percentage' => 0],
                    2 => ['count' => 0, 'percentage' => 0],
                    1 => ['count' => 0, 'percentage' => 0]
                ],
                'recent_ratings' => [],
                'trend' => 'stable'
            ]);
        }

        // Calculate statistics
        $totalCount = $ratings->count();
        $average = round($ratings->avg('score'), 2);

        // Rating breakdown
        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        foreach ($ratings as $rating) {
            $breakdown[$rating->score]++;
        }

        $breakdownPercentages = [];
        foreach ($breakdown as $star => $count) {
            $breakdownPercentages[$star] = [
                'count' => $count,
                'percentage' => round(($count / $totalCount) * 100, 1)
            ];
        }

        // Recent ratings (last 10)
        $recentRatings = $ratings->take(10)->map(function ($rating) {
            return [
                'score' => $rating->score,
                'comment' => $rating->comment,
                'rated_at' => $rating->created_at,
                'ride_id' => $rating->ride_id
            ];
        });

        // Calculate trend
        $recentAverage = $ratings->take(5)->avg('score');
        $previousAverage = $ratings->skip(5)->take(5)->avg('score');
        $trend = $recentAverage > $previousAverage ? 'improving' : ($recentAverage < $previousAverage ? 'declining' : 'stable');

        return response()->json([
            'driver_id' => $driverId,
            'average_rating' => $average,
            'total_ratings' => $totalCount,
            'rating_breakdown' => $breakdownPercentages,
            'recent_ratings' => $recentRatings,
            'trend' => $trend,
            'last_updated' => $driver->updated_at
        ]);
    }

    /**
     * Passenger pays for the ride upfront using wallet balance.
     */
    public function payUpfront($id, Request $request)
    {
        try {
            DB::beginTransaction();

            $ride = Ride::where('id', $id)->lockForUpdate()->firstOrFail();
            $user = $request->user();

            // Authorization check
            if ($ride->passenger_id !== $user->id) {
                DB::rollBack();
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Check if already paid
            if ($ride->prepaid || $ride->status === 'completed') {
                DB::rollBack();
                return response()->json(['message' => 'Ride already paid or completed'], 400);
            }

            $wallet = $user->wallet;
            if (!$wallet || $wallet->balance < $ride->price) {
                DB::rollBack();
                return response()->json(['message' => 'Insufficient wallet balance'], 400);
            }

            // Deduct from passenger's wallet
            $wallet->decrement('balance', $ride->price);

            // Create transaction record
            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'payment',
                'amount' => -$ride->price,
                'note' => 'Upfront payment - Ride #' . $ride->id,
                'status' => 'approved',
            ]);

            // Create payment record
            Payment::create([
                'ride_id' => $ride->id,
                'amount' => $ride->price,
                'method' => 'wallet',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Update ride status
            $ride->update([
                'prepaid' => true,
                'cash_payment' => false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment successful',
                'ride' => $ride
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Upfront payment failed: " . $e->getMessage());
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get ride details for a specific ride.
     */
    public function getRideDetails($id, Request $request)
    {
        $user = $request->user();
        $ride = Ride::with(['passenger', 'driver'])->findOrFail($id);

        // Check if user is authorized to view this ride
        $isPassenger = $ride->passenger_id === $user->id;
        // Check if user is the driver
        $isDriver = ($user->driver && $ride->driver_id === $user->driver->id) ||
            ($user->role === 'driver' && $ride->driver_id === $user->id);

        if (!$isPassenger && !$isDriver) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $this->formatRideResponse($ride);
    }

    /**
     * Internal helper to format ride response consistently for the app
     */
    private function formatRideResponse(Ride $ride)
    {
        $data = [
            'ride_id' => (string)$ride->id,
            'passenger_name' => $ride->passenger ? $ride->passenger->name : 'Unknown Passenger',
            'passenger_phone' => $ride->passenger ? $ride->passenger->phone : '',
            'pickup_address' => $ride->pickup_address,
            'destination_address' => $ride->destination_address,
            'eta_min' => 5, // Simplified
            'price' => (float)$ride->price,
            'status' => $ride->status,
            'origin_lat' => (float)$ride->origin_lat,
            'origin_lng' => (float)$ride->origin_lng,
            'destination_lat' => (float)$ride->destination_lat,
            'destination_lng' => (float)$ride->destination_lng,
            'base_fare' => $ride->vehicleType ? (float)$ride->vehicleType->base_fare : 140.0,
            'price_per_km' => $ride->vehicleType ? (float)$ride->vehicleType->price_per_km : 25.0,
            'price_per_min' => $ride->vehicleType ? (float)$ride->vehicleType->price_per_minute : 5.0,
            'waiting_fee_per_min' => $ride->vehicleType ? (float)$ride->vehicleType->waiting_fee_per_minute : 5.0,
            'started_at' => $ride->started_at,
            'arrived_at' => $ride->arrived_at,
        ];

        if ($ride->driver) {
            $driverName = $ride->driver->user ? $ride->driver->user->name : 'Unknown Driver';
            $driverPhone = $ride->driver->user ? $ride->driver->user->phone : '';
            $plateNumber = $ride->driver->plate_number ?? ($ride->driver->vehicle ? $ride->driver->vehicle->plate_number : '');
            $vehicleMake = $ride->driver->vehicle ? $ride->driver->vehicle->make : 'Unknown';
            $vehicleModel = $ride->driver->model ?? ($ride->driver->vehicle ? $ride->driver->vehicle->model : '');
            $vehicleColor = $ride->driver->color ?? ($ride->driver->vehicle ? $ride->driver->vehicle->color : '');
            $driverProfile = $ride->driver->profile_picture_path ?? '';

            // Snake case for backward compatibility or other uses
            $data['driver_id'] = $ride->driver->id;
            $data['driver_name'] = $driverName;
            $data['driver_phone'] = $driverPhone;
            $data['plate_number'] = $plateNumber;
            $data['vehicle_model'] = $vehicleModel;
            $data['vehicle_color'] = $vehicleColor;
            $data['driver_rating'] = (float)$ride->driver->rating;
            $data['driver_profile_picture'] = $driverProfile;

            // Camel case for DriverAcceptedBottomSheet compatibility
            $data['driverName'] = $driverName;
            $data['driverPhone'] = $driverPhone;
            $data['plateNumber'] = $plateNumber;
            $data['vehicleMake'] = $vehicleMake;
            $data['vehicleModel'] = $vehicleModel;
            $data['vehicleColor'] = $vehicleColor;
            $data['driverProfile'] = $driverProfile;
        }

        return response()->json($data);
    }

    public function getActiveRide(Request $request)
    {
        $user = $request->user();
        $ride = null;

        if ($user->driver) {
            $ride = Ride::with(['passenger', 'driver.user', 'driver.vehicle'])
                ->where('driver_id', $user->driver->id)
                ->whereIn('status', ['accepted', 'arrived', 'in_progress'])
                ->latest()
                ->first();
        } else {
            $ride = Ride::with(['passenger', 'driver.user', 'driver.vehicle'])
                ->where('passenger_id', $user->id)
                ->whereIn('status', ['requested', 'accepted', 'arrived', 'in_progress'])
                ->latest()
                ->first();
        }

        if (!$ride) {
            return response()->json(['message' => 'No active ride'], 404);
        }

        return $this->formatRideResponse($ride);
    }

    /**
     * Update ride status.
     */
    public function updateStatus($id, Request $request)
    {
        $ride = Ride::findOrFail($id);
        $status = $request->input('status');

        $ride->status = $status;
        if ($status === 'arrived') {
            $ride->arrived_at = now();
        }
        $ride->save();

        if ($status === 'arrived') {
            broadcast(new DriverArrived($ride))->toOthers();

            // Notify passenger via FCM
            $this->notificationService->notifyUser(
                $ride->passenger_id,
                "Driver Arrived",
                "Your driver has arrived at the pickup location.",
                ['ride_id' => $ride->id, 'status' => 'arrived'],
                null,
                'Passenger'
            );
        }

        broadcast(new RideStatusChanged($ride))->toOthers();

        return response()->json(['message' => 'Ride status updated', 'ride' => $ride]);
    }

    /**
     * Driver starts a straight hail (street pickup) ride.
     */
    public function straightHail(Request $request)
    {
        $driver = $request->user()->driver;
        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        // Prevent starting a ride if already on one
        if (Ride::where('driver_id', $driver->id)->whereIn('status', ['on_ride'])->exists()) {
            return response()->json(['message' => 'You already have an active ride'], 409);
        }

        $validated = $request->validate([
            'originLat'    => 'required|numeric|between:-90,90',
            'originLng'    => 'required|numeric|between:-180,180',
            'destLat'      => 'required|numeric|between:-90,90',
            'destLng'      => 'required|numeric|between:-180,180',
            'pickupAddress' => 'nullable|string',
            'destinationAddress' => 'nullable|string',
            'passenger_wid' => 'nullable|string', // Phone number for straight hail
            'passenger_id'  => 'nullable|exists:users,id',
            'cash_payment' => 'boolean',
        ]);

        $vehicleTypeId = $request->input('vehicle_type_id', 1); // default to first type
        $vehicleType = VehicleType::find($vehicleTypeId) ?? VehicleType::first();

        // Calculate fare
        $fare = $this->calculateFare(
            $validated['originLat'],
            $validated['originLng'],
            $validated['destLat'],
            $validated['destLng'],
            $vehicleType
        );

        // Get addresses using reverse geocoding if not provided
        $geocodingService = new GeocodingService();
        $pickupAddress = $validated['pickupAddress'] ?? $geocodingService->reverseGeocode($validated['originLat'], $validated['originLng']);
        $destinationAddress = $validated['destinationAddress'] ?? $geocodingService->reverseGeocode($validated['destLat'], $validated['destLng']);

        // Default cash_payment to true if not provided
        $cashPayment = $validated['cash_payment'] ?? true;

        DB::beginTransaction();
        try {
            // Business configuration
            $fareAmount = floatval($fare);
            $commissionRate = $vehicleType->commission_percentage / 100;
            $platformCommission = $fareAmount * $commissionRate;
            $driverEarnings = $fareAmount - $platformCommission;

            // Create or find passenger for straight hail
            $passengerId = $validated['passenger_id'] ?? null;
            if (!$passengerId) {
                $phone = $validated['passenger_wid'] ?? 'Unknown';
                // Try to find existing user by phone
                $passenger = User::where('phone', $phone)->first();

                if (!$passenger) {
                    // For straight hail rides, create a temporary passenger record
                    $passenger = User::create([
                        'name' => 'Straight Hail Passenger',
                        'phone' => $phone,
                        'role' => 'passenger',
                        'is_active' => true,
                        'password' => bcrypt('temp_password_' . time()), // Temporary password
                        'email' => 'temp_' . time() . '@straighthail.com', // Temporary email
                    ]);
                }
                $passengerId = $passenger->id;
            }

            $prepaid = !$cashPayment; // true if wallet payment

            // Create ride record FIRST so we have the ID for transactions
            $ride = Ride::create([
                'passenger_id'    => $passengerId,
                'driver_id'       => $driver->id,
                'origin_lat'      => $validated['originLat'],
                'origin_lng'      => $validated['originLng'],
                'destination_lat' => $validated['destLat'],
                'destination_lng' => $validated['destLng'],
                'pickup_address'  => $pickupAddress,
                'destination_address' => $destinationAddress,
                'price'           => $fare,
                'status'          => 'in_progress',
                'started_at'      => now(),
                'is_straight_hail' => true,
                'cash_payment'    => $cashPayment,
                'prepaid'         => $prepaid,
                'vehicle_type_id' => $vehicleType->id,
            ]);

            // Handle wallet payment
            if (
                isset($validated['passenger_id']) &&
                !$cashPayment
            ) {
                $passengerWallet = Wallet::firstOrCreate(['user_id' => $validated['passenger_id']]);

                if ($passengerWallet->balance < $fareAmount) {
                    DB::rollBack();
                    return response()->json(['message' => 'Insufficient wallet balance'], 400);
                }

                // Deduct fare from passenger's wallet
                $passengerWallet->balance -= $fareAmount;
                $passengerWallet->save();

                // Add driver earnings to driver's wallet
                $driverWallet = Wallet::firstOrCreate(['user_id' => $driver->user_id]);
                $driverWallet->balance += $driverEarnings;
                $driverWallet->save();

                // Create transaction record for driver earnings
                Transaction::create([
                    'wallet_id' => $driverWallet->id,
                    'type' => 'payment',
                    'amount' => $driverEarnings,
                    'note' => 'Straight hail payment - Ride #' . $ride->id,
                    'status' => 'approved',
                ]);

                // Add platform commission to platform wallet (assuming platform has user_id = 1)
                $platformWallet = Wallet::firstOrCreate(['user_id' => 1]);
                $platformWallet->balance += $platformCommission;
                $platformWallet->save();

                Log::info("Straight hail wallet payment completed: Passenger paid: {$fareAmount}, Driver earned: {$driverEarnings}, Platform commission: {$platformCommission}");

                $prepaid = true; // mark as already paid
            } else {
                // Cash payment - deduct commission from driver's wallet
                $driverWallet = Wallet::firstOrCreate(['user_id' => $driver->user_id]);

                if ($driverWallet->balance < $platformCommission) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Driver has insufficient wallet balance to pay platform commission',
                        'required_commission' => $platformCommission,
                        'available_balance' => $driverWallet->balance,
                        'shortfall' => $platformCommission - $driverWallet->balance
                    ], 400);
                }

                // Deduct platform commission from driver's wallet
                $driverWallet->balance -= $platformCommission;
                $driverWallet->save();

                Log::info("Straight hail cash payment: Driver {$driver->user_id} paid commission: {$platformCommission}");
            }

            // Update driver status
            $driver->status = 'on_ride';
            $driver->save();

            // Create payment record for straight hail
            Payment::create([
                'ride_id' => $ride->id,
                'amount' => $fareAmount,
                'method' => $cashPayment ? 'cash' : 'wallet',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            DB::commit();

            broadcast(new RideStatusChanged($ride))->toOthers();

            return response()->json([
                'message' => 'Straight hail ride started',
                'ride'    => $ride,
                'fare_amount' => $fareAmount,
                'driver_earnings' => $driverEarnings,
                'platform_commission' => $platformCommission,
                'commission_rate' => $commissionRate,
                'payment_method' => $cashPayment ? 'cash' : 'wallet'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            if (app()->environment('testing')) {
                dd($e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            }
            Log::error("Ride creation failed: " . $e->getMessage());
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }



    /**
     * Fare calculation based on distance and vehicle type.
     */
    private function calculateFare($lat1, $lng1, $lat2, $lng2, $vehicleType = null)
    {
        if (!$vehicleType) {
            $vehicleType = VehicleType::where('name', 'economy')->first() ?? VehicleType::first();
        }

        if (!$vehicleType) {
            // Fallback to hardcoded values if DB is empty
            $baseFare = 140;
            $perKmRate = 25;
            $distance = $this->calculateDistance($lat1, $lng1, $lat2, $lng2);
            return round($baseFare + ($perKmRate * $distance), 2);
        }

        $distance = $this->calculateDistance($lat1, $lng1, $lat2, $lng2);

        // Use an average speed (e.g., 25 km/h) to estimate duration in minutes
        $estimatedDuration = ($distance / 25) * 60;

        // More realistic fare calculation: base + (rate_km * dist) + (rate_min * duration)
        $fare = $vehicleType->base_fare
            + ($vehicleType->price_per_km * $distance)
            + ($vehicleType->price_per_minute * $estimatedDuration);

        // Ensure minimum fare
        return round(max($fare, $vehicleType->minimum_fare), 2);
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

    /**
     * Send ride request notification to nearby drivers
     */
    private function sendRideRequestNotification($ride)
    {
        try {
            $passenger = $ride->passenger;
            $radiusKm = 20; // 20km radius

            // Find nearby drivers by joining with locations table
            $nearbyDrivers = Driver::selectRaw("
                drivers.*,
                (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) AS distance
            ", [$ride->origin_lat, $ride->origin_lng, $ride->origin_lat])
                ->join('locations', 'drivers.id', '=', 'locations.driver_id')
                ->join('vehicles', 'drivers.id', '=', 'vehicles.driver_id')
                ->whereRaw("(6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) <= ?", [$ride->origin_lat, $ride->origin_lng, $ride->origin_lat, $radiusKm])
                ->whereIn('drivers.status', ['online', 'available'])
                ->where('vehicles.vehicle_type_id', $ride->vehicle_type_id)
                ->orderByRaw("distance ASC")
                ->limit(20)
                ->whereIn('drivers.status', ['online', 'available'])
                ->orderByRaw("(6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude))))", [$ride->origin_lat, $ride->origin_lng, $ride->origin_lat])
                ->limit(20)
                ->get();

            if ($nearbyDrivers->isEmpty()) {
                Log::info("No nearby drivers found for ride request {$ride->id}");
                return;
            }

            $driverIds = $nearbyDrivers->pluck('id')->toArray();
            $userIds = $nearbyDrivers->pluck('user_id')->toArray();

            // Prepare ride request data
            $rideRequestData = [
                'ride_id' => $ride->id,
                'pickup_lat' => $ride->origin_lat,
                'pickup_lng' => $ride->origin_lng,
                'destination_lat' => $ride->destination_lat,
                'destination_lng' => $ride->destination_lng,
                'pickup_address' => $ride->pickup_address,
                'destination_address' => $ride->destination_address,
                'passenger_name' => $passenger->name,
                'passenger_phone' => $passenger->phone ?? '',
                'fare' => $ride->price,
                'timestamp' => now()->toISOString()
            ];

            // Use Unified Notification Service (Reverb + FCM)
            $this->notificationService->notifyUsers(
                $userIds,
                "New Ride Request",
                "New ride request from {$passenger->name} near {$ride->pickup_address}",
                $rideRequestData,
                new NewRideRequested($ride),
                'Driver'
            );

            Log::info("Ride request hybrid notification sent to {$nearbyDrivers->count()} nearby drivers", [
                'ride_id' => $ride->id,
                'passenger_name' => $passenger->name,
                'fare' => $ride->price,
                'nearby_drivers_count' => $nearbyDrivers->count(),
                'radius_km' => $radiusKm,
                'driver_ids' => $driverIds
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send ride request notification: " . $e->getMessage());
        }
    }


    /**
     * Send payment notification to driver
     */
    private function sendPaymentNotification($ride, $amount, $paymentMethod)
    {
        try {
            $driver = $ride->driver;
            $passenger = $ride->passenger;

            // Prepare payment notification data
            $paymentData = [
                'ride_id' => $ride->id,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'passenger_name' => $passenger->name,
                'timestamp' => now()->toISOString()
            ];

            // Send via Unified Notification Service (Reverb + FCM)
            $this->notificationService->notifyUser(
                $driver->user_id,
                "Payment Received",
                "You received " . number_format($amount, 2) . " ETB for ride #{$ride->id}",
                $paymentData,
                new PaymentCompleted($paymentData, $driver->user_id),
                'Driver'
            );

            Log::info("Payment notification sent to driver {$driver->id}: {$amount}", [
                'driver_id' => $driver->id,
                'ride_id' => $ride->id,
                'amount' => $amount,
                'payment_method' => $paymentMethod
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send payment notification: " . $e->getMessage());
        }
    }
}
