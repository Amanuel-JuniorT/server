<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use App\Models\CompanyGroupRideInstance;

class CompanyDriverArrived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;
    public $driverData;

    /**
     * Create a new event instance.
     */
    public function __construct(CompanyGroupRideInstance $ride)
    {
        $this->ride = $ride;
        // Pre-load relationships if not already loaded, but usually passed loaded
        // Format driver data similar to other events if needed by frontend
        $driver = $ride->driver;

        $this->driverData = [
            'driver_name' => $driver->user->name ?? 'Unknown Driver',
            'driver_phone' => $driver->user->phone ?? 'N/A',
            'plate_number' => $driver->vehicle->plate_number ?? 'N/A',
            'vehicle_model' => $driver->vehicle->model ?? 'Unknown',
            // Add other fields as necessary
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to the employee (passenger)
        return [
            new PrivateChannel('passenger.' . $this->ride->employee_id),
        ];
    }

    public function broadcastAs()
    {
        return 'company.driver.arrived';
    }

    public function broadcastWith()
    {
        return [
            'ride' => $this->ride,
            'driver' => $this->driverData,
            'message' => 'Your driver has arrived'
        ];
    }
}
