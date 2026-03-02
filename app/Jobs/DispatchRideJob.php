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
use App\Events\RideAccepted;

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
        protected int $radiusIndex = 0,
        protected array $notifiedDriverIds = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(UnifiedNotificationService $notificationService): void
    {
        $radii = [5, 10, 20, 50]; // progressive radii in km

        // If we have exhausted all radii OR if the ride is no longer searching, it's time to stop
        if ($this->radiusIndex >= count($radii) || !in_array($this->ride->status, ['requested', 'searching'])) {
            if ($this->radiusIndex >= count($radii) && in_array($this->ride->status, ['requested', 'searching'])) {
                Log::info("DispatchRideJob FINISHED: Ride: {$this->ride->id}, No driver found after max radius");
                $this->noDriverFound($notificationService);
            }
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

        $excludedDrivers = array_merge(
            $this->ride->rejected_driver_ids ?: [],
            $this->notifiedDriverIds
        );
        if ($this->ride->notified_driver_id) {
            $excludedDrivers[] = $this->ride->notified_driver_id;
        }
        $excludedDrivers = array_filter(array_unique($excludedDrivers));

        $query = Driver::select('drivers.*', 'locations.latitude', 'locations.longitude')
            ->join('locations', 'drivers.id', '=', 'locations.driver_id')
            ->join('vehicles', 'drivers.id', '=', 'vehicles.driver_id')
            ->join('wallets', 'drivers.user_id', '=', 'wallets.user_id')
            ->where('drivers.status', 'available')
            ->where('drivers.approval_state', 'approved')
            ->where('vehicles.vehicle_type_id', $this->ride->vehicle_type_id)
            ->where('wallets.balance', '>=', $min_balance);

        if (!empty($excludedDrivers)) {
            $query->whereNotIn('drivers.id', $excludedDrivers);
        }

        $results = $query->selectRaw("
                (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) AS distance
            ", [$this->ride->origin_lat, $this->ride->origin_lng, $this->ride->origin_lat])
            ->whereRaw("
                (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) <= ?
            ", [$this->ride->origin_lat, $this->ride->origin_lng, $this->ride->origin_lat, $currentRadius])
            ->orderBy('distance', 'asc')
            ->limit(1)
            ->get();

        Log::info("DispatchRideJob SQL RESULT COUNT: " . count($results));

        if (!empty($results)) {
            $nearestDriverId = $results[0]->id;


            // if ($this->ride->rejected_driver_ids && in_array($results[0]->id, $this->ride->rejected_driver_ids)) {
            //     Log::info("DispatchRideJob: Driver {$results[0]->id} rejected previously, skipping.");
            // }



            // $driverWallet = Wallet::where('user_id', $results[0]->user_id)->first();
            // if ($driverWallet && $driverWallet->balance >= $min_balance) {
            //     $validDriverUserIds[] = $results[0]->user_id;
            //     if ($nearestDriverId === null) {
            //         $nearestDriverId = $results[0]->id;
            //     }
            // }


            Log::info("DispatchRideJob VALID DRIVERS IDs: " . $nearestDriverId);

            // if (!empty($validDriverUserIds)) {
            //     $this->notifyDrivers($validDriverUserIds, $notificationService);

            //     // Track the primary notified driver for Admin visibility
            //     $this->ride->update([
            //         'notified_driver_id' => $nearestDriverId,
            //         'notified_drivers_count' => count($validDriverUserIds)
            //     ]);
            //     broadcast(new RideStatusChanged($this->ride));

            //     $found = true;
            // }


            // Track the notified driver
            $this->ride->update([
                'notified_driver_id' => $nearestDriverId,
                'notified_drivers_count' => 1
            ]);

            // Load relationships needed for the broadcast payload
            $this->ride->refresh();
            $this->ride->load('passenger');

            // Broadcast the ride request to the driver via WebSocket
            broadcast(new NewRideRequested($this->ride));
            Log::info("DispatchRideJob: Broadcast sent to driver {$nearestDriverId} for Ride {$this->ride->id}.");

            // Add current driver to our tracking list
            $this->notifiedDriverIds[] = $nearestDriverId;

            // Instead of blocking sleep(20), we dispatch the NEXT check with a delay.
            // This makes the job non-blocking for the queue worker.
            Log::info("DispatchRideJob: Re-dispatching acceptance check in 20s. Notified: " . implode(',', $this->notifiedDriverIds));
            self::dispatch($this->ride, $this->radiusIndex, $this->notifiedDriverIds)->delay(now()->addSeconds(20));
            return;
        }

        // If no driver found in current radius, expand to next radius after a short delay
        $nextIndex = $this->radiusIndex + 1;
        $delay = 5;

        Log::info("DispatchRideJob NEXT: Ride: {$this->ride->id}, No driver in {$currentRadius}km. NextIndex: {$nextIndex} in {$delay}s");
        self::dispatch($this->ride, $nextIndex, $this->notifiedDriverIds)->delay(now()->addSeconds($delay));
    }

    /**
     * Notify multiple drivers about the request
     */
    protected function notifyDrivers(array $driverUserIds, UnifiedNotificationService $notificationService): void
    {
        $this->ride->refresh();

        // Notify all valid drivers

        broadcast(new NewRideRequested($this->ride));

        $notificationService->notifyUsers(
            $driverUserIds,
            "New Ride Request",
            "A new ride request is available near you.",
            [
                'ride_id' => $this->ride->id,
                'pickup_address' => $this->ride->pickup_address,
                'fare' => $this->ride->price
            ],
            null,
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
