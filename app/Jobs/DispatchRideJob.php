<?php

namespace App\Jobs;

use App\Events\NewRideRequested;
use App\Events\RideResponse;
use App\Events\RideStatusChanged;
use App\Models\Driver;
use App\Models\Wallet;
use App\Models\Ride;
use App\Services\UnifiedNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DispatchRideJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Ride $ride,
        protected int $radiusIndex = 0
    ) {}

    /**
     * Execute the job.
     */
    public function handle(UnifiedNotificationService $notificationService): void
    {
        $this->ride->refresh();
        if (!in_array($this->ride->status, ['requested', 'searching'])) {
            Log::info("DispatchRideJob aborted: Ride {$this->ride->id} is in status '{$this->ride->status}'");
            return;
        }

        $radii = [5, 10, 20, 50]; // progressive radii in km

        // If we have exhausted all radii, it's time to stop
        if ($this->radiusIndex >= count($radii)) {
            Log::info("DispatchRideJob FINISHED: Ride: {$this->ride->id}, No driver found after max radius");
            $this->noDriverFound($notificationService);
            return;
        }

        if ($this->ride->status === 'requested') {
            $this->ride->update(['status' => 'searching']);
            broadcast(new RideStatusChanged($this->ride));
        }

        $currentRadius = $radii[$this->radiusIndex];
        $found = false;

        Log::info("DispatchRideJob START: Ride: {$this->ride->id}, RadiusIndex: {$this->radiusIndex} ({$currentRadius}km)");

        $vehicleType = $this->ride->vehicleType;
        $platformCommissionRate = $vehicleType ? (floatval($vehicleType->commission_percentage) / 100) : 0.15;

        // Add 20% contingency to the estimated commission
        $min_balance = floatval($this->ride->price) * $platformCommissionRate * 1.2;

        Log::info("DispatchRideJob SEARCHING: Ride: {$this->ride->id}, Radius: {$currentRadius}km, MinBalance: {$min_balance}, VehicleType: {$this->ride->vehicle_type_id}");

        $results = DB::select("
                SELECT drivers.*, locations.latitude, locations.longitude,
                    (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                    cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                    sin(radians(locations.latitude)))) AS distance
                FROM drivers
                INNER JOIN locations ON drivers.id = locations.driver_id
                INNER JOIN vehicles ON drivers.id = vehicles.driver_id
                INNER JOIN wallets ON drivers.user_id = wallets.user_id
                WHERE drivers.status = 'available'
                    AND drivers.approval_state = 'approved'
                    AND vehicles.vehicle_type_id = ?
                    AND wallets.balance >= ?
                    AND (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                        cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                        sin(radians(locations.latitude)))) <= ?
                ORDER BY distance ASC
                LIMIT 50
            ", [
            $this->ride->origin_lat,
            $this->ride->origin_lng,
            $this->ride->origin_lat,
            $this->ride->vehicle_type_id,
            $min_balance,
            $this->ride->origin_lat,
            $this->ride->origin_lng,
            $this->ride->origin_lat,
            $currentRadius
        ]);

        Log::info("DispatchRideJob SQL RESULT COUNT: " . count($results));

        if (!empty($results)) {
            $validDriverUserIds = [];
            $nearestDriverId = null;

            foreach ($results as $result) {
                if ($this->ride->rejected_driver_ids && in_array($result->id, $this->ride->rejected_driver_ids)) {
                    Log::info("DispatchRideJob: Driver {$result->id} rejected previously, skipping.");
                    continue;
                }

                $driverWallet = Wallet::where('user_id', $result->user_id)->first();
                if ($driverWallet && $driverWallet->balance >= $min_balance) {
                    $validDriverUserIds[] = $result->user_id;
                    if ($nearestDriverId === null) {
                        $nearestDriverId = $result->id;
                    }
                }
            }

            Log::info("DispatchRideJob VALID DRIVERS COUNT: " . count($validDriverUserIds));

            if (!empty($validDriverUserIds)) {
                $this->notifyDrivers($validDriverUserIds, $notificationService);

                // Track the primary notified driver for Admin visibility
                $this->ride->update([
                    'notified_driver_id' => $nearestDriverId,
                    'notified_drivers_count' => count($validDriverUserIds)
                ]);
                broadcast(new RideStatusChanged($this->ride));

                $found = true;
            }
        }

        // Schedule the next heartbeat/expansion
        $nextIndex = $this->radiusIndex + 1;
        $delay = $found ? 25 : 10; // If someone was notified, wait longer for them to respond

        Log::info("DispatchRideJob NEXT: Ride: {$this->ride->id}, Found: " . ($found ? "Yes" : "No") . ", NextIndex: {$nextIndex} in {$delay}s");
        self::dispatch($this->ride, $nextIndex)->delay(now()->addSeconds($delay));
    }

    /**
     * Notify multiple drivers about the request
     */
    protected function notifyDrivers(array $driverUserIds, UnifiedNotificationService $notificationService): void
    {
        $this->ride->refresh();

        // Notify all valid drivers
        $notificationService->notifyUsers(
            $driverUserIds,
            "New Ride Request",
            "A new ride request is available near you.",
            [
                'ride_id' => $this->ride->id,
                'pickup_address' => $this->ride->pickup_address,
                'fare' => $this->ride->price
            ],
            new NewRideRequested($this->ride),
            'Driver'
        );

        Log::info("Ride Request broadcast to " . count($driverUserIds) . " drivers for Ride: {$this->ride->id}");
    }

    /**
     * Handle no driver found
     */
    protected function noDriverFound(UnifiedNotificationService $notificationService): void
    {
        $this->ride->refresh();
        $this->ride->update(['status' => 'no_driver_found']);
        broadcast(new RideStatusChanged($this->ride));

        $notificationService->notifyUser(
            $this->ride->passenger_id,
            "No Driver Found",
            "No available drivers found in your area. Please try again later.",
            [
                'status' => 'failed',
                'message' => "No available drivers found in your area. Please try again later."
            ],
            new RideResponse(
                $this->ride->passenger_id,
                "failed",
                "No available drivers found in your area. Please try again later.",
                null,
                null
            ),
            'Passenger'
        );

        Log::info("No drivers found for Ride: {$this->ride->id}");
    }
}
