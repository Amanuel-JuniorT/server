<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationChange implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $driver;
    public $latitude;
    public $longitude;
    public $encodedPolyline;

    /**
     * Create a new event instance.
     */
    public function __construct($driver, $latitude, $longitude, $encodedPolyline = null)
    {
        $this->driver = $driver;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->encodedPolyline = $encodedPolyline;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Create a mesh/grid system to group drivers by location
        // 0.1 degree is roughly 11km
        // Passengers should subscribe to their current mesh channel and immediate neighbors
        $lat_mesh = floor($this->latitude * 10);
        $lng_mesh = floor($this->longitude * 10);

        return [
            new Channel('drivers.' . $lat_mesh . '.' . $lng_mesh),
            new PrivateChannel('driver.location.' . $this->driver->id),
        ];
    }

    public function broadcastAs()
    {
        return 'nearby.drivers';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'driver_id' => $this->driver->id,
            'driver_name' => $this->driver->user->name ?? 'Unknown Driver',
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'encoded_polyline' => $this->encodedPolyline,
            'vehicle' => $this->driver->vehicle ? [
                'plate_number' => $this->driver->vehicle->plate_number,
                'color' => $this->driver->vehicle->color,
                'model' => $this->driver->vehicle->model,
            ] : null,
        ];
    }
}
