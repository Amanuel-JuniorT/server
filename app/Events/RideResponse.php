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

class RideResponse implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $status;

    public $message;

    public $passenger_id;

    public $drivers_location;

    public $radius;

    /**
     * Create a new event instance.
     */
    public function __construct($passenger_id, string $status, string $message, $drivers_location, $radius)
    {
        $this->status = $status;
        $this->message = $message;
        $this->passenger_id = $passenger_id;
        $this->drivers_location = $drivers_location;
        $this->radius = $radius;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     *
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('passenger.' . $this->passenger_id);
    }

    public function broadcastAs()
    {
        return 'ride.response';
    }

    public function broadcastWith()
    {
        if ($this->drivers_location != null) {
            return [
                "status" => $this->status,
                "message" => $this->message,
                "driverLatitude" => $this->drivers_location['latitude'],
                "driverLongitude" => $this->drivers_location['longitude'],
            ];
        }

        if ($this->radius != null) {
            return [
                'status' => $this->status,
                'radius' => (string) $this->radius,
                'message' => $this->message,
            ];
        }

        return [
            "status" => $this->status,
            "message" => $this->message,
        ];
    }
}
